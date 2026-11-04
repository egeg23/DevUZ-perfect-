# Сайт клиента до макета: samist.autoline.uz

Снято: 2026-11-04T08:10:51.916Z (4 ноября 2026 г. в 13:10 по Ташкенту), `node scripts/protos/site-before.mjs samist https://samist.autoline.uz/`.
Правило — CLAUDE.md, «Сайт клиента — снимок до макета».

## Код

Их код открытым в репозиторий не кладём: он архивом под шифром — `docs/screens/samist/before/code-2026-11-04.enc` (AES-256-GCM, SHA-256
архива `f9718917b826ac30cd328aa382cdfd29471e374019df0fd5358186af9ad4d818`). Ключ — в хранилище секретов: `app.SITE_BEFORE_SAMIST_20261104`. Открыть:

```sh
KEY=<ключ из хранилища> node -e 'const c=require("crypto"),f=require("fs"),b=f.readFileSync("docs/screens/samist/before/code-2026-11-04.enc");
const d=c.createDecipheriv("aes-256-gcm",Buffer.from(process.env.KEY,"hex"),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));
f.writeFileSync("code.tar.xz",Buffer.concat([d.update(b.subarray(28)),d.final()]))' && tar -xJf code.tar.xz
```

## Снимки

- `docs/screens/samist/before/home-1440.webp`
- `docs/screens/samist/before/home-390.webp`

## Страницы и файлы

| Что | Адрес | Ответ | Размер | SHA-256 |
|---|---|---|---|---|
| страница | https://samist.autoline.uz/ | 200 | 53063 | `c19fef46696739cb34504f00680aea9f7382dc2d778af449e9468cc1dc6bb976` |
| файл | https://samist.autoline.uz/img/sites/userfiles/Samist/favicons/favicon.ico?1746546536 | 200 | 1150 | `f69e8c7b3f1b4631380da277b6e3cd05d8040ff65417db4b8d6cbff6ac396705` |
| стили | https://samist.autoline.uz/static/1791197017/modules.dist/ClientApps/ClientSites/Pages/Index/Index.clientSite.css | 200 | 11271 | `d774b52941bd12637c0a10588cdc8b2499f8580e6724458f07d09c667c9a4d7d` |
| стили | https://samist.autoline.uz/static/1775557209/modules.dist/ClientApps/ClientSites/Widgets/__salesList/__salesListWidget.clientSite.css | 200 | 1608 | `5cdb7f3ccb063a9a5edcdee91d57b60b17b04aa5301218af2344b03d6da8a548` |
| стили | https://samist.autoline.uz/static/1790774590/modules.dist/__sales/Widgets/__salePreviewWidgets/__saleShortWidget/__saleShort.clientSite.css | 200 | 17105 | `eb66a0b58dff5e2031f697199d1455517f8c9ac02faf203235d9f680e028de07` |
| стили | https://samist.autoline.uz/static/1777298827/modules.dist/ClientApps/ClientSites/Widgets/ContactsForm/ContactsForm.module.css | 200 | 3608 | `73d81a23d1a2da54b0aea1b131f5255c7e0c5a94e0c1f97a2da14fb09a399566` |
| стили | https://samist.autoline.uz/static/1789652869/modules.dist/Dealers/ContactCards/Site/ContactsList/ContactCardsWidget/ContactCardWidget.clientSite.css | 200 | 38042 | `7946dbb3708b5c76770ddea09e48b45644a491388ae00c6d03b50c36736fabd7` |
| стили | https://samist.autoline.uz/static/1775557209/modules.dist/Dealers/Site/Contacts/DealerContactsForm/PersonInfo/PersonInfo.clientSite.css | 200 | 2001 | `62cc5f12ab8795de1eee3a3f42883fcd5a1df5866d6a6144e7d3160ecf047b65` |
| стили | https://samist.autoline.uz/static/1775557209/modules.dist/Dealers/ContactCards/Phones/ExpandablePhoneNumber/ExpandablePhoneNumber.clientSite.css | 200 | 6469 | `3498a782273dd650f4eca039570cbb80ee67e18e6b255536c1f49f07bc223115` |
| стили | https://samist.autoline.uz/static/1790064501/modules.dist/Dealers/Addresses/Widget/DealerAddressesList.module.css | 200 | 1763 | `08490c6ae48bd06d7abf6fe87f08174b8f11c964c188bfad3178ea43fe535e94` |
| стили | https://samist.autoline.uz/static/1791197022/modules.dist/ClientApps/ClientSites/Pages/Contacts/CompanyLocationWidget/CompanyLocation.module.css | 200 | 464 | `ee20f6e2228f505e5ba86aa0842487474c35e2202ee8f2f740ce369abaf9ff85` |
| стили | https://samist.autoline.uz/static/1791197727/modules.dist/ClientApps/ClientSites/Layout/Assets/Styles/Layout.clientSite.css | 200 | 142297 | `7f59c24bc858426347b7af7682244b0e6e620754001990e02af965035b91c135` |
| стили | https://samist.autoline.uz/static/1775557209/modules.dist/ClientApps/ClientSites/Layout/Widgets/BurgerMenu/BurgerMenu.clientSite.css | 200 | 5888 | `5272b81e2a35bb0cc2b6cedce25d5617d047795fc722077cd6fa40b0d775aa49` |
| скрипт | https://samist.autoline.uz/static/1753274667/inlined/sentry/sentry-bundle.min.js | 200 | 62719 | `644ba483e2953c7e0e2d787d1704c5617f59dee68ea3b2601f25ada7dad88f8d` |
| скрипт | https://samist.autoline.uz/static/1753274667/vendor/jquery/jquery.min.js | 200 | 97163 | `668b046d12db350ccba6728890476b3efee53b2f42dbb84743e5e9f1ae0cc404` |
| скрипт | https://samist.autoline.uz/static/1753274667/vendor/jquery-ui/jquery-ui.min.js | 200 | 149494 | `c61fecf0d61f5cdf245f2532440735e51828e5c7ad9d4e4647aba18364836e5b` |
| скрипт | https://samist.autoline.uz/static/1793279618/js/dist/ForeignLibs.min.js | 200 | 60370 | `06938df74bc4ab4cedbfec2890aea45444ec204d3113513f4b9a3aaf600ea500` |
| скрипт | https://samist.autoline.uz/static/1753274667/js/dist/ClientSiteLibs.min.js | 200 | 29365 | `16628b21f762eecb2866fa5997aa3cacb968bd19dd1ffeedbe7ff3f0c9d15abc` |
| скрипт | https://samist.autoline.uz/static/1793358051/modules.dist/ClientApps/ClientSites/Layout/Assets/Script/ClientSiteLayout.module.ts.js | 200 | 50962 | `4900df7fb2783c2b72232be8af100e9a8a662633f1762a57bc14bad798a09c0e` |
| скрипт | https://samist.autoline.uz/static/1764763926/modules.dist/Framework/Frontend/Ui/LazyImageLoader/LazyImageLoader.module.ts.js | 200 | 2857 | `303ad5e1e151245b885aab3342103203e6d7070fdc97f98311584c720d1a49ec` |
| скрипт | https://samist.autoline.uz/static/1764763901/modules.dist/__sales/Widgets/__salePreviewWidgets/__saleShortWidget/__saleShort.module.ts.js | 200 | 1362 | `f1d9429d165b972e03d209e461d8ba18f5a74031ea91c643ee44bcaa93ffb039` |
| скрипт | https://samist.autoline.uz/static/1791368066/modules.dist/Dealers/ContactCards/Site/ContactsList/ContactCardsWidget/ContactCardWidget.module.ts.js | 200 | 8684 | `0b3569592d411a584c028c90a742d92a77b2c2f1430d7e34a765ce2d12c86e3e` |
| скрипт | https://samist.autoline.uz/static/1792492728/modules.dist/Dealers/ContactCards/Phones/ExpandablePhoneNumber/ExpandablePhoneNumber.module.ts.js | 200 | 39286 | `6a497b11b14ca0833d72c08f7f4513fc46b6fb93235a35c7d29fecc798a39b32` |
| скрипт | https://samist.autoline.uz/static/1753275873/modules.dist/Dealers/Addresses/Widget/DealerAddressesList.module.ts.js | 200 | 156 | `305f94d5d98a948bdbca57752ccd1916a9d0056515be66cf0ea9a0316fa991ac` |
| скрипт | https://samist.autoline.uz/static/1791197050/modules.dist/ClientApps/ClientSites/Pages/Contacts/CompanyLocationWidget/CompanyLocation.module.ts.js | 200 | 170 | `ddad480891d3457941f9d61f61f6a6350cc42d42653589a69f67fd9f5dcc2482` |
| скрипт | https://samist.autoline.uz/static/1753708335/modules.dist/ClientApps/ClientSites/Layout/Widgets/BurgerMenu/BurgerMenu.module.ts.js | 200 | 765 | `1e85721689077263b85a60c5b344b86a19774bf82fd5a6b165009636fef7603d` |
| скрипт | https://samist.autoline.uz/static/1753274665/vendor/slideout/slideout.min.js | 200 | 7314 | `b7ecc9fe0f3f29720932349541d9e26ede1d95a0f173dcd7afff6834f796a9d8` |
| картинка | https://samist.autoline.uz/img/flags/countries/fi/rectangle/svg/ru.svg | 200 | 892 | `415f8ef74d006599fb31809d584540238a1e76a49a866d38da1d47cb11a83215` |
| картинка | https://samist.autoline.uz/img/svg/layout/user-menu/person.svg | 200 | 683 | `6c787881110df22733a279f39ce8ac0998317f96f8477db84c66b80b3b13b493` |
| картинка | https://samist.autoline.uz/img/flags/countries/fi/rectangle/svg/uz.svg | 200 | 7127 | `572aaaae635a2eb551534f85dd90328b7a5f339b448fd83e743edd480bca5607` |
| картинка | https://samist.autoline.uz/img/flags/countries/fi/rectangle/svg/ua.svg | 200 | 626 | `1902d75a79b1b56743d5a4c5c6e44921a3c34845da66ba9ec0c4624e088e5b64` |
| картинка | https://samist.autoline.uz/img/flags/countries/fi/rectangle/svg/gb.svg | 200 | 1932 | `2b7a73cddd9fbd492a18424a39e958a5fd7b1324c000c03179f6698e40a165e0` |

Заголовки ответа главной:

- date: Wed, 04 Nov 2026 08:10:16 GMT
- server: nginx
- content-type: text/html;charset=UTF-8

## Подключено со стороны

- https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2

## Цвета (по частоте) и шрифты

`#ffffff` ×87, `#f5f5f5` ×22, `#000000` ×15, `#232526` ×14, `#eef0f2` ×14, `#474a4d` ×13, `#ff4b55` ×8, `#f27349` ×7, `#f5f6f7` ×7, `#f09700` ×6, `#eeeeee` ×5, `#292c2e` ×5, `#a5a9ad` ×5, `#f6f7fb` ×5, `#e4e5e6` ×4, `#007fbf` ×4

- sans-serif
- monospace,monospace
- Arial,Tahoma,Lucida Grande,Lucida Sans,sans-serif
