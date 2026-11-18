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
    what: "Tu są pliki gotowych produktów, które kupujący pobiera po zapłacie. Sekcja jest tylko u Ciebie.",
    items: [
      {
        id: "upload",
        title: "Opublikuj wersję",
        body: [
          "Wgraj archiwum ze swojego komputera do zamkniętego magazynu Supabase.",
          "Wypełnij «Opublikuj wydanie»: produkt, wersja, bucket i ścieżka do pliku. Kliknij «Opublikuj». Panel sprawdzi, czy plik jest na miejscu, i nowa wersja stanie się aktualna.",
        ],
      },
      {
        id: "downloads",
        title: "Co widzi kupujący",
        body: [
          "Kupujący pobiera plik ze strony zamówienia: do 20 razy łącznie i 10 dziennie. Każdy link do pobrania działa 60 sekund. Dopóki nie ma wydania, widzi „plik przygotowujemy”.",
          "Na górze «Wydawanie wyłączone»? Nikt nie może pobrać plików. Dostęp jednego kupującego zamyka się w sekcji [«Zamówienia sklepu»](/admin/orders).",
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
    what: "Analizy to artykuły na naszej stronie o cudzych stronach: co przeszkadza ich klientom i jak to naprawić. Zmiana pisze je co rano i od razu publikuje, bez Twojej akceptacji. Tekst sprawdza program. Tu każdą analizę możesz poprawić, zdjąć ze strony albo usunąć.",
    items: [
      {
        id: "shift",
        title: "Zmiana analiz",
        body: [
          "Codziennie o 08:03 czasu Taszkentu zmiana bierze strony z działu «Zimne kontakty», do których jeszcze nie pisaliśmy. Przegląda do 12 stron i pisze do 3 analiz po rosyjsku i uzbecku. Raport przychodzi na Telegram z linkami i informacją, czy strony są w mapie witryny.",
          "W raporcie jest napisane, dlaczego reszty stron nie wzięto: strona się nie otworzyła, błędów mało, niejasna branża albo miasto, taka analiza już jest, artykuł nie przeszedł kontroli. Medycyny i innych zakazanych branż zmiana nie analizuje. Brak raportu do 11:03? Przyjdzie ostrzeżenie.",
        ],
      },
      {
        id: "tender",
        title: "Przetargowa analiza tygodnia",
        body: [
          "Raz w tygodniu, w poniedziałek po 08:33, wychodzi analiza przetargowa. To nie cudza strona, tylko typowa specyfikacja zamówienia IT: co się w niej zwykle pomija i jak napisać ją dobrze. Artykuł nie wymienia zamawiających ani kwot.",
          "Artykuł wychodzi od razu, z oznaczeniem «przetargi i zamówienia publiczne» i bez zrzutów. Link do niego przychodzi na Telegram osobną linijką. Gdy tematy się skończą, raport to powie.",
        ],
      },
      {
        id: "marketing-articles",
        title: "Artykuły o marketingu",
        body: [
          "Na stronie «Marketing» serwisu codziennie wychodzą dwa krótkie artykuły, o 10:00 i o 16:00 czasu Taszkentu, po rosyjsku i uzbecku. Tematy dobiera się według żywych zapytań z Google Trends i Wordstatu. Każdy artykuł to kolejna strona, po której znajdują nas w wyszukiwarce.",
          "Artykuły wychodzą same i od razu trafiają do mapy witryny. Nie ma w nich procentów, kwot ani liczb spoza faktów tematu. Nie przeszedł kontroli albo nie ma go w mapie witryny? Na Telegram przyjdzie linijka z powodem. Wydanego artykułu nie zdejmiesz z panelu, napisz na czat programistów.",
        ],
      },
      {
        id: "review",
        title: "Co sprawdza program",
        body: [
          "Każdy artykuł przed publikacją sprawdza program. Firma nie jest wymieniona ani nazwą, ani adresem. Każda liczba jest w ustaleniach audytu strony. Nie ma procentów wzrostu ani obietnic «do topu».",
          "Widzisz błąd? Znajdź analizę na liście «Opublikowane»: są tam oba artykuły i adres strony, który widzisz tylko Ty. «Edytuj» zmienia tylko tekst, adres strony i zapytanie zostają.",
        ],
      },
      {
        id: "publish",
        title: "Opublikować, zdjąć, odrzucić",
        body: [
          "«Zdejmij z publikacji» przenosi analizę ze strony na listę «Do sprawdzenia», a zmiana nie wystawi jej z powrotem. «Opublikuj» przywraca analizę na stronę, potrzebne są oba artykuły. Panel od razu sprawdzi mapę witryny i powie, czy strony się znalazły.",
          "«Nie publikujemy» zostawia zdjętą analizę na liście, a zmiana do tej strony już nie wróci. Stronę do kolejki zmiany przywraca tylko przycisk «Usuń»: wpisz słowo «usuń».",
        ],
      },
      {
        id: "english",
        title: "Wersja angielska i polska",
        body: [
          "Godzinę po publikacji analiza dostaje wersję angielską i polską. Pisze je sam serwer na podstawie rosyjskiego artykułu, pod zapytanie w danym języku. Ustalenia, liczby i zrzuty są te same, nowych liczb nie ma.",
          "Nie wyszło, więc serwer spróbuje znów za sześć godzin. «Edytuj» kasuje obie wersje, napisze się je od nowa według nowego tekstu. «Zdejmij z publikacji» i «Usuń» usuwają także je.",
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
    what: "Tu pracują pracownicy AI studia, czyli programy, które część pracy robią same. «Blogerzy» szukają blogerów do programu partnerskiego. «Skaut» czyta grupy w Telegramie i wyłapuje zlecenia. «Claudery» przyjmuje płatne zgłoszenia o pomoc z AI.",
    items: [
      {
        id: "service",
        title: "Usługa i bot usługi",
        roles: ["admin"],
        body: [
          "Na górze widać, czy usługa pracowników AI dla klientów jest włączona. Wyłączona nie odpowiada nikomu: ani panel klienta, ani widżet na ich stronach, ani bot usługi. «Włącz usługę» i «Wyłącz usługę» działają w ciągu minuty.",
          "Usługa ma własnego bota w Telegramie, to nie bot studia. Tworzy się go w @BotFather, włącza tam Business Mode i wkłada token do sejfu sekretów. Potem kliknij «Podłącz bota usługi», a serwer sprawdzi token i Business Mode.",
        ],
      },
      {
        id: "ready",
        title: "Gotowość do pilotażu",
        roles: ["admin"],
        body: [
          "Blok «Gotowość do pilotażu» pokazuje, co jest ustawione: token bota, sekrety, Instagram, płatność kartą. Wartości nie widać, tylko «gotowe» albo «brak». Najważniejszy jest token bota: bez niego zgłoszenia klientów nie docierają do ich ludzi.",
          "Instagram «czeka», dopóki Meta nie sprawdzi naszej aplikacji. Do tego czasu mogą go podłączyć tylko konta testowe. Ostatnia linijka liczy zgłoszenia z miesiąca, które nie dotarły do ludzi klienta. Więcej niż zero? Sprawdź w panelu klienta, kto u niego odbiera zgłoszenia.",
        ],
      },
      {
        id: "clients",
        title: "Klienci i skąd liczby",
        roles: ["admin"],
        body: [
          "Każda karta to jeden klient usługi. «Dialogi» pokazują, ile rozmów AI prowadziło w tym miesiącu z limitu planu. Limit się skończył, AI klienta milknie, a jego ludzie dostają wiadomość.",
          "«Koszt» pokazuje wydatki na AI za miesiąc w dolarach. «Marża» to cena planu minus koszt, w sumach po kursie z ustawień serwera (zwykle 12 700). Na górze jest łączny koszt i przychód z opłaconych planów.",
        ],
      },
      {
        id: "pay",
        title: "Płatność, okres próbny i status",
        roles: ["admin"],
        body: [
          "Na razie płatność idzie przez fakturę. Pieniądze przyszły? Wybierz plan, miesiące, kwotę i sposób i kliknij «Zaznacz płatność». Termin przedłuża się od już opłaconej daty. Gdy pojawią się klucze Payme albo Click, klient zapłaci kartą sam.",
          "Nowy klient dostaje 14 dni i 100 dialogów za darmo. «Przedłuż okres próbny o 7 dni» daje czas do płatności. «Zmień status» na «pauza» albo «zablokowany» od razu zatrzymuje AI klienta.",
        ],
      },
      {
        id: "cabinet",
        title: "Panel klienta i demo",
        roles: ["admin"],
        body: [
          "«Otwórz panel klienta» wpuszcza cię do panelu klienta jako wsparcie na 2 godziny. W nagłówku panelu będzie oznaczenie wsparcia.",
          "«Pokazuj jako demo» stawia czat tego klienta na stronie usługi. Do demo lepiej założyć zmyśloną firmę: każde pytanie odwiedzającego zużywa jej dialogi.",
        ],
      },
      {
        id: "scout",
        title: "Skaut: grupy i jak wybiera wiadomości",
        body: [
          "Zakładka «Skaut» ustawia program, który czyta grupy w Telegramie i wyłapuje wiadomości, w których ktoś szuka wykonawcy. Znalezione trafiają do [«Sygnały skauta»](/admin/scout). W bloku «Grupy dla skauta» grupę może dodać każdy. Usunąć ją mogą ten, kto dodał, kierownik i właściciel.",
          "W bloku «Jak wybierać wiadomości» są dwa tryby. «Automatycznie»: skaut sam rozpoznaje prośby o stronę, bota albo aplikację po rosyjsku, uzbecku i angielsku. «Według słów»: brane są tylko wiadomości ze słowami z twojej listy, a «strona» znajdzie też «strony».",
          "Tryb i słowa zmieniają właściciel i kierownik, skaut przechodzi na nie w 5 minut. Wiadomości z hasztagiem (#praca) nie bierze nigdy: tak pisze się reklamy, a nie zlecenia.",
        ],
      },
      {
        id: "claudery",
        title: "Claudery: bot zdalnej pomocy i kreator",
        body: [
          "Claudery to bot, który przyjmuje płatne zgłoszenia o pomoc z AI. Klient pisze, co się stało, i dostaje przycisk «Открыть заявку». Prowadzi on na stronę zgłoszenia na naszej stronie, tam jest cena i płatność.",
          "W samym bocie nie ma ani słowa o płatności i cenie: Telegram blokuje boty, które biorą pieniądze z pominięciem jego systemu. Zgłoszenie od razu trafia do leadów (zgłoszeń klientów) jako «Pomoc z AI (Claudery)». Gdy system płatności potwierdzi wpłatę, bot wysyła klientowi tekst z kroku «4. Po płatności».",
          "W bloku «Co widzi klient» są kroki bota. Zmieniasz tylko słowa i kwotę i możesz dodać do czterech własnych przycisków pod powitaniem. Kto już płacił, dostaje cenę niższą o «Zniżka dla tych, którzy już płacili, %» (zwykle 30%).",
          "W bloku «Klucze» jest token bota i dwa klucze Platega, przycisk «Zapisz i sprawdź». Bota mogą zmieniać właściciel i kierownik. Po płatności sam zakłada się [projekt](/admin/projects), a prowadzący lead dostaje 40% kwoty.",
        ],
      },
      {
        id: "bloggers-agent",
        title: "Blogerzy: co agent robi sam",
        body: [
          "Agent szuka blogerów z Uzbekistanu, którzy mogą przyprowadzać studiu klientów: przedsiębiorców, ekspertów, marketerów. Szuka w internecie według zapytań z «Ustawienia agenta» i bierze profile z Instagrama. Idzie na to osobna część dziennych kredytów wyszukiwania, więc szukanie firm do kontaktów nie staje.",
          "Włączony agent («Włącz agenta») pracuje co pięć minut od 9:00 do 20:00 czasu Taszkentu. Ocenia znalezionych blogerów albo szuka nowych. «Szukaj teraz» i «Dodaj blogera» działają zawsze, nawet gdy agent jest wyłączony.",
          "Linijka «Źródła» pokazuje, co jest podłączone. «Liczby z Instagrama» dają dokładne polubienia i komentarze, bez nich agent zna tylko liczbę obserwujących. «Rozmowy w Direct» są potrzebne, żeby agent sam odpowiadał blogerom.",
        ],
      },
      {
        id: "bloggers-score",
        title: "Jak agent ocenia blogera",
        body: [
          "Agent wystawia blogerowi wynik od 0 do 100. Składa się on z pięciu części: wielkość widowni, zaangażowanie (ile polubień i komentarzy na obserwującego), aktywność, Uzbekistan i tematyka.",
          "Wysoki wynik ma bloger z 10-100 tysiącami obserwujących, zaangażowaniem od 3% i świeżymi postami. Pasują tematy biznesu, marketingu i IT. Humor, gry i uczniowie dają niski wynik.",
          "Poniżej «Próg punktowy» (zwykle 55) bloger trafia do «Odrzuceni». Tam są przyciski «Przywróć» i «Oceń ponownie». Miasta i wiek widowni widzi tylko sam bloger, więc poproś go o zrzuty statystyk.",
        ],
      },
      {
        id: "bloggers-send",
        title: "Pierwsza wiadomość: Telegram, Direct, e-mail",
        body: [
          "Pasujący bloger trafia do «Do wysłania» z gotowym tekstem. Jeśli ma Telegram, najpierw pójdzie powitanie z konta roboczego studia. Jeśli nie, piszemy na e-mail albo w Direct na Instagramie. Warunki w tekście pochodzą z zasad programu partnerskiego.",
          "Do Direct i na e-mail wysyła człowiek. «Skopiuj i otwórz Direct» wkłada tekst do schowka i otwiera rozmowę. Wklej, wyślij z konta studia i kliknij «Wysłałem», a bloger przejdzie do «Napisaliśmy, czekamy na odpowiedź».",
          "Dziennie można wysłać najwyżej tyle, ile w «Direct i e-mail dziennie» (zwykle 10), inaczej Instagram uzna to za spam. Norma wykonana, a przyciski znikną do jutra. «Nie pasuje» usuwa blogera z listy.",
        ],
      },
      {
        id: "bloggers-partner",
        title: "Bloger odpowiedział: rozmowa i partnerstwo",
        body: [
          "Bloger odpowiedział, więc dalej rozmowę prowadzi agent. W Telegramie widzi odpowiedź sam, w Direct też, jeśli kliknięto «Podłącz Instagram studia». Dopóki Direct nie jest podłączony, kliknij «Odpowiedział» i prowadź rozmowę z telefonu.",
          "Agent od razu mówi, że jest asystentem AI studia. Podaje tylko warunki programu i prosi o zrzuty statystyk. Na ich podstawie powstaje wynik widowni, widać go w linijce «Odbiorcy».",
          "Zgodził się, a wynik widowni ma od 60? Agent sam założy partnera i wyśle blogerowi link. W przeciwnym razie decydujesz ty: «Zrób partnerem» albo «Odmowa». «Prowadzę sam» wyłącza agenta na 12 godzin, «Oddaj agentowi» włącza go znowu.",
        ],
      },
      {
        id: "bloggers-keys",
        title: "Połączenia z Instagramem: jakie klucze i skąd je wziąć",
        roles: ["admin", "head"],
        body: [
          "W bloku «Połączenia z Instagramem» są klucze od Meta (firmy od Facebooka i Instagrama). Bez nich agent pracuje na pół gwizdka. Wklej klucz i kliknij «Zapisz i sprawdź». Klucz nie wraca na ekran, widać tylko «ustawiono» albo «puste».",
          "«1. Liczby cudzych profili» to token Facebooka, zaczyna się od EA. Z nim agent widzi dokładnych obserwujących, polubienia i komentarze blogerów. Token żyje do 60 dni, a tydzień przed końcem linijka zrobi się żółta.",
          "«2. Odpowiedzi blogerom w Direct» to ID i sekret aplikacji Instagram. Wszystkie kroki z linkami rozwijają się w samym bloku. Dopóki aplikacja w Meta nie jest opublikowana, do agenta piszą tylko konta testowe.",
        ],
      },
      {
        id: "bloggers-access",
        title: "Komu otwarty jest dział",
        roles: ["admin"],
        body: [
          "Na dole zakładki jest blok «Komu otwarty jest dział». Na start dział jest otwarty tobie i kierownikowi. Zaznaczony menedżer widzi zakładkę «Blogerzy»: wysyła wiadomości, zaznacza odpowiedzi i prowadzi rozmowę, ale kluczy i ustawień agenta nie widzi.",
          "To ten sam ptaszek co w [«Zespół»](/admin/team) → «Działy». Kliknij «Zapisz dostęp», a dział otworzy się tej osobie przy następnym przejściu.",
        ],
      },
      {
        id: "bloggers-invite",
        title: "Zaproszenie «Работа с блогерами» w bocie",
        body: [
          "To zaproszenie dla menedżerów do pracy z blogerami. Na razie nie jest wysyłane, włączy je właściciel. Przyjdzie od bota studia raz, w dzień, z przyciskami «✅ Принять» i «✖ Отклонить».",
          "Odpowiedź zapisuje się raz. «✅ Принять» otwiera ci zakładkę «Blogerzy», a bot wysyła ściągawkę z tekstami i odpowiedziami na zastrzeżenia. Odmówiłeś i zmieniłeś zdanie? Napisz do kierownika albo właściciela.",
        ],
      },
      {
        id: "bloggers-invite-answers",
        title: "Kto przyjął zaproszenie",
        roles: ["admin", "head"],
        body: {
          admin: [
            "Każda odpowiedź przychodzi ci w bocie linijką z wynikiem: kto przyjął, kto odmówił, kto milczy. O 18:00 w dniu wysyłki przyjdzie podsumowanie jedną wiadomością.",
            "Zamknąć dział osobie, która przyjęła, możesz ptaszkiem w [«Zespół»](/admin/team) → «Działy». Ponownie zaproszenie do niej nie pójdzie.",
          ],
          head: [
            "Każda odpowiedź menedżera przychodzi ci w bocie linijką. Podsumowanie całego zespołu o 18:00 dostaje właściciel.",
            "Menedżer, który przyjął, widzi zakładkę «Blogerzy». Bloger powiedział mu «tak»? Zaznacz w karcie partnera, kto go przyprowadził, inaczej premii nie da się naliczyć.",
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
