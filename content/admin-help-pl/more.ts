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
        id: "lead-kinds",
        title: "«Jakie leady wysyłać» za pracownika",
        roles: ["admin", "head"],
        body: [
          "Pod imieniem osoby, obok «Powiadomień», jest wiersz **«Leady · wszystkie rodzaje»** albo «Leady · 4 z 7 rodzajów». Kliknij: otworzy się siedem pól «Jakie leady wysyłać» — «Zimne kontakty», «Przetargi», «Sygnały z grup (skaut)», «Partnerzy i agencje», «Zgłoszenia ze strony i z bota», «Makieta z bota», «Pomoc z AI (Claudery)». Odznacz zbędne i kliknij **«Zapisz»**. Sam pracownik ustawia te same pola sobie w [Ustawieniach](/admin/settings), więc może je zmienić także po tobie; kto i kiedy zmieniał — w dzienniku.",
          "Odznaczony rodzaj do osoby nie przychodzi i [kolejka](#leads-queue) go nie proponuje: lead trafia do tych, którzy mają ten rodzaj wybrany. Nie wybrał nikt — lead trafia do wszystkich jak dotąd, a ty dostajesz wiersz «🧭 … nie wybrał nikt», raz na lead (pod «Raportami»). Nocny równy udział i «Leady bez limitu» liczą się jak dotąd, po całej kolejce.",
        ],
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
    what: "Osoby, które przyprowadzają klientów ze swojego linku lub kodu promocyjnego i dostają procent od kwoty projektu. Tutaj są ich linki, klienci, naliczenia, wnioski o wypłatę i materiały promocyjne, które publikują u siebie. Sekcja dla właściciela i kierownika. Decyzja o wypłacie, indywidualna stawka partnera i usunięcie partnera — tylko u właściciela: to pieniądze dla osób spoza studia.",
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
        id: "card",
        title: "Karta partnera: jego klienci",
        body: [
          "Kliknij imię partnera w «Wszyscy partnerzy» (albo liczbę w kolumnie «Klienci») — otworzy się jego karta. Na górze: wejścia ze wszystkich jego linków, ilu ma klientów i ile projektów opłacono, «Zarobione» i «Dostępne». Niżej — «Linki partnera»: każdy link z wejściami i zgłoszeniami.",
          "Najważniejsze w karcie — **«Klienci partnera»**: każde zgłoszenie zaliczone partnerowi, nowe na górze. W wierszu: kiedy przyszło; klient — kliknięcie otwiera [kartę leada](#leads-card); skąd — etykieta linku, agencja albo przypięty klient; «Gdzie teraz» — zgłoszenie, w pracy, umowa, umowa podpisana, opłacone albo nie wyszło, dokładnie to, co partner widzi u siebie w panelu; «Prowadzi» — kto z zespołu wziął leada; «Projekt» i «Naliczone partnerowi». Niżej — projekty zaliczone mu ręcznie w karcie projektu, jego przypięci klienci i agencje. Partner nie widzi kontaktów swoich klientów, ty — widzisz w karcie leada, jak zwykle.",
        ],
      },
      {
        id: "percent",
        title: "Procent",
        body: [
          "Procent liczymy od kwoty umowy, według progu kwoty projektu: do $2 500 — 6%, $2 501–5 000 — 10%, $5 001–10 000 — 14%, $10 001–30 000 — 17%, od $30 001 — 20%. Próg każdego projektu zależy od jego własnej kwoty. Od 05.11.2026 model jest jeden: wyboru «Od zysku netto» w panelu partnera już nie ma, wszystkich partnerów przeniesiono na «Od obrotu» (decyzja właściciela: partner od razu widzi, ile dostanie, i nie trzeba czekać na koszt wytworzenia). W tabeli «Wszyscy partnerzy», w kolumnie «Stawka», widać model i kiedy go zmieniono.",
          "Projekt, który już szedł w modelu „od zysku”, jest dokańczany w nim: model zostaje przy kliencie z dnia jego zgłoszenia, a zmiana nie przelicza projektów, które już trwają. W karcie projektu przy «Partner» — «14 % od obrotu», a przy takim starym projekcie — «20 % od zysku»: wpisz dla niego koszt wytworzenia, bez niego udział liczy się od kwoty pomniejszonej tylko o podatek. Procent ustawiony na projekcie jest ważniejszy niż indywidualna stawka partnera, a indywidualna — ważniejsza niż próg.",
          "Naliczenie jest zamrożone, dopóki klient nie opłaci projektu w całości — tak jak u pracowników. Agencja ma własną stawkę: 15% od kwoty projektu, bez modeli i skarbonki, a od $50 000 zleceń — 20% na zawsze; jest na liście z oznaczeniem «agencja · 15%» albo «agencja · 20%», szczegóły w zakładce [Agencje](/admin/agencies).",
          "Od 05.11.2026 skarbonki nie ma: przełącznik «Nie wypłacaj automatycznie» zniknął z panelu partnera, a u partnera, który miał go włączonego, został wyłączony. Każdy projekt liczy się według swojego progu, a udział za projekt opłacony w całości partner dostaje bez wniosku (punkt [wypłata](#partners-payout)). Przywrócić skarbonkę może tylko właściciel.",
          "Na zawsze +5. Gdy suma zleceń partnera z całego czasu dojdzie do $50 000, do stawki każdego kolejnego projektu dochodzi 5 — na zawsze, bez przeglądu: do progu tabeli. Liczą się kwoty projektów z umów, bez anulowanych i niezaliczonych; projekt, którym przekroczono próg, jest jeszcze po starej stawce. Procentu ustawionego ręcznie na projekcie dodatek nie rusza; indywidualna stawka partnera rośnie tak samo, na przykład 10% staje się 15%. Z poziomami blogera za 12 miesięcy (właściciel ustawia je procentem na projekcie) się nie sumuje. Taki partner ma w «Wszyscy partnerzy» oznaczenie «+5% na zawsze», a w karcie projektu — «+5 na zawsze za 50 000 $ zleceń». Ile zostało do progu, partner widzi w swoim panelu. Decyzja właściciela z 05.11.2026.",
        ],
      },
      {
        id: "agencies",
        title: "Agencje partnerów",
        body: [
          "Od 05.11.2026 partner nie podłącza agencji: w panelu partnera tego bloku już nie ma. Agencja ma własne warunki — sama zostaje naszym partnerem-agencją i dostaje 15% od kwoty każdego projektu ([Agencje](/admin/agencies)); zakłada ją ten, kto ją znalazł. Blok «Agencje partnerów» na tej stronie jest widoczny tylko wtedy, gdy są w nim wcześniejsze wpisy; na 05.11.2026 nie ma żadnego.",
          "Taki stary wpis działa jak dotąd: zatwierdzona agencja to wszystkie jej zamówienia dla partnera przez 12 miesięcy od zatwierdzenia, bez 30-dniowego okna i bez sprawdzania, czy klient był już w studiu. Termin widać w wierszu agencji: «zamówienia dla partnera do …». Gdy minie, nowe zamówienia agencji idą jak zwykłe, a już przypisane zostają przy partnerze; przycisk **«Przedłuż o 12 miesięcy»** zaczyna nowy termin od dziś. Zgłoszenia ze strony i z bota rozpoznają się same — po danych kontaktowych agencji (@nick, telefon, e-mail) albo po nazwie firmy. Zamówienie, które przyszło telefonicznie albo w prywatnej wiadomości do menedżera, przypisz w karcie projektu: blok «Partner» → «Zlecenie agencji».",
          "Jedna agencja — jeden partner: tej samej agencji nie da się podłączyć drugi raz. «odłącz» przy podłączonej — nowe zamówienia agencji nie trafiają już do partnera, przypisane zostają. W karcie projektu «Zlecenie agencji» proponuje tylko agencje, którym termin jeszcze nie minął.",
          "W panelu partnera są dwie prezentacje do wysyłania — «DevUz Studio» (zespół, projekty, języki, usługi, ceny „od”, realizacje) i «Program dla agencji i firm» (stawki od kwoty projektu, jak przyprowadzić klienta, podwykonawstwo w przetargach, link do warunków agencji). Link zawiera kod promocyjny partnera, więc klient, który przyszedł z prezentacji, zalicza się jemu.",
        ],
      },
      {
        id: "claims",
        title: "Klienci przypisani ręcznie",
        body: [
          "Od 05.11.2026 partner nie przypisuje klientów w swoim panelu: blok «Moi klienci» zniknął, zamiast niego jest [kod promocyjny](#partners-code), który klient podaje sam. Blok «Klienci przypisani przez partnerów» na tej stronie jest widoczny tylko wtedy, gdy są w nim wpisy; na 05.11.2026 nie ma żadnego.",
          "Stare przypisanie działa jak dotąd: przez 12 miesięcy wszystkie zamówienia klienta zaliczają się partnerowi — «zamówienia dla partnera do …»; zapytanie klienta rozpoznajemy po NIP/INN, nazwie, telefonie albo Telegramie. Link i kod promocyjny partnera, jeśli zadziałały, są ważniejsze niż przypisanie. Projekt utworzony z takiego leada dziedziczy partnera. Minęło 12 miesięcy — «termin minął»: nowe zamówienia idą jak zwykłe, już przypisane zostają przy partnerze.",
          "Widzisz, że firma tak naprawdę jest nasza — pracowaliśmy z nią poza panelem, to znajomi studia — wpisz powód i kliknij **«anuluj przypisanie»**. Bez powodu anulowanie się nie uda: partner dostanie go w bocie. Po anulowaniu nowe zapytania klienta nie są zaliczane partnerowi; lead albo projekt, który zdążył się już przypisać, przenosisz w karcie projektu, w bloku «Partner».",
        ],
      },
      {
        id: "code",
        title: "Kod promocyjny partnera — słowo, które klient wypowiada na głos",
        body: [
          "Każdy partner ma **kod promocyjny** — słowo łacińskimi literami, np. AZIZ lub MEDIAPRO. Stoi pod nazwą w «Wszyscy partnerzy» («Kod promocyjny: …»). Tworzy się sam z imienia partnera (z nicka, gdy imię ma mniej niż trzy litery); stary siedmioznakowy kod i wszystkie linki działają jak wcześniej. Decyzja właściciela z 05.11.2026: link ginie, gdy klient pisze do menedżera lub dzwoni, a słowo nie.",
          "Gdzie działa: w linku (devuz.studio/?ref=AZIZ i link do bota), w słowach klienta — „kod AZIZ” w czacie na stronie, w bocie i w zgłoszeniu ze strony — oraz w karcie leada, gdy menedżer wpisuje go w pole «Kod promocyjny lub kto przyprowadził» ([jak](#leads-partner-code)). Klient należy do tego, kto został zapisany pierwszy; klient, który był już w studiu, nie jest zaliczany.",
          "Zmiana słowa — w wierszu partnera, pole **«Kod promocyjny»**, przycisk «zapisz»: litery łacińskie i cyfry, do 12 znaków, jedno słowo — jeden partner. Zajęte lub służbowe słowo (ADMIN, DEVUZ i podobne) się nie zapisze, a panel powie dlaczego. Po zmianie stary kod przestaje działać. Rabat dla klienta z kodem (5, 10 lub 15% na pierwszy projekt) partner wybiera sam w swoim panelu: bez rabatu klienci rzadziej podają kod.",
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
            "Udział od obrotu nie czeka na wniosek: gdy tylko płatności za projekt osiągną jego kwotę — płatność zapisano w [Finansach](/admin/finance) albo przy fakturze umowy kliknięto «Opłacona» — wniosek o wypłatę tworzy się sam, na cały udział partnera w tym projekcie, bez czekania na początek miesiąca i bez minimum $50. Partner dostaje «✅ … выплата в обработке» (wypłata w realizacji), a właściciel — «💸 Выплата партнёру с оборота: выплатить … за …» (wypłata od obrotu: wypłać … za …). W bloku «Wnioski o wypłatę» taki wiersz ma podpis «od obrotu za „…” — utworzona automatycznie po pełnej opłacie projektu». Stary projekt „od zysku” — na wniosek partnera: jego udział zależy od kosztu wytworzenia.",
            "Od 05.11.2026 skarbonki nie ma: udział od obrotu idzie sam, a wnioskiem partner odbiera resztę — udziały ze starych projektów „od zysku” i kwoty, które wróciły po odrzuconej wypłacie.",
          ],
          admin: [
            "Partner klika «Zleć wypłatę» w swoim panelu (w rosyjskiej wersji — «Запросить выплату») albo pisze do bota /payout i dane do przelewu (USDT TRC-20 lub tekst). Można to zrobić od pierwszego dnia roboczego miesiąca, od $50, jeden otwarty wniosek, zawsze na całą dostępną kwotę. Dostajesz «💸 Заявка на выплату».",
            "Najpierw sam przelej pieniądze, potem w bloku «Wnioski o wypłatę» kliknij **«Wypłacono»** (można z notatką). Albo «odrzuć» — kwota wróci do dostępnych środków, a partner zobaczy powód.",
            "Udział od obrotu nie czeka na wniosek: gdy tylko płatności za projekt osiągną jego kwotę — płatność zapisano w [Finansach](/admin/finance) albo przy fakturze umowy kliknięto «Opłacona» — wniosek o wypłatę tworzy się sam, na cały udział partnera w tym projekcie, bez czekania na początek miesiąca i bez minimum $50. Partner dostaje «✅ … выплата в обработке» (wypłata w realizacji; jeśli nie ma danych do przelewu — prośbę o wpisanie ich w panelu partnera), a Ty — «💸 Выплата партнёру с оборота: выплатить … за …» (wypłata od obrotu: wypłać … za …). W bloku «Wnioski o wypłatę» taki wiersz ma podpis «od obrotu za „…” — utworzona automatycznie po pełnej opłacie projektu»; dalej jak ze zwykłym: przelałeś — **«Wypłacono»**. Dla jednego projektu taki wniosek tworzy się dokładnie raz: jeśli go odrzucisz, kwota wróci do dostępnych środków partnera i poprosi on o nią zwykłym wnioskiem. Jeśli zapis płatności urwał się w połowie, sweep (przebieg według harmonogramu) utworzy brakujący wniosek w ciągu kilku minut. Stary projekt „od zysku” — na wniosek partnera: jego udział zależy od kosztu wytworzenia.",
            "Od 05.11.2026 skarbonki nie ma: udział od obrotu idzie sam, a wnioskiem partner odbiera resztę — udziały ze starych projektów „od zysku” i kwoty, które wróciły po odrzuconej wypłacie.",
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

  /* ── Агентства ──────────────────────────────────────────────────────── */
  "/admin/agencies": {
    what: "Agencje to partnerzy studia: agencja przyprowadza nam zlecenia swoich klientów i dostaje 15% od kwoty każdego takiego projektu. Kto z zespołu przyprowadził agencję i dodał ją tutaj, przez 12 miesięcy dostaje 5% od kwoty projektów agencji. Agencję może dodać każdy: zakładka jest przy sekcji «Partnerzy», a kto tej sekcji nie ma, widzi ją od razu w menu.",
    items: [
      {
        id: "terms",
        title: "Warunki: 15% dla agencji, 5% dla tego, kto przyprowadził",
        body: [
          "Agencja dostaje zawsze 15% od kwoty każdego swojego projektu: bez progów tabeli, jakie mają partnerzy z linkiem. Kwota to ta, która stoi w projekcie, czyli w umowie.",
          "Ten, kto przyprowadził agencję, dostaje 5% od kwoty każdego projektu agencji założonego w ciągu 12 miesięcy od dnia, w którym agencję tu dodano. Projekt założony później jest już bez 5%, a założony w terminie zostaje przy nim także potem. Projekt założony wcześniej niż agencja też jest bez 5%: nie przyszedł przez agencję. Termin widać w tabeli, w kolumnie «5% do».",
          "5% dochodzi ponad wszystko inne. Jeśli projekt agencji prowadzisz Ty, Twój procent prowadzącego liczy się jak zwykle, a 5% idzie osobnym wierszem «przyprowadził partnera». Prowadzi ktoś inny: on ma swój procent, Ty swoje 5%.",
          "Obie części są zamrożone, dopóki klient nie opłaci projektu w całości, jak wszystko w [Finansach](/admin/finance): częściowa wpłata to zamrożone, pełna to zarobione. Anulowany projekt nie daje nic.",
        ],
      },
      {
        id: "partners",
        title: "Partnerzy-blogerzy: te same 5% i ile przynieśli",
        body: [
          "Od 10.11.2026 te same 5% od kwoty projektów przez 12 miesięcy dostaje też ten, kto przyprowadził partnera-blogera, nie tylko agencję. Kto przyprowadził partnera, zaznacza właściciel w kolumnie «Kto przyprowadził»; 12 miesięcy liczy się od dnia dodania partnera. Przyprowadziłeś partnera, a ciebie tam nie ma — powiedz właścicielowi.",
          "W tabeli są wszystkie agencje i partnerzy, których przyprowadziłeś (u kierownika i właściciela — wszyscy): ile projektów przyniósł każdy, «Kwota projektów» z umów, «Zapłacone przez klientów» — ile klienci już zapłacili, i twoje 5%. Nad tabelą — suma dla wszystkich twoich.",
        ],
      },
      {
        id: "lifetime",
        title: "20% na zawsze — od $50 000 zleceń agencji",
        body: [
          "Gdy suma zleceń agencji z całego czasu dojdzie do $50 000, jej stawka staje się 20% na zawsze: +5 do każdego kolejnego projektu, bez terminu i bez przeglądu. Liczą się kwoty projektów z umów; anulowane i niezaliczone się nie liczą. Projekt, którym agencja przekroczyła $50 000, jest jeszcze po 15%, następny już po 20%. Decyzja właściciela z 05.11.2026.",
          "Gdzie to widać: w tabeli, w kolumnie «Kwota projektów», pod kwotą — «20% na zawsze» albo «do 20%: jeszcze …»; w «Partnerzy» przy agencji — oznaczenie «agencja · 20%»; w karcie projektu przy wierszu partnera — «+5 na zawsze za 50 000 $ zleceń». Agencja widzi, ile zostało, w swoim panelu, a w prezentacji na stronie — że od $50 000 zleceń będzie 20%. Pieniądze liczą się same: ręcznie niczego nie trzeba ustawiać.",
          "5% dla tego, kto przyprowadził agencję, się nie zmienia: te same 5% od kwoty projektu i te same 12 miesięcy. Dodatek dla agencji studio płaci ze swojej części.",
        ],
      },
      {
        id: "deck",
        title: "Schemat «Jak to działa» i prezentacja dla agencji",
        body: [
          "Na górze zakładki — «Jak to działa — w skrócie»: droga zlecenia w trzech krokach i kto ile dostaje z jednego projektu, z przykładem na $2 000: agencja $300, osoba, która przyprowadziła, $100, reszta dla studia, a z niej prowadzący dostaje swój zwykły procent od zysku. Tu jest wszystko, łącznie z naszymi 5%: to schemat dla zespołu. Wiersz «20%» też jest tutaj — stawka agencji po $50 000 zleceń.",
          "«Otwórz prezentację» — strona na stronie internetowej w sześciu językach (rosyjski, angielski, uzbecki, chiński, ukraiński, polski) dla samej agencji: duża liczba 15%, trzy kroki, przykład z paskami, zasady, co można przyprowadzić, i przycisk do Telegrama. Procentu osoby, która przyprowadziła, tam nie ma i nie będzie: to sprawa wewnętrzna, agencji tego nie pokazujemy. Wyślij link albo otwórz stronę, kliknij przycisk PDF u góry i prześlij plik. W tabeli każda agencja ma własny link «prezentacja»: z nim przycisk Telegrama na stronie prowadzi do bota z kodem tej agencji.",
        ],
      },
      {
        id: "add",
        title: "Jak dodać agencję",
        body: {
          manager: [
            "Blok «Dodaj agencję»: «Nazwa agencji», «Jak do nas pisze: @telegram, telefon lub e-mail» (obowiązkowo), «Strona» i «Notatka» (opcjonalnie). Przycisk «Dodaj agencję». Agencję przyprowadziłeś Ty: zapisuje się na Ciebie i przez 12 miesięcy od tego dnia 5% od kwoty jej projektów jest Twoje.",
            "Dodawaj od razu, gdy umówisz się z agencją, a nie gdy przyjdzie pierwsze zlecenie: termin liczy się od dnia dodania agencji, a projekt założony wcześniej niż agencja nie wchodzi do 5%.",
            "Jedna agencja to jeden wpis. Jeśli agencja z tym samym kontaktem lub nazwą jest już dodana przez Ciebie, kolegę lub partnera, panel odpowie «Ta agencja jest już dodana…» i drugiego wpisu nie będzie. Jeśli to pomyłka, napisz do właściciela: tylko on może zmienić, kto przyprowadził.",
          ],
          head: [
            "Blok «Dodaj agencję»: «Nazwa agencji», «Jak do nas pisze: @telegram, telefon lub e-mail» (obowiązkowo), «Strona» i «Notatka» (opcjonalnie) oraz «Kto przyprowadził», czyli komu trafi 5%: domyślnie Ty, można wybrać pracownika albo «Nikt, przyszła sama». Przycisk «Dodaj agencję».",
            "Dodawaj od razu, gdy umówisz się z agencją, a nie gdy przyjdzie pierwsze zlecenie: termin liczy się od dnia dodania agencji, a projekt założony wcześniej niż agencja nie wchodzi do 5%.",
            "Jedna agencja to jeden wpis: tej samej agencji (ten sam kontakt lub nazwa) nie da się dodać drugi raz, tak samo jak agencji, którą już podłączył partner. Kto przyprowadził, później zmienia tylko właściciel.",
          ],
          admin: [
            "Blok «Dodaj agencję»: «Nazwa agencji», «Jak do nas pisze: @telegram, telefon lub e-mail» (obowiązkowo), «Strona» i «Notatka» (opcjonalnie) oraz «Kto przyprowadził», czyli komu trafi 5%: domyślnie Ty, można wybrać pracownika albo «Nikt, przyszła sama». Przycisk «Dodaj agencję».",
            "Dodawaj od razu, gdy umówisz się z agencją, a nie gdy przyjdzie pierwsze zlecenie: termin liczy się od dnia dodania agencji, a projekt założony wcześniej niż agencja nie wchodzi do 5%.",
            "Jedna agencja to jeden wpis: tej samej agencji (ten sam kontakt lub nazwa) nie da się dodać drugi raz, tak samo jak agencji, którą już podłączył partner. Kto przyprowadził, zmieniasz w samej tabeli: w kolumnie «Kto przyprowadził» wybierz osobę i kliknij «zapisz». Termin 12 miesięcy się nie przesuwa — liczy się od dnia dodania agencji. Każda zmiana jest w [Dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "orders",
        title: "Jak zlecenia agencji trafiają na nią",
        body: {
          manager: [
            "Od razu po dodaniu agencja ma własny link, w tabeli: «link dla agencji». Wyślij go agencji: klient, który przyszedł nim na stronę lub do bota, zapisuje się na agencję tak samo jak klient partnera z linku.",
            "Zgłoszenia, które agencja wysyła sama — ze strony, z czatu lub z bota — panel rozpoznaje po jej kontakcie lub nazwie i zapisuje na agencję, bez linku i bez terminu. Projekt z takiego zgłoszenia dziedziczy agencję, a 15% i 5% pojawiają się w projekcie same.",
            "Zlecenie przyszło telefonem albo w prywatnej wiadomości do menedżera: poproś właściciela, żeby przypiął projekt do agencji, robi to w karcie projektu.",
          ],
          head: [
            "Od razu po dodaniu agencja ma własny link, w tabeli: «link dla agencji». Wyślij go agencji: klient, który przyszedł nim na stronę lub do bota, zapisuje się na agencję tak samo jak klient partnera z linku.",
            "Zgłoszenia, które agencja wysyła sama — ze strony, z czatu lub z bota — panel rozpoznaje po jej kontakcie lub nazwie i zapisuje na agencję, bez linku i bez terminu. Projekt z takiego zgłoszenia dziedziczy agencję, a 15% i 5% pojawiają się w projekcie same.",
            "Zlecenie przyszło telefonem albo w prywatnej wiadomości do menedżera: poproś właściciela, żeby przypiął projekt do agencji, robi to w karcie projektu.",
          ],
          admin: [
            "Od razu po dodaniu agencja ma własny link, w tabeli: «link dla agencji». Wyślij go agencji: klient, który przyszedł nim na stronę lub do bota, zapisuje się na agencję tak samo jak klient partnera z linku.",
            "Zgłoszenia, które agencja wysyła sama — ze strony, z czatu lub z bota — panel rozpoznaje po jej kontakcie lub nazwie i zapisuje na agencję, bez linku i bez terminu. Projekt z takiego zgłoszenia dziedziczy agencję, a 15% i 5% pojawiają się w projekcie same.",
            "Zlecenie przyszło telefonem albo w prywatnej wiadomości: przypnij projekt sam, w karcie projektu, blok «Partner», wybierz agencję. Na liście partnerów agencja ma oznaczenie «agencja · 15%».",
          ],
        },
      },
      {
        id: "money",
        title: "Gdzie widać pieniądze",
        body: {
          manager: [
            "W tabeli «Moje agencje i partnerzy — ci, których przyprowadziłeś» są agencje, które przyprowadziłeś: ile projektów ma agencja, «Kwota projektów» i «5% dla tego, kto przyprowadził», czyli ile zarobione, a ile zamrożone. Te same 5% widać wierszem «przyprowadził partnera» w Twoich [Finansach](/admin/finance): wchodzą do Twojego salda i są wypłacane razem z resztą.",
            "Ile dostaje agencja, nie widzisz: to pieniądze dla osoby z zewnątrz, o wypłacie decyduje właściciel.",
          ],
          head: [
            "W tabeli «Wszystkie agencje i partnerzy» są wszystkie agencje, kto przyprowadził każdą, ile ma projektów, «Kwota projektów», «5% dla tego, kto przyprowadził» i «Dla agencji 15%». Twoje 5% i 5% Twojego zespołu są w [Finansach](/admin/finance), wierszem «przyprowadził partnera».",
            "Agencja jest też na wspólnej liście [Partnerów](/admin/partners), z oznaczeniem «agencja · 15%»: tam są jej naliczenia i wnioski o wypłatę, jak u każdego partnera. O wypłacie decyduje właściciel.",
          ],
          admin: [
            "W tabeli «Wszystkie agencje i partnerzy» są wszystkie agencje, kto przyprowadził każdą, ile ma projektów, «Kwota projektów», «5% dla tego, kto przyprowadził» i «Dla agencji 15%». W [Finansach](/admin/finance) 5% to wiersz «przyprowadził partnera» u tego, kto przyprowadził; odejmuje się od tego, co zostaje studiu, jak każde naliczenie zespołu.",
            "Agencja jest też na wspólnej liście [Partnerów](/admin/partners), z oznaczeniem «agencja · 15%»: tam są jej naliczenia, dane do przelewu i wnioski o wypłatę, jak u każdego partnera. O wypłacie decydujesz Ty.",
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
