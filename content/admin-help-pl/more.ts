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

  /* ── Znajomi ─────────────────────────────────────────────────────────── */
  "/admin/friends": {
    what: "Program «Poleć znajomego, strona za darmo». Klient albo subskrybent bota przyprowadza znajomego. Znajomy zamówił i opłacił stronę, a ten, kto go przyprowadził, dostaje stronę za darmo. Tu widać wszystkich uczestników i ich znajomych.",
    items: [
      {
        id: "terms",
        title: "Warunki: jeden płacący znajomy, jedna strona",
        body: [
          "Bierze udział każdy klient i subskrybent bota, oprócz pracowników studia. Pracownik dostaje odmowę: panel rozpoznaje go po Telegramie z [Zespołu](/admin/team).",
          "Znajomy się liczy, gdy zamówił projekt od $500 (cena landing page na makiecie) i opłacił go w całości. Wtedy temu, kto go przyprowadził, należy się landing page na naszej makiecie za darmo, bez dodatków. Jeśli to już nasz klient, zamiast strony $500 idzie na poczet jego zamówienia.",
          "Uczestnik nie ma pieniędzy ani procentu: nie ma go w [Finansach](/admin/finance) ani w wypłatach partnerom. Prezent to nie transakcja menedżera, nie liczy się do gradu ani premii.",
          "Nie można przyprowadzić samego siebie. Jeśli znajomy ma ten sam Telegram, telefon, stronę lub firmę co uczestnik, zgłoszenie się nie liczy. Klient, który już był w studiu, też się nie liczy.",
        ],
      },
      {
        id: "bot",
        title: "Jak ktoś trafia do programu",
        body: [
          "Sam, jednym przyciskiem, bez ręcznej weryfikacji. W bocie po makiecie i ofercie handlowej jest przycisk «🎁 Poleć znajomego, strona za darmo». Jest też komenda /friend i strona na stronie studia.",
          "Bot wysyła osobisty link do strony, link do bota i słowo. Znajomy wchodzi z linku albo podaje słowo menedżerowi i zgłoszenie zapisuje się na uczestnika. To ta sama mechanika co u partnerów.",
          "Jeśli ktoś już jest partnerem z procentem, zostaje partnerem: bot przypomina mu o /ref.",
        ],
      },
      {
        id: "table",
        title: "Co jest w tabeli",
        body: [
          "«Przyszli»: ile zaliczonych zgłoszeń przyszło z linku lub słowa. «Zamówili»: ile z nich stało się projektami. «Zapłacili = stron»: ilu znajomych opłaciło projekt od $500 w całości. Tyle stron zdobył uczestnik.",
          "Wszystko liczy się samo z projektów i płatności. Żeby znajomy się liczył, jego projekt musi być przypisany do uczestnika, jak u partnerów.",
        ],
      },
      {
        id: "gift",
        title: "Znajomy zapłacił: co dalej",
        body: [
          "Gdy projekt znajomego jest opłacony w całości, bot pisze do Ciebie i do kierownika «🎁 Друг оплатил — подарочный сайт». Uczestnikowi bot pisze, że strona jest zdobyta i menedżer się odezwie.",
          "Od razu powstaje [zadanie](/admin/tasks) «Подарочный сайт для …». Dostaje je ten, kto prowadził lead samego uczestnika. Jeśli nikogo takiego nie ma, zadanie dostaje właściciel. W nocy, od 21:00 do 08:00, nic nie wychodzi: wszystko przyjdzie rano.",
        ],
      },
      {
        id: "broadcast",
        title: "Tekst wysyłki o akcji",
        body: {
          head: [
            "Na dole zakładki leży gotowy tekst wysyłki do subskrybentów bota. Nie został wysłany.",
            "O terminie decyduje właściciel. Nie wysyłaj sam.",
          ],
          admin: [
            "Na dole zakładki leży gotowy tekst wysyłki do subskrybentów bota. Nie został wysłany i sam nie wyjdzie.",
            "Powiedz «wysyłaj», a pójdzie wysyłką «Użytkownikom bota» na [Pulpicie](/admin/hq).",
          ],
        },
      },
    ],
  },

  /* ── Прототипы ────────────────────────────────────────────────────── */
  "/admin/proto": {
    what: "Tu składasz prototyp, czyli stronę przyszłej witryny klienta. Wysyła się ją linkiem po pierwszej rozmowie, a klient widzi swój biznes na telefonie. Sekcja jest tylko u właściciela.",
    items: [
      {
        id: "build",
        title: "Zbudować",
        body: [
          "Wpisz «Strona klienta», wybierz «Branża» i «Język strony». Branże to: wulkanizacja, serwis samochodowy, myjnia samochodowa, barbershop, salon kosmetyczny, studio paznokci, detailing, stomatologia, centrum szkoleniowe, centrum medyczne. Nazwę, telefon, komunikatory i logo panel weźmie z jego strony sam.",
          "Usługi pisz po jednej w wierszu, jego słowami, od 3 do 12. Cenę stawiaj po myślniku i tylko tę, którą podał sam. Jeśli strona się myli, rozwiń «Nadpisz to, co znaleziono na stronie».",
          "Prototyp zlecono zadaniem? Wybierz zadanie w polu «Według zlecenia z zadania». Wtedy odpowiedzialny będzie ten, kto zlecił, a zadanie zamknie się samo. Potem kliknij «Zbuduj prototyp».",
        ],
      },
      {
        id: "auto",
        title: "Zbudowane same, do kontaktów",
        body: [
          "Bot nie składa sam prototypów do kontaktów. Prototypy z etykietą «zbudowany automatycznie, do kontaktu» zostały z przeszłości, są zamknięte na hasło i nie pokazują się na liście.",
          "Prototyp do kontaktu składasz tutaj, ręcznie. Jak to wygląda u menedżera, opisuje punkt [prototyp z wyprzedzeniem](#prospect-proto-ahead).",
        ],
      },
      {
        id: "check",
        title: "Kontrola i link",
        body: [
          "Gotową stronę od razu sprawdza program. Szuka wymyślonych liczb, przechwałek, usług, których klient nie podał, i niedziałającego przycisku. Szuka też długich myślników i szablonów w stylu «zanurz się w świat»: po nich właściciel firmy od razu poznaje tekst sieci neuronowej.",
          "Jest problem? Prototyp zostaje «szkic», link nie działa, a problemy są wypisane. Popraw i zbuduj jeszcze raz. Wszystko czyste i prototyp jest «gotowy»: kliknij «Kopiuj link», a po wysłaniu «Wysłałem klientowi».",
        ],
      },
      {
        id: "opens",
        title: "Czy klient otworzył",
        body: [
          "W wierszu prototypu widać, czy klient go otworzył i ile razy. Twoje otwarcia z panelu i podgląd linku w komunikatorze się nie liczą.",
          "Otworzył i wrócił drugi raz? Dzwoń dziś. Nie otworzył przez dwa dni, czyli link do niego nie dotarł. Przycisk zapisu na prototypie otwiera jego własny Telegram lub WhatsApp: tak klient widzi, że wszystko działa.",
        ],
      },
      {
        id: "trace",
        title: "Ukryty odcisk i sprawdzenie cudzej strony",
        body: [
          "W każdym prototypie jest ukryty odcisk. Kolory, odstępy i inne drobiazgi są lekko przesunięte, u każdego klienta inaczej. Okiem tego nie widać, a panel rozpoznaje swoją makietę.",
          "W danych demo są też słowa-pułapki: wymyślone nazwy ulic i sklepów. Na cudzej stronie nie mają skąd się wziąć. Jeśli tam są, tekst wzięto z naszej makiety.",
          "W stopce każdego prototypu jest link do warunków: bez umowy makiety używać nie wolno, kara to 200% ceny. Klient przyjmuje warunki tym, że otwiera makietę albo dalej rozmawia o projekcie.",
          "Żeby sprawdzić cudzą stronę, wklej adres w «Sprawdź stronę pod kątem naszej makiety» i kliknij «Sprawdź». Jeśli panel pisze, że makieta na pewno jest nasza, zgadza się za dużo jak na przypadek. Do roszczenia zapisz wynik i zamów notarialne oględziny strony.",
        ],
      },
      {
        id: "trace-month",
        title: "Raz w miesiącu strony klientów",
        roles: ["admin"],
        body: [
          "Co miesiąc od 1. dnia bot sam sprawdza strony wszystkich klientów, dla których robiliśmy makietę. Kontrola jest ta sama, co «Sprawdź stronę pod kątem naszej makiety». Bierze po trzy strony naraz, więc cała lista zajmuje godzinę lub dwie.",
          "Potem ty i kierownik dostajecie raport «🔎 Сайты клиентов»: ile sprawdzono i gdzie znalazła się nasza makieta. W nocy po 21:00 raport nie przychodzi, przyjdzie następnego dnia.",
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
    what: "Dziennik wszystkich działań w panelu: kto, co i kiedy zrobił. Na przykład otworzył kontakt klienta, przejął leada, zmienił status albo potwierdził płatność. Wpisów nie da się zmienić ani usunąć.",
    items: [
      {
        id: "filters",
        title: "Jak szukać",
        body: [
          "Filtr «Kto» wybiera pracownika albo «system». «system» znaczy, że działanie wykonał bot, licznik czasu albo partner przez bota. Filtr «Co» wybiera rodzaj działania. Na stronie jest 100 wpisów, dalej przechodzisz przyciskami «starsze →» i «← nowsze».",
          "Na złoto wyróżnione jest to, co ważne: kontakt klienta, korespondencja, pieniądze i dostępy. Przy działaniach z leadem jest link do jego karty.",
        ],
      },
      {
        id: "when",
        title: "Kiedy tu zaglądać",
        body: [
          "Klient skarży się, że napisały do niego dwie osoby. Lead zniknął. Nie wiadomo, kto zmienił kwotę albo status. Tu widać to wszystko co do minuty.",
        ],
      },
    ],
  },

  /* ── Использование ────────────────────────────────────────────────── */
  "/admin/usage": {
    what: "Z których sekcji i przycisków zespół naprawdę korzysta. Raport widzisz tylko ty. Zespół o nim nie wie, więc liczby są uczciwe.",
    items: [
      {
        id: "read",
        title: "Jak czytać",
        body: [
          "Na górze okres: 7, 30 albo 90 dni. Strzałki porównują z takim samym okresem wcześniej. Liczą się kierownicy i menedżerowie, ciebie w raporcie nie ma.",
          "Każdy wiersz ma oznaczenie. «rdzeń» znaczy, że korzysta co najmniej połowa osób, które mają dostęp. «u pojedynczych osób» znaczy, że korzysta niewielu. Oznaczenie ze słowem «zbędne?» znaczy, że nie korzysta nikt.",
        ],
      },
      {
        id: "use",
        title: "Co z tym zrobić",
        body: [
          "Oznaczenie «zbędne?» to pytanie, a nie wyrok. Zapytaj zespół: funkcja jest niepotrzebna czy nikt o niej nie wie? Częściej nie wiedzą. Wtedy pomaga punkt w instrukcji i przycisk «?».",
          "Wyświetlenia sekcji liczą się od dnia, w którym raport włączono. Działania są brane z sekcji [«Dziennik»](/admin/audit) za cały czas.",
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
        title: "Claudery: bot sprzedaży subskrypcji i kreator",
        body: [
          "Claudery to bot, który sprzedaje subskrypcje sieci neuronowych. Klient pisze, jakiej sieci potrzebuje, i dostaje przycisk «Открыть заказ». Prowadzi on na stronę zamówienia na naszej stronie: tam klient wybiera subskrypcję z listy i płaci. Sprzedajemy towar, a nie usługę: podłączenie i odpowiedzi na pytania to bezpłatne wsparcie kupującego, tak uzgodniono z systemem płatności.",
          "W samym bocie nie ma ani słowa o płatności i cenie: Telegram blokuje boty, które biorą pieniądze z pominięciem jego systemu. Zamówienie od razu trafia do leadów (zgłoszeń klientów) jako «Pomoc z AI (Claudery)». Gdy system płatności potwierdzi wpłatę, bot wysyła klientowi tekst z kroku «4. Po płatności».",
          "W bloku «Co widzi klient» są kroki bota. Zmieniasz słowa i listę «Towary: subskrypcje i ceny» (do sześciu wierszy: nazwa, co zawiera, cena) i możesz dodać do czterech własnych przycisków pod powitaniem. Tę samą listę widać na witrynie («Witryna na stronie») i w ofercie. Kto już płacił, dostaje cenę dowolnej subskrypcji niższą o «Zniżka dla tych, którzy już płacili, %» (zwykle 30%).",
          "W bloku «Klucze» jest token bota i dwa klucze Platega, przycisk «Zapisz i sprawdź». Bota mogą zmieniać właściciel i kierownik. Po płatności sam zakłada się [projekt](/admin/projects), a prowadzący lead dostaje 40% kwoty.",
          "Bank systemu płatności wymaga dokumentów i kontaktu do wsparcia. «Regulamin» i «Polityka prywatności» otwierają się przyciskami obok witryny, są na dole każdej strony Claudery i jako przyciski w bocie. W kroku «6. Wsparcie kupujących» wpisz e-mail lub @username osoby w Telegramie: grupa nie wystarczy. Puste: w dokumentach podany jest sam bot. Do rachunku Platega trafia numer kupującego w Telegramie, dzięki temu system płatności rozpoznaje powracającego kupującego.",
          "Kontaktów do wsparcia może być kilka, po przecinku, na przykład «@maximov_tech, @Siberian_2»: na stronie stoją obok siebie, a w bocie każdy ma swój przycisk. W kroku «7. Witryna na stronie» są wszystkie teksty strony devuz.studio/claudery: tytuł, opis, plakietki, wiersze na karcie subskrypcji, kroki zakupu, karty zaufania, pytania i wezwanie na dole. Zmiana jest widoczna na stronie od razu po «Zapisz». Pusty wiersz listy nie pojawia się na stronie. Słów o usłudze, pomocy, konsultacji czy specjaliście konstruktor nie zapisze: system płatności uzgodnił sprzedaż subskrypcji, a nie usług.",
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
    what: "Kursy sprzedaży i test z panelu. Kursy pokazują, jak studio naprawdę pisze do firm. W każdym kursie są krótkie lekcje i test na końcu.",
    items: [
      {
        id: "switch",
        title: "Wyłącznik: zespół widzi sekcję dopiero po twoim kliknięciu",
        roles: ["admin"],
        body: [
          "Dopóki szkolenia są wyłączone, sekcję widzisz tylko ty. Zespół nie ma jej ani w menu, ani w instrukcji, a bot na /learn odpowiada, że szkolenia nie są włączone. Sam możesz przejść dowolny kurs i sprawdzić, jak to wygląda.",
          "Na górze sekcji jest żółty pasek i przycisk **«Włącz szkolenia dla zespołu»**. Po kliknięciu sekcja pojawi się u wszystkich, a /learn pojawi się w menu bota. Przycisk **«Wyłącz szkolenia»** chowa sekcję z powrotem, wyniki zostają.",
          "Test jest zaliczony od 70% dobrych odpowiedzi. Kursy są obowiązkowe dla menedżerów. Próg zmienia się tylko w kodzie: powiedz programiście.",
        ],
      },
      {
        id: "courses",
        title: "Kursy sprzedaży",
        body: [
          "Kursów jest sześć i dotyczą naszego prawdziwego procesu: pierwsze «Dzień dobry», kółko, zgoda klienta «+», obiekcje, teksty wiadomości i ciepłe leady. W kursie o wiadomościach są te same teksty co w sekcji [«Zimne kontakty»](/admin/prospect).",
          "Kliknij kartę kursu w bloku **«Kursy sprzedaży»**. W środku są lekcje po kolei, pod nimi «Materiały» i test. Na karcie widać liczbę lekcji i pytań oraz twój wynik: zaliczony, niezaliczony albo «jeszcze nierozwiązany».",
        ],
      },
      {
        id: "quiz",
        title: "Jak rozwiązywać test",
        body: [
          "Kliknij **«Rozpocznij test»**. Pytania idą po jednym. Po odpowiedzi od razu widać, czy dobrze, i dlaczego. Pomyłka? Obok jest link **«Przeczytaj lekcję jeszcze raz»**, a w teście z panelu **«Otwórz punkt instrukcji»**.",
          "Test jest zaliczony od 70% dobrych odpowiedzi. Pytania nie da się pominąć, bez odpowiedzi liczy się jako błąd. Poprawiać można ile razy chcesz przyciskiem **«Spróbuj ponownie»**, liczy się najlepszy wynik.",
          "Te same testy są w bocie studia w Telegramie. Napisz mu /learn i wybierz test. Wynik z bota trafia tam, gdzie wynik z panelu.",
        ],
      },
      {
        id: "panel-quiz",
        title: "Test z panelu",
        body: [
          "**«Test z panelu»** sprawdza, jak znasz panel: kolejkę leadów, [porcję dnia](#prospect-portion), makiety i inne sekcje. Przy pomyłce pojawi się link do właściwego punktu tej instrukcji.",
          "Pytania dotyczą tylko sekcji, które masz otwarte. Dlatego menedżer i kierownik dostają ich różną liczbę.",
        ],
      },
      {
        id: "required",
        title: "Co jest obowiązkowe",
        body: {
          manager: [
            "Szkolenia są obowiązkowe dla menedżerów: wszystkie kursy i test z panelu, od 70% dobrych odpowiedzi. Blok **«Zostało do zaliczenia»** na górze sekcji pokazuje, czego jeszcze nie zaliczyłeś. Gdy wszystko zaliczone, jest tam «Wszystko obowiązkowe zaliczone.».",
            "Nie przeszkadza to w pracy: leady i porcja dnia przychodzą jak zwykle. Ale kierownik i właściciel widzą, kto co zaliczył. Przejdź kursy w pierwszych dniach.",
          ],
          head: [
            "Kursy są obowiązkowe dla menedżerów: wszystkie kursy i test z panelu, od 70% dobrych odpowiedzi. Dla ciebie dobrowolnie. Ale test z panelu warto przejść, żeby wiedzieć, o co pytają twoich menedżerów.",
            "Pracować bez kursów można, obowiązek jest tylko pokazywany. U menedżera to blok «Zostało do zaliczenia», u ciebie kolumna **«Niezaliczone»** w [wynikach zespołu](#learn-results).",
          ],
          admin: [
            "Gdy szkolenia są włączone, kursy są obowiązkowe dla menedżerów: wszystkie kursy i test z panelu, od 70% dobrych odpowiedzi. Kierownikowi i tobie dobrowolnie. Gdy szkolenia są wyłączone, nic nie jest obowiązkowe, zobacz [wyłącznik](#learn-switch).",
            "Pracować bez kursów można, obowiązek jest tylko pokazywany. U menedżera to blok «Zostało do zaliczenia», u ciebie i kierownika kolumna **«Niezaliczone»** w [wynikach zespołu](#learn-results).",
          ],
        },
      },
      {
        id: "results",
        title: "Wyniki zespołu",
        roles: ["admin", "head"],
        body: [
          "Na dole sekcji jest tabela **«Wyniki zespołu»**. W wierszu pracownik, w kolumnach kursy i test z panelu. W komórce najlepszy wynik, na przykład «5/6»: zielony to zaliczony, żółty to jeszcze nie, kropka to nie podchodził.",
          "Kolumna **«Niezaliczone»** pokazuje, co menedżerowi zostało do zaliczenia. Oznaczenie «nowy» ma menedżer dodany po uruchomieniu szkoleń. Podejścia z bota też tu są. Do zalegającego lepiej napisać osobiście i omówić błędy razem.",
        ],
      },
      {
        id: "video-course",
        title: "Kurs wideo dla menedżerów",
        body: {
          manager: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny. Jest w nich, co sprzedaje studio, droga klienta od «Dzień dobry» do umowy i co odpowiadać na obawy właścicieli. Mowa po rosyjsku, napisy po uzbecku.",
            "Oglądaj po kolei, jeden film naraz. W każdym jest zadanie: zatrzymaj film, odpowiedz sam, potem obejrzyj omówienie. Napis «Film nie został jeszcze wgrany.» znaczy, że filmu jeszcze nie dodano.",
          ],
          head: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny: co sprzedaje studio, droga klienta i obawy właścicieli. Mowa po rosyjsku, napisy po uzbecku. Filmy widzi każdy, kto ma otwarte «Szkolenia».",
            "Pod każdym filmem jest blok **«Wgraj lub podmień film»**. Wybierz «Język wideo» (w kursie to rosyjski), plik MP4 i kliknij «Wgraj». Nowy film zastępuje stary w tym samym języku, a «Usuń» go kasuje.",
          ],
          admin: [
            "Blok **«Kurs wideo dla menedżerów»** to 13 krótkich filmów, razem około godziny: co sprzedaje studio, droga klienta i obawy właścicieli. Mowa po rosyjsku, napisy po uzbecku. Dopóki sekcja jest wyłączona, filmy widzisz tylko ty.",
            "Pod każdym filmem jest blok **«Wgraj lub podmień film»**. Wybierz «Język wideo» (w kursie to rosyjski), plik MP4 i kliknij «Wgraj». Nowy film zastępuje stary w tym samym języku, a «Usuń» go kasuje. Wgrywać może też kierownik.",
          ],
        },
      },
      {
        id: "materials",
        title: "Materiały do kursu",
        body: {
          manager: [
            "Pod lekcjami kursu jest blok **«Materiały»**: filmy, nagrania udanych rozmów, artykuły. Linki dodaje właściciel, otwierają się w nowej karcie. Jeśli linków nie ma, kurs i tak da się przejść.",
          ],
          head: [
            "Pod lekcjami kursu jest blok **«Materiały»**: filmy, nagrania udanych rozmów, artykuły. Linki dodaje właściciel. Znalazłeś coś przydatnego dla zespołu? Wyślij mu.",
          ],
          admin: [
            "W każdym kursie i w teście z panelu jest blok **«Materiały»**. Wpisz «Nazwa» i «Link» (adres zaczyna się od https:// albo http://) i kliknij **«Dodaj materiał»**. Link od razu pojawi się u wszystkich, a «Usuń materiał» go usuwa. Dodawać i usuwać możesz tylko ty.",
          ],
        },
      },
    ],
  },

  /* ── Настройки ───────────────────────────────────────────────────── */
  "/admin/settings": {
    what: "Wszystkie ustawienia panelu na jednej stronie. Otwiera ją zębatka ⚙ w prawym górnym rogu, obok twojego imienia. Swoje zmieniasz od razu tutaj, resztę otwiera link.",
    items: [
      {
        id: "mine",
        title: "«Moje»: język, menu, telefon i bot",
        body: {
          manager: [
            "Blok **«Moje»** zmienia tylko twoje ustawienia, od razu na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** przełącza RU, UZ albo PL. Wiadomości bota na razie przychodzą po rosyjsku.",
            "**«Wygląd menu»** wybiera «Nowe menu» z ikonami po lewej albo stare menu w jednym wierszu. Przyciski obok pokażą jeszcze raz poznawanie panelu i szkolenie z sekcji [«Rynki»](/admin/markets).",
            "**«Powiadomienia na tym urządzeniu»** włączają push (wyskakującą wiadomość) z tym samym tekstem, co wiadomość bota w Telegramie. Włącz je osobno na każdym urządzeniu.",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi. Zaznaczenia ustawia kierownik albo właściciel w «Zespół». Jeśli czegoś jest za dużo albo brakuje, poproś ich.",
          ],
          head: [
            "Blok **«Moje»** zmienia tylko twoje ustawienia, od razu na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** przełącza RU, UZ albo PL. Wiadomości bota na razie przychodzą po rosyjsku.",
            "**«Wygląd menu»** wybiera «Nowe menu» z ikonami po lewej albo stare menu w jednym wierszu. Przyciski obok pokażą jeszcze raz poznawanie panelu i szkolenie z sekcji [«Rynki»](/admin/markets).",
            "**«Powiadomienia na tym urządzeniu»** włączają push (wyskakującą wiadomość) z tym samym tekstem, co wiadomość bota w Telegramie. Włącz je osobno na każdym urządzeniu.",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi. Link obok prowadzi do sekcji [Zespół](/admin/team), do zaznaczeń pod twoim imieniem.",
          ],
          admin: [
            "Blok **«Moje»** zmienia tylko twoje ustawienia, od razu na wszystkich twoich urządzeniach. **«Język panelu i instrukcji»** przełącza RU, UZ albo PL. Wiadomości bota na razie przychodzą po rosyjsku.",
            "**«Wygląd menu»** wybiera «Nowe menu» z ikonami po lewej albo stare menu w jednym wierszu. Przyciski obok pokażą jeszcze raz poznawanie panelu i szkolenie z sekcji [«Rynki»](/admin/markets).",
            "**«Powiadomienia na tym urządzeniu»** włączają push (wyskakującą wiadomość) z tym samym tekstem, co wiadomość bota w Telegramie. Włącz je osobno na każdym urządzeniu.",
            "**«Co bot mi wysyła»** pokazuje, ile rodzajów wiadomości bota do ciebie przychodzi. Link obok prowadzi do sekcji [Zespół](/admin/team), do zaznaczeń pod twoim imieniem.",
          ],
        },
      },
      {
        id: "leads",
        title: "«Jakie leady wysyłać»: wybierasz sam",
        body: [
          "W bloku «Moje» jest **«Jakie leady wysyłać»**. To zaznaczenia według rodzajów leadów: «Zimne kontakty», «Przetargi», «Sygnały z grup (skaut)», «Partnerzy i agencje», «Zgłoszenia ze strony i z bota», «Makieta z bota» i «Pomoc z AI (Claudery)». Na początku zaznaczone są wszystkie.",
          "Odznacz zbędne i kliknij **«Zapisz»**. Bot przestanie wysyłać takie leady, a [kolejka](#leads-queue) nie będzie ci ich proponować. Od razu trafią do tych, którzy mają zaznaczone.",
          "Jeśli rodzaju nie wybrał nikt, lead i tak przychodzi do wszystkich, żeby klient nie przepadł. Kierownik i właściciel mogą ustawić te zaznaczenia za ciebie w «Zespół».",
        ],
      },
      {
        id: "links",
        title: "Kontakty i zespół: linkami",
        body: {
          manager: [
            "W bloku **«Kontakty»** masz jeden wiersz: «Teksty wiadomości i A/B». Są tam twoje teksty wiadomości o stronie, wspólne teksty zespołu i to, który tekst częściej dostaje odpowiedź. **«Otwórz»** prowadzi prosto tam.",
            "Tu jest tylko to, co masz otwarte. Powitanie, automatyczne kontakty, kółka i konta ustawiają kierownik i właściciel.",
          ],
          head: [
            "W bloku **«Kontakty»** jest pięć wierszy: «Teksty wiadomości i A/B», «Pierwsza wiadomość», «Automatyczne kontakty», «Kółka według branż» i «Konta robocze». W bloku **«Zespół i dostęp»** jest wiersz «Co bot wysyła zespołowi». **«Otwórz»** prowadzi prosto we właściwe miejsce.",
            "Same przyciski zostały w swoich sekcjach, tu są tylko linki. O dostępie do sekcji, leadach bez limitu i szkoleniach decyduje właściciel, dlatego tych wierszy nie masz.",
          ],
          admin: [
            "W bloku **«Kontakty»** jest pięć wierszy: «Teksty wiadomości i A/B», «Pierwsza wiadomość», «Automatyczne kontakty», «Kółka według branż» i «Konta robocze». W bloku **«Zespół i dostęp»**: «Co bot wysyła zespołowi», «Dostęp do sekcji», «Leady bez limitu» i «Szkolenia dla zespołu». **«Otwórz»** prowadzi prosto we właściwe miejsce.",
            "Kierownik widzi wszystko oprócz dostępu do sekcji, leadów bez limitu i szkoleń. Menedżer ma tylko swoje ustawienia i «Teksty wiadomości i A/B». Jeśli zamkniesz komuś sekcję, jej wiersze znikną też tutaj.",
          ],
        },
      },
    ],
  },

  /* ── Инструкции ───────────────────────────────────────────────────── */
  "/admin/help": {
    what: "Ta strona. Tu sekcja po sekcji wyjaśniamy, jak działa panel. Widzisz tylko to, do czego masz dostęp.",
    items: [
      {
        id: "how",
        title: "Jak korzystać z instrukcji",
        body: [
          "W każdej sekcji panelu na górze jest przycisk «Jak korzystać z sekcji». Otwiera tutaj punkt o tej sekcji. Przy złożonych blokach jest mały «?», który prowadzi prosto do właściwego punktu.",
          "Na górze strony jest spis treści i wybór języka instrukcji. Punkt, do którego trafiłeś przyciskiem albo linkiem, przez pięć sekund świeci zieloną ramką.",
          "Czegoś brakuje albo na ekranie jest inaczej? Powiedz właścicielowi, uzupełnimy.",
        ],
      },
      {
        id: "crash",
        title: "Strona się nie załadowała",
        body: [
          "Czasem na sekundę pojawia się «Odświeżamy stronę…». To krótka przerwa w połączeniu, panel sam załaduje stronę jeszcze raz. Wszystko, co zapisałeś, jest na miejscu.",
          "Jeśli za drugim razem też się nie uda, pojawi się «Strona się nie załadowała» i przycisk «Odśwież». Kliknij go. Często się powtarza? Napisz kierownikowi, na której stronie i o której godzinie to było.",
        ],
      },
      {
        id: "menu",
        title: "Menu: pasek ikon, «Więcej» i wyszukiwanie",
        body: {
          manager: [
            "Sekcje na co dzień są na pasku ikon po lewej: «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania», «Zimne kontakty», «Makiety». Na telefonie pasek jest na dole ekranu, a «Makiety» są pierwszym wierszem w «Więcej». Liczba na «Zadaniach» to twoje otwarte zadania, czerwona znaczy, że są zaległe.",
            "Reszta jest pod przyciskiem «Więcej» na dole paska, na przykład «Projekty», «Statystyki» i «Instrukcje». Rzadsze sekcje otwierają się kartami nad stroną: na przykład «Statystyki» i «Etapy sprzedaży». Wolisz stare menu w jednym wierszu? Wyłącz «Nowe menu» w «Więcej» albo w sekcji [«Ustawienia»](/admin/settings).",
            "W prawym górnym rogu jest dzwonek 🔔. Jest w nim wszystko, co bot pisał ci w Telegramie przez 14 dni: «✓ Zrobione» zdejmuje wiersz z licznika, «Zaznacz wszystko» zdejmuje wszystkie. Obok jest zębatka ⚙, otwiera ustawienia. Język i «Wyloguj» są pod kółkiem z twoimi inicjałami.",
            "Najszybciej szuka się polem wyszukiwania na górze albo skrótem Ctrl+K (na Macu ⌘K). Wpisz sekcję, firmę, imię, numer zgłoszenia, telefon albo @nick. Po telefonie i @nicku znajdziesz tylko swoje leady. Zielona kropka «Online» znaczy, że internet jest, a przy «Brak sieci» przyciski panelu nie zadziałają.",
          ],
          head: [
            "Sekcje na co dzień są na pasku ikon po lewej: «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania», «Zimne kontakty», «Makiety». Na telefonie pasek jest na dole ekranu, a «Makiety» są pierwszym wierszem w «Więcej». Liczba na «Zadaniach» to twoje otwarte zadania, czerwona znaczy, że są zaległe.",
            "Reszta jest pod przyciskiem «Więcej» na dole paska, w grupach: «Pieniądze», «Marketing», «Zespół» i inne. Rzadsze sekcje otwierają się kartami nad stroną: na przykład «Zespół» i «Kandydaci». Wolisz stare menu w jednym wierszu? Wyłącz «Nowe menu» w «Więcej» albo w sekcji [«Ustawienia»](/admin/settings).",
            "W prawym górnym rogu jest dzwonek 🔔. Jest w nim wszystko, co bot pisał ci w Telegramie przez 14 dni: «✓ Zrobione» zdejmuje wiersz z licznika, «Zaznacz wszystko» zdejmuje wszystkie. Obok jest zębatka ⚙, otwiera ustawienia. Język i «Wyloguj» są pod kółkiem z twoimi inicjałami.",
            "Najszybciej szuka się polem wyszukiwania na górze albo skrótem Ctrl+K (na Macu ⌘K). Wpisz sekcję, firmę, imię, numer zgłoszenia, telefon albo @nick, a niżej pojawią się «Firmy i leady». Zielona kropka «Online» znaczy, że internet jest, a przy «Brak sieci» przyciski panelu nie zadziałają.",
          ],
          admin: [
            "Sekcje na co dzień są na pasku ikon po lewej: «Pulpit», [«Skrzynka»](/admin/inbox), «Leady», «Zadania», «Zimne kontakty», «Makiety». Na telefonie pasek jest na dole ekranu, a «Makiety» są pierwszym wierszem w «Więcej». Liczba na «Zadaniach» to twoje otwarte zadania, czerwona znaczy, że są zaległe.",
            "Reszta jest pod przyciskiem «Więcej» na dole paska, w grupach: «Pieniądze», «Marketing», «Zespół», «Raporty» i inne. Rzadsze sekcje otwierają się kartami nad stroną: na przykład «Dziennik» i «Użycie». Wolisz stare menu w jednym wierszu? Wyłącz «Nowe menu» w «Więcej» albo w sekcji [«Ustawienia»](/admin/settings).",
            "W prawym górnym rogu jest dzwonek 🔔. Jest w nim wszystko, co bot pisał ci w Telegramie przez 14 dni: «✓ Zrobione» zdejmuje wiersz z licznika, «Zaznacz wszystko» zdejmuje wszystkie. Obok jest zębatka ⚙, otwiera ustawienia. Język i «Wyloguj» są pod kółkiem z twoimi inicjałami.",
            "Najszybciej szuka się polem wyszukiwania na górze albo skrótem Ctrl+K (na Macu ⌘K). Wpisz sekcję, firmę, imię, numer zgłoszenia, telefon albo @nick, a niżej pojawią się «Firmy i leady». Zielona kropka «Online» znaczy, że internet jest, a przy «Brak sieci» przyciski panelu nie zadziałają.",
            "Menu słucha twoich [zaznaczeń sekcji](#team-sections). Otworzysz komuś sekcję, a pojawi się w jego menu. Zamkniesz, a zniknie i z menu, i z wyszukiwania.",
          ],
        },
      },
      {
        id: "search",
        title: "Wyszukiwanie: zapytaj własnymi słowami",
        body: {
          manager: [
            "Nad spisem treści jest pole **«Szukaj w instrukcji»**. Napisz pytanie tak, jak zadałbyś je koledze, na przykład „jak przekazać leada innemu menedżerowi”, i kliknij **«Szukaj»**. Można po rosyjsku, uzbecku albo polsku, nawet z literówkami.",
            "Program dobierze punkt po sensie. Strona przewinie się do niego, a on zaświeci zieloną ramką. Jeśli pasują też inne punkty, będą niżej, po «Może też pasować:».",
            "Czasem pod polem jest napisane, że punkt dobrano po zgodności słów. Tak bywa, gdy wyszukiwanie jest zajęte albo pytań jest więcej niż 20 w 10 minut: sprawdź, czy to ten punkt. Nic się nie znalazło? Tego jeszcze nie ma w instrukcji, powiedz właścicielowi.",
          ],
          head: [
            "Nad spisem treści jest pole **«Szukaj w instrukcji»**. Napisz pytanie tak, jak zadałbyś je koledze, na przykład „jak przekazać leada innemu menedżerowi”, i kliknij **«Szukaj»**. Można po rosyjsku, uzbecku albo polsku, nawet z literówkami.",
            "Program dobierze punkt po sensie. Strona przewinie się do niego, a on zaświeci zieloną ramką. Jeśli pasują też inne punkty, będą niżej, po «Może też pasować:».",
            "Czasem pod polem jest napisane, że punkt dobrano po zgodności słów. Tak bywa, gdy wyszukiwanie jest zajęte albo pytań jest więcej niż 20 w 10 minut: sprawdź, czy to ten punkt. Nic się nie znalazło? Tego jeszcze nie ma w instrukcji, powiedz właścicielowi.",
          ],
          admin: [
            "Nad spisem treści jest pole **«Szukaj w instrukcji»**. Napisz pytanie tak, jak zadałbyś je koledze, na przykład „jak przekazać leada innemu menedżerowi”, i kliknij **«Szukaj»**. Można po rosyjsku, uzbecku albo polsku, nawet z literówkami.",
            "Program dobierze punkt po sensie. Jeśli pytanie zgadza się z tytułem punktu, punkt otwiera się od razu. W trybie «Pokaż jako:» wyszukiwanie idzie po instrukcji wybranej roli. Podobne punkty będą niżej, po «Może też pasować:».",
            "Gdy wyszukiwanie jest zajęte albo ktoś zadał ponad 20 pytań w 10 minut, punkt dobiera się po zgodności słów. Pod polem jest o tym napis. Nic się nie znalazło? Takiego punktu nie ma i warto go dopisać.",
          ],
        },
      },
      {
        id: "video",
        title: "Wideo do sekcji",
        body: {
          manager: [
            "Na górze strony jest wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Sekcja też może mieć swoje wideo, stoi przed tekstem.",
            "Wideo pokazuje się w języku instrukcji. Jeśli w tym języku go nie ma, będzie inny język i pod wideo jest to napisane. Brakuje wideo do sekcji? Powiedz właścicielowi albo kierownikowi.",
          ],
          head: [
            "Na górze strony jest wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Sekcja też może mieć swoje wideo, stoi przed tekstem.",
            "Wgrywać wideo możesz ty i właściciel. Otwórz blok «Wideo do sekcji» pod opisem sekcji albo «Wideo wprowadzające» na górze strony. Wybierz «Język wideo», plik MP4, MOV albo WebM do 500 MB i kliknij «Wgraj».",
            "Nie zamykaj strony, dopóki pasek wgrywania nie dojdzie do końca. Nowe wideo w tym samym języku zastąpi stare, a «Usuń» je skasuje. Jedno wideo w dowolnym języku wystarczy, żeby zobaczyli je wszyscy.",
          ],
          admin: [
            "Na górze strony jest wideo wprowadzające: jak wejść do panelu i co zrobić pierwszego dnia. Sekcja też może mieć swoje wideo, stoi przed tekstem.",
            "Wgrywać wideo możesz ty i kierownik. Otwórz blok «Wideo do sekcji» pod opisem sekcji albo «Wideo wprowadzające» na górze strony. Wybierz «Język wideo», plik MP4, MOV albo WebM do 500 MB i kliknij «Wgraj».",
            "Nie zamykaj strony, dopóki pasek wgrywania nie dojdzie do końca. Nowe wideo w tym samym języku zastąpi stare, a «Usuń» je skasuje. Jedno wideo w dowolnym języku wystarczy, żeby zobaczyli je wszyscy. Kto wgrał i usunął wideo, widać w sekcji [«Dziennik»](/admin/audit).",
          ],
        },
      },
      {
        id: "language",
        title: "Język panelu: RU, UZ, PL",
        body: [
          "Język panelu przełączają przyciski RU, UZ i PL: rosyjski, uzbecki w alfabecie łacińskim i polski. W nowym menu są pod kółkiem z twoimi inicjałami w prawym górnym rogu, w starym prosto w nagłówku. Język zmienisz też w sekcji [«Ustawienia»](/admin/settings).",
          "Język zapamiętuje się dla ciebie, a nie dla przeglądarki. Na telefonie panel otworzy się w tym samym języku. Twój wybór nie zmienia języka kolegom.",
          "Po rosyjsku zostają tylko wiadomości i przyciski bota w Telegramie, gabinet partnera i umowa dla klienta. Instrukcja otwiera się w języku panelu, inny język wybierzesz na górze tej strony.",
        ],
      },
      {
        id: "first-day",
        title: "Co zrobić pierwszego dnia",
        body: [
          "Otwórz [bota studia](https://t.me/Devuz_studio_bot) i kliknij «Старт». Bez tego nie przyśle ci leada ani przypomnienia. Do panelu wejdziesz komendą /login.",
          "Dołącz do kanału «Devuz Scout» i włącz dźwięk w bocie i kanale. Propozycja leada czeka na ciebie 30 minut, potem idzie do następnej osoby.",
          "Przeczytaj punkty o [kolejce leadów](#leads-queue) i [karcie leada](#leads-card). Resztę czytaj, gdy pierwszy raz otworzysz sekcję. Przycisk «Jak korzystać z sekcji» jest zawsze na górze.",
        ],
      },
      {
        id: "owner-view",
        title: "Zobaczyć oczami zespołu",
        roles: ["admin"],
        body: [
          "Na górze strony jest «Pokaż jako:» i trzy role: «właściciel», «kierownik», «menedżer». Wybierz rolę, a instrukcja pokaże się tak, jak widzi ją osoba z tą rolą. Tak sprawdzisz, co czyta nowa osoba.",
          "Każda nowa funkcja przychodzi razem ze swoim punktem tutaj, po rosyjsku, uzbecku i polsku. Sprawdza to test przy każdej aktualizacji panelu.",
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
  channelsLead: "Prawie wszystko, co ważne, bot wysyła w Telegramie: nowe leady, zadania, przypomnienia, porcję dnia i odpowiedzi klientów.",
  channels: [
    {
      name: "Bot studia",
      url: BOT_URL,
      what: "Główny kanał. Przez bota logujesz się do panelu. Tu przychodzą też nowe leady (zgłoszenia klientów), zadania, przypomnienia i odpowiedzi klientów.",
      how: [
        "Otwórz bota i kliknij «Старт». Bez tego bot nie może napisać do Ciebie pierwszy.",
        "Żeby wejść do panelu, napisz botowi /login. Przyjdzie przycisk «🔓 Открыть панель» i zapasowy link, który działa 15 minut. Przyciski z kłódką «🔓» pod wiadomościami bota też od razu otwierają panel.",
        "Bot odpisał «Не смог проверить вход: база сейчас не отвечает»? To awaria po naszej stronie, odczekaj minutę i napisz /login jeszcze raz. Odpowiedź «Такой команды у меня нет» oznacza, że Twój Telegram nie jest powiązany z panelem. Powiedz o tym kierownikowi.",
        "Nie wyciszaj dźwięku. Nowy lead czeka na Ciebie 30 minut, a potem idzie do następnej osoby w kolejce.",
        "Jakie wiadomości wysyła bot, decydują właściciel i kierownik polami w sekcji «Zespół». Jakie leady wysyłać, możesz wybrać też sam: «Ustawienia», potem «Moje». Coś nie przychodzi? Zapytaj kierownika.",
        "Menedżerom i kierownikom: przycisk «▶️ Получать лиды» na dole czatu (albo /leads) wysyła firmy ponad porcję dnia, «⏸ Не получать лиды» go wyłącza. Szczegóły w sekcji «Zimne kontakty». Chcesz polecać klientów za prowizję? Napisz botowi /ref.",
      ],
    },
    {
      name: "Kanał «Devuz Scout»",
      url: SCOUT_URL,
      what: "Tu skaut (program, który czyta otwarte czaty w Telegramie) wysyła osoby, które właśnie szukają programisty. Rano przychodzi podsumowanie. Szczegóły w sekcji «Sygnały skauta».",
      how: [
        "Otwórz link i dołącz do kanału. Włącz dźwięk: takie posty żyją godzinę lub dwie.",
        "Do posta z oznaczeniem «Сильный сигнал» nie pisz sam. Po kilku minutach przyjdzie jako lead w kolejce, z gotową odpowiedzią.",
      ],
    },
    {
      name: "Czat sprzedaży",
      url: null,
      roles: ["admin"],
      what: "Tu przychodzi kopia każdej karty leada. Teraz czat sprzedaży to Twój prywatny czat z botem. Menedżerowie dostają karty każdy w prywatnym czacie.",
      how: [
        "Przyciski «✅ Взять в работу» i «🗄 Отклонить» działają i tutaj, i u menedżerów. Wspólny czat działu zamiast prywatnego podłącza programista.",
      ],
    },
  ],

  rulesTitle: "Trzy zasady",
  rules: [
    "Wziąłeś lead, to go prowadź: status, przypomnienie, następny krok. Nie możesz? Kliknij «Zwróć do kolejki» albo «Poproś o przekazanie».",
    "Obiecałeś klientowi coś przysłać, przyślij tego samego dnia. Niedotrzymana obietnica traci klienta szybciej niż słaba strona.",
    "Coś nie działa albo wygląda dziwnie? Od razu powiedz właścicielowi, nie czekaj.",
  ],

  askTitle: "Nie wychodzi?",
  ask: "Napisz do właściciela w Telegramie. Lepiej zapytać, niż zgadywać: prawie wszystko da się naprawić w pięć minut.",
};
