import type { HelpCopy } from "../admin-help";
import type { HelpEntry } from "@/lib/admin/help";

/** Zadania w Telegramie — wspólne dla wszystkich ról; ostatni akapit każda rola ma swój. */
const TASKS_BOT = [
  "Gdy ktoś zleca Ci zadanie, bot wysyła wiadomość: od kogo, co zrobić, termin — i przycisk **«✅ Взять в работу»** (przyjmij do realizacji). Po kliknięciu w tej samej wiadomości pojawiają się **«✅ Сделано»** (zrobione), **«✖ Не сделано»** (niezrobione) i **«🕑 Перенести срок»** (przesuń termin). To, co klikniesz w Telegramie, od razu widać w panelu, i odwrotnie: przyjmiesz zadanie w panelu — przyciski w Telegramie zmienią się same.",
  "«🕑 Перенести срок» proponuje «+1 час», «Завтра 18:00», «+3 дня», «Неделя» i «✏️ Своя дата» (+1 godzina, jutro 18:00, +3 dni, tydzień, własna data). Po «✏️ Своя дата» napisz botowi termin w jednej wiadomości — dzień, miesiąc i godzinę czasu taszkenckiego, na przykład `05.10 15:00`. Bot czeka na taką wiadomość 30 minut.",
  "Osobie, która zleciła zadanie, bot pisze o każdym kroku: przyjął(ęła) do realizacji, zrobione, niezrobione, przesunął(ęła) termin na taki a taki dzień i godzinę. Do wykonawcy bot pisze, jeśli zlecający przesunął termin albo anulował zadanie.",
  "Przypomnienia: jeśli nowe zadanie nie zostanie przyjęte w ciągu 30 minut od wiadomości bota — bot przypomni; godzinę przed terminem — przypomni jeszcze raz; gdy termin minie — raz napisze i do wykonawcy, i do zlecającego. Po przesunięciu terminu «za godzinę termin» i «po terminie» przyjdą od nowa — już do nowego terminu.",
  "Wiadomości o działaniach — nowe zadanie, przyjęcie, zrobione, przesunięcie, anulowanie — przychodzą od razu, w każdy dzień, poza nocą: od 23:00 do 07:00 czasu taszkenckiego bot milczy, a to, co przyszło w nocy, dotrze o 07:00. Przypomnienia — «nie przyjęto», «za godzinę termin», «po terminie» — tylko w dni robocze od 09:00 do 19:00, jak porcja dnia. W panelu wszystko widać od razu, a odpowiedź na kliknięty przycisk przychodzi o każdej porze.",
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
  "title" | "lead" | "contentsTitle" | "sectionsTitle" | "openSection" | "viewAs" | "roleNames" | "ownerOnly" | "search" | "video"
> = {
  title: "Instrukcje",
  lead: "Jak działa panel i jak z niego korzystać — sekcja po sekcji, prostymi słowami. Znajdziesz tu tylko to, do czego masz dostęp. Z każdej sekcji prowadzi tu przycisk «Jak korzystać z sekcji» w nagłówku, a «?» przy blokach otwiera właściwy punkt.",
  contentsTitle: "Spis treści",
  sectionsTitle: "Sekcje",
  openSection: "otwórz sekcję",
  viewAs: "Pokaż jako:",
  roleNames: { admin: "właściciel", head: "kierownik", manager: "menedżer" },
  ownerOnly: "Widzi tylko właściciel",
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
  /* ── Лиды ─────────────────────────────────────────────────────────── */
  "/admin": {
    what: "Strona główna panelu i wszystkie zgłoszenia klientów: z czatu na stronie, formularza, bota w Telegramie, witryny, «Wyszukiwania» i Twoich kontaktów. Widać tu, kto napisał, czego potrzebuje, jak pilna jest sprawa i kto się nią zajmuje. Każde działanie na leadzie — przejęcie, otwarcie danych kontaktowych, zmiana statusu — trafia do dziennika z imieniem i godziną.",
    items: [
      {
        id: "home",
        title: "Co jest na stronie głównej",
        body: {
          manager: [
            "Na samym początku strony głównej jest blok [«Zadania»](#leads-tasks): co zlecono Tobie, co Ty zleciłeś i formularz «Zleć zadanie». Niżej są kafelki: **«do wypłaty»** — ile już zarobiłeś, a jeszcze nie dostałeś (niżej drobnym drukiem — ile czeka, aż klient dopłaci), **«leady w toku»**, **«pilny kontakt»** i **«wpływy w miesiącu»** z Twoich projektów.",
            "Jeśli kierownik ustalił Ci plan kontaktów, nad kafelkami zobaczysz wiersz w rodzaju «Do planu zostało 12 — w tym tygodniu 18 z 30». Szczegóły — w punkcie [plan kontaktów](#prospect-plan).",
            "Niżej: [«Pilny kontakt»](#leads-urgent) — Twoje leady, które od dawna stoją w miejscu; «Rekomendacje na tydzień» — co poprawić (zob. [rekomendacje](#leads-coach)); [«Plan i wykonanie»](#leads-plan-fact) — cele, które Ci wyznaczono; a na samym dole — [lista leadów](#leads-list).",
          ],
          head: [
            "Na początku — **«Czeka na Twoją decyzję»**: prośby menedżerów o przekazanie leada koledze. Decydujesz Ty albo właściciel — szczegóły w punkcie [przekazanie leada](#leads-transfer). Pod nimi — blok [«Zadania»](#leads-tasks): co zlecono Tobie i co Ty zleciłeś.",
            "Kafelki liczą Ciebie i Twój zespół razem: **«do wypłaty»** — tylko Twoje saldo, **«leady zespołu w toku»**, **«pilny kontakt»**, **«wpływy w tygodniu»**.",
            "Dalej: «Na dziś» — poranne wskazówki do Twoich leadów, [«Pilny kontakt»](#leads-urgent) dla Ciebie i zespołu z imionami, [«Zespół w tym tygodniu»](#leads-team-week), rekomendacje dla zespołu i dla Ciebie, «Najlepsi w tygodniu», [«Plan i wykonanie»](#leads-plan-fact) i [lista leadów](#leads-list).",
            "Zespół to menedżerowie przypisani do Ciebie w sekcji [«Zespół»](/admin/team). Dopóki nie masz zespołu, jego bloków na stronie głównej nie ma.",
          ],
          admin: [
            "Twoja strona główna jest podzielona na zakładki, żeby nie przewijać jednej długiej listy. Zakładka zapisuje się w adresie — możesz ją dodać do zakładek przeglądarki.",
            "**«Dziś»** — od czego zacząć dzień: «Czeka na Twoją decyzję» (prośby o przekazanie leada), blok [«Zadania»](#leads-tasks), «Umowy do podpisu», kafelki z pieniędzmi, wskazówki «Na dziś» (przycisk «wygeneruj ponownie» zużywa jedno wywołanie modelu), «Pilny kontakt» dla całego studia i terminy podatkowe na dwa tygodnie.",
            "**«Leady»** — [lista leadów](#leads-list) ze wszystkimi filtrami. Złota liczba na zakładce — ile leadów jest teraz wolnych.",
            "**«Finanse»** — «Kasa w podziale na miesiące» (wpływy i wydatki z pół roku, pod każdym miesiącem — różnica) i «Oczekiwane płatności»: ile jeszcze klienci mają zapłacić w aktywnych projektach.",
            "**«Zespół»** — [tabela tygodnia](#leads-team-week), najlepsi, rekomendacje dla każdego i [«Plan i wykonanie»](#leads-plan-fact), gdzie ustalasz i zmieniasz cele.",
            "Ruch na stronie z Metryki (Yandex Metrica) i Google Analytics to nie zakładka, tylko osobna sekcja [«Ruch»](/admin/traffic): widzisz ją Ty i kierownicy. Stare zakładki przeglądarki do dawnej zakładki prowadzą tam samo.",
          ],
        },
      },
      {
        id: "tasks",
        title: "Zadania: zlecanie, przyjmowanie, zamykanie",
        body: [
          "Blok **«Zadania»** stoi na stronie głównej nad wszystkim innym (u właściciela — na zakładce «Dziś»). Zadanie może zlecić każdy pracownik każdemu, także sobie: menedżer — kierownikowi, kierownik — właścicielowi, ktokolwiek — komukolwiek. Zadanie widzą zlecający i wykonawca; jeśli dotyczy projektu — także wszyscy, którzy otwierają kartę tego projektu.",
          "**«Dla mnie»** — zadania dla Ciebie: na górze najbliższy termin, niżej dalsze, zadania bez terminu — na samym końcu. Nowe jest oznaczone «nowe» i czeka na przycisk **«Przyjmij do realizacji»**: dzięki temu zlecający widzi, że zadanie zobaczyłeś i przyjąłeś. Przyjęte jest «w toku», a pod nim są **«Zrobione»** i **«Niezrobione»**. Zadanie, którego termin minął, jest podświetlone na czerwono i oznaczone «po terminie».",
          "**«Przesuń termin»** otwiera warianty: «+1 godz.», «Jutro 18:00», «+3 dni», «Tydzień» — albo własna data i godzina z przyciskiem «Przesuń na». «+1 godz.», «+3 dni» i «Tydzień» liczą się od terminu, a jeśli już minął albo terminu nie było — od bieżącej chwili, żeby nowy termin nie wypadł w przeszłości. Zadanie bez terminu ma w tym miejscu **«Ustal termin»** z tymi samymi wariantami. Termin przesuwa i wykonawca, i zlecający — drugiej stronie bot od razu pisze nowy termin. Każde przesunięcie zostaje w historii zadania: stary termin, nowy i kto przesunął.",
          "**«Zleciłem»** — zadania, które zleciłeś innym, i co się z nimi teraz dzieje: «nowe» (jeszcze nieprzyjęte), «w toku», «zrobione», «niezrobione», «po terminie». Zamknięte są tu widoczne jeszcze przez tydzień. «Zrobione» i «Niezrobione» klika tylko wykonawca — dlatego «zrobione» zawsze znaczy, że zrobił to sam wykonawca. Możesz przesunąć termin albo kliknąć **«Anuluj zadanie»**, jeśli zlecono je przez pomyłkę albo nie jest już potrzebne: zadanie stanie się «anulowane», wykonawca dostanie wiadomość, a przyciski w jego Telegramie zmienią się na «🚫 Задача отменена» (zadanie anulowane).",
          "**«Zleć zadanie»** — na dole bloku: «Komu» (pola wyboru: jedna osoba albo kilka), «Co zrobić», «Szczegóły (opcjonalnie)», «Projekt (opcjonalnie)» i «Termin» — «dziś do 18:00», «jutro» i «za 3 dni» (oba do 18:00), «bez terminu» albo «własna data». Czas wszędzie taszkencki. Projekt wybiera się z otwartych projektów sekcji [«Projekty»](/admin/projects): najpierw zakłada się tam projekt klienta, potem można przypisywać do niego zadania. Ani projekt, ani termin nie są obowiązkowe. Jeśli zaznaczysz kilka osób, każda dostaje własne zadanie z tym samym tekstem, terminem i projektem: każdy sam je przyjmuje i zamyka, termin przesuwa się każdemu osobno, a w «Zleciłem» widać, kto już zaczął, a kto jeszcze nie. Ty sam jesteś na liście zaznaczony od razu — odznacz się, jeśli zadanie nie jest dla ciebie. Gdy tylko zadanie zostanie zlecone, bot od razu pisze do wykonawcy na Telegramie — do każdej zaznaczonej osoby. Zadanie dla siebie od razu jest «w toku» — nie trzeba go przyjmować i bot o nim nie pisze. Kto co zlecił, przyjął, zamknął, przesunął i anulował, zapisuje się w dzienniku działań.",
        ],
      },
      {
        id: "tasks-filter",
        title: "Kolejność, grupy i projekty w zadaniach",
        body: [
          "Domyślnie zadania idą od najbliższego terminu do najdalszego: co się pali, jest na górze. Zadania bez terminu — na końcu, najnowsze pierwsze. W «Zleciłem» najpierw są otwarte, niżej — zamknięte w ciągu tygodnia.",
          "Nad listami jest filtr. **«Grupuj»**: «bez grupowania» (po prostu według terminu), «według terminu» — grupy «Po terminie», «Termin dziś», «Termin jutro», «W ciągu 7 dni», «Później», «Bez terminu»; «według projektu» — zadania każdego projektu razem, «Bez projektu» na końcu; «według osoby» — w «Dla mnie» według zlecającego, w «Zleciłem» — według wykonawcy. Wewnątrz grupy kolejność jest ta sama — od najbliższego terminu.",
          "**«Projekt»** zostawia zadania jednego projektu albo «Bez projektu». Wybierz i kliknij **«Pokaż»**. Wybór zapisuje się w adresie strony: nie resetuje się po kliknięciu przycisków w zadaniach, a stronę z nim możesz dodać do zakładek przeglądarki.",
          "Zadanie z projektem ma w wierszu jego nazwę — kliknij, a otworzy się karta projektu. W karcie projektu są wszystkie jego zadania i link «Zleć zadanie»: prowadzi na stronę główną z tym projektem już wybranym w formularzu.",
        ],
      },
      {
        id: "tasks-bot",
        title: "Zadania w Telegramie i przypomnienia",
        body: {
          manager: [...TASKS_BOT, "Jeśli nie potrzebujesz wiadomości o zadaniach w Telegramie, wyłącza je kierownik albo właściciel — polem «Zadania» w Twoich powiadomieniach. Zadania zostają przy tym na stronie głównej panelu, a dźwięk w przeglądarce działa jak wcześniej."],
          head: [...TASKS_BOT, "Wiadomości o zadaniach wyłącza się polem «Zadania» w [powiadomieniach](#team-notices) danej osoby — u siebie i u swoich menedżerów zmieniasz je w sekcji «Zespół». Zadania zostają przy tym na stronie głównej, a dźwięk w przeglądarce działa."],
          admin: [...TASKS_BOT, "Wiadomości o zadaniach wyłącza się polem «Zadania» w [powiadomieniach](#team-notices) — u każdego pracownika, w sekcji «Zespół». Zadania zostają przy tym na stronie głównej, a dźwięk w przeglądarce działa."],
        },
      },
      {
        id: "tasks-alerts",
        title: "Dźwięk i powiadomienia w przeglądarce",
        body: [
          "Dopóki panel jest otwarty — w dowolnej sekcji — co 45 sekund pyta serwer, czy jest coś nowego: zadanie zlecone Tobie, przesunięcie terminu albo anulowanie Twojego zadania przez zlecającego lub krok w zadaniu, które Ty zleciłeś (przyjęte, zrobione, niezrobione, przesunięty termin). Jeśli tak — rozlega się krótkie «ding-dong», w prawym dolnym rogu pojawia się okienko z przyciskiem «Otwórz zadania», a strona główna odświeża się sama.",
          "Żeby dodatkowo wyskakiwało powiadomienie systemowe — nawet gdy karta przeglądarki jest zwinięta — kliknij **«Włącz powiadomienia»** w bloku zadań i zezwól na nie w oknie przeglądarki. Przeglądarka pyta o zgodę dopiero po kliknięciu — dlatego jest przycisk. Po wyrażeniu zgody w jego miejscu pojawia się «Powiadomienia włączone».",
          "Jeśli przeglądarka odmówiła, zamiast przycisku zobaczysz podpowiedź: na powiadomienia można zezwolić w ustawieniach strony (ikona po lewej stronie adresu). Dźwięk przeglądarka włącza po pierwszym kliknięciu w panelu — wcześniej strona nie może odtwarzać dźwięku, tak działają wszystkie przeglądarki. Twoje własne działania nie są oznaczane dźwiękiem. Panel zamknięty — w przeglądarce nic się nie pojawia, zostaje Telegram.",
        ],
      },
      {
        id: "queue",
        title: "Jak lead trafia do człowieka: kolejka",
        body: {
          manager: [
            "Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie. Kiedyś jedna szybka osoba zabierała wszystko, a na zimne kontakty nikomu nie zostawało czasu.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (także w weekendy), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostajesz w Telegramie kartę: «⏳ Лид ваш на 30 минут — до 14:30» (lead jest Twój przez 30 minut, do 14:30). Pozostali jej nie widzą i nie mogą go przejąć.",
            "Nie przejmiesz go w ciągu 30 minut — lead trafia do kolejnej osoby, a Ty dostajesz «⌛ 30 минут на лид вышли» (30 minut minęło). Przepuszczenie liczy się jako otrzymana szansa: inaczej osoba na urlopie zawsze byłaby pierwsza w kolejce, a każdy lead czekałby na nią pół godziny.",
            "Jeśli nikt nie przejmie leada przez całą rundę, otwiera się on dla wszystkich: «🔓 Никто из очереди не взял — лид открыт всем. Берёт первый, кто нажмёт» (nikt z kolejki nie wziął, lead jest otwarty dla wszystkich, bierze pierwszy, kto kliknie).",
            "**W nocy, od 18:00 do 08:00**, zasada pół godziny nie obowiązuje — lead od razu jest otwarty dla wszystkich w kolejce. Ale można przejąć nie więcej niż równą część na miesiąc: jeśli swoją część już wykorzystałeś, w karcie leada zobaczysz «🌙 …Twoja część na ten miesiąc jest już wykorzystana — trafi do osób, które mają mniej». Inaczej w nocy leady znów zabierałby ten, kto nie śpi.",
            "Dopóki lead jest w kolejce u kogoś innego, nick klienta w karcie jest ukryty — «ukryty — lead nie jest teraz Twój». Leady z Twoich własnych [kontaktów](/admin/prospect) nie trafiają do kolejki: od razu są Twoje.",
            "Jeśli karta nie dotarła do nikogo — na przykład serwer na chwilę stracił połączenie z Telegramem — przyjdzie później, gdy połączenie wróci, z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie: karta nie dotarła przez awarię łączności). Lead jest wtedy rozdzielany od nowa według zasad godziny, w której przyszło dosłanie: w dzień — po kolei, w nocy — wszystkim. Leady starsze niż trzy doby nie są dosyłane.",
            "**Lead «od partnera» — poza kolejką.** To firma, którą partner przypisał w swoim panelu: poręczył za klienta i trzeba zadzwonić jako pierwsi. Taki lead jest od razu otwarty dla wszystkich — bierze pierwszy, kto kliknie «✅ Взять в работу», bez pół godziny i bez nocnego udziału. Karta trafia do wszystkich menedżerów z nagłówkiem «🤝 Приоритет: клиента привёл партнёр», a dopóki nikt go nie weźmie, bot co 15 minut od 08:00 do 18:00 wysyła ją ponownie: «⏰ Клиент от партнёра всё ещё ничей». Przypomnienia ustają, gdy ktoś weźmie leada, albo po tygodniu, jeśli nie weźmie nikt.",
            "**Lead «🤖 Ответ на касание автопрогона»** — klient odpowiedział na pierwszą wiadomość, którą napisał nie człowiek, a automatyczne kontakty studia. Taki lead idzie tą samą kolejką co zgłoszenia ze strony — w dzień po kolei, w nocy do wszystkich. W nagłówku karty — strona firmy, nisza tygodnia i co odpowiedział klient; pierwsza wiadomość i cała rozmowa — w karcie leada. Wziąłeś — lead i rozmowa są Twoje: model dalej odpowiada klientowi w Twoim imieniu, a «Odpowiadam osobiście» w karcie leada przekazuje rozmowę Tobie. Odpowiadaj szybko: klient napisał przed chwilą.",
          ],
          head: [
            "Stoisz w kolejce na równi z menedżerami — zasady są te same. Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (także w weekendy), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostaje ona w Telegramie «⏳ Лид ваш на 30 минут» (lead jest Twój przez 30 minut). Pozostali tej karty nie widzą.",
            "Nie przejął w 30 minut — lead trafia do kolejnej osoby. Przepuszczenie liczy się jako otrzymana szansa. Jeśli nikt nie przejmie go przez całą rundę, lead otwiera się dla wszystkich: bierze pierwszy, kto kliknie.",
            "**W nocy, od 18:00 do 08:00**, lead od razu jest otwarty dla wszystkich w kolejce, ale każdy może przejąć nie więcej niż równą część na miesiąc.",
            "Dopóki lead jest wolny, jego danych kontaktowych i korespondencji nie otworzysz także Ty — najpierw «Przejmij». Nick klienta jest ukryty przed wszystkimi, do których kolejka jeszcze nie doszła. Inaczej kolejkę dałoby się obejść jednym przyciskiem.",
            "W kolejce są tylko osoby z połączonym Telegramem: bez niego nie da się człowiekowi powiedzieć, że lead jest jego.",
            "Karta, która przez awarię łączności serwera z Telegramem nie dotarła do nikogo, jest dosyłana sama, gdy połączenie wróci — z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Leady starsze niż trzy doby nie są dosyłane.",
            "**Lead «od partnera» — poza kolejką**: firma przypisana przez partnera. Otwarty od razu dla wszystkich, bierze pierwszy, kto kliknie; karta «🤝 Приоритет: клиента привёл партнёр» idzie do wszystkich menedżerów i do Ciebie, a dopóki lead jest niczyj, bot powtarza ją co 15 minut od 08:00 do 18:00 («⏰ Клиент от партнёра всё ещё ничей»). Pilnuj, żeby takie leady nie wisiały: przyprowadzają je ludzie, którym studio płaci prowizję.",
            "**Lead «🤖 Ответ на касание автопрогона»** — klient odpowiedział na pierwszą wiadomość automatycznych kontaktów (pisze ją panel sama, bez menedżera — zob. [automatyczne kontakty](#prospect-autopilot)). Taki lead idzie tą samą kolejką co zgłoszenia ze strony: w dzień po kolei, w nocy do wszystkich z równym udziałem. Kto go weźmie, dostaje i lead, i rozmowę: model dalej odpowiada w jego imieniu.",
          ],
          admin: [
            "Jesteś **poza kolejką**: możesz przejąć dowolny wolny lead w dowolnej chwili, a limit nocnej części Cię nie dotyczy. W kolejce stoją menedżerowie i kierownicy z połączonym Telegramem.",
            "W dzień (08:00–18:00 czasu taszkenckiego, codziennie) lead jest proponowany jednej osobie na 30 minut — tej, która w miesiącu ma najmniej «przejął + przepuścił». Ty i czat sprzedaży dostajecie kopię: «👁 В очереди у @ник до 14:30. Вы вне очереди — можете взять сами» (w kolejce u @nick do 14:30, jesteś poza kolejką, możesz przejąć sam). W karcie leada też widzisz, u kogo jest teraz; pozostałym to imię się nie wyświetla, żeby nie zaczynały się spory.",
            "Nie przejął w 30 minut — do następnej osoby; minęła runda — lead otwarty dla wszystkich. Jeśli przejmiesz lead, który jest właśnie komuś proponowany, jego propozycja się zamyka i nie liczy się mu jako przepuszczenie.",
            "W nocy (18:00–08:00) lead jest od razu otwarty dla wszystkich, ale każdy bierze nie więcej niż równą część na miesiąc: «przejęte od początku miesiąca ÷ liczba osób w kolejce», z zaokrągleniem w górę.",
            "Z pominięciem kolejki idą: leady z kontaktów (od razu do osoby, która pisała) i zamówienia z witryny powyżej $10 000 — przychodzą tylko do Ciebie.",
            "Jeśli karta leada nie dotarła do nikogo — serwer stracił połączenie z Telegramem — sweep dośle ją, gdy Telegram znów odpowie: z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Sprawdzanie co pięć minut; leady starsze niż trzy doby nie są dosyłane. Tak 26 września dotarł nocny lead z formularza, który przez dobę leżał niczyj.",
            "**Lead «od partnera» — poza kolejką**: tworzy go samo przypisanie klienta przez partnera ([Partnerzy](/admin/partners)). Otwarty od razu dla wszystkich, bez pół godziny i nocnego udziału. Pierwsza karta «🤝 Приоритет: клиента привёл партнёр» — menedżerom, kierownikom i Tobie; przypomnienia «⏰ Клиент от партнёра всё ещё ничей» — menedżerom i kierownikom co 15 minut od 08:00 do 18:00, dopóki ktoś nie weźmie leada, ale nie dłużej niż tydzień. Ustawienia powiadomień pracownika nie dotyczą tych kart — to priorytet.",
            "**Leady [automatycznych kontaktów](#prospect-autopilot)** idą kolejką jak zgłoszenia ze strony, a nie „do tego, kto pisał”: nie pisał człowiek. Karta — «🤖 Ответ на касание автопрогона» ze stroną, niszą tygodnia i słowami klienta. Prośba o prototyp rozchodzi się rozsyłką «🔥 Нужен прототип», a prośba, żeby więcej nie pisać, leada nie zakłada.",
          ],
        },
      },
      {
        id: "take",
        title: "Przejęcie leada i rezygnacja z niego",
        body: [
          "Leada przejmiesz w jego karcie przyciskiem **«Przejmij»** albo od razu w Telegramie przyciskiem **«✅ Взять в работу»** (weź do pracy) pod kartą. Od tej chwili lead jest Twój: status «w toku», po 4 godzinach przyjdzie automatyczne przypomnienie «Взят в работу — что дальше?» (przejęty — co dalej?), a wszystkim, do których przyszła karta, zmieni się ona na «✅ В работе у @ник» (w toku u @nick).",
          "Jeśli dwie osoby klikną jednocześnie, lead dostanie jedna, a druga zobaczy w panelu «Tego leada przejął już ktoś inny» (w Telegramie — «Лида уже взял кто-то другой»). Jeśli to nie Twoja kolej — «To nie Twoja kolej: lead jest teraz zaproponowany komuś innemu» (w Telegramie — «Не ваша очередь»). Komu dokładnie — celowo nie jest mówione.",
          "**«🗄 Отклонить»** (odrzuć) w Telegramie to decyzja «ten klient nie jest nam potrzebny». Lead najpierw zostaje przypisany do osoby, która kliknęła, a potem dostaje status «odłożony»: odmowa musi mieć autora, a w dzienniku widać, kto zdecydował.",
          "Przejąłeś, ale nie możesz go prowadzić — kliknij **«Zwróć do kolejki»** w karcie. Lead znów będzie wolny i otworzy się dla wszystkich, a Twoje automatyczne przypomnienia do niego zostaną anulowane. Nie pójdzie od nowa przez całą kolejkę: pół godziny na każdą osobę to za długo dla leada, z którym już pracowano.",
        ],
      },
      {
        id: "list",
        title: "Lista leadów: filtry i kolumny",
        body: {
          manager: [
            "Widzisz **wolne leady i swoje**. Lead przejęty przez kolegę nie jest Ci pokazywany ani na liście, ani pod bezpośrednim linkiem — tak zdecydował właściciel. Dlatego kafelek «łącznie» to u Ciebie wolne plus Twoje.",
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
            "Lista jest na zakładce «Leady». Widzisz wszystkie leady. Filtry: «wszystkie leady / wolne / moje leady», priorytet i status; 50 na stronę.",
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
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** nad listą. Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card). Bez kontaktu lead się nie doda: inaczej nie da się skontaktować z klientem.",
            "Lead od razu jest Twój, bez kolejki: status «w toku», numer zgłoszenia, a po 4 godzinach przypomnienie «Взят в работу — что дальше?». W karcie w «Skąd pisał» będzie «dodany ręcznie w panelu». Przekazanie go koledze — jak każdego leada: [«Poproś o przekazanie»](#leads-transfer).",
          ],
          head: [
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** nad listą. Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card).",
            "W formularzu masz **«Komu lead»**: «Sobie» albo dowolny pracownik. Lead od razu jest «w toku» u wybranej osoby, bez kolejki, z numerem zgłoszenia i przypomnieniem po 4 godzinach «Взят в работу — что дальше?»; jeśli przekażesz go komuś innemu, ta osoba od razu dostanie w Telegramie «Вам добавили лид» z linkiem do karty. Menedżerowie nie wybierają: dodają leada tylko sobie.",
          ],
          admin: [
            "Klient zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście — zapisz go przyciskiem **«Dodaj leada ręcznie»** nad listą w zakładce «Leady». Potrzebne są «Imię klienta» i «Telefon, Telegram lub e-mail»; «Firma», «Czego potrzebuje klient» i «Skąd jest klient» są opcjonalne, ale wszystko, co zapiszesz, będzie potem widać w [karcie](#leads-card).",
            "W formularzu jest **«Komu lead»**: «Sobie» albo dowolny pracownik. Lead od razu jest «w toku» u wybranej osoby, bez kolejki, z numerem zgłoszenia i przypomnieniem po 4 godzinach «Взят в работу — что дальше?»; jeśli przekażesz go komuś innemu, ta osoba od razu dostanie w Telegramie «Вам добавили лид» z linkiem. Kto dodał — w [dzienniku](/admin/audit). Menedżerowie dodają leada tylko sobie, kierownik — tak jak Ty.",
          ],
        },
      },
      {
        id: "card",
        title: "Karta leada",
        body: {
          manager: [
            "Otwiera się z listy, z «Pilny kontakt» i przyciskiem «🔓 Открыть карточку» (otwórz kartę) w Telegramie — ten przycisk sam loguje Cię do panelu. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»** — do kogo lead jest przypisany. Tu są przyciski [«Przejmij» i «Zwróć do kolejki»](#leads-take) oraz [«Poproś o przekazanie»](#leads-transfer).",
            "**«Status»** — «nowy», «w toku», «odłożony», «wygrany», «przegrany». Zmieniaj go po każdej rozmowie: na podstawie statusów liczone są [statystyki](/admin/stats) i «Pilny kontakt». «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» ma tylko wolny lead: Twój go nie ma, a żeby zwolnić leada, użyj «Zwróć do kolejki».",
            "**«Dane kontaktowe klienta»** → «Pokaż dane kontaktowe». Otwierają się tylko dla przejętego leada: najpierw «Przejmij». Każde otwarcie trafia do dziennika, więc otwieraj je wtedy, gdy zamierzasz napisać.",
            "**«Korespondencja z klientem»** → «Pokaż korespondencję»: wszystko, co klient powiedział asystentowi na stronie albo w bocie o zadaniu, pieniądzach i terminach. Też tylko po przejęciu i też jest zapisywane. Zgłoszenia z formularza nie mają korespondencji.",
            "**«Dyskusja»** — notatki o kliencie dla całego zespołu; osoba prowadząca leada dostaje wiadomość w Telegramie. Nie wklejaj tam danych kontaktowych klienta. Niżej — brief, kosztorys ze strony i notatki. O leadach z kontaktów — punkt [pierwsza rozmowa po kontakcie](#prospect-replies).",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
            "**«NIP/INN firmy»** — jeśli klient podał swój INN (uzbecki numer podatkowy, STIR) albo jest on w danych jego firmy, wpisz 9–12 cyfr i kliknij **«Zapisz NIP/INN»**. Jeśli tę firmę wcześniej przypisał sobie partner, lead stanie się jego klientem: w polu «Partner» pojawi się «Klient partnera … (przypisany DD.MM)», a partner dostanie wiadomość bez danych kontaktowych klienta. Leada prowadzisz Ty, tak jak wcześniej; partnerowi po prostu zaliczy się zamówienie. Wpisać NIP/INN można tylko we własnym leadzie.",
          ],
          head: [
            "Otwierasz dowolną kartę. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»**: [«Przejmij»](#leads-take) dla wolnego leada, «Zwróć do kolejki» i [«Przekaż»](#leads-transfer) dla każdego przejętego — Twoje przekazanie działa od razu, bez zatwierdzania.",
            "**«Status»** możesz zmieniać w każdym leadzie: «nowy», «w toku», «odłożony», «wygrany», «przegrany». «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» — tylko dla wolnego leada; przypisany go nie ma, a leada zwalnia «Zwróć do kolejki».",
            "**«Pokaż dane kontaktowe»** i **«Pokaż korespondencję»** działają dla każdego przejętego leada. Dla wolnego — dopiero po «Przejmij»: w kolejce jesteś na równi ze wszystkimi. Każde otwarcie trafia do dziennika.",
            "**«Dyskusja»** — notatki dla całego zespołu, osoba prowadząca leada dostaje je w Telegramie. Niżej — brief, kosztorys i notatki.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
            "**«NIP/INN firmy»** → **«Zapisz NIP/INN»** — w każdym leadzie, 9–12 cyfr. Jeśli firmę przypisał partner, lead stanie się jego klientem: w polu «Partner» — «Klient partnera … (przypisany DD.MM)», a partner dostaje wiadomość bez danych kontaktowych klienta. To, kto prowadzi leada, się nie zmienia.",
          ],
          admin: [
            "Otwierasz dowolną kartę i możesz wszystko: przejąć, zwrócić do kolejki, przekazać, zmienić status, otworzyć dane kontaktowe i korespondencję — także w wolnym leadzie, przed przejęciem. Każde działanie trafia do dziennika z Twoim imieniem.",
            "W wolnym leadzie na górze widać, u kogo jest teraz w kolejce: «👁 W kolejce u … do 14:30». Pozostałym to imię się nie wyświetla.",
            "**«Status»**: «wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia; «nowy» ma tylko wolny lead, przypisany go nie ma — leada zwalnia «Zwróć do kolejki».",
            "**«Dyskusję»** widzi cały zespół, osoba prowadząca leada dostaje ją w Telegramie. Niżej — brief, kosztorys i notatki asystenta.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku. Ile jest takich rabatów i z jakiego powodu — w [Statystykach](/admin/stats), długość minuty — `FIRST_MINUTE_SECONDS` na serwerze (domyślnie 60, 0 wyłącza).",
            "**«NIP/INN firmy»** → **«Zapisz NIP/INN»** — w każdym leadzie. Po NIP/INN lead jest rozpoznawany jako [klient przypisany przez partnera](#partners-claims): w polu «Partner» — «Klient partnera … (przypisany DD.MM)», partner dostaje wiadomość, a projekt utworzony z leada dziedziczy partnera.",
          ],
        },
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
            "Prośby menedżerów z Twojego zespołu («Poproś o przekazanie») przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decyduj od razu w wiadomości; «Открыть лид» (otwórz leada) prowadzi do karty, jeśli najpierw chcesz zajrzeć. Te same prośby są na stronie głównej w «Czeka na Twoją decyzję» i w karcie leada. Gdy zdecyduje jedna osoba, u pozostałych przyciski zmienią się na «Подтвердил …» (zatwierdził) albo «Отклонил …» (odrzucił). Możesz decydować o każdej prośbie w studiu, nie tylko ze swojego zespołu.",
            "Zatwierdzony lead dostaje nowe przypomnienie za 4 godziny. Lead z kontaktu przechodzi razem z korespondencją: wiadomości klienta, ponawianie i podpis modelu — do nowej osoby prowadzącej. Dawne przypomnienia poprzedniej osoby nie zamykają się same — w razie potrzeby zamknij je.",
          ],
          admin: [
            "Twój przycisk to **«Przekaż»**: lead przechodzi od razu. Prośby menedżerów przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decydujesz od razu w wiadomości — a także na zakładkę «Dziś» do «Czeka na Twoją decyzję» i do karty leada. Może je rozstrzygnąć także kierownik: dostaje prośby swojego zespołu z tymi samymi przyciskami. Kto zdecyduje pierwszy — u pozostałych przyciski zmienią się na wynik i ponownie kliknąć rozstrzygniętej prośby się nie da.",
            "Tak działa to według Twojej zasady: lead przechodzi za zatwierdzeniem kierownika albo Twoim i do decyzji zostaje u dotychczasowej osoby prowadzącej. Lead z kontaktu przechodzi razem z korespondencją — u kogo lead, u tego rozmowa z klientem.",
          ],
        },
      },
      {
        id: "urgent",
        title: "«Pilny kontakt»",
        body: [
          "Tu są leady ze statusem «w toku», które zbyt długo stoją w miejscu: «gorący» — 2 dni i dłużej, «ciepły» — 3, «do dojrzenia» — 5, «archiwum» — 14.",
          "Ruch to każde działanie na leadzie w panelu (nawet samo otwarcie karty) albo wiadomość w «Dyskusji». Dlatego lead znika z listy, gdy tylko ktoś się nim zajmie. Ale uczciwiej jest zrobić krok: napisać do klienta, zmienić status, ustawić przypomnienie.",
          "Na górze — najstarsze. Pusto — «Wszystkie leady w toku miały niedawno ruch».",
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
            "Na zakładce «Zespół». Ustalasz plan komukolwiek, a do tego przyciskami «zmień» i «usuń» możesz zmienić albo usunąć dowolny plan. Kierownik może tylko dodać plan swojemu menedżerowi — tak zdecydowałeś.",
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
            "**«W toku»** — leady ze statusem «w toku». **«Pilne»** — ile z nich [od dawna stoi w miejscu](#leads-urgent). **«Kontakty»** — wszystkie działania osoby na leadach w tygodniu: otwarcie karty, danych kontaktowych, przypomnienie, status, wiadomość w dyskusji. To praca z leadami, a nie zimne kontakty z sekcji «Kontakty». **«Pierwsze kontakty»** — kliknięcia «Pokaż dane kontaktowe». **«Wygrane»**, **«Wpływy»** — pieniądze z jej projektów w tygodniu. **«Plan kontaktów»** — zimne kontakty wobec planu, który ustalasz w sekcji [«Zespół»](/admin/team).",
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
            "Pojawia się na górze strony głównej, jeśli od ponad pół godziny nikt nie rozsyłał przypomnień. Od razu powiedz właścicielowi: dopóki pasek wisi, przypomnienia do Twoich leadów nie przychodzą — sprawdzaj je sam w kartach.",
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
