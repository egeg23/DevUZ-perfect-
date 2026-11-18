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
    what: "Lead (zgłoszenie klienta) to osoba, która napisała do studia i czeka na odpowiedź. Tu są wszystkie takie zgłoszenia: z czatu na stronie, formularza, bota studia, Twoich kontaktów i innych miejsc. Widać, kto napisał, czego potrzebuje i kto z nim pracuje. Każde działanie z leadem trafia do dziennika: kto i kiedy.",
    items: [
      {
        id: "home",
        title: "Co jest na stronie «Leady»",
        body: {
          manager: [
            "Na górze jest link do sekcji [«Zadania»](/admin/tasks) i przycisk [«Rozpatrz leady»](#leads-sort). Niżej wyszukiwarka «Znajdź leada». Wpisz nazwę firmy, imię, numer zgłoszenia lub branżę i kliknij «Szukaj». «Wyczyść» czyści wyszukiwanie.",
            "Dalej przełącznik [«Lista» / «Tablica»](#leads-board) i filtry: «wszystkie leady», «wolne», «moje leady», priorytet i status. Pod nimi sama [lista](#leads-list).",
            "Klient przyszedł nie przez stronę i nie przez bota? Zapisz go przyciskiem [«Dodaj leada ręcznie»](#leads-add) na samym dole strony.",
          ],
          head: [
            "Gdy menedżer prosi o przekazanie leada koledze, na górze pojawia się blok «Czeka na Twoją decyzję». Więcej w punkcie [przekazanie leada](#leads-transfer).",
            "Niżej link do [«Zadania»](/admin/tasks), przycisk [«Rozpatrz leady»](#leads-sort) i wyszukiwarka «Znajdź leada». Obok pole «Czyje»: wybierz pracownika, a zobaczysz tylko jego leady. Dalej przełącznik [«Lista» / «Tablica»](#leads-board), filtry i [lista](#leads-list).",
            "Na samym dole przycisk [«Dodaj leada ręcznie»](#leads-add). Tygodniowe liczby zespołu, plan i rekomendacje są na dole [«Pulpit»](#hq-week).",
          ],
          admin: [
            "Gdy menedżer prosi o przekazanie leada koledze, na górze pojawia się blok «Czeka na Twoją decyzję». Więcej w punkcie [przekazanie leada](#leads-transfer).",
            "Niżej link do [«Zadania»](/admin/tasks), przycisk [«Rozpatrz leady»](#leads-sort) i wyszukiwarka «Znajdź leada». Obok pole «Czyje»: wybierz pracownika, a zobaczysz tylko jego leady. Dalej przełącznik [«Lista» / «Tablica»](#leads-board), filtry i [lista](#leads-list).",
            "Na samym dole przycisk [«Dodaj leada ręcznie»](#leads-add). Tygodniowe liczby zespołu, plan i rekomendacje są na dole [«Pulpit»](#hq-week). Kasa i oczekiwane płatności są w sekcji [«Finanse»](/admin/finance).",
          ],
        },
      },
      {
        id: "tasks",
        title: "Gdzie są zadania",
        body: ["Zadania mają osobną sekcję [«Zadania»](/admin/tasks), w menu zaraz po «Pulpit». W «Leady» został tylko link do niej. Jak zlecać zadania i oglądać ich historię, opisuje punkt [zadania](#tasks-board)."],
      },
      {
        id: "queue",
        title: "Jak lead trafia do człowieka: kolejka",
        body: {
          manager: [
            "Nowe leady są rozdzielane po kolei. Dzięki temu każdy dostaje po równo, a nie ten, kto szybciej kliknie.",
            "**W dni robocze od 08:00 do 18:00 czasu Taszkentu** lead jest proponowany jednej osobie na 30 minut. Dostajesz kartę w Telegramie: «⏳ Лид ваш на 30 минут». Inni jej na razie nie widzą. Kliknij «✅ Взять в работу» i lead jest Twój.",
            "Najpierw lead dostają ci, którzy są na miejscu: byli w panelu lub klikali przyciski bota w ostatnich 30 minutach. Spośród nich lead dostaje ten, kto ma w tym miesiącu najmniej leadów. Dlatego trzymaj panel otwarty albo odpowiadaj botowi.",
            "Nie wziąłeś w 30 minut? Lead przejdzie do następnej osoby, a Tobie liczy się jako otrzymany. Trzy pominięcia z rzędu w ciągu dnia i do wieczora kolejka Cię omija. Jeśli nikt go nie weźmie, lead otwiera się dla wszystkich: bierze ten, kto kliknie pierwszy.",
            "**Wieczorem, w nocy i w weekendy** lead od razu jest otwarty dla wszystkich w kolejce. Ale nie weźmiesz więcej niż swój równy udział w miesiącu. Jeśli lead czeka dłużej niż 10 minut albo nikogo innego nie ma, bierze ten, kto jest na miejscu.",
            "Od 21:00 do 08:00 bot nie wysyła kart. Lead, który przyszedł w nocy, przyjdzie rano z dopiskiem «🌙 Лид пришёл ночью».",
            "Jakie leady mają do Ciebie trafiać, wybierasz sam w [Ustawieniach](#settings-leads). Rodzaju, który odznaczysz, nie dostaniesz. Klient odmówił? Wtedy karty nie dostaje nikt.",
            "Bez kolejki idą leady z Twoich własnych [kontaktów](/admin/prospect): od razu są Twoje. Lead od partnera jest od razu otwarty dla wszystkich, a dopóki nikt go nie weźmie, bot co 15 minut powtarza kartę. Bierz takie jako pierwsze.",
            "Lead «🤖 Ответ на касание автопрогона» pojawia się, gdy klient zgodził się na darmową makietę, poprosił o telefon albo o przysłanie czegoś. Autopilot to kontakty, które panel wysyła sam. Do zgody z klientem pisze bot.",
          ],
          head: [
            "Stoisz w kolejce na równi z menedżerami, zasady są te same. Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie.",
            "**W dni robocze od 08:00 do 18:00** lead jest proponowany jednej osobie na 30 minut, najpierw tym, którzy byli na miejscu w ostatnich 30 minutach. Spośród nich lead dostaje ten, kto ma w miesiącu najmniej leadów. Nie wziął, lead idzie dalej, a po pełnym kółku jest otwarty dla wszystkich.",
            "Trzy pominięcia z rzędu w ciągu dnia i człowiek do wieczora wypada z kolejki. On, Ty i właściciel dostajecie linijkę «🧊 …» pod zaznaczeniem «Raporty».",
            "**Wieczorem, w nocy i w weekendy** lead jest otwarty dla wszystkich, ale nie da się wziąć więcej niż równy udział w miesiącu. Jeśli lead czeka dłużej niż 10 minut albo nikogo innego nie ma, bierze ten, kto jest na miejscu. Od 21:00 do 08:00 kart nie ma, nocny lead przyjdzie rano.",
            "Dopóki lead jest wolny, jego danych kontaktowych nie otworzysz i Ty: najpierw «Przejmij». Bez kolejki idą leady z własnych [kontaktów](/admin/prospect) danej osoby. Lead od partnera jest od razu otwarty dla wszystkich: pilnuj, żeby nie wisiał.",
            "Lead «🤖 Ответ на касание автопрогона» pojawia się, gdy klient zgodził się na makietę, poprosił o telefon albo o przysłanie czegoś. Wcześniej pisze z nim bot (zobacz [autopilot](#prospect-autopilot)).",
          ],
          admin: [
            "Jesteś poza kolejką. Możesz wziąć dowolny wolny lead w dowolnej chwili, nocny udział Cię nie dotyczy. W kolejce stoją menedżerowie i kierownicy z podłączonym Telegramem.",
            "**W dni robocze od 08:00 do 18:00** lead jest proponowany jednej osobie na 30 minut, najpierw tym, którzy byli na miejscu w ostatnich 30 minutach. Dostajesz kopię: «👁 В очереди у @ник до 14:30». Nie wziął, lead idzie dalej, a po pełnym kółku jest otwarty dla wszystkich.",
            "Trzy pominięcia z rzędu w ciągu dnia i człowiek do wieczora wypada z kolejki, a Ty dostajesz linijkę «🧊 …». Jeśli bierzesz lead zaproponowany komuś innemu, nie liczy mu się to jako pominięcie.",
            "**Wieczorem, w nocy i w weekendy** lead jest otwarty dla wszystkich, ale każdy bierze nie więcej niż równy udział w miesiącu. Jeśli lead czeka dłużej niż 10 minut albo nikogo innego nie ma, bierze ten, kto jest na miejscu. Udział zdejmiesz komuś w [Zespole](/admin/team), więcej w punkcie [limit leadów](#team-unlimited).",
            "Od 21:00 do 08:00 bot nie wysyła kart, nocny lead przychodzi rano. Karta, która nie doszła przez zerwanie łączności z Telegramem, przyjdzie później z dopiskiem «⚠️ Досылка». Jeśli rodzaju leada nie wybrał nikt, lead idzie do wszystkich, a Ty dostajesz linijkę «🧭 …».",
            "Bez kolejki idą leady z kontaktów (od razu do osoby, która pisała) i zgłoszenia z witryny powyżej $10 000 (tylko do Ciebie). Lead od partnera jest od razu otwarty dla wszystkich, a bot powtarza kartę co 15 minut, ale nie dłużej niż tydzień. Leady [autopilota kontaktów](#prospect-autopilot) idą przez wspólną kolejkę.",
          ],
        },
      },
      {
        id: "take",
        title: "Przejąć leada i zrezygnować z niego",
        body: [
          "Leada przejmiesz w karcie przyciskiem «Przejmij» albo w Telegramie przyciskiem «✅ Взять в работу». Lead staje się Twój, status zmienia się na «w toku». U kolegów karta w Telegramie zmienia się na «✅ В работе у @ник».",
          "Po 4 godzinach bot zapyta, co dalej z tym leadem. Jeśli klient dalej pisze do bota, dostajesz «💬 Клиент написал в бот». W nocy, od 21:00 do 08:00, tych linijek nie ma, ale korespondencja zapisuje się w karcie.",
          "Kliknąłeś w tej samej chwili co kolega? Leada dostanie jeden, drugi zobaczy «Лида уже взял кто-то другой». Jeśli lead jest teraz zaproponowany komuś innemu, zobaczysz «Не ваша очередь».",
          "«🗄 Отклонить» w Telegramie znaczy „ten klient nie jest nam potrzebny”. Lead zapisze się na Ciebie i dostanie status «odłożony»: widać, kto zdecydował. Przejąłeś, ale nie dasz rady prowadzić? Kliknij w karcie «Zwróć do kolejki» i lead znów będzie wolny.",
        ],
      },
      {
        id: "trash",
        title: "«🗑 Мусор»: usunąć zgłoszenie, które nie jest leadem",
        body: {
          manager: [
            "Ten przycisk jest dla zgłoszeń, które w ogóle nie są leadami: spam, test, przypadkowa osoba, pracownik napisał do bota. W Telegramie nazywa się «🗑 Мусор», w karcie leada i w [«Rozpatrz leady»](#leads-sort) to «🗑 Do śmieci».",
            "Usunąć możesz swojego leada albo niczyjego z kolejki ogólnej. Usunięty lead znika w całości i nie da się go przywrócić, dlatego panel zapyta jeszcze raz. Właściciel i kierownik widzą, kto co usunął.",
            "Prawdziwy klient, którego to nie interesuje, to «❌ Przegrane» albo «🗄 Отклонить», a nie śmieci.",
          ],
          head: [
            "Ten przycisk jest dla zgłoszeń, które w ogóle nie są leadami: spam, test, przypadkowa osoba, pracownik napisał do bota. W Telegramie nazywa się «🗑 Мусор», w karcie leada i w [«Rozpatrz leady»](#leads-sort) to «🗑 Do śmieci».",
            "Usuwasz dowolnego leada, menedżerowie tylko swoje i niczyje. Usunięty lead znika w całości, nie da się go przywrócić. Jeśli usunął menedżer, w dzień dostaniesz linijkę «🗑 @ник убрал лид как мусор».",
            "Prawdziwy klient, który nie jest nam potrzebny, to «🗄 Отклонить», a nie śmieci.",
          ],
          admin: [
            "Ten przycisk jest dla zgłoszeń, które w ogóle nie są leadami: spam, test, przypadkowa osoba, pracownik napisał do bota. W Telegramie nazywa się «🗑 Мусор», w karcie leada i w [«Rozpatrz leady»](#leads-sort) to «🗑 Do śmieci».",
            "Usuwasz dowolnego leada, menedżerowie tylko swoje i niczyje. Usunięty lead znika w całości, nie da się go przywrócić. Jeśli usunął menedżer, w dzień dostaniesz linijkę «🗑 @ник убрал лид как мусор», a wpis zostanie w [dzienniku](/admin/audit).",
            "Prawdziwy klient, który nie jest nam potrzebny, to «🗄 Отклонить», a nie śmieci.",
          ],
        },
      },
      {
        id: "sort",
        title: "«Rozpatrz leady»: zaległe po jednym",
        body: [
          "Przycisk «Rozpatrz leady» stoi nad wyszukiwarką. Otwiera leady po jednym, dużą kartą. Zdecydowałeś i od razu otwiera się następny.",
          "Najpierw idą Twoje leady «w toku», w których od 7 dni lub dłużej nic się nie działo. Potem niczyje nowe z kolejki ogólnej, najstarsze pierwsze. Na górze widać, ile zostało.",
          "Niczyj lead ma przyciski «Weź do pracy», «🗑 Do śmieci» i «Pomiń». Twój ma «🏆 Wygrane», «❌ Przegrane», «⏳ Nadal w toku» z terminem, «🗑 Do śmieci» i «Pomiń». «Pomiń» niczego nie zmienia: lead wróci następnym razem.",
          "Po kliknięciu na górze na parę sekund pojawia się pasek z wynikiem. Ekran zostaje w tym samym miejscu, tak jest w całym panelu.",
        ],
      },
      {
        id: "bot-inbox",
        roles: ["admin", "head"],
        title: "«📩 Обращение в бота»: widzieć klienta i odpowiadać mu z Telegrama",
        body: [
          "Każda wiadomość klienta w bocie studia przychodzi do Ciebie i kierownika jako linijka «📩 Обращение в бота». Jest w niej, kto pisze, jego słowa, odpowiedź bota i link do zgłoszenia, jeśli istnieje. Wiadomość głosowa, zdjęcie albo plik przyjdą zaraz po niej jako kopia.",
          "Żeby odpowiedzieć, w Telegramie kliknij tę wiadomość, wybierz odpowiedź i napisz. Odpowiedź pójdzie do klienta od bota studia, a nie z Twojego konta. Drugie z was dostanie «✍️ … ответил в боте», żebyście nie odpowiadali we dwoje.",
          "Po Twojej odpowiedzi bot milczy 7 dni: rozmowę prowadzisz Ty. Każda Twoja odpowiedź przedłuża ten czas. Jeśli bot sam nie zdołał odpowiedzieć, w linijce będzie «⚠️ Модель не ответила». Wtedy koniecznie odpisz klientowi, bo czeka.",
          "W nocy, od 21:00 do 08:00, linijek nie ma. O 08:00 przyjdzie «🌙 Писал боту ночью» dla każdego, kto pisał, na to też można odpowiedzieć. Jeśli klient pisze nie po rosyjsku, pod jego słowami będzie «🇷🇺 Перевод». Linijki wyłącza zaznaczenie «Wiadomości do bota» w [Zespole](/admin/team).",
        ],
      },
      {
        id: "bot-write",
        title: "«Do klienta od bota studia»: napisać pierwszy",
        body: [
          "Jeśli klient sam pisał do bota studia, możesz napisać do niego pierwszy. W polu pod [«Oś zdarzeń»](#leads-timeline) wybierz «Do klienta od bota studia», wpisz tekst i kliknij «Wyślij». Wiadomość pójdzie od bota studia, a nie z Twojego konta.",
          "Tak mogą pisać osoba prowadząca leada, kierownik i właściciel. Jeśli klient nie pisał do bota albo go zablokował, takiego wyboru nie ma. Po wysłaniu bot milczy 7 dni, rozmowę prowadzisz Ty. Odpowiedź klienta przyjdzie do Ciebie w Telegramie.",
        ],
      },
      {
        id: "bot-card",
        title: "Karta leada w Telegramie",
        body: [
          "Karta nowego leada w Telegramie jest krótka. Widać w niej, jak ciepły jest klient: «🔥 Горячий», «🟡 Тёплый», «🌱 Присматривается» albo «👤 Просит живого человека». Dalej numer zgłoszenia, kto i skąd pisze, «Что хочет», budżet i terminy, jeśli klient je podał.",
          "Na dole «Можно начать так»: gotowa pierwsza wiadomość do klienta. Kliknij ją, a się skopiuje. Cała korespondencja i szczegóły są w karcie w panelu, przycisk «🔓 Открыть карточку».",
        ],
      },
      {
        id: "list",
        title: "Lista leadów: filtry i kolumny",
        body: [
          "Menedżer widzi wolne leady i swoje, kierownik i właściciel widzą wszystkie. U nich pod statusem widać nick osoby, która prowadzi leada. Na stronie jest 50 leadów.",
          "«Budżet» to nie kwota, tylko to, jak klient mówi o pieniądzach: «podany i zatwierdzony», «jest, porównuje oferty» albo «nie podany». «Ocena» to liczba od 0 do 100 z literą: A od 75, B od 55, C od 35, D niżej.",
          "«Priorytet» podpowiada, do kogo pisać najpierw. «gorące» znaczy ocena A albo klient prosi o żywego człowieka, «ciepłe» znaczy B, «do dojrzenia» to pozostałe, «archiwum» znaczy, że klient odmówił. «Następny krok» to najbliższe [przypomnienie](#leads-next-step) dla leada.",
          "Na liście nie ma danych kontaktowych: otwierają się w [karcie](#leads-card), a każde otwarcie jest zapisywane. Leady od partnera są wyróżnione na żółto. Dopóki taki lead jest niczyj, stoi pierwszy na liście.",
        ],
      },
      {
        id: "add",
        title: "«Dodaj leada ręcznie»: klient przyszedł z pominięciem strony i bota",
        body: [
          "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście? Zapisz go przyciskiem «Dodaj leada ręcznie» pod listą. Obowiązkowe są «Imię klienta» i «Telefon, Telegram lub e-mail», reszta jest opcjonalna.",
          "Lead od razu jest w toku, bez kolejki, a po 4 godzinach bot zapyta, co dalej. Menedżer dodaje leada sobie. Kierownik i właściciel wybierają w «Komu lead» dowolnego pracownika, a on dostaje «Вам добавили лид».",
          "Na górze formularza jest «Kto to jest»: «Klient», «Agencja» albo «Bloger». Agencję załóż w sekcji [«Agencje»](/admin/agencies), tam liczą się jej 15%. Blogera jako partnera zakładają kierownik i właściciel.",
        ],
      },
      {
        id: "card",
        title: "Karta leada",
        body: {
          manager: [
            "Kartę otworzysz z listy, z «Pulpit» albo przyciskiem «🔓 Открыть карточку» w Telegramie. Każde otwarcie trafia do dziennika.",
            "«Prowadzi» pokazuje, czyj jest lead. Tam są też przyciski [«Przejmij» i «Zwróć do kolejki»](#leads-take) oraz [«Poproś o przekazanie»](#leads-transfer).",
            "«Status» zmieniaj po każdej rozmowie: «w toku», «odłożony», «wygrany» albo «przegrany». Według statusów liczy się statystyka. «wygrany», «przegrany» i «odłożony» wyłączają automatyczne przypomnienia.",
            "«Pokaż dane kontaktowe» otwiera telefon lub nick klienta. «Pokaż korespondencję» w [«Oś zdarzeń»](#leads-timeline) pokazuje, co klient powiedział botowi albo czatowi na stronie. Oba przyciski działają tylko dla przejętego leada, a każde kliknięcie jest zapisywane.",
            "Żółta etykieta przy numerze zgłoszenia znaczy, że klient ma rabat 30%. «napisał w pierwszej minucie»: napisał, gdy na stronie leciał licznik. «nie zdążyliśmy w 20 sekund»: odpowiedzieliśmy później, niż obiecaliśmy, tu warto przeprosić. Rabat jest już obiecany, uwzględnij go w cenie.",
            "Niżej brief, kosztorys ze strony i notatki. Klienta przyprowadził partner? Wpisz go w pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
            "**Bot przypomina o zapomnianych leadach.** W dni robocze o 10:00 i 16:00 przysyła Twoje leady «w toku», w których przez 7 dni nic się nie działo. Każdy ma przyciski «🏆» (wygrane), «❌» (przegrane), «⏳» (nadal w toku) i «🔓» (otwórz kartę).",
            "«⏳» zapyta, kiedy następny krok: «Завтра», «Через 3 дня» albo «Через неделю». Bot ustawi Ci na ten dzień zadanie kontaktu i do tego czasu nie zapyta. Trzeci raz z rzędu «⏳» kliknąć się nie da, zostaną tylko «🏆» i «❌».",
            "Bot powtarza pytanie, dopóki nie odpowiesz. Dwa dni robocze bez odpowiedzi i dowie się o tym kierownik. Lead bez ruchu od 21 dni, przy którym milczałeś trzy dni, bot sam przestawi na «przegrany». Przywrócisz go statusem «w toku».",
            "W bocie «🏆 Выиграли» → «Завести проект»: formularz projektu wypełni się z leada, a projekt zapisze się na Ciebie. Tak transakcja trafi do Twoich naliczeń.",
          ],
          head: [
            "Otwierasz dowolną kartę i zmieniasz status dowolnego leada. Wolny lead ma przycisk [«Przejmij»](#leads-take), przejęty ma «Zwróć do kolejki» i [«Przekaż»](#leads-transfer). Twoje przekazanie działa od razu.",
            "«Pokaż dane kontaktowe» i «Pokaż korespondencję» działają dla każdego przejętego leada. Wolnego najpierw przejmij: w kolejce jesteś na równi ze wszystkimi. Każde otwarcie trafia do dziennika.",
            "Żółta etykieta przy numerze zgłoszenia znaczy, że klientowi obiecano rabat 30%, obok jest powód. Niżej brief, kosztorys i pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
            "**Bot przypomina o zapomnianych leadach.** W dni robocze o 10:00 i 16:00 przysyła każdemu, Tobie też, leady «w toku», w których przez 7 dni nic się nie działo. Przyciski: «🏆», «❌», «⏳» z terminem («Завтра», «Через 3 дня», «Через неделю») i «🔓» do karty.",
            "Ty i właściciel dostajecie linijki pod zaznaczeniem «Raporty»: lead odkładany trzeci raz, człowiek od dwóch dni roboczych nie odpowiada botowi, bot sam przestawił leady bez ruchu od 21+ dni na «przegrany». Ile kto ma leadów bez odpowiedzi botowi, widać na [«Pulpit»](/admin/hq).",
          ],
          admin: [
            "Otwierasz dowolną kartę i możesz wszystko: przejąć, zwrócić, przekazać, zmienić status, otworzyć dane kontaktowe i korespondencję. Można to zrobić także przy wolnym leadzie, przed przejęciem. Na górze widać, u kogo jest w kolejce: «👁 В очереди у … до 14:30».",
            "Żółta etykieta przy numerze zgłoszenia znaczy, że klientowi obiecano rabat 30%, obok jest powód. Ile jest takich rabatów, widać w [Statystykach](/admin/stats). Niżej brief, kosztorys i pole [«Kod promocyjny lub kto przyprowadził»](#leads-partner-code).",
            "**Bot przypomina o zapomnianych leadach.** W dni robocze o 10:00 i 16:00 przysyła człowiekowi jego leady «w toku», w których przez 7 dni nic się nie działo. Przyciski: «🏆», «❌», «⏳» z terminem («Завтра», «Через 3 дня», «Через неделю») i «🔓» do karty.",
            "Ty i kierownicy dostajecie linijki pod zaznaczeniem «Raporty»: lead odkładany trzeci raz, człowiek od dwóch dni roboczych milczy, bot sam przestawił leady bez ruchu od 21+ dni na «przegrany». Gdy leadów bez odpowiedzi botowi jest więcej niż pięć, na «Pulpit» pojawia się linijka w «Wymaga uwagi».",
            "Po «🏆» bot proponuje założenie projektu, a w formularzu prowadzącym jest już osoba, która ma leada. Tak transakcja trafia do naliczeń właściwej osoby.",
          ],
        },
      },
      {
        id: "partner-code",
        title: "«Kod promocyjny lub kto przyprowadził»: klient od partnera",
        body: [
          "Klient podał kod promocyjny (słowo łacińskimi literami, np. AZIZ) albo powiedział, kto go przyprowadził? Wpisz to w karcie w pole «Kod promocyjny lub kto przyprowadził» i kliknij «Zapisz». Można wpisać też nazwę partnera. Mogą to zrobić osoba prowadząca leada, kierownik i właściciel.",
          "Lead zapisze się na partnera, a on dostanie wiadomość w Telegramie. Gdy klient zapłaci za projekt, procent partnera policzy się sam. Jeśli klient był już wcześniej w studiu, lead zapisze się z dopiskiem «nie zaliczono».",
          "Jeśli klient sam napisał kod na czacie albo w bocie, lead zapisze się na partnera bez Ciebie. Panel odpowiedział «Nie ma takiego kodu»? Sprawdź u klienta, jak się pisze, albo zapytaj kierownika. Partnera przy zapisanym leadzie zmieni tylko właściciel.",
        ],
      },
      {
        id: "timeline",
        title: "«Oś zdarzeń»: wszystko o kliencie w jednym miejscu",
        body: [
          "«Oś zdarzeń» w karcie leada pokazuje wszystko o kliencie według czasu, najstarsze na górze. Jest tam korespondencja z klientem, notatki zespołu, przebyte etapy sprzedaży i przypomnienia.",
          "Korespondencję z kontaktu i przypomnienia widzi osoba prowadząca leada. Notatki i etapy widzą wszyscy, którzy otworzyli kartę. Korespondencja z czatu na stronie albo z bota otwiera się przyciskiem «Pokaż korespondencję».",
          "Pod osią jest jedno pole odpowiedzi. Nad nim wybierz, dokąd pójdzie tekst: «Do klienta z konta „…”» (z tego samego konta firmowego, z którego szła rozmowa), «Do klienta od bota studia» albo «Notatka dla zespołu». Notatka nie trafia do klienta, a osoba prowadząca leada dostanie ją w Telegramie.",
          "Odpisałeś klientowi sam, a bot w tej rozmowie milknie: dalej rozmowa jest Twoja. «Odpowiedzi na zastrzeżenia» wstawiają gotowy tekst, Ctrl+Enter wysyła. Błędnego linku do makiety albo case study panel nie przepuści i podpowie właściwy.",
        ],
      },
      {
        id: "board",
        title: "«Tablica»: leady według etapów sprzedaży",
        body: [
          "Nad listą jest przełącznik «Lista» / «Tablica». Na tablicy firmy z 30 dni są rozłożone w kolumnach: odpisali, zainteresowanie, makieta wysłana, makieta pokazana, cena podana, płatność. Menedżer widzi swoje, kierownik i właściciel cały zespół i pole «Czyje».",
          "Firma stoi w kolumnie najdalszego etapu. Pod nazwą widać, od ilu dni tam jest: tak widać, kto utknął. Tych, którzy jeszcze nie odpisali, na tablicy nie ma, są w sekcji [«Zimne kontakty»](/admin/prospect).",
          "Nad kolumną jest napisane, co bot robi na tym etapie sam. Zainteresowanie, pokaz i cenę zaznacza się przyciskiem na karcie albo przeciągając do kolumny na komputerze. «makieta wysłana» i «płatność» zaznaczają się same.",
        ],
      },
      {
        id: "sales-marks",
        title: "Etapy sprzedaży w karcie: «Jest zainteresowanie», «Pokazałem makietę», «Podałem cenę»",
        body: [
          "W karcie leada jest blok «Etapy sprzedaży». Pokazuje, do którego etapu i kiedy doszedł klient. Większość etapów zaznacza się sama.",
          "Trzy przyciski są na to, czego panel sam się nie dowie. «Jest zainteresowanie»: klient jest zainteresowany, ale nie napisał «+», na przykład powiedział przez telefon. «Pokazałem makietę»: wybierz «na wideo» albo «na żywo». «Podałem cenę»: wpisz kwotę w dolarach.",
          "Zaznaczaj od razu. Niezaznaczony pokaz nie liczy się nigdzie: ani w normie «2 pokazy w tygodniu», ani w raporcie o 18:00. Zaznaczają osoba prowadząca leada, kierownik i właściciel. Kwotę podanej ceny widzi tylko właściciel.",
          "Zaznaczyłeś przez pomyłkę? Kliknij przebyty etap (jest podkreślony kropkami) i potwierdź. Etap i wszystko po nim znikną z liczenia, a w dzienniku zostanie, kto go zdjął. «napisaliśmy» i «płatność» nie da się tak zdjąć.",
        ],
      },
      {
        id: "reminders",
        title: "Przypomnienia",
        body: {
          manager: [
            "Przypomnienia przychodzą od bota w Telegramie z przyciskami «Открыть», «+2 часа» i «Готово». To Twoja pamięć o każdym kliencie.",
            "4 godziny po przejęciu leada bot sam zapyta, co dalej. To automatyczne przypomnienie. Wyłączysz je w karcie przyciskiem «Wyłącz automatyczne przypomnienia». Twoje własne przypomnienia zostaną.",
            "Własne przypomnienie ustawiasz w bloku «Przypomnienia»: «przypomnij za» ile godzin, «o czym przypomnieć» i «Ustaw». Zrobione? Kliknij «zrobione» w karcie albo przycisk w Telegramie.",
            "«nie dostarczono» znaczy, że bot pięć razy nie zdołał do Ciebie napisać. Sprawdź, czy nie zablokowałeś bota, i uruchom go ponownie.",
          ],
          head: [
            "Przypomnienia przychodzą od bota w Telegramie z przyciskami «Открыть», «+2 часа» i «Готово».",
            "Automatyczne przypomnienie przychodzi 4 godziny po przejęciu leada. Własne ustawiasz w bloku «Przypomnienia»: «przypomnij za», «o czym przypomnieć» i «Ustaw».",
            "Ustawiasz i zamykasz przypomnienia przy każdym leadzie, także przy leadach zespołu.",
            "«nie dostarczono» znaczy, że bot pięć razy nie zdołał napisać do tej osoby. Niech sprawdzi, czy nie zablokowała bota.",
          ],
          admin: [
            "Przypomnienia przychodzą od bota w Telegramie z przyciskami «Открыть», «+2 часа» i «Готово». Wysyła je serwer co pięć minut. Jeśli nie robił tego dłużej niż pół godziny, pojawia się czerwony pasek [«Przypomnienia nie są dostarczane»](#leads-banner).",
            "Automatyczne przypomnienie przychodzi 4 godziny po przejęciu leada, własne ustawia się w bloku «Przypomnienia». Ustawiasz i zamykasz przypomnienia przy każdym leadzie.",
            "«nie dostarczono» znaczy, że bot pięć razy nie zdołał napisać do tej osoby: zablokowała bota albo nigdy go nie uruchomiła.",
          ],
        },
      },
      {
        id: "next-step",
        title: "«Następny krok»: co dalej z każdym leadem",
        body: [
          "«Następny krok» to najbliższe przypomnienie dla leada: kiedy i co zrobić. Widać go w kolumnie na liście i na górze bloku «Przypomnienia» w karcie. Krok po terminie jest czerwony.",
          "Lead «w toku» bez przypomnienia ma na liście żółte «brak kroku». Znaczy to, że o kliencie zapomniano. Ustaw przypomnienie, a krok się pojawi.",
          "Dopóki krok jest przed Tobą, bot nie pyta o tego leada o 10:00 i 16:00. Zrobiłeś krok? Kliknij «zrobione» i od razu ustaw następny.",
        ],
      },
      {
        id: "transfer",
        title: "Przekazać leada koledze",
        body: {
          manager: [
            "Nie nadążasz z leadem albo lepiej pasuje do kolegi? W karcie, w bloku «Przekazanie», wybierz komu, napisz dlaczego i kliknij «Poproś o przekazanie».",
            "Dopóki kierownik albo właściciel nie zatwierdzi, lead zostaje u Ciebie. Kierownik i właściciel dostają w Telegramie wiadomość z przyciskami «Подтвердить» (zatwierdź) i «Отклонить» (odrzuć).",
            "Zatwierdzili i lead przechodzi do kolegi razem z całą korespondencją. Dostaje on wiadomość i przypomnienie po 4 godzinach. Odrzucili i dostaniesz «Передачу лида не подтвердили».",
            "Wolnego leada się nie przekazuje. Bierze się go przyciskiem «Przejmij».",
          ],
          head: [
            "Twój przycisk to «Przekaż»: lead od razu idzie do wybranej osoby, a ona dostaje wiadomość «…передал вам лид».",
            "Prośby menedżerów przychodzą do Ciebie w Telegramie z przyciskami do zatwierdzenia i odrzucenia. Decyduj od razu tam. Te same prośby widać w «Leady» w bloku «Czeka na Twoją decyzję» i w karcie leada.",
            "Kto zdecyduje pierwszy, temu u pozostałych przyciski zmienią się na wynik. Lead idzie razem z korespondencją. Stare przypomnienia poprzedniej osoby zamknij sam, jeśli trzeba.",
          ],
          admin: [
            "Twój przycisk to «Przekaż»: lead idzie od razu. Prośby menedżerów przychodzą do Ciebie i kierownika w Telegramie z przyciskami do zatwierdzenia i odrzucenia. Widać je też w «Leady» w bloku «Czeka na Twoją decyzję».",
            "Kto zdecyduje pierwszy, temu u pozostałych przyciski zmienią się na wynik. Do decyzji lead zostaje u poprzedniej osoby. Lead idzie razem z korespondencją.",
          ],
        },
      },
      {
        id: "urgent",
        title: "Leady bez ruchu: jedna zasada",
        body: [
          "Lead «bez ruchu» to lead w statusie «w toku», przy którym od 7 dni lub dłużej nic nie zrobiono. Nikt nie pisał do klienta, nie zostawił notatki, nie zmienił statusu i nie ustawił przypomnienia.",
          "Samo otwarcie karty albo odpowiedź botowi «⏳ Ещё в работе» się nie liczy. Popatrzeć to nie znaczy się zająć.",
          "Zasada jest jedna dla całego panelu i bota. Według niej liczą się «Wymaga uwagi» i «Zaległe» na «Pulpit», kolumna «Bez ruchu» w zespole i pytania bota o 10:00 i 16:00. Żeby lead zniknął z tego liczenia, napisz do klienta, zmień status albo ustaw przypomnienie.",
        ],
      },
      {
        id: "plan-fact",
        title: "«Plan i wykonanie»",
        body: {
          manager: [
            "Blok «Plan i wykonanie» stoi na dole [«Pulpit»](#hq-week). Są w nim cele na tydzień albo miesiąc, które Ci ustawiono. «wpływy, $» to pieniądze od klientów z Twoich projektów. «wygrane leady» to transakcje. «pierwsze kontakty» to ile razy kliknąłeś «Pokaż dane kontaktowe».",
            "Pasek pokazuje, ile zrobiono: od 100% jest zielony, poniżej 50% złoty. Tydzień liczy się od poniedziałku. Plan ustawia kierownik albo właściciel.",
          ],
          head: [
            "Blok «Plan i wykonanie» stoi na dole [«Pulpit»](#hq-week). Są w nim cele na tydzień albo miesiąc: «wpływy, $», «wygrane leady» i «pierwsze kontakty» (kliknięcia «Pokaż dane kontaktowe»).",
            "Możesz ustawić plan swojemu menedżerowi: «Dla kogo», «Okres», «Wskaźnik», «Cel» i «Ustaw plan». Zmienić i usunąć plan może tylko właściciel. Sobie planu nie ustawia nikt.",
          ],
          admin: [
            "Blok stoi na dole [«Pulpit»](#hq-week), w części «Tydzień: rekomendacje, zespół, plan». Ustawiasz plan komukolwiek i możesz dowolny «zmień» albo «usuń». Kierownik tylko dodaje plan swoim menedżerom.",
            "Wskaźniki: «wpływy, $», «wygrane leady» i «pierwsze kontakty» (kliknięcia «Pokaż dane kontaktowe»). Okres: bieżący tydzień od poniedziałku albo bieżący miesiąc.",
          ],
        },
      },
      {
        id: "coach",
        title: "Rekomendacje",
        body: {
          manager: [
            "«Rekomendacje na tydzień» są na dole «Pulpit». Powstają w poniedziałki od 06:00 na podstawie Twoich liczb z poprzedniego tygodnia: «Na co zwrócić uwagę», «Co robić», «Czego się nauczyć», «Co idzie dobrze».",
            "To podpowiedź, a nie ocena. Za tydzień będą nowe.",
          ],
          head: [
            "«Na dziś» powstaje codziennie rano od 07:00: co zrobić dziś z Twoimi leadami i leadami zespołu.",
            "«Rekomendacje na tydzień» przychodzą w poniedziałki od 06:00, do Ciebie i każdego w zespole. Rady dla zespołu są zebrane w bloku «Rekomendacje dla zespołu na tydzień», wygodnie je omawiać na odprawie.",
          ],
          admin: [
            "Tygodniowe rekomendacje powstają w poniedziałki od 06:00 dla wszystkich oprócz Ciebie. «Na dziś» powstaje codziennie rano od 07:00 dla Ciebie i kierowników.",
            "Przycisk «wygeneruj ponownie» masz tylko Ty. Każde generowanie kosztuje pieniądze, więc klikaj, gdy naprawdę trzeba.",
          ],
        },
      },
      {
        id: "team-week",
        title: "«Zespół w tym tygodniu»",
        roles: ["head", "admin"],
        body: {
          head: [
            "Tabela dla Ciebie i Twojego zespołu za ten tydzień. Strzałka porównuje z poprzednim tygodniem.",
            "«W toku» to leady ze statusem «w toku». «Bez ruchu» to ile z nich stoi 7+ dni [bez kroku](#leads-urgent). «Kontakty» to wszystkie działania z leadami w tygodniu, a nie zimne kontakty.",
            "«Pierwsze kontakty» to kliknięcia «Pokaż dane kontaktowe». «Wpływy» to pieniądze z projektów danej osoby. «Plan kontaktów» to zimne kontakty wobec planu, który ustawiasz w [Zespole](/admin/team).",
            "«Najlepsi w tygodniu» pojawiają się, gdy w zespole są co najmniej dwie osoby.",
          ],
          admin: [
            "Tabela dla wszystkich oprócz Ciebie. Strzałka porównuje z poprzednim tygodniem.",
            "«Kontakty» to działania z leadami, a zimne kontakty są w kolumnie «Plan kontaktów». «Pierwsze kontakty» to kliknięcia «Pokaż dane kontaktowe». «Do wypłaty» widzisz tylko Ty.",
          ],
        },
      },
      {
        id: "banner",
        title: "Czerwony pasek «Przypomnienia nie są dostarczane»",
        body: {
          manager: [
            "Pasek pojawia się na górze «Pulpit» i «Leady», jeśli przez ponad pół godziny nikt nie wysyłał przypomnień. Od razu powiedz właścicielowi. Dopóki wisi, sprawdzaj przypomnienia w kartach sam.",
          ],
          head: [
            "Pasek pojawia się, gdy serwer przez ponad pół godziny nie wysyłał przypomnień. Dopóki wisi, przypomnienia nie przychodzą do nikogo. Powiedz właścicielowi.",
          ],
          admin: [
            "Serwer co pięć minut wysyła przypomnienia, przesuwa kolejkę leadów i rozdaje porcje kontaktów. Pasek pojawia się, jeśli udanego przebiegu nie było ponad 30 minut.",
            "Szybki przegląd: GitHub, Actions, «Осмотр связи с сервером». Co sprawdzić na serwerze, jest napisane na samym pasku.",
          ],
        },
      },
    ],
  },
};
