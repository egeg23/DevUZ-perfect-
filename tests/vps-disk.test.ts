/**
 * «Место на сервере» — осмотр и безопасная уборка диска по кнопке.
 *
 * 13.10.2026 выкатка упала с «No space left on device». На сервере живут
 * ещё полтора десятка сайтов: уборка не должна трогать чужое и образ
 * devuz:previous, на который откатывается выкатка.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const flow = readFileSync(new URL("../.github/workflows/vps-disk.yml", import.meta.url), "utf8");
const script = flow.slice(flow.indexOf("script: |"));

test("по умолчанию только смотрит", () => {
  assert.match(flow, /clean:\s*\n\s*description: "Убрать безопасное \(иначе — только посмотреть\)"\s*\n\s*type: boolean\s*\n\s*default: false/);
  assert.ok(script.indexOf('if [ "$CLEAN" != "true" ]; then') < script.indexOf("docker builder prune"), "уборка раньше проверки «только посмотреть»");
});

test("не трогает образы с именем, тома и чужие сайты", () => {
  // image prune -a и system prune -a снесли бы devuz:previous и образы соседей.
  assert.doesNotMatch(script, /image prune\s+-a|image prune -af|system prune/);
  assert.doesNotMatch(script, /volume prune|container prune/);
  assert.match(script, /docker image prune -f/);
  // rmi — только старые образы devuz из реестра, кроме latest и previous.
  assert.match(script, /KEEP="\$\(\$SUDO docker image inspect --format '\{\{\.Id\}\}' devuz:latest devuz:previous/);
  assert.match(script, /for ref in \$\(\$SUDO docker images --format '\{\{\.Repository\}\}:\{\{\.Tag\}\}' ghcr\.io\/egeg23\/devuz/);
  assert.match(script, /grep -qxF "\$full" && continue/);
  assert.equal((script.match(/docker rmi /g) ?? []).length, 1);
  // Удаляется только кэш Next в каталоге devuz, не каталог целиком.
  const removals = script.match(/rm -rf [^\n]+/g) ?? [];
  assert.deepEqual(removals, ['rm -rf "$APP_DIR/.next/cache" && echo "  кэш Next: убран"']);
});

test("выкатка сама убирает старые образы devuz, оставляя текущий и previous", () => {
  const deploy = readFileSync(new URL("../scripts/vps-deploy.sh", import.meta.url), "utf8");
  const fn = deploy.slice(deploy.indexOf("drop_old_images() {"), deploy.indexOf("\n}\n", deploy.indexOf("drop_old_images() {")));
  assert.match(fn, /docker image inspect --format '\{\{\.Id\}\}' devuz:latest devuz:previous/);
  assert.match(fn, /grep -qxF "\$full" \|\| docker rmi "\$ref"/);
  // Только после того, как новый образ ответил, — перед exit 0 удачной выкатки.
  assert.match(deploy, /drop_old_images\n\s*docker image prune -f >\/dev\/null 2>&1 \|\| true\n\s*exit 0/);
});
