# Неделя 1: первый образ DevUz OS грузится в виртуалке

Старт — 02.11.2026, слово владельца: «Ну погнали в новой сессии тогда —
неделя 1!». Общий план — [06-roadmap.md](06-roadmap.md), часть А.

План проверен второй моделью (Fable 5.1) 02.11.2026 и исправлен по её
замечаниям: ядро из backports, опции mkosi, ключи Debian на раннере,
набор инструментов (tools tree), ярлыки и версия под sysupdate, тест без
профилей, проверяемые критерии.

## Цель недели

Образ системы на Debian 13 собирается в GitHub Actions на каждый пуш и
грузится в QEMU до готовности. Проверку делает тест в Actions, а не
человек. Имена, ярлыки, версия и `/usr` на erofs с первого дня такие, какие
нужны обновлениям A/B (неделя 2).

**Честно о том, что временно**: на неделе 1 в образе есть root-раздел с
`/etc` и `/var`. В целевой схеме (неделя 2) образ — только ESP и `/usr`,
root с шифрованием создаётся при первой загрузке, а `/etc` собирается из
`/usr/share/factory`. Для Debian это непросто (`/etc/alternatives`,
`pam.d`, `passwd`), поэтому на этой неделе — полдня разведки (задача 9).

Не в этой неделе: dm-verity с подписью, обновления A/B, Secure Boot, TPM
(недели 2–3), приложения и модели (недели 4–6).

## Где

- Репозиторий `egeg23/devuz-os`, **открытый** (README, «Решения
  владельца»). Создаёт владелец (у сессий нет права создавать
  репозитории): пустой, Actions включены, «Workflow permissions: read»,
  хранение артефактов — 7 дней. Потом сессия подключает его к себе
  (`add_repo` с правом пуша).
- Ключей там нет никогда: ни боевых, ни тестовых закрытых.
- Свой `CLAUDE.md`: русский в документах, PR и слияние squash, как только
  сборка зелёная, без цен поставщиков, ключей и данных клиентов; каждая
  опция mkosi — по man **своей** версии mkosi, не по конфигам ParticleOS
  (у них mkosi с ветки main и свежий systemd).
- Лицензия: **LGPL-2.1-or-later** на рецепты — как у mkosi и ParticleOS,
  у которых будем брать куски конфигов (с Apache-2.0 пришлось бы держать
  их файлы под своей лицензией отдельно).

## Решение о ядре (проверено 02.11.2026)

В `trixie-backports` сейчас `linux-image-amd64 7.2.11-1~bpo13+1`: в
backports живёт только одна, последняя версия, старые удаляются. Ядра
6.18 там больше нет, закрепить его в backports нельзя.

- **Недели 1–4**: берём ядро из backports, какое есть (7.2.x), тест
  требует не ниже 6.18.4 (порог для Strix Halo), точная версия — в отчёт.
  Использованные `.deb` ядра кладём в GitHub Release репозитория и
  подключаем через `PackageDirectories=`, чтобы сборка одного коммита не
  менялась, когда backports уедут дальше.
- **До недели 5** (расширение NVIDIA собирается под конкретное ядро)
  решаем: идти за backports (ядро меняется само, модули NVIDIA
  пересобираются конвейером) или собирать своё ядро из исходников Debian
  на долгой ветке (отдельная работа на 1–2 недели). Пункт — в «Решить к
  неделе 5».

## Задачи

| № | Что | Готово, когда |
|---|---|---|
| 1 | Каркас: `README.md` (что это, как собрать, как запустить в QEMU), `CLAUDE.md`, `LICENSE` (LGPL-2.1+), `.gitignore`: `mkosi.key`, `mkosi.crt`, `*.key`, `mkosi.output/`, `mkosi.cache/`, `mkosi.builddir/`, `mkosi.local.conf`, `mkosi.rootpw`, `*.raw`, `*.efi` | файлы в main |
| 2 | mkosi **v27.1** (последний выпуск): в Actions — действие `systemd/mkosi@v27.1` (само даёт права на `/dev/kvm`, снимает запрет AppArmor на непривилегированные userns, ставит ключи Debian), локально — `pipx install git+https://github.com/systemd/mkosi.git@v27.1`. Тег записан в одном месте (README + workflow) | одна версия в README и в Actions |
| 3 | Рецепт `mkosi.conf`: `[Distribution] Distribution=debian`, `Release=trixie`, `Repositories=main,non-free-firmware`; `[Build] ToolsTree=default`, `ToolsTreeRelease=trixie`, `CacheDirectory=mkosi.cache`, `Incremental=yes`; `[Content] Bootable=yes`, `UnifiedKernelImages=unsigned`, `KernelInitrdModules=default`, пакеты: `systemd systemd-boot systemd-boot-efi udev kmod dbus-broker systemd-resolved systemd-repart systemd-container util-linux iproute2 ca-certificates debian-archive-keyring` + ядро (`systemd-sysv` — если без него ядро не находит init, проверить); `systemd-networkd` с DHCP | сборка зелёная в Actions |
| 4 | Backports только для ядра: `mkosi.sandbox/etc/apt/sources.list.d/trixie-backports.sources` (deb822, `Suites: trixie-backports`, `Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg`) и `mkosi.sandbox/etc/apt/preferences.d/kernel` (`Package: linux-image-* linux-base*`, `Pin: release n=trixie-backports`, `Pin-Priority: 900`). Перед mkosi — свежий `debian-archive-keyring` (2025.x, в Ubuntu 24.04 он старый, без ключей trixie); проверить, что файл `.gpg` на месте (в 2025.1 переименованы в `.pgp`) | `apt` в сборке без NO_PUBKEY; в образе ядро из backports |
| 5 | Версия и имя: `[Output] ImageId=devuz`, `ImageVersion=ГГГГ.ММ.ДД.<номер прогона Actions>` (сортируется строкой — так sysupdate выберет новейшую), `Output=%i_%v`, `SplitArtifacts=uki,partitions`, `ManifestFormat=json,changelog`; `os-release`: `NAME="DevUz OS"`, `ID=devuz`, `ID_LIKE=debian`, `PRETTY_NAME`, `BUILD_ID=<хеш коммита>`, `DEFAULT_HOSTNAME=devuz`; UKI — `UnifiedKernelImageFormat=%i_%v`. Помнить: из-за `ID=devuz` расширения `systemd-sysext` (NVIDIA) объявляют `ID=devuz` | selftest печатает `IMAGE_ID`, `IMAGE_VERSION`, `BUILD_ID`, тест сверяет формат версии |
| 6 | Разметка (`mkosi.repart/`), типы по Discoverable Partitions: `esp` 1 ГБ; `usr` — **erofs с первого дня**, ярлык `%M_%A` (имя_версия); пустой второй слот `usr` того же размера (`SizeMinBytes=SizeMaxBytes`, без `Format=` и `CopyFiles=`, ярлык вне маски, чтобы его не монтировали); `root` (временный, см. «Цель»). Verity на неделе 2 — два файла repart рядом (`usr-verity`, `usr-verity-sig`), `usr` не трогаем | тест: `sfdisk --json` по образу, GUID типов и ярлыки совпадают с ожидаемыми; `sudo systemd-dissect --json=short` — второй шаг |
| 7 | Готовность: `devuz-ready.service` с `Before=boot-complete.target`, `WantedBy=boot-complete.target`, `StandardOutput=journal+console`, печатает `DEVUZ-READY <IMAGE_VERSION> <BUILD_ID>`. На неделе 2 к нему только добавится `systemd-bless-boot`. Экран «Состояние» — без службы: файл `/usr/lib/issue.d/10-devuz.issue` для agetty (`\S{PRETTY_NAME} \S{IMAGE_VERSION}`, `\4` — адрес, строка `http://devuz.local`; mDNS в QEMU не проверяем) | строка `DEVUZ-READY` в журнале теста |
| 8 | Самопроверка: `devuz-selftest.service` запускается только по `systemd.wants=devuz-selftest.service` (из `KernelCommandLineExtra=` при тесте), печатает `uname -r`, `systemctl --version`, `os-release`, включённые юниты (`systemctl list-unit-files --state=enabled`), пишет `DEVUZ-SELFTEST OK` и выключает машину. **Один образ**: тестируем ровно то, что выкладываем, без профилей prod/dev; удобства для виртуалки — через учётные данные при запуске `mkosi vm` | в журнале `DEVUZ-SELFTEST OK` и список юнитов |
| 9 | Разведка на полдня: собрать тот же образ без root-раздела (только ESP + usr) и записать, что из `/etc` Debian нужно для загрузки (`alternatives`, `pam.d`, `nsswitch.conf`, `passwd`/`group`, …) — вход для недели 2 | список в отчёте недели |
| 10 | GitHub Actions `build.yml` на `ubuntu-24.04`: свежий keyring → `mkosi build` → **тест до сжатия** (`timeout 900 mkosi vm --console=read-only …` с `Ephemeral=yes`: машина не пишет machine-id и журнал в сам образ) → сжатие → артефакты: образ, UKI, разделы, манифест. Кэш Actions — только `mkosi.cache` (лимит 10 ГБ). Если не хватает места на `/` — рабочие каталоги на `/mnt` | зелёная галочка на PR и main |
| 11 | Тест: ждёт `DEVUZ-READY` и `DEVUZ-SELFTEST OK`; падает по таймауту и при `emergency`, `Failed to start`; версии сравнивает `systemd-analyze compare-versions` (ядро ≥ 6.18.4, systemd ≥ 257); проверяет `IMAGE_ID=devuz` и формат версии; время до готовности — в `$GITHUB_STEP_SUMMARY`. На PR — разница манифеста пакетов с последней сборкой main (заготовка заметок к выпуску). `SourceDateEpoch=` из времени коммита и постоянный `Seed=` — задел на повторяемость, без обещания «байт в байт» | тест зелёный; отдельно проверено, что сломанный образ (без ядра) даёт красный |
| 12 | Отчёт недели: `docs/week-01.md` в `devuz-os` — что сделано, версия ядра и systemd, размеры образа и разделов, время загрузки, сколько прогонов ушло, итог разведки (9), что не вышло | файл в main |

Ядро недели — задачи 1–8, 10–12. Если не успеваем, переносится 9 и
разница манифеста из 11.

## Проверка в конце недели (для владельца)

1. Actions в `devuz-os`: последняя сборка main зелёная.
2. В итоге задачи — время загрузки, `DEVUZ-READY 2026.11.xx.N <хеш>`,
   версии ядра и systemd.
3. Скачать артефакт и запустить у себя в QEMU по инструкции README —
   экран входа с надписью DevUz OS и версией. VirtualBox — «если
   получится» (образ надо перевести `VBoxManage convertfromraw` и включить
   EFI).

## Риски недели

| Риск | Что делаем |
|---|---|
| Первые 1–2 дня «не собирается» (ключи, AppArmor, кэш) | закладываем 20–30 прогонов по 10–15 минут; действие mkosi снимает часть проблем |
| Конфиги ParticleOS рассчитаны на mkosi main и systemd новее 257 | каждую опцию сверяем с man v27.1; чего нет — записываем, не тянем main |
| Ядро в backports сменится посреди недели | `.deb` в Release, `PackageDirectories=`; тест порога, не точной версии |
| На неделе 3 при Secure Boot `KernelCommandLineExtra=` через SMBIOS игнорируется — самопроверка перестанет запускаться | заранее: на неделе 3 самопроверка поедет через отдельный тестовый UKI-профиль или учётные данные; записать в план недели 3 |
| Нет места на раннере (tools tree + кэш + образ ≈ 6–8 ГБ) | рабочие каталоги на `/mnt` |
| Сборка в контейнере сессии не идёт | собирать и проверять в Actions; в сессии — правка рецептов |

## Решить к неделе 2 и 5

- **Неделя 2**: переход на образ «только ESP + usr», root создаётся при
  первой загрузке, `/etc` из factory — по итогам разведки (задача 9).
  `systemd-sysupdate` в trixie — в пакете `systemd-container`.
- **Неделя 3**: в поле — без getty и SSH; самопроверка под Secure Boot.
- **Неделя 5**: своё ядро на долгой ветке или идём за backports (см.
  «Решение о ядре»).

## Бюджет

- Открытый репозиторий — минуты Actions бесплатны.
- Firecrawl не нужен.
- Работает Opus, план проверен Fable.
