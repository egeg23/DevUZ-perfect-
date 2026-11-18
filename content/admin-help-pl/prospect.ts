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
    what: "Zamówienia gotowych produktów ze sklepu na stronie — nie projekty klientów. Kupujący składa zamówienie ze swoimi danymi, my wystawiamy fakturę, on płaci przelewem i dostaje pliki. Wszyscy pracownicy widzą wszystkie zamówienia i mogą prowadzić każde z nich; kto kliknął ostatni, ten jest przy zamówieniu jako «prowadzi: …».",
    items: [
      {
        id: "flow",
        title: "Droga zamówienia",
        body: [
          "«nowe» → «faktura wystawiona» → «opłacone» → «przekazane». Albo «anulowane». Filtry na górze działają według tych statusów.",
          "Dane kontaktowe kupującego widać od razu: sam je zostawił, żeby wystawić mu fakturę. «bot połączony» obok kontaktu oznacza, że kupujący podłączył naszego bota i powiadomienia o fakturze i płatności przyjdą do niego właśnie tam.",
          "Jeśli zamówienie utknęło, w Telegramie przyjdzie przypomnienie: 2 dni bez faktury, faktura nieopłacona od 14 i 30 dni, opłacone, a nie ma pliku do wydania.",
        ],
      },
      {
        id: "invoice",
        title: "Kwota i faktura",
        body: [
          "Niektóre produkty mają cenę w widełkach i wtedy zamówienie przychodzi bez kwoty. Wpisz ją w pole «kwota, $» i kliknij **«ustaw»**. Po wystawieniu faktury kwoty nie da się już zmienić.",
          "**«wystaw fakturę»** — potrzebna jest kwota. Numer faktury nadaje się sam; ponowne kliknięcie go nie zmienia. Kupujący widzi fakturę na stronie swojego zamówienia (link dostał przy składaniu zamówienia), a jeśli bot jest połączony — dostaje też wiadomość. Linku do płatności w wiadomości celowo nie ma: płaci się na dane do przelewu z faktury.",
          "Jeśli na górze wisi «Dane bankowe nie są skonfigurowane» — faktura się wystawi, ale kupujący nie zobaczy, dokąd zapłacić. Powiedz o tym właścicielowi.",
        ],
      },
      {
        id: "paid",
        title: "Płatność i wydanie plików",
        body: [
          "Pieniądze wpłynęły na konto — wpisz **«pozycja z wyciągu»** (z wyciągu bankowego) i kliknij **«płatność otrzymana»**. Bez tej pozycji się nie da: inaczej za miesiąc nie udowodnisz, że płatność była.",
          "Od tej chwili kupujący ma dostęp do plików — o ile właściciel wgrał je w dziale «Wydania». Pobrań jest najwyżej 20 łącznie i 10 dziennie; ponowne pobranie tego samego pliku w ciągu 10 minut się nie liczy.",
          "Pierwsze pobranie samo ustawia «przekazane». Przycisk **«kod przekazany»** jest na wypadek, gdy przekazujesz produkt inaczej, na przykład przez dostęp do repozytorium. Przed płatnością nie zadziała: przekazanie kodu to jedyny krok, którego nie da się cofnąć.",
        ],
      },
      {
        id: "access",
        title: "Linki, dostęp i anulowanie",
        body: [
          "**«wygeneruj link ponownie»** — nowy link do strony zamówienia, stary przestaje działać. Nowy pokazuje się tylko raz — od razu wyślij go kupującemu.",
          "**«cofnij dostęp do plików»** całkiem zamyka pobieranie: wydane już linki przestają działać, a na stronie zamówienia zamiast przycisku kupujący widzi «Dostęp do plików jest zamknięty». Strona i faktura zostają — kupujący nie traci swoich dokumentów. W zamówieniu pojawia się «Dostęp: zamknięty od …». **«przywróć dostęp do plików»** znów otwiera pobieranie, ale stare linki pozostają martwe — dlatego jeśli link wyciekł, kliknij «cofnij dostęp do plików», a potem «przywróć dostęp do plików»: link, który wyciekł, wygaśnie, a kupujący pobierze pliki na nowo ze swojej strony.",
          "**«anuluj»** — kupujący dostanie powiadomienie. **«przywróć do realizacji»** odtwarza status według dat, a nie według Twojego wyboru: jeśli faktura była wystawiona — wróci «faktura wystawiona».",
        ],
      },
    ],
  },

  /* ── Поиск ────────────────────────────────────────────────────────── */
  "/admin/tenders": {
    what: "Skaut czyta platformy zamówień w Uzbekistanie i zostawia tylko to, co robi studio: strona, aplikacja, bot, AI, CRM, platforma, system informacyjny. Każdy taki lot trafia do bota jako lead, a tutaj jest ich lista z terminem składania ofert, kontaktem zamawiającego i przyciskami. Sekcja jest otwarta dla wszystkich pracowników.",
    items: [
      {
        id: "how",
        title: "Jak skaut szuka przetargów",
        body: [
          "Co 30 minut skaut czyta otwarte listy lotów na platformach: etender.uzex.uz, xarid.uzex.uz, Hayot Birja (XT-Xarid) i Tender.asia. Tylko to, co platforma pokazuje każdemu odwiedzającemu bez logowania: skaut nie ma loginów ani podpisu elektronicznego i nie obchodzi captchy. Ten sam lot z platformy i z Tender.asia to jedna linijka: kontakt z Tender.asia dopisuje się do lotu platformy.",
          "Czy lot jest nasz, decyduje kod po nazwie, bez modelu: potrzebny jest temat (strona, aplikacja, bot, system informacyjny, CRM, automatyzacja, platforma, AI) i praca (opracowanie, stworzenie, rozbudowa, utrzymanie). Nawet w kategorii IT platformy lot bez tematu nie jest brany. Nigdy nie nasze: cyberbezpieczeństwo, antywirusy, 1C, licencje, serwery i chmura, monitoring wizyjny, systemy przeciwpożarowe, komputery i kartridże.",
          "Każdy nowy lot staje się leadem i idzie tą samą [kolejką leadów](#leads-queue), co zgłoszenie ze strony: w dzień — po kolei, w nocy — rano. W karcie w bocie jest platforma, termin, link do lotu, telefon, e-mail i osoba odpowiedzialna zamawiającego, jeśli platforma je pokazuje, oraz obowiązkowy warunek: «Перед подачей заявки — связаться с Егором или Александром и запросить цену». Ten sam lot trafia też linijką na kanał skauta, najwyżej osiem w jednym przejściu. Do uzbeckiej nazwy dochodzi krótkie zdanie po rosyjsku „czego chcą” (pisze je tani model, bez nowych liczb). Brak telefonu w karcie lotu — skaut znajduje go w innych zamówieniach tego samego zamawiającego po numerze NIP.",
          "Linijka «Ostatnie przejście» na górze pokazuje, kiedy skaut czytał platformy, ile lotów jest na każdej i ile z nich naszych. Platforma nie odpowiedziała — jest podświetlona, pozostałe czytają się normalnie.",
        ],
      },
      {
        id: "work",
        title: "Co zrobić z lotem",
        body: [
          "**Bez uzgodnionej ceny oferty nie składamy**: wziąłeś lead-przetarg — najpierw napisz do Jegora lub Aleksandra, jaki to lot i w jakim terminie, i uzyskaj cenę. Ten warunek stoi na górze sekcji, w karcie leada w bocie i w pierwszej linijce jego notatek. «Karta leada» przy locie prowadzi do leada, który z niego powstał.",
          "Otwórz lot przyciskiem «Otwórz lot» — tam jest specyfikacja, warunki i dokumenty. Pasuje — naciśnij **«Biorę»**: lot trafia do zakładki «Biorę» z Twoim imieniem i koledzy widzą, że ktoś już się nim zajmuje. Złożyłeś ofertę na platformie — **«Złożone»**. Nie pasuje — **«Nie nasze»**, lot znika z nowych.",
          "Nowe są ułożone według terminu: u którego przyjmowanie ofert kończy się wcześniej, ten wyżej. Zostały dwa dni lub mniej — termin jest podświetlony. Loty, w których przyjmowanie skończyło się ponad dobę temu, same znikają z «Nowe».",
          "Ofertę składa się na samej platformie, podpisem elektronicznym firmy — z panelu się jej nie złoży. Jak czytać specyfikację zamówienia IT — w analizach przetargów na stronie studia.",
        ],
      },
    ],
  },

  "/admin/scout": {
    what: "Robot-skaut całą dobę czyta otwarte czaty w Telegramie i znajduje ludzi, którzy właśnie teraz szukają programisty. Najmocniejsze znaleziska sam zamienia w leady, resztę wysyła na kanał «Devuz Scout». Tutaj widać, co znalazł i czy w ogóle działa.",
    items: [
      {
        id: "how",
        title: "Jak to działa",
        body: [
          "Skaut czyta czaty z konta firmowego studia. Każda wiadomość przechodzi przez filtr, a to, co zostanie, czyta AI i wystawia ocenę od 0 do 100 oraz kategorię.",
          "**Poniżej 20** — od razu «pominięte», nie zaśmieca listy. **Od 60** — trafia na kanał «Devuz Scout» w Telegramie. **Od 70** — mocny sygnał: po paru minutach sweep (proces na serwerze, który co kilka minut wykonuje zaplanowane zadania) zakłada z niego lead z gotową pierwszą wiadomością i puszcza go [kolejką leadów](#leads-queue). Kategoria «субподряд» (podwykonawstwo) trafia na kanał przy każdej ocenie.",
          "Codziennie rano po 09:00 na ten sam kanał przychodzi podsumowanie «☀️ Скаут за сутки»: czy robot działa i co znalazł.",
        ],
      },
      {
        id: "strong",
        title: "Mocny sygnał (70+) — nie pisz samodzielnie",
        body: [
          "Na kanale ostatni wiersz takiego sygnału brzmi: «Сильный сигнал: через пару минут он уйдёт менеджерам очередью лидов с готовым ответом — сами не пишите» (za parę minut trafi do menedżerów kolejką leadów z gotową odpowiedzią — nie piszcie sami). To ważne: jeśli do człowieka napiszą dwie osoby, wyglądamy jak spam.",
          "Lead trafi do tego, czyja jest kolej. W jego notatkach jest już napisane, co robić: takie posty żyją kilka godzin, więc pisać w prywatnej wiadomości trzeba teraz. Jeśli autor nie ma username — odpowiedzieć można tylko na samym czacie.",
        ],
      },
      {
        id: "signals",
        title: "Zwykły sygnał — co robić",
        body: [
          "Sygnałów poniżej 70 nikt poza Tobą nie obsłuży. Pasuje — odpowiedz szybko, ręcznie i ze swojego konta: na tym samym czacie albo w prywatnej wiadomości do autora. Serwis nie pisze na czatach ani słowa.",
          "Potem zaznacz na karcie sygnału: **«odpowiedziano»** albo **«pominięte»**. «przyszedł sam» ustawia się automatycznie — gdy człowiek napisał do naszego bota albo sygnał stał się leadem.",
          "Kafelki: «sygnałów» — łącznie, «nieotwarte» — czekają na decyzję, «przyszli sami», «docierają do nas» — jaka część obsłużonych sygnałów dotarła do nas. Sygnał jest przechowywany 90 dni, chyba że stał się częścią leada.",
        ],
      },
      {
        id: "groups",
        title: "Grupy dla skauta — dodaj własną",
        body: [
          "Blok «Grupy dla skauta» — grupy i kanały w Telegramie, które skaut czyta poza podstawowymi. Dodać może każdy: wklej w pole «Adres grupy lub link z zaproszeniem» adres w rodzaju @group, t.me/group albo link t.me/+…, opcjonalnie notatkę (kraj, o czym jest grupa), i naciśnij «Dodaj grupę». Bota i konta prywatnego skaut nie czyta — pole tego nie przyjmie. Jedna grupa trafia na listę tylko raz.",
          "Potem skaut sam dołącza do grupy z konta firmowego: nie więcej niż 10 prób dziennie, między próbami godzina-dwie i tylko od 08:00 do 22:00 czasu Taszkentu. Tak dołącza żywy człowiek, a częste dołączanie to dla Telegrama powód, by ograniczyć konto, z którego piszemy też z klientami. Grupy idą w kolejności dodania. Pod formularzem widać, ile było prób dzisiaj, ile grup czeka i kiedy następne dołączenie; jeśli Telegram poprosił o przerwę albo ograniczył konto firmowe — dołączania nie ma, a do kiedy, też jest tam napisane.",
          "Stan grupy: «czeka na dołączenie»; «czytamy» — z dopiskiem «dołączył skaut» albo «dołączono ręcznie» (dołączyłeś z konta skauta sam — on to zauważy); «prośba u admina» — grupa zamknięta, czekamy na zatwierdzenie; «nie da się dołączyć» — adresu nie ma, link wygasł, konto ma bana w grupie albo grupa każe przejść weryfikację bota, wtedy dołączyć można tylko ręcznie. Powód od Telegrama widać pod stanem. Nową grupę skaut czyta od razu po dołączeniu, bez restartu.",
          "«Usuń» — przy grupach, które dodałeś Ty; kierownik i właściciel usuwają dowolne. Do usuniętej grupy skaut nie dołącza i przestaje ją czytać po najbliższym restarcie; kto dodał i kto usunął, zostaje zapisane w dzienniku działań.",
        ],
      },
      {
        id: "health",
        title: "Czy skaut działa",
        body: {
          manager: [
            "Złoty pasek na górze — coś jest nie tak: skaut milczy, nie czyta żadnego czatu albo AI jest niedostępne. Pasek «Konto czyta 12 z 29 zadanych czatów» — część czatów na razie nie jest czytana: do grup z [«Grupy dla skauta»](#scout-groups) skaut dołączy sam, po jednej co godzinę-dwie. Skaut milczy, AI jest niedostępne albo pasek nie znika przez kilka dni — powiedz właścicielowi: z panelu tego się nie naprawi.",
          ],
          head: [
            "Złoty pasek na górze — awaria: «Skaut milczy od N min» (proces zatrzymany), «nie czyta żadnego czatu» albo «Model jest niedostępny». «Konto czyta X z Y zadanych czatów» z listą «Nieczytane:» — konto firmowe jeszcze nie dołączyło do tych czatów. Do grup z [«Grupy dla skauta»](#scout-groups) dołączy samo, po jednej co godzinę-dwie; awarie i czaty zadane na serwerze naprawia właściciel.",
          ],
          admin: [
            "«Skaut milczy od N min» — proces na serwerze padł albo został zatrzymany: `systemctl status devuz-scout`. «Model jest niedostępny» — problem z kluczem albo ze środkami na nim.",
            "«Konto czyta X z Y zadanych czatów» i lista «Nieczytane:» — konto firmowe nie dołączyło do tych czatów albo adres się nie otworzył. Do grup z [«Grupy dla skauta»](#scout-groups) dołącza samo, nie więcej niż 10 dziennie; do czatów z SCOUT_CHATS na serwerze — ręcznie z konta firmowego.",
            "«Mechanizm jest sprawny: … Zapytań o development jeszcze nie było» — to cisza na czatach, a nie awaria.",
          ],
        },
      },
    ],
  },

  "/admin/markets": {
    what: "Gdzie szukać klientów poza Uzbekistanem: w każdym kraju — giełdy freelance, katalogi agencji, tablice ogłoszeń, przetargi, mapy i czaty w Telegramie, z linkami i tym, jak pracować na każdej platformie. Studio wchodzi do WNP i USA, a ten dział to ściąga, od czego zacząć w każdym kraju.",
    items: [
      {
        id: "start",
        title: "Jak wybrać kraj",
        body: [
          "Dział «Rynki» otwiera się z menu: w nowym menu — «Więcej» → «Rynki», w menu w jednym wierszu — przyciskiem «Rynki»; to także zakładka działu [«Zimne kontakty»](/admin/prospect). Wyszukiwarka (Ctrl+K) znajdzie go też po słowach «kraje», «platformy». Na pierwszej stronie są karty krajów: flaga, nazwa, etykieta, jak tam szuka się wykonawcy i ile zebrano platform. Kliknij kartę — otworzy się strona kraju.",
          "Etykieta mówi, dokąd studio idzie w pierwszej kolejności: «rynek główny» (Rosja, Kazachstan, USA) — tu główne siły; «próbujemy» — szukamy, ale mniej; «przy okazji» — wchodzimy, gdy jest powód. Uzbekistan też jest na liście — z etykietą «przy okazji».",
          "Linki sprawdzone 06.11.2026. Część stron (Upwork, Clutch, Avito, OLX) nie wpuszcza robotów, człowiekowi się otwierają. Platforma się zamknęła albo przeniosła — powiedz kierownikowi: lista jest w kodzie i zostanie poprawiona.",
        ],
      },
      {
        id: "country",
        title: "Strona kraju i przycisk «Do skauta»",
        body: [
          "Na górze — jak w tym kraju szuka się wykonawcy, w jakim języku pisać i różnica czasu z Taszkentem. Niżej — «Od czego zacząć»: trzy-cztery kroki, od których warto zacząć. Na górze jest przełącznik krajów, żeby nie wracać do listy.",
          "Dalej platformy według rodzaju: giełdy freelance, katalogi i rankingi agencji, tablice ogłoszeń, przetargi, mapy i katalogi firm, czaty w Telegramie, społeczności. Przy każdej — link, co to za platforma, jak na niej szukać klientów i ile kosztuje: «bezpłatnie», «częściowo płatne» (zamieszczenie za darmo, odpowiedzi albo promocja — płatne) albo «płatne». Rejestrować się na płatnych platformach i płacić — tylko po uzgodnieniu z kierownikiem.",
          "Przy czatach w Telegramie jest przycisk «Do skauta»: grupa trafia do «Grupy dla skauta» na stronie [«Sygnały skauta»](/admin/scout), a skaut sam do niej dołączy, gdy przyjdzie kolej — nie więcej niż 10 grup dziennie. Sygnały z niej przyjdą jak zwykle. Jeśli grupa jest już u skauta, strona to powie.",
        ],
      },
      {
        id: "tour",
        title: "Szkolenie na ekranie",
        body: {
          manager: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu to krótkie szkolenie z ośmiu kroków: gdzie jest dział, jak wybrać kraj, co jest na stronie kraju (na przykład Rosja), platforma i przycisk «Do skauta». Potrzebne miejsce jest podświetlone, reszta przyciemniona, a między stronami szkolenie przechodzi samo. «Pomiń» albo Esc — zamknąć.",
            "Tobie pokazuje się samo raz — zaraz po poznaniu nowego panelu. Obejrzeć ponownie — tym samym przyciskiem albo w [«Ustawienia»](/admin/settings).",
          ],
          head: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu to krótkie szkolenie z ośmiu kroków: gdzie jest dział, jak wybrać kraj, co jest na stronie kraju (na przykład Rosja), platforma i przycisk «Do skauta». Potrzebne miejsce jest podświetlone, reszta przyciemniona, a między stronami szkolenie przechodzi samo. «Pomiń» albo Esc — zamknąć.",
            "Menedżerom pokazuje się samo raz — zaraz po poznaniu nowego panelu; tobie — tylko przyciskiem, tutaj albo w [«Ustawienia»](/admin/settings).",
          ],
          admin: [
            "Przycisk **«Pokaż na ekranie, jak korzystać z „Rynków”»** na górze działu to krótkie szkolenie z ośmiu kroków: gdzie jest dział, jak wybrać kraj, co jest na stronie kraju (na przykład Rosja), platforma i przycisk «Do skauta». Potrzebne miejsce jest podświetlone, reszta przyciemniona, a między stronami szkolenie przechodzi samo. «Pomiń» albo Esc — zamknąć.",
            "Menedżerom pokazuje się samo raz — zaraz po poznaniu nowego panelu; tobie — tylko przyciskiem, tutaj albo w [«Ustawienia»](/admin/settings).",
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
            "W poniedziałki o 10:00 przychodzi «📅 Сотрудники за неделю». Są tam dla każdego kontakty, odpowiedzi, makiety, pokazy, czas w panelu i leady bez ruchu. Menedżerowie tych raportów nie dostają.",
            "Firmy do puli przynosi [automatyczne wyszukiwanie na mapach](#prospect-maps). Pusta pula to puste porcje.",
          ],
          admin: [
            "Nie dostajesz porcji. W dni robocze o 07:00 firmy z puli są dzielone po równo między menedżerów i kierowników. Wielkość to tygodniowy plan podzielony przez 5 (od 2 do 15), bez planu 5. Najpierw idą strony z najgorszą oceną.",
            "Do 09:00 porcja trafia do ludzi w Telegramie, najpóźniej o 10:00. Za «✖ Не подходит» człowiek od razu dostaje inną firmę, do dwóch porcji zamian dziennie.",
            "O 12:00 bot przypomina o porcji tym, którzy nic nie zrobili. O 15:00 Ty i kierownik dostajecie «🔕 К 15:00 молчат: …». Osób z planem 0 albo bez zaznaczonego «Nowe zgłoszenia z kolejki» bot nie rusza. Tak w «Zespół» oznacza się urlop.",
            "O 18:00 niezrobione wraca do puli i dostajesz «📋 Сотрудники за день». W poniedziałki o 10:00 przychodzi «📅 Сотрудники за неделю». Oba raporty program liczy z liczb, menedżerowie ich nie dostają.",
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
            "Liczą się firmy, do których napisałeś od poniedziałku: kliknąłeś «Wyślij do @adres» albo «Skontaktowano samodzielnie». Jedna firma to jeden kontakt. «Skontaktuj się» to jeszcze nie kontakt, tylko przygotowanie wiadomości. Wiadomość, która nie wyszła, też się nie liczy.",
          ],
          head: [
            "Plan swoim menedżerom ustawiasz w [«Zespół»](/admin/team), kolumna «Plan kontaktów». Puste pole to «bez planu», wtedy porcja to 5 dziennie. Zero znaczy, że porcji nie będzie wcale. Twój własny plan ustawia właściciel.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do @adres» albo «Skontaktowano samodzielnie». Wiadomość, która nie wyszła, się nie liczy.",
          ],
          admin: [
            "Plan ustawia się w [«Zespół»](/admin/team), kolumna «Plan kontaktów». Ty ustawiasz go komu chcesz, kierownik tylko swoim ludziom. Puste pole to «bez planu», wtedy porcja to 5 dziennie. Zero znaczy brak porcji.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do @adres» albo «Skontaktowano samodzielnie». Wiadomość, która nie wyszła, się nie liczy.",
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
          "Klient odpisał po rosyjsku. Po dwóch minutach bot wyśle mu wideo w kółku: obejrzeliśmy stronę i znaleźliśmy kilka błędów. Odpisał po uzbecku, pójdzie kółko po uzbecku. Odpisał w innym języku, po trzech minutach pójdzie wiadomość w jego języku.",
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
          "Od razu widać nie wszystkie przeanalizowane strony, tylko te, nad którymi się pracuje: z gotowym tekstem («tekst gotowy»), w kolejce do wysłania, «napisz ręcznie», wysłane w ostatnich 7 dniach (poza zamkniętymi jako «klient odmówił» i «ignoruje»), Twoja [porcja dnia](#prospect-portion) i karta, do której właśnie wracasz. Z pozostałych — nieruszonych, pominiętych i wysłanych ponad tydzień temu — pierwsze 20, najnowsze na górze.",
          "Pod listą jest **«Pokaż jeszcze 20»**: strona otworzy się od razu na pierwszej z dodanych kart; klikaj tyle razy, ile trzeba. Dlaczego tak: wcześniej strona rysowała wszystkie 200 kart naraz — około 2 MB — i na słabszych komputerach zamierała na kilka sekund przy każdym otwarciu i po każdym «Skontaktuj się»; przeglądarka pokazywała wtedy komunikat, że strona nie odpowiada, a kopiowanie tekstu nie działało.",
        ],
      },
      {
        id: "queue",
        title: "Kolejka konta firmowego: trzy wiadomości na godzinę, od 07:30 do 20:30",
        body: {
          manager: [
            "Pierwszą wiadomość do nowej firmy konto firmowe wysyła nie częściej niż trzy razy na godzinę, z przerwą 8–20 minut i tylko od 07:30 do 20:30 czasu taszkenckiego, codziennie: wiadomość dodana w nocy czeka w kolejce i wychodzi rano jako pierwsza. Korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Inaczej Telegram uzna nas za masową wysyłkę i ograniczy konto — a tym samym kontem skaut czyta czaty, więc stracilibyśmy oba kanały naraz.",
            "Nad listą: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3 · ostatnia wyjdzie dziś około 15:40». Przy karcie w kolejce widać, mniej więcej kiedy wyjdzie (szczegóły niżej). Kont roboczych może być kilka — każde ma swój limit trzech na godzinę, i wtedy druga liczba jest większa: tyle pierwszych wiadomości na godzinę wychodzi ze wszystkich razem. Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce; jeśli kierownik przypisał cię do określonych kont — tylko z nich: wtedy klient dostaje wiadomość z numeru, za którym stoisz ty. Odpowiedzi i poprawki — z tego, z którego wyszła pierwsza wiadomość.",
            "**Kiedy wyjdzie wiadomość.** Przy karcie w kolejce jest napisana godzina czasu taszkenckiego: «wyjdzie dziś około 14:20», «jutro około 08:10» i ile wiadomości jest przed nią. Liczy się ją tak samo, jak kolejkę obsługuje konto robocze: ile wiadomości stoi przed nią, ile każde konto wysłało już w ostatniej godzinie, przerwa między wiadomościami, okno 07:30–20:30 i z których kont tę wiadomość można wysłać. Godzina jest przybliżona, plus minus kwadrans: przerwa między wiadomościami za każdym razem jest losowa. Ale kolejność jest właściwa — wiadomość nie zginęła, czeka na swoją minutę. Nad listą — kiedy wyjdzie ostatnia wiadomość całej kolejki. Zaraz po «Wyślij do …» ta sama godzina pojawia się w zielonym pasku na górze, a w Telegramie — na przycisku pod kartą firmy po «📤 Отправить через бота»: «📤 В очереди · уйдёт сегодня около 14:20». Gdy wyjdzie, przy karcie pojawi się «wysłano» i godzina.",
            "**«Telegram ograniczył do …».** Jeśli Telegram ograniczył konto robocze, z którego może wyjść wiadomość (zwykle na dobę — za zbyt wiele pierwszych wiadomości do nieznajomych), wiadomość czeka już nie na kolejkę, tylko na samo konto. Przy karcie jest wtedy na żółto: «Konto firmowe, z którego może wyjść ta wiadomość, Telegram ograniczył do 08.10 13:07 czasu taszkenckiego — wcześniej nie wyjdzie», a godzina wysyłki — już po tej godzinie. W Telegramie po «📤 Отправить через бота» przyjdzie o tym osobna wiadomość. Nie musisz czekać — napisz do klienta sam i kliknij **«Skontaktowano samodzielnie»**. Jeśli jest napisane «Tej wiadomości nie weźmie teraz żadne konto firmowe» — jesteś przypisany tylko do wyłączonych kont: napisz sam i poproś kierownika, żeby dodał cię do działającego. Sprawdzanie odbywa się samo co godzinę: każde konto robocze pyta @SpamBot — usługę Telegrama, która odpowiada, czy konto jest ograniczone i do kiedy. Teraz to sprawdzanie jest wyłączone decyzją właściciela (od 03.11.2026): o ograniczeniu dowiadujemy się dopiero, gdy Telegram odmówi wysłania. Gdy znajdzie ograniczenie, bot pisze o tym do całego zespołu: które konto, do której godziny, ile wiadomości czeka i czyje; gdy ograniczenie zniknie — pisze «снова пишет».",
            "Nie musisz czekać: otwórz rozmowę ze swojego konta, wyślij ten sam tekst i kliknij **«Skontaktowano samodzielnie»** — bot nie wyśle już swojej kopii. Jeśli wiadomość wyszła z konta roboczego studia, bot sam zobaczy odpowiedź klienta i poprowadzi rozmowę dalej z tego samego konta; jeśli z prywatnego — odpowiedź przyjdzie do Ciebie osobiście.",
            "**Wiadomości właściciela idą poza kolejką**: nie czekają ani na cudze wiadomości, ani na limit trzech na godzinę, ani na przerwę 8–20 minut — wychodzą minutę po dowolnej poprzedniej wysyłce, ale też tylko od 07:30 do 20:30. Do limitu trzech na godzinę jednak się wliczają: limit dotyczy konta, więc po takiej wiadomości pozostali będą musieli poczekać. Na takiej karcie jest napisane «Wiadomość właściciela — poza kolejką».",
          ],
          head: [
            "Pierwszą wiadomość do nowej firmy konto firmowe wysyła nie częściej niż trzy razy na godzinę, z przerwą 8–20 minut i tylko od 07:30 do 20:30 czasu taszkenckiego, codziennie: wiadomość dodana w nocy czeka w kolejce i wychodzi rano jako pierwsza. Korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Inaczej Telegram uzna nas za masową wysyłkę i ograniczy konto — a tym samym kontem skaut czyta czaty, więc stracilibyśmy oba kanały naraz.",
            "Nad listą: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3 · ostatnia wyjdzie dziś około 15:40». Przy karcie w kolejce widać, mniej więcej kiedy wyjdzie (szczegóły niżej). Kont roboczych może być kilka — każde ma swój limit trzech na godzinę, i wtedy druga liczba jest większa: tyle pierwszych wiadomości na godzinę wychodzi ze wszystkich razem. Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce. Kto pisze z których kont, zaznaczasz ty albo właściciel w sekcji [Konta](/admin/accounts) — punkt [kto pracuje na koncie](#accounts-staff): przypisany menedżer pisze tylko ze swoich kont, nieprzypisany — z dowolnego. Twoje własne wiadomości idą według tych samych zasad. Odpowiedzi i poprawki — z tego konta, z którego wyszła pierwsza wiadomość.",
            "**Kiedy wyjdzie wiadomość.** Przy karcie w kolejce jest napisana godzina czasu taszkenckiego: «wyjdzie dziś około 14:20», «jutro około 08:10» i ile wiadomości jest przed nią. Liczy się ją tak samo, jak kolejkę obsługuje konto robocze: ile wiadomości stoi przed nią, ile każde konto wysłało już w ostatniej godzinie, przerwa między wiadomościami, okno 07:30–20:30 i z których kont tę wiadomość można wysłać. Godzina jest przybliżona, plus minus kwadrans: przerwa między wiadomościami za każdym razem jest losowa. Ale kolejność jest właściwa — wiadomość nie zginęła, czeka na swoją minutę. Nad listą — kiedy wyjdzie ostatnia wiadomość całej kolejki. Zaraz po «Wyślij do …» ta sama godzina pojawia się w zielonym pasku na górze, a w Telegramie — na przycisku pod kartą firmy po «📤 Отправить через бота»: «📤 В очереди · уйдёт сегодня около 14:20». Gdy wyjdzie, przy karcie pojawi się «wysłano» i godzina.",
            "**«Telegram ograniczył do …».** Jeśli Telegram ograniczył konto robocze, z którego może wyjść wiadomość (zwykle na dobę — za zbyt wiele pierwszych wiadomości do nieznajomych), wiadomość czeka już nie na kolejkę, tylko na samo konto. Przy karcie jest wtedy na żółto: «Konto firmowe, z którego może wyjść ta wiadomość, Telegram ograniczył do 08.10 13:07 czasu taszkenckiego — wcześniej nie wyjdzie», a godzina wysyłki — już po tej godzinie. W Telegramie po «📤 Отправить через бота» przyjdzie o tym osobna wiadomość. Nie musisz czekać — napisz do klienta sam i kliknij **«Skontaktowano samodzielnie»**. Jeśli jest napisane «Tej wiadomości nie weźmie teraz żadne konto firmowe» — autor jest przypisany tylko do wyłączonych kont. Żeby wiadomości menedżera nie czekały na ograniczone konto, przypisz go jeszcze do jednego, działającego, w sekcji [Konta](/admin/accounts) — punkt [kto pracuje na koncie](#accounts-staff): wiadomość wyjdzie z tego, na którym wcześniej zwolni się miejsce. Sprawdzanie odbywa się samo co godzinę: każde konto robocze pyta @SpamBot — usługę Telegrama, która odpowiada, czy konto jest ograniczone i do kiedy. Teraz to sprawdzanie jest wyłączone decyzją właściciela (od 03.11.2026): o ograniczeniu dowiadujemy się dopiero, gdy Telegram odmówi wysłania. Gdy znajdzie ograniczenie, bot pisze o tym do całego zespołu: które konto, do której godziny, ile wiadomości czeka i czyje; gdy ograniczenie zniknie — pisze «снова пишет».",
            "Nie musisz czekać: otwórz rozmowę ze swojego konta, wyślij ten sam tekst i kliknij **«Skontaktowano samodzielnie»** — bot nie wyśle już swojej kopii. Jeśli wiadomość wyszła z konta roboczego studia, bot sam zobaczy odpowiedź klienta i poprowadzi rozmowę dalej z tego samego konta; jeśli z prywatnego — odpowiedź przyjdzie do Ciebie osobiście.",
            "**Wiadomości właściciela idą poza kolejką**: nie czekają ani na cudze wiadomości, ani na limit trzech na godzinę, ani na przerwę 8–20 minut — wychodzą minutę po dowolnej poprzedniej wysyłce, ale też tylko od 07:30 do 20:30. Do limitu trzech na godzinę jednak się wliczają: limit dotyczy konta, więc po takiej wiadomości pozostali będą musieli poczekać. Na takiej karcie jest napisane «Wiadomość właściciela — poza kolejką».",
          ],
          admin: [
            "Pierwszą wiadomość do nowej firmy konto firmowe wysyła nie częściej niż trzy razy na godzinę, z przerwą 8–20 minut i tylko od 07:30 do 20:30 czasu taszkenckiego, codziennie: wiadomość dodana w nocy czeka w kolejce i wychodzi rano jako pierwsza. Korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Inaczej Telegram uzna nas za masową wysyłkę i ograniczy konto — a tym samym kontem skaut czyta czaty, więc stracilibyśmy oba kanały naraz.",
            "Nad listą: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3 · ostatnia wyjdzie dziś około 15:40». Przy karcie w kolejce widać, mniej więcej kiedy wyjdzie (szczegóły niżej). Kont roboczych może być kilka — każde ma swój limit trzech na godzinę, i wtedy druga liczba jest większa: tyle pierwszych wiadomości na godzinę wychodzi ze wszystkich razem. Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce. Kto pisze z których kont, zaznaczasz ty albo kierownik w sekcji [Konta](/admin/accounts) — punkt [kto pracuje na koncie](#accounts-staff): przypisana osoba pisze tylko ze swoich kont, nieprzypisana — z dowolnego. Odpowiedzi i poprawki — z tego konta, z którego wyszła pierwsza wiadomość.",
            "**Kiedy wyjdzie wiadomość.** Przy karcie w kolejce jest napisana godzina czasu taszkenckiego: «wyjdzie dziś około 14:20», «jutro około 08:10» i ile wiadomości jest przed nią. Liczy się ją tak samo, jak kolejkę obsługuje konto robocze: ile wiadomości stoi przed nią, ile każde konto wysłało już w ostatniej godzinie, przerwa między wiadomościami, okno 07:30–20:30 i z których kont tę wiadomość można wysłać. Godzina jest przybliżona, plus minus kwadrans: przerwa między wiadomościami za każdym razem jest losowa. Ale kolejność jest właściwa — wiadomość nie zginęła, czeka na swoją minutę. Nad listą — kiedy wyjdzie ostatnia wiadomość całej kolejki. Zaraz po «Wyślij do …» ta sama godzina pojawia się w zielonym pasku na górze, a w Telegramie — na przycisku pod kartą firmy po «📤 Отправить через бота»: «📤 В очереди · уйдёт сегодня около 14:20». Gdy wyjdzie, przy karcie pojawi się «wysłano» i godzina.",
            "**«Telegram ograniczył do …».** Jeśli Telegram ograniczył konto robocze, z którego może wyjść wiadomość (zwykle na dobę — za zbyt wiele pierwszych wiadomości do nieznajomych), wiadomość czeka już nie na kolejkę, tylko na samo konto. Przy karcie jest wtedy na żółto: «Konto firmowe, z którego może wyjść ta wiadomość, Telegram ograniczył do 08.10 13:07 czasu taszkenckiego — wcześniej nie wyjdzie», a godzina wysyłki — już po tej godzinie. W Telegramie po «📤 Отправить через бота» przyjdzie o tym osobna wiadomość. Nie musisz czekać — napisz do klienta sam i kliknij **«Skontaktowano samodzielnie»**. Jeśli jest napisane «Tej wiadomości nie weźmie teraz żadne konto firmowe» — autor jest przypisany tylko do wyłączonych kont. Żeby wiadomości menedżera nie czekały na ograniczone konto, przypisz go jeszcze do jednego, działającego, w sekcji [Konta](/admin/accounts) — punkt [kto pracuje na koncie](#accounts-staff): wiadomość wyjdzie z tego, na którym wcześniej zwolni się miejsce. Sprawdzanie odbywa się samo co godzinę: każde konto robocze pyta @SpamBot — usługę Telegrama, która odpowiada, czy konto jest ograniczone i do kiedy. Teraz to sprawdzanie jest wyłączone decyzją właściciela (od 03.11.2026): o ograniczeniu dowiadujemy się dopiero, gdy Telegram odmówi wysłania. Gdy znajdzie ograniczenie, bot pisze o tym do całego zespołu: które konto, do której godziny, ile wiadomości czeka i czyje; gdy ograniczenie zniknie — pisze «снова пишет».",
            "Nie musisz czekać: otwórz rozmowę ze swojego konta, wyślij ten sam tekst i kliknij **«Skontaktowano samodzielnie»** — bot nie wyśle już swojej kopii. Jeśli wiadomość wyszła z konta roboczego studia, bot sam zobaczy odpowiedź klienta i poprowadzi rozmowę dalej z tego samego konta; jeśli z prywatnego — odpowiedź przyjdzie do Ciebie osobiście.",
            "**Twoje wiadomości idą poza kolejką**: nie czekają ani na wiadomości zespołu, ani na limit trzech na godzinę, ani na przerwę 8–20 minut — wychodzą minutę po dowolnej poprzedniej wysyłce, ale też tylko od 07:30 do 20:30. Do limitu trzech na godzinę jednak się wliczają: limit dotyczy konta, więc po twojej wiadomości zespół będzie musiał poczekać. Na takiej karcie jest napisane «Wiadomość właściciela — poza kolejką».",
          ],
        },
      },
      {
        id: "self",
        title: "«Skontaktowano samodzielnie» (w Telegramie — «✋ Написал сам»)",
        body: [
          "Klikaj, gdy piszesz albo dzwonisz samodzielnie — ze swojego konta, na WhatsAppie, przez telefon. W polu krótko: czym i jak („własny Telegram”, „telefon”).",
          "Co się dzieje: kontakt liczy się Tobie, lead zakłada się na Ciebie, karta dostaje status «wysłano», a drugi kolega nie napisze już do tego samego człowieka. Bez tego oznaczenia nic z tego się nie dzieje: dla panelu nikt do nikogo nie napisał.",
          "Dalej wszystko zależy od tego, skąd wyszła wiadomość. **Z konta roboczego studia** (tego, na którym pracujesz w Telegramie na swoim telefonie): gdy tylko klient odpowie, bot rozpozna go po @adresie albo numerze z karty, przeniesie rozmowę na to konto i poprowadzi ją dalej stamtąd — jak zwykły kontakt, a do Ciebie przyjdzie wiadomość «Клиент ответил на рабочий аккаунт студии…». Bot rozpozna klienta tylko wtedy, gdy adres albo numer z karty zgadza się z jego Telegramem: jeśli wiadomość poszła na numer, dodaj go do kontaktów konta roboczego — wtedy Telegram go pokaże. Przejęcie rozmowy — «Odpowiadam osobiście» w karcie leada. **Z prywatnego konta, przez WhatsApp albo telefonicznie** korespondencja idzie przez Ciebie: bot nie wysyła follow-upów i nie widzi odpowiedzi. Odpowiedź klienta możesz przenieść do karty — patrz punkt [napisz ręcznie](#prospect-manual).",
        ],
      },
      {
        id: "write-myself",
        title: "«Napiszę sam — nie wysyłaj»: zdjąć wiadomości z kolejki bota",
        body: {
          manager: [
            "**W Telegramie — pod kartą firmy.** Po «📤 Отправить через бота», dopóki wiadomość czeka w kolejce, pod kartą jest przycisk «✋ Напишу сам — не отправлять». Kliknąłeś — bot tej wiadomości już nie wyśle, na przycisku pojawi się «✋ Снято с очереди · пишете сами», a niżej przyjdzie wiadomość: do kogo pisać, tekst wiadomości (kliknij go — skopiuje się) i przycisk, który otwiera rozmowę w Telegramie albo na WhatsAppie z gotowym tekstem. Przycisk działa też następnego dnia: wiadomość, która czeka na ograniczone konto, można zdjąć w każdej chwili, dopóki nie wyszła. Za późno i bot zdążył wysłać — przycisk powie «📤 Бот уже отправил это письмо»: drugi raz pisać nie trzeba.",
            "**W panelu — kilka naraz.** W «Zimnych kontaktach» nad listą pojawia się żółty blok z przyciskami «Napiszę sam — nie wysyłaj» i «Zaznacz wszystkie», a przy każdej Twojej wiadomości w kolejce — pole «Napiszę sam». Zaznacz potrzebne i kliknij przycisk: bot nie wyśle żadnej z nich, a na górze pojawi się, ile zdjęto i ile bot zdążył wysłać wcześniej. Przydaje się, gdy Telegram ograniczył konto robocze i Twoje wiadomości czekają na nie do jutra (więcej — w punkcie [kolejka konta roboczego](#prospect-queue)). Przy cudzych wiadomościach pola nie ma: zdjąć je może autor, kierownik albo właściciel.",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self): karta dostaje status «wysłano», kontakt i lead są Twoje. Do klienta piszesz sam — ze swojego konta, na WhatsAppie albo dzwonisz. Odpowiedź przyjdzie do Ciebie: przenieś ją do karty — w pole «Co odpisał klient», a AI podpowie, co odpowiedzieć (punkt [pisanie ręczne](#prospect-manual)).",
          ],
          head: [
            "**W Telegramie — pod kartą firmy.** Po «📤 Отправить через бота», dopóki wiadomość czeka w kolejce, pod kartą jest przycisk «✋ Напишу сам — не отправлять». Kliknąłeś — bot tej wiadomości już nie wyśle, na przycisku pojawi się «✋ Снято с очереди · пишете сами», a niżej przyjdzie wiadomość: do kogo pisać, tekst wiadomości (kliknij go — skopiuje się) i przycisk, który otwiera rozmowę w Telegramie albo na WhatsAppie z gotowym tekstem. Przycisk działa też następnego dnia: wiadomość, która czeka na ograniczone konto, można zdjąć w każdej chwili, dopóki nie wyszła. Za późno i bot zdążył wysłać — przycisk powie «📤 Бот уже отправил это письмо»: drugi raz pisać nie trzeba.",
            "**W panelu — kilka naraz.** W «Zimnych kontaktach» nad listą pojawia się żółty blok z przyciskami «Napiszę sam — nie wysyłaj» i «Zaznacz wszystkie», a pole «Napiszę sam» jest przy każdej wiadomości w kolejce — Twojej, Twoich menedżerów i automatycznych kontaktów. Zaznacz potrzebne i kliknij przycisk: bot nie wyśle żadnej z nich, a na górze pojawi się, ile zdjęto i ile bot zdążył wysłać wcześniej. Kontakt zapisuje się na tego, kto kliknął — na tego, kto napisze do klienta. Dlatego wiadomość menedżera zdejmuj tylko wtedy, gdy piszesz sam; żeby jego wiadomości nie czekały na ograniczone konto, lepiej zaznacz go jeszcze na jednym, działającym koncie w sekcji [Konta](/admin/accounts).",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self): karta dostaje status «wysłano», kontakt jest Twój, a lead zostaje u tego, kto dodał wiadomość do kolejki (przy wiadomości automatycznych kontaktów lead jest Twój). Do klienta piszesz sam — ze swojego konta, na WhatsAppie albo dzwonisz. Odpowiedź przyjdzie do Ciebie: przenieś ją do karty — w pole «Co odpisał klient», a AI podpowie, co odpowiedzieć (punkt [pisanie ręczne](#prospect-manual)).",
          ],
          admin: [
            "**W Telegramie — pod kartą firmy.** Po «📤 Отправить через бота», dopóki wiadomość czeka w kolejce, pod kartą jest przycisk «✋ Напишу сам — не отправлять». Kliknąłeś — bot tej wiadomości już nie wyśle, na przycisku pojawi się «✋ Снято с очереди · пишете сами», a niżej przyjdzie wiadomość: do kogo pisać, tekst wiadomości (kliknij go — skopiuje się) i przycisk, który otwiera rozmowę w Telegramie albo na WhatsAppie z gotowym tekstem. Przycisk działa też następnego dnia: wiadomość, która czeka na ograniczone konto, można zdjąć w każdej chwili, dopóki nie wyszła. Za późno i bot zdążył wysłać — przycisk powie «📤 Бот уже отправил это письмо»: drugi raz pisać nie trzeba.",
            "**W panelu — kilka naraz.** W «Zimnych kontaktach» nad listą pojawia się żółty blok z przyciskami «Napiszę sam — nie wysyłaj» i «Zaznacz wszystkie», a pole «Napiszę sam» jest przy każdej wiadomości w kolejce — Twojej, menedżerów i automatycznych kontaktów. Zaznacz potrzebne i kliknij przycisk: bot nie wyśle żadnej z nich, a na górze pojawi się, ile zdjęto i ile bot zdążył wysłać wcześniej. Kontakt zapisuje się na tego, kto kliknął — na tego, kto napisze do klienta. Dlatego wiadomość menedżera zdejmuj tylko wtedy, gdy piszesz sam; żeby jego wiadomości nie czekały na ograniczone konto, lepiej zaznacz go jeszcze na jednym, działającym koncie w sekcji [Konta](/admin/accounts).",
            "Dalej wszystko jak po [«Skontaktowano samodzielnie»](#prospect-self): karta dostaje status «wysłano», kontakt jest Twój, a lead zostaje u tego, kto dodał wiadomość do kolejki (przy wiadomości automatycznych kontaktów lead jest Twój). Do klienta piszesz sam — ze swojego konta, na WhatsAppie albo dzwonisz. Odpowiedź przyjdzie do Ciebie: przenieś ją do karty — w pole «Co odpisał klient», a AI podpowie, co odpowiedzieć (punkt [pisanie ręczne](#prospect-manual)).",
          ],
        },
      },
      {
        id: "bot-edit",
        title: "«✏️ Изменить текст»: poprawić wiadomość prosto w bocie",
        body: {
          manager: [
            "Pod kartą firmy w Telegramie — w [porcji dnia](#prospect-portion) i w [strumieniu](#prospect-stream) — jest przycisk **«✏️ Изменить текст»**, gdy karta ma już tekst wiadomości. Kliknij — bot przyśle obecny tekst (kliknij go — skopiuje się) i otworzy odpowiedź na tę wiadomość. Popraw kopię i wyślij ją **jako odpowiedź na wiadomość bota** — nie osobną wiadomością: po odpowiedzi bot wie, do której karty jest tekst. Prośba działa dobę, potem kliknij przycisk jeszcze raz.",
            "Bot sprawdza tekst tak samo jak panel przed wysłaniem: wiadomość o stronie — według zasad [pierwszej wiadomości](#prospect-send) (od 12 do 100 słów, alfabetem łacińskim — do 130, bez powitania, bez słów technicznych i liczb spoza sprawdzenia strony), wiadomość do firmy bez strony — według jej zasad. Przeszło — tekst zapisuje się w karcie, a bot przysyła ją ponownie z tymi samymi przyciskami: «📤 Отправить через бота» wyśle już nowy tekst. Nie przeszło — bot wymieni, co poprawić, a karta zostanie bez zmian.",
            "Przycisk jest też po «📤 Отправить через бота», dopóki wiadomość czeka na odpowiedź klienta na «Здравствуйте»: poprawiona wyjdzie już nowa. Jeśli wiadomość jest już u klienta — bot poprawi ją z tego samego konta roboczego, jak [«Popraw» w panelu](#prospect-edit-sent). Samego «Здравствуйте» się nie poprawia.",
            "Poprawiać można swoją kartę — z dzisiejszej porcji albo strumienia — i swoją wiadomość w kolejce. Odpowiedzi na cudzą prośbę albo do karty, której wiadomość już wyszła lub jest zamknięta, bot uprzejmie nie przyjmie. Kto i co poprawił — w dzienniku.",
          ],
          head: [
            "Pod kartą firmy w Telegramie — w [porcji dnia](#prospect-portion) i w [strumieniu](#prospect-stream) — jest przycisk **«✏️ Изменить текст»**, gdy karta ma już tekst wiadomości. Kliknij — bot przyśle obecny tekst (kliknij go — skopiuje się) i otworzy odpowiedź na tę wiadomość. Popraw kopię i wyślij ją **jako odpowiedź na wiadomość bota** — nie osobną wiadomością: po odpowiedzi bot wie, do której karty jest tekst. Prośba działa dobę, potem kliknij przycisk jeszcze raz.",
            "Bot sprawdza tekst tak samo jak panel przed wysłaniem: wiadomość o stronie — według zasad [pierwszej wiadomości](#prospect-send) (od 12 do 100 słów, alfabetem łacińskim — do 130, bez powitania, bez słów technicznych i liczb spoza sprawdzenia strony), wiadomość do firmy bez strony — według jej zasad. Przeszło — tekst zapisuje się w karcie, a bot przysyła ją ponownie z tymi samymi przyciskami: «📤 Отправить через бота» wyśle już nowy tekst. Nie przeszło — bot wymieni, co poprawić, a karta zostanie bez zmian.",
            "Przycisk jest też po «📤 Отправить через бота», dopóki wiadomość czeka na odpowiedź klienta na «Здравствуйте»: poprawiona wyjdzie już nowa. Jeśli wiadomość jest już u klienta — bot poprawi ją z tego samego konta roboczego, jak [«Popraw» w panelu](#prospect-edit-sent). Samego «Здравствуйте» się nie poprawia.",
            "Poprawiać można każdą kartę i każdą wiadomość w kolejce — swoją, menedżerów i automatycznych kontaktów, tak jak zdjąć ją z kolejki. Odpowiedzi na cudzą prośbę albo do karty, której wiadomość już wyszła lub jest zamknięta, bot uprzejmie nie przyjmie. Kto i co poprawił — w dzienniku: poprzedni i nowy tekst są zapisane przy karcie.",
          ],
          admin: [
            "Pod kartą firmy w Telegramie — w [porcji dnia](#prospect-portion) i w strumieniu — jest przycisk **«✏️ Изменить текст»**, gdy karta ma już tekst wiadomości. Kliknij — bot przyśle obecny tekst (kliknij go — skopiuje się) i otworzy odpowiedź na tę wiadomość. Popraw kopię i wyślij ją **jako odpowiedź na wiadomość bota** — nie osobną wiadomością: po odpowiedzi bot wie, do której karty jest tekst. Prośba działa dobę, potem kliknij przycisk jeszcze raz.",
            "Bot sprawdza tekst tak samo jak panel przed wysłaniem: wiadomość o stronie — według zasad [pierwszej wiadomości](#prospect-send) (od 12 do 100 słów, alfabetem łacińskim — do 130, bez powitania, bez słów technicznych i liczb spoza sprawdzenia strony), wiadomość do firmy bez strony — według jej zasad. Przeszło — tekst zapisuje się w karcie, a bot przysyła ją ponownie z tymi samymi przyciskami: «📤 Отправить через бота» wyśle już nowy tekst. Nie przeszło — bot wymieni, co poprawić, a karta zostanie bez zmian.",
            "Przycisk jest też po «📤 Отправить через бота», dopóki wiadomość czeka na odpowiedź klienta na «Здравствуйте»: poprawiona wyjdzie już nowa. Jeśli wiadomość jest już u klienta — bot poprawi ją z tego samego konta roboczego, jak [«Popraw» w panelu](#prospect-edit-sent). Samego «Здравствуйте» się nie poprawia.",
            "Poprawiać można każdą kartę i każdą wiadomość w kolejce — swoją, menedżerów i automatycznych kontaktów, tak jak zdjąć ją z kolejki. Odpowiedzi na cudzą prośbę albo do karty, której wiadomość już wyszła lub jest zamknięta, bot uprzejmie nie przyjmie. Kto i co poprawił — w dzienniku: poprzedni i nowy tekst są zapisane przy karcie.",
          ],
        },
      },
      {
        id: "manual",
        title: "«Napisz ręcznie»: telefon bez Telegrama",
        body: [
          "Jeśli link do Telegrama na stronie prowadzi do kanału albo do bota, konto firmowe najpierw szuka człowieka po numerze komórkowym z tej samej strony — po numerze Telegram znajduje ludzi częściej niż po adresie. Jeśli nie znajdzie albo numer jest stacjonarny, karta dostaje status «napisz ręcznie», a na Telegram przychodzi «Кому: … — только звонок или WhatsApp» (tylko telefon albo WhatsApp).",
          "Przyciski: **«Otwórz WhatsApp z gotowym tekstem»**, **«Zadzwoń»**, **«Kopiuj tekst»**. Gdy napiszesz albo zadzwonisz — oznacz **«Skontaktowano samodzielnie»**.",
          "Klient odpisał na WhatsAppie — wklej jego odpowiedź w pole «Co odpisał klient» i kliknij **«Zapisz odpowiedź»**. AI napisze następną odpowiedź, która pojawi się na karcie z przyciskami «Kopiuj odpowiedź» i «Otwórz WhatsApp z odpowiedzią». Naszej własnej wiadomości nie da się tam wkleić — panel to zauważy.",
          "Nie będziesz pisać — «nie piszemy» z podaniem powodu.",
        ],
      },
      {
        id: "replies",
        title: "Klient odpisał: kto odpowiada",
        body: [
          "Na wiadomości konta firmowego odpowiada AI — po kilku minutach, nie od razu (natychmiastowa odpowiedź wygląda jak robot), w imieniu studia, w formie „my”. Każda jego odpowiedź kończy się jednym konkretnym krokiem; obiecywać, że coś prześle, ma zakazane.",
          "**Odmowy** („nie piszcie”, „nie jestem zainteresowany”, „nie, dziękuję”) AI nie omawia i Cię nie woła: od 23.10.2026 kontakt zamyka się sam jako „klient odmówił”, klient nie dostaje już nic, a odmowa liczy się na [Pulpicie](/admin/hq) w wierszu «odmów w 7 dni». AI **woła Ciebie**, jeśli klient: prosi o człowieka albo telefon; **prosi o przesłanie analizy, oferty, kosztorysu albo pliku** — wtedy wyślij to samodzielnie jeszcze tego samego dnia; **chce prototypu** («да, соберите», „prototip yig‘ib bering”) — wtedy autor kontaktu dostaje «🛠 Хотят прототип» z przyciskiem «🛠 Беру прототип»: **przez pierwsze 30 minut** prototyp jest tylko jego. Nie weźmie w pół godziny — **do całego zespołu** idzie «🔥 Нужен прототип — бери срочно» z tym samym przyciskiem (od 08:00 do 21:00; prośba w nocy — wyjdzie o 08:00): kto pierwszy kliknie, ten dostaje leada i korespondencję, u pozostałych przycisk gaśnie z imieniem tej osoby; zbudować prototyp ręcznie i wysłać klientowi link trzeba w 12 godzin, jak obiecaliśmy w wiadomości — przypomnienie 2 godziny przed terminem ustawia się samo; klient sam dostaje odpowiedź „przygotowujemy makietę” z linkiem do warunków udostępniania makiety (devuz.studio/ru/mockup-terms) — przyjmuje je, kontynuując korespondencję albo odbierając makietę, więc linku nie trzeba powtarzać; jeśli korespondencja nie idzie przez Telegram, ta odpowiedź czeka w karcie kontaktu — wyślij ją samodzielnie; odpowiedział krótko i niezrozumiale. A także — jeśli rozmowa trwa 12 wypowiedzi i się nie klei albo jego odpowiedź nie przeszła kontroli. Jeśli w wiadomości był już link do [prototypu z wyprzedzeniem](#prospect-proto-ahead), słowo „prototyp” w odpowiedzi znaczy „obejrzałem”: AI woła Ciebie z powodem «ответил про прототип, который ушёл в письме», a «Нужен прототип» do całego zespołu nie idzie. W nocy bot milczy (od 23.10.2026): AI odpowiada klientom tylko od 08:00 do 21:00 czasu taszkenckiego i tylko na wiadomości nie starsze niż doba, a to, co klienci napisali w nocy w Twoich kontaktach, przychodzi o 08:00 jednym podsumowaniem «🌙 Ночью ответили клиенты».",
          "Gdy zawoła, dostaniesz na Telegramie «Касание · сайт» z powodem, słowami klienta i linkiem do leada, a pod spodem przycisk «🙅 Клиент отказался»: klient powiedział „nie jestem zainteresowany” — kliknij, a kontakt się [zamknie](#prospect-close). Na karcie leada nad «Oś zdarzeń»: «odpowiada AI» albo «odpowiadasz Ty — powód». Przycisk **«Odpowiadam osobiście»** w każdej chwili zabiera rozmowę AI: od tej pory AI milczy, a każda nowa wiadomość klienta przychodzi do Ciebie na Telegram — «Клиент написал — отвечаете вы» (klient napisał — odpowiadasz Ty) z linkiem do leada. Przychodzi do tego, kto kliknął przycisk, nawet jeśli to kierownik albo właściciel. Lead i tak jest Twój. Jeśli lead przekazano albo wziął go ktoś inny z kolejki — rozmowa idzie razem z nim: wiadomości klienta, follow-upy i podpis AI należą teraz do nowego właściciela leada, a «Odpowiadam osobiście» poprzedniego zostaje zdjęte. Przy każdym «Ty» i «AI w naszym imieniu» w rozmowie widać, z którego konta wyszła wiadomość, a w Telegramie w «Касание · сайт» i w wiadomości o ciepłym leadzie jest wiersz «Аккаунт: …» (konto). Odpowiadaj klientowi tylko z tego konta: wiadomość z innego numeru to dla klienta obcy człowiek.",
          "**Klientowi można odpowiadać prosto z karty leada** — bez telefonu i przełączania kont. Pod «Oś zdarzeń» jest pole odpowiedzi: wybierz «Do klienta z konta «…»» i kliknij **«Wyślij»** (albo Ctrl+Enter). Wiadomość wychodzi z tego samego konta firmowego, z którego pisano do klienta — które to konto, widać pod polem. Bot wysyła ją w ciągu pół minuty, a do tego czasu pod nią widać «wysyłanie…»; jeśli nie wyszła — «nie wysłano» z powodem, a Ty dostaniesz wiadomość na Telegramie. Gdy tylko odpowiesz, AI milknie, a jego niewysłane odpowiedzi są zdejmowane: dalej rozmowa jest Twoja, jak po «Odpowiadam osobiście». Rozmowa na karcie odświeża się sama co 10 sekund, dopóki strona jest otwarta. Pola nie ma, jeśli pisałeś do klienta ze swojego telefonu, a on jeszcze nie odpisał na konto firmowe — wtedy odpowiadaj tam. Zdjęcia, głosówki i pliki na razie wychodzą tylko z Telegrama — przycisk «Otwórz korespondencję w Telegramie» pod rozmową.",
          "**Linki do naszych makiet i realizacji panel sprawdza przed wysłaniem** (od 25.10.2026). Adres witryny (cases.devuz.studio/…) musi zaczynać się od jej projektu, adres realizacji (devuz.studio/ru/cases/…) od projektu z działu «Realizacje» na stronie. Jeśli takiego nie ma, wiadomość nie wychodzi, a pod polem widać, który link się nie otworzy i, jeśli projekt da się rozpoznać, który jest poprawny: «cases.devuz.studio/enotmebel: takiej strony nie ma, poprawny link to devuz.studio/ru/cases/enotmebel». Tak 25.10.2026 YANGI KUN mebel dostał pustą stronę: Enotmebel to prototyp, na witrynie go nie ma. To samo sprawdzenie działa przy «Popraw» i «Napisz klientowi w bocie». Link do makiety najlepiej kopiować z [Makiet](/admin/mockups), a nie wpisywać ręcznie. Wiadomości, które piszesz prosto w Telegramie z telefonu, panel nie widzi i nie sprawdza.",
          "Gdy AI ustali zadanie, budżet i terminy, żegna się, a Ty dostajesz brief «Первичка по касанию · сайт». Dalej rozmowa jest Twoja.",
          "⚠️ Jeśli odpowiadasz osobiście, nowe zwykłe wiadomości klienta nie przychodzą do Ciebie na Telegram — zaglądaj do korespondencji samodzielnie.",
          "**«💬 Ваш лид ответил»** (od 22.10.2026): gdy AI prowadzi rozmowę z Twojego kontaktu, przy każdej odpowiedzi klienta bot przysyła Ci jego słowa i informację, że AI odpowie samo za 5 minut. Pasuje — niczego nie klikaj: AI odpowie, a Ty dołączysz, gdy będzie więcej informacji, bot sam napisze, gdy klient dojdzie do makiety albo rozmowa będzie potrzebna Tobie. Chcesz odpowiedzieć sam — kliknij **«✋ Отвечу сам»** w ciągu tych 5 minut: AI zamilknie, jego jeszcze niewysłana odpowiedź nie wyjdzie, a odpowiedzieć możesz w karcie leada. Kontakty autopilota przed makietą są niczyje, więc dla nich takiej wiadomości nie ma. Nie ma jej też przy odznaczonym «Odpowiedzi klientów na kontakty».",
        ],
      },
      {
        id: "close",
        title: "«🙅 Klient odmówił» i «🔇 Ignoruje»: kontakt zamknięty",
        body: [
          "Gdy jest jasne, że rozmowy nie będzie, zamknij kontakt. **«🙅 Klient odmówił»** (w Telegramie — «🙅 Клиент отказался») — odpowiedział „nie jestem zainteresowany”, „nie piszcie”, odmówił przez telefon. **«🔇 Ignoruje»** (w Telegramie — «🔇 Игнорирует») — przeczytał i milczy, nie odbiera telefonu. Przyciski są na karcie wysłanych stron w «Przeanalizowane strony» oraz w Telegramie — pod kartą firmy z porcji albo strumienia po «📤 Отправить через бота» i «✋ Написал сам». Pod wiadomością bota «Касание · сайт» o odpowiedzi klienta jest tylko «🙅 Клиент отказался». W panelu przyciski widzi ten, kto prowadzi kontakt, kierownik i właściciel. Wyraźną odmowę w rozmowie bot od 23.10.2026 zamyka sam — nie trzeba klikać przycisku i nikt nie dostaje o tym wiadomości; przycisk zostaje na odmowę przez telefon i to, czego bot nie zrozumiał.",
          "Co się dzieje po kliknięciu: bot nie wysyła już klientowi kolejnych wiadomości ([follow-up](#prospect-followups)), a wiadomość już wstawiona do kolejki nie wychodzi; AI przestaje odpowiadać; lead dla tej strony zamyka się ze statusem «przegrany», a przypomnienia do niego są zdejmowane. Na liście karta znika z tych w toku i jest oznaczona «klient odmówił» albo «ignoruje». Kto i kiedy zamknął — widać na karcie.",
          "Kontakt przy tym zostaje zrobiony — w [porcji dnia](#prospect-portion), w planie tygodnia i w limicie trzech na godzinę: do klienta naprawdę napisano. Zamknąć można tylko po kontakcie: jeśli wiadomość jest jeszcze «w kolejce do wysłania», bot odpowie, żeby oznaczyć to, gdy wiadomość wyjdzie; jeśli był telefon albo wiadomość z własnego konta — najpierw «Skontaktowano samodzielnie».",
          "Zamknięcia nie da się cofnąć przyciskiem i nie trzeba: jeśli klient potem sam napisze, bot zawoła tego, kto prowadził kontakt — «Клиент, которого отметили …, написал снова» (klient, którego oznaczono …, napisał ponownie). Otwórz lead z linku i jeśli rozmowa ruszyła, przywróć mu status «w toku».",
        ],
      },
      {
        id: "followups",
        title: "Follow-up: gdy klient milczy",
        body: [
          "Jeśli na wiadomość konta firmowego nikt nie odpowiedział, bot sam napisze drugą wiadomość po 3 dniach (inne znalezisko i pytanie, czy temat jest aktualny) i trzecią, ostatnią, po 7 dniach — grzecznie zamknie rozmowę. Dalej już nie piszemy.",
          "Tylko w dni robocze od 10:00 do 17:00 czasu taszkenckiego: wiadomość od nieznanego studia o 23:00 to powód do skargi. Do kontaktów starszych niż miesiąc follow-upy nie idą.",
          "Follow-up działa tylko dla wiadomości wysłanych przez bota. Po «Skontaktowano samodzielnie» i przy kontakcie ręcznym przypominanie się to Twoje zadanie. Jeśli kontakt zamknięto przyciskiem «🙅 Klient odmówił» albo «🔇 Ignoruje» — follow-up już do niego nie wyjdzie, nawet ten wstawiony do kolejki.",
        ],
      },
      {
        id: "numbers",
        title: "Jak czytać liczby na karcie",
        body: [
          "**«wyszukiwarka 84»** — jak łatwo znaleźć stronę w Google i Yandexie, od 0 do 100. 80 i więcej — w porządku, 50–79 — jest co poprawić, poniżej 50 — słabo widoczna, do 10 — strona zamknięta dla wyszukiwarek.",
          "**«−24…48»** — ile zapytań traci się na każde sto osób, które już otworzyły stronę i były gotowe napisać albo zadzwonić. To nasza ocena na podstawie znalezionych problemów (brak cen, telefon nie jest klikalny, strona nieczytelna na telefonie), a nie statystyka klienta — tak to mów. Nie ma związku z wyszukiwarką.",
          "**Ostatnia liczba** — ocena ogólna: sto minus 25 za każde krytyczne znalezisko, 12 za poważne i 5 za drobne. Poniżej 60 — na żółto, 0 — strona się nie otworzyła.",
          "**Etykiety znalezisk**: czerwona ramka — krytyczne, złota — poważne, szara — drobne. Zaczynaj rozmowę od znaleziska o klientach i pieniądzach, a nie od technicznego.",
          "**Statusy**: «bez kontaktu», «wiadomość gotowa», «w kolejce do wysłania», «wysłano», «napisz ręcznie», «nie wysłano» (bot nie dostarczył — otwórz kartę), «pominięto». Przy zamkniętych do «wysłano» dochodzi «klient odmówił» albo «ignoruje». To samo jest w zwiniętym bloku «Jak czytać liczby» nad listą.",
        ],
      },
      {
        id: "own-list",
        title: "Sprawdź własną listę stron",
        body: [
          "Blok na górze: wklej adresy w pole «Lista stron — po jednej w wierszu» (obok można dopisać nazwę firmy) i kliknij **«Sprawdź N»**. Naraz — do 200 adresów; strony sprawdzane są po pięć, jedna po drugiej, żeby nie pukać do dziesięciu naraz.",
          "Wynik od razu zapisuje się na wspólnej liście. Strony, do których nie ma zastrzeżeń, nie są zapisywane: nie ma o czym pisać i nie trzeba wymyślać pretekstu. Strona, która już jest na liście, się nie dubluje.",
          "Firmy bez strony: zaznacz «Firma nie ma strony», podaj branżę i nazwy, po jednej w wierszu — «Dodaj N». Wiadomość do nich pisze się na podstawie branży, a skontaktować się można przez telefon albo Telegram, jeśli jest znany.",
          "«Język wiadomości» wpływa tylko na szkic w tabeli. Wiadomość ze «Skontaktuj się» pisze się w języku strony.",
        ],
      },
      {
        id: "skip",
        title: "«nie piszemy» i «✖ Не подходит»",
        body: [
          "Nie do każdego znaleziska warto pisać: strona jest państwowa, firma się zamknęła, to Twój znajomy. Kliknij «nie piszemy» i krótko wyjaśnij dlaczego — karta dostanie status «pominięto» i nikomu więcej się nie trafi.",
          "W porcji dnia to samo robi przycisk «✖ Не подходит» w Telegramie. Taka firma liczy się jako «nie pasuje», a nie jako niezrobiona.",
        ],
      },
      {
        id: "maps",
        title: "Autowyszukiwanie firm na mapach",
        roles: ["head", "admin"],
        body: {
          head: [
            "Kampanie zakładasz Ty i właściciel: **branża i miasto** (na przykład «stomatologia», «Tashkent») → «Szukaj». Decyzja, jakich branż studio potrzebuje, należy do Ciebie: każda kampania to zapytania do płatnego API i setki firm w puli. Ta sama branża w tym samym mieście drugi raz się nie założy — panel pokaże już istniejącą kampanię.",
            "Codziennie o 06:00 system szuka firm w Google Maps — do trzech stron wyników na kampanię, a dla Taszkentu także według dzielnic. Znalezione firmy sprawdzane są w tle, po pięć stron na przebieg: firma ze stroną trafia do puli tylko wtedy, gdy na stronie jest o czym napisać; bez strony — z telefonem z mapy. Zamknięte firmy i media społecznościowe zamiast strony są pomijane.",
            "W wierszu kampanii: «znaleziono N · w puli M». «wyniki wyczerpane» — czas założyć nową branżę. «szukaj teraz» — nie czekać do rana; «wstrzymaj» / «wznów».",
            "Limit to 25 zapytań dziennie, po 20 firm w każdym. Autowyszukiwanie podłącza właściciel: jeśli blok pisze «Nie podłączono», powiedz mu o tym.",
          ],
          admin: [
            "Kampania to **branża i miasto** → «Szukaj». Codziennie o 06:00 (także w weekendy) system szuka firm przez Google Maps: do trzech stron wyników na kampanię, dla Taszkentu — po całym mieście jeszcze w 12 dzielnicach. Znalezione firmy sprawdzane są w tle, po pięć stron na przebieg; do puli trafia to, gdzie jest o czym napisać, oraz firmy bez strony — z telefonem z mapy. Ta sama branża w tym samym mieście drugi raz się nie założy.",
            "Limit to 25 zapytań dziennie (`MAPS_DAILY_REQUESTS`), czyli około 750 miesięcznie — w ramach darmowego tysiąca od Google. Jedno zapytanie — do 20 firm.",
            "Podłączenie jednorazowe: Google Cloud → włącz «Places API (New)» i podepnij kartę płatniczą → «Credentials» → «API key» z ograniczeniem tylko do Places API (New) → `GOOGLE_PLACES_API_KEY=klucz` w `/opt/devuz/.env` i `docker compose up -d` (albo następne wdrożenie). Obecnie klucz leży w magazynie sekretów Supabase (Vault, nazwa `app.GOOGLE_PLACES_API_KEY`): jeśli w `.env` klucza nie ma, panel bierze go stamtąd.",
          ],
        },
      },
    ],
  },
};
