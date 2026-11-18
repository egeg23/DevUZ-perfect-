import type { HelpCopy } from "../admin-help";
import type { HelpEntry } from "@/lib/admin/help";

/** Zadania w Telegramie — wspólne dla wszystkich ról; ostatni akapit każda rola ma swój. */
const TASKS_BOT = [
  "Gdy ktoś zleca Ci zadanie, bot wysyła wiadomość: od kogo, co zrobić, termin — i przycisk **«✅ Взять в работу»** (przyjmij do realizacji). Po kliknięciu w tej samej wiadomości pojawiają się **«✅ Сделано»** (zrobione), **«✖ Не сделано»** (niezrobione) i **«🕑 Перенести срок»** (przesuń termin). To, co klikniesz w Telegramie, od razu widać w panelu, i odwrotnie: przyjmiesz zadanie w panelu — przyciski w Telegramie zmienią się same.",
  "«🕑 Перенести срок» proponuje «+1 час», «Завтра 18:00», «+3 дня», «Неделя» i «✏️ Своя дата» (+1 godzina, jutro 18:00, +3 dni, tydzień, własna data). Po «✏️ Своя дата» napisz botowi termin w jednej wiadomości — dzień, miesiąc i godzinę czasu taszkenckiego, na przykład `05.10 15:00`. Bot czeka na taką wiadomość 30 minut. Po przesunięciu — przyciskiem, własną datą albo w panelu — termin w samej wiadomości o zadaniu zmieni się na nowy.",
  "Osobie, która zleciła zadanie, bot pisze o każdym kroku: przyjął(ęła) do realizacji, zrobione, niezrobione, przesunął(ęła) termin na taki a taki dzień i godzinę. Do wykonawcy bot pisze, jeśli zlecający przesunął termin, zmienił zadanie (co dokładnie — nazwę, opis albo projekt) albo je anulował. Jeśli zadanie przekazano komuś innemu, poprzedni wykonawca dostaje wiadomość, że mu je zdjęto, a jego wiadomość o zadaniu zmienia się na «↪️ Задача передана» (zadanie przekazane): nie ma już pod nią przycisków.",
  "Przypomnienia: jeśli nowe zadanie nie zostanie przyjęte w ciągu 30 minut od wiadomości bota — bot przypomni; godzinę przed terminem — przypomni jeszcze raz; gdy termin minie — raz napisze i do wykonawcy, i do zlecającego. Po przesunięciu terminu «za godzinę termin» i «po terminie» przyjdą od nowa — już do nowego terminu.",
  "Wiadomości o działaniach — nowe zadanie, przyjęcie, zrobione, przesunięcie, anulowanie — przychodzą od razu, w każdy dzień, poza nocą: od 21:00 do 08:00 czasu taszkenckiego bot milczy, a to, co przyszło w nocy, dotrze o 08:00. Przypomnienia — «nie przyjęto», «za godzinę termin», «po terminie» — tylko w dni robocze od 09:00 do 19:00, jak porcja dnia. W panelu wszystko widać od razu, a odpowiedź na kliknięty przycisk przychodzi o każdej porze.",
];

/**
 * Польская инструкция, часть первая: шапка страницы инструкций и раздел
 * «Лиды» (/admin) — главная, очередь, карточка лида, напоминания.
 *
 * Перевод admin-help-ru.ts абзац в абзац. Названия кнопок и блоков — как на
 * польской панели (content/admin-panel/home.ts, dashboard.ts,
 * lead-card.ts); сообщения и кнопки бота в Telegram — по-русски, как их
 * видит сотрудник.
 */

export const head: Pick<
  HelpCopy,
  "title" | "lead" | "contentsTitle" | "sectionsTitle" | "openSection" | "viewAs" | "roleNames" | "ownerOnly" | "granted" | "search" | "video"
> = {
  title: "Instrukcje",
  lead: "Jak działa panel i jak z niego korzystać — sekcja po sekcji, prostymi słowami. Znajdziesz tu tylko to, do czego masz dostęp. Z każdej sekcji prowadzi tu przycisk «Jak korzystać z sekcji» w nagłówku, a «?» przy blokach otwiera właściwy punkt.",
  contentsTitle: "Spis treści",
  sectionsTitle: "Sekcje",
  openSection: "otwórz sekcję",
  viewAs: "Pokaż jako:",
  roleNames: { admin: "właściciel", head: "kierownik", manager: "menedżer" },
  ownerOnly: "Widzi tylko właściciel",
  granted: "Otwarty Ci przez właściciela do podglądu: zmieniać możesz tu tylko to, co należy do Twojej roli",
  search: {
    label: "Szukaj w instrukcji",
    placeholder: "Zapytaj własnymi słowami…",
    button: "Szukaj",
    searching: "Szukam…",
    opened: "Otwarto punkt:",
    also: "Może też pasować:",
    byWords: "Dobrane po zgodności słów — sprawdź, czy to ten punkt.",
    nothing: "Nie znaleziono takiego punktu. Spróbuj inaczej albo zapytaj na czacie zespołu.",
    failed: "Nie udało się wyszukać — sprawdź połączenie i spróbuj ponownie.",
  },
  video: {
    introTitle: "Wideo: panel w minutę",
    otherLanguage: "Wideo w języku: {lang}",
    manageSection: "Wideo do sekcji",
    manageIntro: "Wideo wprowadzające",
    have: "Wgrane:",
    remove: "Usuń",
    removeConfirm: "Usunąć wideo ({lang})? Plik zostanie skasowany z serwera.",
    removeFailed: "Nie udało się usunąć wideo — odśwież stronę i spróbuj ponownie.",
    language: "Język wideo",
    file: "Plik: MP4, MOV lub WebM, do 500 MB",
    upload: "Wgraj",
    busy: "Wgrywam…",
    replaceNote: "W tym języku wideo już jest — nowe je zastąpi.",
    done: "Wideo wgrane.",
    chooseFile: "Wybierz plik.",
    wrongType: "Potrzebny film MP4, MOV lub WebM.",
    tooBig: "Plik ma ponad 500 MB — skompresuj go albo podziel na części.",
  },
};

export const leadsSections: Record<string, HelpEntry> = {
  /* ── Pulpit ──────────────────────────────────────────────────────────── */
  "/admin/hq": {
    what: "«Pulpit» otwiera się jako pierwszy po zalogowaniu i po kliknięciu logo «DevUz». Właściciel i kierownik widzą tu całą firmę: co dzieje się dziś, co się pali i czym zajmuje się każdy. Menedżer widzi swój dzień pracy: pilne sprawy, leady (zgłoszenia klientów), z kim się skontaktować, swoje makiety i liczby. Strona odświeża się sama co półtorej minuty, dopóki jest otwarta.",
    items: [
      {
        id: "desk",
        title: "Górny rząd: «Skrzynka» i «Dziś»",
        body: {
          manager: [
            "Na górze «Pulpitu» jest blok «Skrzynka». Są w nim klienci, którzy czekają na Twoją odpowiedź. Kto czeka dłużej, ten jest wyżej. Kliknij wiersz, a rozmowa otworzy się w [Skrzynce](/admin/inbox). Tam też możesz odpisać.",
            "Blok jest pusty? Znaczy, że teraz nikt nie czeka na odpowiedź: bot prowadzi rozmowy sam. Niżej jest Twój dzień: co się pali, z kim się skontaktować, Twoje makiety i Twoja praca.",
          ],
          head: [
            "Na górze są dwa bloki. «Skrzynka» pokazuje do sześciu klientów, którzy czekają na odpowiedź człowieka: z kontaktów zespołu i z bota. Kto czeka dłużej, ten jest wyżej. Kliknij wiersz, a rozmowa otworzy się w [Skrzynce](/admin/inbox).",
            "«Dziś» pokazuje trzy liczby: nowe leady w 7 dni, odpowiedzi w 7 dni i dzisiejsze kontakty wobec normy dnia. Strzałka przy liczbie porównuje z poprzednimi 7 dniami. Niżej wykres «Kontakty według dni»: ile kontaktów zespół zrobił każdego z 7 dni.",
          ],
          admin: [
            "Na górze są dwa bloki. «Skrzynka» pokazuje do sześciu klientów, którzy czekają na odpowiedź człowieka: z kontaktów zespołu i z bota. Kto czeka dłużej, ten jest wyżej. Kliknij wiersz, a rozmowa otworzy się w [Skrzynce](/admin/inbox).",
            "«Dziś» pokazuje trzy liczby: nowe leady w 7 dni, odpowiedzi w 7 dni i dzisiejsze kontakty wobec normy dnia. Strzałka przy liczbie porównuje z poprzednimi 7 dniami. Niżej wykres «Kontakty według dni»: ile kontaktów zespół zrobił każdego z 7 dni.",
          ],
        },
      },
      {
        id: "pulse",
        title: "Puls firmy: leady, kontakty, makiety, zadania",
        body: {
          head: [
            "Niżej są cztery karty: «Leady», «Kontakty», «Makiety» i «Zadania». Duża liczba jest najważniejsza, wiersze pod nią ją uzupełniają. Każdą liczbę można kliknąć, a otworzy się lista, z której pochodzi.",
            "«Leady»: ile leadów cały zespół ma w toku i ile jest nowych. Wiersz «ciepłe: oferowane teraz» oznacza leady, które czekają, aż ktoś je weźmie (na to jest 30 minut). «ciepłe bez opiekuna» nikt nie wziął i tu warto zareagować.",
            "«Kontakty»: do ilu firm napisaliśmy dziś wobec normy dnia. Piszą ludzie i autopilot (bot, który sam pisze do firm). Niżej odpowiedzi klientów i «odmów w 7 dni». O odmowach bot nie wysyła kart, widać je tylko tutaj.",
            "«Makiety»: ile makiet jest teraz u klientów w promocji 48 godzin i czyja promocja kończy się najwcześniej. «Zadania»: otwarte, po terminie i zrobione w 7 dni.",
            "«▲ +3» przy liczbie znaczy, że w 7 dni było więcej niż w 7 dni wcześniej. «▼ −2» znaczy mniej. Kierownik nie widzi pieniędzy na «Pulpicie».",
          ],
          admin: [
            "Niżej jest pięć kart: «Leady», «Kontakty», «Makiety», «Zadania» i «Finanse». Duża liczba jest najważniejsza, wiersze pod nią ją uzupełniają. Każdą liczbę można kliknąć, a otworzy się lista, z której pochodzi.",
            "«Leady»: ile leadów cały zespół ma w toku i ile jest nowych. Wiersz «ciepłe: oferowane teraz» oznacza leady, które czekają, aż ktoś je weźmie (na to jest 30 minut). «ciepłe bez opiekuna» nikt nie wziął i tu warto zareagować.",
            "«Kontakty»: do ilu firm napisaliśmy dziś wobec normy dnia. Piszą ludzie i autopilot (bot, który sam pisze do firm). Niżej odpowiedzi klientów i «odmów w 7 dni». O odmowach bot nie wysyła kart, widać je tylko tutaj.",
            "«Makiety»: ile makiet jest teraz u klientów w promocji 48 godzin i czyja promocja kończy się najwcześniej. «Zadania»: otwarte, po terminie i zrobione w 7 dni.",
            "Kartę z pieniędzmi widzisz tylko Ty. Są w niej wpłaty z 7 dni i od początku miesiąca, kliknięcie otwiera [Finanse](/admin/finance). Wiersz o umowach do podpisu prowadzi do [Umów](/admin/contracts).",
            "«▲ +3» przy liczbie znaczy, że w 7 dni było więcej niż w 7 dni wcześniej. «▼ −2» znaczy mniej.",
          ],
        },
      },
      {
        id: "stages",
        title: "«Etapy sprzedaży»",
        body: {
          admin: [
            "Blok «Etapy sprzedaży» pokazuje drogę klienta do płatności. Etapy to: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność». Liczby są za 7 i za 30 dni. Kliknij liczbę, a otworzy się lista tych klientów.",
            "Prawie wszystkie etapy program zaznacza sam na podstawie rozmów i bazy. Pokaz makiety zaznacza tylko menedżer, przyciskiem «Pokazałem makietę» w [karcie leada](#leads-sales-marks). Tam też etap zaznaczony przez pomyłkę zdejmuje się kliknięciem.",
            "Niżej widać, gdzie klienci odpadają w 30 dni. Na przykład: «z 188, którzy odpisali, zainteresowanie wyraziło 12». Gdzie odpada najwięcej, tam utyka sprzedaż.",
            "Kwotę z opłaconych transakcji widzisz tylko Ty. Jeśli menedżerowie nie zaznaczają pokazów, etap «makieta pokazana» będzie zerem.",
          ],
          head: [
            "Blok «Etapy sprzedaży» pokazuje drogę klienta do płatności. Etapy to: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność». Liczby są za 7 i za 30 dni. Kliknij liczbę, a otworzy się lista tych klientów.",
            "Prawie wszystkie etapy program zaznacza sam na podstawie rozmów i bazy. Pokaz makiety zaznacza tylko menedżer, przyciskiem «Pokazałem makietę» w [karcie leada](#leads-sales-marks). Tam też etap zaznaczony przez pomyłkę zdejmuje się kliknięciem.",
            "Niżej widać, gdzie klienci odpadają w 30 dni. Na przykład: «z 188, którzy odpisali, zainteresowanie wyraziło 12». Gdzie odpada najwięcej, tam utyka sprzedaż.",
            "Kierownik nie widzi w tym bloku pieniędzy. Jeśli menedżerowie nie zaznaczają pokazów, etap «makieta pokazana» będzie zerem.",
          ],
          manager: [
            "Etapy sprzedaży pokazują drogę klienta od pierwszej wiadomości do płatności. W bloku «Moje etapy w tym tygodniu» są tylko Twoi klienci. Kliknij kafelek, a otworzy się lista: kto i kiedy doszedł do etapu.",
            "Prawie wszystko program zaznacza sam. Pokaz makiety zaznaczasz tylko Ty, przyciskiem «Pokazałem makietę». Nie zaznaczysz pokazu, to nie będzie go nigdzie: ani w Twojej normie, ani w raporcie dla kierownika.",
          ],
        },
      },
      {
        id: "attention",
        roles: ["admin", "head"],
        title: "«Wymaga uwagi»",
        body: [
          "Tu jest to, co pali się właśnie teraz. Czerwona kropka to awaria albo klient bez opiekuna. Żółta znaczy, że coś się spali, jeśli dziś się tym nie zajmiesz. Kliknij wiersz, a otworzy się to, czego dotyczy: lead, zadanie, konto albo makieta.",
          "Co tu trafia: bot przypomnień milczy dłużej niż 30 minut, awaria autopilota, Telegram ograniczył konto robocze, brak kółka w «Избранное». Do tego ciepłe leady bez opiekuna, zadania po terminie i leady bez ruchu od 7 dni i dłużej. I promocje, którym zostało mniej niż 6 godzin.",
          "Wiersz «Imię: N leadów bez odpowiedzi botowi» znaczy, że bot zapytał osobę o jej zawieszone leady, a odpowiedzi nie ma. Lista jest pusta? Znaczy, że nie ma czego gasić.",
          "Ciepłego leada bez opiekuna możesz przekazać od razu tutaj. W bloku «Przekaż ciepłego leada osobie» wybierz, komu, i kliknij «Przekaż». Ta osoba dostanie wiadomość od bota i przypomnienie po 4 godzinach.",
        ],
      },
      {
        id: "feed",
        roles: ["admin", "head"],
        title: "«Ostatnia doba»",
        body: [
          "Tu jest to, co wydarzyło się w ostatnich 24 godzinach, najnowsze na górze. Nowy lead, makieta wysłana albo zatwierdzona, zadanie zrobione, lead wygrany albo przegrany. Widać do dwunastu wierszy.",
          "Każdy wiersz można kliknąć. Lead otworzy się w karcie, makieta w [Makietach](/admin/mockups), zadanie w historii zadań.",
        ],
      },
      {
        id: "people",
        roles: ["admin", "head"],
        title: "«Zespół dziś»: karty zespołu",
        body: [
          "Każdy menedżer i kierownik ma swoją kartę. Zielona kropka znaczy «online»: osoba była w panelu albo w bocie w ciągu ostatnich 30 minut. W innym razie widać, kiedy była.",
          "W karcie są dzisiejsze kontakty, leady w toku i otwarte zadania. Słupki pokazują kontakty z każdego z 7 dni. Etykiety podpowiadają problem: zaległość, spalone leady, leady bez ruchu, «bez odpowiedzi botowi». Karty z takimi etykietami stoją pierwsze.",
          "Przycisk «Szczegóły» rozwija kartę: kiedy osoba weszła dziś i ile była w panelu. Tam są też przyciski «Zleć zadanie» i «Otwórz jego leady».",
        ],
      },
      {
        id: "show-norm",
        title: "Norma: 2 pokazy makiety w tygodniu",
        roles: ["admin", "head"],
        body: [
          "Każdy menedżer powinien pokazać klientom 2 makiety w tygodniu. Tydzień liczy się od poniedziałku. W karcie osoby jest etykieta «pokazy N z 2», zielona, gdy norma jest zrobiona.",
          "Kontakty to tylko próby. Do pieniędzy prowadzą pokaz, podana cena i płatność. Dlatego te trzy liczby są w raporcie «Сотрудники за день» o 18:00.",
          "W poniedziałki o 10:00 bot przysyła wiersz: kto w zeszłym tygodniu nie pokazał żadnej makiety, choć makiety do jego klientów wychodziły. Przychodzi, jeśli masz zaznaczone «Raporty».",
        ],
      },
      {
        id: "levels",
        title: "Poziomy i grade zespołu",
        roles: ["admin", "head"],
        body: [
          "W karcie każdego jest poziom z tytułem i etykieta «transakcje N/3» za ten miesiąc. W rozwiniętej karcie widać punkty i procent osoby.",
          "Punkty są za to, co prowadzi do pieniędzy. Kontakt to 1 punkt, pokaz makiety 15, transakcja z płatnością 100. Trochę punktów jest też za pracę w panelu, ale z dziennym limitem. Wysoki poziom i zero transakcji? Warto sprawdzić, na co idzie czas.",
          "Grade (procent menedżera od sprzedaży) wygląda tak. Baza to 10%. Trzy transakcje w miesiącu dają 15% w następnym miesiącu i premię $200 za każde trzy transakcje. Premie widać w [Finansach](/admin/finance).",
        ],
      },
      {
        id: "task",
        roles: ["admin", "head"],
        title: "«Szybkie zadanie»",
        body: [
          "Tu możesz zlecić zadanie bez wychodzenia z «Pulpitu». Zaznacz, komu (można kilka osób), wpisz «Co zrobić» i wybierz «Termin». Potem kliknij «Zleć zadanie».",
          "Jeśli zadanie jest dla osoby, która składa makiety, formularz zapyta o «Zlecenie makiety». Gdy odpowiesz «Tak», wybierz klienta i wpisz jego stronę.",
          "Bot od razu napisze do wykonawcy w Telegramie. W nocy, od 21:00 do 08:00, wiadomość przyjdzie o 08:00. Przycisk «Zleć zadanie» w karcie osoby otwiera ten formularz z nią już zaznaczoną.",
        ],
      },
      {
        id: "broadcast",
        roles: ["admin", "head"],
        title: "«Wiadomość do zespołu przez bota»",
        body: [
          "To Twoja wiadomość od bota studia w Telegramie. Blok ma dwie karty. «Pracownikom» idzie do całego zespołu albo jego części. «Użytkownikom bota» idzie do tych, którzy sami pisali do bota.",
          "Napisz treść, wybierz, do kogo i kiedy. Bot wysyła co pięć minut: na rozmowę o 15:00 ustaw 14:50. W nocy, od 21:00 do 08:00, bot milczy, jeśli nie zaznaczysz «Wyślij także w nocy».",
          "Przed wysłaniem kliknij «Podgląd». Widać tam, jak wygląda wiadomość i ile osób ją dostanie. Ty jej nie dostaniesz.",
          "Na dole są «Ostatnie wysyłki»: do kogo poszło i ile doszło. Dopóki wysyłka nie wyszła, możesz ją anulować przyciskiem «Anuluj». «Powtórz» otwiera formularz z tą samą treścią i tymi samymi osobami.",
          "W karcie «Użytkownikom bota» wybierz: «Wszystkim», «Partnerom», «Kupującym w sklepie» albo «Klientom i leadom». Pracowników tam nie ma. Kto zablokował bota, do tego wiadomość nie pójdzie. Odpowiedź klienta przyjdzie do Ciebie jako «📩 Обращение в бота».",
        ],
      },
      {
        id: "bot-subs",
        roles: ["admin", "head"],
        title: "«Subskrybenci bota»",
        body: [
          "Tu widać, ile osób jest w [bocie studia](https://t.me/Devuz_studio_bot). Duża liczba «teraz w bocie» liczy tych, którzy sami napisali do bota i go nie zablokowali. Dokładnie do nich pójdzie wysyłka «Wszystkim». Pracownicy się nie liczą.",
          "Zielony wiersz «zasubskrybowało dzisiaj» liczy nowych od północy czasu taszkenckiego, obok liczba z wczoraj. Tabela pokazuje nowych i «Aktywni w bocie» za 24 godziny, 7 i 30 dni. Liczby odświeżają się co 5 minut.",
          "Złoty wiersz «złożyło makietę dzisiaj» liczy, ilu subskrybentów złożyło sobie makietę w bocie komendą /maket. Wiersz «Złożyli makietę» pokazuje to samo za 24 godziny, 7 i 30 dni. Makiety złożone przez pracowników się nie liczą. Każdą makietę widać w [Makietach](/admin/mockups).",
          "Codziennie o 20:00 bot przysyła Ci podsumowanie «👥 Подписчики бота». Przychodzi, jeśli masz zaznaczone «Raporty».",
        ],
      },
      {
        id: "voice",
        roles: ["admin", "head"],
        title: "Wiadomość głosowa na tekst przez bota",
        body: [
          "Klient przysłał zadanie wiadomością głosową? Przekaż ją [botowi studia](https://t.me/Devuz_studio_bot) na prywatnym czacie. Pasuje wiadomość głosowa, plik audio albo nagranie z dyktafonu.",
          "Bot odpowie «🎙 Получил голосовое», a po 10-20 minutach przyśle tekst na ten sam czat. Liczby, ceny i nazwy sprawdzaj z nagraniem. Program może się pomylić, zwłaszcza gdy mówi się w dwóch językach.",
          "Nagrania większego niż 20 MB albo dłuższego niż godzina bot nie weźmie, przysyłaj w częściach. Kółko tu nie pasuje: to [kółko do kontaktów](#accounts-circle).",
        ],
      },
      {
        id: "bot-helper",
        title: "Pomocnik w bocie: pytania o pracę",
        body: {
          manager: [
            "Napisz do [bota studia](https://t.me/Devuz_studio_bot) na prywatnym czacie pytanie o pracę, a odpowie sam. Na przykład: «co odpowiedzieć, gdy klient mówi, że drogo». Odpowiedź jest krótka, do 500 znaków, w języku pytania.",
            "Bot bierze odpowiedzi z tej instrukcji, «Szkoleń», gotowych odpowiedzi na obiekcje i case studies studia. Nie podaje danych klientów ani pieniędzy studia. Jeśli nie ma odpowiedzi, zapytaj kierownika.",
            "Bot rozpoznaje Cię po Telegramie przypisanym w «Zespole». Dziennie możesz zadać 30 pytań.",
          ],
          head: [
            "Napisz do [bota studia](https://t.me/Devuz_studio_bot) na prywatnym czacie pytanie o pracę, a odpowie sam. Odpowiedź jest krótka, do 500 znaków, w języku pytania. Nowym osobom tak łatwiej: zapytać bota jest szybciej niż czekać na Ciebie.",
            "Bot bierze odpowiedzi z instrukcji, «Szkoleń», odpowiedzi na obiekcje i case studies studia. Menedżerowi nie mówi o pieniądzach studia. Codziennie o 18:00 przychodzi do Ciebie «🤖 Помощник в боте»: kto ile pytań zadał.",
            "Pomocnik odpowiada tylko tym, których Telegram jest przypisany w [Zespole](/admin/team). Jeśli ktoś pisze «jestem waszym menedżerem», a w «Zespole» go nie ma, dostaniesz wiersz z jego nickiem. To nasz człowiek? Dodaj go.",
          ],
          admin: [
            "Napisz do [bota studia](https://t.me/Devuz_studio_bot) na prywatnym czacie pytanie o pracę, a odpowie sam. Odpowiedź jest krótka, do 500 znaków, w języku pytania. Nowym osobom tak łatwiej: zapytać bota jest szybciej niż czekać na kierownika.",
            "Bot bierze odpowiedzi z instrukcji, «Szkoleń», odpowiedzi na obiekcje i case studies studia. Menedżerowi nie mówi o pieniądzach studia. Codziennie o 18:00 przychodzi do Ciebie «🤖 Помощник в боте»: kto ile pytań zadał.",
            "Pomocnik odpowiada tylko tym, których Telegram jest przypisany w [Zespole](/admin/team). Jeśli ktoś pisze «jestem waszym menedżerem», a w «Zespole» go nie ma, dostaniesz wiersz z jego nickiem. To nasz człowiek? Dodaj go.",
          ],
        },
      },
      {
        id: "bot-contact",
        roles: ["admin", "head"],
        title: "Kontakt klienta w bocie",
        body: {
          head: [
            "Napisz do [bota studia](https://t.me/Devuz_studio_bot) słowo «kontakt» i imię klienta, firmę, stronę albo numer zgłoszenia. Na przykład: «kontakt Samsa Haus». Bot przyśle telefon albo nick i link do karty.",
            "Każdy pokazany kontakt trafia do dziennika. Nic się nie znalazło? Napisz imię albo stronę inaczej. Menedżerom bot kontaktów nie szuka.",
          ],
          admin: [
            "Napisz do [bota studia](https://t.me/Devuz_studio_bot) słowo «kontakt» i imię klienta, firmę, stronę albo numer zgłoszenia. Na przykład: «kontakt Samsa Haus». Bot przyśle telefon albo nick i link do karty.",
            "To działa też na Twoim czacie z botem, na który przychodzą briefy leadów. Komendy i przyciski briefów działają tam normalnie.",
            "Każdy pokazany kontakt trafia do [Dziennika](/admin/audit). Nic się nie znalazło? Napisz imię albo stronę inaczej. Menedżerom bot kontaktów nie szuka.",
          ],
        },
      },
      {
        id: "my-day",
        title: "Twój «Pulpit»: dzień pracy",
        roles: ["manager"],
        body: [
          "To Twój dzień pracy na jednym ekranie: co się pali, co jest po terminie, z kim się skontaktować, Twoje makiety i Twoje liczby. Jest tu tylko Twoje. Cudzych leadów i pieniędzy studia tu nie ma.",
          "Strona odświeża się sama co półtorej minuty. Każdy wiersz można kliknąć, a otworzy się lead, zadanie albo makieta. Zielona kropka obok tekstu znaczy, że kliknięcie doszło i strona się ładuje.",
        ],
      },
      {
        id: "my-hot",
        title: "«Pali się teraz»",
        roles: ["manager"],
        body: [
          "Tu jest to, co się spali, jeśli nie zajmiesz się tym w ciągu godziny. Wiersze świecą na złoto, a najpilniejsze na czerwonawo.",
          "🔥 Ciepły lead zaproponowany Tobie. Kliknij «Weź», masz 30 minut, potem lead przejdzie do następnej osoby. 💬 Klient odpisał i czeka na Ciebie. 👀 Klient właśnie otworzył Twoją makietę, to najlepszy moment, żeby napisać. ⏰ Promocja Twojej makiety kończy się dziś. 📌 Zadanie na dziś.",
          "Pusto? Nic się nie pali, możesz wziąć [porcję kontaktów](/admin/prospect).",
        ],
      },
      {
        id: "my-overdue",
        title: "«Zaległe»",
        roles: ["manager"],
        body: [
          "Tu jest to, co już się spóźniło. To zadania po terminie i leady, którym nadszedł dzień następnego kroku. Do tego leady w toku bez ruchu od 7 dni i dłużej.",
          "Ruch to rozmowa, zmiana statusu albo dowolne działanie przy leadzie. Samo otwarcie karty się nie liczy. Lead bez ruchu przez 21 dni sam przejdzie do «przegrany», jeśli przez trzy dni nie odpowiesz botowi.",
          "Pod każdym leadem są przyciski «🏆 Wygrana», «❌ Przegrana» i «⏳ Czekamy». Kliknij właściwy, a wiersz zniknie.",
        ],
      },
      {
        id: "my-status",
        title: "Przyciski «🏆 Wygrana», «❌ Przegrana», «⏳ Czekamy»",
        roles: ["manager"],
        body: [
          "To te same przyciski, które bot przysyła o 10:00 i 16:00 przy zawieszonych leadach. Zmienić możesz tylko swój lead.",
          "«🏆 Wygrana» zamyka lead sprzedażą i otwiera [Projekty](/admin/projects). Załóż tam projekt, wtedy sprzedaż zapisze się na Ciebie. «❌ Przegrana» zdejmuje lead z pracy.",
          "«⏳ Czekamy» zapyta, kiedy następny krok: «Jutro», «Za 3 dni» albo «Za tydzień». Na ten dzień dostaniesz zadanie «Связаться: …», a do tego czasu lead nie będzie Ci przeszkadzał. Odłożyć można trzy razy z rzędu, potem zostaną tylko «🏆» i «❌».",
        ],
      },
      {
        id: "my-contacts",
        title: "«Z kim skontaktować się dziś»",
        roles: ["manager"],
        body: [
          "Tu są osoby, do których trzeba dziś napisać albo zadzwonić. To dzisiejsze zadania «Связаться: …», leady z krokiem na dziś i klienci, którzy Ci odpisali. Ci, którzy odpisali, są na górze.",
          "Przyciski «Napisz», «Zadzwoń» i «E-mail» otwierają kontakt klienta. Każde otwarcie trafia do dziennika, więc klikaj, gdy naprawdę się kontaktujesz. «Karta» otwiera lead albo kontakt.",
        ],
      },
      {
        id: "my-mockups",
        title: "«Moje makiety»",
        roles: ["manager"],
        body: [
          "Tu są makiety, które w 14 dni poszły do Twoich klientów, i wszystkie, których promocja jeszcze trwa. Na górze te, których promocja kończy się najwcześniej.",
          "Przy każdej widać, kiedy poszedł link i czy klient go otwierał. Widać też, ile zostało do końca promocji i czy makieta jest otwarta bez hasła. Klient ogląda ją teraz? Wiersz świeci, to najlepszy moment, żeby napisać.",
          "«Wygeneruj hasło» daje hasło na 24 godziny. Widać je tylko raz, obok są przyciski do skopiowania. Jeśli makieta jest jeszcze otwarta przez link, pierwsze hasło ją zamknie.",
        ],
      },
      {
        id: "my-growth",
        title: "«Mój rozwój»: poziom i punkty",
        roles: ["manager"],
        body: [
          "Blok «Mój rozwój» pokazuje Twój poziom, jak w grze. Punkty są za działania, które prowadzą do pieniędzy. Im bliżej płatności, tym więcej punktów.",
          "Kontakt to 1 punkt, odpowiedź klienta 2, zainteresowanie 5, makieta wysłana 10, pokaz 15, cena podana 20, transakcja z płatnością 100. Trochę punktów jest też za pracę w panelu, ale z dziennym limitem. Pełną listę otwiera «Za co punkty».",
          "Każdy kolejny poziom jest droższy, dalekie zdobywa się tylko transakcjami. Punkty liczą się raz na godzinę. Twój poziom widzą kierownik i właściciel.",
        ],
      },
      {
        id: "grade",
        title: "«Grade za transakcje»: 15% i premia $200",
        roles: ["manager"],
        body: [
          "Transakcja to Twój projekt, za który przyszła pierwsza płatność. Liczy się w miesiącu tej płatności.",
          "Twój procent od nowego klienta to 10%. Zamkniesz trzy transakcje w miesiącu, a w następnym miesiącu będzie 15%. Jeśli właściciel ustawił Ci własną stawkę, ona się nie obniża.",
          "Ponad procent jest premia $200 za każde trzy transakcje w miesiącu: trzy transakcje dają $200, sześć daje $400. Premię widać w [Finansach](/admin/finance) zaraz po płatności za trzecią transakcję.",
        ],
      },
      {
        id: "my-stages",
        title: "«Moje etapy w tym tygodniu» i norma pokazów",
        roles: ["manager"],
        body: [
          "Blok «Moje etapy w tym tygodniu» liczy się od poniedziałku. Na górze norma: 2 pokazy makiety w tygodniu. Jeśli do piątku nie ma pokazów, wiersz zacznie świecić.",
          "Pokaz to sytuacja, gdy klient widział makietę razem z Tobą: na spotkaniu, w rozmowie albo na Twoim wideo. Zaznacz go przyciskiem «Pokazałem makietę» w «Moje makiety» albo w [karcie leada](#leads-sales-marks).",
          "Kierownik widzi Twoje pokazy w raporcie o 18:00. W poniedziałki dostaje listę osób, które miały makietę, ale nie miały pokazu.",
        ],
      },
      {
        id: "my-work",
        title: "«Moja praca»",
        roles: ["manager"],
        body: [
          "Na górze jest porcja dnia (do ilu firm trzeba dziś napisać): ile zrobione i pasek. Kliknij, a otworzą się [Zimne kontakty](/admin/prospect).",
          "Niżej są dwie kolumny, «Dziś» i «7 dni». Są w nich kontakty, odpowiedzi klientów, wzięte i spalone ciepłe leady, wysłane makiety i wygrane leady. Każdą liczbę można kliknąć. Kierownik widzi te same liczby.",
        ],
      },
      {
        id: "week",
        title: "«Tydzień: rekomendacje, zespół, plan»",
        body: {
          manager: [
            "Na dole «Pulpitu» jest blok «Tydzień: rekomendacje, zespół, plan». Są tam [rady na tydzień](#leads-coach) na podstawie Twoich liczb i [«Plan i wykonanie»](#leads-plan-fact) z celami, które Ci ustawiono.",
            "Ile zarobiłeś, sprawdzisz w [Finansach](/admin/finance).",
          ],
          head: [
            "Na dole «Pulpitu» jest blok «Tydzień: rekomendacje, zespół, plan». Jest w nim «Na dziś», [«Zespół w tym tygodniu»](#leads-team-week), «Najlepsi w tygodniu» i [«Plan i wykonanie»](#leads-plan-fact).",
            "W «Planie i wykonaniu» ustawiasz plan swojemu menedżerowi. Po «Ustaw plan» strona wróci do tego bloku.",
          ],
          admin: [
            "Na dole «Pulpitu» jest blok «Tydzień: rekomendacje, zespół, plan». Jest w nim «Na dziś», [«Zespół w tym tygodniu»](#leads-team-week) z kwotą «do wypłaty», «Najlepsi w tygodniu» i [«Plan i wykonanie»](#leads-plan-fact).",
            "W «Planie i wykonaniu» ustawiasz, zmieniasz i zdejmujesz plany. Kasa i oczekiwane płatności są na dole [Finansów](/admin/finance).",
          ],
        },
      },
      {
        id: "app",
        title: "Aplikacja DevUz na telefonie i powiadomienia",
        body: [
          "Panel możesz zainstalować na telefonie jak aplikację. Otworzy się na cały ekran i będą do niego przychodzić powiadomienia. To te same wiadomości, które pisze do Ciebie bot w Telegramie.",
          "**iPhone.** Potrzebny jest iOS 16.4 lub nowszy i przeglądarka **Safari**. Otwórz devuz.studio/admin, kliknij «Udostępnij» (kwadrat ze strzałką), potem «Do ekranu początkowego» i «Dodaj». Na iPhonie powiadomienia przychodzą tylko w aplikacji z ikony.",
          "**Android.** Otwórz devuz.studio/admin w Chrome i na «Pulpicie» kliknij «Zainstaluj aplikację». Nie ma przycisku? Otwórz menu Chrome (trzy kropki) i wybierz «Zainstaluj aplikację».",
          "**Logowanie.** W aplikacji kliknij «Odbierz kod w bocie». Bot przyśle 6 cyfr, wpisz je i zaloguj się. Kod działa 5 minut, nikomu go nie przekazuj. Kod nie przyszedł? Wyślij botowi /code.",
          "Logujesz się raz. Potem aplikacja pamięta Cię, dopóki nie klikniesz «Wyloguj». Kod będzie potrzebny znowu tylko wtedy, gdy nie otworzysz aplikacji przez 90 dni.",
          "**Powiadomienia.** Na «Pulpicie» kliknij «Włącz powiadomienia» i zezwól na nie. «Sprawdź» wyśle próbne powiadomienie. Kliknąłeś «Nie zezwalaj»? Włącz je w ustawieniach telefonu, w powiadomieniach dla DevUz.",
          "Przychodzi dokładnie to, co wysyła bot, a sam bot działa jak zwykle. Na komputerze powiadomienia włącza się wierszem na górze «Pulpitu».",
        ],
      },
    ],
  },

  /* ── Zadania ─────────────────────────────────────────────────────── */
  "/admin/inbox": {
    what: "Wszystko, co czeka na odpowiedź człowieka, w jednej kolejce: kto dłużej czeka — wyżej. Odpowiedzieć można stąd, tą samą drogą co z karty leada.",
    items: [
      {
        id: "queue",
        title: "Co tu trafia",
        body: {
          manager: [
            "Od 25.10.2026 — **«Skrzynka»** obok «Zadania». Tu są Twoje kontakty, w których klient odpisał, a odpowiedzieć musi człowiek: AI oddało rozmowę albo kliknąłeś «Odpowiadam osobiście». Czyje — jak na [Pulpit](/admin/hq): kontakt z leadem — osoby, u której jest lead, bez leada — osoby, która prowadzi kontakt. Autoodpowiedzi („odpowiemy w godzinach pracy”) tu nie trafiają.",
            "Na górze — ile nowych zgłoszeń nikt jeszcze nie wziął, z linkiem do nich w [Leady](/admin). Wiersz, który czeka godzinę i dłużej, jest podświetlony na żółto. Rozmów prowadzonych przez AI tu nie ma: jej nie trzeba odpowiadać.",
          ],
          head: [
            "Od 25.10.2026 — **«Skrzynka»** obok «Zadania». Tu są kontakty całego zespołu, w których klient odpisał, a odpowiedzieć musi człowiek: AI oddało rozmowę albo przejęto ją przyciskiem «Odpowiadam osobiście», — oraz **wiadomości do bota**, gdzie rozmowę prowadzi człowiek, a klient napisał po jego odpowiedzi. Przy każdym wierszu — kto prowadzi. Autoodpowiedzi tu nie trafiają.",
            "Na górze — ile nowych zgłoszeń nikt jeszcze nie wziął, z linkiem do nich w [Leady](/admin). Wiersz, który czeka godzinę i dłużej, jest podświetlony na żółto. Rozmów prowadzonych przez AI tu nie ma: jej nie trzeba odpowiadać. Każda wiadomość klienta do bota jak dawniej przychodzi do Ciebie na Telegram jako «📩 Обращение в бота».",
          ],
          admin: [
            "Od 25.10.2026 — **«Skrzynka»** obok «Zadania». Tu są kontakty całego zespołu, w których klient odpisał, a odpowiedzieć musi człowiek: AI oddało rozmowę albo przejęto ją przyciskiem «Odpowiadam osobiście», — oraz **wiadomości do bota**, gdzie rozmowę prowadzi człowiek, a klient napisał po jego odpowiedzi. Przy każdym wierszu — kto prowadzi. Autoodpowiedzi tu nie trafiają.",
            "Na górze — ile nowych zgłoszeń nikt jeszcze nie wziął, z linkiem do nich w [Leady](/admin). Wiersz, który czeka godzinę i dłużej, jest podświetlony na żółto. Rozmów prowadzonych przez AI tu nie ma: jej nie trzeba odpowiadać. Każda wiadomość klienta do bota jak dawniej przychodzi do Ciebie na Telegram jako «📩 Обращение в бота».",
          ],
        },
      },
      {
        id: "layout",
        title: "Trzy kolumny: rozmowy, wątek, klient",
        body: [
          "Od 03.11.2026 «Skrzynka» wygląda jak «DevUz Biuro». **Po lewej** — rozmowy, które czekają na ciebie: kto dłużej czeka — wyżej, po prawej w wierszu — ile klient czeka, na żółto — godzinę i dłużej. Niebieskie kółko — kontakt z konta firmowego, fioletowe — zgłoszenie do bota studia. Kliknij wiersz — **pośrodku** otworzy się wątek: słowa klienta po lewej, nasze po prawej na niebiesko, przy naszym — «czeka na wysłanie» albo «nie wysłano», jeśli tak jest. Przy bocie jest tu tylko ostatnia wiadomość klienta: cała rozmowa — w Telegramie.",
          "**Po prawej** — klient: strona, z którego konta piszemy i kto prowadzi, niżej — **«Przebieg transakcji»**: te same etapy co na [Pulpicie](/admin/hq) i tablicy leadów, przebyte — zielonym ptaszkiem z datą, następny — na niebiesko. Przebyty etap zaznaczony przez pomyłkę zdejmuje się kliknięciem ([jak to działa](#leads-sales-marks)). Nad polem odpowiedzi czasem pojawia się **«Podpowiedź odpowiedzi»**: jeśli w słowach klienta rozpoznano zarzut («drogo», «jaka strona?», «przekażę szefowi»), to gotowa odpowiedź z «Odpowiedzi na zastrzeżenia». «Wstaw do odpowiedzi» wkłada tekst do pola — popraw pod klienta i wyślij; sam nie wychodzi. Na telefonie najpierw lista, kliknięcie otwiera wątek, «← Wszystkie rozmowy» wraca; karta klienta — pod wątkiem.",
        ],
      },
      {
        id: "reply",
        title: "Odpowiedz z wiersza",
        body: {
          manager: [
            "Pole odpowiedzi jest pod wątkiem, od razu otwarte; Ctrl+Enter — wyślij. Kontaktowi odpowiedź idzie z konta firmowego kontaktu, jak z pola pod [«Oś zdarzeń»](#leads-timeline) w karcie, a AI potem milczy. Nasze linki do makiet i realizacji są sprawdzane przed wysłaniem.",
            "Potrzebna cała rozmowa — **«Otwórz kartę»**: oś otworzy się na korespondencji. Kontakt bez leada otwiera się w [Zimne kontakty](/admin/prospect). Gdy odpowiedź wyszła, wiersz znika: wiadomość ma odpowiedź.",
          ],
          head: [
            "Pole odpowiedzi jest pod wątkiem, od razu otwarte; Ctrl+Enter — wyślij. Kontaktowi odpowiedź idzie z konta firmowego kontaktu, jak z pola pod [«Oś zdarzeń»](#leads-timeline) w karcie; klientowi bota — od bota studia, jak odpowiedź na «📩 Обращение в бота», a AI milczy jeszcze 7 dni. Nasze linki do makiet i realizacji są sprawdzane przed wysłaniem.",
            "Potrzebna cała rozmowa — **«Otwórz kartę»**: oś otworzy się na korespondencji. Kontakt bez leada otwiera się w [Zimne kontakty](/admin/prospect). Gdy odpowiedź wyszła, wiersz znika: wiadomość ma odpowiedź.",
          ],
          admin: [
            "Pole odpowiedzi jest pod wątkiem, od razu otwarte; Ctrl+Enter — wyślij. Kontaktowi odpowiedź idzie z konta firmowego kontaktu, jak z pola pod [«Oś zdarzeń»](#leads-timeline) w karcie; klientowi bota — od bota studia, jak odpowiedź na «📩 Обращение в бота», a AI milczy jeszcze 7 dni. Nasze linki do makiet i realizacji są sprawdzane przed wysłaniem.",
            "Potrzebna cała rozmowa — **«Otwórz kartę»**: oś otworzy się na korespondencji. Kontakt bez leada otwiera się w [Zimne kontakty](/admin/prospect). Gdy odpowiedź wyszła, wiersz znika: wiadomość ma odpowiedź.",
          ],
        },
      },
    ],
  },
  "/admin/tasks": {
    what: "Nasz wewnętrzny CRM: wszystko, co obiecujemy klientom i sobie nawzajem, jest zadaniem z terminem i osobą odpowiedzialną. Na górze — zadania dla ciebie («Dla mnie»), zadania zlecone przez ciebie («Zleciłem») i formularz «Zleć zadanie». Niżej na tej samej stronie — «Historia zadań»: co zrobione, niezrobione, anulowane i ile razy przesuwano termin. Sekcja jest otwarta dla wszystkich i nie zamyka się znacznikami: zadanie może dostać każdy, a przycisk bota przy zadaniu prowadzi tutaj.",
    items: [
      {
        id: "board",
        title: "Zadania: zlecanie, przyjmowanie, zamykanie",
        body: [
          "Zadania to osobna sekcja: przycisk **«Zadania»** w menu, zaraz za «Pulpit». Blok **«Zadania»** jest na górze strony, pod nim — «Historia zadań». Zadanie może zlecić każdy pracownik każdemu, także sobie: menedżer — kierownikowi, kierownik — właścicielowi, ktokolwiek — komukolwiek. Zadanie widzą zlecający i wykonawca; jeśli dotyczy projektu — także wszyscy, którzy otwierają kartę tego projektu.",
          "**«Dla mnie»** — zadania dla Ciebie: na górze najbliższy termin, niżej dalsze, zadania bez terminu — na samym końcu. Nowe jest oznaczone «nowe» i czeka na przycisk **«Przyjmij do realizacji»**: dzięki temu zlecający widzi, że zadanie zobaczyłeś i przyjąłeś. Przyjęte jest «w toku», a pod nim są **«Zrobione»** i **«Niezrobione»**. Zadanie, którego termin minął, jest podświetlone na czerwono i oznaczone «po terminie».",
          "**«Przesuń termin»** otwiera warianty: «+1 godz.», «Jutro 18:00», «+3 dni», «Tydzień» — albo własna data i godzina z przyciskiem «Przesuń na». «+1 godz.», «+3 dni» i «Tydzień» liczą się od terminu, a jeśli już minął albo terminu nie było — od bieżącej chwili, żeby nowy termin nie wypadł w przeszłości. Zadanie bez terminu ma w tym miejscu **«Ustal termin»** z tymi samymi wariantami. Termin przesuwa i wykonawca, i zlecający — drugiej stronie bot od razu pisze nowy termin. Każde przesunięcie zostaje w historii zadania: stary termin, nowy i kto przesunął.",
          "**«Zleciłem»** — zadania, które zleciłeś innym, i co się z nimi teraz dzieje: «nowe» (jeszcze nieprzyjęte), «w toku», «zrobione», «niezrobione», «po terminie». Zamknięte są tu widoczne jeszcze przez tydzień. «Zrobione» i «Niezrobione» klika tylko wykonawca — dlatego «zrobione» zawsze znaczy, że zrobił to sam wykonawca. Możesz przesunąć termin albo kliknąć **«Anuluj zadanie»**, jeśli zlecono je przez pomyłkę albo nie jest już potrzebne: zadanie stanie się «anulowane», wykonawca dostanie wiadomość, a przyciski w jego Telegramie zmienią się na «🚫 Задача отменена» (zadanie anulowane).",
          "**«Zleć zadanie»** — na dole bloku: «Komu» (pola wyboru: jedna osoba albo kilka), «Co zrobić», «Szczegóły (opcjonalnie)», «Projekt (opcjonalnie)» i «Termin» — «dziś do 18:00», «jutro» i «za 3 dni» (oba do 18:00), «bez terminu» albo «własna data». Czas wszędzie taszkencki. Projekt wybiera się z otwartych projektów sekcji [«Projekty»](/admin/projects): najpierw zakłada się tam projekt klienta, potem można przypisywać do niego zadania. Ani projekt, ani termin nie są obowiązkowe. Jeśli zaznaczysz kilka osób, każda dostaje własne zadanie z tym samym tekstem, terminem i projektem: każdy sam je przyjmuje i zamyka, termin przesuwa się każdemu osobno, a w «Zleciłem» widać, kto już zaczął, a kto jeszcze nie. Ty sam jesteś na liście zaznaczony od razu — odznacz się, jeśli zadanie nie jest dla ciebie. Nad przyciskiem widać po imionach, do kogo trafi zadanie; jeśli zaznaczony jesteś ty i współpracownik, jest tam też ostrzeżenie, że ty też dostaniesz własną kopię. Na stronie jednego zadania, do której prowadzi przycisk bota i powiadomienie na telefonie, są te same przyciski co na liście: «Przyjmij do realizacji», «Zrobione», «Niezrobione», przesunięcie terminu, a temu, kto zlecił, — «Edytuj». Gdy tylko zadanie zostanie zlecone, bot od razu pisze do wykonawcy na Telegramie — do każdej zaznaczonej osoby. Zadanie dla siebie od razu jest «w toku» — nie trzeba go przyjmować i bot o nim nie pisze. Kto co zlecił, przyjął, zamknął, przesunął i anulował, zapisuje się w dzienniku działań.",
        ],
      },
      {
        id: "mockup-order",
        title: "«Zlecenie makiety» w zadaniu",
        body: {
          manager: [
            "**«Zlecenie makiety»** — pytanie w formularzu «Zleć zadanie»: «Tak» lub «Nie». Jeśli w «Komu» zaznaczona jest osoba, która buduje makiety (właściciel), odpowiedź jest obowiązkowa — obok pytania pojawi się «obowiązkowo», a bez odpowiedzi zadanie nie zostanie zlecone. W zadaniach dla innych osób pytanie nie jest potrzebne i można je pominąć.",
            "«Tak» oznacza, że zlecasz makietę. W polu «Dla jakiego klienta» zacznij wpisywać firmę, numer zgłoszenia, stronę lub @nick i wybierz lead albo kontakt z listy — wyszukiwanie jest takie samo jak w «Znajdź sekcję lub firmę» i pokazuje tylko tych, których widzisz. «Strona klienta» przy kontakcie wpisze się sama, przy leadzie wpisz ją, na przykład tirex.uz. Wykonawca zobaczy pod zadaniem «Zlecenie makiety», dla kogo i stronę, a bot poda mu stronę w wiadomości o zadaniu.",
            "Gdy makieta powstanie i zostanie powiązana ze zleceniem, osobą odpowiedzialną za nią w [Makietach](/admin/mockups) zostaniesz ty — z dopiskiem «według zlecenia»: prowadzisz klienta przy tej makiecie, bot pisze do ciebie, gdy makieta zamyka się na hasło, i jest ona w twoich makietach na «Pulpicie». Zadanie zamknie się jako «Zrobione», pojawi się przy nim link «Makieta gotowa». Jeśli kierownik lub właściciel wyznaczył osobę odpowiedzialną ręcznie, ważniejsza jest osoba wyznaczona.",
          ],
          head: [
            "**«Zlecenie makiety»** — pytanie w formularzu «Zleć zadanie» i w [szybkim zadaniu](#hq-task) na «Pulpicie»: «Tak» lub «Nie». Jeśli zaznaczona jest osoba, która buduje makiety (właściciel), odpowiedź jest obowiązkowa — bez niej zadanie nie zostanie zlecone. W zadaniach dla innych osób pytanie nie jest potrzebne.",
            "«Tak» — zlecenie makiety: w «Dla jakiego klienta» wybierz lead lub kontakt wyszukiwaniem (tym samym co w «Znajdź sekcję lub firmę»), w «Strona klienta» — stronę, przy kontakcie wpisze się sama. Wykonawca widzi pod zadaniem «Zlecenie makiety», dla kogo i stronę; bot podaje mu stronę w wiadomości o zadaniu.",
            "Makieta zbudowana i powiązana ze zleceniem dostaje osobę odpowiedzialną «według zlecenia» — tego, kto zlecił zadanie; zadanie zamyka się jako «Zrobione», pojawia się przy nim «Makieta gotowa». Gotową makietę możesz sam powiązać z dowolnym otwartym zleceniem w [Makietach](/admin/mockups): wiersz «Zlecenie» przy makiecie, wybór zlecenia i «Powiąż». Osoba wyznaczona przez ciebie ręcznie jest ważniejsza niż zlecenie.",
          ],
          admin: [
            "**«Zlecenie makiety»** — pytanie w formularzu «Zleć zadanie» i w [szybkim zadaniu](#hq-task) na «Pulpicie»: «Tak» lub «Nie». Jeśli w «Komu» jesteś ty (budujesz makiety), odpowiedź jest obowiązkowa — bez niej zadanie nie zostanie ci zlecone. Dzięki temu każde zlecenie makiety przychodzi do ciebie z klientem i stroną, a nie jako prośba w czacie.",
            "Zlecenie widać pod zadaniem w «Dla mnie»: «Zlecenie makiety», dla kogo (link do leada lub kontaktu) i strona. **«Zbuduj prototyp»** otwiera [Prototypy](/admin/proto) z wpisaną stroną i wybranym zleceniem w polu «Według zlecenia z zadania». Zbudowany prototyp jest powiązany ze zleceniem, zadanie zamknięte jako «Zrobione», bot napisał do zlecającego. Szkic wiąże się ze zleceniem, ale zadanie zostaje otwarte: makiety dla klienta jeszcze nie ma.",
            "Makietę zbudowaną ręcznie (witryna) powiąż w [Makietach](/admin/mockups): przy makiecie jest wiersz «Zlecenie» — wybierz zlecenie (zlecenie z tą samą stroną jest wybrane od razu) i naciśnij «Powiąż». Osobą odpowiedzialną za makietę zostanie ten, kto ją zlecił, z dopiskiem «według zlecenia». Osoba wyznaczona ręcznie jest ważniejsza niż zlecenie.",
          ],
        },
      },
      {
        id: "history",
        title: "Edycja zadania i historia zadań",
        body: {
          manager: [
            "**«Edytuj»** — pod zadaniem, które zleciłeś, dopóki jest otwarte. Możesz poprawić «Co zrobić», «Szczegóły», «Wykonawca» i projekt, potem **«Zapisz»**. Termin się tu nie zmienia: służy do tego «Przesuń termin», który ma własną historię przesunięć. Zadania zleconego tobie nie edytujesz: jeśli się nie zgadzasz — «Niezrobione» albo przesunięcie terminu, a resztę ustal ze zlecającym.",
            "Zmieniłeś wykonawcę — u nowego zadanie zacznie się od nowa: «nowe», bot wyśle mu je jako nowe, przypomnienia od zera. Poprzedniemu zadanie zostanie zdjęte i dostanie o tym wiadomość. Zmieniłeś tekst albo projekt — bot napisze wykonawcy, co dokładnie się zmieniło, a wiadomość o zadaniu w jego Telegramie się zaktualizuje.",
            "Zadanie, z którym coś się działo, ma na dole **«Historia»**: kto zlecił, kto przyjął, kiedy i z jakiego terminu na jaki przesuwano, co zmieniano (było → jest), jak się skończyło. Czas taszkencki. Obok terminu widać, ile razy go przesuwano.",
            "**«Historia zadań»** — niżej na tej samej stronie (link «Historia zadań ↓» w nagłówku bloku przewija do niej). Są tam twoje zadania — zlecone przez ciebie i dla ciebie — z którymi w danym okresie coś się działo: zrobione, niezrobione, anulowane, przesunięty termin, zmienione. «Co» zostawia jeden rodzaj kroków, «Za» — 7, 30 albo 90 dni. Na górze — ile jest każdego rodzaju. To tylko podgląd: zadania zmienia się wyżej, w bloku «Zadania».",
          ],
          head: [
            "**«Edytuj»** — pod zadaniem, które zleciłeś, dopóki jest otwarte: «Co zrobić», «Szczegóły», «Wykonawca», projekt, potem **«Zapisz»**. Termin — przyciskiem «Przesuń termin», ma własną historię. Cudze zadania edytuje tylko ten, kto je zlecił: dzięki temu w historii zawsze widać, kto co zlecił.",
            "Zmieniłeś wykonawcę — u nowego zadanie zacznie się od nowa: «nowe», bot wyśle je jako nowe, przypomnienia od zera; poprzedni dostanie wiadomość, że zadanie mu zdjęto. Zmieniłeś tekst albo projekt — bot napisze wykonawcy, co dokładnie się zmieniło, i zaktualizuje wiadomość o zadaniu.",
            "Zadanie, z którym coś się działo, ma na dole **«Historia»**: kto zlecił, przyjął, przesuwał termin (z jakiego na jaki), co zmieniano (było → jest), jak się skończyło. Obok terminu — ile razy go przesuwano.",
            "**«Historia zadań»** — niżej na tej samej stronie (link «Historia zadań ↓» w nagłówku bloku przewija do niej). Są tam zadania całego zespołu, z którymi w danym okresie coś się działo: zrobione, niezrobione, anulowane, przesunięty termin, zmienione. Filtry: «Co» — rodzaj kroków, «Czyje» — jedna osoba (jej zadania i zlecone przez nią), «Za» — 7, 30 albo 90 dni. Na górze — podsumowanie, niżej — **«Według osób»**: ile zadań kto zrobił, nie zrobił, ile anulowano i ile razy przesuwano ich termin; liczone według wykonawcy, imię otwiera jego zadania. Częste przesunięcia i «niezrobione» u jednej osoby — powód do rozmowy. Zadań, które właściciel zlecił sam sobie, tu nie ma.",
          ],
          admin: [
            "**«Edytuj»** — pod zadaniem, które zleciłeś, dopóki jest otwarte: «Co zrobić», «Szczegóły», «Wykonawca», projekt, potem **«Zapisz»**. Termin — przyciskiem «Przesuń termin», ma własną historię. Cudze zadania edytuje tylko ten, kto je zlecił: dzięki temu w historii zawsze widać, kto co zlecił.",
            "Zmieniłeś wykonawcę — u nowego zadanie zacznie się od nowa: «nowe», bot wyśle je jako nowe, przypomnienia od zera; poprzedni dostanie wiadomość, że zadanie mu zdjęto. Zmieniłeś tekst albo projekt — bot napisze wykonawcy, co dokładnie się zmieniło, i zaktualizuje wiadomość o zadaniu.",
            "Zadanie, z którym coś się działo, ma na dole **«Historia»**: kto zlecił, przyjął, przesuwał termin (z jakiego na jaki), co zmieniano (było → jest), jak się skończyło. Obok terminu — ile razy go przesuwano.",
            "**«Historia zadań»** — niżej na tej samej stronie (link «Historia zadań ↓» w nagłówku bloku przewija do niej). Są tam wszystkie zadania studia, z którymi w danym okresie coś się działo: zrobione, niezrobione, anulowane, przesunięty termin, zmienione. Filtry: «Co» — rodzaj kroków, «Czyje» — jedna osoba (jej zadania i zlecone przez nią), «Za» — 7, 30 albo 90 dni. Na górze — podsumowanie, niżej — **«Według osób»**: ile zadań kto zrobił, nie zrobił, ile anulowano i ile razy przesuwano ich termin; liczone według wykonawcy, imię otwiera jego zadania. Kierownik widzi to samo, poza zadaniami, które zleciłeś sam sobie.",
          ],
        },
      },
      {
        id: "filter",
        title: "Kolejność, grupy i projekty w zadaniach",
        body: [
          "Domyślnie zadania idą od najbliższego terminu do najdalszego: co się pali, jest na górze. Zadania bez terminu — na końcu, najnowsze pierwsze. W «Zleciłem» najpierw są otwarte, niżej — zamknięte w ciągu tygodnia.",
          "Nad listami jest filtr. **«Grupuj»**: «bez grupowania» (po prostu według terminu), «według terminu» — grupy «Po terminie», «Termin dziś», «Termin jutro», «W ciągu 7 dni», «Później», «Bez terminu»; «według projektu» — zadania każdego projektu razem, «Bez projektu» na końcu; «według osoby» — w «Dla mnie» według zlecającego, w «Zleciłem» — według wykonawcy. Wewnątrz grupy kolejność jest ta sama — od najbliższego terminu.",
          "**«Projekt»** zostawia zadania jednego projektu albo «Bez projektu». Wybierz i kliknij **«Pokaż»**. Wybór zapisuje się w adresie strony: nie resetuje się po kliknięciu przycisków w zadaniach, a stronę z nim możesz dodać do zakładek przeglądarki.",
          "Zadanie z projektem ma w wierszu jego nazwę — kliknij, a otworzy się karta projektu. W karcie projektu są wszystkie jego zadania i link «Zleć zadanie»: otwiera sekcję [«Zadania»](/admin/tasks) z tym projektem już wybranym w formularzu.",
        ],
      },
      {
        id: "bot",
        title: "Zadania w Telegramie i przypomnienia",
        body: {
          manager: [...TASKS_BOT, "Jeśli nie potrzebujesz wiadomości o zadaniach w Telegramie, wyłącza je kierownik albo właściciel — polem «Zadania» w Twoich powiadomieniach. Zadania zostają przy tym w sekcji «Zadania», a dźwięk w przeglądarce działa jak wcześniej."],
          head: [...TASKS_BOT, "Wiadomości o zadaniach wyłącza się polem «Zadania» w [powiadomieniach](#team-notices) danej osoby — u siebie i u swoich menedżerów zmieniasz je w sekcji «Zespół». Zadania zostają przy tym w sekcji «Zadania», a dźwięk w przeglądarce działa."],
          admin: [...TASKS_BOT, "Wiadomości o zadaniach wyłącza się polem «Zadania» w [powiadomieniach](#team-notices) — u każdego pracownika, w sekcji «Zespół». Zadania zostają przy tym w sekcji «Zadania», a dźwięk w przeglądarce działa."],
        },
      },
      {
        id: "alerts",
        title: "Dźwięk i powiadomienia w przeglądarce",
        body: [
          "Dopóki panel jest otwarty — w dowolnej sekcji — co 45 sekund pyta serwer, czy jest coś nowego: zadanie zlecone Tobie, przesunięcie terminu albo anulowanie Twojego zadania przez zlecającego lub krok w zadaniu, które Ty zleciłeś (przyjęte, zrobione, niezrobione, przesunięty termin). Jeśli tak — rozlega się krótkie «ding-dong», w prawym dolnym rogu pojawia się okienko z przyciskiem «Otwórz zadania», a sekcja «Zadania», jeśli jest otwarta, odświeża się sama.",
          "Żeby dodatkowo wyskakiwało powiadomienie systemowe — nawet gdy karta przeglądarki jest zwinięta — kliknij **«Włącz powiadomienia»** w bloku zadań i zezwól na nie w oknie przeglądarki. Przeglądarka pyta o zgodę dopiero po kliknięciu — dlatego jest przycisk. Po wyrażeniu zgody w jego miejscu pojawia się «Powiadomienia włączone».",
          "Jeśli przeglądarka odmówiła, zamiast przycisku zobaczysz podpowiedź: na powiadomienia można zezwolić w ustawieniach strony (ikona po lewej stronie adresu). Dźwięk przeglądarka włącza po pierwszym kliknięciu w panelu — wcześniej strona nie może odtwarzać dźwięku, tak działają wszystkie przeglądarki. Twoje własne działania nie są oznaczane dźwiękiem. Panel zamknięty — w przeglądarce nic się nie pojawia, zostaje Telegram.",
        ],
      },
    ],
  },

  /* ── Лиды ─────────────────────────────────────────────────────────── */
  "/admin": {
    what: "Strona główna panelu i wszystkie zgłoszenia klientów: z czatu na stronie, formularza, bota w Telegramie, witryny, «Sygnałów skauta» i Twoich kontaktów. Widać tu, kto napisał, czego potrzebuje, jak pilna jest sprawa i kto się nią zajmuje. Każde działanie na leadzie — przejęcie, otwarcie danych kontaktowych, zmiana statusu — trafia do dziennika z imieniem i godziną.",
    items: [
      {
        id: "home",
        title: "Co jest na stronie «Leady»",
        body: {
          manager: [
            "«Leady» to tylko lista: wyszukiwanie, filtry i tabela. Wszystko inne, co wcześniej stało tu nad listą, przeniosło się: rekomendacje i «Plan i wykonanie» — na dół [«Pulpit»](/admin/hq), pieniądze — do [Finansów](/admin/finance), zadania — do sekcji [«Zadania»](#tasks-board).",
            "Na górze — **«Znajdź leada»**: wpisz część nazwy firmy, imienia, numer zgłoszenia lub branżę i kliknij «Szukaj». Szukamy wśród leadów, które widzisz: wolnych i twoich. Niżej — chipy «wszystkie leady / wolne / moje leady» z liczbą obok, priorytet i status, potem sama [lista](#leads-list). «Wyczyść» usuwa wyszukiwanie.",
            "Pod listą — zwinięty przycisk [«Dodaj leada ręcznie»](#leads-add): klient przyszedł z pominięciem strony i bota.",
          ],
          head: [
            "«Leady» to tylko lista: wyszukiwanie, filtry i tabela. Bloki tygodniowe, które wcześniej stały tu nad listą — «Na dziś», zespół w tym tygodniu, rekomendacje, «Najlepsi w tygodniu», «Plan i wykonanie» — są teraz na dole [«Pulpit»](/admin/hq), zadania — w sekcji [«Zadania»](#tasks-board).",
            "Na początku — **«Czeka na Twoją decyzję»**: prośby menedżerów o przekazanie leada koledze (szczegóły — [przekazanie leada](#leads-transfer)). Niżej — **«Znajdź leada»**: część nazwy firmy, imienia, numer zgłoszenia lub branża. Obok — **«Czyje»**: «wszystkie», «wolne», «moje leady» albo konkretny pracownik — tak ogląda się leady jednego menedżera.",
            "Pod wyszukiwaniem — chipy «wszystkie leady / wolne / moje leady» z liczbą obok, priorytet i status, potem [lista](#leads-list). «Wyczyść» usuwa wyszukiwanie i wybór osoby. Pod listą — zwinięte [«Dodaj leada ręcznie»](#leads-add).",
            "Zespół to menedżerowie przypisani do ciebie w sekcji [Zespół](/admin/team): ich tygodniowe liczby są w tabeli na dole «Pulpit».",
          ],
          admin: [
            "«Leady» to tylko lista: wyszukiwanie, filtry i tabela. Zakładek tu już nie ma: «Dziś» powtarzało «Pulpit», a «Finanse» — sekcję «Finanse». «Kasa w podziale na miesiące», «Oczekiwane płatności» i terminy podatkowe — w [Finansach](/admin/finance); wskazówki «Na dziś», zespół w tym tygodniu, najlepsi, rekomendacje i «Plan i wykonanie» — na dole [«Pulpit»](/admin/hq); umowy do podpisu — w «Wymaga uwagi» na «Pulpit».",
            "Na początku — **«Czeka na Twoją decyzję»**: prośby o przekazanie leada koledze. Niżej — **«Znajdź leada»** (część nazwy firmy, imienia, numer zgłoszenia lub branża) i **«Czyje»**: «wszystkie», «wolne», «moje leady» albo konkretny pracownik.",
            "Pod wyszukiwaniem — chipy «wszystkie leady / wolne / moje leady» z liczbą, priorytet i status, potem [lista](#leads-list); pod listą — zwinięte [«Dodaj leada ręcznie»](#leads-add). Stare zakładki w przeglądarce prowadzą tam, gdzie to jest teraz: «Dziś» — na «Pulpit», «Finanse» — do «Finanse», «Zespół» — na dół «Pulpit».",
            "Odwiedziny strony z Metriki i Google Analytics — osobna sekcja [Ruch](/admin/traffic): widzisz ją ty i kierownicy.",
            "Zadania — w sekcji [«Zadania»](#tasks-board), na «Leady» jest o nich jedna linia z linkiem.",
            "Nic z zakładki «Dziś» nie zginęło: wiersze «Wymaga uwagi» na «Pulpit» — umowy do podpisu, leady bez ruchu, przepadłe propozycje — to właśnie lista spraw na dzień.",
          ],
        },
      },
      {
        id: "tasks",
        title: "Zadania — teraz osobna sekcja",
        body: ["Zadań nie ma już na stronie «Leady»: to osobny przycisk [«Zadania»](/admin/tasks) w menu, zaraz za «Pulpit». Tam są «Dla mnie», «Zleciłem», «Zleć zadanie» i «Historia zadań» — szczegóły w punkcie [zadania](#tasks-board). Na «Leady» w ich miejscu została jedna linia z linkiem do nowej sekcji, żeby nikt nie szukał zadań po staremu."],
      },
      {
        id: "queue",
        title: "Jak lead trafia do człowieka: kolejka",
        body: {
          manager: [
            "Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie. Kiedyś jedna szybka osoba zabierała wszystko, a na zimne kontakty nikomu nie zostawało czasu.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (w weekendy lead też idzie kolejką, ale cudze pół godziny nie blokuje: bierze każdy, kto jest na miejscu), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostajesz w Telegramie kartę: «⏳ Лид ваш на 30 минут — до 14:30» (lead jest Twój przez 30 minut, do 14:30). Pozostali jej nie widzą i nie mogą go przejąć.",
            "Nie przejmiesz go w ciągu 30 minut — lead trafia do kolejnej osoby, a Ty dostajesz «⌛ 30 минут на лид вышли» (30 minut minęło). Przepuszczenie liczy się jako otrzymana szansa: inaczej osoba na urlopie zawsze byłaby pierwsza w kolejce, a każdy lead czekałby na nią pół godziny. **Od 13.10 w dzień lead jest najpierw proponowany tym, którzy są na miejscu**: byli w panelu, klikali przyciski w bocie albo coś robili w ostatnich 30 minutach. Wśród nich — ta sama zasada «kto ma mniej». Nikogo na miejscu — jak wcześniej, wszystkim po kolei. Dlatego trzymaj panel otwarty albo odpowiadaj botowi — wtedy leady przyjdą do Ciebie. **Trzy leady z rzędu przepadły w ciągu dnia** — do końca dnia kolejka Cię pomija, bot napisze «🧊», kierownik też się dowie; jutro znów jesteś w kolejce. Nocna zasada się nie zmienia.",
            "Jeśli nikt nie przejmie leada przez całą rundę, otwiera się on dla wszystkich: «🔓 Никто из очереди не взял — лид открыт всем. Берёт первый, кто нажмёт» (nikt z kolejki nie wziął, lead jest otwarty dla wszystkich, bierze pierwszy, kto kliknie).",
            "**W nocy, od 18:00 do 08:00**, zasada pół godziny nie obowiązuje — lead od razu jest otwarty dla wszystkich w kolejce. Ale można przejąć nie więcej niż równą część na miesiąc: jeśli swoją część już wykorzystałeś, w karcie leada zobaczysz «🌙 …Twoja część na ten miesiąc jest już wykorzystana — trafi do osób, które mają mniej». Inaczej w nocy leady znów zabierałby ten, kto nie śpi. Jeśli właściciel zdjął Ci limit leadów, udział Cię nie dotyczy: w nocy bierzesz leady bez ograniczeń, w dzień kolejka jest ta sama. Od 03.11.2026 udział blokuje tylko wtedy, gdy jest komu ustąpić: na miejscu jest kolega, który ma mniej leadów, a lead czeka krócej niż 10 minut. Nikogo więcej nie ma albo lead czeka dłużej — bierze ten, kto jest na miejscu, bez limitu. Rano do 08:00 i wieczorem po 18:00 cudze pół godziny w kolejce też nie blokuje.",
            "Dopóki lead jest w kolejce u kogoś innego, nick klienta w karcie jest ukryty — «ukryty — lead nie jest teraz Twój». Leady z Twoich własnych [kontaktów](/admin/prospect) nie trafiają do kolejki: od razu są Twoje.",
            "Jeśli karta nie dotarła do nikogo — na przykład serwer na chwilę stracił połączenie z Telegramem — przyjdzie później, gdy połączenie wróci, z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie: karta nie dotarła przez awarię łączności). Lead jest wtedy rozdzielany od nowa według zasad godziny, w której przyszło dosłanie: w dzień — po kolei, w nocy — wszystkim. Leady starsze niż trzy doby nie są dosyłane.",
            "**Lead «od partnera» — poza kolejką.** To firma, którą partner przypisał w swoim panelu: poręczył za klienta i trzeba zadzwonić jako pierwsi. Taki lead jest od razu otwarty dla wszystkich — bierze pierwszy, kto kliknie «✅ Взять в работу», bez pół godziny i bez nocnego udziału. Karta trafia do wszystkich menedżerów z nagłówkiem «🤝 Приоритет: клиента привёл партнёр», a dopóki nikt go nie weźmie, bot co 15 minut od 08:00 do 18:00 wysyła ją ponownie: «⏰ Клиент от партнёра всё ещё ничей». Przypomnienia ustają, gdy ktoś weźmie leada, albo po tygodniu, jeśli nie weźmie nikt.",
            "**Lead «🤖 Ответ на касание автопрогона»** — klient odpowiedział na pierwszą wiadomość, którą napisał nie człowiek, a automatyczne kontakty studia. Taki lead idzie tą samą kolejką co zgłoszenia ze strony — w dzień po kolei, w nocy do wszystkich. W nagłówku karty — strona firmy, jej nisza i co odpowiedział klient; pierwsza wiadomość i cała rozmowa — w karcie leada. Wziąłeś — lead i rozmowa są Twoje: model dalej odpowiada klientowi w Twoim imieniu, a «Odpowiadam osobiście» w karcie leada przekazuje rozmowę Tobie. Odpowiadaj szybko: klient napisał przed chwilą. Od 13.10 taki lead pojawia się nie przy pierwszej odpowiedzi, lecz gdy klient zgodzi się na darmową makietę («+», «tak», «давайте»), poprosi o telefon albo o przesłanie czegoś. Wcześniej — przy «Dobry wieczór», pytaniach, «zobaczę» — rozmowę prowadzi model: odpowiada i znów proponuje makietę. W karcie leada jest cała ta rozmowa.",
          ],
          head: [
            "Stoisz w kolejce na równi z menedżerami — zasady są te same. Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (w weekendy lead też idzie kolejką, ale cudze pół godziny nie blokuje: bierze każdy, kto jest na miejscu), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostaje ona w Telegramie «⏳ Лид ваш на 30 минут» (lead jest Twój przez 30 minut). Pozostali tej karty nie widzą.",
            "Nie przejął w 30 minut — lead trafia do kolejnej osoby. Przepuszczenie liczy się jako otrzymana szansa. Jeśli nikt nie przejmie go przez całą rundę, lead otwiera się dla wszystkich: bierze pierwszy, kto kliknie. **Od 13.10 w dzień lead najpierw trafia do tych, którzy są na miejscu** — byli w panelu, klikali przyciski w bocie albo coś robili w ostatnich 30 minutach; wśród nich — to samo «kto ma mniej». Nikogo na miejscu — jak wcześniej. **Trzy przepadłe propozycje z rzędu w ciągu dnia** — osoba do końca dnia wypada z kolejki; ona, Ty i właściciel dostajecie wiersz «🧊 … сгорели 3 предложения тёплых лидов подряд» (pod polem «Raporty»). Jutro znów jest w kolejce.",
            "**W nocy, od 18:00 do 08:00**, lead od razu jest otwarty dla wszystkich w kolejce, ale każdy może przejąć nie więcej niż równą część na miesiąc. Jeśli właściciel zdjął Ci limit leadów, udział Cię nie dotyczy: w nocy bierzesz leady bez ograniczeń, w dzień kolejka jest ta sama. Od 03.11.2026 udział blokuje tylko wtedy, gdy jest komu ustąpić: na miejscu jest kolega, który ma mniej leadów, a lead czeka krócej niż 10 minut. Nikogo więcej nie ma albo lead czeka dłużej — bierze ten, kto jest na miejscu, bez limitu. Rano do 08:00 i wieczorem po 18:00 cudze pół godziny w kolejce też nie blokuje.",
            "Dopóki lead jest wolny, jego danych kontaktowych i korespondencji nie otworzysz także Ty — najpierw «Przejmij». Nick klienta jest ukryty przed wszystkimi, do których kolejka jeszcze nie doszła. Inaczej kolejkę dałoby się obejść jednym przyciskiem.",
            "W kolejce są tylko osoby z połączonym Telegramem: bez niego nie da się człowiekowi powiedzieć, że lead jest jego.",
            "Karta, która przez awarię łączności serwera z Telegramem nie dotarła do nikogo, jest dosyłana sama, gdy połączenie wróci — z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Leady starsze niż trzy doby nie są dosyłane.",
            "**Lead «od partnera» — poza kolejką**: firma przypisana przez partnera. Otwarty od razu dla wszystkich, bierze pierwszy, kto kliknie; karta «🤝 Приоритет: клиента привёл партнёр» idzie do wszystkich menedżerów i do Ciebie, a dopóki lead jest niczyj, bot powtarza ją co 15 minut od 08:00 do 18:00 («⏰ Клиент от партнёра всё ещё ничей»). Pilnuj, żeby takie leady nie wisiały: przyprowadzają je ludzie, którym studio płaci prowizję.",
            "**Lead «🤖 Ответ на касание автопрогона»** — klient odpowiedział na pierwszą wiadomość automatycznych kontaktów (pisze ją panel sama, bez menedżera — zob. [automatyczne kontakty](#prospect-autopilot)). Taki lead idzie tą samą kolejką co zgłoszenia ze strony: w dzień po kolei, w nocy do wszystkich z równym udziałem. Kto go weźmie, dostaje i lead, i rozmowę: model dalej odpowiada w jego imieniu. Od 13.10 taki lead pojawia się nie przy pierwszej odpowiedzi, lecz gdy klient zgodzi się na darmową makietę («+», «tak», «давайте»), poprosi o telefon albo o przesłanie czegoś. Wcześniej — przy «Dobry wieczór», pytaniach, «zobaczę» — rozmowę prowadzi model: odpowiada i znów proponuje makietę. W karcie leada jest cała ta rozmowa.",
          ],
          admin: [
            "Jesteś **poza kolejką**: możesz przejąć dowolny wolny lead w dowolnej chwili, a limit nocnej części Cię nie dotyczy. W kolejce stoją menedżerowie i kierownicy z połączonym Telegramem.",
            "W dzień (08:00–18:00 czasu taszkenckiego, codziennie) lead jest proponowany jednej osobie na 30 minut — tej, która w miesiącu ma najmniej «przejął + przepuścił». Ty i czat sprzedaży dostajecie kopię: «👁 В очереди у @ник до 14:30. Вы вне очереди — можете взять сами» (w kolejce u @nick do 14:30, jesteś poza kolejką, możesz przejąć sam). W karcie leada też widzisz, u kogo jest teraz; pozostałym to imię się nie wyświetla, żeby nie zaczynały się spory.",
            "Nie przejął w 30 minut — do następnej osoby; minęła runda — lead otwarty dla wszystkich. Jeśli przejmiesz lead, który jest właśnie komuś proponowany, jego propozycja się zamyka i nie liczy się mu jako przepuszczenie. Od 13.10 w dzień lead jest najpierw proponowany tym, którzy są na miejscu: byli w panelu, klikali przyciski w bocie albo coś robili w dzienniku w ostatnich 30 minutach; wśród nich — dawne «kto mniej przejął + przegapił». Nikogo na miejscu — jak wcześniej. Trzy przepadłe propozycje z rzędu w ciągu dnia — osoba wypada z kolejki do końca dnia, Ty i kierownicy dostajecie «🧊 …» (pole «Raporty»). Nocna zasada bez zmian.",
            "W nocy (18:00–08:00) lead jest od razu otwarty dla wszystkich, ale każdy bierze nie więcej niż równą część na miesiąc: «przejęte od początku miesiąca ÷ liczba osób w kolejce», z zaokrągleniem w górę. Komu zdjąłeś limit w [Zespole](/admin/team) («Leady: bez limitu»), ten w nocy bierze bez udziału, zob. [limit leadów](#team-unlimited).",
            "Z pominięciem kolejki idą: leady z kontaktów (od razu do osoby, która pisała) i zamówienia z witryny powyżej $10 000 — przychodzą tylko do Ciebie.",
            "Jeśli karta leada nie dotarła do nikogo — serwer stracił połączenie z Telegramem — sweep dośle ją, gdy Telegram znów odpowie: z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Sprawdzanie co pięć minut; leady starsze niż trzy doby nie są dosyłane. Tak 26 września dotarł nocny lead z formularza, który przez dobę leżał niczyj.",
            "**Lead «od partnera» — poza kolejką**: tworzy go samo przypisanie klienta przez partnera ([Partnerzy](/admin/partners)). Otwarty od razu dla wszystkich, bez pół godziny i nocnego udziału. Pierwsza karta «🤝 Приоритет: клиента привёл партнёр» — menedżerom, kierownikom i Tobie; przypomnienia «⏰ Клиент от партнёра всё ещё ничей» — menedżerom i kierownikom co 15 minut od 08:00 do 18:00, dopóki ktoś nie weźmie leada, ale nie dłużej niż tydzień. Ustawienia powiadomień pracownika nie dotyczą tych kart — to priorytet.",
            "**Leady [automatycznych kontaktów](#prospect-autopilot)** idą kolejką jak zgłoszenia ze strony, a nie „do tego, kto pisał”: nie pisał człowiek. Karta — «🤖 Ответ на касание автопрогона» ze stroną, niszą firmy i słowami klienta. Prośba o prototyp rozchodzi się rozsyłką «🔥 Нужен прототип», a prośba, żeby więcej nie pisać, leada nie zakłada. Od 13.10 taki lead pojawia się nie przy pierwszej odpowiedzi, lecz gdy klient zgodzi się na darmową makietę («+», «tak», «давайте»), poprosi o telefon albo o przesłanie czegoś. Wcześniej — przy «Dobry wieczór», pytaniach, «zobaczę» — rozmowę prowadzi model: odpowiada i znów proponuje makietę. W karcie leada jest cała ta rozmowa.",
          ],
        },
      },
      {
        id: "take",
        title: "Przejęcie leada i rezygnacja z niego",
        body: [
          "Leada przejmiesz w jego karcie przyciskiem **«Przejmij»** albo od razu w Telegramie przyciskiem **«✅ Взять в работу»** (weź do pracy) pod kartą. Od tej chwili lead jest Twój: status «w toku», po 4 godzinach przyjdzie automatyczne przypomnienie «Взят в работу — что дальше?» (przejęty — co dalej?), a wszystkim, do których przyszła karta, zmieni się ona na «✅ В работе у @ник» (w toku u @nick). Jeśli lead przyszedł z bota, a klient pisze do bota dalej, każda jego wiadomość przychodzi do Ciebie wierszem «💬 Клиент написал в бот» z linkiem do karty, a cała korespondencja dopisuje się do karty. W nocy, od 21:00 do 08:00, wiersza nie ma, ale korespondencja w karcie jest. Wiersz wyłącza zaznaczenie «Odpowiedzi klientów na kontakty».",
          "Jeśli dwie osoby klikną jednocześnie, lead dostanie jedna, a druga zobaczy w panelu «Tego leada przejął już ktoś inny» (w Telegramie — «Лида уже взял кто-то другой»). Jeśli to nie Twoja kolej — «To nie Twoja kolej: lead jest teraz zaproponowany komuś innemu» (w Telegramie — «Не ваша очередь»). Komu dokładnie — celowo nie jest mówione. Jeśli karta wolnego leada była u Ciebie otwarta, a w tym czasie przejęła go inna osoba, przy następnym kliknięciu zamiast karty zobaczysz «Tego leada przejęła już inna osoba…»: przejęty lead jest otwarty tylko dla osoby, która go prowadzi, kierownika i właściciela. Wróć do listy, wolne leady są tam.",
          "**«🗄 Отклонить»** (odrzuć) w Telegramie to decyzja «ten klient nie jest nam potrzebny». Lead najpierw zostaje przypisany do osoby, która kliknęła, a potem dostaje status «odłożony»: odmowa musi mieć autora, a w dzienniku widać, kto zdecydował.",
          "Przejąłeś, ale nie możesz go prowadzić — kliknij **«Zwróć do kolejki»** w karcie. Lead znów będzie wolny i otworzy się dla wszystkich, a Twoje automatyczne przypomnienia do niego zostaną anulowane. Nie pójdzie od nowa przez całą kolejkę: pół godziny na każdą osobę to za długo dla leada, z którym już pracowano.",
        ],
      },
      {
        id: "trash",
        title: "«🗑 Мусор» i «🗑 Do śmieci»: usuń leada, który nie jest leadem",
        body: {
          manager: [
            "Od 03.11.2026 — także u menedżerów. Pod kartą leada na prywatnym czacie bota jest **«🗑 Мусор»**, w karcie leada w panelu i w [«Rozpatrz leady»](#leads-sort) — **«🗑 Do śmieci»**. To dla zgłoszeń, które leadami nie były: spam, test, pracownik napisał do bota, przypadkowa osoba. Kliknięcie usuwa leada w całości i zdejmuje go z kolejki ogólnej: nikt go już nie dostanie, we wszystkich kopiach karty w bocie pojawia się «🗑 Удалён как мусор — @nick».",
            "Można usunąć niczyjego leada z kolejki ogólnej i swojego. Cudzego — nie: usuwa go ten, kto prowadzi, kierownik albo właściciel. Usuniętego nie da się przywrócić, dlatego panel zapyta «na pewno?». Właściciel i kierownik widzą wiersz «usunął leada jako śmieć» z tym, co było w leadzie. Prawdziwy klient bez zainteresowania to «Przegrane» albo «🗄 Отклонить», a nie śmieć.",
          ],
          head: [
            "Pod kartą leada na prywatnym czacie bota — **«🗑 Мусор»**, w karcie leada w panelu i w [«Rozpatrz leady»](#leads-sort) — **«🗑 Do śmieci»**. To dla zgłoszeń, które leadami nie były: spam, test, pracownik napisał do bota. Kliknięcie usuwa leada z bazy w całości i zdejmuje go z kolejki, we wszystkich kopiach karty pojawia się «🗑 Удалён как мусор — @nick». Ty usuwasz każdego leada.",
            "Od 03.11.2026 przycisk mają też menedżerowie: mogą usunąć niczyjego leada z kolejki ogólnej i swojego, cudzego — nie. Każde usunięcie przez menedżera przychodzi do ciebie wierszem «🗑 @nick usunął leada jako śmieć» z nazwą i tym, czego chciał klient (w dzień, w «Raporty»; w nocy — tylko w dzienniku). Usuniętego nie da się przywrócić: w dzienniku — numer zgłoszenia, kto kliknął i co było w leadzie. Prawdziwy klient, którego nie potrzebujemy, — «🗄 Отклонить».",
          ],
          admin: [
            "Pod kartą leada na prywatnym czacie bota — **«🗑 Мусор»**, w karcie leada w panelu i w [«Rozpatrz leady»](#leads-sort) — **«🗑 Do śmieci»**. To dla zgłoszeń, które leadami nie były: spam, test, pracownik napisał do bota. Kliknięcie usuwa leada z bazy w całości i zdejmuje go z kolejki, we wszystkich kopiach karty pojawia się «🗑 Удалён как мусор — @nick». Ty usuwasz każdego leada.",
            "Od 03.11.2026 przycisk mają też menedżerowie — twoja decyzja: mogą usunąć niczyjego leada z kolejki ogólnej i swojego, cudzego — nie. Każde usunięcie przez menedżera przychodzi do ciebie wierszem «🗑 @nick usunął leada jako śmieć» z nazwą i tym, czego chciał klient (w dzień, w «Raporty»; w nocy — tylko w [dzienniku](/admin/audit)). Usuniętego nie da się przywrócić: w dzienniku — numer zgłoszenia, kto kliknął i co było w leadzie. Prawdziwy klient, którego nie potrzebujemy, — «🗄 Отклонить».",
          ],
        },
      },
      {
        id: "sort",
        title: "«Rozpatrz leady»: zaległe po jednym",
        body: [
          "Przycisk **«Rozpatrz leady»** — nad wyszukiwaniem w «Leady». Otwiera leady po jednym, dużą kartą: najpierw twoje leady «w toku» bez ruchu 7+ dni (ta sama zasada, co bot «Порядок в лидах»), potem niczyje nowe z kolejki ogólnej, najstarsze pierwsze. Na górze — ile zostało. Decyzja — od razu następny.",
          "Niczyjemu: **«Weź do pracy»** (według tych samych zasad kolejki, co przycisk w karcie), **«🗑 Do śmieci»** albo **«Pomiń»**. Swojemu: **«🏆 Wygrane»** (od razu założenie projektu), **«❌ Przegrane»**, «⏳ Nadal w toku — kontakt za: jutro / 3 dni / tydzień» (ustawia zadanie «Skontaktuj się»; trzy razy z rzędu nie można), «🗑 Do śmieci» albo «Pomiń». «Pomiń» nic nie zmienia w bazie — lead wróci przy następnym wejściu. Wynik każdego przycisku — paskiem na górze przez parę sekund, w całym panelu ekran po kliknięciu zostaje na miejscu.",
        ],
      },
      {
        id: "bot-inbox",
        roles: ["admin", "head"],
        title: "«📩 Обращение в бота»: widzieć klienta i odpowiadać mu z Telegrama",
        body: [
          "Każda wiadomość klienta na prywatnym czacie bota studia przychodzi Tobie i kierownikowi jako **«📩 Обращение в бота»** (wiadomość do bota): kto pisze (imię i @nick), jego słowa, co odpowiedział bot oraz numer zgłoszenia z linkiem do karty, jeśli zgłoszenie już jest. Dzięki temu osoba, która sama przyszła do bota, nie zginie: wcześniej korespondencję widział tylko model, a FloraEdu Global znalazł się dopiero wtedy, gdy właściciel zaczął szukać (decyzja właściciela z 23.10.2026). Jeśli klient przysłał nie tekst, tylko wiadomość głosową, zdjęcie, plik, wideo albo naklejkę, zaraz po wiadomości przyjdzie sama ta rzecz jako kopia: odpowiedzieć można i na wiadomość, i na kopię. Gdy model nie odpowie (proxy i zapasowa droga do modelu leżą, na ProxyAPI skończyły się pieniądze), klient dostaje «Dziękujemy, wiadomość dotarła i przekazaliśmy ją menedżerowi…», a w wiadomości zamiast odpowiedzi bota stoi «⚠️ Модель не ответила…»: odpowiedz mu sam, inaczej będzie czekał (tak 26.10.2026 o mało nie przepadło zgłoszenie na sklep internetowy).",
          "**Odpowiedź klientowi** — w Telegramie kliknij przy tej wiadomości «Ответить» (Odpowiedz) i napisz. Odpowiedź idzie do klienta od bota studia, a nie z Twojego konta: tekst, zdjęcie, plik, wiadomość głosowa lub kółko wideo, bez dopisku «переслано» (przekazano). Bot potwierdzi «✅ Ушло клиенту от бота студии», a drugi czytelnik dostanie «✍️ … ответил в боте», żebyście nie odpowiadali we dwóch. Nie poszło (klient zamknął czat z botem) — «⚠️ Не ушло…». W dzienniku zostaje «odpowiedział klientowi przez bota studia», a odpowiedź dopisuje się do korespondencji w karcie.",
          "**Po Twojej odpowiedzi model milczy 7 dni**: rozmowę prowadzisz Ty. Nowe wiadomości klienta przychodzą tak samo, jako «📩 Обращение в бота», z dopiskiem «🤐 Модель молчит: разговор ведёт …». Każda Twoja odpowiedź przedłuża te 7 dni; minęły bez odpowiedzi — model znowu odpowiada sam i widzi Twoje odpowiedzi. Jeśli lead jest u menedżera, on nadal dostaje «💬 Клиент написал в бот»; jeśli lead jest Twój, drugiej wiadomości nie ma.",
          "**W nocy, od 21:00 do 08:00, wiadomości nie przychodzą** (zasada «W nocy bot milczy»): bot odpowiada klientowi, a Tobie o 08:00 przychodzi po jednej wiadomości na każdego, kto pisał w nocy — «🌙 Писал боту ночью» z ostatnimi słowami, i na nią też można odpowiedzieć. Wiadomości wyłącza zaznaczenie «Wiadomości do bota» w [Zespole](/admin/team). Pracownicy, którzy piszą do bota, tu nie trafiają: odpowiada im asystent.",
        ],
      },
      {
        id: "bot-write",
        title: "«Do klienta od bota studia»: napisz pierwszy",
        body: [
          "Jeśli klient sam pisał do bota studia, w polu odpowiedzi pod [«Oś zdarzeń»](#leads-timeline) w karcie jest wybór **«Do klienta od bota studia»**. Wybierz go, napisz tekst i **«Wyślij»**: wiadomość pójdzie do klienta od bota studia, a nie z Twojego prywatnego konta. Tak można napisać pierwszym, nie czekając na klienta: zapytać, czy dostał kosztorys, przypomnieć o terminie, zadać pytanie. Decyzja właściciela z 23.10.2026.",
          "Ten wybór ma osoba, u której jest lead, kierownik i właściciel; przy wolnym leadzie — tylko właściciel, inaczej to obejście [kolejki](#leads-queue). Do klienta, który nie pisał do bota albo go zablokował, bot nie może napisać pierwszy i wyboru nie ma. Po wysłaniu model milczy w tej rozmowie 7 dni: rozmowę prowadzisz Ty. Tekst dopisuje się do korespondencji w karcie i do dziennika, kierownik i właściciel dostają «✍️ … ответил в боте». Odpowiedź klienta przyjdzie w bocie: właścicielowi i kierownikowi — «📩 Обращение в бота», osobie, u której jest lead — «💬 Клиент написал в бот».",
        ],
      },
      {
        id: "bot-card",
        title: "Karta leada w Telegramie: krótko",
        body: [
          "Karta nowego leada w bocie jest krótka: jak ciepły jest lead, prostymi słowami («🔥 Горячий» gorący, «🟡 Тёплый» ciepły, «👤 Просит живого человека» prosi o człowieka), numer zgłoszenia, kto i skąd pisał, **«Что хочет»** (czego chce), budżet i termin, jeśli klient je podał, oraz **«Можно начать так»**: pierwsza wiadomość, którą kopiujesz jednym kliknięciem.",
          "Punkty, rozbiór według BANT, «co już powiedziano klientowi» i «o co nie pytać ponownie» zniknęły z Telegrama (właściciel, 22.10.2026: menedżerowie tego nie rozumieli). Cała rozmowa i szczegóły są w karcie leada w panelu, przycisk «🔓 Открыть карточку».",
        ],
      },
      {
        id: "list",
        title: "Lista leadów: filtry i kolumny",
        body: {
          manager: [
            "Widzisz **wolne leady i swoje**. Lead przejęty przez kolegę nie jest Ci pokazywany ani na liście, ani pod bezpośrednim linkiem — tak zdecydował właściciel. Dlatego liczba przy chipie «wszystkie leady» to u Ciebie wolne plus Twoje.",
            "Filtry na górze: «wszystkie leady / wolne / moje leady», priorytet i status. Na liście jest 50 leadów na stronę.",
            "**«Kiedy»** — czas taszkencki. **«Budżet»** — to nie kwota, tylko to, jak klient mówi o pieniądzach: «podany i zatwierdzony», «jest, porównuje oferty» albo «nie podany». W zgłoszeniach z formularza i z kontaktów budżet prawie zawsze jest «nie podany» — rozmowy o pieniądzach jeszcze nie było.",
            "**«Ocena»** — ocena leada od 0 do 100 i litera: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — ocena A albo klient prosił o żywego człowieka; «ciepły» — B; «do dojrzenia» — pozostałe; «archiwum» — klient odmówił.",
            "Danych kontaktowych na liście celowo nie ma: otwierają się w [karcie leada](#leads-card), a każde otwarcie jest zapisywane.",
            "Leady «od partnera» są wyróżnione na żółto i podpisane «od partnera». Dopóki taki lead jest niczyj, stoi **pierwszy na liście** przy dowolnych filtrach, z dopiskiem «priorytet — weź jako pierwszy»; po wzięciu wraca na swoje miejsce według czasu, ale zostaje podświetlony.",
          ],
          head: [
            "Widzisz **wszystkie leady studia** — wolne, swoje i cudze. Filtry: «wszystkie leady / wolne / moje leady», priorytet i status; 50 na stronę.",
            "**«Budżet»** — to nie kwota, tylko to, jak klient mówi o pieniądzach: «podany i zatwierdzony», «jest, porównuje oferty» albo «nie podany». **«Ocena»** — od 0 do 100 i litera: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — A albo prosił o żywego człowieka, «ciepły» — B, «do dojrzenia» — pozostałe, «archiwum» — odmówił.",
            "Pod statusem widać nick osoby, która prowadzi leada. Danych kontaktowych na liście nie ma — otwierają się w [karcie leada](#leads-card) i trafiają do dziennika.",
            "Leady «od partnera» są wyróżnione na żółto. Dopóki niczyj — stoi pierwszy na liście z dopiskiem «priorytet — weź jako pierwszy»; po wzięciu wraca na miejsce według czasu, podświetlenie zostaje.",
          ],
          admin: [
            "Widzisz wszystkie leady. Wyszukiwanie, «Czyje» i filtry: «wszystkie leady / wolne / moje leady», priorytet i status; 50 na stronę.",
            "**«Budżet»** — jak klient mówi o pieniądzach («podany i zatwierdzony», «jest, porównuje oferty», «nie podany»), a nie kwota. **«Ocena»**: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — A albo prosił o człowieka, «ciepły» — B, «do dojrzenia» — pozostałe, «archiwum» — odmówił.",
            "Danych kontaktowych na liście celowo nie ma: inaczej «kto widział kontakty» znaczyłoby «wszyscy, którzy otworzyli panel». W karcie każde otwarcie danych kontaktowych to wiersz w [dzienniku](/admin/audit).",
            "Leady «od partnera» są wyróżnione na żółto; niczyj stoi pierwszy na liście z dopiskiem «priorytet — weź jako pierwszy». W karcie takiego leada jest wszystko, co podał partner (nazwa, NIP/INN, kontakt, strona, czego potrzebuje), a «Skąd pisał» — «klienta przypisał partner w swoim panelu».",
          ],
        },
      },
      {
        id: "add",
        title: "«Dodaj leada ręcznie»: klient przyszedł z pominięciem strony i bota",
        body: {
          manager: [
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** pod listą. Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card). Bez kontaktu lead się nie doda: inaczej nie da się skontaktować z klientem.",
            "Lead od razu jest Twój, bez kolejki: status «w toku», numer zgłoszenia, a po 4 godzinach przypomnienie «Взят в работу — что дальше?». W karcie w «Skąd pisał» będzie «dodany ręcznie w panelu». Przekazanie go koledze — jak każdego leada: [«Poproś o przekazanie»](#leads-transfer).",
            "Na górze formularza jest **«Kto to jest»**: «Klient», «Agencja» albo «Bloger». Domyślnie «Klient». Agencja i bloger sami przyprowadzają klientów, dlatego na liście leadów mają znaczek, a w karcie podpowiedź: agencję dodaj w [«Agencje»](/admin/agencies), tam liczy się jej 15%. Blogera jako partnera dodają kierownik i właściciel.",
          ],
          head: [
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** pod listą. Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card).",
            "W formularzu masz **«Komu lead»**: «Sobie» albo dowolny pracownik. Lead od razu jest «w toku» u wybranej osoby, bez kolejki, z numerem zgłoszenia i przypomnieniem po 4 godzinach «Взят в работу — что дальше?»; jeśli przekażesz go komuś innemu, ta osoba od razu dostanie w Telegramie «Вам добавили лид» z linkiem do karty. Menedżerowie nie wybierają: dodają leada tylko sobie.",
            "Na górze formularza jest **«Kto to jest»**: «Klient», «Agencja» albo «Bloger». Domyślnie «Klient». Agencja i bloger sami przyprowadzają klientów, dlatego na liście leadów mają znaczek, a w karcie podpowiedź: agencję dodaj w [«Agencje»](/admin/agencies), tam liczy się jej 15%. Blogera jako partnera dodają kierownik i właściciel.",
          ],
          admin: [
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** pod listą. Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card).",
            "W formularzu jest **«Komu lead»**: «Sobie» albo dowolny pracownik. Lead od razu jest «w toku» u wybranej osoby, bez kolejki, z numerem zgłoszenia i przypomnieniem po 4 godzinach «Взят в работу — что дальше?»; jeśli przekażesz go komuś innemu, ta osoba od razu dostanie w Telegramie «Вам добавили лид» z linkiem. Kto dodał — w [dzienniku](/admin/audit). Menedżerowie dodają leada tylko sobie, kierownik — tak jak Ty.",
            "Na górze formularza jest **«Kto to jest»**: «Klient», «Agencja» albo «Bloger». Domyślnie «Klient». Agencja i bloger sami przyprowadzają klientów, dlatego na liście leadów mają znaczek, a w karcie podpowiedź: agencję dodaj w [«Agencje»](/admin/agencies), tam liczy się jej 15%. Blogera jako partnera dodają kierownik i właściciel.",
          ],
        },
      },
      {
        id: "card",
        title: "Karta leada",
        body: {
          manager: [
            "Otwiera się z listy, z wierszy «Pulpit» i przyciskiem «🔓 Открыть карточку» (otwórz kartę) w Telegramie — ten przycisk sam loguje Cię do panelu. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»** — do kogo lead jest przypisany. Tu są przyciski [«Przejmij» i «Zwróć do kolejki»](#leads-take) oraz [«Poproś o przekazanie»](#leads-transfer).",
            "**«Status»** — «nowy», «w toku», «odłożony», «wygrany», «przegrany». Zmieniaj go po każdej rozmowie: na podstawie statusów liczone są [statystyki](/admin/stats) i licznik [leadów bez ruchu](#leads-urgent). «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» ma tylko wolny lead: Twój go nie ma, a żeby zwolnić leada, użyj «Zwróć do kolejki». **Bot dopomina się odpowiedzi w sprawie zapomnianych leadów.** W dni robocze dwa razy — **o 10:00 i o 16:00** — przysyła podsumowanie «Masz N leadów «w toku» bez ruchu od 7+ dni», a pod nim wszystkie takie Twoje leady po osiem w wiadomości: każdy z numerem i przyciskami «🏆 1», «❌ 1», «⏳ 1» (cyfra to numer leada na liście). «🔓 1» w tym samym rzędzie otwiera kartę tego leada jednym kliknięciem: Telegram sam potwierdza, że to Ty, bez kodu i hasła. Nazwa leada w tekście to zwykły link: otwiera kartę od razu tylko w przeglądarce, w której jesteś już zalogowany do panelu. Bez ruchu znaczy: od 7+ dni ani korespondencji, ani zmiany statusu, ani innych działań przy leadzie. Zaznaczony lead już nie wróci; niezaznaczone bot przysyła ponownie, dopóki nie odpowiesz. **«⏳ Ещё в работе»** — bot zapyta, kiedy następny krok z klientem: «Завтра», «Через 3 дня» albo «Через неделю» — i założy Ci zadanie «Связаться: …» na ten dzień o 10:00 (sobota i niedziela przechodzą na poniedziałek). Do tego dnia nie pyta o leada. Trzeci raz z rzędu «nadal w toku» bez zmiany statusu jest ostatni: potem lead ma tylko «🏆» i «❌», a kierownik dowie się, że lead jest odkładany. Nie odpowiadasz botowi przez dwa dni robocze — kierownik też się dowie. Leada bez ruchu od 21+ dni, przy którym nie odpowiedziałeś przez trzy dni, bot sam przenosi do «przegrany» z adnotacją w karcie — przywrócić go można przyciskiem «w toku». Po «🏆» bot zaproponuje **«Завести проект»**: formularz w [Projektach](/admin/projects) wypełni się z leada, a projekt zapisze się na Ciebie — wtedy sprzedaż trafi do Twoich naliczeń.",
            "**«Dane kontaktowe klienta»** → «Pokaż dane kontaktowe». Otwierają się tylko dla przejętego leada: najpierw «Przejmij». Każde otwarcie trafia do dziennika, więc otwieraj je wtedy, gdy zamierzasz napisać.",
            "W [«Oś zdarzeń»](#leads-timeline) → «Pokaż korespondencję»: wszystko, co klient powiedział asystentowi na stronie albo w bocie o zadaniu, pieniądzach i terminach. Też tylko po przejęciu i też jest zapisywane. Zgłoszenia z formularza nie mają korespondencji.",
            "**«Notatka dla zespołu»** w polu pod «Oś zdarzeń» — dla całego zespołu, nie trafia do klienta; osoba prowadząca leada dostaje wiadomość w Telegramie. Nie wklejaj tam danych kontaktowych klienta. Niżej — brief, kosztorys ze strony i notatki. O leadach z kontaktów — punkt [pierwsza rozmowa po kontakcie](#prospect-replies).",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
            "**«NIP/INN firmy»** widać tylko w leadzie, w którym NIP/INN jest już wpisany: od 05.11.2026 partnerzy nie przypisują klientów po NIP/INN i pole nie jest już potrzebne. Klient przyszedł od partnera — wpisz jego kod w pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
          ],
          head: [
            "Otwierasz dowolną kartę. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»**: [«Przejmij»](#leads-take) dla wolnego leada, «Zwróć do kolejki» i [«Przekaż»](#leads-transfer) dla każdego przejętego — Twoje przekazanie działa od razu, bez zatwierdzania.",
            "**«Status»** możesz zmieniać w każdym leadzie: «nowy», «w toku», «odłożony», «wygrany», «przegrany». «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» — tylko dla wolnego leada; przypisany go nie ma, a leada zwalnia «Zwróć do kolejki». W dni robocze o 10:00 i 16:00 bot przysyła każdemu — także Tobie — wszystkie jego leady «w toku» bez ruchu od 7+ dni, po osiem w wiadomości, z przyciskami «🏆», «❌», «⏳» przy każdym, i powtarza, dopóki osoba nie odpowie. «🔓» w rzędzie leada otwiera jego kartę jednym kliknięciem, bez kodu i hasła. «⏳ Ещё в работе» — bot pyta, kiedy następny krok («Завтра», «Через 3 дня», «Через неделю»), i zakłada zadanie «Связаться: …» na ten dzień; do tego czasu o leada nie pyta. Ty i właściciel (pod polem «Raporty») dostajecie wiersze: «⏳ … третий раз откладывает лид …» — po trzecim razie lead ma już tylko «wygrany» i «przegrany»; «📵 …: N лидов без ответа боту» — jeśli osoba nie odpowiada przez dwa dni robocze, raz dziennie. Leada bez ruchu od 21+ dni i bez odpowiedzi przez trzy dni bot sam przenosi do «przegrany» z adnotacją w karcie (przywrócić — «w toku»), a Ty dostajesz wiersz «🗂 Лиды без движения 21+ день …». Projekt założony z leada prowadzi osoba, która ma leada, jeśli nie wybrano prowadzącego. Ile kto ma leadów bez odpowiedzi botowi — na [Pulpicie](/admin/hq) w kartach ludzi.",
            "**«Pokaż dane kontaktowe»** i **«Pokaż korespondencję»** działają dla każdego przejętego leada. Dla wolnego — dopiero po «Przejmij»: w kolejce jesteś na równi ze wszystkimi. Każde otwarcie trafia do dziennika.",
            "**«Notatka dla zespołu»** w polu pod [«Oś zdarzeń»](#leads-timeline) — dla całego zespołu, nie trafia do klienta; osoba prowadząca leada dostaje ją w Telegramie. Niżej — brief, kosztorys i notatki.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
            "**«NIP/INN firmy»** widać tylko w leadzie, w którym NIP/INN jest już wpisany: od 05.11.2026 partnerzy nie przypisują klientów po NIP/INN. Klient od partnera — pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
          ],
          admin: [
            "Otwierasz dowolną kartę i możesz wszystko: przejąć, zwrócić do kolejki, przekazać, zmienić status, otworzyć dane kontaktowe i korespondencję — także w wolnym leadzie, przed przejęciem. Każde działanie trafia do dziennika z Twoim imieniem.",
            "W wolnym leadzie na górze widać, u kogo jest teraz w kolejce: «👁 W kolejce u … do 14:30». Pozostałym to imię się nie wyświetla.",
            "**«Status»**: «wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia; «nowy» ma tylko wolny lead, przypisany go nie ma — leada zwalnia «Zwróć do kolejki». Bot dopomina się decyzji w sprawie zapomnianych leadów: w dni robocze o 10:00 i 16:00 przysyła osobie wszystkie jej leady «w toku» bez ruchu od 7+ dni po osiem, z przyciskami «🏆», «❌», «⏳», i powtarza, dopóki nie odpowie. «🔓» w rzędzie leada otwiera jego kartę jednym kliknięciem, bez kodu i hasła. «⏳ Ещё в работе» to nie odkładanie na oko: bot pyta o termin następnego kroku i zakłada zadanie «Связаться: …»; trzeci raz z rzędu jest ostatni, a Ty i kierownicy dostajecie wiersz. Nie odpowiada botowi przez dwa dni robocze — wiersz «📵 …: N лидов без ответа боту», raz dziennie. 21+ dni bez ruchu i trzy dni bez odpowiedzi — bot sam ustawia «przegrany» z adnotacją w karcie, odwracalnie. Wszystko pod polem «Raporty». «🏆 Выиграли» → «Завести проект»: w formularzu [Projektów](/admin/projects) prowadzącym jest już osoba, która ma leada. Na [Pulpicie](/admin/hq) przy każdym widać «bez odpowiedzi botowi», a powyżej pięciu — wiersz w «Wymaga uwagi». W wieczornym raporcie «Сотрудники за день» — przepadłe propozycje leadów i ile leadów wisi bez ruchu.",
            "**«Notatkę dla zespołu»** w polu pod [«Oś zdarzeń»](#leads-timeline) widzi cały zespół, nie trafia do klienta, osoba prowadząca leada dostaje ją w Telegramie. Niżej — brief, kosztorys i notatki asystenta.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku. Ile jest takich rabatów i z jakiego powodu — w [Statystykach](/admin/stats), długość minuty — `FIRST_MINUTE_SECONDS` na serwerze (domyślnie 60, 0 wyłącza).",
            "**«NIP/INN firmy»** widać tylko w leadzie, w którym NIP/INN jest już wpisany: [przypisywanie klientów przez partnera](#partners-claims) jest od 05.11.2026 wyłączone, po starym NIP/INN lead rozpoznaje się jak dotąd. Klient od partnera — pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
          ],
        },
      },
      {
        id: "partner-code",
        title: "«Kod promocyjny lub kto przyprowadził»: klient od partnera",
        body: [
          "Klient powiedział, że przyprowadził go bloger lub agencja, albo podał kod promocyjny — słowo łacińskimi literami, np. AZIZ — wpisz go w karcie leada w polu **«Kod promocyjny lub kto przyprowadził»** i kliknij **«Zapisz»**. Można też wpisać nazwę partnera tak, jak jest u nas zapisana. To samo pole jest w [«Dodaj leada ręcznie»](#leads-add). Wpisać może osoba, która ma leada, kierownik i właściciel.",
          "Co się stanie: lead zapisuje się na partnera, partner dostaje wiadomość w Telegramie, a gdy projekt z leada zostanie opłacony, policzy mu się procent — ręcznie niczego nie trzeba ustawiać. Klient, który był już w studiu (ten sam kontakt lub firma), zapisuje się z adnotacją «nie zaliczono»: partner nie dostaje za niego pieniędzy. Lead jest już zapisany na partnera — pola nie ma, zmienić może tylko właściciel w projekcie: klient należy do tego, kto został zapisany pierwszy.",
          "Jeśli klient sam napisał „kod AZIZ” w czacie na stronie, w bocie albo w zgłoszeniu ze strony, a linku partnera nie było, lead zapisze się na partnera sam. Takiego kodu nie ma w bazie — panel powie «Nie ma takiego kodu»: sprawdź u klienta, jak się pisze, albo zapytaj kierownika.",
        ],
      },
      {
        id: "timeline",
        title: "«Oś zdarzeń»: wszystko z klientem w jednym miejscu",
        body: [
          "Od 25.10.2026 w karcie leada jest jedna **«Oś zdarzeń»** zamiast trzech bloków. Wszystko według czasu, starsze na górze: korespondencja kontaktu z konta firmowego (klient po lewej, my po prawej; przy naszych — «wysyłanie…», «nie wysłano» i [«Popraw»](#prospect-edit-sent)), notatki zespołu, etapy sprzedaży («✓ Etap: makieta pokazana · Imię») i przypomnienia («⏰ Przypomnienie na …»). Korespondencję kontaktu i przypomnienia widzi osoba, u której jest lead; notatki i etapy — każdy, kto otworzył kartę. Korespondencja z czatu strony lub bota — przyciskiem «Pokaż korespondencję», każde otwarcie zapisuje się w dzienniku, jak dawniej.",
          "**Jedno pole odpowiedzi** pod osią. Nad nim wybierasz, dokąd pójdzie tekst: **«Do klienta z konta «…»»** — z tego samego konta firmowego, z którego szedł kontakt, i AI potem milknie; **«Do klienta od bota studia»** — jeśli klient sam pisał do bota ([więcej](#leads-bot-write)); **«Notatka dla zespołu»** — nie trafia do klienta, widzi ją cały zespół, osoba prowadząca leada dostaje ją w Telegramie. Pierwszy stoi ten sposób, który dotrze do klienta. Ctrl+Enter — wyślij. «Odpowiedzi na zastrzeżenia» wstawiają gotowy tekst, gdy wybrane jest «Do klienta z konta».",
          "Nowe odpowiedzi klienta z kontaktu pojawiają się same co 10 sekund, dopóki strona jest otwarta. Nasze linki do makiet i realizacji są sprawdzane przed wysłaniem, jak dawniej. Przyciski «Odpowiadam osobiście» i «Otwórz korespondencję w Telegramie» — pod osią. Stare linki z bota do korespondencji, dyskusji i pisania w bocie prowadzą tutaj.",
        ],
      },
      {
        id: "board",
        title: "«Tablica»: leady według etapów sprzedaży",
        body: {
          manager: [
            "Nad listą jest przełącznik **«Lista» / «Tablica»**. Na tablicy Twoje firmy z 30 dni leżą w kolumnach według etapów sprzedaży: odpisali, zainteresowanie, makieta wysłana, makieta pokazana, cena podana, płatność. Firma stoi w kolumnie najdalszego etapu, najnowsze na górze, pod nazwą — ile dni jest w tej kolumnie: tak widać, kto utknął. Tych, do których napisaliśmy, a nie odpisali, na tablicy nie ma — ich liczba z linkiem do [Zimne kontakty](/admin/prospect). Etapy są te same co na [Pulpit](/admin/hq) i w [Etapy sprzedaży](/admin/stages).",
            "Nad każdą kolumną jest napisane, co na tym etapie dzieje się samo, a co robisz Ty: na «odpisali» bot sam wysyła kółko wideo i analizę strony, na «makieta wysłana» — warunki promocji i przypomnienia. **«Jest zainteresowanie»**, **«Pokazałem makietę»** i **«Podałem cenę»** — przyciski na karcie; na komputerze wystarczy przeciągnąć kartę do kolumny: zainteresowanie zaznaczy się od razu, przy pokazie i cenie otworzy się wybór (jak pokazano, jaka kwota). «Makieta wysłana» i «płatność» zaznaczają się same — tam karty nie przeciągniesz, kolumna zrobi się czerwona. Twoje zaznaczenie widać na tablicy od razu, nowe odpowiedzi i makiety — w ciągu 10 minut.",
          ],
          head: [
            "Nad listą jest przełącznik **«Lista» / «Tablica»**. Na tablicy firmy całego zespołu z 30 dni leżą w kolumnach według etapów sprzedaży: odpisali, zainteresowanie, makieta wysłana, makieta pokazana, cena podana, płatność. Firma stoi w kolumnie najdalszego etapu, najnowsze na górze, pod nazwą — ile dni tam jest i kto ją prowadzi. **«Czyje»** nad tablicą — wszystkie, wolne, moje albo osoba. Tych, do których napisaliśmy, a nie odpisali, na tablicy nie ma — ich liczba z linkiem do [Zimne kontakty](/admin/prospect). Etapy są te same co na [Pulpit](/admin/hq) i w [Etapy sprzedaży](/admin/stages).",
            "Nad każdą kolumną jest napisane, co na tym etapie dzieje się samo, a co robisz Ty: na «odpisali» bot sam wysyła kółko wideo i analizę strony, na «makieta wysłana» — warunki promocji i przypomnienia. **«Jest zainteresowanie»**, **«Pokazałem makietę»** i **«Podałem cenę»** — przyciski na karcie; na komputerze wystarczy przeciągnąć kartę do kolumny: zainteresowanie zaznaczy się od razu, przy pokazie i cenie otworzy się wybór (jak pokazano, jaka kwota). «Makieta wysłana» i «płatność» zaznaczają się same — tam karty nie przeciągniesz, kolumna zrobi się czerwona. Twoje zaznaczenie widać na tablicy od razu, nowe odpowiedzi i makiety — w ciągu 10 minut.",
          ],
          admin: [
            "Nad listą jest przełącznik **«Lista» / «Tablica»**. Na tablicy firmy całego zespołu z 30 dni leżą w kolumnach według etapów sprzedaży: odpisali, zainteresowanie, makieta wysłana, makieta pokazana, cena podana, płatność. Firma stoi w kolumnie najdalszego etapu, najnowsze na górze, pod nazwą — ile dni tam jest i kto ją prowadzi. **«Czyje»** nad tablicą — wszystkie, wolne, moje albo osoba. Tych, do których napisaliśmy, a nie odpisali, na tablicy nie ma — ich liczba z linkiem do [Zimne kontakty](/admin/prospect). Etapy są te same co na [Pulpit](/admin/hq) i w [Etapy sprzedaży](/admin/stages).",
            "Nad każdą kolumną jest napisane, co na tym etapie dzieje się samo, a co robisz Ty: na «odpisali» bot sam wysyła kółko wideo i analizę strony, na «makieta wysłana» — warunki promocji i przypomnienia. **«Jest zainteresowanie»**, **«Pokazałem makietę»** i **«Podałem cenę»** — przyciski na karcie; na komputerze wystarczy przeciągnąć kartę do kolumny: zainteresowanie zaznaczy się od razu, przy pokazie i cenie otworzy się wybór (jak pokazano, jaka kwota). «Makieta wysłana» i «płatność» zaznaczają się same — tam karty nie przeciągniesz, kolumna zrobi się czerwona. Twoje zaznaczenie widać na tablicy od razu, nowe odpowiedzi i makiety — w ciągu 10 minut. Autopilot kontaktów włącza się i wyłącza w [Zimne kontakty](/admin/prospect) — link na dole tablicy.",
          ],
        },
      },
      {
        id: "sales-marks",
        title: "Etapy sprzedaży w karcie: «Jest zainteresowanie», «Pokazałem makietę», «Podałem cenę»",
        body: [
          "W karcie leada jest blok «Etapy sprzedaży»: do których etapów i kiedy doszedł klient, według tych samych zasad co na [Pulpicie](/admin/hq). Trzy przyciski — na to, czego baza sama nie wie: «Jest zainteresowanie» (klient jest zainteresowany, choć nie napisał „+”, np. powiedział przez telefon), «Pokazałem makietę» (wybierz «na wideo» lub «na żywo») i «Podałem cenę» (wpisz kwotę w dolarach).",
          "Przyciski widzi opiekun leada, a także kierownik i właściciel; menedżer zaznacza tylko swoje leady. Każdy znacznik trafia do dziennika z datą i imieniem i liczy się jako ruch w leadzie: bot porządku w leadach tym razem o niego nie zapyta.",
          "Nie zaznaczysz pokazu — dla wszystkich go nie było: ani w «Etapy sprzedaży», ani w normie 2 pokazów w tygodniu, ani w raporcie o 18:00. Kwotę podanej ceny w karcie widzi tylko właściciel.",
          "Etap zaznaczył się przez pomyłkę — kliknij go na liście (przebyte są podkreślone kropkami) i na pytanie «Zdjąć … i wszystko, co dalej?» odpowiedz «OK». Tak samo w «Przebiegu transakcji» w [Skrzynce](/admin/inbox). Etap i wszystko po nim znikną z liczenia: na Pulpicie, na tablicy, w normie pokazów i w raporcie o 18:00; w dzienniku zostanie, kto i kiedy zdjął. Jeśli później naprawdę się wydarzy, np. makieta faktycznie wyjdzie, etap zaznaczy się ponownie sam. «napisaliśmy» i «płatność» tak się nie zdejmuje: to nasza wiadomość i pieniądze. Zdjąć może opiekun leada, kierownik i właściciel.",
        ],
      },
      {
        id: "reminders",
        title: "Przypomnienia",
        body: {
          manager: [
            "Przypomnienia to Twoja pamięć: przychodzą w Telegramie od bota, od razu z przyciskami **«Открыть»** (otwórz), **«+2 часа»** (+2 godziny) i **«Готово»** (gotowe).",
            "**Automatyczne przypomnienie** ustawia się samo 4 godziny po tym, jak przejmiesz leada: «Взят в работу — что дальше?» (przejęty — co dalej?). Nie po dobie — lead, który przyszedł rano i do wieczora nikt go nie ruszył, już ostygł. Wyłączasz je przyciskiem «Wyłącz automatyczne przypomnienia» w karcie; Twoje ręczne przypomnienia zostają.",
            "**Własne przypomnienie**: w bloku «Przypomnienia» — «przypomnij za 24 godz.» (można od 0,5 godziny wzwyż), opis «o czym przypomnieć» i «Ustaw».",
            "Statusy na liście: «wysłano», «po terminie» (czas minął, bot jeszcze próbuje) i «nie dostarczono» — po pięciu próbach. To znaczy, że bot nie może do Ciebie napisać: sprawdź, czy go nie zablokowałeś, i kliknij w nim «Start». Jeśli natomiast serwer na chwilę traci połączenie z Telegramem, próby się nie liczą: przypomnienie poczeka na połączenie i przyjdzie później.",
            "Zrobione — kliknij «zrobione» w karcie albo «Готово» w Telegramie. Zamknąć możesz tylko swoje przypomnienie.",
          ],
          head: [
            "Przypomnienia przychodzą w Telegramie z przyciskami **«Открыть»** (otwórz), **«+2 часа»** (+2 godziny) i **«Готово»** (gotowe).",
            "**Automatyczne przypomnienie** — 4 godziny po przejęciu leada. Wyłącza się je w karcie, ręczne przy tym zostają.",
            "**Własne przypomnienie**: «przypomnij za N godz.», opis i «Ustaw». Możesz ustawiać i zamykać przypomnienia w każdym leadzie, także w leadach zespołu.",
            "«Nie dostarczono» po pięciu próbach oznacza, że bot nie może napisać do tej osoby — niech sprawdzi, czy go nie zablokowała. Awaria łączności serwera z Telegramem nie liczy się jako próba — przypomnienie przyjdzie, gdy połączenie wróci.",
          ],
          admin: [
            "Przypomnienia przychodzą w Telegramie z przyciskami «Открыть», «+2 часа» i «Готово». Rozsyła je sweep — przebieg według harmonogramu co pięć minut. Jeśli nie przeszedł od ponad pół godziny, wszyscy zobaczą na stronie głównej czerwony pasek [«Przypomnienia nie są dostarczane»](#leads-banner).",
            "Automatyczne przypomnienie — 4 godziny po przejęciu leada; ręczne — «przypomnij za N godz.» i «Ustaw». Ustawiasz i zamykasz przypomnienia w każdym leadzie.",
            "«Nie dostarczono» po pięciu próbach — bot nie może napisać do tej osoby: jest zablokowany albo ta osoba ani razu nie kliknęła «Start». Próby liczą się tylko wtedy, gdy Telegram odpowiada: jeśli serwer w ogóle nie widzi Telegrama, przypomnienie czeka, a nie przepada.",
          ],
        },
      },
      {
        id: "next-step",
        title: "«Następny krok»: co dalej z każdym leadem",
        body: [
          "**Następny krok** — Twoje najbliższe otwarte przypomnienie dla leada: kiedy i co zrobić (od 25.10.2026). Widać go na liście leadów w osobnej kolumnie i na górze bloku «Przypomnienia» w karcie, po terminie — na czerwono. Lead «w toku» bez kroku ma na liście żółte **«brak kroku»**: tak widać, o którym kliencie zapomniano. Nowy i zamknięty lead kroku nie potrzebuje.",
          "Krok ustawia się tym samym przypomnieniem: «przypomnij za», notatka «o czym przypomnieć» i «Ustaw». Dopóki krok jest przed Tobą, bot porządku w leadach (o 10:00 i 16:00) nie pyta o ten lead — jak po «⏳ Ещё в работе». Termin minął, a lead stoi — zapyta znowu. Zrobione — kliknij «zrobione» i ustaw następny.",
        ],
      },
      {
        id: "transfer",
        title: "Przekazanie leada koledze",
        body: {
          manager: [
            "Nie dajesz rady z leadem albo klient bardziej pasuje koledze — w karcie, w bloku «Przekazanie», wybierz komu i napisz, dlaczego przekazujesz, a potem kliknij **«Poproś o przekazanie»**.",
            "Lead zostaje u Ciebie, dopóki prośby nie zatwierdzi Twój kierownik albo właściciel: dostają w Telegramie wiadomość z przyciskami «Подтвердить» (zatwierdź) i «Отклонить» (odrzuć) — decydują od razu tam, bez panelu. Lead nie wisi między dwiema osobami, czekając na decyzję.",
            "Zatwierdzili — lead jest u kolegi, dostaje on wiadomość i nowe przypomnienie za 4 godziny. Lead z kontaktu przechodzi razem z korespondencją: odpowiedzi klienta, ponawianie i podpis modelu są teraz u kolegi. Odrzucili — dostaniesz «Передачу не подтвердили. Лид остаётся у вас» (przekazania nie zatwierdzono, lead zostaje u Ciebie).",
            "Wolnego leada się nie przekazuje — przejmuje się go przyciskiem «Przejmij».",
          ],
          head: [
            "Twój przycisk to **«Przekaż»**: lead od razu trafia do wybranej osoby, która dostaje wiadomość «…передал вам лид. Он уже ваш» (…przekazał Ci leada, jest już Twój).",
            "Prośby menedżerów z Twojego zespołu («Poproś o przekazanie») przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decyduj od razu w wiadomości; «Открыть лид» (otwórz leada) prowadzi do karty, jeśli najpierw chcesz zajrzeć. Te same prośby są na «Leady» w «Czeka na Twoją decyzję» i w karcie leada. Gdy zdecyduje jedna osoba, u pozostałych przyciski zmienią się na «Подтвердил …» (zatwierdził) albo «Отклонил …» (odrzucił). Możesz decydować o każdej prośbie w studiu, nie tylko ze swojego zespołu.",
            "Zatwierdzony lead dostaje nowe przypomnienie za 4 godziny. Lead z kontaktu przechodzi razem z korespondencją: wiadomości klienta, ponawianie i podpis modelu — do nowej osoby prowadzącej. Dawne przypomnienia poprzedniej osoby nie zamykają się same — w razie potrzeby zamknij je.",
          ],
          admin: [
            "Twój przycisk to **«Przekaż»**: lead przechodzi od razu. Prośby menedżerów przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decydujesz od razu w wiadomości — a także na «Leady» do «Czeka na Twoją decyzję» i do karty leada. Może je rozstrzygnąć także kierownik: dostaje prośby swojego zespołu z tymi samymi przyciskami. Kto zdecyduje pierwszy — u pozostałych przyciski zmienią się na wynik i ponownie kliknąć rozstrzygniętej prośby się nie da.",
            "Tak działa to według Twojej zasady: lead przechodzi za zatwierdzeniem kierownika albo Twoim i do decyzji zostaje u dotychczasowej osoby prowadzącej. Lead z kontaktu przechodzi razem z korespondencją — u kogo lead, u tego rozmowa z klientem.",
          ],
        },
      },
      {
        id: "urgent",
        title: "Leady bez ruchu: jedna reguła",
        body: [
          "Lead «bez ruchu» — ze statusem «w toku» i 7 dni lub dłużej bez kroku: nikt go nie brał, nie pisał w korespondencji ani w notatkach «Oś zdarzeń», nie zmieniał statusu i nie ustawiał przypomnienia. Obejrzenie karty i odpowiedź botowi «⏳ Ещё в работе» krokiem nie są: otworzyć i zamknąć to nie to samo, co się zająć.",
          "Reguła jest jedna dla całego panelu i bota: «Wymaga uwagi» na «Pulpit» u kierownika i właściciela, «Zaległe» u menedżera, kolumna «Bez ruchu» w tabeli zespołu i pytania bota o zapomniane leady o 10:00 i 16:00 liczą tak samo. Wcześniej «pilny kontakt» liczył się własnymi progami według priorytetu i ten sam lead w jednym miejscu się palił, a w innym nie.",
          "Żeby lead wypadł z tego licznika, zrób prawdziwy krok: napisz do klienta, zmień status, ustaw przypomnienie lub zadanie «Skontaktuj się».",
        ],
      },
      {
        id: "plan-fact",
        title: "«Plan i wykonanie»",
        body: {
          manager: [
            "Cele wyznaczone Ci na tydzień albo miesiąc: **«wpływy, $»** (pieniądze od klientów z Twoich projektów), **«wygrane leady»** i **«pierwsze kontakty»** — ile razy kliknąłeś «Pokaż dane kontaktowe».",
            "Pasek pokazuje, ile zrobiono: od 100% — zielony, poniżej 50% — złoty. Tydzień liczy się od poniedziałku według czasu taszkenckiego.",
            "Plan ustala kierownik albo właściciel — nikt nie wyznacza planu sam sobie.",
          ],
          head: [
            "Cele na tydzień albo miesiąc: «wpływy, $», «wygrane leady», «pierwsze kontakty» (kliknięcia «Pokaż dane kontaktowe»).",
            "Możesz **ustalić nowy plan** swojemu menedżerowi: «Dla kogo», «Okres», «Wskaźnik», «Cel» i «Ustaw plan». Zmieniać i usuwać już ustalony plan może tylko właściciel, a sobie planu nie ustala nikt.",
            "Pasek: od 100% — zielony, poniżej 50% — złoty.",
          ],
          admin: [
            "Na dole [«Pulpit»](/admin/hq#hq-week), w bloku «Tydzień: rekomendacje, zespół, plan». Ustalasz plan komukolwiek, a do tego przyciskami «zmień» i «usuń» możesz zmienić albo usunąć dowolny plan. Kierownik może tylko dodać plan swojemu menedżerowi — tak zdecydowałeś.",
            "Wskaźniki: «wpływy, $», «wygrane leady», «pierwsze kontakty» (to kliknięcia «Pokaż dane kontaktowe»). Okresy: bieżący tydzień od poniedziałku i bieżący miesiąc.",
          ],
        },
      },
      {
        id: "coach",
        title: "Rekomendacje",
        body: {
          manager: [
            "**«Rekomendacje na tydzień»** powstają w poniedziałki od 06:00 czasu taszkenckiego na podstawie Twoich liczb z poprzedniego tygodnia: «Poprzedni okres», «Na co zwrócić uwagę», «Co robić», «Czego się nauczyć», «Co idzie dobrze».",
            "To podpowiedź, a nie ocena. Za tydzień — nowy pomiar i nowy plan.",
          ],
          head: [
            "**«Na dziś»** — codziennie rano od 07:00: co zrobić dziś w Twoich leadach i leadach zespołu.",
            "**«Rekomendacje na tydzień»** — w poniedziałki od 06:00, dla Ciebie i każdego w zespole. Rekomendacje dla zespołu widzisz w bloku «Rekomendacje dla zespołu na tydzień» — wygodnie omawiać je na odprawie.",
          ],
          admin: [
            "Tygodniowe powstają w poniedziałki od 06:00 dla wszystkich oprócz Ciebie; «Na dziś» — codziennie rano od 07:00 dla Ciebie i kierowników.",
            "Przycisk «wygeneruj ponownie» masz tylko Ty: każde generowanie to wywołania modelu, czyli pieniądze.",
          ],
        },
      },
      {
        id: "team-week",
        title: "«Zespół w tym tygodniu»",
        roles: ["head", "admin"],
        body: {
          head: [
            "Tabela dla Ciebie i Twojego zespołu, strzałka — w porównaniu z poprzednim tygodniem.",
            "**«W toku»** — leady ze statusem «w toku». **«Bez ruchu»** — ile z nich stoi 7+ dni [bez kroku](#leads-urgent). **«Kontakty»** — wszystkie działania osoby na leadach w tygodniu: otwarcie karty, danych kontaktowych, przypomnienie, status, wiadomość w dyskusji. To praca z leadami, a nie zimne kontakty z sekcji «Zimne kontakty». **«Pierwsze kontakty»** — kliknięcia «Pokaż dane kontaktowe». **«Wygrane»**, **«Wpływy»** — pieniądze z jej projektów w tygodniu. **«Plan kontaktów»** — zimne kontakty wobec planu, który ustalasz w sekcji [«Zespół»](/admin/team).",
            "«Najlepsi w tygodniu» pojawiają się, gdy w zespole są co najmniej dwie osoby.",
          ],
          admin: [
            "Tabela dla wszystkich oprócz Ciebie; strzałka — w porównaniu z poprzednim tygodniem.",
            "**«Kontakty»** — wszystkie działania osoby na leadach w tygodniu (otwarcie, dane kontaktowe, przypomnienie, status, dyskusja), a nie zimne kontakty; zimne są w kolumnie **«Plan kontaktów»**. **«Pierwsze kontakty»** — kliknięcia «Pokaż dane kontaktowe». Kolumnę **«Do wypłaty»** widzisz tylko Ty.",
          ],
        },
      },
      {
        id: "banner",
        title: "Czerwony pasek «Przypomnienia nie są dostarczane»",
        body: {
          manager: [
            "Pojawia się na górze «Pulpit» i «Leady», jeśli od ponad pół godziny nikt nie rozsyłał przypomnień. Od razu powiedz właścicielowi: dopóki pasek wisi, przypomnienia do Twoich leadów nie przychodzą — sprawdzaj je sam w kartach.",
          ],
          head: [
            "Pojawia się, jeśli sweep — przebieg według harmonogramu co pięć minut — nie przeszedł od ponad pół godziny. Dopóki pasek wisi, przypomnienia nie przychodzą do nikogo. Powiedz właścicielowi.",
          ],
          admin: [
            "Sweep to przebieg timera na serwerze co pięć minut: rozsyła przypomnienia, przesuwa kolejkę leadów, rozdziela porcje kontaktów. Pasek pojawia się, jeśli udanego przebiegu nie było od ponad 30 minut.",
            "Co sprawdzić: `systemctl status devuz-reminders.timer` na serwerze i `REMINDER_SWEEP_SECRET` w `.env`. Szybki przegląd — GitHub → Actions → «Осмотр связи с сервером» (przegląd połączenia z serwerem).",
          ],
        },
      },
    ],
  },
};
