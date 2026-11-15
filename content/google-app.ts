import type { LegalDoc } from "@/content/legal";
import type { Locale } from "@/lib/i18n";

/**
 * Страница о приложении «DevUz Studio», которое ходит в Google Ads и
 * Google Analytics (`/{язык}/google-app`).
 *
 * Владелец, 15.11.2026: Google не пропустил проверку бренда OAuth —
 * «главная не объясняет назначение приложения», «имя приложения не
 * совпадает с главной», «не соответствует условиям Google APIs». Эту
 * страницу указывают в Google Cloud как Home page приложения: на ней имя
 * ровно как на экране согласия (`company.name`), что приложение делает,
 * какие права Google просит и чего не делает. Меняется поведение панели с
 * Google — меняется и эта страница, и раздел «Данные из аккаунтов Google» в
 * политике (`content/legal.ts`).
 *
 * Разделы одинаковые на всех языках: это держит тест.
 */

const en: LegalDoc = {
  title: "DevUz Studio: Google Ads and Google Analytics connection",
  updated: "Updated 15 November 2026",
  intro:
    "DevUz Studio is a web development studio in Tashkent, Uzbekistan. This page describes the DevUz Studio application: the part of our studio's internal admin panel that connects to Google Ads and Google Analytics. It explains what the application does, which Google data it reads and what it never does.",
  sections: [
    {
      heading: "What the DevUz Studio application is",
      body: [
        "The DevUz Studio application is an internal tool of our studio. Only DevUz Studio staff use it, inside the studio's admin panel. It is not offered to the public and it does not sign in visitors of our website.",
        "Its purpose is to help the studio plan the pages and articles of its own website and to see the results of its own advertising, using data from Google instead of guesses.",
      ],
    },
    {
      heading: "What it does with Google",
      body: [
        "Google Ads Keyword Planner: for a search phrase (for example, \"website development Tashkent\") the application reads keyword ideas and average monthly searches by country. Staff use these numbers to choose the topics and headings of the studio's website pages and articles.",
        "Google Ads: the application reads reports of the studio's own Google Ads accounts (campaigns, spend, impressions, clicks) and shows them in the admin panel. A change to a campaign is made only when a staff member presses a button in the panel.",
        "Google Analytics: the application reads, in read-only mode, traffic reports of the studio's own website (visits, pages, sources) and shows them in the admin panel.",
      ],
    },
    {
      heading: "Google permissions it asks for",
      body: [
        "https://www.googleapis.com/auth/adwords: to read Keyword Planner data and the reports of the studio's own Google Ads accounts. https://www.googleapis.com/auth/analytics.readonly: to read the studio's own Google Analytics reports.",
        "Access is granted by a studio owner or manager signing in with the studio's Google account. The application asks only for these two permissions and does not ask for access to Gmail, Google Drive, contacts or any other Google service.",
      ],
    },
    {
      heading: "What it never does",
      body: [
        "The application does not create, edit or generate images, videos or any other media with Google APIs, and it is never used to make intimate or sexual imagery of anyone, real or generated.",
        "It does not sell Google data, does not pass it to advertising networks or data brokers, does not use it to build profiles of people and does not use it to train AI models.",
      ],
    },
    {
      heading: "Data and privacy",
      body: [
        "The access token received from Google is kept encrypted in the studio's secure storage. Reports are shown to studio staff only. DevUz Studio's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
        "Access can be withdrawn at any time at myaccount.google.com/permissions or with the disconnect button in the admin panel; the stored token is deleted within 30 days. Details are in the studio's Privacy Policy at devuz.studio/en/privacy, and the terms of service are at devuz.studio/en/offer.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Questions about the DevUz Studio application and Google data: write to the studio in Telegram, the contact is shown above on this page.",
      ],
    },
  ],
};

const ru: LegalDoc = {
  title: "DevUz Studio: подключение Google Ads и Google Analytics",
  updated: "Обновлено 15 ноября 2026",
  intro:
    "DevUz Studio — студия веб-разработки в Ташкенте, Узбекистан. Здесь описано приложение DevUz Studio: часть внутренней панели студии, которая подключается к Google Ads и Google Analytics. Что оно делает, какие данные Google читает и чего не делает никогда.",
  sections: [
    {
      heading: "Что такое приложение DevUz Studio",
      body: [
        "Приложение DevUz Studio — внутренний инструмент студии. Им пользуются только сотрудники DevUz Studio, внутри панели студии. Посетителям сайта оно не предлагается, и посетители через него не входят.",
        "Его задача — помочь студии выбирать страницы и статьи своего сайта и видеть результаты своей рекламы по данным Google, а не на глаз.",
      ],
    },
    {
      heading: "Что оно делает с Google",
      body: [
        "Планировщик ключевых слов Google Ads: по фразе (например, «разработка сайтов Ташкент») приложение получает похожие запросы и среднее число поисков в месяц по стране. По этим числам сотрудники выбирают темы и заголовки страниц и статей сайта студии.",
        "Google Ads: приложение читает отчёты собственных кабинетов Google Ads студии (кампании, расход, показы, клики) и показывает их в панели. Кампания меняется только после того, как сотрудник нажмёт кнопку в панели.",
        "Google Analytics: приложение только читает отчёты о посещаемости собственного сайта студии (визиты, страницы, источники) и показывает их в панели.",
      ],
    },
    {
      heading: "Какие права Google оно просит",
      body: [
        "https://www.googleapis.com/auth/adwords — чтобы читать данные планировщика ключевых слов и отчёты собственных кабинетов Google Ads студии. https://www.googleapis.com/auth/analytics.readonly — чтобы читать отчёты Google Analytics сайта студии.",
        "Доступ даёт владелец или руководитель студии, входя аккаунтом Google студии. Приложение просит только эти два права и не просит доступа к Gmail, Google Диску, контактам и другим сервисам Google.",
      ],
    },
    {
      heading: "Чего оно не делает никогда",
      body: [
        "Приложение не создаёт, не меняет и не генерирует через Google APIs картинки, видео и другие медиафайлы и никогда не используется для интимных или сексуальных изображений кого-либо, настоящих или сгенерированных.",
        "Оно не продаёт данные Google, не передаёт их рекламным сетям и торговцам данными, не строит по ним профили людей и не обучает на них модели ИИ.",
      ],
    },
    {
      heading: "Данные и конфиденциальность",
      body: [
        "Ключ доступа от Google хранится зашифрованным в защищённом хранилище студии. Отчёты видят только сотрудники студии. Использование и передача информации, полученной через API Google, соответствуют Политике Google в отношении пользовательских данных API (Google API Services User Data Policy), включая требования об ограниченном использовании (Limited Use).",
        "Отозвать доступ можно в любой момент на myaccount.google.com/permissions или кнопкой отключения в панели; сохранённый ключ удаляется в течение 30 дней. Подробнее — в Политике конфиденциальности студии (devuz.studio/ru/privacy), условия — в оферте (devuz.studio/ru/offer).",
      ],
    },
    {
      heading: "Связь",
      body: [
        "Вопросы о приложении DevUz Studio и данных Google — пишите студии в Telegram, контакт указан выше на этой странице.",
      ],
    },
  ],
};

const uz: LegalDoc = {
  title: "DevUz Studio: Google Ads va Google Analytics ulanishi",
  updated: "Yangilangan: 2026-yil 15-noyabr",
  intro:
    "DevUz Studio — Toshkentdagi (O‘zbekiston) veb-ishlab chiqish studiyasi. Bu sahifada DevUz Studio ilovasi tasvirlangan: studiya ichki panelining Google Ads va Google Analytics bilan ulanadigan qismi. U nima qiladi, Google’ning qaysi ma’lumotlarini o‘qiydi va nimani hech qachon qilmaydi.",
  sections: [
    {
      heading: "DevUz Studio ilovasi nima",
      body: [
        "DevUz Studio ilovasi — studiyaning ichki vositasi. Undan faqat DevUz Studio xodimlari, studiya paneli ichida foydalanadi. U sayt tashrifchilariga taklif qilinmaydi va tashrifchilar u orqali kirmaydi.",
        "Uning vazifasi — studiyaga o‘z saytining sahifa va maqolalarini tanlashda hamda o‘z reklamasining natijalarini taxmin bilan emas, Google ma’lumotlari bilan ko‘rishda yordam berish.",
      ],
    },
    {
      heading: "Google bilan nima qiladi",
      body: [
        "Google Ads kalit so‘zlar rejalashtiruvchisi: ibora bo‘yicha (masalan, «Toshkentda sayt yaratish») ilova o‘xshash so‘rovlar va mamlakat bo‘yicha oyiga o‘rtacha qidiruvlar sonini oladi. Xodimlar shu raqamlar asosida studiya sayti sahifa va maqolalarining mavzu va sarlavhalarini tanlaydi.",
        "Google Ads: ilova studiyaning o‘z Google Ads kabinetlari hisobotlarini (kampaniyalar, xarajat, ko‘rsatishlar, bosishlar) o‘qiydi va panelda ko‘rsatadi. Kampaniya faqat xodim paneldagi tugmani bosgandan keyin o‘zgaradi.",
        "Google Analytics: ilova studiyaning o‘z sayti tashriflari hisobotlarini (tashriflar, sahifalar, manbalar) faqat o‘qiydi va panelda ko‘rsatadi.",
      ],
    },
    {
      heading: "Google’dan qanday ruxsatlar so‘raydi",
      body: [
        "https://www.googleapis.com/auth/adwords — kalit so‘zlar rejalashtiruvchisi ma’lumotlarini va studiyaning o‘z Google Ads kabinetlari hisobotlarini o‘qish uchun. https://www.googleapis.com/auth/analytics.readonly — studiya sayti Google Analytics hisobotlarini o‘qish uchun.",
        "Ruxsatni studiya egasi yoki rahbari studiyaning Google akkaunti bilan kirib beradi. Ilova faqat shu ikki ruxsatni so‘raydi, Gmail, Google Disk, kontaktlar va boshqa Google xizmatlariga kirish so‘ramaydi.",
      ],
    },
    {
      heading: "Hech qachon nima qilmaydi",
      body: [
        "Ilova Google API orqali rasm, video va boshqa media yaratmaydi, o‘zgartirmaydi va generatsiya qilmaydi, hech kimning intim yoki jinsiy tasvirlari uchun, haqiqiy yoki generatsiya qilingan, hech qachon ishlatilmaydi.",
        "U Google ma’lumotlarini sotmaydi, reklama tarmoqlari va ma’lumot sotuvchilarga bermaydi, ular asosida odamlar profilini tuzmaydi va ularda AI modellarini o‘qitmaydi.",
      ],
    },
    {
      heading: "Ma’lumotlar va maxfiylik",
      body: [
        "Google’dan olingan kirish kaliti studiyaning himoyalangan omborida shifrlangan holda saqlanadi. Hisobotlarni faqat studiya xodimlari ko‘radi. DevUz Studio’ning Google API orqali olingan ma’lumotlardan foydalanishi va ularni uzatishi Google API Services User Data Policy, jumladan Limited Use (cheklangan foydalanish) talablariga mos keladi.",
        "Ruxsatni istalgan vaqtda myaccount.google.com/permissions sahifasida yoki paneldagi uzish tugmasi bilan qaytarib olish mumkin; saqlangan kalit 30 kun ichida o‘chiriladi. Batafsil — studiyaning Maxfiylik siyosatida (devuz.studio/uz/privacy), shartlar — ofertada (devuz.studio/uz/offer).",
      ],
    },
    {
      heading: "Aloqa",
      body: [
        "DevUz Studio ilovasi va Google ma’lumotlari bo‘yicha savollar — studiyaga Telegram’da yozing, kontakt shu sahifada yuqorida ko‘rsatilgan.",
      ],
    },
  ],
};

const uk: LegalDoc = {
  title: "DevUz Studio: підключення Google Ads і Google Analytics",
  updated: "Оновлено 15 листопада 2026",
  intro:
    "DevUz Studio — студія веб-розробки в Ташкенті, Узбекистан. Тут описано застосунок DevUz Studio: частину внутрішньої панелі студії, яка підключається до Google Ads і Google Analytics. Що він робить, які дані Google читає і чого не робить ніколи.",
  sections: [
    {
      heading: "Що таке застосунок DevUz Studio",
      body: [
        "Застосунок DevUz Studio — внутрішній інструмент студії. Ним користуються лише співробітники DevUz Studio, всередині панелі студії. Відвідувачам сайту він не пропонується, і відвідувачі через нього не входять.",
        "Його завдання — допомогти студії обирати сторінки й статті свого сайту та бачити результати своєї реклами за даними Google, а не на око.",
      ],
    },
    {
      heading: "Що він робить із Google",
      body: [
        "Планувальник ключових слів Google Ads: за фразою (наприклад, «розробка сайтів Ташкент») застосунок отримує схожі запити й середню кількість пошуків на місяць за країною. За цими числами співробітники обирають теми й заголовки сторінок і статей сайту студії.",
        "Google Ads: застосунок читає звіти власних кабінетів Google Ads студії (кампанії, витрати, покази, кліки) і показує їх у панелі. Кампанія змінюється лише після того, як співробітник натисне кнопку в панелі.",
        "Google Analytics: застосунок лише читає звіти про відвідуваність власного сайту студії (візити, сторінки, джерела) і показує їх у панелі.",
      ],
    },
    {
      heading: "Які дозволи Google він просить",
      body: [
        "https://www.googleapis.com/auth/adwords — щоб читати дані планувальника ключових слів і звіти власних кабінетів Google Ads студії. https://www.googleapis.com/auth/analytics.readonly — щоб читати звіти Google Analytics сайту студії.",
        "Доступ надає власник або керівник студії, входячи акаунтом Google студії. Застосунок просить лише ці два дозволи й не просить доступу до Gmail, Google Диска, контактів та інших сервісів Google.",
      ],
    },
    {
      heading: "Чого він не робить ніколи",
      body: [
        "Застосунок не створює, не змінює й не генерує через Google API зображення, відео та інші медіафайли і ніколи не використовується для інтимних чи сексуальних зображень будь-кого, справжніх чи згенерованих.",
        "Він не продає дані Google, не передає їх рекламним мережам і торговцям даними, не будує за ними профілі людей і не навчає на них моделі ШІ.",
      ],
    },
    {
      heading: "Дані та конфіденційність",
      body: [
        "Ключ доступу від Google зберігається зашифрованим у захищеному сховищі студії. Звіти бачать лише співробітники студії. Використання й передача інформації, отриманої через API Google, відповідають Google API Services User Data Policy, включно з вимогами Limited Use (обмежене використання).",
        "Відкликати доступ можна будь-коли на myaccount.google.com/permissions або кнопкою відключення в панелі; збережений ключ видаляється протягом 30 днів. Докладніше — у Політиці конфіденційності студії (devuz.studio/uk/privacy), умови — в оферті (devuz.studio/uk/offer).",
      ],
    },
    {
      heading: "Зв'язок",
      body: [
        "Питання про застосунок DevUz Studio і дані Google — пишіть студії в Telegram, контакт указано вище на цій сторінці.",
      ],
    },
  ],
};

const pl: LegalDoc = {
  title: "DevUz Studio: połączenie z Google Ads i Google Analytics",
  updated: "Aktualizacja: 15 listopada 2026",
  intro:
    "DevUz Studio to studio tworzenia stron internetowych w Taszkencie, Uzbekistan. Ta strona opisuje aplikację DevUz Studio: część wewnętrznego panelu studia, która łączy się z Google Ads i Google Analytics. Co robi, jakie dane Google odczytuje i czego nigdy nie robi.",
  sections: [
    {
      heading: "Czym jest aplikacja DevUz Studio",
      body: [
        "Aplikacja DevUz Studio to wewnętrzne narzędzie studia. Korzystają z niej wyłącznie pracownicy DevUz Studio, w panelu studia. Nie jest oferowana odwiedzającym stronę i odwiedzający nie logują się przez nią.",
        "Jej zadaniem jest pomóc studiu wybierać strony i artykuły własnej witryny oraz widzieć wyniki własnej reklamy na podstawie danych Google, a nie na oko.",
      ],
    },
    {
      heading: "Co robi z Google",
      body: [
        "Planer słów kluczowych Google Ads: dla frazy (np. „tworzenie stron Taszkent”) aplikacja pobiera podobne zapytania i średnią miesięczną liczbę wyszukiwań w danym kraju. Na ich podstawie pracownicy wybierają tematy i nagłówki stron i artykułów witryny studia.",
        "Google Ads: aplikacja odczytuje raporty własnych kont Google Ads studia (kampanie, wydatki, wyświetlenia, kliknięcia) i pokazuje je w panelu. Kampania zmienia się tylko wtedy, gdy pracownik naciśnie przycisk w panelu.",
        "Google Analytics: aplikacja tylko odczytuje raporty ruchu na własnej stronie studia (wizyty, strony, źródła) i pokazuje je w panelu.",
      ],
    },
    {
      heading: "O jakie uprawnienia Google prosi",
      body: [
        "https://www.googleapis.com/auth/adwords — aby odczytywać dane planera słów kluczowych i raporty własnych kont Google Ads studia. https://www.googleapis.com/auth/analytics.readonly — aby odczytywać raporty Google Analytics strony studia.",
        "Dostępu udziela właściciel lub kierownik studia, logując się kontem Google studia. Aplikacja prosi tylko o te dwa uprawnienia i nie prosi o dostęp do Gmaila, Dysku Google, kontaktów ani innych usług Google.",
      ],
    },
    {
      heading: "Czego nigdy nie robi",
      body: [
        "Aplikacja nie tworzy, nie edytuje i nie generuje przez Google API obrazów, filmów ani innych mediów i nigdy nie jest używana do intymnych lub seksualnych wizerunków kogokolwiek, prawdziwych czy wygenerowanych.",
        "Nie sprzedaje danych Google, nie przekazuje ich sieciom reklamowym ani brokerom danych, nie buduje na ich podstawie profili osób i nie trenuje na nich modeli AI.",
      ],
    },
    {
      heading: "Dane i prywatność",
      body: [
        "Klucz dostępu od Google jest przechowywany w postaci zaszyfrowanej w bezpiecznym magazynie studia. Raporty widzą tylko pracownicy studia. Wykorzystywanie i przekazywanie przez DevUz Studio informacji otrzymanych z interfejsów API Google jest zgodne z Google API Services User Data Policy, w tym z wymogami Limited Use (ograniczonego użycia).",
        "Dostęp można cofnąć w każdej chwili na myaccount.google.com/permissions lub przyciskiem odłączenia w panelu; zapisany klucz jest usuwany w ciągu 30 dni. Szczegóły — w Polityce prywatności studia (devuz.studio/pl/privacy), warunki — w ofercie (devuz.studio/pl/offer).",
      ],
    },
    {
      heading: "Kontakt",
      body: [
        "Pytania o aplikację DevUz Studio i dane Google — napisz do studia na Telegramie, kontakt jest podany wyżej na tej stronie.",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "DevUz Studio：Google Ads 与 Google Analytics 连接",
  updated: "更新于 2026 年 11 月 15 日",
  intro:
    "DevUz Studio 是位于乌兹别克斯坦塔什干的网站开发工作室。本页介绍 DevUz Studio 应用：工作室内部管理面板中连接 Google Ads 与 Google Analytics 的部分。说明它做什么、读取哪些 Google 数据，以及它从不做什么。",
  sections: [
    {
      heading: "什么是 DevUz Studio 应用",
      body: [
        "DevUz Studio 应用是工作室的内部工具，仅供 DevUz Studio 员工在工作室管理面板中使用。它不面向公众提供，网站访客也不会通过它登录。",
        "它的用途是帮助工作室依据 Google 数据而非猜测，规划自己网站的页面与文章，并查看自身广告的效果。",
      ],
    },
    {
      heading: "它如何使用 Google",
      body: [
        "Google Ads 关键字规划师：针对某个短语（例如「塔什干网站开发」），应用读取相关关键字建议以及按国家统计的月均搜索量。员工据此选择工作室网站页面与文章的主题和标题。",
        "Google Ads：应用读取工作室自有 Google Ads 账户的报告（广告系列、花费、展示、点击）并在面板中显示。只有员工在面板中按下按钮时，才会修改广告系列。",
        "Google Analytics：应用以只读方式读取工作室自有网站的流量报告（访问、页面、来源）并在面板中显示。",
      ],
    },
    {
      heading: "它请求的 Google 权限",
      body: [
        "https://www.googleapis.com/auth/adwords：用于读取关键字规划师数据及工作室自有 Google Ads 账户的报告。https://www.googleapis.com/auth/analytics.readonly：用于读取工作室网站的 Google Analytics 报告。",
        "访问权限由工作室所有者或负责人使用工作室的 Google 账户登录授予。应用仅请求这两项权限，不请求访问 Gmail、Google 云端硬盘、联系人或任何其他 Google 服务。",
      ],
    },
    {
      heading: "它从不做什么",
      body: [
        "该应用不会通过 Google API 创建、编辑或生成图片、视频或任何其他媒体，也绝不会被用于制作任何人的私密或色情图像，无论真实还是生成的。",
        "它不出售 Google 数据，不将其提供给广告网络或数据经纪商，不据此建立个人画像，也不用其训练 AI 模型。",
      ],
    },
    {
      heading: "数据与隐私",
      body: [
        "从 Google 获得的访问令牌以加密形式保存在工作室的安全存储中，报告仅对工作室员工可见。DevUz Studio 对从 Google API 获得的信息的使用和传输遵守 Google API Services User Data Policy，包括 Limited Use（有限使用）要求。",
        "可随时在 myaccount.google.com/permissions 或通过面板中的断开按钮撤销访问权限；已保存的令牌将在 30 天内删除。详情见工作室隐私政策（devuz.studio/zh/privacy），服务条款见要约（devuz.studio/zh/offer）。",
      ],
    },
    {
      heading: "联系方式",
      body: [
        "有关 DevUz Studio 应用及 Google 数据的问题，请通过 Telegram 联系工作室，联系方式见本页上方。",
      ],
    },
  ],
};

export const googleApp: Record<Locale, LegalDoc> = { ru, en, uz, zh, uk, pl };
