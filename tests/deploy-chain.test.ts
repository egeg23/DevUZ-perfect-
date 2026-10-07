import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { SHIFT_TITLE } from "@/lib/admin/shift-reports";

/**
 * Цепочка «GitHub → сервер» целиком состоит из мест, где поломка молчит.
 *
 * 19 сентября работа простояла в ветке сутки, сайт показывал позавчерашний
 * коммит, и со стороны это выглядело как «отвалился коннект с гитхаб».
 * Ни одна проверка на это не смотрела, потому что смотреть было не на что:
 * выкатка не запускалась вовсе.
 *
 * Пять проверок ниже сторожат ровно те места, где следующая такая поломка
 * снова была бы невидимой.
 */
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/**
 * Мёртвый доступ обязан падать, а не висеть.
 *
 * git, которому отказали, спрашивает логин; ssh — парольную фразу. В Action
 * на этот вопрос никто не ответит, и выкатка стоит до command_timeout: десять
 * минут вместо десяти секунд, и всё это время в логе ни строчки о причине.
 */
test("выкатка не садится ждать логин", () => {
  const deploy = read("scripts/vps-deploy.sh");

  const quiet = deploy.indexOf("GIT_TERMINAL_PROMPT=0");
  const batch = deploy.indexOf("BatchMode=yes");
  const fetch = deploy.indexOf("git fetch");

  assert.ok(quiet > 0, "git спросит логин у пустой оболочки и будет ждать его до таймаута");
  assert.ok(batch > 0, "ssh спросит парольную фразу ключа и будет ждать её до таймаута");
  assert.ok(quiet < fetch && batch < fetch, "запрет вопросов стоит после первой выкачки — то есть поздно");
});

/**
 * Запасной путь за кодом.
 *
 * Ключ, которым сервер ходит в GitHub, однажды кончается: его убирают из
 * репозитория, он истекает по сроку, меняется адрес. Репозиторий при этом
 * публичный — на чтение по HTTPS не нужно ни ключа, ни токена, и протухнуть
 * там нечему. Без этого пути отвалившийся ключ означает сайт, застывший на
 * старом коммите, и красный значок на странице, куда никто не заходит.
 */
test("у выкачки есть путь, который не кончается по сроку", () => {
  const deploy = read("scripts/vps-deploy.sh");

  const first = deploy.indexOf("git fetch --depth 1 origin");
  const fallback = deploy.indexOf("https://github.com/");

  assert.ok(first > 0, "выкатка не забирает код через origin");
  assert.ok(fallback > first, "запасного пути по HTTPS нет — мёртвый ключ остановит выкатку");
  assert.match(deploy, /FETCH_HEAD/, "запасная выкачка ни к чему не приводит: код не переносится в рабочее дерево");
});

/**
 * origin остаётся как был.
 *
 * Чинить выкачку подменой origin на HTTPS — значит молча отнять у сервера
 * право push, если оно там есть. Пропажу заметить будет некому: выкатка
 * позеленеет, а то, что с сервера пушит, перестанет работать без единой
 * строки в логе.
 */
test("выкатка не переписывает адрес origin", () => {
  const deploy = read("scripts/vps-deploy.sh");
  assert.doesNotMatch(deploy, /git remote set-url/, "выкатка меняет origin — право записи пропадёт молча");
});

/**
 * Обещание остановки на первой ошибке должно быть настоящим.
 *
 * Вход script_stop стоял в рабочем процессе и не делал ничего: действие v1
 * такого входа не знает и молча его игнорирует. Предупреждение об этом
 * лежало в каждом логе выкатки, и его никто не читал — потому что выкатка
 * была зелёной.
 */
test("остановка на ошибке задана тем, что её действительно даёт", () => {
  const workflow = read(".github/workflows/deploy-vps.yml");

  // Ищем именно вход, а не слово: про script_stop рядом написано пояснение,
  // и проверка на слово падала бы на нём, а не на настоящем возврате входа.
  assert.doesNotMatch(
    workflow,
    /^\s*script_stop:/m,
    "вход, который действие игнорирует, снова выдаёт себя за остановку",
  );
  assert.match(workflow, /set -euo pipefail/, "скрипт по SSH не останавливается на первой ошибке");
});

/**
 * Падение выкатки обязано дойти до человека.
 *
 * Красный Action видит тот, кто открыл вкладку Actions. Именно поэтому
 * поломка 19 сентября прожила сутки. Канал тревоги — тот же, которым
 * отчитываются ночные смены: строка в shift_reports, дальше свип доносит её
 * в Telegram за пять минут.
 */
test("упавшая выкатка будит владельца, а не ждёт, пока он зайдёт в Actions", () => {
  const workflow = read(".github/workflows/deploy-vps.yml");

  assert.match(workflow, /if: failure\(\)/, "у рабочего процесса нет задачи, срабатывающей на падении");
  assert.match(workflow, /api\/shift\/report/, "тревога никуда не отправляется");

  // Вид смены проверяется маршрутом по словарю: неизвестный он отвергает с
  // 400, и тревога не дошла бы ровно тогда, когда она нужна.
  assert.ok(SHIFT_TITLE.deploy, "маршрут отвергнет тревогу выкатки как неизвестную смену");

  // Без секрета шаг обязан промолчать, а не покрасить задачу: тревога,
  // которая сама падает, — это вторая поломка поверх первой.
  assert.match(workflow, /SHIFT_REPORT_SECRET не задан[\s\S]*?exit 0/, "без секрета шаг тревоги роняет задачу");
});

/**
 * Осмотр — место, где виден ответ на вопрос «что именно отвалилось».
 *
 * Его не было, и поэтому на вопрос владельца нельзя было ответить, не зайдя
 * на сервер руками.
 */
test("осмотр связи запускается кнопкой и не печатает секреты", () => {
  const doctor = read(".github/workflows/vps-doctor.yml");

  assert.match(doctor, /workflow_dispatch/, "осмотр нельзя запустить кнопкой");
  assert.doesNotMatch(doctor, /cat .*\.env|envval/, "осмотр печатает содержимое .env в открытый лог");
  assert.match(doctor, /ls-remote/, "осмотр не проверяет главное — доступ сервера к GitHub");

  // Скрипт осмотра — без подстановок ${{ }}: с ними GitHub считает его
  // одним выражением с потолком в 21 000 знаков, и 07.10.2026 осмотр
  // перестал запускаться. Каталог приходит переменной через envs.
  const script = doctor.slice(doctor.indexOf("script: |"));
  assert.doesNotMatch(script, /\$\{\{/, "в скрипте осмотра подстановка GitHub — он снова упрётся в потолок выражения");
  assert.match(doctor, /envs: VPS_APP_DIR_IN/);
});

test("на сервере одна выкатка за раз: замок до git fetch, переживает exec", () => {
  const script = readFileSync(new URL("../scripts/vps-deploy.sh", import.meta.url), "utf8");
  const lock = script.indexOf("exec 9>/tmp/devuz-deploy.lock");
  const wait = script.indexOf("flock -w 900 9");
  const fetch = script.indexOf('git fetch --depth 1 origin "$BRANCH"');
  const reexec = script.indexOf('exec bash "$APP_DIR/scripts/vps-deploy.sh"');
  assert.ok(lock > 0 && wait > lock, "нет замка на выкатку");
  assert.ok(wait < fetch, "замок берётся после того, как код уже забирают");
  assert.ok(reexec > fetch, "перезапуск свежей копии пропал");
});

/**
 * Сайт собирается в GitHub, а на сервер приезжает готовым.
 *
 * 07.10.2026 пять сборок Next.js подряд на боевом VPS уронили сайт, бот,
 * прототипы и свип напоминаний на несколько часов. Сборка на сервере
 * остаётся только запасным путём — и обязана остаться: без неё выкатка
 * руками и выкатка при лежащем реестре невозможны.
 */
test("образ собирается в Actions и публикуется только с main, не с pull request", () => {
  const workflow = read(".github/workflows/deploy-vps.yml");
  assert.match(workflow, /docker\/build-push-action/, "образ не собирается в GitHub — сборка снова на сервере");
  assert.match(workflow, /push: \$\{\{ github\.event_name != 'pull_request' \}\}/, "образ с чужого pull request уедет в реестр");
  assert.match(workflow, /packages: write/, "задаче сборки нечем записать образ в реестр");
  assert.match(workflow, /packages: read/, "серверу нечем забрать образ из реестра");
  assert.match(workflow, /DEPLOY_IMAGE: \$\{\{ env\.IMAGE \}\}:\$\{\{ github\.sha \}\}/, "сервер не знает, какой образ брать");
  assert.match(workflow, /envs: DEPLOY_TOKEN,DEPLOY_ACTOR,DEPLOY_IMAGE/);
  // Та же подпись открытых значений — в образе и в проверке на сервере.
  assert.match(workflow, /studio\.devuz\.public=/);
  assert.doesNotMatch(workflow, /^\s*- run: npm run build/m, "сборка идёт дважды: и на раннере, и в образе");
});

test("сервер берёт образ из реестра, сверяет его с .env и умеет собрать сам", () => {
  const deploy = read("scripts/vps-deploy.sh");
  const pull = deploy.indexOf('docker pull --quiet "$DEPLOY_IMAGE"');
  const check = deploy.indexOf('"studio.devuz.public"');
  const build = deploy.indexOf("docker build \\");
  assert.ok(pull > 0, "сервер не забирает образ из реестра");
  assert.ok(check > pull, "образ берётся без сверки открытых значений с .env");
  assert.ok(build > check, "запасной сборки на сервере не осталось");
  assert.match(deploy, /IMAGE_READY=0/);
  assert.match(deploy, /docker logout ghcr\.io/, "токен задачи остаётся в ~/.docker/config.json");
  assert.match(deploy, /uname -m\)" = "x86_64"/, "образ с другой архитектуры уедет на сервер");
});

test("новый образ не поднялся — выкатка сама возвращает прежний и остаётся красной", () => {
  const deploy = read("scripts/vps-deploy.sh");
  const keep = deploy.indexOf("docker tag devuz:latest devuz:previous");
  const up = deploy.indexOf("docker compose up -d --no-build --remove-orphans");
  const rollback = deploy.indexOf("docker tag devuz:previous devuz:latest");
  assert.ok(keep > 0 && keep < up, "прежний образ не сохраняется до перезапуска — откатываться будет не на что");
  assert.ok(rollback > up, "упавшая выкатка оставляет сайт лежать до человека");
  assert.match(deploy.slice(rollback), /exit 1/, "откат красит выкатку зелёной — тревога не уйдёт");
});

/**
 * Сторож: зависший контейнер перезапускается сам, а владелец узнаёт об
 * этом из Telegram, а не по тому, что бот перестал его узнавать.
 */
test("сторож ставится выкаткой, включён всегда и не трогает контейнер во время выкатки", () => {
  const deploy = read("scripts/vps-deploy.sh");
  assert.match(deploy, /install_unit devuz-watchdog\.service/);
  assert.match(deploy, /install_unit devuz-watchdog\.timer/);
  assert.match(deploy, /systemctl enable --now devuz-watchdog\.timer/);

  const timer = read("deploy/devuz-watchdog.timer");
  assert.match(timer, /OnUnitActiveSec=1min/, "сторож проверяет реже раза в минуту");

  const watchdog = read("deploy/watchdog.sh");
  assert.match(watchdog, /flock -n "\$LOCK" true/, "сторож перезапустит контейнер посреди выкатки");
  assert.match(watchdog, /LOCK=\/tmp\/devuz-deploy\.lock/, "сторож и выкатка смотрят на разные замки");
  assert.match(watchdog, /FAILS_BEFORE_RESTART=3/);
  assert.match(watchdog, /RESTART_COOLDOWN_S=600/, "сторож будет перезапускать контейнер каждую минуту");
  assert.match(watchdog, /api\.telegram\.org\/bot%s\/sendMessage/, "о перезапуске некому узнать");
  assert.match(watchdog, /docker compose restart web/);
  // Скрипт хотя бы разбирается оболочкой: синтаксическую ошибку в нём
  // иначе увидел бы только journal на сервере, и то когда сайт уже лежит.
  execFileSync("bash", ["-n", fileURLToPath(new URL("../deploy/watchdog.sh", import.meta.url))]);
  execFileSync("bash", ["-n", fileURLToPath(new URL("../scripts/vps-deploy.sh", import.meta.url))]);
});
