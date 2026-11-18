import type { HelpCopy } from "../admin-help";
import type { HelpEntry } from "@/lib/admin/help";

/**
 * Польская инструкция, последняя часть: разделы от «Релизов» до
 * «Инструкций» и хвост страницы — каналы Telegram, три правила, «Не
 * получается?». Перевод content/admin-help-ru.ts абзац в абзац; кнопки и
 * сообщения бота, кабинет партнёра и публичный сайт — по-русски, как их
 * видит человек.
 */

const BOT_URL = "https://t.me/Devuz_studio_bot";
/** Канал закрытый, публичного имени у него нет — только ссылка-приглашение. */
const SCOUT_URL = "https://t.me/+puC_Ns-kCbQ5NzJi";

export const moreSections: Record<string, HelpEntry> = {
  /* ── Релизы ───────────────────────────────────────────────────────── */
  "/admin/releases": {
    what: "Pliki gotowych produktów, które kupujący dostają po opłaceniu zamówienia w sekcji «Zamówienia sklepu». Opublikowanie pliku oznacza decyzję, co dokładnie dostanie każdy, kto już zapłacił — dlatego ta sekcja jest tylko u właściciela.",
    items: [
      {
        id: "upload",
        title: "Opublikuj wersję",
        body: [
          "Najpierw wgraj archiwum do prywatnego bucketu Supabase ze swojego komputera — strona nie przyjmuje dużych plików. Potem formularz «Opublikuj wydanie»: produkt, wersja, bucket, ścieżka w buckecie, sha256 (opcjonalnie) i notatka — «Opublikuj».",
          "Panel sprawdzi, czy plik jest na miejscu. Nowa wersja staje się aktualna, poprzednia przestaje nią być.",
        ],
      },
      {
        id: "downloads",
        title: "Co widzi kupujący",
        body: [
          "Po opłaceniu — przycisk pobierania na stronie zamówienia: łącznie do 20 pobrań i do 10 dziennie, każdy link działa 60 sekund. Dopóki nie ma wydania — komunikat, że plik jest w przygotowaniu.",
          "Jeśli na górze widzisz ostrzeżenie o `DOWNLOAD_SIGNING_SECRET` — pobieranie nie działa u nikogo. Dostęp odbierasz przyciskiem na karcie zamówienia w sekcji [«Zamówienia sklepu»](/admin/orders).",
        ],
      },
    ],
  },

  /* ── Команда ──────────────────────────────────────────────────────── */
  "/admin/team": {
    what: "Tu są wszyscy pracownicy studia. Tutaj dodajesz nową osobę, ustawiasz jej rolę, kierownika i plan kontaktów oraz wybierasz, co wysyła jej bot. Tu też wyłączasz tego, kto odszedł.",
    items: [
      {
        id: "invite",
        title: "Dodaj pracownika",
        body: {
          head: [
            "Wypełnij blok «Dodaj pracownika» i kliknij **«Dodaj»**. Potrzebne są id Telegrama i «Imię w panelu». Id Telegrama to liczba: osoba sprawdza je w bocie @userinfobot i przesyła Tobie.",
            "Dodajesz tylko menedżerów, a oni od razu trafiają do Twojego zespołu. Bot wyśle tej osobie zaproszenie z przyciskiem logowania.",
            "Zaproszenie nie dotarło? Znaczy, że ta osoba jeszcze nie pisała do bota. Niech otworzy [bota](https://t.me/Devuz_studio_bot) i naciśnie «Start», a Ty kliknij «wyślij zaproszenie» w jej wierszu.",
          ],
          admin: [
            "Wypełnij blok «Dodaj pracownika»: id Telegrama, «Imię w panelu» i rolę («kierownik projektów» albo «menedżer»). Kliknij **«Dodaj»**. Id Telegrama osoba sprawdza w bocie @userinfobot.",
            "Nowa osoba przychodzi bez kierownika, przypisz ją w kolumnie «Kierownik». Zaproszenie nie dotarło? Niech osoba naciśnie «Start» w [bocie](https://t.me/Devuz_studio_bot), a Ty kliknij «wyślij zaproszenie» w jej wierszu.",
            "Przycisk «odśwież menu komend bota» przydaje się, gdy ktoś nie widzi w bocie komendy /login.",
          ],
        },
      },
      {
        id: "claim",
        title: "Kierownik i jego zespół",
        body: {
          head: [
            "Menedżer bez kierownika ma w kolumnie «Kierownik» przycisk **«przejmij»**. Kliknij go, a menedżer trafi do Twojego zespołu.",
            "Widzisz statystyki swoich menedżerów i «Plan i wykonanie» i ustawiasz im plan kontaktów. Z każdej ich transakcji naliczane jest Ci 5%.",
            "Odpiąć menedżera może tylko właściciel.",
          ],
          admin: [
            "W kolumnie «Kierownik» wybierz kierownika i kliknij «zapisz». Żeby odpiąć menedżera, wybierz «bez kierownika». Osoba dostanie wiadomość.",
            "Kierownik może sam przejąć menedżera bez kierownika przyciskiem «przejmij». Menedżerowie, których dodał, od razu są jego. Dostajesz o tym wiadomość, a odpinasz tylko Ty.",
            "Kierownik widzi statystyki i «Plan i wykonanie» swoich menedżerów i ustawia im plan kontaktów. Z każdej transakcji menedżera dostaje 5%.",
          ],
        },
      },
      {
        id: "plan",
        title: "Plan kontaktów",
        body: {
          head: [
            "Plan kontaktów mówi, do ilu firm osoba ma napisać w tygodniu. Swoim menedżerom ustawiasz go w kolumnie «Plan kontaktów»: liczba i «zapisz». Twój plan ustawia właściciel.",
            "Od planu zależy [porcja dnia](/admin/prospect), czyli lista firm na dziś: od 2 do 15 dziennie. Puste pole to «bez planu» i 5 firm dziennie, zero usuwa porcję.",
          ],
          admin: [
            "Ustawiaj plan w kolumnie «Plan kontaktów» komu chcesz, poza sobą. Puste pole to «bez planu» i 5 firm dziennie, zero usuwa i plan, i porcję.",
          ],
        },
      },
      {
        id: "grade",
        title: "Poziom i stawka",
        body: {
          head: [
            "Poziom menedżera i stawkę indywidualną ustawia właściciel, Ty je tylko widzisz. Od nowego klienta menedżer dostaje 10%. Jeśli w poprzednim miesiącu miał 3 transakcje, to 15%. Szczegóły w [Finansach](/admin/finance).",
          ],
          admin: [
            "Od nowego klienta menedżer dostaje 10%. Miał 3 transakcje w poprzednim miesiącu, wtedy w tym ma 15%. Za każde 3 transakcje w miesiącu dochodzi premia $200. Transakcja liczy się w miesiącu pierwszej płatności.",
            "Poziom decyduje o dosprzedaży: «młodszy menedżer» nie dostaje z niej nic, «menedżer» dostaje 5%, «kierownik» 30% ze wszystkich transakcji. «Stawka indywidualna, %» zastępuje 10% od nowego klienta, puste pole to «wg poziomu».",
          ],
        },
      },
      {
        id: "role",
        title: "Rola",
        roles: ["admin"],
        body: [
          "Przyciski «zmień na kierownika» i «zmień na menedżera» zmieniają rolę. Roli administratora przez panel nie da się nadać.",
          "Jeśli odbierzesz komuś rolę kierownika, jego menedżerowie zostaną bez kierownika. Panel powie, ilu ich jest. Przypisz ich do innego kierownika.",
          "Nie możesz zdegradować siebie ani ostatniego administratora.",
        ],
      },
      {
        id: "notices",
        title: "Jakie wiadomości bota przychodzą",
        roles: ["admin", "head"],
        body: {
          head: [
            "W ostatniej kolumnie Ty i Twoi menedżerowie macie wiersz **«Powiadomienia»**. Kliknij go, odznacz zbędne pola i kliknij **«Zapisz»**. Menedżerowie nie widzą swoich pól.",
            "Najważniejsze pole to **«Nowe zgłoszenia z kolejki»**. Bez niego osoba wychodzi z [kolejki](#leads-queue), a leady (zgłoszenia klientów) idą do następnej osoby. Przydaje się na czas urlopu albo choroby.",
            "Pozostałe pola usuwają tylko wiadomość w Telegramie, praca zostaje w panelu. Nie odznaczaj «Odpowiedzi klientów na kontakty», jeśli odpowiedzi nie prowadzi ktoś inny: klient będzie czekał.",
          ],
          admin: [
            "W ostatniej kolumnie każdy pracownik i Ty macie wiersz **«Powiadomienia»**. Kliknij go, odznacz zbędne pola i kliknij **«Zapisz»**. Kierownik też zmienia pola, ale tylko sobie i swoim menedżerom.",
            "Najważniejsze pole to **«Nowe zgłoszenia z kolejki»**. Bez niego osoba wychodzi z [kolejki](#leads-queue), a leady (zgłoszenia klientów) idą do następnej osoby. Pozostałe pola usuwają tylko wiadomość w Telegramie.",
            "Nie stoisz w kolejce, ale masz «Kopie propozycji z kolejki»: komu i kiedy zaproponowano lead. Kto i kiedy zmieniał pola, widać w [dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "lead-kinds",
        title: "«Jakie leady wysyłać» za daną osobę",
        roles: ["admin", "head"],
        body: [
          "Pod imieniem osoby jest wiersz **«Leady · wszystkie rodzaje»** albo «Leady · 4 z 7 rodzajów». Kliknij, a otworzą się pola według rodzajów leadów: «Zimne kontakty», «Przetargi», «Partnerzy i agencje» i inne. Odznacz zbędne i kliknij **«Zapisz»**.",
          "Odznaczony rodzaj do tej osoby nie przychodzi i kolejka go jej nie proponuje. Pracownik może sam zmienić te pola w [Ustawieniach](/admin/settings). Rodzaju nie wybrał nikt? Wtedy lead idzie do wszystkich.",
        ],
      },
      {
        id: "sections",
        title: "Dostęp do działów: pola właściciela",
        roles: ["admin"],
        body: [
          "W ostatniej kolumnie kierownicy i menedżerowie mają wiersz **«Działy»**. Kliknij, zaznacz potrzebne działy i kliknij **«Zapisz»**. Dział od razu pojawi się w menu tej osoby.",
          "Pole otwiera dział tylko do podglądu. Co osoba może tam zmieniać, decyduje jej rola. Na przykład menedżer w «Partnerach» zobaczy partnerów, ale wypłaty zostaną przy Tobie.",
          "«Leady», «Zadania», «Przetargi», «Ustawienia» i «Instrukcje» są otwarte dla wszystkich, nie ma ich na liście. Każdy zapis trafia do [dziennika](/admin/audit).",
        ],
      },
      {
        id: "unlimited",
        title: "Limit leadów: komu nie jest potrzebny nocny udział",
        roles: ["admin"],
        body: [
          "Poza godzinami pracy każdy bierze nie więcej niż równy udział leadów w miesiącu, żeby jedna osoba nie zabrała wszystkiego. Poza godzinami pracy to przed 08:00, po 18:00 i weekend. Jeśli kolegów z mniejszym udziałem nie ma na miejscu albo lead czeka dłużej niż 10 minut, bierze go każdy.",
          "Przycisk **«Zdejmij limit»** usuwa udział dla tej osoby, wiersz zmieni się na «Leady: bez limitu». **«Przywróć limit»** włącza go z powrotem. Przycisk widzisz tylko Ty.",
        ],
      },
      {
        id: "details",
        title: "Dane pracownika: imię i nazwisko, imię w panelu, username, telefon",
        roles: ["admin", "head"],
        body: {
          head: [
            "Przycisk **«Zmień dane»** masz Ty i każdy menedżer. Są w nim cztery pola: «Imię i nazwisko» do umów, «Imię w panelu», «Username» i «Telefon». Popraw i kliknij **«Zapisz dane»**.",
            "Imię w panelu widzą wszyscy, nim podpisane są leady i zadania. Dane drugiego kierownika i właściciela poprawia tylko właściciel.",
          ],
          admin: [
            "Przycisk **«Zmień dane»** ma każdy pracownik, Ty też. Są w nim cztery pola: «Imię i nazwisko» do umów, «Imię w panelu», «Username» i «Telefon». Popraw i kliknij **«Zapisz dane»**.",
            "Id Telegrama się tu nie zmienia. Kierownik poprawia dane sobie i menedżerom. Kto co zmienił, widać w [dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "disable",
        title: "Wyłącz pracownika",
        roles: ["admin", "head"],
        body: {
          head: [
            "Menedżera, który odszedł, wyłącz przyciskiem «Wyłącz» w ostatniej kolumnie. Przeczytaj, co się stanie, i kliknij **«Rozumiem, wyłącz»**. Kierownika i właściciela wyłącza tylko właściciel.",
            "Dostęp zamyka się od razu. Jego leady w toku wrócą do kolejki, a rozmowy przejdą do jego kierownika albo do właściciela.",
            "Usuń tę osobę z kanału sygnałów skauta i ogólnego czatu sprzedaży sam, bot tego nie potrafi. Osobę można przywrócić: dodaj ją ponownie z tym samym id Telegrama.",
          ],
          admin: [
            "Kliknij «Wyłącz» w ostatniej kolumnie. Przeczytaj, co się stanie, i kliknij **«Rozumiem, wyłącz»**. Menedżerów może wyłączać też kierownik.",
            "Dostęp zamyka się od razu. Leady w toku wrócą do kolejki, rozmowy przejdą do jego kierownika albo do Ciebie. Jeśli wyłączysz kierownika, jego menedżerowie zostaną bez kierownika.",
            "Usuń tę osobę z kanału sygnałów skauta i ogólnego czatu sprzedaży sam, bot tego nie potrafi. Osobę można przywrócić: dodaj ją ponownie z tym samym id Telegrama.",
          ],
        },
      },
      {
        id: "app-devices",
        title: "Aplikacja i powiadomienia: kto ma włączone",
        roles: ["admin", "head"],
        body: [
          "Pod imieniem pracownika jest wiersz «📱 Aplikacja: N urządzeń» albo «📱 Aplikacja: niewłączona». To liczba telefonów i komputerów, na których osoba włączyła powiadomienia panelu.",
          "Powiadomienia powtarzają wiadomości bota, więc pola «Powiadomienia» działają też na nie. Powiadomienia każdy włącza sam, na swoim urządzeniu. Jak to zrobić, opisuje [instrukcja do «Pulpitu»](/admin/help#hq-app).",
        ],
      },
    ],
  },

  /* ── Партнёры ─────────────────────────────────────────────────────── */
  "/admin/partners": {
    what: "Partner przyprowadza klientów przez swój link albo kod promocyjny i dostaje procent od kwoty projektu. Tu są jego linki, klienci, naliczenia i wnioski o wypłatę. Dział widzą właściciel i kierownik. O wypłatach, stawce indywidualnej i usunięciu partnera decyduje tylko właściciel.",
    items: [
      {
        id: "join",
        title: "Skąd bierze się partner",
        body: [
          "Zwykle partner rejestruje się sam. Na stronie w menu «Зарабатывай с нами» klika «Стать партнёром», a bot wysyła mu logowanie do gabinetu partnera. To samo robią komendy /ref i /cabinet w bocie. Pracownik studia nie może zostać partnerem, bot mu odmówi.",
          "Partnera możesz też dodać sam w bloku «Dodaj partnera ręcznie»: imię, kod, id Telegrama i notatka. Kod można pominąć, panel wymyśli go sam. Bez id Telegrama partner nie zaloguje się do gabinetu.",
          "Partner ma do 20 krótkich linków, osobny na każdą platformę. Wejście z linku strona pamięta 30 dni. Zgłoszenie w tym czasie zalicza się partnerowi, nawet jeśli klient wrócił bez linku.",
        ],
      },
      {
        id: "count",
        title: "Kiedy klient się zalicza",
        body: {
          head: [
            "Zgłoszenie zalicza się partnerowi, jeśli klient przyszedł z jego linku albo kodu promocyjnego. Są jeszcze dwa warunki: to nie sam partner i klient nie był u nas wcześniej. Wtedy partner dostaje wiadomość w bocie.",
            "Projekt z takiego zgłoszenia też jest zapisywany na partnera. Zmienić, kto przyprowadził i jaki procent, może tylko właściciel. Gdy wgrywa się podpisaną umowę, partner dostaje wiadomość z kwotą i przybliżonym udziałem.",
            "Blokada partnera zatrzymuje tylko nowe zaliczenia. Stare naliczenia i wypłaty zostają.",
          ],
          admin: [
            "Zgłoszenie zalicza się partnerowi, jeśli klient przyszedł z jego linku albo kodu promocyjnego. Są jeszcze dwa warunki: to nie sam partner i klient nie był u nas wcześniej. Wtedy partner dostaje wiadomość w bocie.",
            "Projekt z takiego zgłoszenia też jest zapisywany na partnera. Na karcie projektu, w bloku «Partner», możesz zmienić, kto przyprowadził, i procent. Tam też możesz nie zaliczyć projektu, podając powód.",
            "Blokada partnera zatrzymuje tylko nowe zaliczenia. Stare naliczenia i wypłaty zostają.",
          ],
        },
      },
      {
        id: "card",
        title: "Karta partnera: jego klienci",
        body: [
          "Kliknij imię partnera we «Wszyscy partnerzy» albo liczbę w kolumnie «Klienci». Otworzy się jego karta: wejścia, klienci, opłacone projekty, «Zarobione» i «Dostępne».",
          "Najważniejszy jest tam blok «Klienci partnera». Jest w nim każde zgłoszenie zaliczone partnerowi: kiedy przyszło, gdzie jest teraz, kto z zespołu je prowadzi i ile naliczono. Kliknij klienta, a otworzy się [karta leada](#leads-card). Partner nie widzi kontaktów swoich klientów, a Ty widzisz.",
        ],
      },
      {
        id: "percent",
        title: "Procent",
        body: [
          "Partner dostaje procent od kwoty umowy. Im większy projekt, tym wyższy procent: do $2 500 to 6%, do $5 000 10%, do $10 000 14%, do $30 000 17%, powyżej 20%.",
          "Procent na projekcie jest ważniejszy niż stawka indywidualna partnera, a ta jest ważniejsza niż tabela. Pieniądze są zamrożone, dopóki klient nie opłaci projektu w całości. Agencje mają swoją stawkę 15%, szczegóły w zakładce [Agencje](/admin/agencies).",
          "Gdy zamówienia partnera za cały czas dojdą do $50 000, do stawki każdego kolejnego projektu na zawsze dochodzi 5%. Taki partner ma na liście oznaczenie «+5% na zawsze».",
          "Stare projekty z oznaczeniem «od zysku» rozlicza się po staremu. Dla nich wpisz koszt własny na karcie projektu.",
        ],
      },
      {
        id: "agencies",
        title: "Agencje partnerów",
        body: [
          "Partner nie podłącza już agencji. Agencja sama zostaje naszym partnerem i dostaje 15%. Dodaje się ją w zakładce [Agencje](/admin/agencies).",
          "Blok «Agencje partnerów» jest widoczny tylko wtedy, gdy zostały w nim stare wpisy. Taki wpis daje partnerowi zamówienia agencji na 12 miesięcy. Przycisk **«Przedłuż o 12 miesięcy»** zaczyna termin od nowa, «wyłącz» zatrzymuje nowe zamówienia.",
        ],
      },
      {
        id: "claims",
        title: "Klienci przypisani ręcznie",
        body: [
          "Partner nie przypisuje już klientów ręcznie. Zamiast tego klient sam podaje [kod promocyjny](#partners-code).",
          "Blok «Klienci przypisani przez partnerów» jest widoczny tylko wtedy, gdy są w nim stare wpisy. Takie przypisanie działa 12 miesięcy. Jeśli firma tak naprawdę jest nasza, wpisz powód i kliknij **«anuluj przypisanie»**. Powód dostanie partner.",
        ],
      },
      {
        id: "code",
        title: "Kod promocyjny partnera: słowo, które klient mówi na głos",
        body: [
          "Każdy partner ma kod promocyjny. To słowo alfabetem łacińskim, na przykład AZIZ, które klient mówi menedżerowi. Stoi pod imieniem partnera we «Wszyscy partnerzy».",
          "Kod działa w linku oraz w słowach klienta na czacie i w bocie. Wpisuje się go też na karcie leada w polu «Kod promocyjny lub kto przyprowadził» ([jak](#leads-partner-code)). Klient trafia do partnera, który został zapisany pierwszy.",
          "Słowo zmienisz w polu **«Kod promocyjny»** w wierszu partnera, przyciskiem «zapisz». Pasują litery łacińskie i cyfry, do 12 znaków. Po zmianie stary kod przestaje działać.",
        ],
      },
      {
        id: "promo",
        title: "Materiały promocyjne",
        body: [
          "To filmy i obrazy studia, które partnerzy publikują u siebie. Otwórz je linkiem «Materiały promocyjne» na górze strony albo od razu: [Materiały promocyjne](/admin/partners/promo). Partner pobiera je w gabinecie razem z podpisem, w którym jest już jego link.",
          "Żeby dodać materiał, wybierz plik: film MP4, MOV, WebM albo obraz, do 500 MB. Wpisz nazwę i wybierz «Język słów w filmie». Kliknij **«Wgraj»** i nie zamykaj strony, dopóki wgrywanie się nie skończy.",
          "W «Podpis do posta» wpisz {link}: w tym miejscu stanie link partnera. Zaznacz pole, jeśli chcesz, żeby bot powiadomił partnerów o nowym materiale.",
          "Przy każdym materiale widać, ile razy go pobrano. **«Ukryj przed partnerami»** usuwa materiał z gabinetu, plik zostaje. «usuń» i **«Usuń na stałe»** kasują plik z serwera, więc oryginały trzymaj u siebie.",
        ],
      },
      {
        id: "payout",
        title: "Wypłata dla partnera",
        body: {
          head: [
            "Partner prosi o wypłatę w gabinecie albo komendą /payout w bocie. Można od pierwszego dnia roboczego miesiąca, od $50, od razu na całą dostępną kwotę. Wniosek pojawia się w bloku «Wnioski o wypłatę».",
            "Decyduje właściciel: przelewa pieniądze i klika «Wypłacono» albo «odrzuć». W Twoim wierszu widać partnera, kwotę i dane do przelewu, a zamiast przycisków jest napis «decyduje właściciel».",
            "O udział z projektu partner nie prosi. Gdy klient opłaci projekt w całości, wniosek o wypłatę tworzy się sam, bez minimum i bez czekania na początek miesiąca.",
          ],
          admin: [
            "Partner prosi o wypłatę w gabinecie albo komendą /payout w bocie. Można od pierwszego dnia roboczego miesiąca, od $50, od razu na całą dostępną kwotę. Wniosek pojawia się w bloku «Wnioski o wypłatę», a Ty dostajesz wiadomość.",
            "Najpierw przelej pieniądze, potem kliknij **«Wypłacono»**. Albo kliknij «odrzuć»: kwota wróci do partnera, a on zobaczy powód.",
            "O udział z projektu partner nie prosi. Gdy klient opłaci projekt w całości, wniosek tworzy się sam, a Ty dostajesz wiadomość. Dalej wszystko tak samo: przelewasz pieniądze i klikasz «Wypłacono».",
          ],
        },
      },
      {
        id: "delete",
        title: "Usuń partnera",
        roles: ["admin"],
        body: [
          "W tabeli «Wszyscy partnerzy», w kolumnie «Edycja», jest «usuń». Przeczytaj ostrzeżenie i kliknij **«Usuń na zawsze»**. Linki partnera przestaną działać, gabinet się zamknie, naliczeń z jego projektów już nie będzie. Nie da się tego cofnąć.",
          "Partnera z wypłatami nie da się usunąć, można go tylko zablokować. Usunięcie trafia do [dziennika](/admin/audit).",
        ],
      },
    ],
  },

  /* ── Агентства ──────────────────────────────────────────────────────── */
  "/admin/agencies": {
    what: "Agencja przyprowadza nam zamówienia swoich klientów i dostaje 15% od kwoty każdego projektu. Osoba z zespołu, która przyprowadziła agencję i dodała ją tutaj, przez 12 miesięcy dostaje 5% od jej projektów. Agencję może dodać każdy.",
    items: [
      {
        id: "terms",
        title: "Warunki: 15% dla agencji, 5% dla tego, kto przyprowadził",
        body: [
          "Agencja zawsze dostaje 15% od kwoty każdego swojego projektu z umowy. Progów, jak u zwykłych partnerów, nie ma.",
          "Ten, kto przyprowadził agencję, dostaje 5% od każdego jej projektu dodanego w ciągu 12 miesięcy. Termin liczy się od dnia, w którym agencję dodano tutaj. Widać go w kolumnie «5% do».",
          "Jeśli projekt agencji prowadzisz Ty, 5% dochodzi do Twojego zwykłego procentu. Oba udziały są zamrożone, dopóki klient nie opłaci projektu w całości.",
        ],
      },
      {
        id: "partners",
        title: "Partnerzy-blogerzy: te same 5% i ile przynieśli",
        body: [
          "Te same 5% przez 12 miesięcy dostaje ten, kto przyprowadził partnera-blogera. Kto go przyprowadził, zaznacza właściciel w kolumnie «Kto przyprowadził». Przyprowadziłeś partnera, a Ciebie tam nie ma? Powiedz właścicielowi.",
          "W tabeli widać, ile projektów przyniósł każdy, «Kwota projektów», «Zapłacone przez klientów» i 5%. Menedżer widzi tylko tych, których przyprowadził sam. Kierownik i właściciel widzą wszystkich.",
        ],
      },
      {
        id: "lifetime",
        title: "20% na zawsze: od $50 000 zamówień agencji",
        body: [
          "Gdy zamówienia agencji za cały czas dojdą do $50 000, jej stawka na zawsze wynosi 20%. Projekt, którym przekroczono próg, jest jeszcze po 15%, kolejny już po 20%.",
          "W kolumnie «Kwota projektów» jest napisane «20% na zawsze» albo ile zostało do 20%. Wszystko liczy się samo, ręcznie nic nie trzeba ustawiać. Twoje 5% się od tego nie zmienia.",
        ],
      },
      {
        id: "deck",
        title: "Schemat «Jak to działa» i prezentacja dla agencji",
        body: [
          "Na górze zakładki jest krótki schemat, jak to działa. Na przykładzie projektu za $2 000: agencji $300, temu, kto przyprowadził, $100, reszta dla studia.",
          "Przycisk «Otwórz prezentację» otwiera stronę dla samej agencji w sześciu językach. Twoich 5% tam nie ma. Agencji wysyłaj link «prezentacja» z jej wiersza: z nim przycisk Telegrama prowadzi do bota z kodem agencji.",
        ],
      },
      {
        id: "add",
        title: "Jak dodać agencję",
        body: {
          manager: [
            "Wypełnij blok «Dodaj agencję»: «Nazwa agencji» i «Jak do nas pisze: @telegram, telefon lub e-mail». Kliknij «Dodaj agencję», a zostanie zapisana na Ciebie.",
            "Dodaj ją od razu, gdy się dogadacie: 12 miesięcy liczy się od dnia zapisu. Jedną agencję dodaje się raz. Jeśli panel powie, że już jest, a to pomyłka, napisz do właściciela.",
          ],
          head: [
            "Wypełnij blok «Dodaj agencję»: «Nazwa agencji» i «Jak do nas pisze: @telegram, telefon lub e-mail». W «Kto przyprowadził» wybierz siebie, innego pracownika albo «Nikt, przyszła sama».",
            "Dodaj ją od razu, gdy się dogadacie: 12 miesięcy liczy się od dnia zapisu. Jedną agencję dodaje się raz. Zmienić potem, kto przyprowadził, może tylko właściciel.",
          ],
          admin: [
            "Wypełnij blok «Dodaj agencję»: «Nazwa agencji» i «Jak do nas pisze: @telegram, telefon lub e-mail». W «Kto przyprowadził» wybierz siebie, innego pracownika albo «Nikt, przyszła sama».",
            "Dodaj ją od razu, gdy się dogadacie: 12 miesięcy liczy się od dnia zapisu. Kto przyprowadził, zmieniasz w tabeli, a termin się przy tym nie przesuwa. Zmiana trafia do [dziennika](/admin/audit).",
          ],
        },
      },
      {
        id: "orders",
        title: "Jak zamówienia agencji trafiają do niej",
        body: {
          manager: [
            "Wyślij agencji jej «link dla agencji» z tabeli. Klienci z tego linku i zgłoszenia z kontaktem agencji zapisują się na nią sami, razem z 15% i 5%.",
            "Zamówienie przyszło telefonicznie albo w prywatnej wiadomości? Poproś właściciela, żeby przypiął projekt do agencji.",
          ],
          head: [
            "Wyślij agencji jej «link dla agencji» z tabeli. Klienci z tego linku i zgłoszenia z kontaktem agencji zapisują się na nią sami, razem z 15% i 5%.",
            "Zamówienie przyszło telefonicznie albo w prywatnej wiadomości? Poproś właściciela, żeby przypiął projekt do agencji.",
          ],
          admin: [
            "Wyślij agencji jej «link dla agencji» z tabeli. Klienci z tego linku i zgłoszenia z kontaktem agencji zapisują się na nią sami, razem z 15% i 5%.",
            "Zamówienie przyszło telefonicznie albo w prywatnej wiadomości? Przypnij projekt sam: karta projektu, blok «Partner».",
          ],
        },
      },
      {
        id: "money",
        title: "Gdzie widać pieniądze",
        body: {
          manager: [
            "W tabeli Twoich agencji i partnerów widać Twoje 5%: ile zarobiono i ile jest zamrożone. Te same pieniądze są osobnym wierszem w Twoich [Finansach](/admin/finance). Wypłaca się je razem z resztą.",
            "Ile dostaje agencja, nie widzisz. O jej wypłatach decyduje właściciel.",
          ],
          head: [
            "W tabeli «Wszystkie agencje i partnerzy» widać wszystkie agencje i to, kto je przyprowadził. Są tam też «Kwota projektów», «5% dla tego, kto przyprowadził» i «Udział partnera». Twoje 5% są osobnym wierszem w [Finansach](/admin/finance).",
            "Agencja jest też na ogólnej liście [Partnerów](/admin/partners) z oznaczeniem «agencja · 15%». Tam są jej naliczenia i wnioski o wypłatę. O wypłacie decyduje właściciel.",
          ],
          admin: [
            "W tabeli «Wszystkie agencje i partnerzy» widać wszystkie agencje i to, kto je przyprowadził. Są tam też «Kwota projektów», «5% dla tego, kto przyprowadził» i «Udział partnera». W [Finansach](/admin/finance) te 5% odejmuje się od udziału studia, jak każde naliczenie dla zespołu.",
            "Agencja jest też na ogólnej liście [Partnerów](/admin/partners) z oznaczeniem «agencja · 15%». Tam są jej naliczenia, dane do przelewu i wnioski o wypłatę. O wypłacie decydujesz Ty.",
          ],
        },
      },
    ],
  },

  /* ── Прототипы ────────────────────────────────────────────────────── */
  "/admin/proto": {
    what: "Prototyp przyszłej strony klienta — strona, którą wysyłasz linkiem po pierwszej rozmowie, póki jest świeża: klient otwiera ją na telefonie i widzi swój biznes. Na razie sekcja jest tylko u właściciela: budowanie to najdroższe wywołanie modelu.",
    items: [
      {
        id: "build",
        title: "Zbuduj",
        body: [
          "«Strona klienta», branża (wulkanizacja, warsztat samochodowy, myjnia, barbershop, salon kosmetyczny, studio paznokci, detailing, stomatologia, centrum szkoleniowe, centrum medyczne) i język strony. Nazwa, opis, telefon, komunikatory i logo pobiorą się same z jego strony.",
          "Usługi — każda w osobnej linii, jego słowami, od 3 do 12. Cena — po myślniku ze spacjami, i tylko taka, którą sam podał. «Nadpisz to, co znaleziono na stronie» — jeśli strona się pomyliła. «Zbuduj prototyp».",
        ],
      },
      {
        id: "auto",
        title: "Zbudowane automatycznie — do kontaktów",
        body: [
          "Prototypy z dopiskiem «zbudowany automatycznie, do kontaktu» panel zbudował bez Ciebie, przygotowując wiadomość kontaktu: firmom z najsłabszymi stronami, w branżach, które obsługuje budowniczy. Nazwa, kontakty, logo i zdjęcia — z jego strony, usługi — te, które są napisane na jego stronie, każda porównana słowo w słowo. Kontrola jest ta sama co przy budowanych ręcznie: z zastrzeżeniem prototyp zostaje «szkic» i nie trafia do wiadomości. Teraz takich prototypów na liście nie ma: wszystkie 29 są zamknięte hasłem i usunięte stąd oraz z sekcji «Makiety» (właściciel, 09.10.2026), żeby nie myliły się z budowanymi ręcznie.",
          "Link takiego prototypu wychodzi w wiadomości kontaktu sam — nie trzeba klikać «Wysłałem klientowi»: prototyp staje się «wysłany», gdy wyszła wiadomość. Jak to wygląda u menedżera — [prototyp z wyprzedzeniem](#prospect-proto-ahead).",
        ],
      },
      {
        id: "check",
        title: "Kontrola i link",
        body: [
          "Gotową stronę czyta kontrola: zmyślone liczby, procenty, przechwałki, brak nazwy firmy, niedziałający przycisk, usługi, których klient nie wymienił; długie myślniki i frazesy tekstu AI («не просто …, а …», «… dunyosiga», «noyob»): po nich właściciel firmy w sekundę rozpoznaje tekst modelu i przestaje wierzyć makiecie. Myślniki w godzinach pracy i nazwach usług z jego strony panel zamienia sam, a frazes, którym firma sama opisuje się na swojej stronie, kontrola przepuszcza: to jej słowa. Jeśli coś znajdzie — prototyp zostaje «szkic», link zwraca 404, a problemy są wypisane: popraw je i zbuduj ponownie.",
          "Czysto — «gotowy», link już działa: «Kopiuj link». Wysłałeś — «Wysłałem klientowi».",
        ],
      },
      {
        id: "opens",
        title: "Czy klient otworzył",
        body: [
          "«otworzył … wejść: N» albo «jeszcze nie otworzył». Liczy się każde otwarcie przez człowieka; Twoje własne otwarcia z panelu (jesteś zalogowany do panelu w tej przeglądarce) i podgląd linku, który komunikator rysuje sam, się nie liczą.",
          "Otworzył i wrócił drugi raz — dzwoń dziś. Nie otworzył przez dwa dni — link do niego nie dotarł. Przycisk zapisu na prototypie otwiera jego własny Telegram albo WhatsApp — tak klient widzi, że to działa.",
        ],
      },
      {
        id: "trace",
        title: "Ukryty odcisk i sprawdzanie cudzej strony",
        body: [
          "W każdy prototyp przy budowaniu wbudowuje się ukryty odcisk: odcienie kolorów, zaokrąglenia, odstępy między literami i wysokość wierszy są przesunięte o wielkości, których oko nie odróżnia, a zestaw przesunięć jest inny w każdym prototypie. Na stronie nie ma o nim ani słowa, co dokładnie przesunięto — wie tylko panel. Prototypy zbudowane wcześniej dostają odcisk i linijkę o warunkach same — przy pierwszym otwarciu przez klienta albo gdy wejdziesz do tej sekcji.",
          "W stopce każdego prototypu jest linijka w jego języku — «Прототип принадлежит DevUz Studio. Использовать его можно только по договору» (po uzbecku na prototypach uzbeckich) — z linkiem do warunków udostępniania makiet (devuz.studio/ru/mockup-terms): kara 200% ceny zadeklarowanej klientowi, a jeśli jej nie podano — 200% naszych cen za takie prace. Gdy klient zgadza się na darmową makietę, link do warunków sam trafia do niego w tej samej korespondencji — do zapoznania się, osobne „zgadzam się” nie jest potrzebne: warunki przyjmuje swoimi działaniami po nim — odpisał w sprawie projektu, dostał albo otworzył makietę. Prototyp wysłany bez prośby przyjmuje się otwarciem — link jest na nim samym. Kto się nie zgadza, musi to powiedzieć przed otrzymaniem makiety — wtedy makiety nie robimy.",
          "«Sprawdź stronę pod kątem naszej makiety»: wklej adres cudzej strony i kliknij «Sprawdź». Panel odczyta jej style i porówna je z odciskami wszystkich prototypów. «nasza makieta — na pewno» — zgadza się ponad połowa ukrytych wartości, przypadkiem tak nie bywa; «podobne do naszej makiety» — zgadza się kilka, w tym kolor. Jeśli odcisk wskazuje na jeden prototyp, panel to pisze — pokazano go temu klientowi — a obok daty i adresy otwarć.",
          "Słowa-pułapki: w danych demo makiet zbudowanych od 30.10.2026 są wymyślone nazwy demo-aptek, sklepów, ulic, inne dla każdego klienta (jak «nieistniejąca ulica» na mapach). Prawdziwa strona nie ma skąd ich wziąć: znalazły się — tekst i dane wzięto z naszej makiety. Sprawdzenie pokazuje je w wierszu «słowa-pułapki z danych demo». W makietach są też lekko przesunięte liczby skryptów (płynność, progi pojawiania się) — panel szuka ich w plikach skryptów cudzej strony.",
          "Dziennik pokazów zapisuje każde otwarcie prototypu przez żywą osobę: czas, adres i przeglądarkę; podglądy komunikatorów i Twoje otwarcia z panelu nie są zapisywane. To dowód, że klient widział makietę i przyjął warunki. Do wezwania zapisz wynik sprawdzenia i zamów notarialne oględziny strony.",
        ],
      },
      {
        id: "trace-month",
        title: "Raz w miesiącu — strony klientów",
        roles: ["admin"],
        body: [
          "Co miesiąc od 1. dnia, od 11:00 czasu Taszkentu, bot sam sprawdza strony wszystkich klientów, dla których robiliśmy makietę (adres z karty prototypu; makiety zbudowane przez bota do kontaktów nie są brane): to samo sprawdzenie co «Sprawdź stronę pod kątem naszej makiety», i to ze wszystkimi naszymi makietami, nie tylko z ich własną. Po trzy strony naraz, więc cała lista przechodzi w godzinę-dwie.",
          "Gdy wszystkie są sprawdzone, ty i kierownik dostajecie «🔎 Сайты клиентов» pod znacznikiem «Raporty»: ile sprawdzono, a jeśli znalazło się nasze — klient, która makieta (ta, którą robiliśmy im, czy makieta innego klienta), ile się zgadza, słowa-pułapki i link «Проверка в панели». Nie znalazło się — «Нашего не нашли». W nocy (od 21:00) raport nie przychodzi, dośle go następnego dnia. Do wezwania otwórz sprawdzenie w panelu, zapisz wynik i zamów notarialne oględziny strony.",
        ],
      },
    ],
  },

  /* ── Разборы ──────────────────────────────────────────────────────── */
  "/admin/razbor": {
    what: "Artykuły z analizami cudzych stron na naszą stronę: zmiana sama pisze je każdego ranka i od razu publikuje — bez Twojej akceptacji, tekst zamiast człowieka sprawdza kod. Opublikowana analiza od razu jest na stronie i w wyszukiwarce. Tu widać wszystko, co wyszło, i każdą analizę można poprawić, zdjąć z publikacji albo usunąć.",
    items: [
      {
        id: "shift",
        title: "Zmiana analiz",
        body: [
          "Codziennie o 08:03 czasu taszkenckiego zmiana bierze z «Zimnych kontaktów» strony, do których jeszcze nie pisaliśmy, przegląda do 12 i pisze do 3 analiz — po rosyjsku i po uzbecku — i od razu je publikuje. Raport «Смена разборов» przychodzi w Telegramie: ile wyszło, linki do opublikowanych stron, czy są już w mapie strony (zmiana otwiera ją tak jak wyszukiwarka i szuka obu stron każdej analizy) i dlaczego pozostałych stron nie wzięto.",
          "Powody odrzucenia: strona się nie otworzyła, strona jest w porządku albo ma za mało ustaleń, nie udało się ustalić branży lub miasta, branży nie analizujemy (medycyna i inne zakazane), zapytanie zajęte (taka analiza już istnieje — sprawdza się to, zanim model napisze artykuły), artykuł nie przeszedł kontroli. Jeśli do 11:03 raportu nie ma — przyjdzie «Смена разборов — молчит».",
        ],
      },
      {
        id: "tender",
        title: "Przetargowa analiza tygodnia",
        body: [
          "Raz w tygodniu, w pierwszy dzień tygodnia po 08:33 czasu taszkenckiego, osobna zmiana pisze analizę przetargową: nie cudzą stronę, tylko typową specyfikację techniczną zamówienia IT — strona urzędu, CRM, system obiegu dokumentów, chatbot i tak dalej. Co w takiej specyfikacji zwykle się pomija, czym to się kończy przy odbiorze i jak napisać ją dobrze. Temat to kolejny z listy w `content/razbor/tenders.ts`; artykuł nie wymienia zamawiających, przetargów ani kwot kontraktów. Jeśli w poniedziałek serwer nie działał, artykuł wyjdzie w ten dzień tygodnia, w którym serwer wróci.",
          "Artykuł wychodzi od razu, tak jak analiza strony, z oznaczeniem «przetargi i zamówienia publiczne» — nie ma zrzutów i nie będzie miał, tak ma być. Na stronie prowadzi do usługi «Тендеры и госконтракты» i do strony «Контакты». Raport przychodzi w Telegramie osobną linijką «Тендерный разбор недели», z linkiem do artykułu. Odrzucony temat nie jest pisany drugi raz; gdy tematy się skończą, raport to powie — listę uzupełnia się w kodzie.",
        ],
      },
      {
        id: "marketing-articles",
        title: "Artykuły o marketingu",
        body: [
          "Pod stroną «Marketing» na stronie studia (devuz.studio/ru/marketing i devuz.studio/uz/marketing) codziennie wychodzą dwa krótkie artykuły — o 10:00 i o 16:00 czasu taszkenckiego, od razu po rosyjsku i po uzbecku. Pisze je tani model według listy tematów w `content/marketing-topics.ts`: wyjaśnienie pod to, czego się szuka («что такое SMM», «SMM nima», «реклама в Ташкенте» — frazy z Google Trends; przed każdym artykułem zmiana jeszcze raz pyta Google Trends i Wordstat, z czym wyszukuje się jego frazę tam, gdzie czyta się w języku wersji (rosyjską — w Rosji, Uzbekistanie i krajach WNP, uzbecką — w Uzbekistanie), i wstawia pasujące frazy do tekstu; Wordstat odpowiada, gdy na serwerze jest jego token `WORDSTAT_TOKEN`), znana kampania reklamowa, częsty błąd, promocja branży w danym kanale — po kolei. Fraza stoi w tytule, opisie i pierwszym akapicie — bez tego artykuł nie wychodzi. Nie trafiają na listę «Do sprawdzenia»: wychodzą same, od razu trafiają do mapy strony, a Bing i Yandex dostają sygnał. Po co: każdy artykuł to kolejna strona, po której znajdują nas w Google i Yandex, a na końcu każdego jest oferta «strona + marketing» i kalkulator.",
          "Zamiast człowieka sprawdza je kod: w omówieniu kampanii nie może być żadnej liczby, której nie ma w faktach tematu, w pozostałych artykułach — ani procentów, ani kwot, ani lat, wersja uzbecka — tylko alfabetem łacińskim. Jeśli artykuł dwa razy nie przejdzie kontroli, tym razem go nie będzie, a w Telegramie przyjdzie linijka «Статьи о маркетинге» z powodem. Ta sama linijka przyjdzie, jeśli opublikowanego artykułu nie ma w mapie strony: po publikacji serwer sprawdza to sam. Ta sama linijka powie, gdy tematy się skończą (mniej więcej za dwa miesiące) — listę uzupełnia się w kodzie. Opublikowanego artykułu nie da się zdjąć z panelu: napisz na czat programistów, ukryją go w bazie.",
        ],
      },
      {
        id: "review",
        title: "Co sprawdza kod",
        body: [
          "Przed publikacją analizy nie czyta już człowiek (Twoja decyzja, 19.10.2026): każdy artykuł sprawdza kod, a ten, który nie przejdzie kontroli, nie wychodzi. Firma nie jest wymieniona — ani nazwą, ani adresem, ani słowem z tytułu jej strony; każda liczba jest w ustaleniach audytu; nie ma procentów wzrostu ani obietnic «w topie»; ustalenia nie są skopiowane z audytu słowo w słowo; medycyny i innych zakazanych branż zmiana nie analizuje.",
          "Widzisz błąd na stronie — znajdź analizę na liście «Opublikowane»: oba artykuły są tam w całości, a adres strony źródłowej widzisz tylko Ty. **«Edytuj»** zmienia tylko tekst: tytuł, opis, wstęp, ustalenia i podsumowanie; adres i zapytanie się nie zmieniają.",
        ],
      },
      {
        id: "publish",
        title: "Opublikuj, zdejmij, odrzuć",
        body: [
          "**«Zdejmij z publikacji»** zdejmuje analizę z witryny i odkłada ją na listę «Do sprawdzenia» — trafia tam teraz tylko to, co zostało zdjęte z publikacji, a zmiana nie publikuje tego z powrotem. Przywrócić na witrynę — **«Opublikuj»**: potrzebne są oba artykuły, strona od razu się otwiera, mapa strony się aktualizuje, Bing i Yandex dostają sygnał. Panel od razu otwiera żywą mapę strony i pisze, czy znalazły się w niej obie strony; jeśli nie — napisz na czat programistów.",
          "**«Nie publikujemy»** — dla zdjętej analizy, z powodem albo bez. Zmiana nie wróci już do tej strony. Przywrócić stronę do kolejki zmiany można tylko przez **«Usuń»** (wpisz «usuń»).",
        ],
      },
      {
        id: "english",
        title: "Wersja angielska i polska",
        body: [
          "Opublikowana analiza w ciągu godziny dostaje jeszcze dwie strony — po angielsku (devuz.studio/en/razbor) i po polsku (devuz.studio/pl/razbor). Pisze je sam serwer, bez sprawdzania w panelu: bierze opublikowany artykuł rosyjski i przenosi go pod zapytanie w tym języku — «restaurant website in Tashkent», «strona internetowa dla restauracji w Taszkencie» — sprawdzone w Google Trends i planerze Google tam, gdzie czyta się w tym języku: wersję angielską — w USA, Wielkiej Brytanii i Kanadzie, polską — w Polsce. Ustalenia, liczby i zrzuty ekranu — te same; nowych liczb, procentów i ustaleń kod nie przepuszcza, a cyrylicy w tych wersjach być nie może.",
          "Dwa razy nie przeszła sprawdzenia — serwer spróbuje ponownie za sześć godzin, a na razie analiza nie ma strony w tym języku: przełącznik języka prowadzi z niej do listy analiz w tym języku. **«Edytuj»** kasuje obie wersje: napisano je z poprzedniego tekstu, a serwer napisze je od nowa według poprawionego — adresy stron zostają te same. **«Zdejmij z publikacji»** i **«Usuń»** zdejmują z witryny także je.",
        ],
      },
    ],
  },

  /* ── Журнал ───────────────────────────────────────────────────────── */
  "/admin/audit": {
    what: "Kto co zrobił w panelu i kiedy: otworzył kartę, dane kontaktowe, korespondencję, wziął leada, zmienił status, przekazał, potwierdził płatność, dodał albo wyłączył pracownika. Wpisów nie da się zmienić ani usunąć — ani z panelu, ani z bazy.",
    items: [
      {
        id: "filters",
        title: "Jak szukać",
        body: [
          "Filtry: «Kto» — pracownik (wyłączeni są oznaczeni) albo «system» — wszystko, co zrobił timer, bot albo partner przez bota. «Co» — około 75 rodzajów działań. 100 wpisów na stronę.",
          "Na złoto wyróżnione są działania wrażliwe: dane kontaktowe, korespondencja, pieniądze, dostęp. Przy leadach — link do karty.",
        ],
      },
      {
        id: "when",
        title: "Kiedy tu zaglądać",
        body: [
          "Klient skarży się, że napisały do niego dwie osoby. Lead „zniknął”. Nie wiadomo, kto zmienił kwotę albo etap. Trzeba ustalić, kto otwierał dane kontaktowe, zanim klient odszedł do konkurencji. Tutaj widać to wszystko z dokładnością do minuty.",
        ],
      },
    ],
  },

  /* ── Использование ────────────────────────────────────────────────── */
  "/admin/usage": {
    what: "Z czego zespół korzysta w panelu: które sekcje otwiera, które funkcje klika, kto czym żyje. Ciche badanie użytkowników: zespół nie wie o tym raporcie, bo raport, o którym wszyscy wiedzą, mierzy nie pracę, tylko starania, żeby dobrze w nim wypaść.",
    items: [
      {
        id: "read",
        title: "Jak czytać",
        body: [
          "Okres — 7, 30 albo 90 dni, strzałki — w porównaniu z takim samym okresem wcześniej. Liczeni są kierownicy i menedżerowie; Ciebie tu nie ma, Twoich prywatnych sekcji też.",
          "Wniosek dla wiersza: «rdzeń» — korzysta co najmniej połowa osób, które mają do tego dostęp; «u pojedynczych osób» — mniej; «nikt — zbędne?» — nikt. Funkcje tylko dla kierowników liczone są wśród kierowników.",
        ],
      },
      {
        id: "use",
        title: "Co z tym zrobić",
        body: [
          "«nikt — zbędne?» — powód, żeby zapytać: funkcja jest niepotrzebna czy nikt o niej nie wie? Często chodzi o to drugie: wtedy pomoże punkt w instrukcji i przycisk «?».",
          "Wyświetlenia sekcji liczą się od chwili włączenia raportu, działania — z dziennika za cały czas.",
        ],
      },
    ],
  },

  /* ── Pracownicy AI ─────────────────────────────────────────────────── */
  "/admin/ai-staff": {
    what: "Sekcja pracowników AI studia: tu pracują nasi pracownicy AI i widać, co zdążyli zrobić. Zakładka «Blogerzy» to pracownik AI, który szuka blogerów z Uzbekistanu do programu partnerskiego, ocenia ich odbiorców i przygotowuje pierwszą wiadomość, a ludziom zostaje ją wysłać i się dogadać.",
    items: [
      {
        id: "service",
        title: "Usługa i bot usługi",
        roles: ["admin"],
        body: [
          "Na górze widać, czy usługa jest włączona. Gdy jest wyłączona, panel klientów, widżet na ich stronach i bot usługi nikomu nie odpowiadają, a strona usługi na naszej witrynie się nie otwiera. Przycisk **«Włącz usługę»** / **«Wyłącz usługę»** działa od razu, w ciągu minuty.",
          "Usługa ma własnego bota w Telegramie, nie bota studia: przez niego klienci logują się do panelu, podłączają swój Telegram Business i dostają zgłoszenia. Bota tworzysz w @BotFather, tam włączasz Business Mode, token zapisujesz w magazynie sekretów jako `AI_STAFF_BOT_TOKEN`, obok `AI_STAFF_WEBHOOK_SECRET` (dowolny długi losowy ciąg) i `AI_STAFF_KEY` (klucz szyfrowania tokenów botów klientów). Potem naciśnij **«Podłącz bota usługi»**: serwer sprawdzi token, czy Business Mode jest włączony (w @BotFather nazywa się Secretary Mode), i włączy botowi komendę /start. Wiadomości bot pobiera z Telegrama sam, usługą na serwerze, jak bot studia: webhook Telegrama nie dociera do naszego serwera. Usługa bierze token z magazynu i instaluje się przy wdrożeniu, nie trzeba jej uruchamiać osobno.",
        ],
      },
      {
        id: "ready",
        title: "Gotowość do pilotażu",
        roles: ["admin"],
        body: [
          "Blok **«Gotowość do pilotażu»** pokazuje to, co serwer i tak sprawdza w trakcie pracy: czy jest token bota usługi, sekret webhooka i klucz szyfrowania, czy Instagram jest otwarty, czy podłączona jest płatność kartą. Wartości sekretów nie są tu widoczne, tylko «gotowe» albo «brak». Bez tokena bota zgłoszenia klientów nie docierają do ich menedżerów, raporty nie wychodzą, a do panelu nie da się zalogować, więc ten punkt jest ważniejszy od pozostałych.",
          "Instagram «czeka», dopóki Meta nie zweryfikuje naszej aplikacji: do tego czasu przycisk «Подключить Instagram» widzą tylko panele z `AI_STAFF_IG_TESTERS` (id po przecinku), pozostali klienci widzą komunikat, że wkrótce się otworzy. Po weryfikacji ustaw `AI_STAFF_IG_PUBLIC=1`. Ostatni wiersz liczy zgłoszenia z tego miesiąca, które nie dotarły do ludzi klienta w Telegramie: brak tokena albo u klienta nikt nie ma zaznaczonego «получает заявки». Liczba większa od zera oznacza, że klient traci kupujących, sprawdź listę jego ludzi w panelu klienta.",
        ],
      },
      {
        id: "clients",
        title: "Klienci i skąd liczby",
        roles: ["admin"],
        body: [
          "Każda karta to jeden klient usługi. «Dialogi» pokazują, ile rozmów z kupującymi AI prowadziło w tym miesiącu według czasu Taszkentu, na tle limitu planu: rozmowa liczy się raz w miesiącu, niezależnie od liczby wiadomości. Gdy limit się skończy, AI klienta milknie, kupujący dostaje «menedżer odpowie», a ludzie klienta dostają wiadomość.",
          "«Koszt» to ile klient kosztował w tym miesiącu według zużycia modelu, w dolarach po cenach modelu: każde wywołanie zapisuje się z oznaczeniem klienta. Obok cena jednego dialogu i «Marża»: cena planu minus koszt w sumach po kursie z `AI_STAFF_UZS_PER_USD` (domyślnie 12 700). Przez ProxyAPI model jest droższy, liczba tego nie uwzględnia. Na górze zużycie wszystkich klientów i przychód z opłaconych planów.",
        ],
      },
      {
        id: "pay",
        title: "Płatność, okres próbny i status",
        roles: ["admin"],
        body: [
          "Na razie płatność jest na fakturę: klient do nas pisze, wystawiasz fakturę, a gdy pieniądze dotrą, wybierasz plan, liczbę miesięcy, kwotę i sposób i naciskasz **«Zaznacz płatność»**. Termin przedłuża się od już opłaconej daty, jeśli jeszcze nie minęła: płatność z góry nie przepada. Pusta kwota to cena planu za wybrane miesiące. Plan «Pro» sam przełącza AI klienta na najmocniejszy model. Gdy w magazynie sekretów pojawią się klucze Payme (`AI_STAFF_PAYME_MERCHANT_ID`, `AI_STAFF_PAYME_KEY`) albo Click (`AI_STAFF_CLICK_SERVICE_ID`, `AI_STAFF_CLICK_MERCHANT_ID`, `AI_STAFF_CLICK_SECRET`), w panelu klienta pojawi się płatność kartą: opłacona faktura sama przedłuży plan, bez Twojego zaznaczenia, i trafi do jego historii płatności.",
          "Nowy klient dostaje 14 dni okresu próbnego i 100 dialogów. **«Przedłuż okres próbny o 7 dni»** gdy klient potrzebuje czasu do płatności. **«Zmień status»**: «pauza» i «zablokowany» od razu zatrzymują AI klienta, kupujący dostają «menedżer odpowie».",
        ],
      },
      {
        id: "cabinet",
        title: "Panel klienta i demo",
        roles: ["admin"],
        body: [
          "**«Otwórz panel klienta»** to wejście do panelu klienta jako wsparcie na 2 godziny: żeby pomóc ustawić bazę wiedzy albo kanał. W nagłówku panelu klienta będzie widać, że weszło wsparcie.",
          "**«Pokazuj jako demo»** stawia widżet czatu tego klienta na stronie usługi na naszej witrynie: odwiedzający próbuje AI na żywym przykładzie. Do demo lepiej założyć osobnego klienta z wymyśloną firmą i wypełnioną bazą wiedzy: każde pytanie odwiedzającego zużywa jego dialogi i model.",
        ],
      },
      {
        id: "scout",
        title: "Skaut: grupy i jak wybiera wiadomości",
        body: [
          "Zakładka **«Skaut»** to ustawienia skauta, który czyta grupy w Telegramie i wyłapuje wiadomości, w których ktoś szuka wykonawcy. Znalezione trafia do [Sygnałów skauta](/admin/scout), mocne staje się leadem. Na dole zakładki jest **«Grupy dla skauta»**, ten sam blok co w „Sygnałach skauta”: grupę może dodać każdy, usunąć ten, kto dodał, kierownik i właściciel. Z usuniętej grupy skaut nie wychodzi, po prostu w ciągu 20 minut przestaje brać z niej wiadomości.",
          "Blok **«Jak wybierać wiadomości»** ma dwa tryby. **«Automatycznie»**: skaut sam rozpoznaje temat (strona, sklep, aplikacja, bot, automatyzacja) i prośbę „potrzebuję, szukam, kto zrobi” po rosyjsku, uzbecku i angielsku, a reklamy wykonawców odrzuca. **«Według słów»**: dalej trafiają tylko wiadomości z co najmniej jednym słowem z twojej listy. Słowo łapie się od początku, więc „stron” znajdzie „strona” i „stronę”. W obu trybach model potem odróżnia zlecenie od reklamy, więc cudze ogłoszenia nie trafiają do listy. Tryb i słowa zmienia właściciel i kierownik, skaut przechodzi na nowe w ciągu 5 minut, bez restartu. Wiadomości z hashtagiem (#strona, #praca) skaut nie bierze w żadnym trybie: tak piszą ogłoszenia i rozsyłki, a nie zleceniodawcy.",
        ],
      },
      {
        id: "claudery",
        title: "Claudery: bot zdalnej pomocy i kreator",
        body: [
          "Zakładka **«Claudery»** to bot, który przyjmuje płatne zgłoszenia pomocy z sieciami neuronowymi. Klient naciska przycisk, pisze, co się stało (można ze zrzutem ekranu), i dostaje przycisk otwarcia zgłoszenia: prowadzi on na stronę zgłoszenia w naszym serwisie. W samym bocie nie ma płatności i bot nie pisze o cenie: Telegram blokuje boty, które przyjmują płatności poza Stars. Cena i przycisk płatności Platega są na stronie zgłoszenia; każde zgłoszenie ma własny adres i przez niego płatność jest powiązana z klientem. Zgłoszenie od razu trafia do wspólnej puli leadów, rodzaj «Pomoc z AI (Claudery)», i liczy się jako etap «cena podana»: nieopłacone menedżer może domknąć. Płatność potwierdza sama Platega: serwis pyta ją, gdy klient wraca na stronę zgłoszenia, i co kilka minut przez dwie doby. Opłacone — bot sam pisze klientowi tekst z kroku «Po płatności», w leadzie pojawia się «✅ ОПЛАЧЕНО», osoba prowadząca lead oraz Ty i kierownik dostajecie wiadomość, w nocy — rano. Zrzut ekranu klienta w dzień trafia do bota studia do osób, które dostają ten rodzaj leadów.",
          "Blok **«Klucze»**: token bota z @BotFather i dwa klucze Platega — te same co u AI-prawnika. Naciśnij **«Zapisz i sprawdź»**: panel sprawdzi token w Telegramie, sam utworzy sekret dla serwera i pokaże nazwę bota w «Połączeniu». Blok **«Co widzi klient»** to ścieżka klienta, zawsze jedna: powitanie → «co się stało» → link do zgłoszenia (płatność na stronie) → wiadomość po płatności. Bot pisze tylko po rosyjsku. Zmieniasz tylko słowa: tekst powitania i napis na głównym przycisku, pytanie, tekst z linkiem do zgłoszenia i kwotę, tekst po płatności. W tekstach bota nie pisz o płatności ani cenie: są na stronie zgłoszenia. Pod powitaniem można dodać do czterech własnych przycisków, na przykład «Gwarancja»: przycisk odpowiada Twoim tekstem (z przyciskiem powrotu) albo otwiera link https. W polu «Warunki i gwarancja» wpisz to, co obiecujesz klientowi: ten tekst stoi w ofercie (przycisk **«Oferta dla klientów»**), dane przedsiębiorcy w ofercie pochodzą z magazynu. Naciśnij **«Zapisz»**: jeśli coś jest puste albo błędne, panel powie gdzie i nie zapisze. **Ponowne zgłoszenie:** temu, kto już choć raz zapłacił (według potwierdzenia Platega, a nie słów), na stronie zgłoszenia stoi cena ze zniżką z pola «Zniżka dla tych, którzy już płacili, %» — domyślnie 30%, czyli 3 500 ₽ zamiast 5 000 ₽ — i zdanie o zniżce.",
          "**Pieniądze za opłacone zgłoszenie.** Gdy tylko Platega potwierdzi płatność, bot sam zakłada [projekt](/admin/projects) «Claudery · помощь с ИИ» z płatnością: kwota jest przeliczana na dolary po kursie Banku Centralnego Rosji z dnia płatności (kurs i ruble są w notatce projektu; gdy bank nie odpowie, ostatni znany kurs, a gdy go brak, kurs zapasowy i prośba o sprawdzenie kwoty). Dzięki temu płatność trafia do przychodu, «Finansów» i etapu «płatność». Prowadzącemu leada przysługuje 40% kwoty, bez wiersza kierownika; reszta trafia do wspólników w ich proporcji. Jeśli nikt jeszcze nie wziął leada, projekt nie ma prowadzącego, a 40% dostanie ten, kto weźmie leada. Te transakcje nie liczą się do «3 transakcji» dla grade’u i premii: mają własną stawkę.",
        ],
      },
      {
        id: "bloggers-agent",
        title: "Blogerzy: co agent robi sam",
        body: [
          "Agent szuka blogerów z Uzbekistanu, którzy mogą przyprowadzać studiu klientów: przedsiębiorców, ekspertów, marketerów, blogerów IT. Szuka w internecie przez Firecrawl według zapytań z **«Ustawienia agenta»**, po kolei: za każdym razem bierze zapytanie, którego najdłużej nie używał. Z wyników bierze profile na Instagramie i nicki z artykułów z zestawieniami blogerów. Kredyty Firecrawl idą z tego samego dziennego limitu co wyszukiwanie firm do kontaktów: agent wydaje nie więcej niż swoją część «Kredytów wyszukiwania dziennie» (domyślnie 2) i nie więcej, niż zostało z limitu ogólnego, więc wyszukiwanie firm przez blogerów nie staje.",
          "Włączony agent (**«Włącz agenta»**) pracuje sam co pięć minut od 9:00 do 20:00 czasu Taszkentu: ocenia do trzech znalezionych blogerów, a gdy nie ma kogo oceniać, robi jedno wyszukiwanie. Wyłączony niczego nie szuka i nie wydaje, ale dwa przyciski działają zawsze: **«Szukaj teraz»** robi taki przebieg od razu, o dowolnej porze, a **«Dodaj blogera»** dodaje blogera po nicku lub linku do profilu i od razu go ocenia, bez Firecrawl.",
          "Wiersz «Źródła» pokazuje, co jest podłączone. «Wyszukiwanie w internecie» to ile kredytów agent wydał dziś ze swojej części. «Liczby z Instagrama» to czy jest oficjalny dostęp Instagrama do cudzych profili (Business Discovery): bez niego agent zna tylko liczbę obserwujących z wyników wyszukiwania, a polubień, komentarzy i częstotliwości postów nie. «Rozmowy w Direct» to czy podłączona jest aplikacja Instagrama, przez którą agent będzie mógł sam odpowiadać blogerom w Direct studia. Dopóki nie jest podłączona, rozmowę prowadzi człowiek.",
        ],
      },
      {
        id: "bloggers-score",
        title: "Jak agent ocenia blogera",
        body: [
          "Punkty od 0 do 100 liczy kod, a nie model, i składają się z pięciu części. Wielkość odbiorców do 20: najlepiej od 10 do 100 tysięcy obserwujących, a poza zakresem «Obserwujących od» i «Obserwujących do» bloger odpada. Zaangażowanie do 30: ile średnio polubień i komentarzy mają ostatnie 12 postów, w procentach od obserwujących. Od 3% dobrze, poniżej 1% odbiorcy prawie nie reagują, powyżej 25% przy blogu od 10 tysięcy wygląda na sztuczne podbijanie. Aktywność do 15: ile postów tygodniowo, a ostatni post starszy niż 45 dni daje zero. Uzbekistan do 15. Tematyka do 20.",
          "Tematy, język, miasto i to, czy odbiorcy pasują, czyta tani model (Haiku) z opisu profilu i podpisów pod postami: wysoko biznes, marketing, IT, eksperci z własnymi klientami; nisko humor, gry, uczniowie. Jego zdanie o tym, dlaczego tak, widać na karcie. Czegoś nie wiemy: agent stawia środek skali i pisze na żółto, czego brakuje; bloger spoza Uzbekistanu odpada od razu. Poniżej «Próg punktowy» (domyślnie 55) bloger trafia do «Odrzuceni»: tam można go **«Przywróć»** albo **«Oceń ponownie»**.",
          "Obok liczb jest napisane, skąd są: «liczby z Instagrama» są dokładne, z oficjalnego dostępu; «liczby z wyszukiwarki» to tylko obserwujący z wyników. Miasta, wiek i zasięgi odbiorców widzi tylko sam bloger w swoich statystykach, więc gdy odpowie, warto poprosić go o zrzuty ekranu statystyk.",
        ],
      },
      {
        id: "bloggers-send",
        title: "Pierwsza wiadomość: Telegram, Direct, e-mail",
        body: [
          "Pasujący bloger trafia do «Do wysłania» z gotowym tekstem. Gdzie pisać, agent decyduje według kontaktów z opisu profilu i z jego strony: jest Telegram, to tam; jest e-mail, to na e-mail; nie ma ani jednego, ani drugiego, to do Direct na Instagramie. Tekst to szablon, a nie model: kim jesteśmy, co proponujemy i warunki programu partnerskiego. Procenty i minimalna wypłata pochodzą z zasad programu, te same co w [«Partnerzy»](/admin/partners) i na stronie programu na naszej witrynie: własnych liczb agent nie wymyśla. Język tekstu to rosyjski albo uzbecki, w zależności od tego, w jakim języku bloger prowadzi bloga.",
          "Instagram nie pozwala pisać pierwszym przez swój oficjalny dostęp, a logować się na konto studia obcym programem nie będziemy: Instagram za to blokuje konto. Dlatego do Direct i na e-mail wysyła człowiek ze swojego telefonu: **«Skopiuj i otwórz Direct»** kopiuje tekst do schowka i otwiera rozmowę z blogerem w aplikacji Instagram, a **«Skopiuj i otwórz pocztę»** otwiera gotowy list. Wklej, wyślij i naciśnij **«Wysłałem»**: bloger przechodzi do «Napisaliśmy, czekamy na odpowiedź». Wysyłaj z konta studia na Instagramie: odpowiedź blogera przyjdzie tam.",
          "Dziennie nie więcej niż «Direct i e-mail dziennie» (domyślnie 10): wiele jednakowych pierwszych wiadomości z jednego konta Instagram uznaje za spam. Norma wykonana: przyciski wysyłania znikają do jutra. Blogerom z Telegramem, tak jak firmom w kontaktach, jako pierwsze z konta roboczego studia idzie tylko powitanie, a blogerzy mają własny limit «Telegram dziennie» (domyślnie 3), który nie rusza normy 20 kontaktów z firmami. **«Nie pasuje»** usuwa blogera z listy. Menedżer widzi zakładkę «Blogerzy», jeśli właściciel otworzył mu dział w [«Zespół»](/admin/team): wysyła teksty, zaznacza odpowiedzi i może sam prowadzić rozmowę, a ustawień agenta, wyszukiwania, oceny, Instagrama studia i zakładania partnera nie widzi.",
        ],
      },
      {
        id: "bloggers-partner",
        title: "Bloger odpowiedział: rozmowa i partnerstwo",
        body: [
          "Bloger odpowiedział, dalej rozmowę prowadzi agent. Odpowiedź w Telegramie widzi sam: na pierwszą wiadomość blogera z tego samego konta roboczego idzie tekst o programie w języku odpowiedzi, potem odpowiada agent. W Direct tak samo, gdy Instagram studia jest podłączony przyciskiem **«Podłącz Instagram studia»**: bloger, do którego napisałeś z konta studia, odpowiada, a agent znajduje go po nicku. Dopóki Direct nie jest podłączony, odpowiedź w Direct zaznaczasz sam, **«Odpowiedział»** w «Napisaliśmy, czekamy na odpowiedź», i prowadzisz rozmowę z telefonu.",
          "Agent to tani model (Haiku). W pierwszej swojej wiadomości mówi, że jest asystentem AI studia, podaje tylko warunki z zasad programu (liczb spoza zasad nie przepuści sprawdzenie kodu) i, jeśli bloger jest zainteresowany, prosi o zrzuty ekranu statystyk: miasta, wiek, zasięg z 30 dni. Zrzuty czyta model obsługujący obrazy, a punkty odbiorców wystawia kod: skąd są obserwujący do 40, udział osób w wieku 25–44 do 30, zasięg względem obserwujących do 30. Widać je na karcie w wierszu «Odbiorcy». Samych zrzutów nie przechowujemy, tylko wniosek.",
          "Zgodził się i punkty odbiorców od 60: agent sam zakłada partnera w [«Partnerzy»](/admin/partners) i wysyła blogerowi link, a właściciel i kierownik dostają wiadomość w bocie. Punkty niższe albo brak zrzutów: decydujesz ty, **«Zrób partnerem»** albo **«Odmowa»**. Prosi o człowieka, specjalne warunki albo odpowiedź nie przeszła sprawdzenia: agent milknie na 12 godzin, a ty dostajesz wiadomość w bocie. Odpisałeś blogerowi sam z konta studia albo nacisnąłeś **«Prowadzę sam»**: agent też milczy 12 godzin, a **«Oddaj agentowi»** włącza go znowu. Partner zakłada się bez Telegrama: bloger nie zobaczy salda w bocie, podawaj mu je sam.",
        ],
      },
      {
        id: "bloggers-keys",
        title: "Połączenia z Instagramem: jakie klucze i skąd je wziąć",
        roles: ["admin", "head"],
        body: [
          "Blok **«Połączenia z Instagramem»** to klucze od Meta (firmy od Facebooka i Instagrama), bez których agent działa na pół gwizdka. Wklej klucz w pole i kliknij **«Zapisz i sprawdź»**: serwer odłoży go do magazynu sekretów, gdzie jest zaszyfrowany. Klucz nie wraca na ekran, widać tylko «ustawiono» albo «puste», a puste pole przy zapisie nie zmienia klucza. Jeśli klucz jest w .env na serwerze, ma pierwszeństwo przed magazynem i obok pola jest to napisane. Do dziennika trafia tylko to, jaki klucz wklejono, bez wartości.",
          "«1. Liczby cudzych profili» — token Facebooka, zaczyna się od EA…. Z nim agent widzi u blogera dokładnych obserwujących, polubienia, komentarze i to, jak często publikuje (oficjalny dostęp Business Discovery); bez niego — tylko liczbę obserwujących z wyników wyszukiwania. Token bierze się w Graph API Explorer z uprawnieniami z podpowiedzi i przedłuża do 60 dni w «Access Token Debugger»; wszystkie kroki z linkami są pod «Skąd wziąć — krok po kroku». Numeru konta Instagram studia nie trzeba wpisywać: sprawdzenie samo znajdzie go po tokenie i spróbuje pobrać liczby cudzego profilu. Po sprawdzeniu w bloku jest napisane, czy działa i do kiedy ważny jest token; tydzień przed końcem wiersz robi się żółty — powtórz kroki 3 i 4.",
          "«2. Odpowiedzi blogerom w Direct» — ID i sekret aplikacji Instagram z panelu deweloperskiego Meta. Token weryfikacyjny webhooka tworzy się sam przy pierwszym zapisie: jego, adres webhooka i dwa adresy powrotu wkleja się w ustawienia aplikacji przyciskiem «Kopiuj». Potem kliknij **«Podłącz Instagram studia»** w wierszu «Rozmowy w Direct». Częsty błąd to wklejenie ogólnego numeru aplikacji zamiast «Instagram app ID»: wtedy Instagram przy podłączaniu pisze «Invalid request» (krok 3 mówi, gdzie jest właściwy). Dopóki aplikacja ma w panelu Meta status «Unpublished», agent dostaje wiadomości tylko od kont testerów. Żeby pisali do niego wszyscy blogerzy, aplikacja przechodzi listę wymagań na swoim «Dashboard»: «testy» (choć jedno udane odwołanie do Instagrama przy każdym uprawnieniu, robi je samo podłączenie), «Business verification» (dokumenty działalności, od kilku dni do kilku tygodni), «App Review» (opis i nagrania ekranu po angielsku) i «Publish» — kroki 9–12 pod «Skąd wziąć — krok po kroku». Liczbom cudzych profili to wszystko nie jest potrzebne. Gdy wszystko jest ustawione i sprawdzenie przeszło, blok zwija się do jednego wiersza.",
        ],
      },
      {
        id: "bloggers-access",
        title: "Komu otwarty jest dział",
        roles: ["admin"],
        body: [
          "Na dole karty jest blok **«Komu otwarty jest dział»**: kierownicy i menedżerowie ze znacznikami. Domyślnie dział jest otwarty tobie i kierownikowi. Zaznaczonemu menedżerowi otwiera się dział «Pracownicy AI» — zakładka «Blogerzy»: wysyła pierwsze wiadomości, oznacza odpowiedzi i może sam prowadzić rozmowę. Klucze, ustawienia agenta, wyszukiwanie i dodawanie partnera menedżer nie widzi.",
          "To ten sam znacznik co w [«Zespół»](/admin/team) → «Działy» przy każdym pracowniku: zaznaczony tutaj jest zaznaczony i tam, i odwrotnie. Po **«Zapisz dostęp»** dział otwiera się człowiekowi przy następnym przejściu w panelu, a w dzienniku zostaje wiersz «zmienił, które działy panelu są otwarte dla pracownika».",
        ],
      },
      {
        id: "bloggers-invite",
        title: "Zaproszenie «Работа с блогерами» w bocie",
        body: [
          "Na razie nie jest wysyłane: zaproszenie pójdzie, gdy agent «Blogerzy» zacznie działać i właściciel da zgodę. Właściciel 12.10.2026 zaprosił menedżerów i kierownika do pracy z blogerami: znajdować ich, pisać pierwsi, doprowadzać do «tak» i zapisywać jako partnerów. Zaproszenie przyszło na Telegram od bota studia, raz, nie w nocy: po co (własny zarobek ponad normę kontaktów: 5% zysku netto studia od wszystkich klientów przyprowadzonego blogera przez pierwsze pół roku), co robić i gdzie. Pod nim dwa przyciski: «✅ Принять» i «✖ Отклонить».",
          "Odpowiedź zapisuje się raz: po kliknięciu przyciski znikają, pod zaproszeniem zostaje linijka z odpowiedzią, ponowne kliknięcie odpowiada «Ответ уже записан». «✅ Принять» od razu podłącza do pracy: menedżerowi otwiera się ta sekcja, zakładka «Blogerzy», jak znacznikiem właściciela, a bot przysyła notatkę PDF z tekstami pierwszej wiadomości i odpowiedziami na zastrzeżenia. Kierownik ma sekcję otwartą i tak, dostaje tylko notatkę. «✖ Отклонить» niczego nie otwiera; jeśli zmienisz zdanie, napisz do kierownika lub właściciela.",
        ],
      },
      {
        id: "bloggers-invite-answers",
        title: "Kto przyjął zaproszenie",
        roles: ["admin", "head"],
        body: {
          admin: [
            "Każda odpowiedź przychodzi do Ciebie w bocie linijką «Imię przyjął / odmówił» razem z bieżącym podsumowaniem: kto przyjął, kto odmówił, kto milczy. O 18:00 w dniu wysyłki podsumowanie przychodzi jeszcze raz, jedną wiadomością. Zaraz po wysyłce bot przysyła kopię zaproszenia: tekst, który poszedł do menedżerów w Twoim imieniu.",
            "Menedżerowi, który przyjął, sekcja «Pracownicy AI» otwiera się znacznikiem w [«Zespół»](/admin/team) → «Działy». Ten sam znacznik możesz odznaczyć, jeśli trzeba zamknąć sekcję z powrotem: odpowiedź w zaproszeniu zostaje, zaproszenie nie pójdzie ponownie. W zakładce «Blogerzy» menedżer może to samo co ze znacznikiem: wysyłać pierwsze wiadomości i oznaczać odpowiedzi; ustawienia agenta, wyszukiwanie i dodawanie partnera zostają u Ciebie i kierownika.",
          ],
          head: [
            "Każda odpowiedź menedżera przychodzi do Ciebie w bocie linijką «Imię przyjął / odmówił». Podsumowanie całego zespołu (kto przyjął, kto odmówił, kto milczy) dostaje właściciel o 18:00 w dniu wysyłki.",
            "Menedżerowi, który przyjął, otwiera się zakładka «Blogerzy»: wysyła pierwsze wiadomości i oznacza odpowiedzi, a ustawienia agenta, wyszukiwanie i dodawanie partnera zostają u Ciebie i właściciela. Gdy bloger powie menedżerowi «tak», zaznacz w karcie partnera, kto go przyprowadził: bez tego nie da się naliczyć menedżerowi premii.",
          ],
        },
      },
    ],
  },

  /* ── Обучение ─────────────────────────────────────────────────────── */
  "/admin/learn": {
    what: "Kursy sprzedaży — o tym, jak studio naprawdę pisze do firm — i test z panelu. Każdy kurs to kilka krótkich lekcji z prawdziwymi zdaniami i test na końcu; test z panelu pyta o działy, które masz otwarte. Testy można zdać tutaj albo w bocie studia w Telegramie.",
    items: [
      {
        id: "switch",
        title: "Wyłącznik: zespół widzi dział dopiero po twoim kliknięciu",
        roles: ["admin"],
        body: [
          "Dopóki szkolenia są wyłączone, dział widzisz tylko ty: kierownicy i menedżerowie nie mają go ani w menu, ani w instrukcji, strona przekierowuje ich na główną, a bot na /learn odpowiada, że szkolenia nie są jeszcze włączone. Obowiązek i próg zaliczenia w tym czasie nikogo nie dotyczą. Sam możesz rozwiązać każdy kurs i test — w panelu i w bocie — żeby sprawdzić, jak to wygląda.",
          "Na górze działu jest żółty pasek i przycisk **«Włącz szkolenia dla zespołu»**. Po kliknięciu dział pojawia się w menu u wszystkich, /learn dochodzi do menu bota u zespołu, a menedżerowie widzą blok «Zostało do zaliczenia». Pasek robi się zielony, a w miejscu przycisku jest **«Wyłącz szkolenia»**: chowa dział z powrotem, wyniki się nie gubią. Kto i kiedy włączał i wyłączał, widać w [Dzienniku](/admin/audit).",
          "Próg i obowiązek są zapisane w kodzie (`lib/learn/rules.ts`): teraz 70% poprawnych odpowiedzi, kursy obowiązkowe dla menedżerów. Decyzja właściciela z 12.10.2026; zmiana to edycja jednej linii.",
        ],
      },
      {
        id: "courses",
        title: "Kursy sprzedaży",
        body: [
          "Sześć kursów: „Kontakt w dwóch krokach”, „Kółko”, „+ — zgoda na makietę”, „Obiekcje”, „Podejścia w wiadomościach” i „Ciepłe leady”. To nie ogólne rady z książek, tylko nasz proces: dlaczego najpierw wychodzi samo powitanie, kiedy zamiast kółka idzie wiadomość, co jest „tak” na kółko, co odpowiedzieć na „drogo” i „proszę przysłać ofertę”, jak działa kolejka ciepłych leadów. W kursie o podejściach są prawdziwe teksty autoprzebiegu — te same, co w [«Zimne kontakty»](/admin/prospect) → «Teksty wiadomości i A/B».",
          "Kurs otwiera się kartą w bloku **«Kursy sprzedaży»**. W środku są lekcje po kolei, pod nimi **«Materiały»** — linki dodawane przez właściciela (wideo, nagrania rozmów, artykuły) — i test. Na karcie kursu widać, ile ma lekcji i pytań, oraz twój najlepszy wynik: zaliczony, niezaliczony z najlepszym wynikiem albo jeszcze nierozwiązany.",
        ],
      },
      {
        id: "quiz",
        title: "Jak rozwiązywać test",
        body: [
          "Kliknij **«Rozpocznij test»**. Pytania idą po jednym, warianty są wymieszane. Po wyborze od razu widać, czy dobrze; jeśli źle — która odpowiedź jest poprawna, dlaczego, i link **«Przeczytaj lekcję jeszcze raz»** (w teście z panelu — **«Otwórz punkt instrukcji»**). Dalej **«Następne pytanie»**, na ostatnim **«Zakończ test»**. Pasek u góry pokazuje postęp.",
          "Zaliczone — od 70% poprawnych odpowiedzi. Pytania nie da się pominąć: bez odpowiedzi liczy się jako błędne. Podchodzić można dowolnie wiele razy — **«Spróbuj ponownie»**, liczy się najlepszy wynik. Odpowiedzi sprawdza serwer, a nie przeglądarka, i każda próba jest zapisywana.",
          "Te same testy są w bocie studia w Telegramie: napisz mu /learn i wybierz test. Bot wysyła pytanie z ponumerowanymi wariantami i przyciskami z numerami, po kliknięciu odpowiada, czy dobrze, z wyjaśnieniem, a na końcu podaje wynik. Wynik z bota trafia do tej samej tabeli co z panelu. Bot pisze po rosyjsku, dopóki nie nauczy się języka panelu.",
        ],
      },
      {
        id: "panel-quiz",
        title: "Test z panelu",
        body: [
          "**«Test z panelu»** sprawdza, jak znasz działy panelu: kolejkę leadów, [porcję dnia](#prospect-portion), powitanie i kółko, makiety, projekty, finanse. Pytania zebrano z tej instrukcji i każde prowadzi do swojego punktu: pomyłka — obok link dokładnie tam, gdzie o tym napisano.",
          "Pytania dotyczą tylko działów, które masz otwarte, i punktów, które widzi twoja rola. Dlatego menedżer i kierownik mają ich różną liczbę: kierownik odpowiada także o «Zespół», «Partnerzy» i «Konta».",
        ],
      },
      {
        id: "required",
        title: "Co jest obowiązkowe",
        body: {
          manager: [
            "Szkolenia są obowiązkowe dla menedżerów — decyzja właściciela z 12.10.2026: każdy kurs i test z panelu, od 70% poprawnych odpowiedzi. Na górze działu jest blok **«Zostało do zaliczenia»** — co jeszcze niezaliczone, z linkiem do kursu. Gdy zaliczysz wszystko, pojawi się tam informacja, że wszystko obowiązkowe jest zaliczone.",
            "Nie blokuje to pracy: karty, porcja dnia i leady przychodzą jak zwykle. Ale kierownik i właściciel widzą, kto co zaliczył — przejdź kursy w pierwszych dniach.",
          ],
          head: [
            "Kursy są obowiązkowe dla menedżerów — decyzja właściciela z 12.10.2026: każdy kurs i test z panelu, od 70% poprawnych odpowiedzi. Dla ciebie dobrowolnie, ale test z panelu warto zrobić samemu: widać, o co pytani są twoi menedżerowie.",
            "Obowiązek nie blokuje pracy — tylko się wyświetla: menedżer ma blok «Zostało do zaliczenia», ty — kolumnę **«Niezaliczone»** w [wynikach zespołu](#learn-results).",
          ],
          admin: [
            "Gdy szkolenia są włączone, kursy są obowiązkowe dla menedżerów: każdy kurs i test z panelu, od 70% poprawnych odpowiedzi. Kierownikowi i tobie — dobrowolnie. Wyłączone — obowiązek nikogo nie dotyczy, zobacz [wyłącznik](#learn-switch).",
            "Nie blokuje pracy — tylko się wyświetla: menedżer ma blok «Zostało do zaliczenia», ty i kierownik — kolumnę **«Niezaliczone»** w [wynikach zespołu](#learn-results). „Nowy” menedżer to dodany po uruchomieniu działu; jemu, jak i pozostałym, kursy są obowiązkowe, dopóki ich nie zaliczy.",
          ],
        },
      },
      {
        id: "results",
        title: "Wyniki zespołu",
        roles: ["admin", "head"],
        body: [
          "Na dole działu jest tabela **«Wyniki zespołu»**: w wierszu pracownik i jego rola, w kolumnach każdy kurs i test z panelu. W komórce najlepszy wynik, np. „5/6”: zielony — zaliczony, żółty — jeszcze nie, kropka — nie podchodził. Znaczek **«nowy»** to menedżer dodany po uruchomieniu działu.",
          "Gdy szkolenia są włączone, ostatnia kolumna **«Niezaliczone»** wymienia, co menedżerowi zostało do zaliczenia, albo pisze, że wszystko zaliczone; u kierownika i właściciela jest tam **«dobrowolnie»**. Tabela zbiera próby z panelu i z bota. Do kogoś, kto zostaje w tyle, lepiej napisać osobiście i zaproponować wspólne omówienie błędów: test pokazuje, co wyjaśnić, a nie kogo ganić.",
        ],
      },
      {
        id: "video-course",
        title: "Kurs wideo dla menedżerów",
        body: {
          manager: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny: co sprzedaje studio, słowa «landing» i «konwersja» prostymi słowami, droga klienta od powitania do umowy, obawy właścicieli i co im odpowiadać, sprzedaż na zaufaniu i poczta pantoflowa. Mowa po rosyjsku, napisy po uzbecku, na ekranie nasze prawdziwe makiety.",
            "Oglądaj po kolei, po jednym filmie. W każdym jest zadanie: lektor prosi o pauzę, zatrzymaj i odpowiedz sam, potem obejrzyj omówienie. W filmach nie ma cen ani terminów, których studio nie obiecuje, i nie są sprzeczne z kursami powyżej: kursy to szczegółowe zasady, filmy to ogólny obraz. Jeśli pod filmem jest «Film nie został jeszcze wgrany.», po prostu jeszcze go nie dodano.",
          ],
          head: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny: co sprzedaje studio, droga klienta, obawy właścicieli, sprzedaż na zaufaniu i poczta pantoflowa. Mowa po rosyjsku, napisy po uzbecku. Filmy widzi każdy, kto ma otwarte «Szkolenia».",
            "Pod każdym filmem jest zwinięty blok **«Wgraj lub podmień film»**: wybierz **«Język wideo»** (filmy kursu są rosyjskie, ustaw «Rosyjski») i plik MP4, kliknij **«Wgraj»**. Plik idzie w kawałkach i sam się dociąga, jeśli połączenie mignęło. Nowy film zastępuje stary w tym samym języku, **«Usuń»** go kasuje. Pliki filmów właściciel dostał osobno, kolejność według numeru na liście.",
          ],
          admin: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny, według scenariuszy zatwierdzonych przez ciebie 13.10.2026 (`docs/training/video-guides`). Mowa po rosyjsku głosem Vosk, napisy po uzbecku. Filmy widzi każdy, kto ma otwarte «Szkolenia»: dopóki dział jest wyłączony, tylko ty.",
            "Pod każdym filmem jest zwinięty blok **«Wgraj lub podmień film»**: wybierz **«Język wideo»** («Rosyjski») i plik MP4 z tym samym numerem, kliknij **«Wgraj»**. Wgrywać może też kierownik. Nowy film zastępuje stary w tym samym języku, **«Usuń»** go kasuje; kto co wgrał, widać w [Dzienniku](/admin/audit). Film leży na serwerze obok filmów do instrukcji.",
          ],
        },
      },
      {
        id: "materials",
        title: "Materiały do kursu",
        body: {
          manager: [
            "W kursie pod lekcjami jest blok **«Materiały»**: linki dodane przez właściciela — wideo, nagrania udanych rozmów, artykuły. Otwierają się w nowej karcie. Gdy linków nie ma, widać informację, że materiałów jeszcze nie ma: kurs da się przejść i bez nich.",
          ],
          head: [
            "W kursie pod lekcjami jest blok **«Materiały»**: linki dodane przez właściciela — wideo, nagrania udanych rozmów, artykuły. Otwierają się w nowej karcie. Znalazłeś coś przydatnego dla zespołu — wyślij właścicielowi, doda.",
          ],
          admin: [
            "W każdym kursie i w teście z panelu pod lekcjami jest blok **«Materiały»**. Wpisz **«Nazwa»** i **«Link»** (tylko adres zaczynający się od https:// albo http://) i kliknij **«Dodaj materiał»** — link od razu pojawi się u wszystkich, którzy mają otwarty dział. **«Usuń materiał»** obok linku go usuwa. Dodawać i usuwać możesz tylko ty; każde działanie trafia do [Dziennika](/admin/audit).",
          ],
        },
      },
    ],
  },

  /* ── Настройки ───────────────────────────────────────────────────── */
  "/admin/settings": {
    what: "Wszystko, co się ustawia w panelu, na jednej stronie. Otwiera się zębatką ⚙ w nagłówku, obok twojego imienia. Swoje zmieniasz od razu tutaj, resztę — linkiem tam, gdzie mieszka: przyciski, uprawnienia i sprawdzenia są tam jak dotąd. Strona jest zawsze otwarta dla wszystkich, zaznaczeniem jej nie zamkniesz.",
    items: [
      {
        id: "mine",
        title: "«Moje»: język, menu, telefon i bot",
        body: {
          manager: [
            "Blok **«Moje»** zmienia tylko twoje, na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** — RU, UZ albo PL, ten sam przełącznik co w nagłówku; wiadomości bota na razie po rosyjsku. **«Wygląd menu»** — przełącznik «Nowe menu»: włączony — pasek ikon po lewej, «Więcej», karty i wyszukiwanie, wyłączony — wszystkie sekcje w jednym wierszu, jak dawniej. **«Powiadomienia na tym urządzeniu»** — push z tym samym tekstem, który bot pisze ci w Telegramie; włącza się osobno na każdym telefonie i komputerze, jak kartą na [Pulpicie](/admin/hq). Obok przełącznika menu — **«Pokaż jeszcze raz poznawanie panelu»**: te same 7 kroków, co przy pierwszym wejściu po odświeżeniu 03.11.2026 (zmienił się wygląd, funkcje te same). Tam też — **«Pokaż na ekranie, jak korzystać z „Rynków”»**: krótkie szkolenie z działu [«Rynki»](/admin/markets).",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi. Zaznaczenia ustawia kierownik albo właściciel w «Zespół»: poproś ich, jeśli czegoś jest za dużo albo brakuje. Baza nie odpowiedziała — wiersz tak powie, a nie napisze «przychodzi wszystko».",
          ],
          head: [
            "Blok **«Moje»** zmienia tylko twoje, na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** — RU, UZ albo PL, ten sam przełącznik co w nagłówku; wiadomości bota na razie po rosyjsku. **«Wygląd menu»** — przełącznik «Nowe menu»: włączony — pasek ikon po lewej, «Więcej», karty i wyszukiwanie, wyłączony — wszystkie sekcje w jednym wierszu, jak dawniej. **«Powiadomienia na tym urządzeniu»** — push z tym samym tekstem, który bot pisze ci w Telegramie; włącza się osobno na każdym telefonie i komputerze, jak kartą na [Pulpicie](/admin/hq). Obok przełącznika menu — **«Pokaż jeszcze raz poznawanie panelu»**: te same 7 kroków, co przy pierwszym wejściu po odświeżeniu 03.11.2026 (zmienił się wygląd, funkcje te same). Tam też — **«Pokaż na ekranie, jak korzystać z „Rynków”»**: krótkie szkolenie z działu [«Rynki»](/admin/markets).",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi, a link obok prowadzi do [Zespołu](/admin/team), do zaznaczeń pod twoim imieniem. Baza nie odpowiedziała — wiersz tak powie, a nie napisze «przychodzi wszystko».",
          ],
          admin: [
            "Blok **«Moje»** zmienia tylko twoje, na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** — RU, UZ albo PL, ten sam przełącznik co w nagłówku; wiadomości bota na razie po rosyjsku. **«Wygląd menu»** — przełącznik «Nowe menu»: włączony — pasek ikon po lewej, «Więcej», karty i wyszukiwanie, wyłączony — wszystkie sekcje w jednym wierszu, jak dawniej. **«Powiadomienia na tym urządzeniu»** — push z tym samym tekstem, który bot pisze ci w Telegramie; włącza się osobno na każdym telefonie i komputerze, jak kartą na [Pulpicie](/admin/hq). Obok przełącznika menu — **«Pokaż jeszcze raz poznawanie panelu»**: te same 7 kroków, co przy pierwszym wejściu po odświeżeniu 03.11.2026 (zmienił się wygląd, funkcje te same). Tam też — **«Pokaż na ekranie, jak korzystać z „Rynków”»**: krótkie szkolenie z działu [«Rynki»](/admin/markets).",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi, a link obok prowadzi do [Zespołu](/admin/team), do zaznaczeń pod twoim imieniem. Baza nie odpowiedziała — wiersz tak powie, a nie napisze «przychodzi wszystko».",
          ],
        },
      },
      {
        id: "leads",
        title: "«Jakie leady wysyłać»: wybierasz sam",
        body: [
          "W bloku **«Moje»** jest wiersz **«Jakie leady wysyłać»** — siedem pól według rodzaju leada: «Zimne kontakty» (klient odpowiedział na «Dzień dobry» z konta roboczego i zgodził się na makietę), «Przetargi» (loty zamówień publicznych znalezione przez skauta), «Sygnały z grup (skaut)» (ktoś w grupie Telegram szuka wykonawcy), «Partnerzy i agencje» (klient przyszedł z linku lub kodu partnera, od blogera albo agencji), «Zgłoszenia ze strony i z bota» (formularz, czat na stronie, rozmowa z botem, witryna, lista oczekujących DevUz Box) i «Makieta z bota» oraz «Pomoc z AI (Claudery)» (płatne zgłoszenie z bota Claudery). Domyślnie zaznaczone są wszystkie. Odznacz zbędne i kliknij **«Zapisz»** — u góry pojawi się plakietka, że zapisano. Rodzaj leada panel ustala sam po tym, skąd lead przyszedł, bez sieci neuronowej.",
          "Odznaczony rodzaj to nie tylko «bot nie przyśle karty». [Kolejka](#leads-queue) też nie zaproponuje ci takiego leada: od razu trafia do osoby, która ma zaznaczone, i nie czeka u ciebie pół godziny. W nocy i poza godzinami pracy lead jak dotąd otwiera się wszystkim — ale tylko tym, którzy nie odznaczyli tego rodzaju. Jeśli tego rodzaju nie wybrał nikt, lead przychodzi do wszystkich jak dotąd, żeby klient nie przepadł, a kierownik i właściciel dostają wiersz «🧭 … nie wybrał nikt». Każdy zapis trafia do dziennika. Kierownik i właściciel mogą ustawić te pola także za ciebie — w «Zespół».",
        ],
      },
      {
        id: "links",
        title: "Kontakty i zespół — linkami",
        body: {
          manager: [
            "Blok **«Kontakty»** u menedżera to jeden wiersz, **«Teksty wiadomości i A/B»**: twoje teksty wiadomości o stronie, wspólne teksty zespołu i licznik, który tekst częściej dostaje odpowiedź. **«Otwórz»** prowadzi prosto tam, do [Zimnych kontaktów](/admin/prospect). Powitanie, automatyczne kontakty, kółka i konta ustawiają kierownik i właściciel, więc tych wierszy u ciebie nie ma.",
            "Wiersze są dobrane według twojej roli i zaznaczeń właściciela: sekcja jest dla ciebie zamknięta — nie ma i jej wiersza. Tu jest tylko to, co ci się otworzy, a same przyciski i sprawdzenia zostały na dawnych miejscach.",
          ],
          head: [
            "Blok **«Kontakty»**: «Teksty wiadomości i A/B»; «Pierwsza wiadomość» — powitanie, które idzie jako pierwsze z konta roboczego, rosyjskie i uzbeckie osobno; «Automatyczne kontakty» — norma dzienna i licznik na dziś (włącza i wyłącza właściciel); «Kółka według branż» i «Konta robocze». Blok **«Zespół i dostęp»**: «Co bot wysyła zespołowi» — zaznaczenia powiadomień każdego menedżera w [Zespole](/admin/team). **«Otwórz»** prowadzi prosto do właściwego bloku.",
            "Wiersze są dobrane według twojej roli i zaznaczeń właściciela: sekcja jest dla ciebie zamknięta — nie ma i jej wiersza. Tu jest tylko to, co ci się otworzy, a same przyciski i sprawdzenia zostały na dawnych miejscach.",
          ],
          admin: [
            "Blok **«Kontakty»**: «Teksty wiadomości i A/B»; «Pierwsza wiadomość» — powitanie, które idzie jako pierwsze z konta roboczego, rosyjskie i uzbeckie osobno; «Automatyczne kontakty» — norma dzienna, licznik na dziś i wyłącznik; «Kółka według branż» i «Konta robocze». Blok **«Zespół i dostęp»**: «Co bot wysyła zespołowi», «Dostęp do sekcji» i «Leady bez limitu» — wszystko w [Zespole](/admin/team), pod imieniem osoby; «Szkolenia dla zespołu» — wyłącznik w [Szkoleniach](/admin/learn). **«Otwórz»** prowadzi prosto do właściwego bloku.",
            "Kierownik widzi tu wszystko oprócz dostępu do sekcji, leadów bez limitu i szkoleń: o tym decydujesz tylko ty. Menedżer — swoje ustawienia i «Teksty wiadomości i A/B». Zamknięta komuś sekcja usuwa też jej wiersz.",
          ],
        },
      },
    ],
  },

  /* ── Инструкции ───────────────────────────────────────────────────── */
  "/admin/help": {
    what: "Ta strona. Tutaj sekcja po sekcji opisane jest, jak działa panel i co od czego zależy — tylko to, do czego masz dostęp, i tak, jak to widzisz.",
    items: [
      {
        id: "how",
        title: "Jak korzystać z instrukcji",
        body: [
          "W nagłówku każdej sekcji jest przycisk «Jak korzystać z sekcji»: otwiera tutaj punkt o tej sekcji. Przy złożonych blokach w sekcjach jest mały «?», który prowadzi prosto do właściwego punktu.",
          "Na górze — spis treści i przełącznik języka instrukcji. Sama instrukcja, zarówno z przycisku sekcji, jak i ze «?», otwiera się w [języku panelu](#help-language).",
          "Jeśli czegoś brakuje albo opis nie zgadza się z tym, co widzisz na ekranie — powiedz właścicielowi, uzupełnimy.",
        ],
      },
      {
        id: "crash",
        title: "Strona się nie załadowała",
        body: [
          "Czasem zamiast strony na sekundę pojawia się «Odświeżamy stronę…»: tak bywa przy krótkiej przerwie w połączeniu z serwerem, gdy nie doszła odpowiedź na przejście lub przycisk. Panel sam ponownie pobiera stronę, jak po kliknięciu odświeżenia w przeglądarce; wszystko, co już zapisałeś, jest na miejscu. Błąd jest przy tym zapisywany, żeby programista znalazł i usunął jego przyczynę.",
          "Jeśli strona nie wstanie także za drugim razem, pojawi się «Strona się nie załadowała» i przycisk «Odśwież». Kliknij go; jeśli powtarza się często, napisz do kierownika, na jakiej stronie i o której: po zapisie błędu przyczynę znajdzie się szybciej.",
        ],
      },
      {
        id: "menu",
        title: "Menu: pasek ikon, «Więcej» i wyszukiwanie",
        body: {
          manager: [
            "Od 03.11.2026 panel wygląda jak «DevUz Biuro». To, czego używa się codziennie, jest na **pasku ikon** po lewej (na telefonie — na dole ekranu, z krótkimi podpisami): «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania» (na ikonie — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Zimne kontakty», «Makiety». Najedź myszą na ikonę — pokaże się jej nazwa; otwarta sekcja świeci się na zielono. Reszta jest pod przyciskiem **«Więcej»** na dole paska, w grupach: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu». «Statystyki» i «Instrukcje» — tamże, osobnymi wierszami. Na górze — **górny pasek**: logo, wyszukiwanie, «Online» i czas w Taszkencie. Zębatka **⚙** po prawej, obok twojego imienia, otwiera [Ustawienia](/admin/settings): język, menu, powiadomienia na telefonie i linki do wszystkiego, co się ustawia w kontaktach i zespole. Dzwonek **🔔** obok — **«Co przyszło»**: to samo, co bot pisał ci w Telegramie, z 14 dni, nowe na górze; liczba na nim — ile jeszcze nie zaznaczono. «Otwórz» prowadzi tam, dokąd przycisk w bocie, **«✓ Zrobione»** zdejmuje wiersz z liczby, «Zaznacz wszystko» — wszystkie naraz. Zaznaczenie jest tylko twoje, w Telegramie nic się nie zmienia.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów»; «Projekty» · «Umowy»; «Statystyki» · «Etapy sprzedaży». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał.",
            "Otwarta sekcja z «Więcej» — świeci się sam przycisk «Więcej», a na jego liście otwarta sekcja jest zielona. Na telefonie na dolnym pasku jest pięć przycisków, «Makiety» — pierwszym wierszem w «Więcej»; na telefonie język panelu i imię zniknęły z górnego paska, język zmienia się w [Ustawieniach](/admin/settings). Listę «Więcej» zamyka przycisk «Zamknij menu», klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** na dole listy «Więcej» albo w [Ustawieniach](/admin/settings): sekcje znów staną w jednym rzędzie w nagłówku, jak dawniej, bez paska ikon. Włączysz go — pasek wróci. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **wyszukiwanie na górnym pasku**, obok logo (na telefonie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Zielona kropka «Online» obok wyszukiwania — urządzenie ma połączenie; żółta i «Brak sieci» — internet zniknął, przyciski panelu nie zadziałają, dopóki nie wróci.",
          ],
          head: [
            "Od 03.11.2026 panel wygląda jak «DevUz Biuro». To, czego używa się codziennie, jest na **pasku ikon** po lewej (na telefonie — na dole ekranu, z krótkimi podpisami): «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania» (na ikonie — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Zimne kontakty», «Makiety». Najedź myszą na ikonę — pokaże się jej nazwa; otwarta sekcja świeci się na zielono. Reszta jest pod przyciskiem **«Więcej»** na dole paska, w grupach: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu»; **«Marketing»** — «Ruch», «Partnerzy», «Pracownicy AI»; **«Zespół»** — «Zespół», «Szkolenia». «Statystyki» i «Instrukcje» — tamże, osobnymi wierszami. Na górze — **górny pasek**: logo, wyszukiwanie, «Online» i czas w Taszkencie. Zębatka **⚙** po prawej, obok twojego imienia, otwiera [Ustawienia](/admin/settings): język, menu, powiadomienia na telefonie i linki do wszystkiego, co się ustawia w kontaktach i zespole. Dzwonek **🔔** obok — **«Co przyszło»**: to samo, co bot pisał ci w Telegramie, z 14 dni, nowe na górze; liczba na nim — ile jeszcze nie zaznaczono. «Otwórz» prowadzi tam, dokąd przycisk w bocie, **«✓ Zrobione»** zdejmuje wiersz z liczby, «Zaznacz wszystko» — wszystkie naraz. Zaznaczenie jest tylko twoje, w Telegramie nic się nie zmienia.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów» · «Konta»; «Projekty» · «Umowy»; «Finanse» · «Wydatki»; «Ruch» · «Reklamy»; «Zespół» · «Kandydaci»; «Statystyki» · «Etapy sprzedaży». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał.",
            "Otwarta sekcja z «Więcej» — świeci się sam przycisk «Więcej», a na jego liście otwarta sekcja jest zielona. Na telefonie na dolnym pasku jest pięć przycisków, «Makiety» — pierwszym wierszem w «Więcej»; na telefonie język panelu i imię zniknęły z górnego paska, język zmienia się w [Ustawieniach](/admin/settings). Listę «Więcej» zamyka przycisk «Zamknij menu», klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** na dole listy «Więcej» albo w [Ustawieniach](/admin/settings): sekcje znów staną w jednym rzędzie w nagłówku, jak dawniej, bez paska ikon. Włączysz go — pasek wróci. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **wyszukiwanie na górnym pasku**, obok logo (na telefonie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Zielona kropka «Online» obok wyszukiwania — urządzenie ma połączenie; żółta i «Brak sieci» — internet zniknął, przyciski panelu nie zadziałają, dopóki nie wróci.",
          ],
          admin: [
            "Od 03.11.2026 panel wygląda jak «DevUz Biuro». To, czego używa się codziennie, jest na **pasku ikon** po lewej (na telefonie — na dole ekranu, z krótkimi podpisami): «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania» (na ikonie — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Zimne kontakty», «Makiety». Najedź myszą na ikonę — pokaże się jej nazwa; otwarta sekcja świeci się na zielono. Reszta jest pod przyciskiem **«Więcej»** na dole paska, w grupach: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu»; **«Marketing»** — «Ruch», «Partnerzy», «Analizy», «Pracownicy AI»; **«Zespół»** — «Zespół», «Szkolenia»; **«Raporty»** — «Statystyki», «Dziennik». «Instrukcje» — tamże, osobnym wierszem. Na górze — **górny pasek**: logo, wyszukiwanie, «Online» i czas w Taszkencie. Zębatka **⚙** po prawej, obok twojego imienia, otwiera [Ustawienia](/admin/settings): język, menu, powiadomienia na telefonie i linki do wszystkiego, co się ustawia w kontaktach i zespole. Dzwonek **🔔** obok — **«Co przyszło»**: to samo, co bot pisał ci w Telegramie, z 14 dni, nowe na górze; liczba na nim — ile jeszcze nie zaznaczono. «Otwórz» prowadzi tam, dokąd przycisk w bocie, **«✓ Zrobione»** zdejmuje wiersz z liczby, «Zaznacz wszystko» — wszystkie naraz. Zaznaczenie jest tylko twoje, w Telegramie nic się nie zmienia.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów» · «Konta»; «Makiety» · «Prototypy»; «Projekty» · «Umowy»; «Finanse» · «Wydatki»; «Zamówienia sklepu» · «Wydania»; «Ruch» · «Reklamy»; «Zespół» · «Kandydaci»; «Statystyki» · «Etapy sprzedaży»; «Dziennik» · «Użycie». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał. Zamkniesz komuś sekcję ptaszkiem — jej karty same staną u niego w menu, w tej samej grupie.",
            "Otwarta sekcja z «Więcej» — świeci się sam przycisk «Więcej», a na jego liście otwarta sekcja jest zielona. Na telefonie na dolnym pasku jest pięć przycisków, «Makiety» — pierwszym wierszem w «Więcej»; na telefonie język panelu i imię zniknęły z górnego paska, język zmienia się w [Ustawieniach](/admin/settings). Listę «Więcej» zamyka przycisk «Zamknij menu», klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** na dole listy «Więcej» albo w [Ustawieniach](/admin/settings): sekcje znów staną w jednym rzędzie w nagłówku, jak dawniej, bez paska ikon. Włączysz go — pasek wróci. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **wyszukiwanie na górnym pasku**, obok logo (na telefonie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Zielona kropka «Online» obok wyszukiwania — urządzenie ma połączenie; żółta i «Brak sieci» — internet zniknął, przyciski panelu nie zadziałają, dopóki nie wróci.",
            "Menu słucha Twoich [ptaszków sekcji](#team-sections): otworzysz komuś sekcję — pojawi się u niego w swojej grupie (na przykład «Ruch» — w «Marketingu»; jeśli to jego jedyna sekcja w tej grupie — osobnym linkiem), zamkniesz — zniknie i z grupy, i z wyszukiwania. Menedżer i kierownik mają mniej grup: grupa, w której człowiek nie ma żadnej sekcji, w «Więcej» się nie pojawia. Nowa sekcja panelu dostaje grupę przy tworzeniu — menu nie trzeba ustawiać osobno.",
          ],
        },
      },
      {
        id: "search",
        title: "Wyszukiwanie: zapytaj własnymi słowami",
        body: {
          manager: [
            "Nad spisem treści — pole **«Szukaj w instrukcji»**. Napisz pytanie własnymi słowami, tak jak zapytałbyś kolegę: «jak przekazać lead innemu menedżerowi», «dlaczego wiadomość do klienta jeszcze nie wyszła», «jak dać zadanie dwóm osobom naraz» — i kliknij **«Szukaj»**. Można pisać po rosyjsku, uzbecku albo polsku, z literówkami i bez dokładnych nazw przycisków.",
            "Pytanie analizuje model: widzi tylko punkty, które masz na tej stronie, i wybiera pasujący według sensu, a nie zgodności słów. To samo pytanie drugi raz nie trafia do modelu — odpowiedź bierze się z pamięci, od razu. Jeśli pytanie to słowa z tytułu jednego punktu, ten punkt otwiera się od razu, a model go nie czyta.",
            "Strona sama przewija się do znalezionego punktu, a on przez pięć sekund mruga zieloną ramką — od razu widać go wśród sąsiednich. Pod polem jest napisane, który punkt otwarto, a jeśli pytanie dotyczy kilku tematów — jeszcze do dwóch punktów po «Może też pasować»: kliknij, a strona przewinie się do niego i podświetli go tak samo. Tak samo podświetla się punkt, do którego trafiasz przyciskiem «Jak korzystać z sekcji», «?» przy bloku albo linkiem w instrukcji.",
            "Gdy model jest niedostępny albo pytasz częściej niż 20 razy w 10 minut, punkt dobiera się po zgodności słów i pod polem jest to napisane: sprawdź, czy to ten punkt. Nic się nie znalazło — znaczy, tego w instrukcji jeszcze nie ma: zapytaj na czacie zespołu i powiedz właścicielowi, uzupełnimy.",
          ],
          head: [
            "Nad spisem treści — pole **«Szukaj w instrukcji»**. Napisz pytanie własnymi słowami, tak jak zapytałbyś kolegę: «jak przekazać lead innemu menedżerowi», «dlaczego wiadomość do klienta jeszcze nie wyszła», «jak dać zadanie dwóm osobom naraz» — i kliknij **«Szukaj»**. Można pisać po rosyjsku, uzbecku albo polsku, z literówkami i bez dokładnych nazw przycisków.",
            "Pytanie analizuje model: widzi tylko punkty, które masz na tej stronie, i wybiera pasujący według sensu, a nie zgodności słów. To samo pytanie drugi raz nie trafia do modelu — odpowiedź bierze się z pamięci, od razu. Jeśli pytanie to słowa z tytułu jednego punktu, ten punkt otwiera się od razu, a model go nie czyta.",
            "Strona sama przewija się do znalezionego punktu, a on przez pięć sekund mruga zieloną ramką — od razu widać go wśród sąsiednich. Pod polem jest napisane, który punkt otwarto, a jeśli pytanie dotyczy kilku tematów — jeszcze do dwóch punktów po «Może też pasować»: kliknij, a strona przewinie się do niego i podświetli go tak samo. Tak samo podświetla się punkt, do którego trafiasz przyciskiem «Jak korzystać z sekcji», «?» przy bloku albo linkiem w instrukcji.",
            "Gdy model jest niedostępny albo pytasz częściej niż 20 razy w 10 minut, punkt dobiera się po zgodności słów i pod polem jest to napisane: sprawdź, czy to ten punkt. Nic się nie znalazło — znaczy, tego w instrukcji jeszcze nie ma: zapytaj na czacie zespołu i powiedz właścicielowi, uzupełnimy.",
          ],
          admin: [
            "Nad spisem treści — pole **«Szukaj w instrukcji»**. Napisz pytanie własnymi słowami, tak jak zapytałbyś kolegę: «jak przekazać lead innemu menedżerowi», «dlaczego wiadomość do klienta jeszcze nie wyszła», «jak dać zadanie dwóm osobom naraz» — i kliknij **«Szukaj»**. Można pisać po rosyjsku, uzbecku albo polsku, z literówkami i bez dokładnych nazw przycisków.",
            "Pytanie analizuje najtańszy model (Haiku): ma tylko wybrać punkt z listy, niczego nie pisze. Widzi tylko punkty z tej strony i wybiera pasujący według sensu, a nie zgodności słów. W trybie «Pokaż jako» wyszukiwanie idzie po instrukcji wybranej roli. To samo pytanie drugi raz nie trafia do modelu — odpowiedź bierze się z pamięci. Model zmienia się zmienną `HELP_SEARCH_MODEL` w .env. Pytania słowami z tytułu jednego punktu model w ogóle nie czyta: punkt otwiera się od razu i za darmo. Gdy takie słowa są w tytułach dwóch punktów, decyduje model.",
            "Strona sama przewija się do znalezionego punktu, a on przez pięć sekund mruga zieloną ramką — od razu widać go wśród sąsiednich. Pod polem jest napisane, który punkt otwarto, a jeśli pytanie dotyczy kilku tematów — jeszcze do dwóch punktów po «Może też pasować»: kliknij, a strona przewinie się do niego i podświetli go tak samo. Tak samo podświetla się punkt, do którego trafiasz przyciskiem «Jak korzystać z sekcji», «?» przy bloku albo linkiem w instrukcji.",
            "Gdy model jest niedostępny albo ktoś pyta częściej niż 20 razy w 10 minut, punkt dobiera się po zgodności słów — za darmo, i pod polem jest to napisane. Nic się nie znalazło — znaczy, takiego punktu w instrukcji nie ma: warto go dopisać.",
          ],
        },
      },
      {
        id: "video",
        title: "Wideo do sekcji",
        body: {
          manager: [
            "Na górze strony — wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Na górze sekcji — jej wideo, jeśli już je nagrano, a pod nim — szczegółowy tekst. Przycisk «Jak korzystać z sekcji» otwiera sekcję tutaj — czyli od razu wideo.",
            "Wideo wyświetla się w języku instrukcji, a jeśli w tym języku jeszcze go nie ma — w innym, i pod nim jest to napisane. Wideo nagrywają właściciel i kierownik; jeśli brakuje wideo do sekcji albo coś w nim nie zgadza się z ekranem — powiedz im.",
          ],
          head: [
            "Na górze strony — wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Na górze sekcji — jej wideo, jeśli już je nagrano, a pod nim — szczegółowy tekst. Przycisk «Jak korzystać z sekcji» otwiera sekcję tutaj — czyli od razu wideo.",
            "Wideo wgrywasz ty i właściciel. Pod opisem sekcji jest zwinięty blok «Wideo do sekcji», na górze strony — «Wideo wprowadzające». Wybierz «Język wideo» — w jakim języku się w nim mówi i są podpisy — plik MP4, MOV lub WebM do 500 MB i kliknij «Wgraj». Plik idzie częściami i sam ponawia część, przy której zerwało się połączenie; nie zamykaj strony, dopóki pasek nie dojdzie do końca. Wideo w tym samym języku zastępuje poprzednie.",
            "Wideo wyświetla się w języku instrukcji, a jeśli w nim go nie ma — w innym: najpierw rosyjskim, potem uzbeckim, potem polskim. Dlatego jedno wideo w dowolnym języku wystarczy, żeby wszyscy je mieli. «Usuń» obok języka w bloku kasuje to wideo z serwera.",
          ],
          admin: [
            "Na górze strony — wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Na górze sekcji — jej wideo, jeśli już je nagrano, a pod nim — szczegółowy tekst. Przycisk «Jak korzystać z sekcji» otwiera sekcję tutaj — czyli od razu wideo.",
            "Wideo wgrywasz ty i kierownik. Pod opisem sekcji jest zwinięty blok «Wideo do sekcji», na górze strony — «Wideo wprowadzające». Wybierz «Język wideo» — w jakim języku się w nim mówi i są podpisy — plik MP4, MOV lub WebM do 500 MB i kliknij «Wgraj». Plik idzie częściami i sam ponawia część, przy której zerwało się połączenie; nie zamykaj strony, dopóki pasek nie dojdzie do końca. Wideo w tym samym języku zastępuje poprzednie.",
            "Wideo wyświetla się w języku instrukcji, a jeśli w nim go nie ma — w innym: najpierw rosyjskim, potem uzbeckim, potem polskim. Dlatego jedno wideo w dowolnym języku wystarczy, żeby wszyscy je mieli. «Usuń» obok języka w bloku kasuje to wideo z serwera. Kto wgrał i usunął wideo — w dzienniku działań.",
          ],
        },
      },
      {
        id: "language",
        title: "Język panelu: RU / UZ / PL",
        body: [
          "W nagłówku panelu, obok «Jak korzystać z sekcji», jest przełącznik **RU / UZ / PL**: rosyjski, uzbecki (alfabetem łacińskim) i polski. Kliknij wybrany — strona od razu przerysuje się w tym języku, adres i otwarta sekcja się nie zmieniają.",
          "Język zapamiętuje się przy Tobie, a nie w przeglądarce: zalogujesz się z telefonu albo z innego komputera — panel otworzy się w tym samym języku. Język możesz zmienić tylko sobie, u współpracowników się nie zmienia. Dopóki go nie wybierzesz, panel jest po rosyjsku.",
          "Cały panel jest przetłumaczony: przyciski, podpisy i podpowiedzi są w wybranym języku. Po rosyjsku zostają tylko wiadomości i przyciski bota w Telegramie (bot na razie pisze po rosyjsku), panel partnera i treść umowy dla zamawiającego — w instrukcji są nazwane po rosyjsku, żeby łatwo było je znaleźć na ekranie.",
          "Instrukcja otwiera się w języku panelu: rosyjska, uzbecka albo polska. Inny język instrukcji możesz wybrać na górze tej strony — nie zmienia to języka panelu.",
        ],
      },
      {
        id: "first-day",
        title: "Co zrobić pierwszego dnia",
        body: [
          "Otwórz [bota studia](https://t.me/Devuz_studio_bot) i naciśnij «Start» — bez tego nie wyśle Ci ani leada, ani przypomnienia. Logowanie do panelu — komendą /login.",
          "Dołącz do kanału «Devuz Scout» i włącz dźwięk w bocie i na kanale: propozycja leada jest aktualna 30 minut, post na czacie — godzinę, dwie.",
          "Przeczytaj punkty o [kolejce leadów](#leads-queue) i [karcie leada](#leads-card) — to podstawa pracy. Resztę czytaj, gdy pierwszy raz otworzysz daną sekcję: przycisk «Jak korzystać z sekcji» jest zawsze w nagłówku.",
        ],
      },
      {
        id: "owner-view",
        title: "Zobacz oczami zespołu",
        roles: ["admin"],
        body: [
          "«Pokaż jako: właściciel / kierownik / menedżer» — instrukcja dokładnie w takiej postaci, w jakiej czyta ją osoba z tą rolą: bez Twoich sekcji i z jej tekstem. Tak sprawdzisz, co jest tłumaczone nowej osobie, bez logowania na cudze konto.",
          "Zasada dla zmian: każda nowa funkcja przychodzi razem ze swoim punktem tutaj — po rosyjsku, uzbecku i polsku, według ról. Sprawdza to test przy każdym wdrożeniu.",
        ],
      },
    ],
  },
};

export const tail: Pick<
  HelpCopy,
  "channelsTitle" | "channelsLead" | "channels" | "rulesTitle" | "rules" | "askTitle" | "ask"
> = {
  channelsTitle: "Telegram",
  channelsLead: "Prawie wszystko, co ważne, przychodzi w Telegramie: karty leadów, kolejka, przypomnienia, porcja dnia, odpowiedzi na kontakty.",
  channels: [
    {
      name: "Bot studia",
      url: BOT_URL,
      what: "Główny kanał. Przez niego logujesz się do panelu, dostajesz karty nowych leadów i propozycje z kolejki, przypomnienia, porcję dnia, wiadomości o kontaktach i przekazaniach.",
      how: [
        "Otwórz bota i naciśnij «Start» — inaczej bot nie będzie mógł napisać do Ciebie pierwszy.",
        "Napisz /login — przyjdzie przycisk «🔓 Открыть панель» i jednorazowy link ważny 15 minut. Przyciski «Открыть» pod wiadomościami też same logują do panelu. Bot odpowiedział «Не смог проверить вход: база сейчас не отвечает» — to awaria po naszej stronie, a nie Twój dostęp: odczekaj minutę i napisz /login ponownie. Odpowiedź «Такой команды у меня нет» oznacza, że Twój Telegram nie jest powiązany z pracownikiem albo zostałeś wyłączony: powiedz kierownikowi.",
        "Nie wyciszaj powiadomień: propozycja z kolejki jest aktualna 30 minut, a gdy powiadomienie milczy, lead przejdzie do następnej osoby.",
        "Jakie wiadomości wysyła bot, wybierają właściciel i kierownik projektów polami wyboru na stronie «Zespół». Czegoś nie dostajesz — zapytaj ich: możliwe, że to pole zostało odznaczone.",
        "Menedżerowie i kierownicy: przycisk «▶️ Получать лиды» na dole czatu (albo /leads) włącza strumień firm ponad porcję, «⏸ Не получать лиды» — wyłącza go. Szczegóły — w sekcji «Zimne kontakty».",
        "Napisz /ref, jeśli chcesz przyprowadzać klientów i dostawać procent.",
      ],
    },
    {
      name: "Kanał «Devuz Scout»",
      url: SCOUT_URL,
      what: "Tutaj skaut przysyła osoby, które właśnie teraz szukają programisty na otwartych czatach, oraz poranne podsumowanie. Szczegóły — w sekcji «Sygnały skauta».",
      how: [
        "Otwórz link i dołącz do kanału. Włącz dźwięk: takie posty są aktualne godzinę, dwie.",
        "Do sygnału z oznaczeniem «Сильный сигнал» nie pisz sam — przyjdzie jako lead z kolejki.",
      ],
    },
    {
      name: "Czat działu sprzedaży",
      url: null,
      roles: ["admin"],
      what: "Opcjonalny wspólny czat (`TELEGRAM_SALES_CHAT_ID`): trafia do niego, tak jak do Ciebie, kopia każdej karty leada. Bez niego wszystko działa — karty idą do każdego w prywatnej wiadomości.",
      how: [
        "Przyciski «Взять в работу» i «Отклонить» działają i tam, i w prywatnej wiadomości. Osoby, które odeszły ze studia, usuwaj z czatu ręcznie.",
      ],
    },
  ],

  rulesTitle: "Trzy zasady",
  rules: [
    "Wziąłeś leada — prowadź go: status, przypomnienie, następny krok. Nie możesz — «Zwróć do kolejki» albo «Poproś o przekazanie».",
    "Obiecałeś klientowi coś przesłać — prześlij tego samego dnia. Niedotrzymana obietnica traci klienta szybciej niż słaba strona.",
    "Coś nie działa albo wygląda dziwnie — powiedz właścicielowi od razu, nie czekaj.",
  ],

  askTitle: "Nie wychodzi?",
  ask: "Napisz do właściciela w Telegramie. Lepiej zapytać, niż zgadywać: prawie wszystko da się naprawić w pięć minut.",
};
