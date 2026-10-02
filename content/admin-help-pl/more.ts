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
    what: "Pliki gotowych produktów, które kupujący dostają po opłaceniu zamówienia w sekcji «Zamówienia». Opublikowanie pliku oznacza decyzję, co dokładnie dostanie każdy, kto już zapłacił — dlatego ta sekcja jest tylko u właściciela.",
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
          "Jeśli na górze widzisz ostrzeżenie o `DOWNLOAD_SIGNING_SECRET` — pobieranie nie działa u nikogo. Dostęp odbierasz przyciskiem na karcie zamówienia w sekcji [«Zamówienia»](/admin/orders).",
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
            "Pozostałe pola usuwają tylko wiadomość w Telegramie — sama praca zostaje w panelu: przypomnienie widać w karcie leada, porcję dnia — w sekcji [«Kontakty»](/admin/prospect), odpowiedź klienta na kontakt — tamże. Jeśli odznaczysz «Odpowiedzi klientów na kontakty», klient może czekać na odpowiedź, dopóki menedżer sam nie zajrzy do «Kontaktów» — odznaczaj tylko wtedy, gdy odpowiedziami zajmuje się ktoś inny.",
            "Nie da się wyłączyć: zaproszenia do panelu, zmiany roli i kierownika, prośby o potwierdzenie przekazania leada — bez tych wiadomości akcja się nie odbędzie. Pola menedżerów zmieniasz Ty i właściciel; sami menedżerowie ich nie widzą. Kto i kiedy je zmieniał — w dzienniku.",
          ],
          admin: [
            "W ostatniej kolumnie przy każdym pracowniku (i przy Tobie) jest wiersz **«Powiadomienia»** — obok «przychodzi wszystko» albo «wyłączone: 2 z 8». Kliknij: rozwiną się pola wyboru, zaznaczone — bot wysyła, odznaczone — nie. **«Zapisz»**. Domyślnie wszyscy mają zaznaczone wszystko. Kierownik projektów też zmienia pola — swoim menedżerom i sobie, ale nie innemu kierownikowi i nie Tobie.",
            "Każda rola ma swój zestaw. Menedżer — zgłoszenia z kolejki i zgłoszenia dla wszystkich, przypomnienia, wiadomości w czacie leada, przekazania, odpowiedzi na kontakty, porcja dnia, rekomendacje na tydzień, zadania. Kierownik — do tego jeszcze raporty. Ty — «Kopie propozycji z kolejki» (komu i kiedy kolejka zaproponowała leada), raporty i zadania, bez kolejki i porcji: nie stoisz w kolejce.",
            "Najważniejsze pole — **«Nowe zgłoszenia z kolejki»**: bez niego osoba wypada z [kolejki](#leads-queue), leady trafiają do następnej. Pozostałe usuwają tylko wiadomość w Telegramie, praca zostaje w panelu. Jeśli wszystkim odznaczysz «Zgłoszenia dla wszystkich», nocnych zgłoszeń i «🔥 Нужен прототип» z kontaktów nikt nie zobaczy w Telegramie — tylko w panelu i na czacie sprzedaży, jeśli jest. Autor kontaktu dostaje «🛠 Хотят прототип» zawsze — jako pierwszy i na 30 minut.",
            "Nie da się wyłączyć: zaproszenia, zmiany roli i kierownika, prośby o potwierdzenie przekazania, wiadomości do Ciebie o pieniądzach i umowach. Kto i kiedy zmieniał pola — w [dzienniku](/admin/audit).",
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
    ],
  },

  /* ── Партнёры ─────────────────────────────────────────────────────── */
  "/admin/partners": {
    what: "Osoby, które przyprowadzają klientów ze swojego linku i dostają procent od zysku z projektu. Tutaj są ich linki, klienci, naliczenia, wnioski o wypłatę i materiały promocyjne, które publikują u siebie. Sekcja tylko dla właściciela: to pieniądze dla osób spoza studia.",
    items: [
      {
        id: "join",
        title: "Skąd bierze się partner",
        body: [
          "Sam: na stronie w menu «Зарабатывай с нами» klika «Стать партнёром» albo «Войти в кабинет» — bot go rejestruje i wysyła jednorazowy przycisk logowania do panelu partnera. To samo robią komendy /ref i /cabinet w bocie. Może to być każdy, także pracownik.",
          "Albo Ty: «Dodaj partnera ręcznie» — imię, kod (puste — wymyślimy), Telegram id opcjonalnie, notatka. Bez Telegram id taki partner nie połączy się z osobą, która przyjdzie później przez bota, i nie zaloguje się do panelu partnera.",
          "Linki: krótki `devuz.studio/r/…` — to ten link partner publikuje, osobny dla każdego kanału (w panelu partnera albo `/ref KOD etykieta`), do 20. W panelu partner wybiera, dokąd prowadzi link (strona główna, usługi, realizacje, bot), i bonus dla odbiorców — rabat 5/10/15% na pierwszy projekt. Stare `?ref=KOD` i `start=ref_KOD` działają jak dotąd. Wejście z linku strona zapamiętuje w cookie przeglądarki na 30 dni (wygrywa pierwszy partner): zgłoszenie w tym czasie to klient partnera, nawet jeśli osoba wróciła już bez linku. W karcie leada przy «Partner» widać, ile dni przed zgłoszeniem było wejście. W bocie obowiązuje te same 30 dni.",
          "Wejścia liczą się po osobach: robot podglądu w komunikatorze i ponowne otwarcie przez tę samą osobę tego samego dnia się nie liczą. W tabeli poniżej przy linku widać „wejścia / zgłoszenia”; najedź na kod — zobaczysz krótki adres.",
        ],
      },
      {
        id: "count",
        title: "Kiedy klient się zalicza",
        body: [
          "Lead z linku zalicza się partnerowi, jeśli to nie on sam, klient nie był u nas wcześniej, a partner nie jest zablokowany. Zaliczony — partner dostaje «🤝 По вашей ссылке пришёл…». Partner zostaje przy kliencie, nawet jeśli ten wszedł na stronę z linku, a napisał już do bota z czatu na stronie.",
          "Projekt z takiego leada dziedziczy partnera. W karcie projektu, w bloku «Partner», można zmienić, kto polecił klienta, procent i «Nie zaliczać, powód». Gdy do projektu zostanie wgrany skan podpisanej umowy, partner od razu dostaje «📝 С клиентом … подписан договор» — z kwotą i przybliżonym udziałem.",
          "Blokada zatrzymuje tylko nowe zaliczenia: dawne naliczenia i wypłaty zostają.",
        ],
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
          "Partner, który sam przyprowadza firmę — bez linku — przypisuje ją w swoim panelu na stronie, w bloku «Moi klienci»: nazwa, NIP/INN (uzbecki numer podatkowy STIR, 9–12 cyfr) — jeśli partner go zna, osoba kontaktowa, telefon albo Telegram (co najmniej jedno), strona i czego klient potrzebuje. Zatwierdzać nie trzeba — przypisanie działa od razu, a klient należy do tego, kto przypisał go pierwszy. Za to przy zgłoszeniu baza sama sprawdza, czy tej firmy nie ma wśród leadów, projektów, umów i w [Kontaktach](/admin/prospect) — po NIP/INN, nazwie, telefonie, Telegramie i stronie — i czy nie przypisał jej inny partner albo jego agencja. Jak porównujemy: zgodny NIP/INN, telefon, Telegram lub strona — to ta sama firma. Zgadza się tylko nazwa — decyduje NIP/INN: jeśli jest znany po obu stronach i różny, to dwie różne firmy o tej samej nazwie i można przypisać. Jeśli partner nie podał NIP/INN, a my mamy taką firmę z numerem — zobaczy «Mamy już firmę o tej nazwie. Podaj NIP/INN…». Jeśli my nie mamy numeru (lead albo kontakt bez NIP/INN) — nie ma czym odróżnić i firma liczy się jako nasza. Nie przeszła sprawdzenia — partner widzi odmowę z powodem («Studio zna już tę firmę…», «Tę firmę przypisał już inny partner»), a przypisania nie ma. Dzięki temu nie da się „zaklepać” firm, z którymi już pracujemy albo do których już pisaliśmy. Więcej niż 20 przypisań w miesiącu od jednego partnera nie jest przyjmowanych.",
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
        body: [
          "Partner klika «Zleć wypłatę» w swoim panelu (w rosyjskiej wersji — «Запросить выплату») albo pisze do bota /payout i dane do przelewu (USDT TRC-20 lub tekst). Można to zrobić od pierwszego dnia roboczego miesiąca, od $50, jeden otwarty wniosek, zawsze na całą dostępną kwotę. Dostajesz «💸 Заявка на выплату».",
          "Najpierw sam przelej pieniądze, potem w bloku «Wnioski o wypłatę» kliknij **«Wypłacono»** (można z notatką). Albo «odrzuć» — kwota wróci do dostępnych środków, a partner zobaczy powód.",
          "Model „od obrotu” nie czeka na wniosek: gdy tylko płatności za projekt osiągną jego kwotę — płatność zapisano w [Finansach](/admin/finance) albo przy fakturze umowy kliknięto «Opłacona» — wniosek o wypłatę tworzy się sam, na cały udział partnera w tym projekcie, bez czekania na początek miesiąca i bez minimum $50. Partner dostaje «✅ … выплата в обработке» (wypłata w realizacji; jeśli nie ma danych do przelewu — prośbę o wpisanie ich w panelu partnera), a Ty — «💸 Выплата партнёру с оборота: выплатить … за …» (wypłata od obrotu: wypłać … za …). W bloku «Wnioski o wypłatę» taki wiersz ma podpis «od obrotu za „…” — utworzona automatycznie po pełnej opłacie projektu»; dalej jak ze zwykłym: przelałeś — **«Wypłacono»**. Dla jednego projektu taki wniosek tworzy się dokładnie raz: jeśli go odrzucisz, kwota wróci do dostępnych środków partnera i poprosi on o nią zwykłym wnioskiem. Jeśli zapis płatności urwał się w połowie, sweep (przebieg według harmonogramu) utworzy brakujący wniosek w ciągu kilku minut. Model „od zysku” — jak dotąd na wniosek partnera: jego udział zależy od kosztu wytworzenia.",
          "Partner z włączoną skarbonką odbiera pieniądze sam, kiedy zdecyduje — tym samym wnioskiem («Zleć wypłatę» albo /payout), z tym samym oknem od pierwszego dnia roboczego miesiąca i minimum $50. Wniosek zamyka wszystkie projekty ze skarbonki po jej stawce: ta stawka zostaje przy nich na stałe, a kolejna skarbonka zaczyna się od zera. Jeśli odrzucisz wniosek, projekty wracają do skarbonki.",
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
          "Prototypy z dopiskiem «zbudowany automatycznie, do kontaktu» panel zbudował bez Ciebie, przygotowując wiadomość kontaktu: firmom z najsłabszymi stronami, w branżach, które obsługuje budowniczy. Nazwa, kontakty, logo i zdjęcia — z jego strony, usługi — te, które są napisane na jego stronie, każda porównana słowo w słowo. Kontrola jest ta sama co przy budowanych ręcznie: z zastrzeżeniem prototyp zostaje «szkic» i nie trafia do wiadomości.",
          "Link takiego prototypu wychodzi w wiadomości kontaktu sam — nie trzeba klikać «Wysłałem klientowi»: prototyp staje się «wysłany», gdy wyszła wiadomość. Jak to wygląda u menedżera — [prototyp z wyprzedzeniem](#prospect-proto-ahead).",
        ],
      },
      {
        id: "check",
        title: "Kontrola i link",
        body: [
          "Gotową stronę czyta kontrola: zmyślone liczby, procenty, przechwałki, brak nazwy firmy, niedziałający przycisk, usługi, których klient nie wymienił. Jeśli coś znajdzie — prototyp zostaje «szkic», link zwraca 404, a problemy są wypisane: popraw je i zbuduj ponownie.",
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
    what: "Artykuły z analizami cudzych stron na naszą stronę: zmiana sama pisze je każdego ranka i zostawia Ci do sprawdzenia. Opublikowana analiza od razu pojawia się na stronie i w wyszukiwarce — w imieniu studia nazywa cudzą stronę słabą, dlatego decydujesz tylko Ty.",
    items: [
      {
        id: "shift",
        title: "Zmiana analiz",
        body: [
          "Codziennie o 08:03 czasu taszkenckiego zmiana bierze z «Kontaktów» strony, do których jeszcze nie pisaliśmy, przegląda do 12 i pisze do 3 analiz — po rosyjsku i po uzbecku. Raport «Смена разборов» przychodzi w Telegramie: ile wyszło i dlaczego pozostałych nie wzięto.",
          "Powody odrzucenia: strona się nie otworzyła, strona jest w porządku albo ma za mało ustaleń, nie udało się ustalić branży lub miasta, branży nie analizujemy (medycyna), artykuł nie przeszedł kontroli. Jeśli do 11:03 raportu nie ma — przyjdzie «Смена разборов — молчит».",
        ],
      },
      {
        id: "tender",
        title: "Przetargowa analiza tygodnia",
        body: [
          "Raz w tygodniu, w pierwszy dzień tygodnia po 08:33 czasu taszkenckiego, osobna zmiana pisze analizę przetargową: nie cudzą stronę, tylko typową specyfikację techniczną zamówienia IT — strona urzędu, CRM, system obiegu dokumentów, chatbot i tak dalej. Co w takiej specyfikacji zwykle się pomija, czym to się kończy przy odbiorze i jak napisać ją dobrze. Temat to kolejny z listy w `content/razbor/tenders.ts`; artykuł nie wymienia zamawiających, przetargów ani kwot kontraktów. Jeśli w poniedziałek serwer nie działał, artykuł wyjdzie w ten dzień tygodnia, w którym serwer wróci.",
          "Artykuł trafia tutaj, na listę «Do sprawdzenia», z oznaczeniem «przetargi i zamówienia publiczne» — nie ma zrzutów i nie będzie miał, tak ma być. Sprawdzasz i publikujesz go tak samo jak analizę strony; na stronie prowadzi do usługi «Тендеры и госконтракты» i do strony «Контакты». Raport przychodzi w Telegramie osobną linijką «Тендерный разбор недели». Odrzucony temat nie jest pisany drugi raz; gdy tematy się skończą, raport to powie — listę uzupełnia się w kodzie.",
        ],
      },
      {
        id: "review",
        title: "Sprawdź analizę",
        body: [
          "Na liście «Do sprawdzenia» są oba artykuły w całości. Przeczytaj oba: to nie są wzajemne tłumaczenia, tylko różne strony pod różne zapytania. Adres strony źródłowej widzisz tylko Ty — na stronie go nie ma.",
          "Sprawdź, że firma nie jest nigdzie wymieniona — ani nazwą, ani adresem, ani na grafice — i że każda liczba jest w ustaleniach. «Edytuj» zmienia tylko tekst: tytuł, opis, wstęp, ustalenia i podsumowanie; adres i zapytanie się nie zmieniają.",
        ],
      },
      {
        id: "publish",
        title: "Opublikuj, zdejmij, odrzuć",
        body: [
          "**«Opublikuj»** — potrzebne są oba artykuły. Strona od razu otwiera się na witrynie, mapa strony się aktualizuje, Bing i Yandex dostają sygnał. **«Zdejmij z publikacji»** przywraca analizę na listę «Do sprawdzenia».",
          "**«Nie publikujemy»** — z powodem albo bez. Zmiana nie wróci już do tej strony. Przywrócić stronę do kolejki zmiany można tylko przez **«Usuń»** (wpisz «usuń»).",
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
        "Napisz /login — przyjdzie przycisk «🔓 Открыть панель» i jednorazowy link ważny 15 minut. Przyciski «Открыть» pod wiadomościami też same logują do panelu.",
        "Nie wyciszaj powiadomień: propozycja z kolejki jest aktualna 30 minut, a gdy powiadomienie milczy, lead przejdzie do następnej osoby.",
        "Jakie wiadomości wysyła bot, wybierają właściciel i kierownik projektów polami wyboru na stronie «Zespół». Czegoś nie dostajesz — zapytaj ich: możliwe, że to pole zostało odznaczone.",
        "Menedżerowie i kierownicy: przycisk «▶️ Получать лиды» na dole czatu (albo /leads) włącza strumień firm ponad porcję, «⏸ Не получать лиды» — wyłącza go. Szczegóły — w sekcji «Kontakty».",
        "Napisz /ref, jeśli chcesz przyprowadzać klientów i dostawać procent.",
      ],
    },
    {
      name: "Kanał «Devuz Scout»",
      url: SCOUT_URL,
      what: "Tutaj skaut przysyła osoby, które właśnie teraz szukają programisty na otwartych czatach, oraz poranne podsumowanie. Szczegóły — w sekcji «Wyszukiwanie».",
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
