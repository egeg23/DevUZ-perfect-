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
        id: "health",
        title: "Czy skaut działa",
        body: {
          manager: [
            "Złoty pasek na górze — coś jest nie tak: skaut milczy, nie czyta żadnego czatu albo AI jest niedostępne. Pasek «Konto czyta 12 z 29 zadanych czatów» — część czatów nie jest czytana. W obu przypadkach powiedz właścicielowi: z panelu tego się nie naprawi.",
          ],
          head: [
            "Złoty pasek na górze — awaria: «Skaut milczy od N min» (proces zatrzymany), «nie czyta żadnego czatu» albo «Model jest niedostępny». «Konto czyta X z Y zadanych czatów» z listą «Nieczytane:» — konto firmowe nie dołączyło do tych czatów. Naprawia właściciel.",
          ],
          admin: [
            "«Skaut milczy od N min» — proces na serwerze padł albo został zatrzymany: `systemctl status devuz-scout`. «Model jest niedostępny» — problem z kluczem albo ze środkami na nim.",
            "«Konto czyta X z Y zadanych czatów» i lista «Nieczytane:» — konto firmowe nie dołączyło do tych czatów albo adres się nie otworzył. Dołączyć trzeba ręcznie z konta firmowego: z panelu się tego nie zrobi.",
            "«Mechanizm jest sprawny: … Zapytań o development jeszcze nie było» — to cisza na czatach, a nie awaria.",
          ],
        },
      },
    ],
  },

  /* ── Касания ──────────────────────────────────────────────────────── */
  "/admin/prospect": {
    what: "Zimne kontakty: znajdujemy firmy, sprawdzamy ich strony, a AI pisze krótką pierwszą wiadomość: dwa-trzy prawdziwe problemy jego strony, które adresat może sam sprawdzić, i propozycję zbudowania prototypu nowej strony w 12 godzin — albo od razu link do prototypu, który panel już zbudował na podstawie danych z jego strony. Wysyła konto firmowe studia, odpowiedzi klienta prowadzi AI, a gdy potrzebny jest człowiek — woła tego, kto pisał. Lead z kontaktu jest od razu Twój, bez kolejki.",
    items: [
      {
        id: "portion",
        title: "Porcja dnia",
        body: {
          manager: [
            "W dni robocze o 07:00 system rozdziela firmy ze wspólnej puli po równo — po jednej, po kolei dla każdego. Ile dostajesz: tygodniowy plan kontaktów podzielony przez 5 (od 2 do 15 dziennie). Bez planu — 5 dziennie.",
            "Do 09:00 wiadomości są już gotowe i porcja przychodzi do Ciebie na Telegramie: przy każdej firmie — do kogo pisać, od czego zacząć rozmowę i tekst (kliknij tekst — skopiuje się). Przyciski: **«📤 Отправить через бота»**, **«WhatsApp ↗»**, **«✋ Написал сам»**, **«✖ Не подходит»** i **«Открыть в панели»**.",
            "Ta sama porcja jest na górze działu, w bloku «Twoja porcja dnia: zrobione 2 z 5», ze stanami «tekst gotowy», «zrobione», «nie pasuje»; firmy wydane w zamian są oznaczone jako «zamiana».",
            "**O 18:00** to, czego nie zrobiono, wraca do wspólnej puli, a wiadomość jest kasowana — jest podpisana Twoim imieniem. Kierownik i właściciel dostają raport: ile kontaktów każdy zrobił w ciągu dnia i ile z porcji jest zrobione.",
            "Za zrobione liczy się tylko kontakt: w Telegramie «📤 Отправить через бота» i «✋ Написал сам», w panelu «Wyślij do …» i «Skontaktowano samodzielnie» — jedno i drugie liczy się tak samo. Porcja to dokładnie tyle kontaktów: «Не подходит» się nie liczy, ale na jej miejsce od razu przychodzi **zamiana** z puli — w Telegramie jako karta «🔁 Замена» z gotowym tekstem (tekst pisze się do minuty) i w bloku porcji. Tak samo za «nie piszemy» przy karcie w panelu. Zamian dziennie jest najwyżej tyle, ile dwie porcje: jeśli pula jest pusta albo zamiany się skończyły, bot odpowie tak pod przyciskiem, a w wieczornym raporcie będzie to «без замены» (bez zamiany). Chcesz więcej niż porcja — włącz [strumień «Получать лиды»](#prospect-stream): firmy ponad porcję, bez limitu.",
          ],
          head: [
            "Ty też dostajesz porcję: w dni robocze o 07:00 firmy z puli są rozdzielane po równo wszystkim w kolejce — Tobie i menedżerom. Wielkość: plan na tydzień ÷ 5 (od 2 do 15), bez planu — 5.",
            "O 09:00 porcja przychodzi na Telegram z gotowymi tekstami i przyciskami «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит», «Открыть в панели». W dziale jest w bloku «Twoja porcja dnia».",
            "O 18:00 niezrobione wraca do puli, a Ty dostajesz na Telegram raport o całym zespole — ten sam, co właściciel: «Имя — 7 касаний · порция 3 из 5, не подошло 2, без замены 1» (imię — 7 kontaktów · porcja 3 z 5, nie pasowało 2, bez zamiany 1). Najpierw — wszystkie kontakty danej osoby w ciągu dnia: z porcji, ze strumienia i z panelu. Potem — porcja: ile z porannego przydziału jest zrobione. Na dole — podsumowanie dla wszystkich. Liczą się tylko kontakty: «Не подходит» się nie liczy — w zamian człowiek od razu dostaje zamianę z puli, do dwóch porcji zamian dziennie; «без замены» — pula była pusta albo zamiany się skończyły. ⚠️ — ani jednego kontaktu z porcji, ✅ — porcja zrobiona w całości. Jeśli ktoś włączał [strumień «Получать лиды»](#prospect-stream), w nawiasie jest, ile kontaktów przyszło ze strumienia: «7 касаний (поток 4)» (7 kontaktów, w tym 4 ze strumienia).",
            "Pulę uzupełnia [autowyszukiwanie na mapach](#prospect-maps) i ręczne sprawdzanie stron. Pusta pula — puste porcje.",
          ],
          admin: [
            "Ty porcji nie dostajesz. W dni robocze o 07:00 firmy z puli są rozdzielane po równo między menedżerów i kierowników: plan na tydzień ÷ 5 (od 2 do 15), bez planu — 5. Najpierw idą strony z najgorszą oceną.",
            "Wiadomości przygotowują się w tle, do 09:00 porcja trafia do ludzi na Telegram (najpóźniej o 10:00, nawet jeśli część tekstów nie jest gotowa). Porcja to dokładnie tyle kontaktów: za każde «Не подходит» w bocie albo «nie piszemy» w panelu człowiek od razu dostaje zamianę z puli z gotową wiadomością, do dwóch porcji zamian dziennie. O 18:00 niezrobione wraca do puli, a Ty i kierownicy dostajecie ten sam raport o całym zespole: «Имя — 7 касаний (поток 4) · порция 3 из 5, не подошло 2, без замены 1» (imię — 7 kontaktów (strumień 4) · porcja 3 z 5, nie pasowało 2, bez zamiany 1). Kontakty — wszystkie z dnia: porcja, strumień «Получать лиды» i to, co napisano z panelu; porcja — ile z porannego przydziału jest zrobione. Na dole — podsumowanie: «Всего: 34 касания · порции: 21 из 45» (łącznie: 34 kontakty · porcje: 21 z 45).",
            "Pulę uzupełniają [autowyszukiwanie na mapach](#prospect-maps) i ręczne sprawdzenia. Jeśli raport pokazuje puste porcje — w puli skończyły się firmy: załóż nową kampanię.",
          ],
        },
      },
      {
        id: "stream",
        title: "Strumień «Получать лиды» (w Telegramie)",
        roles: ["manager", "head"],
        body: {
          manager: [
            "Przycisk **«▶️ Получать лиды»** (odbieraj leady) jest na dole czatu z botem, pod polem wpisywania; jeśli go tam nie ma, wyślij botowi /leads (komenda jest w menu bota). Po kliknięciu firmy ze wspólnej puli zaczynają przychodzić do Ciebie na Telegramie pojedynczo, z gotowym tekstem i tymi samymi przyciskami co w [porcji dnia](#prospect-portion): «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит». Na górze takiej karty jest «▶️ Поток».",
            "Limitu dziennego nie ma: obsłużysz firmę — od razu przychodzi następna. Obsłużyć znaczy kliknąć «Отправить через бота», «Написал сам» albo «Не подходит» (w Telegramie lub w panelu). Nieobsłużonych firm możesz mieć naraz najwyżej trzy: dzięki temu pula nie trafia do jednej osoby tylko po to, żeby wieczorem wrócić nietknięta. Wiadomość do każdej firmy AI pisze do minuty, więc następna karta może nie przyjść od razu.",
            "Strumień działa w dni robocze od 9:00 do 18:00 i zaczyna się po porannej porcji. Czego nie obsłużysz do 18:00, wraca do wspólnej puli. Na noc strumienia wyłączać nie trzeba: sam poczeka do rana i ruszy w następny dzień roboczy — dopóki nie klikniesz **«⏸ Не получать лиды»** (nie odbieraj leadów; na dole czatu albo pod dowolną kartą strumienia). /leads przełącza: gdy strumień jest włączony — wyłącza, gdy wyłączony — włącza.",
            "Strumień jest ponad porcję: nie wlicza się do «zrobione N z 5» i nie ma w nim zamian za «Не подходит» — następna firma i tak przychodzi. Do planu tygodniowego kontakty ze strumienia się liczą. Co przyszło dziś i czym się skończyło — w bloku «Strumień leadów» na górze działu. Gdy w puli skończą się firmy, bot powie o tym raz dziennie i przyśle nowe, gdy się pojawią.",
          ],
          head: [
            "Przycisk **«▶️ Получать лиды»** (odbieraj leady) jest na dole czatu z botem, pod polem wpisywania; jeśli go tam nie ma, wyślij botowi /leads (komenda jest w menu bota). Po kliknięciu firmy ze wspólnej puli zaczynają przychodzić do Ciebie na Telegramie pojedynczo, z gotowym tekstem i tymi samymi przyciskami co w [porcji dnia](#prospect-portion): «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит». Na górze takiej karty jest «▶️ Поток». Tym samym przyciskiem strumień włączają Twoi menedżerowie.",
            "Limitu dziennego nie ma: obsłużona firma — od razu przychodzi następna. Obsłużyć znaczy kliknąć «Отправить через бота», «Написал сам» albo «Не подходит» (w Telegramie lub w panelu). Nieobsłużonych firm jedna osoba ma naraz najwyżej trzy: dzięki temu pula nie trafia do jednego człowieka tylko po to, żeby wieczorem wrócić nietknięta. Wiadomość do każdej firmy AI pisze do minuty, więc następna karta może nie przyjść od razu.",
            "Strumień działa w dni robocze od 9:00 do 18:00 i zaczyna się po porannej porcji. Czego nie obsłużono do 18:00, wraca do wspólnej puli. Na noc strumienia wyłączać nie trzeba: sam poczeka do rana i ruszy w następny dzień roboczy — dopóki człowiek nie kliknie **«⏸ Не получать лиды»** (nie odbieraj leadów; na dole czatu albo pod dowolną kartą strumienia). /leads przełącza: gdy strumień jest włączony — wyłącza, gdy wyłączony — włącza.",
            "Strumień jest ponad porcję: nie wlicza się do «zrobione N z 5» i nie ma w nim zamian za «Не подходит» — następna firma i tak przychodzi. Do planu tygodniowego kontakty ze strumienia się liczą. Co przyszło do Ciebie dziś i czym się skończyło — w bloku «Strumień leadów» na górze działu. Gdy w puli skończą się firmy, bot powie o tym raz dziennie i przyśle nowe, gdy się pojawią.",
            "W wieczornym raporcie przy każdym w nawiasie jest, ile z jego kontaktów w ciągu dnia przyszło ze strumienia: «Имя — 7 касаний (поток 4) · порция 3 из 5». Kto nie miał porcji, ale miał strumień — «Имя — 4 касания (поток 4) · порции не было» (4 kontakty, wszystkie ze strumienia · porcji nie było).",
          ],
        },
      },
      {
        id: "no-text",
        title: "Karta przyszła bez tekstu",
        body: {
          manager: [
            "Czasem firma z [porcji dnia](#prospect-portion) albo [strumienia](#prospect-stream) przychodzi na Telegram bez wiadomości — z dopiskiem «Текст ещё готовится» (tekst jeszcze się przygotowuje). Dzieje się tak, gdy AI, które pisze wiadomości, nie odpowiada: na jego koncie skończyły się pieniądze albo u dostawcy jest awaria. Porcja i tak przychodzi najpóźniej o 10:00 — firmy są już Twoje.",
            "Nic nie musisz klikać. System próbuje napisać wiadomość ponownie co pięć minut, a gdy tylko będzie gotowa, bot przysyła tę samą firmę jeszcze raz — na górze «✍️ Текст готов» (tekst gotowy), z tekstem i przyciskiem «📤 Отправить через бота». Pierwszej karty możesz nie ruszać: przyciski działają w obu.",
            "Nie chcesz czekać — kliknij «✋ Написал сам», jeśli piszesz własnymi słowami, albo otwórz kartę w panelu i kliknij «Skontaktuj się». Jeśli firma została już obsłużona, druga karta nie przyjdzie. O 18:00 niezrobione wraca do puli i dosyłanie się kończy.",
          ],
          head: [
            "Czasem firma z [porcji dnia](#prospect-portion) albo [strumienia](#prospect-stream) przychodzi na Telegram bez wiadomości — z dopiskiem «Текст ещё готовится» (tekst jeszcze się przygotowuje). Zdarza się to Tobie i Twoim menedżerom, gdy AI, które pisze wiadomości, nie odpowiada: na jego koncie skończyły się pieniądze albo u dostawcy jest awaria. Porcja i tak przychodzi najpóźniej o 10:00.",
            "Nic nie trzeba klikać. System próbuje napisać wiadomość ponownie co pięć minut, a gdy tylko będzie gotowa, bot przysyła tę samą firmę jeszcze raz — na górze «✍️ Текст готов» (tekst gotowy), z tekstem i przyciskiem «📤 Отправить через бота». Pierwszej karty można nie ruszać: przyciski działają w obu.",
            "Jeśli ktoś nie chce czekać — «✋ Написал сам» albo «Skontaktuj się» w panelu. Wieczorny raport liczy kontakty jak zwykle: karta bez tekstu nie zamienia się w «не подошло» (nie pasowało). O 18:00 niezrobione wraca do puli i dosyłanie się kończy.",
          ],
          admin: [
            "Jeśli AI nie odpowiada — na kluczu Anthropic skończyły się pieniądze, klucz nie został przyjęty albo u dostawcy jest awaria — wiadomości do [porcji](#prospect-portion) i strumienia się nie piszą. Porcja i tak trafia do ludzi najpóźniej o 10:00: jako karty bez tekstu, z dopiskiem «Текст ещё готовится» (tekst jeszcze się przygotowuje).",
            "Odmowa modelu nic nie kosztuje, więc system próbuje ponownie co pięć minut. Doładujesz saldo — wiadomości dopiszą się same, po dwie-trzy na pięć minut, a każdy dostanie swoją firmę jeszcze raz, już z tekstem: «✍️ Текст готов» (tekst gotowy). Niczego nie trzeba wdrażać ani klikać.",
            "Co innego, gdy nie udała się sama wiadomość: model zwrócił pustą odpowiedź albo firma bez strony nie ma zapisanej branży. Drugiej próby wtedy nie ma — powtórka tego nie naprawi, a pieniądze pobierze. Do takiej firmy człowiek pisze sam: «Skontaktuj się» w panelu.",
          ],
        },
      },
      {
        id: "plan",
        title: "Tygodniowy plan kontaktów",
        body: {
          manager: [
            "Plan ustawia Twój kierownik albo właściciel — nikt nie ustawia planu sam sobie. Widać go w wierszu na górze działu i na stronie głównej: «Do planu zostało 12 — w tym tygodniu 18 z 30».",
            "Liczą się firmy, do których piszesz od poniedziałku (00:00 czasu taszkenckiego): kliknięcie «Wyślij do …» w panelu albo «📤 Отправить через бота» w Telegramie, albo oznaczenie «Skontaktowano samodzielnie» (w Telegramie — «✋ Написал сам»). Jedna firma — jeden kontakt. Jeśli wiadomość bota nie wyszła («nie wysłano»), kontakt się nie liczy.",
            "«Skontaktuj się» to jeszcze nie kontakt: to tylko przygotowanie wiadomości.",
          ],
          head: [
            "Plan swoim menedżerom ustawiasz w dziale [«Zespół»](/admin/team), w kolumnie «Plan kontaktów»: liczba na tydzień i «zapisz». Puste pole to «bez planu», a to nie to samo co 0: przy 0 porcji nie będzie wcale. Najwyżej 500.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do …» albo «Skontaktowano samodzielnie» (w Telegramie — «📤 Отправить через бота» albo «✋ Написал сам»); wiadomości, które nie wyszły, się nie liczą.",
            "Twój własny plan ustawia właściciel.",
          ],
          admin: [
            "Plan ustawia się w dziale [«Zespół»](/admin/team), w kolumnie «Plan kontaktów»: Ty — komu chcesz, kierownik — tylko swoim ludziom. Puste pole to «bez planu» (porcja 5 dziennie), 0 — nie ma planu i nie ma porcji.",
            "Liczą się firmy, do których człowiek napisał od poniedziałku: «Wyślij do …» albo «Skontaktowano samodzielnie» (w Telegramie — «📤 Отправить через бота» albo «✋ Написал сам»); wiadomości, które nie wyszły, się nie liczą.",
          ],
        },
      },
      {
        id: "send",
        title: "Napisz do firmy: «Skontaktuj się» i «Wyślij do …»",
        body: [
          "Na karcie strony kliknij **«Skontaktuj się»**: panel od nowa przechodzi stronę (do minuty) i pisze wiadomość. To się jeszcze nie liczy jako kontakt.",
          "Wiadomość jest krótka, 50–100 słów: kto pisze; dwa-trzy znaleziska z jego strony — każde z miejscem (strona, ich własny nagłówek) i tym, co przez nie robi klient; widoczność w wyszukiwarce i straty; nasz projekt z jego branży, jeśli jest; i pytanie, czy zbudować mu prototyp nowej strony w 12 godzin. Skali studia i „wzrostu 2–4 razy” nie piszemy w pierwszej wiadomości: po zdaniach, które są w każdej wiadomości takie same, rozpoznaje się masową wysyłkę. Jeśli zapytają, kim jesteśmy — odpowiadamy w korespondencji. Jeśli panel zdążył zbudować [prototyp z wyprzedzeniem](#prospect-proto-ahead), zamiast pytania, czy zbudować, w wiadomości jest link do gotowego prototypu i pytanie, jak mu się podoba.",
          "Przeczytaj wiadomość i dopasuj ją do człowieka. Potem **«Wyślij do @adres»** — wiadomość trafi do kolejki konta firmowego. Od tej chwili lead jest założony i przypisany do Ciebie, a kontakt zaliczony.",
          "Przed wysłaniem panel sprawdza wiadomość i pisze, co jest nie tak: 40–150 słów; jest adres strony i devuz.studio; nie ma liczb, których nie ma w analizie; nie ma obietnic w rodzaju «в топ», «гарантирую», «первое место» (w języku wiadomości: „do topu”, „gwarantuję”, „pierwsze miejsce”), procentów ani emoji; wymieniona jest widoczność w wyszukiwarce i straty, jeśli są; jest propozycja prototypu w 12 godzin, a jeśli prototyp zbudowano z wyprzedzeniem — link do niego, co do litery.",
          "Każdy pracownik może przygotować i wysłać dowolną kartę — kto kliknie, ten zostaje jej właścicielem. Dlatego zaczynaj od [porcji dnia](#prospect-portion): tam firmy są już podzielone.",
        ],
      },
      {
        id: "proto-ahead",
        title: "Prototyp z wyprzedzeniem: link w wiadomości zamiast obietnicy",
        body: [
          "Gdy wiadomość się przygotowuje — z [porcji dnia](#prospect-portion), w strumieniu «Получать лиды» albo przyciskiem «Skontaktuj się» — panel sam buduje firmie prototyp nowej strony. Branże: stomatologia, centrum szkoleniowe, centrum medyczne, warsztat samochodowy, wulkanizacja, myjnia, detailing, barbershop, salon kosmetyczny, studio paznokci. Wszystko na stronie pochodzi z jego własnej strony: nazwa, opis, telefon, komunikatory, logo, zdjęcia; usługi — tylko te, które są napisane na jego stronie, każda porównana ze stroną słowo w słowo. Od siebie — ani jednej liczby, ceny czy usługi.",
          "Zbudował się — w wiadomości zamiast obietnicy zbudowania w 12 godzin jest link do gotowej strony, a ostatnia linijka pyta, jak mu się podoba. W karcie strony — «Prototyp zbudowany z wyprzedzeniem →» i czy klient go otwierał. Kontrola przed wysłaniem wymaga linku co do litery: zgubiona litera to „strona nie znaleziona” u klienta.",
          "Klient otworzył link — dostajesz w Telegramie «Касание · сайт» i «👀 Клиент открыл прототип»: właśnie patrzy na swoją nową stronę, najlepszy moment, żeby napisać. Przychodzi raz — przy pierwszym otwarciu, do osoby prowadzącej kontakt, jeśli ma zaznaczone «Odpowiedzi klientów na kontakty». Podgląd linku, który Telegram rysuje sam, i Twoje własne otwarcia z panelu się nie liczą.",
          "Klient odpowiedział o prototypie („obejrzałem”, „a można zmienić…”) — AI nie odpowiada, tylko woła Ciebie: «ответил про прототип, который ушёл в письме, — дальше вы». Wysyłka «🔥 Нужен прототип» do całego zespołu przy takim kontakcie nie idzie: prototyp już jest u klienta.",
          "Nie zbudował się — w karcie szarym «Prototyp nie został zbudowany z wyprzedzeniem:» i powód (tej branży jeszcze nie obsługujemy, na stronie nie ma trzech usług zapisanych słowami, nie ma telefonu ani komunikatora do przycisku itd.), a wiadomość jest jak dawniej — z obietnicą zbudowania w 12 godzin. Deweloperom nie budujemy z wyprzedzeniem: potrzebują strony wyboru mieszkania, a nie zapisu.",
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
        body: [
          "Pierwszą wiadomość do nowej firmy konto firmowe wysyła nie częściej niż trzy razy na godzinę, z przerwą 8–20 minut i tylko od 07:30 do 20:30 czasu taszkenckiego, codziennie: wiadomość dodana w nocy czeka w kolejce i wychodzi rano jako pierwsza. Korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Inaczej Telegram uzna nas za masową wysyłkę i ograniczy konto — a tym samym kontem skaut czyta czaty, więc stracilibyśmy oba kanały naraz.",
          "Nad listą: «W ostatniej godzinie wysłano 1 z 3 · w kolejce 3». Przy karcie w kolejce widać, mniej więcej za ile minut wyjdzie. Kont roboczych może być kilka — każde ma swój limit trzech na godzinę, i wtedy druga liczba jest większa: tyle pierwszych wiadomości na godzinę wychodzi ze wszystkich razem. Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce; jeśli kierownik przypisał cię do określonych kont — tylko z nich. Odpowiedzi i poprawki — z tego, z którego wyszła pierwsza wiadomość.",
          "Nie musisz czekać: otwórz rozmowę ze swojego konta, wyślij ten sam tekst i kliknij **«Skontaktowano samodzielnie»** — bot nie wyśle już swojej kopii, a odpowiedź klienta przyjdzie do Ciebie osobiście.",
          "**Wiadomości właściciela idą poza kolejką**: nie czekają ani na cudze wiadomości, ani na limit trzech na godzinę, ani na przerwę 8–20 minut — wychodzą minutę po dowolnej poprzedniej wysyłce, ale też tylko od 07:30 do 20:30. Do limitu trzech na godzinę jednak się wliczają: limit dotyczy konta, więc po takiej wiadomości pozostali będą musieli poczekać. Na takiej karcie jest napisane «Wiadomość właściciela — poza kolejką».",
        ],
      },
      {
        id: "self",
        title: "«Skontaktowano samodzielnie» (w Telegramie — «✋ Написал сам»)",
        body: [
          "Klikaj, gdy piszesz albo dzwonisz samodzielnie — ze swojego konta, na WhatsAppie, przez telefon. W polu krótko: czym i jak („własny Telegram”, „telefon”).",
          "Co się dzieje: kontakt liczy się Tobie, lead zakłada się na Ciebie, karta dostaje status «wysłano», a drugi kolega nie napisze już do tego samego człowieka. Bez tego oznaczenia nic z tego się nie dzieje: dla panelu nikt do nikogo nie napisał.",
          "Po «Skontaktowano samodzielnie» korespondencja idzie przez Ciebie: bot nie wysyła follow-upów i nie widzi odpowiedzi. Odpowiedź klienta możesz przenieść do karty — patrz punkt [napisz ręcznie](#prospect-manual).",
        ],
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
          "AI **woła Ciebie**, jeśli klient: odmówił („nie piszcie”, „nie jestem zainteresowany”); prosi o człowieka albo telefon; **prosi o przesłanie analizy, oferty, kosztorysu albo pliku** — wtedy wyślij to samodzielnie jeszcze tego samego dnia; **chce prototypu** («да, соберите», „prototip yig‘ib bering”) — wtedy autor kontaktu dostaje «🛠 Хотят прототип» z przyciskiem «🛠 Беру прототип»: **przez pierwsze 30 minut** prototyp jest tylko jego. Nie weźmie w pół godziny — **do całego zespołu** idzie «🔥 Нужен прототип — бери срочно» z tym samym przyciskiem (od 07:00 do 23:00; prośba w nocy — wyjdzie o 07:00): kto pierwszy kliknie, ten dostaje leada i korespondencję, u pozostałych przycisk gaśnie z imieniem tej osoby; zbudować prototyp ręcznie i wysłać klientowi link trzeba w 12 godzin, jak obiecaliśmy w wiadomości — przypomnienie 2 godziny przed terminem ustawia się samo; klient sam dostaje odpowiedź „przygotowujemy makietę” z linkiem do warunków udostępniania makiety (devuz.studio/ru/mockup-terms) — przyjmuje je, kontynuując korespondencję albo odbierając makietę, więc linku nie trzeba powtarzać; jeśli korespondencja nie idzie przez Telegram, ta odpowiedź czeka w karcie kontaktu — wyślij ją samodzielnie; odpowiedział krótko i niezrozumiale. A także — jeśli rozmowa trwa 12 wypowiedzi i się nie klei albo jego odpowiedź nie przeszła kontroli. Jeśli w wiadomości był już link do [prototypu z wyprzedzeniem](#prospect-proto-ahead), słowo „prototyp” w odpowiedzi znaczy „obejrzałem”: AI woła Ciebie z powodem «ответил про прототип, который ушёл в письме», a «Нужен прототип» do całego zespołu nie idzie.",
          "Gdy zawoła, dostaniesz na Telegramie «Касание · сайт» z powodem, słowami klienta i linkiem do leada, a pod spodem przycisk «🙅 Клиент отказался»: klient powiedział „nie jestem zainteresowany” — kliknij, a kontakt się [zamknie](#prospect-close). Na karcie leada jest blok «Pierwsza rozmowa po kontakcie»: «odpowiada AI» albo «odpowiadasz Ty — powód». Przycisk **«Odpowiadam osobiście»** w każdej chwili zabiera rozmowę AI: od tej pory AI milczy, a każda nowa wiadomość klienta przychodzi do Ciebie na Telegram — «Клиент написал — отвечаете вы» (klient napisał — odpowiadasz Ty) z linkiem do leada. Przychodzi do tego, kto kliknął przycisk, nawet jeśli to kierownik albo właściciel. Lead i tak jest Twój. Jeśli lead przekazano albo wziął go ktoś inny z kolejki — rozmowa idzie razem z nim: wiadomości klienta, follow-upy i podpis AI należą teraz do nowego właściciela leada, a «Odpowiadam osobiście» poprzedniego zostaje zdjęte.",
          "Gdy AI ustali zadanie, budżet i terminy, żegna się, a Ty dostajesz brief «Первичка по касанию · сайт». Dalej rozmowa jest Twoja.",
          "⚠️ Jeśli odpowiadasz osobiście, nowe zwykłe wiadomości klienta nie przychodzą do Ciebie na Telegram — zaglądaj do korespondencji samodzielnie.",
        ],
      },
      {
        id: "close",
        title: "«🙅 Klient odmówił» i «🔇 Ignoruje»: kontakt zamknięty",
        body: [
          "Gdy jest jasne, że rozmowy nie będzie, zamknij kontakt. **«🙅 Klient odmówił»** (w Telegramie — «🙅 Клиент отказался») — odpowiedział „nie jestem zainteresowany”, „nie piszcie”, odmówił przez telefon. **«🔇 Ignoruje»** (w Telegramie — «🔇 Игнорирует») — przeczytał i milczy, nie odbiera telefonu. Przyciski są na karcie wysłanych stron w «Przeanalizowane strony» oraz w Telegramie — pod kartą firmy z porcji albo strumienia po «📤 Отправить через бота» i «✋ Написал сам». Pod wiadomością bota «Касание · сайт» o odpowiedzi klienta jest tylko «🙅 Клиент отказался». W panelu przyciski widzi ten, kto prowadzi kontakt, kierownik i właściciel.",
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
