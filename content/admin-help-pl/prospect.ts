import type { HelpEntry } from "@/lib/admin/help";

/**
 * Польская инструкция, часть 2: «Заявки», «Поиск» и «Касания».
 *
 * Перевод тех же разделов content/admin-help-ru.ts абзац в абзац. Названия
 * кнопок панели — как на польской панели (content/admin-panel/orders.ts,
 * scout.ts, prospect.ts, prospect-tools.ts), кнопки и сообщения бота в
 * Telegram — по-русски: бот пока пишет только так.
 */
export const prospectSections: Record<string, HelpEntry> = {
  /* ── Заявки ───────────────────────────────────────────────────────── */
  "/admin/orders": {
    what: "Tu są zamówienia gotowych produktów ze sklepu na stronie. To nie są projekty klientów. Zamówienie może prowadzić każdy pracownik.",
    items: [
      {
        id: "flow",
        title: "Droga zamówienia",
        body: [
          "Statusy zamówienia: «nowe», «faktura wystawiona», «opłacone», «przekazane» albo «anulowane». Przyciski na górze pokazują zamówienia z wybranym statusem.",
          "Kontakt kupującego widać od razu. Oznaczenie «bot połączony» znaczy, że o fakturze i płatności napisze mu nasz bot.",
          "Zamówienie utknęło, na przykład faktura czeka na zapłatę 14 dni? Bot przypomni o tym w Telegramie.",
        ],
      },
      {
        id: "invoice",
        title: "Kwota i faktura",
        body: [
          "Zamówienie przyszło bez kwoty? Wpisz ją w «kwota, $» i kliknij **«ustaw»**. Po wystawieniu faktury kwoty nie da się zmienić.",
          "Potem kliknij **«wystaw fakturę»**. Kupujący zobaczy fakturę na stronie zamówienia i zapłaci według danych z niej.",
          "Na górze wisi «Dane bankowe nie są skonfigurowane»? Powiedz właścicielowi: bez nich kupujący nie zobaczy, dokąd zapłacić.",
        ],
      },
      {
        id: "paid",
        title: "Płatność i wydanie plików",
        body: [
          "Pieniądze wpłynęły? Wpisz «pozycja z wyciągu» z wyciągu bankowego i kliknij **«płatność otrzymana»**. Bez tej pozycji przycisk nie zadziała.",
          "Teraz kupujący może pobrać pliki ze strony zamówienia: do 20 razy, nie więcej niż 10 dziennie.",
          "Pierwsze pobranie samo ustawia «przekazane». Kod przekazany inaczej? Kliknij **«kod przekazany»**.",
        ],
      },
      {
        id: "access",
        title: "Linki, dostęp i anulowanie",
        body: [
          "**«wygeneruj link ponownie»** daje nowy link do zamówienia, a stary gaśnie. Nowy widać tylko raz, od razu wyślij go kupującemu.",
          "**«cofnij dostęp do plików»** zamyka pobieranie, **«przywróć dostęp do plików»** otwiera je znowu. Link do pliku wyciekł? Cofnij i przywróć dostęp: stary link zgaśnie.",
          "**«anuluj»** anuluje zamówienie, a kupujący dostaje powiadomienie. **«przywróć do realizacji»** wraca do poprzedniego statusu.",
        ],
      },
    ],
  },

  /* ── Поиск ────────────────────────────────────────────────────────── */
  "/admin/tenders": {
    what: "Tutaj są loty z zamówień publicznych, które pasują do studia: strony, aplikacje, boty, CRM. Każdy lot trafia też do bota jako lead (zgłoszenie klienta).",
    items: [
      {
        id: "how",
        title: "Jak skaut szuka przetargów",
        body: [
          "Co 30 minut skaut (program studia) sprawdza platformy etender, xarid, Hayot Birja i Tender.asia. Bierze tylko naszą pracę: tworzenie stron, aplikacji, botów i systemów. 1C, licencje, serwery, monitoring wizyjny i zakupy sprzętu (laptopy, urządzenia, „baza techniczna”, nawet ze słowem „AI” w nazwie) pomija.",
          "Nowy lot trafia do [kolejki leadów](#leads-queue), tak jak zgłoszenie ze strony. W karcie jest termin, link, kontakt do zamawiającego i tłumaczenie nazwy na rosyjski.",
        ],
      },
      {
        id: "work",
        title: "Co zrobić z lotem",
        body: [
          "**Bez uzgodnionej ceny nie składamy oferty.** Najpierw napisz do Jegora albo Aleksandra, co to za lot i jakie są terminy.",
          "Pasuje? Kliknij «Biorę», a koledzy zobaczą, że lot jest Twój. Złożyłeś ofertę, kliknij «Złożone». Nie pasuje, kliknij «Nie nasze».",
          "Na górze są loty z najbliższym terminem. Ofertę składa się na samej platformie, z podpisem elektronicznym firmy.",
        ],
      },
    ],
  },

  "/admin/scout": {
    what: "Skaut (program studia) całą dobę czyta otwarte czaty w Telegramie i szuka ludzi, którzy potrzebują programisty. Tutaj widać, co znalazł.",
    items: [
      {
        id: "how",
        title: "Jak to działa",
        body: [
          "Skaut ocenia każdą wiadomość od 0 do 100: czy człowiek szuka wykonawcy. Wiadomości z hashtagami pomija, to prawie zawsze reklama.",
          "Od 60 sygnał trafia na kanał «Devuz Scout». Od 70 po paru minutach sam staje się leadem (zgłoszeniem klienta). Codziennie rano na kanał przychodzi podsumowanie «☀️ Скаут за сутки».",
        ],
      },
      {
        id: "strong",
        title: "Mocny sygnał (70+): nie pisz sam",
        body: [
          "Taki sygnał przyjdzie jako lead do osoby, której jest kolej, z gotową pierwszą wiadomością. Nie pisz do człowieka wcześniej: dwie wiadomości ze studia wyglądają jak spam.",
          "Dostałeś taki lead? Pisz od razu, takie wiadomości żyją kilka godzin.",
        ],
      },
      {
        id: "signals",
        title: "Zwykły sygnał: co robić",
        body: [
          "Sygnałów poniżej 70 nikt poza Tobą nie obsłuży. Pasuje? Odpowiedz sam ze swojego konta, na czacie albo autorowi w prywatnej wiadomości.",
          "Potem oznacz sygnał: «odpowiedziano» albo «pominięte». «Przyszedł sam» ustawia się samo, gdy człowiek napisze do naszego bota. Sygnał jest przechowywany 90 dni.",
        ],
      },
      {
        id: "groups",
        title: "Grupy dla skauta: dodaj swoją",
        body: [
          "Znasz grupę, w której szukają wykonawców? Wklej jej adres w bloku «Grupy dla skauta» i kliknij «Dodaj grupę». Pasuje @group, t.me/group albo link t.me/+….",
          "Skaut dołączy do grupy sam: do 10 grup dziennie, z przerwą godzinę lub dwie, w godzinach 08:00-22:00. Dzięki temu Telegram nie uzna go za spamera.",
          "«Prośba u admina» oznacza, że grupa jest zamknięta i czekamy na zgodę. «Nie da się dołączyć» oznacza, że link wygasł albo potrzebna jest weryfikacja, wtedy dołącza się ręcznie. «Usuń» masz przy swoich grupach, kierownik i właściciel usuwają dowolne.",
        ],
      },
      {
        id: "health",
        title: "Czy skaut działa",
        body: {
          manager: [
            "Złota belka na górze oznacza, że ze skautem coś jest nie tak. Nie znika przez dzień lub dwa? Powiedz właścicielowi.",
            "Belka «Konto czyta 12 z 29 zadanych czatów» to nie awaria. Do pozostałych grup skaut dołączy sam.",
          ],
          head: [
            "Złota belka na górze oznacza awarię: skaut milczy albo nie czyta czatów. Naprawia ją właściciel.",
            "Belka «Konto czyta 12 z 29 zadanych czatów» to nie awaria. Do grup z [«Grupy dla skauta»](#scout-groups) skaut dołączy sam.",
          ],
          admin: [
            "«Skaut milczy od N min.» oznacza, że proces skauta na serwerze stoi: uruchom go ponownie. «Model jest niedostępny» oznacza, że nie działa klucz programu, który ocenia wiadomości.",
            "«Konto czyta X z Y zadanych czatów» oznacza, że konto nie dołączyło do wszystkich czatów. Do grup z [«Grupy dla skauta»](#scout-groups) dołączy samo, do czatów z serwera dołącza się ręcznie.",
            "«Mechanizm jest sprawny: …» oznacza, że na czatach jest cisza. To nie awaria.",
          ],
        },
      },
    ],
  },

  "/admin/markets": {
    what: "Tutaj zebraliśmy, gdzie szukać klientów w innych krajach. Dla każdego kraju są platformy z linkami i wskazówkami.",
    items: [
      {
        id: "start",
        title: "Jak wybrać kraj",
        body: [
          "«Rynki» są w menu i jako zakładka w [«Zimne kontakty»](/admin/prospect). Kliknij kartę kraju, żeby go otworzyć.",
          "Zacznij od krajów z etykietą «rynek główny»: Rosja, Kazachstan, USA. «próbujemy» też można, «przy okazji» tylko wtedy, gdy jest powód.",
          "Platforma się nie otwiera albo została zamknięta? Powiedz kierownikowi.",
        ],
      },
      {
        id: "country",
        title: "Strona kraju i przycisk «Do skauta»",
        body: [
          "Na górze krótko: jak tam szukają programisty i w jakim języku pisać. W bloku «Od czego zacząć» jest Twój plan: rób kroki po kolei.",
          "Niżej platformy według rodzaju: giełdy, katalogi, tablice ogłoszeń, czaty w Telegramie. Za platformę można płacić tylko po uzgodnieniu z kierownikiem.",
          "Przy czatach w Telegramie jest przycisk «Do skauta». Kliknij go, a skaut sam dołączy do grupy i będzie przysyłał stamtąd zlecenia do [«Sygnały skauta»](/admin/scout).",
        ],
      },
      {
        id: "tour",
        title: "Szkolenie na ekranie",
        body: {
          manager: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu uruchamia krótkie szkolenie z ośmiu kroków. Zamkniesz je przyciskiem «Pomiń» albo klawiszem Esc.",
            "Szkolenie pokaże Ci się samo jeden raz. Ponownie otworzysz je tym przyciskiem albo w [«Ustawienia»](/admin/settings).",
          ],
          head: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu uruchamia krótkie szkolenie z ośmiu kroków. Zamkniesz je przyciskiem «Pomiń» albo klawiszem Esc.",
            "Menedżerom pokazuje się samo jeden raz, Tobie tylko po kliknięciu. Przycisk jest też w [«Ustawienia»](/admin/settings).",
          ],
          admin: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu uruchamia krótkie szkolenie z ośmiu kroków. Zamkniesz je przyciskiem «Pomiń» albo klawiszem Esc.",
            "Menedżerom pokazuje się samo jeden raz, Tobie tylko po kliknięciu. Przycisk jest też w [«Ustawienia»](/admin/settings).",
          ],
        },
      },
    ],
  },

  /* ── Касания ──────────────────────────────────────────────────────── */
  "/admin/prospect": {
    what: "Tutaj piszemy pierwsi do firm, które jeszcze nas nie znają. Konto firmowe studia wysyła im tylko «Здравствуйте». Jeśli ktoś odpowie, bot wysyła mu wideo w kółku albo krótką wiadomość o jego stronie i proponuje darmową makietę. Dalej rozmowę prowadzi bot, a gdy potrzebny jest człowiek, woła Ciebie. Lead (zgłoszenie klienta) z Twojego kontaktu jest od razu Twój, bez kolejki.",
    items: [
      {
        id: "portion",
        title: "Porcja dnia",
        body: {
          manager: [
            "W porcji dnia są firmy, do których masz dziś napisać. W dni robocze o 07:00 system dzieli je po równo między wszystkich. Twoja norma to tygodniowy plan kontaktów podzielony przez 5 (od 2 do 15 dziennie). Bez planu porcja to 5 firm.",
            "Do 09:00 porcja przychodzi do Ciebie w Telegramie. Przy każdej firmie jest adres, zaczepka i gotowy tekst. Pod kartą są przyciski «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит» i «Открыть в панели». Ta sama porcja jest widoczna na górze sekcji, w bloku «Twoja porcja dnia».",
            "Liczy się tylko kontakt: «Wyślij do @adres» albo «Skontaktowano samodzielnie». Kliknąłeś «✖ Не подходит»? Na jej miejsce od razu przyjdzie inna firma z dopiskiem «zamiana». Zamian dziennie jest najwyżej tyle, co dwie porcje.",
            "Jeśli do 12:00 nic nie zrobisz i nie wejdziesz do panelu, bot przypomni Ci osobiście. O 15:00 kierownik zobaczy, kto w ogóle nie zaczął. Dziś nie dasz rady? Uprzedź kierownika wcześniej.",
            "O 18:00 wszystko niezrobione wraca do wspólnej puli. Kierownik dostaje raport: ile kontaktów ma każdy i ile minut pracował w panelu. Chcesz więcej firm niż w porcji? Włącz [strumień «Получать лиды»](#prospect-stream).",
          ],
          head: [
            "Ty też dostajesz porcję, tak jak menedżerowie. W dni robocze o 07:00 firmy z puli są dzielone po równo między wszystkich w kolejce. Wielkość to tygodniowy plan podzielony przez 5 (od 2 do 15). Bez planu 5 dziennie.",
            "O 09:00 porcja przychodzi w Telegramie z gotowymi tekstami i jest widoczna na górze sekcji. Za «✖ Не подходит» człowiek od razu dostaje inną firmę, ale najwyżej dwie porcje zamian dziennie.",
            "O 12:00 bot przypomina o porcji tym, którzy przez cały dzień nic nie zrobili. O 15:00 Ty i właściciel dostajecie «🔕 К 15:00 молчат: …». Warto zadzwonić i zapytać, co się stało. Osób z planem 0 albo bez zaznaczonego «Nowe zgłoszenia z kolejki» (urlop, zwolnienie) bot nie rusza.",
            "O 18:00 niezrobione wraca do puli. Dostajesz raport «📋 Сотрудники за день»: kontakty i porcja każdego, minuty w panelu, wzięte leady. Na dole są wskazówki, na co zwrócić uwagę.",
            "W poniedziałki o 10:00 przychodzi «📅 Сотрудники за неделю» za zeszły tydzień, a w piątki o 16:00 za bieżący, od poniedziałku do 16:00. Są tam dla każdego kontakty, odpowiedzi, makiety, pokazy, czas w panelu i leady bez ruchu. Menedżerowie tych raportów nie dostają.",
            "Firmy do puli przynosi [automatyczne wyszukiwanie na mapach](#prospect-maps). Pusta pula to puste porcje.",
          ],
          admin: [
            "Nie dostajesz porcji. W dni robocze o 07:00 firmy z puli są dzielone po równo między menedżerów i kierowników. Wielkość to tygodniowy plan podzielony przez 5 (od 2 do 15), bez planu 5. Najpierw idą strony z najgorszą oceną.",
            "Do 09:00 porcja trafia do ludzi w Telegramie, najpóźniej o 10:00. Za «✖ Не подходит» człowiek od razu dostaje inną firmę, do dwóch porcji zamian dziennie.",
            "O 12:00 bot przypomina o porcji tym, którzy nic nie zrobili. O 15:00 Ty i kierownik dostajecie «🔕 К 15:00 молчат: …». Osób z planem 0 albo bez zaznaczonego «Nowe zgłoszenia z kolejki» bot nie rusza. Tak w «Zespół» oznacza się urlop.",
            "O 18:00 niezrobione wraca do puli i dostajesz «📋 Сотрудники за день». W poniedziałki o 10:00 przychodzi «📅 Сотрудники за неделю» za zeszły tydzień, w piątki o 16:00 za bieżący. Oba raporty program liczy z liczb, menedżerowie ich nie dostają.",
            "Porcje są puste? Znaczy, że w puli skończyły się firmy. Załóż nową kampanię [automatycznego wyszukiwania na mapach](#prospect-maps).",
          ],
        },
      },
      {
        id: "stream",
        title: "Strumień «Получать лиды» (w Telegramie)",
        roles: ["manager", "head"],
        body: {
          manager: [
            "Strumień przydaje się, gdy porcja to za mało. Kliknij «▶️ Получать лиды» na dole czatu z botem albo wyślij botowi /leads. Firmy zaczną przychodzić po jednej, z gotowym tekstem i tymi samymi przyciskami co w porcji.",
            "Dziennego limitu nie ma. Załatwiasz firmę i od razu przychodzi następna. Niezałatwionych możesz mieć naraz najwyżej trzy. Tekst do każdej pisze się do minuty, więc karta może przyjść z opóźnieniem.",
            "Strumień działa w dni robocze od 09:00 do 18:00. Czego nie załatwisz do 18:00, wraca do puli. Na noc nie trzeba go wyłączać, rano ruszy sam. Żeby zatrzymać, kliknij «⏸ Не получать лиды» albo znowu wyślij /leads.",
            "Kontakty ze strumienia liczą się do planu tygodnia, ale nie do porcji. W strumieniu nie ma zamiany za «✖ Не подходит». Co przyszło dziś, widać w bloku «Strumień leadów» na górze sekcji.",
          ],
          head: [
            "Strumień przydaje się, gdy porcja to za mało. Kliknij «▶️ Получать лиды» na dole czatu z botem albo wyślij botowi /leads. Firmy zaczną przychodzić po jednej, z gotowym tekstem i tymi samymi przyciskami co w porcji. Menedżerowie włączają strumień tak samo.",
            "Dziennego limitu nie ma. Załatwiasz firmę i od razu przychodzi następna. Jedna osoba może mieć naraz najwyżej trzy niezałatwione. Tekst do każdej pisze się do minuty, więc karta może przyjść z opóźnieniem.",
            "Strumień działa w dni robocze od 09:00 do 18:00. Czego nie załatwisz do 18:00, wraca do puli. Na noc nie trzeba go wyłączać, rano ruszy sam. Żeby zatrzymać, kliknij «⏸ Не получать лиды» albo znowu wyślij /leads.",
            "Kontakty ze strumienia liczą się do planu tygodnia, ale nie do porcji. W strumieniu nie ma zamiany za «✖ Не подходит». Co przyszło dziś, widać w bloku «Strumień leadów» na górze sekcji.",
            "W wieczornym raporcie przy każdym w nawiasie stoi, ile kontaktów przyszło ze strumienia, np. «(поток 4)».",
          ],
        },
      },
      {
        id: "autopilot",
        title: "Automatyczne kontakty: 20 dziennie, dowolne nisze",
        roles: ["head", "admin"],
        body: {
          head: [
            "Automatyczne kontakty same piszą pierwsze wiadomości do firm, bez menedżera. Norma: co najmniej 20 wysłanych «Здравствуйте» w dni robocze i 60 w weekend. Nisze dowolne. Blok «Automatyczne kontakty · dowolne nisze» na górze sekcji pokazuje, ile wyszło dziś, ile osób odpisało i ile leadów wzięto.",
            "Wiadomości przygotowują się od 07:00 do 17:30, w weekend do 20:00. Wychodzą od 07:30 do 20:30, najwyżej trzy nowe na godzinę z jednego konta. Przed pierwszą wiadomością panel [sprawdza stronę na żywo](#prospect-fact-check).",
            "Automatyczne kontakty piszą tylko z dodatkowych kont firmowych, z głównego nie. Jeśli wszystkie dodatkowe są wstrzymane albo ograniczone, wszystko stoi i nic się nie przygotowuje. Sprawdź [«Konta»](/admin/accounts).",
            "Piszą do wolnych firm z puli, których nie ma w niczyjej porcji. Najpierw do tych, które mają Telegram na stronie, potem na numer komórkowy. Na numery stacjonarne nie piszą. Pulę uzupełniają wyszukiwanie na mapach i Firecrawl (serwis, który szuka firm i ich kontaktów w internecie).",
            "Klient odpisał, a dalej rozmowę prowadzi bot. Lead pojawia się, gdy klient zgodził się na makietę, poprosił o telefon albo bot przekazał rozmowę człowiekowi. Wtedy lead trafia do [kolejki leadów](#leads-queue). Odmowa sama zamyka kontakt i nikt nie dostaje karty.",
            "Codziennie o 18:00 (w weekend o 20:30) Ty i właściciel dostajecie raport «🤖 Автопрогон касаний». Widać w nim, ile wyszło, kto odpisał i kto wziął leada. Wiersz «Не добрали» znaczy, że skończyły się firmy albo konta stały. Raport z wierszem «❗ Автопрогон сбоил» przekaż programiście.",
            "Automatyczne kontakty zatrzymuje i uruchamia właściciel.",
          ],
          admin: [
            "Automatyczne kontakty same piszą pierwsze wiadomości do firm, bez menedżera. Norma: co najmniej 20 wysłanych «Здравствуйте» w dni robocze i 60 w weekend. Nisze dowolne. Blok «Automatyczne kontakty · dowolne nisze» na górze sekcji pokazuje, ile wyszło dziś, ile osób odpisało i ile leadów wzięto.",
            "Wiadomości przygotowują się od 07:00 do 17:30, w weekend do 20:00. Wychodzą od 07:30 do 20:30, najwyżej trzy nowe na godzinę z jednego konta. Przed pierwszą wiadomością panel [sprawdza stronę na żywo](#prospect-fact-check).",
            "Automatyczne kontakty piszą tylko z dodatkowych kont firmowych, z głównego nie. Jeśli wszystkie dodatkowe są wstrzymane albo ograniczone, wszystko stoi i nic się nie przygotowuje. Sprawdź [«Konta»](/admin/accounts).",
            "Piszą do wolnych firm z puli, których nie ma w niczyjej porcji. Najpierw do tych, które mają Telegram na stronie, potem na numer komórkowy. Na numery stacjonarne nie piszą. Pulę uzupełniają wyszukiwanie na mapach i Firecrawl (serwis, który szuka firm i ich kontaktów w internecie).",
            "Klient odpisał, a dalej rozmowę prowadzi bot. Lead pojawia się, gdy klient zgodził się na makietę, poprosił o telefon albo bot przekazał rozmowę człowiekowi. Wtedy lead trafia do [kolejki leadów](#leads-queue). Odmowa sama zamyka kontakt i nikt nie dostaje karty.",
            "Codziennie o 18:00 (w weekend o 20:30) Ty i kierownik dostajecie raport «🤖 Автопрогон касаний». Widać w nim, ile wyszło, kto odpisał i kto wziął leada. Wiersz «Не добрали» znaczy, że skończyły się firmy albo konta stały. Raport z wierszem «❗ Автопрогон сбоил» przekaż programiście.",
            "Przycisk «Zatrzymaj automatyczne kontakty» w bloku od razu wstrzymuje nowe wiadomości. Te, które już są w kolejce, wyjdą. «Uruchom automatyczne kontakty» włącza je znowu, oba kliknięcia trafiają do dziennika.",
          ],
        },
      },
      {
        id: "no-text",
        title: "Karta przyszła bez tekstu",
        body: {
          manager: [
            "Czasem firma przychodzi w Telegramie bez wiadomości, z dopiskiem «Текст ещё готовится». Tak się dzieje, gdy program, który pisze teksty, chwilowo nie odpowiada.",
            "Nic nie musisz klikać. Gdy tylko tekst będzie gotowy, bot przyśle tę samą firmę jeszcze raz z dopiskiem «✍️ Текст готов». Nie chcesz czekać? Kliknij «✋ Написал сам» i napisz własnymi słowami.",
          ],
          head: [
            "Czasem firma przychodzi w Telegramie bez wiadomości, z dopiskiem «Текст ещё готовится». Tak bywa u Ciebie i u menedżerów, gdy program, który pisze teksty, chwilowo nie odpowiada.",
            "Nic nie trzeba klikać. Gdy tylko tekst będzie gotowy, bot przyśle tę samą firmę jeszcze raz z dopiskiem «✍️ Текст готов». Kto nie chce czekać, niech kliknie «✋ Написал сам».",
            "W wieczornym raporcie taka karta liczy się normalnie. Nie zamienia się w «nie pasuje».",
          ],
          admin: [
            "Jeśli na koncie AI skończyły się pieniądze albo dostawca ma awarię, teksty do porcji się nie piszą. Porcja i tak trafia do ludzi najpóźniej o 10:00, jako karty z dopiskiem «Текст ещё готовится».",
            "System próbuje znowu co pięć minut. Doładujesz saldo, a teksty dopiszą się same. Każdy dostanie swoją firmę jeszcze raz z dopiskiem «✍️ Текст готов».",
            "Jeśli nie wyszła sama wiadomość (np. firma bez strony nie ma podanej niszy), ponownej próby nie ma. Do takiej firmy człowiek pisze sam przez «Skontaktuj się».",
          ],
        },
      },
      {
        id: "plan",
        title: "Tygodniowy plan kontaktów",
        body: {
          manager: [
            "Plan kontaktów pokazuje, do ilu firm masz napisać w tym tygodniu. Ustawia go kierownik albo właściciel. Postęp widać na górze sekcji i na «Pulpit», np. «zrobione 18 z 30».",
            "Liczą się firmy, do których napisałeś od poniedziałku: kliknąłeś «Wyślij do @adres» albo «Skontaktowano samodzielnie». Jedna firma to jeden kontakt. «Skontaktuj się» to jeszcze nie kontakt, tylko przygotowanie wiadomości. Wiadomość, która nie wyszła, też się nie liczy. Lead dodany przez «Dodaj leada ręcznie» też jest kontaktem: osoby, która go dodała.",
          ],
          head: [
            "Plan swoim menedżerom ustawiasz w [«Zespół»](/admin/team), kolumna «Plan kontaktów». Puste pole to «bez planu», wtedy porcja to 5 dziennie. Zero znaczy, że porcji nie będzie wcale. Twój własny plan ustawia właściciel.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do @adres» albo «Skontaktowano samodzielnie». Wiadomość, która nie wyszła, się nie liczy. Lead dodany przez «Dodaj leada ręcznie» też jest kontaktem: osoby, która go dodała.",
          ],
          admin: [
            "Plan ustawia się w [«Zespół»](/admin/team), kolumna «Plan kontaktów». Ty ustawiasz go komu chcesz, kierownik tylko swoim ludziom. Puste pole to «bez planu», wtedy porcja to 5 dziennie. Zero znaczy brak porcji.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do @adres» albo «Skontaktowano samodzielnie». Wiadomość, która nie wyszła, się nie liczy. Lead dodany przez «Dodaj leada ręcznie» też jest kontaktem: osoby, która go dodała.",
          ],
        },
      },
      {
        id: "send",
        title: "Napisać do firmy: «Skontaktuj się» i «Wyślij»",
        body: [
          "Żeby napisać do firmy, kliknij w jej karcie «Skontaktuj się». Panel jeszcze raz otworzy stronę (do minuty) i złoży wiadomość. To jeszcze nie liczy się jako kontakt.",
          "Wiadomość jest krótka i bez powitania. Tekst pochodzi z Twoich [tekstów wiadomości](#prospect-texts), a fakty o stronie panel wstawia sam: co jest nie tak i jak to przeszkadza klientom. Do strony uzbeckiej wiadomość idzie po uzbecku.",
          "Przeczytaj wiadomość i popraw ją, jeśli trzeba. Potem kliknij «Wyślij do @adres». Najpierw wyjdzie «Здравствуйте», a wiadomość dopiero po odpowiedzi klienta ([kontakt w dwóch krokach](#prospect-hello)). Od tej chwili kontakt się liczy, a lead jest Twój.",
          "Gdy wiadomość wyjdzie, w miejscu przycisku pojawi się «Kontakt nawiązany» i konto, z którego pisano. Jeśli odpisujesz klientowi sam, pisz tylko z tego konta. Dla klienta to ma być jeden rozmówca.",
          "Przed wysłaniem panel sprawdza wiadomość: czy nie ma słów technicznych, własnych liczb, procentów albo «gwarantuję». Długość od 12 do 100 słów. Jeśli coś jest nie tak, panel napisze, co poprawić.",
          "«Skontaktuj się» może kliknąć każdy pracownik i firma stanie się jego. Dlatego zaczynaj od [porcji dnia](#prospect-portion): tam firmy są już podzielone.",
        ],
      },
      {
        id: "texts",
        title: "Teksty wiadomości i A/B",
        body: {
          manager: [
            "Przycisk «Teksty wiadomości i A/B» jest pod opisem sekcji. Tam piszesz własny tekst wiadomości, która pójdzie do klienta po jego odpowiedzi. Możesz napisać dwa teksty. Wtedy to A/B (porównanie dwóch wersji): Twoje kontakty dzielą się między nie po równo.",
            "W tekście są wstawki w nawiasach klamrowych. Obowiązkowa jest {tezislar}: w jej miejscu pojawią się fakty o stronie klienta. Są też {sayt}, {kompaniya}, {ism}, {kim} i {prototip}. Pisz krótko, bez «Здравствуйте» i bez własnych liczb. Pod formularzem widać, jak wiadomość zobaczy klient.",
            "Pod każdym tekstem jest wynik: ile wiadomości wyszło, ile osób odpisało, ile chce makietę. Dopóki na tekst nie wyjdzie co najmniej 20 wiadomości, panel pisze, że za wcześnie na ocenę. Potem widać, który tekst jest lepszy. «Zostaw ten, drugi usuń» zostawia zwycięzcę.",
            "Nie masz własnych tekstów? Wtedy wiadomości idą według wspólnych tekstów zespołu. Wersję uzbecką możesz napisać sam, inaczej panel ją przetłumaczy. Poprawka nie psuje wyniku: stary tekst trafia do archiwum, nowy liczy się od zera.",
          ],
          head: [
            "Przycisk «Teksty wiadomości i A/B» jest pod opisem sekcji. Tam piszesz własny tekst wiadomości, która pójdzie do klienta po jego odpowiedzi. Możesz napisać dwa teksty. Wtedy to A/B (porównanie dwóch wersji): Twoje kontakty dzielą się między nie po równo.",
            "W tekście są wstawki w nawiasach klamrowych. Obowiązkowa jest {tezislar}: w jej miejscu pojawią się fakty o stronie klienta. Są też {sayt}, {kompaniya}, {ism}, {kim} i {prototip}. Pisz krótko, bez «Здравствуйте» i bez własnych liczb. Pod formularzem widać, jak wiadomość zobaczy klient.",
            "Pod każdym tekstem jest wynik: ile wiadomości wyszło, ile osób odpisało, ile chce makietę. Dopóki na tekst nie wyjdzie co najmniej 20 wiadomości, panel pisze, że za wcześnie na ocenę. Potem widać, który tekst jest lepszy. «Zostaw ten, drugi usuń» zostawia zwycięzcę.",
            "Nie masz własnych tekstów? Wtedy wiadomości idą według wspólnych tekstów zespołu. Wersję uzbecką możesz napisać sam, inaczej panel ją przetłumaczy. Poprawka nie psuje wyniku: stary tekst trafia do archiwum, nowy liczy się od zera.",
            "Widzisz teksty wszystkich menedżerów i możesz zrobić najlepszy wspólnym: «Ustaw jako wspólny tekst 1» albo «Ustaw jako wspólny tekst 2». Wspólne teksty edytujesz Ty i właściciel. Niżej są «Podejścia autopilota»: «Problem i rozwiązanie», «Pytanie» i «Swoi w branży». Nimi piszą automatyczne kontakty, każde ma własny wynik.",
          ],
          admin: [
            "Przycisk «Teksty wiadomości i A/B» jest pod opisem sekcji. Tam piszesz własny tekst wiadomości, która pójdzie do klienta po jego odpowiedzi. Możesz napisać dwa teksty. Wtedy to A/B (porównanie dwóch wersji): Twoje kontakty dzielą się między nie po równo.",
            "W tekście są wstawki w nawiasach klamrowych. Obowiązkowa jest {tezislar}: w jej miejscu pojawią się fakty o stronie klienta. Są też {sayt}, {kompaniya}, {ism}, {kim} i {prototip}. Pisz krótko, bez «Здравствуйте» i bez własnych liczb. Pod formularzem widać, jak wiadomość zobaczy klient.",
            "Pod każdym tekstem jest wynik: ile wiadomości wyszło, ile osób odpisało, ile chce makietę. Dopóki na tekst nie wyjdzie co najmniej 20 wiadomości, panel pisze, że za wcześnie na ocenę. Potem widać, który tekst jest lepszy. «Zostaw ten, drugi usuń» zostawia zwycięzcę.",
            "Nie masz własnych tekstów? Wtedy wiadomości idą według wspólnych tekstów zespołu. Wersję uzbecką możesz napisać sam, inaczej panel ją przetłumaczy. Poprawka nie psuje wyniku: stary tekst trafia do archiwum, nowy liczy się od zera.",
            "Widzisz teksty wszystkich menedżerów i możesz zrobić najlepszy wspólnym: «Ustaw jako wspólny tekst 1» albo «Ustaw jako wspólny tekst 2». Wspólne teksty edytujesz Ty i kierownik. Niżej są «Podejścia autopilota»: «Problem i rozwiązanie», «Pytanie» i «Swoi w branży». Nimi piszą automatyczne kontakty, każde ma własny wynik.",
          ],
        },
      },
      {
        id: "hello",
        title: "Kontakt w dwóch krokach: «Здравствуйте», potem kółko albo wiadomość",
        body: [
          "Do nieznajomego konto firmowe najpierw pisze tylko «Здравствуйте», do strony uzbeckiej «Assalomu alaykum». Długą wiadomość od nieznajomego Telegram uznaje za spam i może ograniczyć konto. Na samo powitanie nikt się tak nie skarży.",
          "Od 19.11.2026 kółka są wyłączone: na każdą odpowiedź po trzech minutach idzie wiadomość z analizą strony w języku klienta, dalej bot prowadzi rozmowę pytaniami SPIN. Tak było z kółkami, jeśli wrócą: klient odpisał po rosyjsku, po dwóch minutach bot wysyłał mu wideo w kółku: obejrzeliśmy stronę i znaleźliśmy kilka błędów. Odpisał po uzbecku, pójdzie kółko po uzbecku. Odpisał w innym języku, po trzech minutach pójdzie wiadomość w jego języku.",
          "Nie ma kółka albo klient zablokował wiadomości wideo? Zamiast kółka pójdzie wiadomość. Firma bez strony kółka nie dostaje, piszemy jej wiadomość o jej branży.",
          "Klient odpisał na kółko «да», «+» albo «jakie błędy?». Po trzech minutach bot sam wyśle omówienie: co jest nie tak na stronie i propozycję darmowej makiety. Na «+» po omówieniu bot odpisze, że szykujemy makietę, a zespół dostanie «🔥 Нужен прототип».",
          "Klient prosi o telefon albo odpisał niejasno? Bot zawoła Ciebie. Napisał «nie piszcie», a kontakt zamknie się sam. Nie odpisał wcale, nic więcej nie wychodzi. Do licznika kontaktów wlicza się samo «Здравствуйте».",
        ],
      },
      {
        id: "edit-sent",
        title: "«Popraw»: poprawić to, co już wysłane",
        body: [
          "Jeśli w wysłanej wiadomości jest literówka, można ją poprawić. Przycisk «Popraw» jest przy wiadomości w karcie firmy i przy naszych wiadomościach na «Oś zdarzeń» w karcie leada. Popraw tekst i kliknij «Zapisz poprawkę».",
          "Wiadomość jeszcze nie wyszła? Poprawi się od razu. Już wyszła, wtedy poprawi ją bot z tego samego konta, zwykle w minutę. Klient zobaczy dopisek «edytowano». Telegram pozwala poprawiać wiadomość przez 48 godzin.",
          "Nowy tekst jest sprawdzany tak samo jak przed wysłaniem. Powitania i kółka poprawić się nie da. Przycisk widzi osoba, która prowadzi kontakt albo leada, kierownik i właściciel.",
        ],
      },
      {
        id: "hello-text",
        title: "Własne powitanie zamiast «Здравствуйте»",
        body: {
          manager: [
            "Jako pierwsze idzie powitanie, zwykle «Здравствуйте». Kierownik i właściciel mogą je zmienić na własne w «Teksty wiadomości i A/B», blok «Pierwsza wiadomość». Tam też widać, co wychodzi teraz.",
          ],
          head: [
            "W «Teksty wiadomości i A/B», blok «Pierwsza wiadomość», możesz ustawić własne powitanie zamiast «Здравствуйте». Rosyjskie i uzbeckie ustawia się osobno. Kliknij «Zapisz powitanie», a wszystkie następne kontakty zaczną się od niego. Puste pole oznacza zwykłe powitanie.",
            "Tekst musi zostać powitaniem. Panel nie zapisze tekstu dłuższego niż 8 słów, z linkiem, cyframi, ceną albo emoji. Musi zaczynać się od powitania, np. «Добрый день» albo «Salom». Zmieniać je możesz Ty i właściciel, zmiana trafia do dziennika.",
          ],
          admin: [
            "W «Teksty wiadomości i A/B», blok «Pierwsza wiadomość», możesz ustawić własne powitanie zamiast «Здравствуйте». Rosyjskie i uzbeckie ustawia się osobno. Kliknij «Zapisz powitanie», a wszystkie następne kontakty zaczną się od niego. Puste pole oznacza zwykłe powitanie.",
            "Tekst musi zostać powitaniem. Panel nie zapisze tekstu dłuższego niż 8 słów, z linkiem, cyframi, ceną albo emoji. Musi zaczynać się od powitania, np. «Добрый день» albo «Salom». Zmieniać je możesz Ty i kierownik, zmiana trafia do dziennika.",
          ],
        },
      },
      {
        id: "after-reply",
        title: "Co idzie po odpowiedzi: o nim, cena wcześniej, odpowiedzi na zastrzeżenia",
        body: [
          "Po odpowiedzi na «Здравствуйте» połowa kontaktów idzie nowym scenariuszem, połowa starym. Dzięki temu widać, czy nowy pomaga ([A/B](#prospect-sales-ab)). Oto co robi nowy scenariusz.",
          "Przed kółkiem idzie jedna linijka: «Это про ваш сайт clinic.uz, 40 секунд». Kółko dobiera się do branży: stomatologii o stomatologii, meblom o meblach. Nie ma kółka branży, idzie ogólne.",
          "Zaraz po «+», razem z linkiem do warunków makiety, idzie cena: makieta za darmo, a jeśli się spodoba, landing od 500 $, można w częściach. Na częste zastrzeżenia («Jaka strona?», «Drogo», «Przekażę szefowi») bot odpowiada gotowym tekstem.",
          "Napisał «przekażę szefowi» i zamilkł? Po dwóch dniach, w dni robocze od 10:00 do 18:00, pójdzie jedno pytanie: czy szef zdążył obejrzeć.",
          "Dla wszystkich kontaktów: autoodpowiedź w stylu «Odpowiemy w godzinach pracy» nie liczy się jako odpowiedź. Bot odpisuje nie wcześniej niż po 40-120 sekundach, krótko i bez list. Jeśli odpowiedź nie przejdzie kontroli, rozmowa trafia do Ciebie.",
          "Od 21:00 do 08:00 bot do klientów nie pisze. Odpowiedzi z nocy przyjdą do Ciebie o 08:00 jednym podsumowaniem «🌙 Ночью ответили клиенты».",
        ],
      },
      {
        id: "objections",
        title: "Przyciski «Odpowiedzi na zastrzeżenia» w karcie leada",
        body: [
          "Pod polem odpowiedzi w karcie leada jest blok «Odpowiedzi na zastrzeżenia». Kliknij przycisk, a gotowy tekst trafi do pola w języku klienta. Popraw go pod rozmowę i wyślij.",
          "Przyciski: «Jaka strona? Co to?», «Za darmo? Gdzie haczyk?», «Nie otwieram linków», «Przekażę szefowi», «Sprzedajemy przez Instagram», «Strona już jest», «Drogo».",
          "W tekście na «drogo» jest drabinka cen: poprawa 3 błędów za 150 $, wizytówka 250 $, landing 500 $, strona firmowa 1 000 $. Płatność w częściach: połowa na start, połowa po uruchomieniu.",
          "Przy części kontaktów jest jeszcze przycisk «Makieta gotowa + pokaz». Proponuje pokazanie makiety w 15 minut, przez wideo albo na spotkaniu.",
        ],
      },
      {
        id: "sales-ab",
        title: "Blok «Nowe podejście po odpowiedzi»: A/B",
        body: [
          "Blok «Nowe podejście po odpowiedzi» w «Teksty wiadomości i A/B» porównuje dwa scenariusze. Każdy kontakt losowo trafia do «Jak było» albo do «Nowe podejście». Co robi nowy, opisuje punkt [co idzie po odpowiedzi](#prospect-after-reply).",
          "Dla każdej połowy widać, ile wyszło «Здравствуйте», ile osób odpisało, ile przysłało «+», dostało makietę i zapłaciło.",
          "Zwycięzcę panel wskazuje nie wcześniej niż po 100 «Здравствуйте» na każdą połowę. Do tego czasu pisze, że za wcześnie.",
        ],
      },
      {
        id: "spin",
        title: "SPIN: sprzedaż pytaniami",
        body: [
          "SPIN to sposób sprzedaży pytaniami, a nie opowiadaniem o sobie. Pytania idą po kolei: sytuacja (jak jest u klienta teraz, skąd przychodzą jego klienci), problem (czy widzi to, co znaleźliśmy), konsekwencje (do czego to prowadzi: człowiek nie doszedł do zgłoszenia i odszedł do innych), korzyść (sam mówi, że poprawiona wersja jest mu potrzebna). Po «korzyści» proponujemy makietę. Klient, który sam powiedział, że tego potrzebuje, zgadza się chętniej niż ten, którego przekonywano.",
          "Pod polem odpowiedzi w karcie leada jest blok «Pytania SPIN»: przyciski «Sytuacja», «Problem», «Konsekwencje», «Korzyść». Kliknij, a pytanie trafi do pola w języku klienta i słowami jego branży (pacjenci, goście, zamawiający). Zadawaj jedno pytanie naraz i najpierw odpowiadaj na to, o co pytał klient. Zainteresował się wcześniej — pytania nie są potrzebne, od razu proponuj makietę.",
          "Połowa rozmów, które AI prowadzi do makiety, idzie według SPIN: w każdej wiadomości jedno pytanie kolejnego etapu, po «korzyści» — «proszę wysłać «+»». Druga połowa idzie jak dotąd. Porównanie jest w bloku «SPIN w rozmowie AI» w [Teksty wiadomości i A/B](/admin/prospect/texts): ile rozmów, «+» i makiet w każdej połowie. Zwycięzcę panel wskazuje nie wcześniej niż po 30 rozmowach na każdą.",
        ],
      },
      {
        id: "fact-check",
        title: "Sprawdzenie strony na żywo i ludzki język",
        body: [
          "Przed każdą wiadomością panel jeszcze raz otwiera stronę klienta, jak kupujący z telefonu. Do wiadomości trafia tylko to, co powtórzyło się przy tym sprawdzeniu. Dzięki temu przypadkowa awaria nie trafi do wiadomości.",
          "Pod wiadomością w karcie widać, kiedy strona była sprawdzona i co się nie potwierdziło. Strona nie otworzyła się drugi raz? Wiadomości nie będzie. Kliknij «Skontaktuj się» jeszcze raz za kilka minut.",
          "Sprawdzenie jest ważne trzy dni. Starszej wiadomości panel nie wyśle, a w karcie znowu pojawi się «Skontaktuj się». Twoje poprawki starego tekstu wtedy przepadną.",
          "Wiadomość pisze się prostymi słowami: właściciel firmy nie jest programistą. Nie «błąd 500», tylko «zamiast działu otwiera się strona z błędem». Słów w stylu «serwer», «SEO» czy «indeksacja» kontrola nie przepuści.",
        ],
      },
      {
        id: "proto-ahead",
        title: "Prototyp z góry: link w wiadomości zamiast obietnicy",
        body: [
          "Teraz ta funkcja jest wyłączona: panel sam prototypów nie składa. Wiadomość obiecuje prototyp w 12 godzin, a składa go człowiek.",
          "Gdy klient się zgodzi, zespół dostaje «🛠 Хотят прототип» albo «🔥 Нужен прототип». Kto pierwszy kliknie «🛠 Беру прототип», ten ma leada ([odpowiedzi klientów](#prospect-replies)).",
        ],
      },
      {
        id: "list",
        title: "Co widać na liście «Przeanalizowane strony»",
        body: [
          "Na liście od razu widać strony, nad którymi trwa praca. To karty z gotowym tekstem, wiadomości w kolejce, «napisz ręcznie» i wszystko, co wysłano w ostatnich 7 dniach. Jest tu też Twoja [porcja dnia](#prospect-portion) i karta, którą przed chwilą otwierałeś.",
          "Reszta jest ukryta: nieruszone, pominięte, zamknięte i wysłane ponad tydzień temu. Z nich widać pierwsze 20, nowe na górze. Potrzebujesz więcej? Kliknij **«Pokaż jeszcze 20»** pod listą.",
        ],
      },
      {
        id: "queue",
        title: "Kolejka konta firmowego: trzy wiadomości na godzinę, od 07:30 do 20:30",
        body: {
          manager: [
            "Konto firmowe (numer studia w Telegramie) pisze do nowych firm najwyżej trzy razy na godzinę. Między wiadomościami jest przerwa 8-20 minut, wysyłka tylko od 07:30 do 20:30 czasu taszkenckiego. Gdybyśmy pisali częściej, Telegram uzna nas za masową wysyłkę i ograniczy konto.",
            "Wiadomość dodana w nocy wyjdzie rano. Z tymi, którzy już odpowiedzieli, rozmowa idzie o każdej porze i bez limitu.",
            "Nad listą widać, ile wyszło w ostatniej godzinie i ile czeka: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3». Przy karcie w kolejce jest napisane, kiedy mniej więcej wyjdzie, na przykład «dziś około 14:20». Czas może przesunąć się o kwadrans, ale wiadomość nie zginęła.",
            "Kont firmowych bywa kilka. Wiadomość wychodzi z tego, na którym wcześniej zwolniło się miejsce. Ale jeśli kierownik przypisał Cię do konkretnych kont, wiadomość wyjdzie tylko z nich. Odpowiedzi do klienta idą z tego samego konta, co pierwsza wiadomość.",
            "Czasem Telegram ogranicza konto, zwykle na dobę. Wtedy przy karcie jest żółty wiersz, że Telegram ograniczył konto do podanej godziny, i wiadomość czeka do tego czasu. O ograniczeniu i jego zdjęciu bot pisze do całego zespołu.",
            "Nie trzeba czekać. Napisz do klienta ze swojego konta i kliknij **«Skontaktowano samodzielnie»**, wtedy bot nie wyśle swojej kopii. Wiersz «Tej wiadomości nie weźmie teraz żadne konto firmowe» znaczy, że Twoje konta są wyłączone. Poproś kierownika, żeby dodał Cię do działającego. Jeśli wszystkie konta, do których przypisany jest autor, są wyłączone, przycisku «Wyślij do …» nie ma wcale. Zamiast niego jest «Bot nie może teraz wysłać», «Otwórz … w Telegramie» i «Kopiuj tekst». Dzięki temu wiadomość nie utknie w kolejce.",
            "Wiadomości właściciela idą poza kolejką, przy takich kartach jest to napisane. Wychodzą po minucie, bez czekania na resztę, ale też tylko od 07:30 do 20:30.",
          ],
          head: [
            "Konto firmowe (numer studia w Telegramie) pisze do nowych firm najwyżej trzy razy na godzinę. Między wiadomościami jest przerwa 8-20 minut, wysyłka tylko od 07:30 do 20:30 czasu taszkenckiego. Gdybyśmy pisali częściej, Telegram uzna nas za masową wysyłkę i ograniczy konto.",
            "Wiadomość dodana w nocy wyjdzie rano. Z tymi, którzy już odpowiedzieli, rozmowa idzie o każdej porze i bez limitu.",
            "Nad listą widać, ile wyszło w ostatniej godzinie i ile czeka: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3». Przy karcie w kolejce jest napisane, kiedy mniej więcej wyjdzie, na przykład «dziś około 14:20». Czas może przesunąć się o kwadrans, ale wiadomość nie zginęła.",
            "Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce. Kto z jakich kont pisze, zaznaczasz Ty albo właściciel w sekcji [«Konta»](/admin/accounts) (punkt [kto pracuje na koncie](#accounts-staff)). Menedżer z zaznaczeniem pisze tylko ze swoich kont, bez zaznaczenia pisze z dowolnego.",
            "Czasem Telegram ogranicza konto, zwykle na dobę. Wtedy przy karcie jest żółty wiersz, że Telegram ograniczył konto do podanej godziny, i wiadomość czeka do tego czasu. O ograniczeniu i jego zdjęciu bot pisze do całego zespołu.",
            "Nie trzeba czekać: możesz napisać do klienta sam i kliknąć **«Skontaktowano samodzielnie»**. Wiersz «Tej wiadomości nie weźmie teraz żadne konto firmowe» znaczy, że autor jest przypisany tylko do wyłączonych kont. Przypisz go jeszcze do jednego, działającego. Jeśli wszystkie konta, do których przypisany jest autor, są wyłączone, przycisku «Wyślij do …» nie ma wcale. Zamiast niego jest «Bot nie może teraz wysłać», «Otwórz … w Telegramie» i «Kopiuj tekst». Dzięki temu wiadomość nie utknie w kolejce.",
            "Wiadomości właściciela idą poza kolejką, przy takich kartach jest to napisane. Wychodzą po minucie, bez czekania na resztę, ale też tylko od 07:30 do 20:30.",
          ],
          admin: [
            "Konto firmowe (numer studia w Telegramie) pisze do nowych firm najwyżej trzy razy na godzinę. Między wiadomościami jest przerwa 8-20 minut, wysyłka tylko od 07:30 do 20:30 czasu taszkenckiego. Gdybyśmy pisali częściej, Telegram uzna nas za masową wysyłkę i ograniczy konto.",
            "Wiadomość dodana w nocy wyjdzie rano. Z tymi, którzy już odpowiedzieli, rozmowa idzie o każdej porze i bez limitu.",
            "Nad listą widać, ile wyszło w ostatniej godzinie i ile czeka: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3». Przy karcie w kolejce jest napisane, kiedy mniej więcej wyjdzie, na przykład «dziś około 14:20». Czas może przesunąć się o kwadrans, ale wiadomość nie zginęła.",
            "Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce. Kto z jakich kont pisze, zaznaczasz Ty albo kierownik w sekcji [«Konta»](/admin/accounts) (punkt [kto pracuje na koncie](#accounts-staff)). Pracownik z zaznaczeniem pisze tylko ze swoich kont, bez zaznaczenia pisze z dowolnego.",
            "Czasem Telegram ogranicza konto, zwykle na dobę. Wtedy przy karcie jest żółty wiersz, że Telegram ograniczył konto do podanej godziny, i wiadomość czeka do tego czasu. O ograniczeniu i jego zdjęciu bot pisze do całego zespołu.",
            "Nie trzeba czekać: możesz napisać do klienta sam i kliknąć **«Skontaktowano samodzielnie»**. Wiersz «Tej wiadomości nie weźmie teraz żadne konto firmowe» znaczy, że autor jest przypisany tylko do wyłączonych kont. Przypisz go jeszcze do jednego, działającego. Jeśli wszystkie konta, do których przypisany jest autor, są wyłączone, przycisku «Wyślij do …» nie ma wcale. Zamiast niego jest «Bot nie może teraz wysłać», «Otwórz … w Telegramie» i «Kopiuj tekst». Dzięki temu wiadomość nie utknie w kolejce.",
            "Twoje wiadomości idą poza kolejką: po minucie, bez czekania na wiadomości zespołu. Ale też tylko od 07:30 do 20:30 i też liczą się do limitu trzech na godzinę.",
          ],
        },
      },
      {
        id: "self",
        title: "«Skontaktowano samodzielnie»: napisałeś do klienta sam",
        body: [
          "Kliknij **«Skontaktowano samodzielnie»**, gdy napisałeś albo zadzwoniłeś do klienta sam: ze swojego konta, przez WhatsApp albo telefon. W polu krótko wpisz jak, na przykład «telefon». W Telegramie ten przycisk nazywa się «✋ Написал сам».",
          "Po kliknięciu kontakt liczy się Tobie, a lead (zgłoszenie klienta) zostaje przypisany do Ciebie. Karta zmienia się na «wysłano» i kolega już nie napisze do tego klienta. Bez oznaczenia panel uznaje, że do nikogo nie pisałeś.",
          "Pisałeś z konta firmowego studia? Gdy klient odpowie, bot sam zobaczy odpowiedź i poprowadzi rozmowę dalej. Jeśli pisałeś na numer, dodaj go do kontaktów konta firmowego, inaczej bot nie rozpozna klienta.",
          "Pisałeś z prywatnego konta, przez WhatsApp albo dzwoniłeś? Wtedy rozmowę prowadzisz Ty, bot jej nie widzi. Odpowiedź klienta możesz wkleić do karty (punkt [napisz ręcznie](#prospect-manual)).",
        ],
      },
      {
        id: "write-myself",
        title: "Zdjąć wiadomość z kolejki i napisać samemu",
        body: {
          manager: [
            "Wiadomość czeka w kolejce, a chcesz napisać do klienta sam i nie czekać? Zdejmij ją z kolejki, a bot jej nie wyśle.",
            "**W Telegramie.** Pod kartą firmy kliknij «✋ Напишу сам — не отправлять». Bot przyśle tekst wiadomości (kliknij go, a się skopiuje) i przycisk, który otworzy rozmowę z klientem. Jeśli bot zdążył już wysłać, przycisk pokaże «📤 Бот уже отправил это письмо».",
            "**W panelu, kilka naraz.** Nad listą jest żółty blok. Zaznacz «Napiszę sam» przy swoich wiadomościach i kliknij **«Napiszę sam — nie wysyłaj»**. Przycisk **«Zaznacz wszystkie»** zaznacza wszystkie Twoje wiadomości.",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self). Kontakt i lead są Twoje, do klienta piszesz Ty. Jego odpowiedź wklej do karty, w pole «Co odpisał klient» (punkt [napisz ręcznie](#prospect-manual)).",
          ],
          head: [
            "Wiadomość czeka w kolejce, a chcesz napisać do klienta sam i nie czekać? Zdejmij ją z kolejki, a bot jej nie wyśle.",
            "**W Telegramie.** Pod kartą firmy kliknij «✋ Напишу сам — не отправлять». Bot przyśle tekst wiadomości (kliknij go, a się skopiuje) i przycisk, który otworzy rozmowę z klientem. Jeśli bot zdążył już wysłać, przycisk pokaże «📤 Бот уже отправил это письмо».",
            "**W panelu, kilka naraz.** Nad listą jest żółty blok, a pole «Napiszę sam» jest przy każdej wiadomości w kolejce. Zaznacz potrzebne i kliknij **«Napiszę sam — nie wysyłaj»**. Kontakt zapisze się na Ciebie, więc zdejmuj wiadomość menedżera tylko wtedy, gdy naprawdę piszesz sam.",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self). Kontakt jest Twój, a lead zostaje u tego, kto dodał wiadomość do kolejki. Odpowiedź klienta wklej do karty, w pole «Co odpisał klient» (punkt [napisz ręcznie](#prospect-manual)).",
          ],
          admin: [
            "Wiadomość czeka w kolejce, a chcesz napisać do klienta sam i nie czekać? Zdejmij ją z kolejki, a bot jej nie wyśle.",
            "**W Telegramie.** Pod kartą firmy kliknij «✋ Напишу сам — не отправлять». Bot przyśle tekst wiadomości (kliknij go, a się skopiuje) i przycisk, który otworzy rozmowę z klientem. Jeśli bot zdążył już wysłać, przycisk pokaże «📤 Бот уже отправил это письмо».",
            "**W panelu, kilka naraz.** Nad listą jest żółty blok, a pole «Napiszę sam» jest przy każdej wiadomości w kolejce. Zaznacz potrzebne i kliknij **«Napiszę sam — nie wysyłaj»**. Kontakt zapisze się na Ciebie, więc zdejmuj wiadomość menedżera tylko wtedy, gdy naprawdę piszesz sam.",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self). Kontakt jest Twój, a lead zostaje u tego, kto dodał wiadomość do kolejki. Odpowiedź klienta wklej do karty, w pole «Co odpisał klient» (punkt [napisz ręcznie](#prospect-manual)).",
          ],
        },
      },
      {
        id: "bot-edit",
        title: "«✏️ Изменить текст»: poprawić wiadomość w bocie",
        body: {
          manager: [
            "Wiadomość można poprawić prosto w Telegramie. Pod kartą firmy w [porcji dnia](#prospect-portion) i w [strumieniu](#prospect-stream) jest przycisk «✏️ Изменить текст».",
            "Kliknij go, a bot przyśle obecny tekst. Skopiuj go, popraw i wyślij **jako odpowiedź na wiadomość bota** (w Telegramie to «Ответить»). Osobnej wiadomości bot nie zrozumie. Przycisk działa dobę, potem kliknij go jeszcze raz.",
            "Bot sprawdzi tekst tak samo jak panel przed wysyłką: od 12 do 100 słów, bez powitania i słów technicznych. Jeśli wszystko gra, bot przyśle kartę z nowym tekstem. Jeśli nie, napisze, co poprawić.",
            "Dopóki klient nie odpowiedział na powitanie, wyjdzie już nowy tekst. Jeśli wiadomość jest już u klienta, bot poprawi ją tam, jak [«Popraw» w panelu](#prospect-edit-sent). Poprawiać możesz tylko swoje karty i wiadomości.",
          ],
          head: [
            "Wiadomość można poprawić prosto w Telegramie. Pod kartą firmy w [porcji dnia](#prospect-portion) i w [strumieniu](#prospect-stream) jest przycisk «✏️ Изменить текст».",
            "Kliknij go, a bot przyśle obecny tekst. Skopiuj go, popraw i wyślij **jako odpowiedź na wiadomość bota** (w Telegramie to «Ответить»). Osobnej wiadomości bot nie zrozumie. Przycisk działa dobę, potem kliknij go jeszcze raz.",
            "Bot sprawdzi tekst tak samo jak panel przed wysyłką: od 12 do 100 słów, bez powitania i słów technicznych. Jeśli wszystko gra, bot przyśle kartę z nowym tekstem. Jeśli nie, napisze, co poprawić.",
            "Dopóki klient nie odpowiedział na powitanie, wyjdzie już nowy tekst. Jeśli wiadomość jest już u klienta, bot poprawi ją tam, jak [«Popraw» w panelu](#prospect-edit-sent). Możesz poprawić każdą kartę i każdą wiadomość w kolejce, a kto co poprawił, widać w dzienniku.",
          ],
          admin: [
            "Wiadomość można poprawić prosto w Telegramie. Pod kartą firmy w [porcji dnia](#prospect-portion) jest przycisk «✏️ Изменить текст».",
            "Kliknij go, a bot przyśle obecny tekst. Skopiuj go, popraw i wyślij **jako odpowiedź na wiadomość bota** (w Telegramie to «Ответить»). Osobnej wiadomości bot nie zrozumie. Przycisk działa dobę, potem kliknij go jeszcze raz.",
            "Bot sprawdzi tekst tak samo jak panel przed wysyłką: od 12 do 100 słów, bez powitania i słów technicznych. Jeśli wszystko gra, bot przyśle kartę z nowym tekstem. Jeśli nie, napisze, co poprawić.",
            "Dopóki klient nie odpowiedział na powitanie, wyjdzie już nowy tekst. Jeśli wiadomość jest już u klienta, bot poprawi ją tam, jak [«Popraw» w panelu](#prospect-edit-sent). Możesz poprawić każdą kartę i każdą wiadomość w kolejce, a kto co poprawił, widać w dzienniku.",
          ],
        },
      },
      {
        id: "manual",
        title: "«Napisz ręcznie»: telefon bez Telegrama",
        body: [
          "«Napisz ręcznie» znaczy, że klienta nie znaleziono w Telegramie. Na przykład na stronie jest tylko numer stacjonarny albo link prowadzi do kanału. W Telegramie przyjdzie wiersz «только звонок или WhatsApp».",
          "W karcie są przyciski **«Otwórz WhatsApp z gotowym tekstem»**, **«Zadzwoń»** i **«Kopiuj tekst»**. Napisałeś albo zadzwoniłeś? Kliknij **«Skontaktowano samodzielnie»**.",
          "Klient odpisał w WhatsAppie? Wklej jego odpowiedź w pole «Co odpisał klient» i kliknij **«Zapisz odpowiedź»**. Bot napisze kolejną odpowiedź, możesz ją skopiować albo od razu otworzyć w WhatsAppie.",
          "Nie będziesz pisać? Kliknij «nie piszemy» i podaj powód.",
        ],
      },
      {
        id: "replies",
        title: "Klient odpisał: kto odpowiada",
        body: [
          "Gdy klient odpisuje na konto firmowe, odpowiada mu bot w imieniu studia. Czeka kilka minut, żeby nie wyglądać jak robot. Co bot pisze po powitaniu, opisuje punkt [kontakt w dwóch krokach](#prospect-hello).",
          "Bot woła Ciebie, gdy klient prosi o człowieka albo telefon. Albo gdy prosi o ofertę, kosztorys czy plik: wtedy wyślij je sam jeszcze dziś. Bot woła też, jeśli klient odpisał niejasno albo rozmowa się przeciąga.",
          "Klient zgodził się na makietę («+», «tak»)? Bot sam odpisze, że makietę przygotowujemy, i wyśle warunki. Autor kontaktu dostanie «🛠 Хотят прототип» z przyciskiem «🛠 Беру прототип». Przez pierwsze 30 minut makieta jest tylko Twoja, potem przycisk idzie do całego zespołu i makietę bierze ten, kto kliknie pierwszy.",
          "Kto wziął makietę, ten ją składa i wysyła klientowi link w ciągu 12 godzin. Przypomnienie 2 godziny przed terminem ustawi się samo.",
          "Gdy bot prowadzi rozmowę z Twojego kontaktu, na każdą odpowiedź klienta przychodzi «💬 Ваш лид ответил». Bot odpowie sam po 5 minutach. Chcesz odpowiedzieć sam, kliknij «✋ Отвечу сам».",
          "Rozmowę możesz zabrać botowi w każdej chwili przyciskiem **«Odpowiadam osobiście»** w karcie leada. Potem bot milczy, a nowe wiadomości klienta przychodzą do Ciebie na Telegram.",
          "Odpisać można prosto z karty leada, pod «Oś zdarzeń». W polu «Dokąd» wybierz konto, z którego pisano do klienta, i kliknij **«Wyślij»**. Linki do naszych makiet i case’ów panel sprawdza: jeśli link się nie otworzy, wiadomość nie wyjdzie.",
          "Odmowę («nie interesuje mnie», «nie, dziękuję») bot zamyka sam i Cię nie woła. Od 21:00 do 08:00 bot nie odpowiada klientom. To, co klienci napisali w nocy, przyjdzie do Ciebie o 08:00 jedną wiadomością.",
        ],
      },
      {
        id: "close",
        title: "«Klient odmówił» i «Ignoruje»: kontakt zamknięty",
        body: [
          "Jeśli wiadomo, że rozmowy nie będzie, zamknij kontakt. **«🙅 Klient odmówił»** klikasz, gdy klient odmówił słowami albo przez telefon. **«🔇 Ignoruje»** klikasz, gdy milczy albo nie odbiera.",
          "Przyciski są w karcie wysłanej strony i w Telegramie pod kartą firmy (w Telegramie są po rosyjsku: «🙅 Клиент отказался» i «🔇 Игнорирует»). Wyraźną odmowę w rozmowie bot zamyka sam, wtedy nic nie trzeba klikać.",
          "Po zamknięciu bot już nie pisze do klienta i mu nie odpowiada. Lead dostaje status «przegrany», przypomnienia do niego znikają. Kontakt nadal się liczy: przecież do klienta napisano.",
          "Zamknąć można dopiero po kontakcie: jeśli wiadomość jest jeszcze w kolejce, poczekaj na wysyłkę. Jeśli klient później sam napisze, bot zawoła tego, kto prowadził kontakt. Wtedy przywróć leadowi status «w toku».",
        ],
      },
      {
        id: "followups",
        title: "Przypomnienia: gdy klient milczy",
        body: [
          "Klient nie odpowiedział na powitanie? Bot nic więcej do niego nie pisze. Kolejne wiadomości od nieznajomego kończą się zgłoszeniami spamu, a Telegram ogranicza konto.",
          "Jest jeden wyjątek. Jeśli klient napisał «przekażę szefowi» i zamilkł, po 2 dniach bot może raz zapytać, czy szef zdążył już zobaczyć. Dzieje się to tylko w dni robocze od 10:00 do 18:00.",
          "Po «Skontaktowano samodzielnie» i przy kontakcie ręcznym przypomnieć się możesz tylko Ty. Po «Klient odmówił» i «Ignoruje» bot do klienta w ogóle nie pisze.",
        ],
      },
      {
        id: "numbers",
        title: "Jak czytać liczby na karcie",
        body: [
          "**«wyszukiwarka 84»** pokazuje, jak łatwo znaleźć stronę w Google i Yandeksie, od 0 do 100. 80 i więcej to dobrze, poniżej 50 źle, do 10 strona jest zamknięta dla wyszukiwarek.",
          "**«−24…48»** to nasza ocena: ile zapytań na sto ginie przez znalezione problemy. Na przykład nie ma cen albo telefonu nie da się kliknąć. To nie statystyka klienta, tak mu właśnie mów.",
          "**Ostatnia liczba** to ogólna ocena strony. Za każdy problem odejmowane są punkty. Poniżej 60 liczba jest żółta, a 0 znaczy, że strona się nie otworzyła.",
          "Ramki przy znaleziskach: czerwona to błąd krytyczny, złota poważny, szara drobiazg. Zaczynaj rozmowę od znaleziska o klientach i pieniądzach.",
          "Statusy karty: «bez kontaktu», «wiadomość gotowa», «w kolejce do wysłania», «wysłano», «napisz ręcznie», «nie wysłano», «pominięto». «nie wysłano» znaczy, że bot nie dostarczył wiadomości, otwórz kartę. Ta sama ściągawka jest nad listą, w bloku «Jak czytać liczby».",
        ],
      },
      {
        id: "own-list",
        title: "Sprawdzić własną listę stron",
        body: [
          "Własną listę stron sprawdzisz w bloku na górze. Wklej adresy po jednym w wierszu, obok można dopisać nazwę firmy. Kliknij **«Sprawdź»**, za jednym razem do 200 adresów.",
          "Strony ze znaleziskami od razu trafiają na wspólną listę. Strony bez problemów się nie zapisują: nie ma o czym pisać. Strona, która już jest na liście, drugi raz się nie doda.",
          "Firmy bez strony: zaznacz «Firma nie ma strony», wpisz branżę i nazwy po jednej w wierszu. Kliknij «Dodaj». Wiadomość do nich pisze się według branży.",
          "«Język wiadomości» zmienia tylko szkic w tabeli. Wiadomość ze «Skontaktuj się» pisze się w języku strony.",
        ],
      },
      {
        id: "skip",
        title: "«nie piszemy» i «✖ Не подходит»",
        body: [
          "Nie do każdego warto pisać. Na przykład strona jest państwowa, firma się zamknęła albo to Twój znajomy. Kliknij «nie piszemy» i krótko wyjaśnij dlaczego. Karta zmieni się na «pominięto» i nikt jej więcej nie dostanie.",
          "W Telegramie to samo robi przycisk «✖ Не подходит» w porcji dnia. Taka firma nie liczy się jako niewykonana, zamiast niej od razu przyjdzie inna.",
        ],
      },
      {
        id: "maps",
        title: "Autowyszukiwanie firm na mapach",
        roles: ["head", "admin"],
        body: {
          head: [
            "Autowyszukiwanie samo znajduje firmy w mapach Google. Ty albo właściciel zakładacie kampanię: branża i miasto, na przykład «stomatologia» i «Taszkent». Potem kliknij «Szukaj».",
            "Codziennie o 06:00 system szuka nowych firm i sprawdza ich strony. Do puli (wspólnej listy firm do kontaktów) trafiają te, o których jest co napisać, i firmy bez strony, ale z telefonem. Tej samej branży w tym samym mieście nie da się założyć drugi raz.",
            "W wierszu kampanii widać «znaleziono N · w puli M». Napis «wyniki wyczerpane» znaczy, że nowych firm nie ma i czas założyć inną branżę. Przyciski «szukaj teraz», «wstrzymaj» i «wznów» działają od razu.",
            "Dziennie najwyżej 25 zapytań, w każdym do 20 firm. Zapytania są płatne, więc zakładaj tylko branże potrzebne studiu. Jeśli blok pisze «Nie podłączono», powiedz właścicielowi.",
          ],
          admin: [
            "Autowyszukiwanie samo znajduje firmy w mapach Google. Ty albo kierownik zakładacie kampanię: branża i miasto, na przykład «stomatologia» i «Taszkent». Potem kliknij «Szukaj».",
            "Codziennie o 06:00 system szuka nowych firm i sprawdza ich strony. Do puli (wspólnej listy firm do kontaktów) trafiają te, o których jest co napisać, i firmy bez strony, ale z telefonem. Tej samej branży w tym samym mieście nie da się założyć drugi raz.",
            "W wierszu kampanii widać «znaleziono N · w puli M». Napis «wyniki wyczerpane» znaczy, że nowych firm nie ma i czas założyć inną branżę. Przyciski «szukaj teraz», «wstrzymaj» i «wznów» działają od razu.",
            "Dziennie najwyżej 25 zapytań, to około 750 miesięcznie: mieścimy się w darmowym tysiącu Google. Jeśli blok pisze «Nie podłączono», kroki podłączenia są pokazane w nim samym. Klucz leży w magazynie sekretów, panel bierze go stamtąd sam.",
          ],
        },
      },
    ],
  },
};
