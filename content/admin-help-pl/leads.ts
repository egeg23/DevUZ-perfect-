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
    what: "Centrum dowodzenia właściciela i kierownika: na jednym ekranie — co dzieje się w firmie dziś i w ostatnich 7 dniach, co płonie w tej chwili i czym zajmuje się każda osoba w zespole. Po zalogowaniu i po kliknięciu logo «DevUz» trafiasz właśnie tutaj. Liczby odświeżają się same co półtorej minuty, dopóki strona jest otwarta i widoczna. «Etapy sprzedaży», leady bez ruchu, poziomy i historia wysyłek zmieniają się rzadko i odświeżają się co pięć minut: tak panel zużywa mniej darmowego ruchu bazy. Własne oznaczenie etapu i nowa wysyłka widać od razu. Menedżer widzi tu puls swojego dnia pracy: co się pali, co jest zaległe, z kim się skontaktować, swoje makiety i swoją pracę.",
    items: [
      {
        id: "desk",
        title: "Górny rząd: «Skrzynka» i «Dziś»",
        body: {
          manager: [
            "Od 03.11.2026 «Pulpit» zaczyna się, jak «DevUz Biuro», od rzędu **«Skrzynka»**: do sześciu twoich rozmów, w których klient czeka na odpowiedź człowieka, kto dłużej czeka — wyżej. Wiersz otwiera ją w sekcji [Skrzynka](/admin/inbox), tam jest też wątek i pole odpowiedzi. Pusto — nikt nie czeka: AI prowadzi rozmowy sama.",
            "Niżej — twój puls dnia, jak dawniej: co się pali, do kogo napisać, moje makiety, moja praca. Liczby te same, rząd tylko zbiera najpilniejsze na górę.",
          ],
          head: [
            "Od 03.11.2026 «Pulpit» zaczyna się, jak «DevUz Biuro», od rzędu dwóch kart. **«Skrzynka»** — do sześciu rozmów zespołu i zgłoszeń do bota, w których klient czeka na odpowiedź człowieka, kto dłużej czeka — wyżej; wiersz otwiera ją w sekcji [Skrzynka](/admin/inbox).",
            "**«Dziś»** — trzy liczby: nowe leady w 7 dni i ci, którzy odpisali w 7 dni (strzałka — o ile więcej lub mniej niż 7 dni wcześniej), oraz kontakty dziś z normy dnia. Niżej — **«Kontakty według dni»**: ile kontaktów zespół zrobił każdego z 7 dni, ostatni punkt — dziś. Liczby te same co w pulsie niżej — nie są liczone od nowa.",
          ],
          admin: [
            "Od 03.11.2026 «Pulpit» zaczyna się, jak «DevUz Biuro», od rzędu dwóch kart. **«Skrzynka»** — do sześciu rozmów zespołu i zgłoszeń do bota, w których klient czeka na odpowiedź człowieka, kto dłużej czeka — wyżej; wiersz otwiera ją w sekcji [Skrzynka](/admin/inbox).",
            "**«Dziś»** — trzy liczby: nowe leady w 7 dni i ci, którzy odpisali w 7 dni (strzałka — o ile więcej lub mniej niż 7 dni wcześniej), oraz kontakty dziś z normy dnia. Niżej — **«Kontakty według dni»**: ile kontaktów zespół zrobił każdego z 7 dni, ostatni punkt — dziś. Liczby te same co w pulsie niżej — nie są liczone od nowa.",
          ],
        },
      },
      {
        id: "pulse",
        title: "Puls firmy: leady, kontakty, makiety, zadania",
        body: {
          head: [
            "Cztery karty. Duża liczba — najważniejsza w karcie, wiersze pod nią — szczegóły. Kliknij dowolną liczbę — otworzy się to, co za nią stoi: lista leadów z odpowiednim filtrem, [Zimne kontakty](/admin/prospect), [Makiety](/admin/mockups), historia zadań.",
            "«Leady»: duża liczba — ile leadów jest «w toku» w całym zespole. Niżej — nowe dziś i w 7 dni, ciepłe, które właśnie są komuś oferowane po kolei (osoba ma 30 minut, żeby przejąć), ciepłe bez opiekuna (nikt ich nie trzyma — to powód, żeby wkroczyć), wygrane i przegrane w 7 dni. Wygrane i przegrane liczą się według zmiany statusu, a przegrane — także te, które bot zamknął sam po 21 dniach bez ruchu.",
            "«Zimne kontakty»: duża liczba — ile firm dostało dziś kontakt, od ludzi i autopilota razem, wobec normy dnia. Norma to porcje dnia wszystkich osób plus norma autopilota, jeśli jest włączony. Pasek pokazuje, ile już zrobiono. Niżej — porcje ludzi i autopilot osobno, ilu klientów odpowiedziało dziś i w 7 dni. Wiersz «odmów w 7 dni» — ilu klientów odmówiło: kontakty zamknięte jako „klient odmówił” (przyciskiem albo przez bota samodzielnie) i „nie interesuje” na czacie strony i w bocie. Bot nie wysyła nikomu kart odmów — odmowy widać tylko tutaj.",
            "«Makiety»: duża liczba — ile makiet jest teraz u klientów, dopóki trwa promocja 48 godzin, a niżej — u kogo promocja skończy się najwcześniej. Do tego — ile makiet wysłano i zatwierdzono w 7 dni. «Zadania»: otwarte zadania całego zespołu, po terminie i zrobione w 7 dni.",
            "Obok liczb z 7 dni — porównanie z 7 dniami przed nimi: «▲ +3» — więcej, «▼ −2» — mniej. Zielony — dobrze, żółty — warto zajrzeć. To kroczące 7 dni, a nie tydzień kalendarzowy: w poniedziałek rano porównanie się nie zeruje. Kierownik nie widzi na tej stronie pieniędzy — tak samo jak w innych sekcjach.",
          ],
          admin: [
            "Pięć kart: leady, kontakty, makiety, zadania i finanse. Duża liczba — najważniejsza, wiersze pod nią — szczegóły. Każdą liczbę można kliknąć i otworzyć to, co za nią stoi: listę leadów z filtrem, [Zimne kontakty](/admin/prospect), [Makiety](/admin/mockups), [Finanse](/admin/finance), [Umowy](/admin/contracts).",
            "«Leady»: duża liczba — leady «w toku» w całym zespole. Niżej — nowe dziś i w 7 dni, ciepłe oferowane teraz po kolei (30 minut na przejęcie), ciepłe bez opiekuna, wygrane i przegrane w 7 dni — według dziennika zmian statusu, razem z tymi, które bot zamknął sam po 21 dniach bez ruchu.",
            "«Zimne kontakty»: ile firm dostało dziś kontakt, od ludzi i autopilota razem, wobec normy dnia (porcje wszystkich osób plus norma autopilota, jeśli jest włączony). Niżej — porcje i autopilot osobno, odpowiedzi dziś i w 7 dni. Wiersz «odmów w 7 dni» — ilu klientów odmówiło: kontakty zamknięte jako „klient odmówił” (przyciskiem albo przez bota samodzielnie) i „nie interesuje” na czacie strony i w bocie. Bot nie wysyła nikomu kart odmów — odmowy widać tylko tutaj. «Makiety»: ile jest u klientów w promocji 48 godzin, u kogo skończy się najwcześniej, wysłane i zatwierdzone w 7 dni. «Zadania»: otwarte, po terminie, zrobione w 7 dni.",
            "«Finanse» widzisz tylko Ty: ile wpłynęło w 7 dni (według daty płatności w projektach) i od początku miesiąca oraz ile umów czeka na podpis. Kierownik tej karty nie widzi.",
            "Obok liczb z 7 dni — porównanie z 7 dniami przed nimi: «▲ +3» — więcej, «▼ −2» — mniej; zielony — dobrze, żółty — warto zajrzeć. To kroczące 7 dni, a nie tydzień kalendarzowy: w poniedziałek rano porównanie się nie zeruje.",
          ],
        },
      },
      {
        id: "stages",
        title: "«Etapy sprzedaży»",
        body: {
          admin: [
            "Blok „Etapy sprzedaży” stoi w pulsie jako pierwszy. Pokazuje nie próby, a drogę do pieniędzy: ile firm i leadów doszło do każdego etapu — «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność». Kolumna «7 dni» — ostatnie 7 × 24 godziny, pod liczbą — porównanie z 7 dniami wcześniej; «30 dni» — miesiąc, pasek po lewej pokazuje go na oko. Każda liczba otwiera listę tych firm i leadów: czyj, kiedy doszedł do etapu i czy doszedł do następnego. Tam też przełącza się etap i okres.",
            "Skąd liczby. «napisaliśmy» — poszło powitanie albo kontakt człowieka; klienci, którzy przyszli sami, tu nie wchodzą. «odpisali» — żywa odpowiedź klienta, a zgłoszenie ze strony, czatu lub bota — to już odpowiedź. «zainteresowanie» — „+” albo prośba o prototyp, lead autopilota za zgodą, „zadzwońcie” albo „przyślijcie”, zgłoszenie zostawione przez klienta lub dodane ręcznie przez menedżera, albo przycisk «Jest zainteresowanie» w [karcie leada](#leads-sales-marks). «makieta wysłana» — pierwsza wysyłka linku do makiety. «makieta pokazana» — tylko znacznik «Pokazałem makietę»: pokazu na wideo lub na żywo baza sama nie widzi. «cena podana» — wiersz z ceną wysłany klientowi po „+” albo znacznik «Podałem cenę» z kwotą. «płatność» — wpłata za projekt z leada albo status «Wygrane». Kto doszedł do późniejszego etapu, liczy się też we wcześniejszych, oprócz «makieta wysłana» i «makieta pokazana»: stawia je tylko sama makieta i znacznik pokazu, bo cenę bot podaje od razu po „+”, przed makietą. Zaznaczyło się przez pomyłkę — etap zdejmuje się kliknięciem w [karcie leada](#leads-sales-marks). Wszystko liczy kod, bez sieci neuronowej.",
            "Niżej — «Gdzie odpadają — w 30 dni»: słowami, ilu z jednego etapu doszło do następnego i ilu odpadło, np. «z 188, którzy odpisali, zainteresowanie wyraziło 12». Gdzie odpada najwięcej — tam utyka sprzedaż. Jeśli menedżerowie nie zaznaczają pokazów, etap «makieta pokazana» będzie zerem i wszystko za nim wyda się gorsze, niż jest — dlatego każdy pokaz trzeba zaznaczać.",
            "Kwotę, która wpłynęła z transakcji doprowadzonych do płatności w 30 dni, widzisz tylko Ty — kierownik jej nie widzi. Duża liczba w karcie «Leady» niżej jest podpisana uczciwie: «w toku» to głównie firmy, do których napisaliśmy, bo wcześniej leadem stawał się prawie każdy kontakt.",
          ],
          head: [
            "Blok „Etapy sprzedaży” stoi w pulsie jako pierwszy. Pokazuje nie próby, a drogę do pieniędzy: ile firm i leadów doszło do każdego etapu — «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność». Kolumna «7 dni» — ostatnie 7 × 24 godziny, pod liczbą — porównanie z 7 dniami wcześniej; «30 dni» — miesiąc, pasek po lewej pokazuje go na oko. Każda liczba otwiera listę tych firm i leadów: czyj, kiedy doszedł do etapu i czy doszedł do następnego. Tam też przełącza się etap i okres.",
            "Skąd liczby. «napisaliśmy» — poszło powitanie albo kontakt człowieka; klienci, którzy przyszli sami, tu nie wchodzą. «odpisali» — żywa odpowiedź klienta, a zgłoszenie ze strony, czatu lub bota — to już odpowiedź. «zainteresowanie» — „+” albo prośba o prototyp, lead autopilota za zgodą, „zadzwońcie” albo „przyślijcie”, zgłoszenie zostawione przez klienta lub dodane ręcznie przez menedżera, albo przycisk «Jest zainteresowanie» w [karcie leada](#leads-sales-marks). «makieta wysłana» — pierwsza wysyłka linku do makiety. «makieta pokazana» — tylko znacznik «Pokazałem makietę»: pokazu na wideo lub na żywo baza sama nie widzi. «cena podana» — wiersz z ceną wysłany klientowi po „+” albo znacznik «Podałem cenę» z kwotą. «płatność» — wpłata za projekt z leada albo status «Wygrane». Kto doszedł do późniejszego etapu, liczy się też we wcześniejszych, oprócz «makieta wysłana» i «makieta pokazana»: stawia je tylko sama makieta i znacznik pokazu, bo cenę bot podaje od razu po „+”, przed makietą. Zaznaczyło się przez pomyłkę — etap zdejmuje się kliknięciem w [karcie leada](#leads-sales-marks). Wszystko liczy kod, bez sieci neuronowej.",
            "Niżej — «Gdzie odpadają — w 30 dni»: słowami, ilu z jednego etapu doszło do następnego i ilu odpadło, np. «z 188, którzy odpisali, zainteresowanie wyraziło 12». Gdzie odpada najwięcej — tam utyka sprzedaż. Jeśli menedżerowie nie zaznaczają pokazów, etap «makieta pokazana» będzie zerem i wszystko za nim wyda się gorsze, niż jest — dlatego każdy pokaz trzeba zaznaczać.",
            "W tym bloku kierownik nie widzi pieniędzy: suma wpłat jest tylko u właściciela. Duża liczba w karcie «Leady» niżej jest podpisana uczciwie: «w toku» to głównie firmy, do których napisaliśmy, bo wcześniej leadem stawał się prawie każdy kontakt.",
          ],
          manager: [
            "Etapy sprzedaży — droga klienta od pierwszej wiadomości do płatności: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność». W bloku «Moje etapy w tym tygodniu» i na liście etapu są tylko Twoje firmy i leady: te, które prowadzisz, i te, w których pokaz lub cenę zaznaczyłeś Ty. Każdy kafelek otwiera listę: kto, kiedy doszedł do etapu i czy doszedł do następnego.",
            "Skąd liczby. «odpisali» — żywa odpowiedź klienta; «zainteresowanie» — „+”, prośba o prototyp, „zadzwońcie”, „przyślijcie” albo Twój przycisk «Jest zainteresowanie»; «makieta wysłana» — pierwsza wysyłka linku do makiety; «makieta pokazana» — tylko Twój znacznik «Pokazałem makietę»; «cena podana» — wiersz z ceną po „+” albo znacznik «Podałem cenę»; «płatność» — wpłata za projekt albo status «Wygrane». Liczy kod, bez sieci neuronowej.",
            "Nie zaznaczysz pokazu — nie będzie go nigdzie: ani w Twojej normie, ani u kierownika, ani w raporcie o 18:00. Dla wszystkich wygląda to tak, jakby makieta poszła, a klient zniknął.",
          ],
        },
      },
      {
        id: "attention",
        roles: ["admin", "head"],
        title: "«Wymaga uwagi»",
        body: [
          "Krótka lista tego, co płonie w tej chwili. Czerwona kropka — awaria albo klient, którego nikt nie trzyma; żółta — coś, co przepadnie, jeśli nie zająć się tym dziś. Wiersz prowadzi dokładnie do tego, czego dotyczy: lead — do jego karty, zadanie po terminie — do jego karty z historią, konto robocze — do jego wiersza w «Konta», makieta — do jej wiersza w «Makiety». Jeśli za wierszem stoi kilka rzeczy („3 ciepłe leady bez opiekuna”), kliknięcie rozwija listę, a każdy punkt prowadzi do swojej karty. Awaria prowadzi tam, gdzie się ją naprawia.",
          "Co tu trafia: sweep milczy ponad 30 minut (przypomnienia i wysyłki nie wychodzą); awaria autopilota albo modelu dziś; Telegram ograniczył konto robocze (wiadomości z niego nie wychodzą — zob. [Konta](/admin/accounts)); brak rosyjskiego albo uzbeckiego kółka w „Zapisanych” i ile razy dziś zamiast kółka poszedł list; ciepłe leady bez opiekuna; dzisiejsze przepadłe oferty ciepłych leadów; zadania po terminie; leady «w toku» bez ruchu od 7+ dni; prośby o przekazanie leada; promocje 48 godzin, którym zostało mniej niż 6 godzin; saldo Firecrawl poniżej 300 kredytów. **«Imię: N leadów bez odpowiedzi botowi»** — osoba ma ponad pięć leadów «w toku» bez ruchu, o które bot zapytał «jak się skończyło» (o 10:00 i 16:00), a odpowiedzi brak; link prowadzi do jej leadów «w toku».",
          "Pusta lista oznacza, że nie ma czego gasić: tak też jest napisane. Wszystko pochodzi z bazy w chwili otwarcia strony, nic nie jest zgadywane.",
          "Ciepłe leady bez opiekuna można przekazać od razu: pod listą jest blok «Przekaż ciepłego leada osobie», do trzech leadów. Wybierz «Komu» (osoby online — na górze) i kliknij «Przekaż». Lead od razu należy do tej osoby, dostaje ona wiadomość od bota i zwykłe przypomnienie za 4 godziny. Jeśli w tym czasie lead zdążył przejąć ktoś inny, zostaje u tego, kto był pierwszy.",
        ],
      },
      {
        id: "feed",
        roles: ["admin", "head"],
        title: "«Ostatnia doba»",
        body: [
          "Pod «Wymaga uwagi» — co wydarzyło się w ostatnich 24 godzinach, najnowsze na górze: nowy lead, makieta wysłana do klienta, makieta zatwierdzona, zadanie zrobione, lead wygrany albo przegrany (i kto to oznaczył). Nie więcej niż dwanaście wierszy.",
          "Każdy wiersz się otwiera: lead — w jego karcie, makieta — w [Makiety](/admin/mockups), zadanie — w historii zadań. Lista powstaje z tych samych danych co puls, więc liczby i wiersze się zgadzają.",
        ],
      },
      {
        id: "people",
        roles: ["admin", "head"],
        title: "«Zespół dziś» — karty zespołu",
        body: [
          "Karta dla każdego menedżera i kierownika. Zielona kropka przy inicjałach — osoba jest «online»: w ostatnich 30 minutach była w panelu, coś zrobiła albo kliknęła przycisk w bocie. W przeciwnym razie — kiedy była ostatnio. To ta sama miara, według której ciepłe leady w dzień trafiają najpierw do osób na miejscu.",
          "Trzy liczby: kontakty dziś (i porcja dnia — ile zrobiono z należnych), leady «w toku», otwarte zadania. Pod nimi — etykiety: po terminie, przepadłe oferty, leady bez ruchu 7+ dni, «porcja zrobiona» albo «dziś cisza». Najpierw stoją karty z niepokojącymi etykietami, potem osoby online. Nad liczbami — słupki «w 7 dni»: ile kontaktów osoba robiła w każdym z ostatnich siedmiu dni, dzisiejszy jest jaśniejszy. Najedź na słupek — zobaczysz dzień i liczbę. Etykieta **«bez odpowiedzi botowi N»** — o ile jej leadów bot już zapytał i czeka na «🏆 / ❌ / ⏳»; powyżej pięciu etykieta jest żółta, a w «Wymaga uwagi» pojawia się wiersz.",
          "Kliknij kartę — rozwiną się szczegóły: o której osoba po raz pierwszy weszła dziś do panelu i ile w nim była, oraz przyciski «Zleć zadanie» i «Otwórz jego leady».",
        ],
      },
      {
        id: "show-norm",
        title: "Norma — 2 pokazy makiety w tygodniu",
        roles: ["admin", "head"],
        body: [
          "Norma menedżera — 2 pokazy makiety klientom w tygodniu, od poniedziałku czasu taszkenckiego. W karcie każdego w «Zespół dziś» jest znacznik «pokazy N z 2» za tydzień, zielony, gdy norma wykonana. Rozwiń kartę — tam pokazy, podane ceny i płatności dziś i od poniedziałku. Kontakty to próby, a te trzy liczby prowadzą do pieniędzy.",
          "W raporcie o pracownikach o 18:00 każdy ma wiersz 🎯: pokazy, ceny i płatności za dzień i tydzień, a w części o tym, na co patrzeć — podsumowanie zespołu za dzień.",
          "W poniedziałki o 10:00 bot przysyła wiersz: kto w zeszłym tygodniu nie zrobił ani jednego pokazu, choć makiety do jego klientów wychodziły (w zeszłym lub poprzednim tygodniu). Wiersz przychodzi raz w tygodniu i tylko z polem «Raporty»; jeśli takich osób nie ma — nie ma wiersza. Siebie na liście nie widzisz.",
        ],
      },
      {
        id: "levels",
        title: "Poziomy i grade zespołu",
        roles: ["admin", "head"],
        body: [
          "W karcie każdego w «Zespół dziś» jest odznaka poziomu z tytułem i paskiem do następnego, znacznik „transakcje N/3” za ten miesiąc, a w rozwiniętej karcie — ile punktów łącznie i w 7 dni, ile transakcji i jaki procent ma teraz ta osoba.",
          "Punkty — za to, co prowadzi do pieniędzy: kontakt 1, odpowiedź na jego kontakt 2, zainteresowanie 5, makieta 10, pokaz 15, cena 20, transakcja z płatnością 100; panel — 1 za 15 minut (do 8 dziennie), zmiana statusu, wykonane zadanie i odpowiedź botowi — po 2 (do 20 dziennie). Poziom L zaczyna się od 25·L·(L−1) punktów: 2. od 50, 5. od 500, 10. od 2 250. Liczy kod raz na godzinę, bez sieci neuronowej. Wysoki poziom przy zerze transakcji to powód, by sprawdzić, na co idą siły.",
          "Grade za transakcje: transakcja — projekt menedżera z pierwszą płatnością, w miesiącu tej płatności. Od 1 listopada 2026 baza 10%, za 3 transakcje w miesiącu — 15% na następny miesiąc i $200 za każde 3 transakcje ponad procent. Kierownika zasada nie dotyczy, procenty ustawione przez właściciela ręcznie przy transakcji są silniejsze. Premie widać w [Finansach](/admin/finance), w bloku «Premie za transakcje».",
        ],
      },
      {
        id: "task",
        roles: ["admin", "head"],
        title: "«Szybkie zadanie»",
        body: [
          "Zlecenie zadania bez wychodzenia z «Pulpit». Zaznacz, komu — możesz kilka osób naraz, każda dostanie własne zadanie. Napisz, co zrobić, i wybierz termin: «dziś do 18:00», «jutro» (do 18:00) albo «własna data» — czas taszkencki. Kliknij «Zleć zadanie».",
          "Dalej wszystko jak przy zwykłym zadaniu: bot od razu pisze do wykonawcy w Telegramie z przyciskiem przyjęcia zadania, a do Ciebie — o każdym kroku. W nocy (od 21:00 do 08:00) bot milczy i wiadomość przyjdzie o 08:00 — pod przyciskiem będzie to napisane. Po 18:00 «dziś do 18:00» to już przeszłość: wybierz «jutro» albo własną datę.",
          "Z karty osoby w «Zespół dziś» przycisk «Zleć zadanie» otwiera ten formularz z tą osobą już zaznaczoną.",
        ],
      },
      {
        id: "broadcast",
        roles: ["admin", "head"],
        title: "«Wiadomość do zespołu przez bota»",
        body: [
          "Własna wiadomość od bota studia w Telegramie — dwie zakładki. «Pracownikom» — do całego zespołu albo jego części, na przykład zaproszenie na spotkanie. «Użytkownikom bota» — do osób, które same pisały do bota: klientów i leadów z czatu, partnerów, kupujących w sklepie. Wysyłać mogą tylko właściciel i kierownik.",
          "Napisz treść, wybierz, do kogo: «Wszystkim», «Według ról» (właściciel, kierownicy, menedżerowie) albo «Wybierz osoby». Kiedy: «Teraz» albo «O wybranej godzinie» — czas taszkencki. Bot wysyła przy przebiegu co pięć minut, więc na spotkanie o 15:00 ustaw 14:50. Od 21:00 do 08:00 bot milczy: nocna wiadomość wyjdzie o 08:00, jeśli nie zaznaczysz «Wyślij także w nocy».",
          "Przed wysłaniem — «Podgląd»: jak wiadomość będzie wyglądać, ile osób ją dostanie i kto dokładnie. Osoby bez Telegramu jej nie dostaną — są pokazane osobno. Ty jej nie dostaniesz — jesteś autorem. Jeśli w czasie czytania podglądu skład zespołu się zmienił, panel poprosi o ponowne otwarcie podglądu, zamiast wysłać do innej liczby osób.",
          "Każdy dostaje wiadomość jeden raz: jeśli nie dotarła (Telegram nie odpowiedział), bot dośle ją przy kolejnym przebiegu, w ciągu doby. Na dole — «Ostatnie wysyłki»: kiedy, kto, do kogo i do ilu dotarło. Dopóki nic nie wyszło, wysyłkę może «Anuluj» jej autor albo właściciel. «Powtórz» otwiera formularz z tą samą treścią i tymi samymi odbiorcami — wygodne przy cotygodniowym spotkaniu; sprawdź treść i otwórz podgląd, liczba odbiorców policzy się od nowa. Każda wysyłka i anulowanie trafiają do dziennika.",
          "«Użytkownikom bota»: wybierz, do kogo — «Wszystkim», «Partnerom», «Kupującym w sklepie» albo «Klientom i leadom»; obok każdej opcji — ile to osób. Pracowników na tej liście nie ma nigdy. Wychodzi dokładnie Twój tekst, bez podpisu. Piszemy tylko do osób, które same zaczęły rozmowę z botem; do tych, którzy zablokowali bota, nie piszemy — Telegram odmawia, a osoba zostaje oznaczona, dopóki sama znów nie napisze do bota. Wiadomości wychodzą porcjami, nie szybciej niż 25 na sekundę. W «Ostatnie wysyłki» tej zakładki widać, ile dotarło, ile nie dotarło i ile osób zablokowało bota. Gdy klient odpowie na wysyłkę w ciągu 3 dni, bot odpowiada mu, znając jej treść: kontynuuje od niej, zamiast zaczynać znajomość od nowa. Odpowiedź klienta przychodzi do Ciebie i kierownika jako «📩 Обращение в бота» i możesz na nią odpowiedzieć sam.",
          "Wysyłka nie zależy od AI: Twój tekst idzie z panelu przez naszą bazę i bota prosto do Telegramu. Gdy model jest niedostępny, wysyłka działa normalnie.",
        ],
      },
      {
        id: "bot-subs",
        roles: ["admin", "head"],
        title: "«Subskrybenci bota»",
        body: [
          "Ile osób jest w [bocie studia](https://t.me/Devuz_studio_bot). Duża liczba, «teraz w bocie», to osoby, które same napisały do bota albo nacisnęły «Start», nie zablokowały go i nie pracują u nas: dokładnie do nich pójdzie wiadomość «Wszystkim» w zakładce «Użytkownikom bota». Niżej — tabela za 24 godziny, 7 dni i 30 dni. «Nowi» — kto po raz pierwszy przyszedł do bota w tym czasie; pod liczbą «wcześniej» — ilu przyszło w takim samym okresie przed nim, dzięki temu widać, czy reklama zadziałała. «Aktywni w bocie» — kto w tym czasie pisał do bota albo naciskał przyciski.",
          "Wiersz «Zablokowali bota» pojawia się dopiero po wysyłce: o blokadzie Telegram mówi tylko wtedy, gdy piszemy do człowieka. Dopóki nie było wiadomości do użytkowników, wiersza nie ma, nawet jeśli ktoś usunął bota. Liczby są liczone z bazy, bez AI, i odświeżają się co 5 minut. Blok widzą właściciel i kierownik.",
          "Zielony wiersz pod dużą liczbą to «zasubskrybowało dzisiaj»: ile osób po raz pierwszy przyszło do bota od północy czasu taszkenckiego, obok — ile przez cały wczorajszy dzień. To nie to samo co «24 godziny» w tabeli: 24 godziny to doba liczona od tej minuty, a «dzisiaj» zaczyna się od nowa każdej nocy. Codziennie o 20:00 czasu taszkenckiego bot wysyła właścicielowi i kierownikowi podsumowanie «👥 Подписчики бота»: zasubskrybowali dzisiaj i wczoraj, aktywni w bocie dzisiaj, nowi za 7 i 30 dni, ilu jest teraz w bocie. Przychodzi pod zaznaczeniem «Raporty» — jeśli je zdejmiesz w sekcji «Zespół», podsumowania nie będzie. W nocy (od 21:00) nie przychodzi: jeśli nie zdążyło do 21:00, za ten dzień już go nie będzie.",
          "Złoty wiersz niżej to «złożyło makietę dzisiaj»: ilu subskrybentów od północy czasu taszkenckiego złożyło sobie w bocie makietę strony (komenda /maket), obok — ilu wczoraj. W tabeli wiersz «Złożyli makietę» pokazuje to samo dla 24 godzin, 7 dni i 30 dni. Liczy się gotowa makieta klienta: jedna osoba może złożyć tylko jedną, więc liczba makiet równa się liczbie osób. Makiety złożone przez pracowników tu nie wchodzą, stoją osobno w wierszu «Pracownicy złożyli w 30 dni»; makieta, która nie przeszła kontroli i trafiła do projektanta, też się nie liczy. Pod tabelą jest «Wszystkich makiet z bota» za cały czas i link do [Makiety](/admin/mockups), gdzie widać każdą. Ten sam wiersz przychodzi w codziennym podsumowaniu o 20:00. Gdy baza nie odpowie, wierszy o makietach nie ma: zero byłoby nieprawdą.",
        ],
      },
      {
        id: "voice",
        roles: ["admin", "head"],
        title: "Wiadomość głosowa → tekst w bocie",
        body: [
          "Klient przysłał specyfikację wiadomością głosową, a nie ma czasu jej słuchać albo tekst jest potrzebny zespołowi — prześlij wiadomość głosową [botowi studia](https://t.me/Devuz_studio_bot) na czacie prywatnym. Działa wiadomość głosowa, plik audio albo nagranie z dyktafonu jako plik (MP3, M4A, OGG). Bot od razu odpowie «🎙 Получил голосовое (4:12) — расшифровываю», a po 10–20 minutach przyśle na ten sam czat «📝 Расшифровка голосового» — tekst podzielony na akapity według pauz. Długi tekst przyjdzie w kilku wiadomościach po kolei.",
          "Dlaczego nie od razu: głos zamienia na tekst nie nasz serwer, tylko zadanie w GitHubie, które co 10 minut sprawdza, czy są nowe wiadomości głosowe. Serwer nie jest tym obciążony — działają na nim strona, bot i kilkanaście innych stron. Tekst robi otwarty model Whisper: jest darmowy i nie zużywa płatnego modelu. Język rozpoznaje sam, rosyjski i uzbecki też, ale mowę mieszaną z dwóch języków może zapisać z błędami — liczby, ceny i nazwy sprawdzaj z nagraniem.",
          "Działa u właściciela i kierownika; wiadomości głosowej menedżera bot nie przyjmuje. Kółko się tu nie liczy: kółko wysłane botowi to [kółko do kontaktów](#accounts-circle), bot zapyta o jego język. Nagrania większego niż 20 MB albo dłuższego niż godzina bot nie przyjmie i tak odpowie — wysyłaj w częściach. Jeśli po trzech próbach nie udało się zamienić na tekst, bot o tym napisze — prześlij wiadomość jeszcze raz.",
        ],
      },
      {
        id: "bot-helper",
        title: "Pomocnik w bocie: pytania o pracę",
        body: {
          manager: [
            "Napisz [botowi studia](https://t.me/Devuz_studio_bot) na czacie prywatnym zwykłe pytanie o pracę, a bot odpowie sam: krótko, do 500 znaków, w języku pytania (rosyjski, uzbecki, polski). Na przykład: co odpowiedzieć, gdy klient mówi, że drogo, ile kosztuje landing w promocji, jakie mamy realizacje dla stomatologii, jak działa porcja dnia.",
            "Skąd odpowiedź: bot wybiera dwa-trzy pasujące fragmenty z tej instrukcji (tylko sekcje otwarte dla Ciebie), kursów ze szkoleń, gotowych odpowiedzi na obiekcje, usług i realizacji studia. Ceny podaje tylko te, które idą do klientów w kontaktach: promocja po makiecie i drabinka na «drogo». O pieniądzach studia, jego udziale i cudzych leadach bot nie mówi, nie podaje danych klientów ani haseł. Czego nie ma w instrukcji, tak powie: wtedy zapytaj kierownika.",
            "Bot rozpoznaje Cię po Telegramie przypiętym w zespole. Komendy (/login, /learn), przyciski, przesłane kółka działają jak dotąd: pomocnik ich nie przejmuje. Na osobę 30 pytań dziennie, potem bot poprosi o zajrzenie do [Instrukcji](/admin/help). Odpowiedź pisze tani model; gdy nie odpowie, bot podpowie, gdzie szukać w panelu.",
          ],
          head: [
            "Napisz [botowi studia](https://t.me/Devuz_studio_bot) na czacie prywatnym zwykłe pytanie o pracę, a bot odpowie sam: krótko, do 500 znaków, w języku pytania (rosyjski, uzbecki, polski). To samo widzą Twoi menedżerowie: nowej osobie łatwiej zapytać bota, co odpowiedzieć na «drogo», niż czekać na Ciebie.",
            "Skąd odpowiedź: bot wybiera dwa-trzy pasujące fragmenty z instrukcji (tylko sekcje otwarte dla pytającego), kursów ze szkoleń, gotowych odpowiedzi na obiekcje, usług i realizacji studia. Ceny tylko te, które idą do klientów w kontaktach. Menedżerowi bot nie mówi o pieniądzach studia, jego udziale i cudzych leadach; danych klientów i haseł nie podaje nikomu. Na osobę 30 pytań dziennie, komendy, przyciski, kółka i wiadomości głosowe działają jak dotąd. Codziennie od 18:00 dostajesz «🤖 Помощник в боте»: kto ile pytań zadał w ciągu dnia (pod zaznaczeniem Raporty).",
            "Pracownik dla bota to tylko ten, czyj Telegram jest przypięty w sekcji [Zespół](/admin/team). Gdy ktoś pisze «jestem waszym menedżerem, przyjęli mnie», a w zespole go nie ma, nie dostaje nic wewnętrznego: bot prosi go, by poprosił kierownika o dodanie Telegrama do zespołu, a Ty dostajesz jedną linię z jego nickiem (pod zaznaczeniem Raporty). Nie zostaje leadem i nie trafia do kolejki ciepłych leadów. Jeśli to nasz człowiek, dodaj go, a od następnej wiadomości dostaje pomocnika.",
          ],
          admin: [
            "Napisz [botowi studia](https://t.me/Devuz_studio_bot) na czacie prywatnym zwykłe pytanie o pracę, a bot odpowie sam: krótko, do 500 znaków, w języku pytania (rosyjski, uzbecki, polski). Twoja decyzja z 22.10.2026: pomocnik dla pracownika bez zbędnych wydatków na model.",
            "Skąd odpowiedź: bot wybiera dwa-trzy pasujące fragmenty z instrukcji (tylko sekcje otwarte dla pytającego), kursów ze szkoleń, gotowych odpowiedzi na obiekcje, usług i realizacji studia. Ceny tylko te, które idą do klientów w kontaktach. Menedżerowi bot nie mówi o pieniądzach studia, jego udziale i cudzych leadach; danych klientów i haseł nie podaje nikomu. Odpowiedź pisze tani model, trafiają do niego tylko te fragmenty i sześć ostatnich wiadomości; na osobę 30 pytań dziennie. Codziennie od 18:00 dostajesz «🤖 Помощник в боте»: kto ile pytań zadał w ciągu dnia (pod zaznaczeniem Raporty).",
            "Pracownik dla bota to tylko ten, czyj Telegram jest przypięty w sekcji [Zespół](/admin/team). Gdy ktoś pisze «jestem waszym menedżerem, przyjęli mnie», a w zespole go nie ma, nie dostaje nic wewnętrznego: bot prosi go, by poprosił kierownika o dodanie Telegrama do zespołu, a Ty dostajesz jedną linię z jego nickiem (pod zaznaczeniem Raporty). Nie zostaje leadem i nie trafia do kolejki ciepłych leadów. Jeśli to nasz człowiek, dodaj go, a od następnej wiadomości dostaje pomocnika.",
          ],
        },
      },
      {
        id: "bot-contact",
        roles: ["admin", "head"],
        title: "Kontakt klienta w bocie",
        body: {
          head: [
            "Napisz [botowi studia](https://t.me/Devuz_studio_bot) «kontakt» i imię klienta, firmę, stronę albo numer zgłoszenia: «kontakt Adar», «telefon adar.uz», «kontakt DZ-1016-KCDE». Bot znajdzie go w leadach, kontaktach i projektach i przyśle do czterech wyników każdego rodzaju: imię, telefon lub nick, status, kto prowadzi, i link do karty. Projekt pokazuje kontakt swojego leada; bot szuka też w notatce projektu — tam zapisuje się, z jaką firmą była rozmowa.",
            "Model tu nie działa: odpowiedź składa kod prosto z bazy, więc jest od razu i za darmo. Każdy pokazany kontakt leada trafia do dziennika (widzi go właściciel), samo wyszukiwanie też. Menedżerowi bot kontaktów nie szuka: jego pytanie trafia do pomocnika, a kontakt cudzego leada nie jest dla niego otwarty także w panelu. Gdy nic się nie znajdzie, bot tak odpowie; wtedy zapisz imię, firmę albo stronę inaczej.",
          ],
          admin: [
            "Napisz [botowi studia](https://t.me/Devuz_studio_bot) «kontakt» i imię klienta, firmę, stronę albo numer zgłoszenia: «kontakt Adar», «telefon adar.uz», «kontakt DZ-1016-KCDE». Bot znajdzie go w leadach, kontaktach i projektach i przyśle do czterech wyników każdego rodzaju: imię, telefon lub nick, status, kto prowadzi, i link do karty. Projekt pokazuje kontakt swojego leada; bot szuka też w notatce projektu — tam zapisuje się, z jaką firmą była rozmowa.",
            "Pomocnik odpowiada teraz także na Twoim czacie z botem — to również czat briefów o leadach. Komendy i przyciski briefów działają jak dotąd, a zwykłe pytanie trafia do pomocnika. Do 24.10.2026 bot pomijał tu zwykły tekst bez słowa.",
            "Model tu nie działa: odpowiedź składa kod prosto z bazy, więc jest od razu i za darmo. Każdy pokazany kontakt leada trafia do sekcji [Dziennik](/admin/audit) jako «odsłonił dane kontaktowe klienta» z dopiskiem «przez bota», a samo wyszukiwanie jako «szukał kontaktu klienta w bocie». Menedżerowi bot kontaktów nie szuka: jego pytanie trafia do pomocnika, a kontakt cudzego leada nie jest dla niego otwarty także w panelu. Gdy nic się nie znajdzie, bot tak odpowie; wtedy zapisz imię, firmę albo stronę inaczej.",
          ],
        },
      },
      {
        id: "my-day",
        title: "Twój «Pulpit»: puls dnia pracy",
        roles: ["manager"],
        body: [
          "Po wejściu do panelu i po kliknięciu logo «DevUz» trafiasz tutaj. To Twój dzień pracy na jednym ekranie: co pali się w tej chwili, co jest już zaległe, z kim skontaktować się dziś, Twoje makiety i ile zrobiłeś. Tu jest tylko Twoje — Twoje leady, kontakty, makiety i zadania; cudzych spraw i pieniędzy studia tu nie ma.",
          "Strona odświeża się sama co półtorej minuty, dopóki karta jest otwarta i widoczna — nie trzeba odświeżać ręcznie. Każdy wiersz jest klikalny i otwiera to, czego dotyczy: lead — w jego karcie, zadanie — w jego karcie, makietę — w [Makietach](/admin/mockups). Gdy po kliknięciu ładuje się strona, obok tekstu miga zielona kropka — kliknięcie dotarło.",
          "Liczby liczy kod na podstawie bazy, bez sieci neuronowej: te same dane zawsze dają ten sam wynik. Na telefonie najważniejsze jest na górze, przyciski są duże, pod palec.",
        ],
      },
      {
        id: "my-hot",
        title: "«Pali się teraz»",
        roles: ["manager"],
        body: [
          "To, co przepadnie, jeśli nie zajmiesz się tym w najbliższej godzinie. Wiersze delikatnie świecą na złoto; na czerwono — to, co pali się mocniej: klient czeka ponad godzinę, do końca propozycji mniej niż 10 minut, do końca promocji mniej niż 2 godziny, zadanie w ciągu godziny. Jeśli w telefonie włączone jest „ogranicz ruch”, światło stoi w miejscu — zostają kolor i ikona.",
          "Kolejność — według pilności: 🔥 ciepły lead, którego kolejka zaproponowała Tobie, z odliczaniem i przyciskiem «Weź» (masz 30 minut — jeśli go nie weźmiesz, lead trafi do następnej osoby, a Tobie zapisze się „przepadł”); 💬 klient odpisał, model oddała rozmowę i klient czeka na Twoją odpowiedź — widać, jak długo czeka; 👀 klient otworzył Twój prototyp w ostatniej godzinie — najlepszy moment, żeby napisać; ⏰ promocja 48 godzin dla Twojej makiety kończy się dziś; 📌 zadanie z terminem na dziś.",
          "«Weź» działa tak samo jak wzięcie leada w jego karcie: lead staje się Twój i otwiera się jego karta. Pod wierszami z leadem „w pracy” są przyciski statusu, zobacz [szybką zmianę statusu](#hq-my-status). Pusto — nic się nie pali: czas na [porcję kontaktów](/admin/prospect).",
        ],
      },
      {
        id: "my-overdue",
        title: "«Zaległe»",
        roles: ["manager"],
        body: [
          "Czerwony pasek po lewej i drgająca ikona — to, co już się spóźniło: zadania po terminie; leady, dla których nadszedł dzień kolejnego kroku wyznaczonego przez Ciebie przyciskiem «⏳ Czekamy» (albo «⏳ Ещё в работе» w bocie), a od tego czasu nic się przy leadzie nie działo; leady „w pracy” bez ruchu od 7 dni i dłużej.",
          "„Bez ruchu” liczy się tak samo jak u bota o 10:00 i 16:00: korespondencja, zmiana statusu, każde działanie przy leadzie. Otwarcie karty i «⏳» ruchem nie są. Jeśli lead leży nieruszany 21 dni, a bot przez trzy dni nie dostaje odpowiedzi, lead sam przejdzie do „przegranych”.",
          "Lead, który ma już zaległe zadanie «Связаться: …», nie powtarza się drugim wierszem. Pod każdym leadem — «🏆 Wygrana», «❌ Przegrana», «⏳ Czekamy»: po oznaczeniu wiersz zniknie przy następnym odświeżeniu.",
        ],
      },
      {
        id: "my-status",
        title: "Szybka zmiana statusu: «🏆 Wygrana», «❌ Przegrana», «⏳ Czekamy»",
        roles: ["manager"],
        body: [
          "Te same przyciski, które bot wysyła o 10:00 i 16:00 przy leadach bez ruchu, i ten sam kod za nimi. Zmieniać można tylko swojego leada — przy cudzym pojawi się „To nie Twój lead”. Każde kliknięcie trafia do dziennika, a licznik bota dla leada się zeruje: bot nie zapyta o ten lead, dopóki znów nie zawiśnie.",
          "«🏆 Wygrana» — lead zamknięty sprzedażą i od razu otwiera się zakładanie projektu w [Projektach](/admin/projects): załóż go, wtedy sprzedaż zapisze się na Ciebie. «❌ Przegrana» — lead znika z „w pracy”, przypomnienia o nim są anulowane.",
          "«⏳ Czekamy» najpierw pyta, kiedy kolejny krok: «Jutro», «Za 3 dni» albo «Za tydzień». Po wyborze dostajesz zadanie «Связаться: …» na ten dzień, na 10:00 (sobota i niedziela przechodzą na poniedziałek), i do tego dnia ani bot, ani «Pulpit» nie pytają o ten lead. Trzecie z rzędu «⏳» bez zmiany statusu jest ostatnie: potem zostają tylko «🏆» i «❌», a kierownik dostaje wiadomość.",
        ],
      },
      {
        id: "my-contacts",
        title: "«Z kim skontaktować się dziś»",
        roles: ["manager"],
        body: [
          "Lista osób, do których trzeba dziś napisać lub zadzwonić: z zadania «Связаться: …» z terminem na dziś (i zaległego); z leada, który ma dziś kolejny krok; oraz klienci, którzy odpisali Ci i czekają albo odpowiedzieli dziś na Twój kontakt. Jeden klient — jeden wiersz; na górze — ci, którzy odpisali.",
          "Przycisk «Napisz» (Telegram), «Zadzwoń» (telefon) lub «E-mail» otwiera kontakt klienta jednym kliknięciem. Kontakt otwiera się tą samą drogą co pokazanie kontaktu w [karcie leada](#leads-card): tylko dla Twojego leada, a każde otwarcie trafia do dziennika — dlatego klikaj, gdy naprawdę się kontaktujesz. Jeśli kontakt zapisano w niezrozumiałym formacie, zamiast przejścia pokaże się jako tekst.",
          "Przy kontakcie bez leada przycisk prowadzi pod adres, na który pisałeś — Telegram lub telefon. «Karta» otwiera leada albo kontakt. Pod leadami „w pracy” — te same przyciski statusu.",
        ],
      },
      {
        id: "my-mockups",
        title: "«Moje makiety»",
        roles: ["manager"],
        body: [
          "Makiety, które w ciągu 14 dni trafiły do Twoich klientów, i wszystkie, dla których wciąż trwa promocja. Twoja — ta, za którą odpowiadasz: wyznaczono Cię w «Makietach», prowadzisz leada klienta albo pisałeś do niego kontakt (ta sama kolejność co w [Makietach](/admin/mockups)). Na górze — promocje, które kończą się najwcześniej.",
          "Przy każdej: kiedy link trafił do klienta (od tej minuty liczą się promocja 48 godzin i doba bez hasła); czy klient otwierał, kiedy ostatnio i ile razy; ile zostało do końca promocji; czy jest jeszcze otwarta przez link i przez ile godzin, czy już zamknięta hasłem. Otwierał w ostatniej godzinie — wiersz świeci: czas napisać.",
          "«Wygeneruj hasło» — to samo hasło na 24 godziny co w «Makietach»: pokazuje się raz, obok — «Kopiuj dla klienta» i «Kopiuj hasło». Jeśli makieta jest jeszcze otwarta przez link, pierwsze hasło ją zamknie — panel zapyta wcześniej.",
        ],
      },
      {
        id: "my-growth",
        title: "«Mój rozwój»: poziom i punkty",
        roles: ["manager"],
        body: [
          "Blok po prawej, nad «Moje etapy w tym tygodniu». Poziom rośnie od punktów, jak w grze: każda czynność prowadząca do pieniędzy daje punkty, a im bliżej płatności, tym więcej. Kontakt — 1, odpowiedź klienta na Twój kontakt — 2, zainteresowanie — 5, makieta wysłana — 10, pokaz makiety — 15, cena podana — 20, transakcja z płatnością — 100. Praca w panelu — 1 punkt za każde 15 minut, nie więcej niż 8 dziennie; zmiana statusu leada, wykonane zadanie i odpowiedź botowi porządku w leadach — po 2 punkty, nie więcej niż 20 dziennie: poziomu nie da się „wysiedzieć” bez pracy z klientami.",
          "Poziom 2 zaczyna się od 50 punktów, 3 — od 150, 5 — od 500, 10 — od 2 250: każdy kolejny jest droższy, a dalekie poziomy zdobywa się tylko transakcjami. Poziom ma tytuł — od „Nowicjusza” do „Legendy”. Pod numerem — ile punktów łącznie, ile w 7 dni i ile zostało do następnego poziomu; «Za co punkty» rozwija listę z tym, ile masz każdego.",
          "Punkty liczy kod z bazy, bez sieci neuronowej, raz na godzinę — nowy kontakt pojawi się w wyniku w ciągu godziny. Poziom widzą kierownik i właściciel w Twojej karcie na «Pulpit»: pokazuje, ile robisz dla firmy, a nie tylko ile kontaktów dziennie.",
        ],
      },
      {
        id: "grade",
        title: "«Grade za transakcje»: 15% i premia $200",
        roles: ["manager"],
        body: [
          "Transakcja — Twój projekt (jesteś prowadzącym w [Projektach](/admin/projects)), za który wpłynęła pierwsza płatność. Liczy się w miesiącu tej płatności, czasu taszkenckiego. Anulowany projekt nie jest transakcją.",
          "Od 1 listopada 2026 Twój procent od nowego klienta to 10%. Zamknąłeś 3 transakcje w miesiącu kalendarzowym — w następnym miesiącu 15%. Stawka osobista, jeśli ustawił ją właściciel, zostaje bazą, a 15% jej nie obniża. Dosprzedaże liczą się jak dotąd. Do 1 listopada procent jak wcześniej, według Twojego grade; transakcje z października już się liczą: trzy w październiku — 15% w listopadzie.",
          "Ponad procent — premia $200 za każde 3 transakcje miesiąca: 3 transakcje — $200, 6 — $400. Premia liczy się od transakcji od 1 listopada, jest zarobiona, gdy tylko wpłynie płatność za trzecią transakcję, i od razu widać ją w [Finansach](/admin/finance) w zarobionych. W bloku — ile transakcji już jest, jaki procent teraz i jaki będzie w przyszłym miesiącu, ile zostało do premii.",
        ],
      },
      {
        id: "my-stages",
        title: "«Moje etapy w tym tygodniu» i norma pokazów",
        roles: ["manager"],
        body: [
          "Blok po prawej, nad «Moja praca», liczy się od poniedziałku 00:00 czasu taszkenckiego. Na górze — norma: 2 pokazy makiety w tygodniu, ile zrobiono i pasek. Od piątku, jeśli pokazów jeszcze nie ma, wiersz delikatnie świeci i podpowiada, by pokazać makietę choć jednemu klientowi; przy ograniczeniu ruchu w ustawieniach telefonu zostaje tylko kolor. Niżej — kafelki etapów Twoich transakcji od poniedziałku.",
          "Pokaz to sytuacja, gdy klient widział makietę razem z Tobą: nagrałeś wideo z makietą i je wysłałeś albo pokazałeś na żywo, na spotkaniu lub w rozmowie z udostępnionym ekranem. Zaznacz przyciskiem «Pokazałem makietę» w wierszu makiety w «Moje makiety» albo w [karcie leada](#leads-sales-marks), wybierając «na wideo» lub «na żywo». Znacznik zapisuje się z datą i Twoim imieniem oraz trafia do dziennika.",
          "Pokazy, podane ceny i płatności kierownik i właściciel widzą w raporcie o 18:00 i w Twojej karcie na «Pulpit». W poniedziałki o 10:00 dostają wiersz o tych, którzy w zeszłym tygodniu mieli co najmniej jedną makietę i ani jednego pokazu.",
        ],
      },
      {
        id: "my-work",
        title: "«Moja praca»",
        roles: ["manager"],
        body: [
          "Na górze — porcja dnia: ile kontaktów z należnych zrobiono, z paskiem; kliknij — otworzą się [Zimne kontakty](/admin/prospect). Jeśli porcji jeszcze nie pobrano — tak jest napisane.",
          "«Dziś»: kontakty, odpowiedzi klientów na Twoje kontakty i ile leadów masz „w pracy”. «7 dni» — ostatnie 7 × 24 godziny wobec 7 dni przed nimi, strzałka pokazuje różnicę: kontakty, odpowiedzi, ciepłe leady, które wziąłeś, i te, które Ci przepadły (niewzięte w 30 minut), makiety wysłane klientom i wygrane leady.",
          "Każda liczba jest klikalna: kontakty — do «Zimnych kontaktów», odpowiedzi — do [Analizy rozmów](/admin/talks), leady — do listy leadów, makiety — do «Makiet». Liczby są te same, które kierownik i właściciel widzą w kartach zespołu.",
        ],
      },
      {
        id: "week",
        title: "«Tydzień: rekomendacje, zespół, plan»",
        body: {
          manager: [
            "Na dole «Pulpit» — blok «Tydzień: rekomendacje, zespół, plan»: «Rekomendacje na tydzień» według twoich liczb (szczegóły — [rekomendacje](#leads-coach)) i [«Plan i wykonanie»](#leads-plan-fact) — cele, które ci ustawiono. Wcześniej stały na «Leady» nad listą.",
            "Pieniędzy tu nie ma: ile zarobiłeś i co czeka na wypłatę — w [Finansach](/admin/finance).",
          ],
          head: [
            "Na dole «Pulpit» — blok «Tydzień: rekomendacje, zespół, plan»: «Na dziś» i «Rekomendacje na tydzień», [«Zespół w tym tygodniu»](#leads-team-week), «Najlepsi w tygodniu», «Rekomendacje dla zespołu na tydzień» i [«Plan i wykonanie»](#leads-plan-fact), gdzie ustawiasz plan swojemu menedżerowi. Wcześniej wszystko to stało na «Leady» nad listą.",
            "Po ustawieniu planu strona wraca tutaj, do tego bloku, z odpowiedzią, czy się udało.",
          ],
          admin: [
            "Na dole «Pulpit» — blok «Tydzień: rekomendacje, zespół, plan»: «Na dziś» z przyciskiem «wygeneruj ponownie», [«Zespół w tym tygodniu»](#leads-team-week) z «do wypłaty», «Najlepsi w tygodniu», «Rekomendacje dla zespołu na tydzień» i [«Plan i wykonanie»](#leads-plan-fact), gdzie ustawiasz, zmieniasz i usuwasz plany. Wcześniej to była zakładka «Zespół» na «Leady».",
            "«Kasa w podziale na miesiące», «Oczekiwane płatności» i terminy podatkowe — na dole [Finansów](/admin/finance), umowy do podpisu — w «Wymaga uwagi».",
          ],
        },
      },
      {
        id: "app",
        title: "Aplikacja DevUz na telefonie i powiadomienia",
        body: [
          "Panel można dodać na telefon jako ikonę, jak zwykłą aplikację: otwiera się na pełnym ekranie, bez paska adresu, od razu na «Stronie głównej», i przychodzą do niego powiadomienia — te same wiadomości, które bot wysyła Ci w Telegramie: ciepły lead, klient odpowiedział, klient otworzył makietę, zadania i zaległości, kończy się promocja, ogłoszenie dla zespołu. Stuknięcie w powiadomienie otwiera właściwą stronę panelu: kartę leada, zadanie, makietę; jeśli w wiadomości bota nie ma linku do panelu — «Stronę główną».",
          "**iPhone.** Potrzebny jest iOS 16.4 lub nowszy, a instaluje się tylko z **Safari** (z Chrome i Telegrama na iPhonie się nie da). Otwórz devuz.studio/admin w Safari → na dole przycisk «Udostępnij» (kwadrat ze strzałką w górę) → «Do ekranu początkowego» → «Dodaj». Na ekranie pojawi się ikona DevUz. Powiadomienia na iPhonie przychodzą **tylko w aplikacji z ikony**, w karcie Safari — nie.",
          "**Android.** Otwórz devuz.studio/admin w Chrome. Na «Stronie głównej» będzie karta z przyciskiem «Zainstaluj aplikację» — naciśnij i potwierdź. Nie ma przycisku — menu Chrome (trzy kropki w prawym górnym rogu) → «Zainstaluj aplikację» albo «Dodaj do ekranu głównego».",
          "**Logowanie w aplikacji — kodem.** Aplikacja na ekranie ma własne ciasteczka, oddzielne od przeglądarki, dlatego link logowania od bota otworzy się w przeglądarce, a aplikacja zostanie na ekranie logowania. W aplikacji naciśnij «Odbierz kod w bocie» — otworzy się bot i wyśle 6 cyfr. Wróć do aplikacji, wpisz je i naciśnij «Zaloguj się». Kod jest ważny 5 minut i działa jeden raz; po pięciu błędnych próbach przepada — naciśnij «Odbierz nowy kod». Nikomu nie przesyłaj kodu: z nim loguje się na Twoje imię. Bot nie wysłał kodu (tak bywa, gdy Telegram nie przekazał naciśnięcia «Start») — otwórz bota i wyślij /code albo naciśnij «🔑 Код для приложения» na dole czatu: kod przyjdzie do ostatniego logowania rozpoczętego w aplikacji w ciągu 15 minut. Wszystkie próby trafiają do dziennika. Logowanie trzyma się, dopóki nie naciśniesz «Wyloguj»: kod zostanie wymagany ponownie tylko wtedy, gdy aplikacja nie była otwierana przez 90 dni, oraz raz w roku. Pracownik wyłączony w «Zespół» zostaje wylogowany od razu na wszystkich urządzeniach.",
          "**Włączanie powiadomień.** W aplikacji na «Stronie głównej» naciśnij «Włącz powiadomienia», telefon zapyta o zgodę — naciśnij «Zezwól». Pytamy tylko po naciśnięciu: na iPhonie inaczej się nie da. Gdy włączone — na «Stronie głównej» jest wiersz «To urządzenie: powiadomienia włączone», obok «Sprawdź» (wyśle powiadomienie testowe) i «Wyłącz». Jeśli naciśniesz «Nie zezwalaj» — włączyć można tylko w ustawieniach telefonu: Ustawienia → Powiadomienia → DevUz.",
          "Przychodzi **dokładnie to, co wysyła bot, i według tych samych zaznaczeń**: co kierownik albo właściciel wyłączył Ci w wiadomościach bota, nie przyjdzie też tutaj. Bot zostaje bez zmian i nic w nim się nie wyłącza: w Telegramie są przyciski pod wiadomościami i odpowiedzi do bota — aplikacja ich nie zastępuje, a powiadomienie to szybki sposób, żeby się dowiedzieć i od razu otworzyć panel. Wiadomości bota w grupach i kody logowania nie przychodzą jako powiadomienia.",
          "**Na komputerze** też można: na górze «Strony głównej» wiersz «Powiadomienia na tym komputerze — włącz», w Chrome, Edge, Firefox albo Safari. Niepotrzebne — naciśnij «Ukryj». Kartę na telefonie też można ukryć; wraca po wyczyszczeniu danych przeglądarki.",
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
