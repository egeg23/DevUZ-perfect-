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
    what: "Pracownicy: role, poziomy, kto jest czyim kierownikiem, plan kontaktów i które wiadomości bota do kogo przychodzą. Tutaj dodajesz nową osobę i wyłączasz tę, która odeszła. Logowanie do panelu — po numerycznym id w Telegramie: hasła nie ma, username można zmienić w sekundę, a id — nigdy.",
    items: [
      {
        id: "invite",
        title: "Dodaj pracownika",
        body: {
          head: [
            "Blok «Dodaj pracownika»: id Telegrama (numeryczne — osoba sprawdza je w dowolnym bocie, np. @userinfobot, i przesyła Tobie), imię w panelu, username opcjonalnie. Masz do wyboru jedną rolę — «menedżer»: drugiego kierownika wyznacza właściciel. Kliknij **«Dodaj»**.",
            "Dodany przez Ciebie menedżer **od razu jest Twój** — właściciel dostanie powiadomienie. Bot wyśle tej osobie zaproszenie: rolę, do czego ma dostęp, i przycisk «Открыть панель», który loguje jednym kliknięciem.",
            "«Zaproszenie nie dotarło: bot nie może napisać pierwszy…» — ta osoba jeszcze nie pisała do bota. Niech otworzy [bota](https://t.me/Devuz_studio_bot) i naciśnie «Start», a Ty kliknij «wyślij zaproszenie» w jej wierszu.",
          ],
          admin: [
            "«Dodaj pracownika»: id Telegrama (numeryczne, przez @userinfobot), imię, username opcjonalnie i rola — «kierownik projektów» albo «menedżer». Osoba dodana przez Ciebie nie ma kierownika; przypisz ją w kolumnie «Kierownik».",
            "Bot wysyła zaproszenie z przyciskiem «Открыть панель». Nie dotarło — osoba nie nacisnęła «Start» w bocie; gdy to zrobi — «wyślij zaproszenie» w jej wierszu. Jeśli to id już było i zostało wyłączone — osoba wróci z całą swoją historią.",
            "«odśwież menu komend bota» — gdy ktoś nie widzi w bocie /login. Menu i tak odświeża się przy każdym wdrożeniu, dodaniu i wyłączeniu pracownika.",
          ],
        },
      },
      {
        id: "claim",
        title: "Kierownik i jego zespół",
        body: {
          head: [
            "W kolumnie «Kierownik» menedżer bez kierownika ma przycisk **«przejmij»**. Po jego kliknięciu menedżer jest w Twoim zespole: jego statystyki i «Plan i wykonanie» są u Ciebie, plan kontaktów ustalasz mu Ty, a Tobie nalicza się 5% od jego transakcji. Właściciel dostanie powiadomienie.",
            "Jeśli dwóch kierowników kliknie jednocześnie, menedżer trafi do jednego z nich.",
            "Odpiąć menedżera albo przekazać go innemu kierownikowi może tylko właściciel — u siebie zobaczysz «Ty · odpina właściciel».",
          ],
          admin: [
            "Kolumna «Kierownik»: wybierz kierownika i «zapisz» albo «bez kierownika», żeby odpiąć. Osoba dostanie wiadomość.",
            "Kierownik sam przejmuje nieprzypisanych menedżerów przyciskiem «przejmij», a ci, których sam dodał, od razu są jego. Dostajesz o tym wiadomość z przyciskiem «Команда». Odpinasz tylko Ty.",
            "Co znaczy „zespół”: statystyki i «Plan i wykonanie» menedżera są u kierownika, plan kontaktów ustala kierownik, a on dostaje 5% od każdej transakcji menedżera (współzałożyciel — 0).",
          ],
        },
      },
      {
        id: "plan",
        title: "Plan kontaktów",
        body: {
          head: [
            "Swoim menedżerom — w kolumnie «Plan kontaktów»: liczba «na tydzień» i «zapisz». Sobie planu nie ustalasz — robi to właściciel.",
            "Puste pole — «bez planu»: porcja dnia to wtedy 5 firm. 0 — nie ma planu i nie ma porcji. Od planu zależy wielkość [porcji dnia](/admin/prospect): plan ÷ 5, od 2 do 15 dziennie.",
          ],
          admin: [
            "Kolumna «Plan kontaktów» — dla każdego oprócz siebie. Kierownik ustala plan tylko swoim ludziom. Puste pole — «bez planu» (porcja 5 dziennie), 0 — ani planu, ani porcji, maksimum 500.",
          ],
        },
      },
      {
        id: "grade",
        title: "Poziom i stawka",
        body: {
          head: [
            "Poziom i indywidualną stawkę ustala właściciel — widzisz je, ale nie możesz zmieniać. Poziom określa procent od zysku netto transakcji: młodszy menedżer — 10% od nowego klienta, menedżer — 15%, kierownik — 30%. Szczegóły — w sekcji [«Finanse»](/admin/finance).",
          ],
          admin: [
            "«młodszy menedżer» (10% od nowego klienta, 0 od dosprzedaży), «menedżer» (15% i 5%), «kierownik» (30% i 30%). «Stawka indywidualna, %» zastępuje poziom tylko przy nowych klientach; puste pole — «wg poziomu».",
            "Przy zmianie roli poziom zmienia się sam: kierownik dostaje «kierownik», menedżer — «menedżer»; indywidualna stawka zostaje.",
          ],
        },
      },
      {
        id: "role",
        title: "Rola",
        roles: ["admin"],
        body: [
          "«zmień na kierownika» / «zmień na menedżera». Roli administratora nie da się nikomu nadać przez panel.",
          "Jeśli odbierzesz komuś rolę kierownika, jego zespół zostaje odpięty: panel napisze, ilu menedżerów zostało bez kierownika — przypisz ich do innego. Sami menedżerowie nie dostają o tym wiadomości.",
          "Nie możesz zdegradować siebie ani ostatniego administratora.",
        ],
      },
      {
        id: "notices",
        title: "Jakie wiadomości wysyła bot",
        roles: ["admin", "head"],
        body: {
          head: [
            "W ostatniej kolumnie przy każdym Twoim menedżerze i przy Tobie jest wiersz **«Powiadomienia»** — obok napis «przychodzi wszystko» albo «wyłączone: 2 z 8». Kliknij go: rozwiną się pola wyboru. Zaznaczone — bot to wysyła, odznaczone — nie. Zaznacz, co trzeba, i kliknij **«Zapisz»**. Nowi pracownicy mają domyślnie zaznaczone wszystko.",
            "Pod każdym polem jest opis, co się stanie bez niego — przeczytaj, zanim je odznaczysz. Najważniejsze: **«Nowe zgłoszenia z kolejki»**. Bez niego osoba wypada z [kolejki](#leads-queue) — leady nie są jej proponowane i od razu trafiają do następnej. To wygodne na czas urlopu albo zwolnienia lekarskiego: dostęp zostaje, a zgłoszenia nie czekają po pół godziny.",
            "Pozostałe pola usuwają tylko wiadomość w Telegramie — sama praca zostaje w panelu: przypomnienie widać w karcie leada, porcję dnia — w sekcji [«Zimne kontakty»](/admin/prospect), odpowiedź klienta na kontakt — tamże. Jeśli odznaczysz «Odpowiedzi klientów na kontakty», klient może czekać na odpowiedź, dopóki menedżer sam nie zajrzy do «Zimnych kontaktów» — odznaczaj tylko wtedy, gdy odpowiedziami zajmuje się ktoś inny. **«Dzień dobry o 9:00»** — co rano bot życzy tej osobie miłego dnia, po imieniu i w języku jej panelu; odznacz, jeśli jej to niepotrzebne. **«Przypomnienie o 12:00, jeśli dzień nie ruszył»** — w południe bot przypomni osobie o porcji, jeśli w ciągu dnia nie ma jeszcze ani kontaktów, ani panelu; nie warto odznaczać — o milczeniu i tak dowiesz się o 15:00.",
            "Nie da się wyłączyć: zaproszenia do panelu, zmiany roli i kierownika, prośby o potwierdzenie przekazania leada — bez tych wiadomości akcja się nie odbędzie. Pola menedżerów zmieniasz Ty i właściciel; sami menedżerowie ich nie widzą. Kto i kiedy je zmieniał — w dzienniku.",
          ],
          admin: [
            "W ostatniej kolumnie przy każdym pracowniku (i przy Tobie) jest wiersz **«Powiadomienia»** — obok «przychodzi wszystko» albo «wyłączone: 2 z 8». Kliknij: rozwiną się pola wyboru, zaznaczone — bot wysyła, odznaczone — nie. **«Zapisz»**. Domyślnie wszyscy mają zaznaczone wszystko. Kierownik projektów też zmienia pola — swoim menedżerom i sobie, ale nie innemu kierownikowi i nie Tobie.",
            "Każda rola ma swój zestaw. Menedżer — zgłoszenia z kolejki i zgłoszenia dla wszystkich, przypomnienia, wiadomości w czacie leada, przekazania, odpowiedzi na kontakty, porcja dnia, rekomendacje na tydzień, zadania i «Dzień dobry o 9:00» — życzenia miłego dnia po imieniu, codziennie rano, także w weekend. Kierownik — do tego jeszcze raporty. Ty — «Kopie propozycji z kolejki» (komu i kiedy kolejka zaproponowała leada), raporty i zadania, bez kolejki i porcji: nie stoisz w kolejce. Porannych życzeń nie dostajesz — są dla pracowników. Menedżer i kierownik mają jeszcze «Przypomnienie o 12:00, jeśli dzień nie ruszył» — osobiste przypomnienie o porcji dla kogoś, kto do południa nic nie zrobił. Wiersz «🔕 К 15:00 молчат» przychodzi do Ciebie i kierowników pod «Raportami».",
            "Najważniejsze pole — **«Nowe zgłoszenia z kolejki»**: bez niego osoba wypada z [kolejki](#leads-queue), leady trafiają do następnej. Pozostałe usuwają tylko wiadomość w Telegramie, praca zostaje w panelu. Jeśli wszystkim odznaczysz «Zgłoszenia dla wszystkich», nocnych zgłoszeń i «🔥 Нужен прототип» z kontaktów nikt nie zobaczy w Telegramie — tylko w panelu i na czacie sprzedaży, jeśli jest. Autor kontaktu dostaje «🛠 Хотят прототип» zawsze — jako pierwszy i na 30 minut.",
            "Nie da się wyłączyć: zaproszenia, zmiany roli i kierownika, prośby o potwierdzenie przekazania, wiadomości do Ciebie o pieniądzach i umowach. Kto i kiedy zmieniał pola — w [dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "sections",
        title: "Dostęp do działów: zaznaczenia właściciela",
        roles: ["admin"],
        body: [
          "W ostatniej kolumnie przy każdym kierowniku i menedżerze jest wiersz **«Działy»** — obok «jak dla roli» albo ile działów otworzyłeś ponad rolę i ile zamknąłeś. Kliknij — otworzy się lista wszystkich działów panelu z zaznaczeniami: stoją przy tych, które człowiek widzi teraz, a «inaczej niż rola» — tam, gdzie już coś zmieniłeś. Zaznaczysz — dział pojawi się w jego menu i się otworzy; odznaczysz — zniknie z menu, a z bezpośredniego linku panel przeniesie go do «Leady». Kliknij **«Zapisz»**: zmiana działa od razu, człowiek nie musi logować się ponownie. Każde zapisanie trafia do [dziennika](/admin/audit).",
          "Zaznaczenie daje **podgląd**: człowiek widzi dział, wszystko, co w nim pokazane, i instrukcję do niego — z adnotacją, że dział otworzył mu właściciel. Co może w dziale zmieniać, nadal decyduje rola. Menedżer, któremu otworzyłeś «Partnerzy», zobaczy partnerów, ale decyzje o wypłatach, stawkach i usuwaniu zostają przy Tobie; jeśli kliknie przycisk, którego nie ma jego rola, panel niczego nie zmieni i przeniesie go do «Leady». Żeby człowiek pracował w dziale w pełni, zmień mu rolę.",
          "«Leady» i «Instrukcje» są zawsze otwarte dla wszystkich, dlatego nie ma ich na liście. Tobie otwarte jest wszystko. Zapisuje się tylko to, co zmieniłeś: jeśli potem zmienisz człowiekowi rolę, działy, których nie ruszałeś, same będą jak dla nowej roli, a Twoje zaznaczenia zostaną.",
        ],
      },
      {
        id: "unlimited",
        title: "Limit leadów: komu nie potrzeba nocnego udziału",
        roles: ["admin"],
        body: [
          "Przy menedżerach i kierownikach w ostatniej kolumnie jest wiersz **«Leady: w nocy po równym udziale»** z przyciskiem **«Zdejmij limit»**. W nocy, od 18:00 do 08:00, lead jest otwarty dla wszystkich w kolejce, ale każdy bierze nie więcej niż równą część na miesiąc: tak jedna niespiąca osoba nie zabiera wszystkiego. Po kliknięciu «Zdejmij limit» wiersz zmienia się na **«Leady: bez limitu»** i ta osoba w nocy bierze leady bez ograniczeń. **«Przywróć limit»** przywraca udział. Twoja decyzja z 23.10.2026: bez limitu pracują Dina i Aleksander.",
          "W dzień nic się nie zmienia: lead nadal trafia na 30 minut do tego, czyja kolej, i cudzego leada w te pół godziny nie da się wziąć. Leady wzięte bez limitu wchodzą do wspólnego licznika miesiąca, więc udział pozostałych od tego tylko rośnie. Zmiana działa od razu, każde kliknięcie trafia do [dziennika](/admin/audit) jako «zdjął lub przywrócił pracownikowi limit leadów». Przycisk widzisz tylko Ty.",
        ],
      },
      {
        id: "details",
        title: "Dane pracownika: imię i nazwisko, imię w panelu, username, telefon",
        roles: ["admin", "head"],
        body: {
          head: [
            "U Ciebie i u każdego menedżera w ostatniej kolumnie jest **«Zmień dane»**. Są tam cztery pola: **«Imię i nazwisko»** — w pełnym brzmieniu, do umów; **«Imię w panelu»** — krótkie, podpisane są nim leady i zadania, widzą je wszyscy; **«Username»** — @ w Telegramie; **«Telefon»**. Popraw i kliknij **«Zapisz dane»**. Imię i nazwisko oraz telefon są potem widoczne w wierszu pracownika pod imieniem i pod id Telegrama.",
            "Nowe imię albo username od razu pojawia się przy wszystkich leadach pracownika — na liście leadów pod statusem. Id Telegrama się tu nie zmienia: przez nie pracownik loguje się do panelu przez bota. Dane drugiego kierownika i właściciela zmienia tylko właściciel; menedżerowie nie zmieniają swoich danych.",
          ],
          admin: [
            "U każdego pracownika, także u Ciebie, w ostatniej kolumnie jest **«Zmień dane»**: **«Imię i nazwisko»** (w pełnym brzmieniu, do umów), **«Imię w panelu»** (krótkie, podpisane są nim leady i zadania), **«Username»** (@ w Telegramie) i **«Telefon»**. Popraw i kliknij **«Zapisz dane»**; imię i nazwisko oraz telefon są widoczne w wierszu pracownika pod imieniem i pod id Telegrama.",
            "Nowe imię albo username od razu pojawia się przy wszystkich leadach pracownika — na liście pod statusem. Id Telegrama się nie zmienia: przez nie odbywa się logowanie przez bota. Kierownik zmienia dane sobie i menedżerom, menedżerowie — nikomu. Kto co zmienił — w [dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "disable",
        title: "Wyłącz pracownika",
        roles: ["admin", "head"],
        body: {
          head: [
            "Swoich i cudzych **menedżerów** możesz wyłączyć sam: w ostatniej kolumnie «Wyłącz» → przeczytaj, co się stanie → **«Rozumiem, wyłącz»**. Kierownika i właściciela wyłącza tylko właściciel, siebie — nikt.",
            "Od razu: dostęp zamknięty, wszystkie sesje przerwane, linki logowania przestają działać. Dalej system działa sam: leady w toku wracają do kolejki, przypomnienia i prośby o przekazanie są zamykane, niewysłane kontakty wracają do puli, a trwające korespondencje przechodzą do kierownika wyłączonej osoby (czyli do Ciebie, jeśli to Twój menedżer) albo do właściciela.",
            "Jednego system nie zrobi: **usuń tę osobę ręcznie** z kanału «Devuz Scout» i z czatu sprzedaży — bot nie może nikogo wyrzucić z kanału.",
            "Wyłączeni nie są usuwani — są na liście «Wyłączeni» z datą: zostają przy nich zamknięte leady, naliczenia i dziennik. Przywrócenie — dodaj osobę ponownie z tym samym id Telegrama, włączy się jej dawny wpis.",
          ],
          admin: [
            "«Wyłącz» → przeczytaj, co się stanie → **«Rozumiem, wyłącz»**. Od razu: dostęp zamknięty, wszystkie sesje przerwane, linki logowania przestają działać. Menedżerów może wyłączać także kierownik projektów; kierownika — tylko Ty.",
            "Dalej system działa sam: jego leady w toku wracają do kolejki («↩️ Лид вернулся в очередь…»), jego pół godziny w kolejce przepada, przypomnienia i prośby o przekazanie są zamykane, niewysłane kontakty wracają do puli, a trwające korespondencje przechodzą do jego kierownika albo do Ciebie. Gdy ktoś weźmie z kolejki leada z takiej korespondencji, korespondencja przejdzie do tej osoby. Jego zespół (jeśli był kierownikiem) zostaje odpięty, a karty leadów w jego Telegramie są usuwane.",
            "Jednego system nie zrobi: **usuń tę osobę ręcznie** z kanału «Devuz Scout» i z czatu sprzedaży.",
            "Wyłączeni nie są usuwani — są na liście «Wyłączeni». Przywrócenie — dodaj ponownie z tym samym id.",
          ],
        },
      },
      {
        id: "app-devices",
        title: "Aplikacja i powiadomienia: kto ma włączone",
        roles: ["admin", "head"],
        body: [
          "Pod imieniem każdego pracownika — wiersz «📱 Aplikacja: N urządzeń» albo «📱 Aplikacja: niewłączona». To liczba telefonów i komputerów, na których ta osoba włączyła powiadomienia panelu; najedź myszą — zobaczysz, które («iPhone · app», «Android · Chrome», «Windows · Chrome»). Jak zainstalować aplikację i włączyć powiadomienia — w [instrukcji do «Strony głównej»](/admin/help#hq-app).",
          "Powiadomienia powtarzają wiadomości bota, więc zaznaczenia powyżej działają też dla nich: odznaczysz — nie przyjdzie ani do Telegrama, ani do aplikacji. Twoje ogłoszenie w karcie «Pracownikom» na [Stronie głównej](/admin/hq) też przychodzi do aplikacji; ogłoszenie «Użytkownikom bota» — nie, pracowników tam nie ma.",
          "U siebie w ostatniej kolumnie — «To urządzenie: powiadomienia włączone» albo «wyłączone», z przyciskami «Włącz powiadomienia», «Sprawdź» i «Wyłącz». Chodzi o telefon albo komputer, z którego teraz patrzysz: innej osobie nie włączysz stąd powiadomień — tylko ona sama na swoim urządzeniu. Urządzenie, które się wypisało albo usunęło aplikację, samo znika z licznika przy pierwszym powiadomieniu.",
        ],
      },
    ],
  },

  /* ── Партнёры ─────────────────────────────────────────────────────── */
  "/admin/partners": {
    what: "Osoby, które przyprowadzają klientów ze swojego linku i dostają procent od zysku z projektu. Tutaj są ich linki, klienci, naliczenia, wnioski o wypłatę i materiały promocyjne, które publikują u siebie. Sekcja dla właściciela i kierownika. Decyzja o wypłacie, indywidualna stawka partnera i usunięcie partnera — tylko u właściciela: to pieniądze dla osób spoza studia.",
    items: [
      {
        id: "join",
        title: "Skąd bierze się partner",
        body: [
          "Sam: na stronie w menu «Зарабатывай с нами» klika «Стать партнёром» albo «Войти в кабинет» — bot go rejestruje i wysyła jednorazowy przycisk logowania do panelu partnera. To samo robią komendy /ref i /cabinet w bocie. Może to być każdy poza pracownikami studia: bot porównuje Telegram z listą pracowników i zamiast rejestracji odpowiada, że program jest zamknięty dla zespołu — klienci pracowników liczą się w panelu. Wpis założony wcześniej też nic pracownikowi nie otwiera: ani linków, ani wypłat, ani panelu partnera.",
          "Albo Ty: «Dodaj partnera ręcznie» — imię, kod (puste — wymyślimy), Telegram id opcjonalnie, notatka. Bez Telegram id taki partner nie połączy się z osobą, która przyjdzie później przez bota, i nie zaloguje się do panelu partnera. Telegram id pracownika panel nie przyjmie. Partnerów, których Telegram należy do pracownika, tabela «Wszyscy partnerzy» oznacza «pracownik studia».",
          "Linki: krótki `devuz.studio/r/…` — to ten link partner publikuje, osobny dla każdego kanału (w panelu partnera albo `/ref KOD etykieta`), do 20. W panelu partner wybiera, dokąd prowadzi link (strona główna, usługi, realizacje, bot), i bonus dla odbiorców — rabat 5/10/15% na pierwszy projekt. Stare `?ref=KOD` i `start=ref_KOD` działają jak dotąd. Wejście z linku strona zapamiętuje w cookie przeglądarki na 30 dni (wygrywa pierwszy partner): zgłoszenie w tym czasie to klient partnera, nawet jeśli osoba wróciła już bez linku. W karcie leada przy «Partner» widać, ile dni przed zgłoszeniem było wejście. W bocie obowiązuje te same 30 dni.",
          "Wejścia liczą się po osobach: robot podglądu w komunikatorze i ponowne otwarcie przez tę samą osobę tego samego dnia się nie liczą. W tabeli poniżej przy linku widać „wejścia / zgłoszenia”; najedź na kod — zobaczysz krótki adres.",
        ],
      },
      {
        id: "count",
        title: "Kiedy klient się zalicza",
        body: {
          head: [
            "Lead z linku zalicza się partnerowi, jeśli to nie on sam, klient nie był u nas wcześniej, a partner nie jest zablokowany. Zaliczony — partner dostaje «🤝 По вашей ссылке пришёл…». Partner zostaje przy kliencie, nawet jeśli ten wszedł na stronę z linku, a napisał już do bota z czatu na stronie.",
            "Projekt z takiego leada dziedziczy partnera. Zmienić w karcie projektu, kto polecił klienta, procent i «Nie zaliczać, powód» może tylko właściciel. Gdy do projektu zostanie wgrany skan podpisanej umowy, partner od razu dostaje «📝 С клиентом … подписан договор» — z kwotą i przybliżonym udziałem.",
            "Blokada zatrzymuje tylko nowe zaliczenia: dawne naliczenia i wypłaty zostają.",
          ],
          admin: [
            "Lead z linku zalicza się partnerowi, jeśli to nie on sam, klient nie był u nas wcześniej, a partner nie jest zablokowany. Zaliczony — partner dostaje «🤝 По вашей ссылке пришёл…». Partner zostaje przy kliencie, nawet jeśli ten wszedł na stronę z linku, a napisał już do bota z czatu na stronie.",
            "Projekt z takiego leada dziedziczy partnera. W karcie projektu, w bloku «Partner», można zmienić, kto polecił klienta, procent i «Nie zaliczać, powód». Gdy do projektu zostanie wgrany skan podpisanej umowy, partner od razu dostaje «📝 С клиентом … подписан договор» — z kwotą i przybliżonym udziałem.",
            "Blokada zatrzymuje tylko nowe zaliczenia: dawne naliczenia i wypłaty zostają.",
          ],
        },
      },
      {
        id: "percent",
        title: "Procent",
        body: [
          "Dwa modele, partner wybiera sam w panelu partnera. «Od zysku netto» (kwota − podatek − koszt wytworzenia): do $2 500 — 10%, $2 501–5 000 — 15%, $5 001–10 000 — 20%, $10 001–30 000 — 25%, od $30 001 — 30%. «Od obrotu» (cała kwota umowy) przy tych samych progach: 6, 10, 14, 17, 20%. Próg każdego projektu zależy od jego własnej kwoty. W tabeli «Wszyscy partnerzy», w kolumnie «Stawka», widać model i kiedy go zmieniono.",
          "Model można zmienić najwyżej raz w tygodniu, a przy kliencie zostaje ten, który obowiązywał w dniu jego zgłoszenia: zmiana nie przelicza projektów, które już trwają. W karcie projektu przy «Partner» — «20 % od zysku» albo «14 % od obrotu». Procent ustawiony na projekcie jest ważniejszy niż indywidualna stawka partnera, a indywidualna — ważniejsza niż próg. Przy modelu „od zysku” wpisz koszt wytworzenia projektu — bez niego udział liczy się od kwoty pomniejszonej tylko o podatek.",
          "Naliczenie jest zamrożone, dopóki klient nie opłaci projektu w całości — tak jak u pracowników.",
          "Skarbonka. W panelu partnera jest przełącznik «Nie wypłacaj automatycznie» (w rosyjskiej wersji panelu — «Не забирать в автоматическом режиме»). Dopóki jest włączony, pieniądze za opłacone projekty nie idą do partnera od razu: nie ma automatycznych wypłat od obrotu, a stawka dla wszystkich opłaconych i jeszcze niewypłaconych projektów liczy się od ich łącznej kwoty — według tej samej tabeli. Trzy projekty po $2 000 to $6 000, więc dla wszystkich trzech jest 20% od zysku (14% od obrotu) zamiast 10% (6%). Studio dłużej trzyma pieniądze u siebie i inwestuje je w rozwój, a partner w efekcie dostaje więcej. Stawka nigdy nie jest niższa niż zwykła; projekt z procentem ustawionym ręcznie i partner z indywidualną stawką w skarbonce nie uczestniczą. W tabeli «Wszyscy partnerzy», w kolumnie «Stawka», taki partner ma zielony wiersz «skarbonka: $… · stawka …%». Wyłączył przełącznik — podwyżka znika, niewypłacone liczy się według zwykłego progu każdego projektu, a automatyczne wypłaty od obrotu wracają.",
        ],
      },
      {
        id: "agencies",
        title: "Agencje partnerów",
        body: [
          "Partner może podłączyć w swoim panelu dowolną agencję lub firmę, z której regularnie przychodzą zamówienia na development: firmę IT, studio webowe, agencję marketingową, integratora, generalnego wykonawcę przetargów IT (my jesteśmy u niego podwykonawcą). Przekazuje nam ona zamówienia swoich klientów w podwykonawstwo. Dostajesz «🏢 Партнёр подключает агентство», a na tej stronie w bloku «Agencje partnerów» pojawia się wiersz «czeka na decyzję». **«Zatwierdź»** — jeśli agencja jeszcze z nami nie pracowała; **«odrzuć»** z powodem — jeśli pracowała albo to nie jest agencja. Bot pisze do partnera w obu przypadkach.",
          "Zatwierdzona agencja to wszystkie jej zamówienia dla partnera przez 12 miesięcy od zatwierdzenia, bez 30-dniowego okna i bez sprawdzania, czy klient był już w studiu: powtarzalne zamówienia agencji to właśnie cały sens. Termin widać w wierszu agencji: «zamówienia dla partnera do …». Gdy minie, nowe zamówienia agencji idą jak zwykłe, a już przypisane zostają przy partnerze; przycisk **«Przedłuż o 12 miesięcy»** zaczyna nowy termin od dziś. Ponowne «Zatwierdź» przy odłączonej agencji też zaczyna termin od nowa. Zgłoszenia ze strony i z bota rozpoznają się same — po danych kontaktowych agencji (@nick, telefon, e-mail) albo po nazwie firmy. Zamówienie, które przyszło telefonicznie albo w prywatnej wiadomości do menedżera, przypisz w karcie projektu: blok «Partner» → «Zlecenie agencji».",
          "Jedna agencja — jeden partner: tej samej agencji nie da się podłączyć drugi raz. «odłącz» przy podłączonej — nowe zamówienia agencji nie trafiają już do partnera, przypisane zostają. W karcie projektu «Zlecenie agencji» proponuje tylko agencje, którym termin jeszcze nie minął.",
          "W panelu partnera są dwie prezentacje do wysyłania — «DevUz Studio» (zespół, projekty, języki, usługi, ceny „od”, realizacje) i «Program dla agencji i firm» (modele, przykład z agencją, podwykonawstwo w przetargach). Link zawiera kod partnera, więc klient, który przyszedł z prezentacji, zalicza się jemu.",
        ],
      },
      {
        id: "claims",
        title: "Klienci przypisani ręcznie",
        body: [
          "Partner, który sam przyprowadza firmę — bez linku — przypisuje ją w swoim panelu na stronie, w bloku «Moi klienci»: nazwa, NIP/INN (uzbecki numer podatkowy STIR, 9–12 cyfr) — jeśli partner go zna, osoba kontaktowa, telefon albo Telegram (co najmniej jedno), strona i czego klient potrzebuje. Zatwierdzać nie trzeba — przypisanie działa od razu, a klient należy do tego, kto przypisał go pierwszy. Za to przy zgłoszeniu baza sama sprawdza, czy tej firmy nie ma wśród leadów, projektów, umów i w [Zimnych kontaktach](/admin/prospect) — po NIP/INN, nazwie, telefonie, Telegramie i stronie — i czy nie przypisał jej inny partner albo jego agencja. Jak porównujemy: zgodny NIP/INN, telefon, Telegram lub strona — to ta sama firma. Zgadza się tylko nazwa — decyduje NIP/INN: jeśli jest znany po obu stronach i różny, to dwie różne firmy o tej samej nazwie i można przypisać. Jeśli partner nie podał NIP/INN, a my mamy taką firmę z numerem — zobaczy «Mamy już firmę o tej nazwie. Podaj NIP/INN…». Jeśli my nie mamy numeru (lead albo kontakt bez NIP/INN) — nie ma czym odróżnić i firma liczy się jako nasza. Nie przeszła sprawdzenia — partner widzi odmowę z powodem («Studio zna już tę firmę…», «Tę firmę przypisał już inny partner»), a przypisania nie ma. Dzięki temu nie da się „zaklepać” firm, z którymi już pracujemy albo do których już pisaliśmy. Więcej niż 20 przypisań w miesiącu od jednego partnera nie jest przyjmowanych.",
          "Dostajesz «🧾 Партнёр закрепил клиента» (partner przypisał klienta) z NIP/INN i kontaktem, a tutaj pojawia się wiersz w bloku «Klienci przypisani przez partnerów». Od razu z przypisania powstaje priorytetowy lead «od partnera» ze wszystkim, co podał partner — widzą go wszyscy menedżerowie (jak jest rozdzielany — w punkcie [kolejka](#leads-queue)). Od tej chwili przez 12 miesięcy wszystkie zamówienia klienta zaliczają się partnerowi — «zamówienia dla partnera do …», a partner dostaje «🧾 Клиент … закреплён за вами и передан менеджерам» (klient przypisany i przekazany menedżerom). Jeśli klient napisze później sam, jego zapytanie też zostanie rozpoznane: z formularza na stronie, z czatu i z bota — po zgodności NIP/INN, nazwy, telefonu albo Telegramu; a także później — gdy menedżer wpisze NIP/INN w karcie leada. Link partnera albo jego agencja, jeśli zadziałały, są ważniejsze niż przypisanie. Projekt z takiego leada dziedziczy partnera. Minęło 12 miesięcy — «termin minął»: nowe zamówienia idą jak zwykłe, już przypisane zostają przy partnerze, a firmę można znów przypisać.",
          "Widzisz, że firma tak naprawdę jest nasza — pracowaliśmy z nią poza panelem, to znajomi studia — wpisz powód i kliknij **«anuluj przypisanie»**. Bez powodu anulowanie się nie uda: partner dostanie go w bocie. Po anulowaniu nowe zapytania klienta nie są zaliczane partnerowi; lead albo projekt, który zdążył się już przypisać, przenosisz w karcie projektu, w bloku «Partner».",
        ],
      },
      {
        id: "promo",
        title: "Materiały promocyjne",
        body: [
          "Magazyn filmów i grafik studia, które partnerzy publikują u siebie: Reels, Shorts, TikTok, relacje, kanały. Otwiera się linkiem «Materiały promocyjne» na górze tej strony — albo bezpośrednio: [Materiały promocyjne](/admin/partners/promo). Partner widzi je w swoim panelu na stronie, w bloku «Materiały promocyjne»: podgląd, «Pobierz» i «Opis do posta» z przyciskiem «Kopiuj opis». W podpisie jest już krótki link właśnie tego partnera, więc klient, który przyszedł z jego posta, zalicza się jemu — tak samo jak z każdego jego linku. Dopóki nie ma materiałów, partner w ogóle nie widzi tego bloku.",
          "Wgrywanie: wybierz plik — film MP4, MOV, WebM albo grafikę PNG, JPG, WebP, GIF, do 500 MB. Pliki leżą na dysku naszego serwera, nie w Supabase: tam w darmowym planie jest najwyżej 50 MB na plik i 5 GB pobrań miesięcznie. Serwer odmówi także wtedy, gdy po wgraniu na dysku zostałoby mniej niż 2 GB — i poda, ile jest wolnego miejsca. Nazwę widzą partnerzy. «Język słów w filmie» decyduje o kolejności: partner najpierw widzi materiały w swoim języku i «bez słów», potem pozostałe — nie trzeba ukrywać innych języków, partner z Taszkentu publikuje i rosyjski, i uzbecki film. Kliknij **«Wgraj»**: plik idzie na serwer kawałkami po 4 MB, pasek pokazuje postęp; kawałek, przy którym zerwało się połączenie, zostanie dosłany sam. Nie zamykaj strony, dopóki nie pojawi się «Gotowe» — porzucone wgrywanie zostanie usunięte z serwera po dobie.",
          "Podpis do posta: `{link}` w tekście zamieni się w krótki link każdego partnera; jeśli zapomnisz `{link}` — link trafi do ostatniej linijki, bo post bez linku nic partnerowi nie da. Zostawisz pole puste — partner dostanie domyślny podpis w swoim języku (widać go na szaro w pustym polu). Pole wyboru «Powiadom partnerów w Telegramie, że pojawił się nowy materiał» — bot napisze do wszystkich aktywnych partnerów, że jest nowy materiał. Jeśli wgrywasz kilka plików po kolei, zaznacz je tylko przy ostatnim, inaczej partner dostanie kilka wiadomości z rzędu.",
          "Przy każdym materiale widać, ile razy go pobrano i przez ilu różnych partnerów: od razu wiadomo, czego potrzebują, a co leży na darmo. Nazwę, język i podpis edytujesz na miejscu — «zapisz». **«Ukryj przed partnerami»** usuwa materiał z panelu partnera i od razu blokuje pobieranie, ale plik zostaje — przywrócisz go przyciskiem «Pokaż partnerom». «usuń» → **«Usuń na stałe»** kasuje także plik z serwera; kopie, które partnerzy już pobrali, zostają u nich. Pliki filmów nie wchodzą do nocnej kopii zapasowej bazy — oryginały trzymaj u siebie.",
        ],
      },
      {
        id: "payout",
        title: "Wypłata dla partnera",
        body: {
          head: [
            "Partner klika «Zleć wypłatę» w swoim panelu (w rosyjskiej wersji — «Запросить выплату») albo pisze do bota /payout i dane do przelewu (USDT TRC-20 lub tekst). Można to zrobić od pierwszego dnia roboczego miesiąca, od $50, jeden otwarty wniosek, zawsze na całą dostępną kwotę. Właściciel dostaje «💸 Заявка на выплату», a tutaj pojawia się wiersz w bloku «Wnioski o wypłatę».",
            "Decyduje właściciel: przelewa pieniądze i klika «Wypłacono» albo «odrzuć». U ciebie w wierszu widać partnera, kwotę i dane do przelewu, a zamiast przycisków — «decyduje właściciel»: wypłata to pieniądze dla osób spoza studia i decyzja o nich należy do właściciela.",
            "Model „od obrotu” nie czeka na wniosek: gdy tylko płatności za projekt osiągną jego kwotę — płatność zapisano w [Finansach](/admin/finance) albo przy fakturze umowy kliknięto «Opłacona» — wniosek o wypłatę tworzy się sam, na cały udział partnera w tym projekcie, bez czekania na początek miesiąca i bez minimum $50. Partner dostaje «✅ … выплата в обработке» (wypłata w realizacji), a właściciel — «💸 Выплата партнёру с оборота: выплатить … за …» (wypłata od obrotu: wypłać … za …). W bloku «Wnioski o wypłatę» taki wiersz ma podpis «od obrotu za „…” — utworzona automatycznie po pełnej opłacie projektu». Model „od zysku” — jak dotąd na wniosek partnera: jego udział zależy od kosztu wytworzenia.",
            "Partner z włączoną skarbonką odbiera pieniądze sam, kiedy zdecyduje — tym samym wnioskiem («Zleć wypłatę» albo /payout), z tym samym oknem od pierwszego dnia roboczego miesiąca i minimum $50. Wniosek zamyka wszystkie projekty ze skarbonki po jej stawce: ta stawka zostaje przy nich na stałe, a kolejna skarbonka zaczyna się od zera. Jeśli właściciel odrzuci wniosek, projekty wracają do skarbonki.",
          ],
          admin: [
            "Partner klika «Zleć wypłatę» w swoim panelu (w rosyjskiej wersji — «Запросить выплату») albo pisze do bota /payout i dane do przelewu (USDT TRC-20 lub tekst). Można to zrobić od pierwszego dnia roboczego miesiąca, od $50, jeden otwarty wniosek, zawsze na całą dostępną kwotę. Dostajesz «💸 Заявка на выплату».",
            "Najpierw sam przelej pieniądze, potem w bloku «Wnioski o wypłatę» kliknij **«Wypłacono»** (można z notatką). Albo «odrzuć» — kwota wróci do dostępnych środków, a partner zobaczy powód.",
            "Model „od obrotu” nie czeka na wniosek: gdy tylko płatności za projekt osiągną jego kwotę — płatność zapisano w [Finansach](/admin/finance) albo przy fakturze umowy kliknięto «Opłacona» — wniosek o wypłatę tworzy się sam, na cały udział partnera w tym projekcie, bez czekania na początek miesiąca i bez minimum $50. Partner dostaje «✅ … выплата в обработке» (wypłata w realizacji; jeśli nie ma danych do przelewu — prośbę o wpisanie ich w panelu partnera), a Ty — «💸 Выплата партнёру с оборота: выплатить … за …» (wypłata od obrotu: wypłać … za …). W bloku «Wnioski o wypłatę» taki wiersz ma podpis «od obrotu za „…” — utworzona automatycznie po pełnej opłacie projektu»; dalej jak ze zwykłym: przelałeś — **«Wypłacono»**. Dla jednego projektu taki wniosek tworzy się dokładnie raz: jeśli go odrzucisz, kwota wróci do dostępnych środków partnera i poprosi on o nią zwykłym wnioskiem. Jeśli zapis płatności urwał się w połowie, sweep (przebieg według harmonogramu) utworzy brakujący wniosek w ciągu kilku minut. Model „od zysku” — jak dotąd na wniosek partnera: jego udział zależy od kosztu wytworzenia.",
            "Partner z włączoną skarbonką odbiera pieniądze sam, kiedy zdecyduje — tym samym wnioskiem («Zleć wypłatę» albo /payout), z tym samym oknem od pierwszego dnia roboczego miesiąca i minimum $50. Wniosek zamyka wszystkie projekty ze skarbonki po jej stawce: ta stawka zostaje przy nich na stałe, a kolejna skarbonka zaczyna się od zera. Jeśli odrzucisz wniosek, projekty wracają do skarbonki.",
          ],
        },
      },
      {
        id: "delete",
        title: "Usuwanie partnera",
        roles: ["admin"],
        body: [
          "W tabeli «Wszyscy partnerzy», w kolumnie «Edycja», pod «zapisz» — «usuń». Rozwija się ostrzeżenie: linki partnera przestaną działać, panel i logowanie przez bota zostaną zamknięte; z jego projektów i zgłoszeń zniknie «kto przyprowadził» — naliczeń za nie już nie będzie; agencje i przypisani klienci zostaną usunięci. Przycisk **«Usuń na zawsze»**. Nie da się tego cofnąć — można tylko dodać partnera od nowa. Partner nie dostaje żadnej wiadomości.",
          "Partnera z wypłatami usunąć nie można: wypłata to pieniądze, które już wyszły albo czekają na decyzję, i ich historia nie może zniknąć. U takiego partnera zamiast przycisku jest wyjaśnienie; można go tylko zablokować. Usunięcie trafia do [Dziennika](/admin/audit). Partnerów z Telegramem pracownika tabela oznacza «pracownik studia» — to ich usuwaj: pracownik nie może być partnerem.",
        ],
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
          "Dziennik pokazów zapisuje każde otwarcie prototypu przez żywą osobę: czas, adres i przeglądarkę; podglądy komunikatorów i Twoje otwarcia z panelu nie są zapisywane. To dowód, że klient widział makietę i przyjął warunki. Do wezwania zapisz wynik sprawdzenia i zamów notarialne oględziny strony.",
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
          "Pod stroną «Marketing» na stronie studia (devuz.studio/ru/marketing i devuz.studio/uz/marketing) codziennie wychodzą dwa krótkie artykuły — o 10:00 i o 16:00 czasu taszkenckiego, od razu po rosyjsku i po uzbecku. Pisze je tani model według listy tematów w `content/marketing-topics.ts`: wyjaśnienie pod to, czego szuka się w Uzbekistanie («что такое SMM», «SMM nima», «реклама в Ташкенте» — frazy z Google Trends; przed każdym artykułem zmiana jeszcze raz pyta Google Trends i Wordstat, z czym w Uzbekistanie wyszukuje się jego frazę, i wstawia pasujące frazy do tekstu; Wordstat odpowiada, gdy na serwerze jest jego token `WORDSTAT_TOKEN`), znana kampania reklamowa, częsty błąd, promocja branży w danym kanale — po kolei. Fraza stoi w tytule, opisie i pierwszym akapicie — bez tego artykuł nie wychodzi. Nie trafiają na listę «Do sprawdzenia»: wychodzą same, od razu trafiają do mapy strony, a Bing i Yandex dostają sygnał. Po co: każdy artykuł to kolejna strona, po której znajdują nas w Google i Yandex, a na końcu każdego jest oferta «strona + marketing» i kalkulator.",
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
          "Opublikowana analiza w ciągu godziny dostaje jeszcze dwie strony — po angielsku (devuz.studio/en/razbor) i po polsku (devuz.studio/pl/razbor). Pisze je sam serwer, bez sprawdzania w panelu: bierze opublikowany artykuł rosyjski i przenosi go pod zapytanie w tym języku — «restaurant website in Tashkent», «strona internetowa dla restauracji w Taszkencie» — sprawdzone w Google Trends i Wordstat. Ustalenia, liczby i zrzuty ekranu — te same; nowych liczb, procentów i ustaleń kod nie przepuszcza, a cyrylicy w tych wersjach być nie może.",
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
        title: "Menu: grupy sekcji i «Znajdź sekcję lub firmę»",
        body: {
          manager: [
            "To, czego używa się codziennie, jest w nagłówku osobnymi przyciskami: «Pulpit», «Zadania» (obok — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Leady», «Zimne kontakty», «Makiety». Reszta jest zebrana w grupy: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu». «Statystyki» i «Instrukcje» — osobnymi linkami. Na komputerze najedź myszą na grupę — otworzy się lista jej sekcji; kliknięcie w grupę przypina listę, drugie kliknięcie ją zamyka.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów»; «Projekty» · «Umowy»; «Statystyki» · «Etapy sprzedaży». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał.",
            "Grupa otwartej sekcji jest podświetlona na zielono, a na najszerszym ekranie obok jej nazwy widać też samą sekcję, na przykład «Pieniądze · Umowy»; na liście grupy otwarta sekcja też jest zielona. Na telefonie zamiast rzędu grup jest jeden przycisk **«Menu»**: obok niego widać, w której sekcji jesteś, a dotknięcie otwiera wszystkie grupy jedną listą. Menu zamyka krzyżyk, klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** po prawej w rzędzie menu: sekcje znów staną w jednym rzędzie, jak dawniej, bez grup i wyszukiwania. Włączysz go — grupy wrócą. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **«Znajdź sekcję lub firmę»** po prawej w rzędzie menu (na wąskim ekranie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Na telefonie to samo pole jest na początku «Menu».",
          ],
          head: [
            "To, czego używa się codziennie, jest w nagłówku osobnymi przyciskami: «Pulpit», «Zadania» (obok — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Leady», «Zimne kontakty», «Makiety». Reszta jest zebrana w grupy: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu»; **«Marketing»** — «Ruch», «Partnerzy», «Pracownicy AI»; **«Zespół»** — «Zespół», «Szkolenia». «Statystyki» i «Instrukcje» — osobnymi linkami. Na komputerze najedź myszą na grupę — otworzy się lista jej sekcji; kliknięcie w grupę przypina listę, drugie kliknięcie ją zamyka.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów» · «Konta»; «Projekty» · «Umowy»; «Finanse» · «Wydatki»; «Ruch» · «Reklamy»; «Zespół» · «Kandydaci»; «Statystyki» · «Etapy sprzedaży». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał.",
            "Grupa otwartej sekcji jest podświetlona na zielono, a na najszerszym ekranie obok jej nazwy widać też samą sekcję, na przykład «Pieniądze · Umowy»; na liście grupy otwarta sekcja też jest zielona. Na telefonie zamiast rzędu grup jest jeden przycisk **«Menu»**: obok niego widać, w której sekcji jesteś, a dotknięcie otwiera wszystkie grupy jedną listą. Menu zamyka krzyżyk, klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** po prawej w rzędzie menu: sekcje znów staną w jednym rzędzie, jak dawniej, bez grup i wyszukiwania. Włączysz go — grupy wrócą. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **«Znajdź sekcję lub firmę»** po prawej w rzędzie menu (na wąskim ekranie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Na telefonie to samo pole jest na początku «Menu».",
          ],
          admin: [
            "To, czego używa się codziennie, jest w nagłówku osobnymi przyciskami: «Pulpit», «Zadania» (obok — liczba twoich otwartych zadań, czerwona, jeśli są wśród nich po terminie), «Leady», «Zimne kontakty», «Makiety». Reszta jest zebrana w grupy: **«Pieniądze»** — «Projekty», «Finanse», «Zamówienia sklepu»; **«Marketing»** — «Ruch», «Partnerzy», «Analizy», «Pracownicy AI»; **«Zespół»** — «Zespół», «Szkolenia»; **«Raporty»** — «Statystyki», «Dziennik». «Instrukcje» — osobnym linkiem. Na komputerze najedź myszą na grupę — otworzy się lista jej sekcji; kliknięcie w grupę przypina listę, drugie kliknięcie ją zamyka.",
            "Od 25.10.2026 rzadsze sekcje są **kartami wewnątrz sekcji**: rząd kart stoi nad stroną, otwarta karta jest podświetlona na zielono. «Zimne kontakty» · «Sygnały skauta» · «Analiza rozmów» · «Konta»; «Makiety» · «Prototypy»; «Projekty» · «Umowy»; «Finanse» · «Wydatki»; «Zamówienia sklepu» · «Wydania»; «Ruch» · «Reklamy»; «Zespół» · «Kandydaci»; «Statystyki» · «Etapy sprzedaży»; «Dziennik» · «Użycie». Adresy i zakładki są te same, a «Znajdź sekcję lub firmę» znajduje też karty: wpisz «umo» — otworzą się «Umowy». Gdy otwarta jest karta, w menu świeci się jej sekcja. W karcie projektu, leada czy umowy rzędu kart nie ma — tam by rozpraszał. Zamkniesz komuś sekcję ptaszkiem — jej karty same staną u niego w menu, w tej samej grupie.",
            "Grupa otwartej sekcji jest podświetlona na zielono, a na najszerszym ekranie obok jej nazwy widać też samą sekcję, na przykład «Pieniądze · Umowy»; na liście grupy otwarta sekcja też jest zielona. Na telefonie zamiast rzędu grup jest jeden przycisk **«Menu»**: obok niego widać, w której sekcji jesteś, a dotknięcie otwiera wszystkie grupy jedną listą. Menu zamyka krzyżyk, klawisz Esc, kliknięcie obok albo samo przejście do sekcji. Wolisz po staremu — wyłącz przełącznik **«Nowe menu»** po prawej w rzędzie menu: sekcje znów staną w jednym rzędzie, jak dawniej, bez grup i wyszukiwania. Włączysz go — grupy wrócą. Wybór zapamiętuje się dla Ciebie, na wszystkich Twoich urządzeniach, i nie dotyczy kolegów.",
            "Najszybciej — **«Znajdź sekcję lub firmę»** po prawej w rzędzie menu (na wąskim ekranie — ikona lupy) albo klawisze **Ctrl+K** (na Macu — ⌘K) w dowolnym miejscu panelu. Zacznij pisać: «umo» — pierwsza będzie sekcja «Umowy». Nazwa firmy, imię, numer zgłoszenia, strona, telefon lub @nick — niżej pojawią się **«Firmy i leady»**: leady, zimne kontakty i projekty, po prawej podpisane, co to jest. Enter otwiera wybrane, strzałki ↑ ↓ wybierają inne. Leady wyszukujemy tylko wśród tych, które widzisz w «Leady»; po telefonie i @nicku menedżer znajduje tylko swoje leady — dane cudzego nie są mu otwarte nawet w karcie. Kontakt, z którego wyrósł lead, otwiera się kartą leada. Na telefonie to samo pole jest na początku «Menu».",
            "Menu słucha Twoich [ptaszków sekcji](#team-sections): otworzysz komuś sekcję — pojawi się u niego w swojej grupie (na przykład «Ruch» — w «Marketingu»; jeśli to jego jedyna sekcja w tej grupie — osobnym linkiem), zamkniesz — zniknie i z grupy, i z wyszukiwania. Menedżer i kierownik mają mniej grup: grupa, w której człowiek nie ma żadnej sekcji, w nagłówku się nie pojawia. Nowa sekcja panelu dostaje grupę przy tworzeniu — menu nie trzeba ustawiać osobno.",
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
