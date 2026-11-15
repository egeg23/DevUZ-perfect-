/* Файлы подтверждения прав на сайт: Яндекс Вебмастер и Search Console просят
   положить в корень сайта файл с кодом (yandex_<код>.html, google<код>.html).
   Код в файле не секрет: поисковик читает его открыто, как и любой посетитель.
   Новый файл — строкой сюда, ровно с тем текстом, что дал поисковик. Можно и
   иначе: код мета-тега в админке («Подключения») или TXT-запись в DNS. */
export const VERIFY_FILES = {
  /* Яндекс Вебмастер, 15.11.2026: siyaniye-severa.com. */
  "yandex_55ab75abb81d3b55.html": `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 55ab75abb81d3b55</body>
</html>
`,
};

/** Текст файла подтверждения по адресу или null. */
export function verifyFile(pathname) {
  const name = String(pathname || "").replace(/^\/+/, "");
  return Object.hasOwn(VERIFY_FILES, name) ? VERIFY_FILES[name] : null;
}
