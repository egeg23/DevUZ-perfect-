import type { LandingLocale } from "@/content/service-landings";

/**
 * Польские тексты страниц под запросы — для клиентов в Польше (владелец,
 * 18.11.2026: каждый язык — для своего региона, `REGION_BY_LOCALE`).
 * Запросы — как ищут в Польше: «tworzenie stron internetowych», «tworzenie
 * sklepu internetowego» и т. д., без «w Taszkencie». Ташкент — только как
 * адрес офиса (`officeTitle`/`officeText`); Click, Payme, Uzum, 1С, Яндекс и
 * зона .uz убраны. Платёжные системы и доставка — «подключаем то, с чем вы
 * работаете» (Przelewy24, BLIK, PayU, Stripe, InPost), без обещаний.
 *
 * Числа — только значками: {price} и {priceShort} — «от» в долларах (у
 * польской страницы валюта — доллар, `LANDING_MONEY`), {weeks} — срок в
 * неделях, {hours} — часы на бесплатный макет. Запрос страницы (`query`)
 * стоит в заголовке, описании и первом предложении.
 */
export const pl: LandingLocale = {
  ui: {
    breadcrumb: "Usługi",
    from: "Cena od",
    weeks: "Termin",
    weeksUnit: "tyg.",
    mockupTitle: "Zobacz swoją przyszłą stronę w 2 minuty",
    mockupText:
      "Wyślij adres strony lub Instagrama i wybierz branżę: złożymy makietę z Twoją nazwą, usługami i kontaktami od razu na ekranie. Za darmo i bez telefonu od handlowca.",
    mockupCta: "Złóż makietę",
    talkCta: "Porozmawiajmy o projekcie",
    kindsTitle: "Co robimy i ile to kosztuje",
    includedTitle: "Co obejmuje praca",
    stepsTitle: "Jak przebiega praca",
    pricesTitle: "Ceny i terminy",
    pricesNote:
      "Cenę zapisujemy w umowie przed rozpoczęciem prac. Płatność w częściach: połowa na start, połowa po uruchomieniu. Ceny podajemy w dolarach amerykańskich, sposób płatności uzgadniamy w umowie.",
    colType: "Co robimy",
    colPrice: "Cena od",
    colTerm: "Termin",
    localTitle: "Jak pracujemy z firmami z Polski",
    compareTitle: "Agencja, freelancer czy kreator stron",
    compareCols: ["", "DevUz", "Freelancer", "Kreator (Wix, WordPress.com)"],
    compareRows: [
      ["Umowa i cena", "Umowa, cena ustalona przed startem", "Często bez umowy", "Abonament co miesiąc"],
      ["Podgląd przed płatnością", "Darmowa makieta Twojej strony", "Nie", "Szablon jak u tysięcy innych"],
      ["Zespół", "Projektant, programiści, tester", "Jedna osoba od wszystkiego", "Wszystko robisz sam"],
      ["Języki i wyszukiwarka", "Polski, angielski i inne potrzebne języki, znaczniki dla Google", "Jak wyjdzie", "Ograniczone przez platformę"],
      ["Płatności online", "Podłączamy operatora płatności, z którego korzystasz", "Nie zawsze potrafi", "Tylko to, co obsługuje platforma"],
      ["Po uruchomieniu", "Jesteśmy w kontakcie, rozwijamy stronę", "Może zniknąć", "Tylko wsparcie platformy"],
    ],
    casesTitle: "Nasze realizacje",
    casesAll: "Wszystkie case studies",
    faqTitle: "Częste pytania",
    relatedTitle: "Inne usługi",
    officeTitle: "Gdzie jesteśmy i jak pracujemy",
    officeText:
      "Nasze biuro jest w Taszkencie, przy ul. Szoty Rustawelego 138. Z klientami z Polski pracujemy zdalnie: rozmowy wideo w ustalonym terminie, wspólny czat, a umowę podpisujemy w sposób, który Ci odpowiada.",
    facts: { staff: "programistów na etacie", projects: "zakończonych projektów", countries: "krajów, w których działają nasze projekty" },
  },
  pages: {
    "web-development": {
      title: "Tworzenie stron internetowych",
      query: "tworzenie stron internetowych",
      seoTitle: "Tworzenie stron internetowych pod klucz, od {priceShort} | DevUz",
      seoDescription:
        "Tworzenie stron internetowych pod klucz dla firm z Polski: landing page od {priceShort}, strona firmowa, sklep internetowy. Darmowa makieta przed płatnością, umowa, płatność w częściach.",
      h1: "Tworzenie stron internetowych pod klucz dla firm",
      lead:
        "Tworzenie stron internetowych dla firm, którym potrzebne są zapytania od klientów, a nie sama wizytówka w sieci. Robimy landing page, strony firmowe i sklepy internetowe po polsku, a jeśli trzeba, także po angielsku i w innych językach. Pracujemy zdalnie, a przed płatnością widzisz makietę swojej strony: możesz ją złożyć w 2 minuty tutaj albo dostać od projektanta w {hours} godzin.",
      kinds: [
        { title: "Landing page", text: "Jedna strona pod jedną usługę lub kampanię: oferta, ceny, opinie, formularz z powiadomieniem na e-mail lub w Telegram." },
        { title: "Strona firmowa", text: "Strona firmy w jednym lub kilku językach: usługi, projekty, zespół, kontakty i panel, w którym teksty zmienia Twój pracownik." },
        { title: "Sklep internetowy", text: "Katalog z filtrami, koszyk, płatności online, dostawa, połączenie z magazynem i Twoim systemem księgowym." },
        { title: "Serwis internetowy i panel klienta", text: "Konta klientów, zamówienia, rozliczenia, role pracowników, wymiana danych z CRM. Gdy sama strona to za mało i potrzebny jest system." },
      ],
      included: [
        "Analiza konkurencji w Twojej branży i struktura strony",
        "Projekt pod Twoją markę: najpierw makieta, potem kod",
        "Wersja na telefon: z telefonu wchodzi większość odwiedzających",
        "Wersja polska i inne języki, których potrzebują Twoi klienci",
        "Panel, w którym sam zmieniasz teksty, ceny i zdjęcia",
        "Formularze ze zgodą na przetwarzanie danych (RODO) i powiadomieniem do CRM",
        "Podstawy SEO: tytuły, opisy, znaczniki Schema.org, mapa strony",
        "Google Analytics z celami na zapytania",
        "Domena, SSL i hosting na Twoim lub naszym serwerze",
        "Szkolenie Twojego pracownika z obsługi panelu",
      ],
      steps: [
        { title: "Poznanie i makieta", days: "1–2 dni", text: "Składasz makietę na stronie albo wysyłasz brief. Nasz projektant przygotuje darmową makietę Twojej strony w {hours} godzin." },
        { title: "Struktura i umowa", days: "1–3 dni", text: "Rozmawiamy online, uzgadniamy podstrony, funkcje i języki. Cenę i termin zapisujemy w umowie." },
        { title: "Projekt graficzny", days: "3–7 dni", text: "Projektujemy główne ekrany na telefon i komputer. Każdy ekran akceptujesz przed rozpoczęciem programowania." },
        { title: "Programowanie", days: "1–5 tygodni", text: "Budujemy stronę, podłączamy panel, formularze, płatności, CRM i analitykę. Postęp pokazujemy online." },
        { title: "Treści i testy", days: "2–4 dni", text: "Wypełniamy stronę treścią w potrzebnych językach, testujemy na telefonach i w przeglądarkach, przyspieszamy ładowanie." },
        { title: "Uruchomienie", days: "1 dzień", text: "Podłączamy domenę, zgłaszamy stronę do Google, przekazujemy dostępy i pokazujemy, jak ze wszystkiego korzystać." },
      ],
      local: [
        { title: "Zdalnie, jak z agencją za rogiem", text: "Rozmowy wideo w ustalonym terminie, wspólny czat, makieta i każdy etap online. Nie musisz nigdzie jechać." },
        { title: "Umowa i płatność", text: "Cenę i termin zapisujemy w umowie przed startem, płacisz w dwóch częściach. Sposób płatności uzgadniamy w umowie." },
        { title: "Pod polski rynek", text: "Język polski, ceny w złotych na Twojej stronie, numer z kierunkowym +48, płatności i dostawa, do których przywykli Twoi klienci." },
        { title: "Widoczność w Google", text: "W Polsce szuka się głównie w Google, więc pod niego przygotowujemy tytuły, opisy, znaczniki i szybkość strony." },
      ],
      faq: [
        { q: "Ile kosztuje stworzenie strony internetowej?", a: "Landing page: od {price}. Strona firmowa i sklep internetowy kosztują więcej, ceny każdego rodzaju są w tabeli powyżej. Dokładną cenę podajemy po krótkim briefie i zapisujemy w umowie." },
        { q: "Ile trwa stworzenie strony?", a: "Landing page: {weeks} tygodnie. Strona firmowa od miesiąca, sklep internetowy od dwóch. Termin wpisujemy do umowy." },
        { q: "Czy pracujecie z firmami z Polski?", a: "Tak, zdalnie: rozmowy wideo, wspólny czat, umowa. Ceny podajemy w dolarach, sposób płatności uzgadniamy w umowie." },
        { q: "Czy mogę zobaczyć stronę przed płatnością?", a: "Tak. Na tej stronie możesz złożyć makietę swojej strony w 2 minuty. Jeśli potrzebujesz makiety od projektanta, będzie gotowa w {hours} godzin, za darmo." },
        { q: "Jak wygląda płatność?", a: "Według umowy, w częściach: połowa na start, połowa po uruchomieniu. Pracujemy z firmami i jednoosobowymi działalnościami." },
        { q: "Czy sam zmienię teksty i ceny?", a: "Tak. Każda strona ma panel: teksty, ceny, zdjęcia i nowe podstrony zmienia Twój pracownik bez programisty. Pokażemy, jak z niego korzystać." },
        { q: "Czy strona będzie widoczna w Google?", a: "Podstawy SEO zakładamy już przy tworzeniu: tytuły, opisy, znaczniki, szybkość, mapa strony. Pozycjonowanie pod konkretne frazy to osobna usługa, też ją robimy." },
        { q: "Co po uruchomieniu?", a: "Jesteśmy w kontakcie: poprawiamy, jeśli coś pójdzie nie tak, i rozwijamy stronę, gdy firma potrzebuje nowych funkcji." },
      ],
    },

    "online-store": {
      title: "Sklep internetowy",
      query: "tworzenie sklepu internetowego",
      seoTitle: "Tworzenie sklepu internetowego pod klucz, od {priceShort} | DevUz",
      seoDescription:
        "Tworzenie sklepu internetowego pod klucz dla firm z Polski: katalog, koszyk, płatności online, dostawa, integracja z Twoim systemem, panel. Od {priceShort}, makieta przed płatnością.",
      h1: "Tworzenie sklepu internetowego pod klucz",
      lead:
        "Tworzenie sklepu internetowego pod klucz: katalog z filtrami, koszyk, płatności online, dostawa i panel do obsługi zamówień. Sklep przyjmuje zamówienia z telefonu równie wygodnie jak z komputera, a płatności i firmy kurierskie podłączamy te, z których już korzystasz. Przed płatnością pokażemy makietę Twojego sklepu.",
      kinds: [
        { title: "Sklep pod klucz", text: "Katalog, karty produktów, filtry, koszyk, składanie zamówienia i płatność online. Dla handlu detalicznego i marek." },
        { title: "Sklep z integracją magazynu", text: "Produkty, ceny i stany przychodzą same z Twojego systemu ERP lub magazynowego, zamówienia wracają z powrotem. Bez ręcznego przepisywania." },
        { title: "Marketplace", text: "Wielu sprzedawców, panel sprzedawcy, prowizje i wypłaty. Gdy budujesz platformę, a nie jeden sklep." },
      ],
      included: [
        "Katalog z kategoriami, filtrami i wyszukiwarką",
        "Karta produktu ze zdjęciami, wariantami i dostępnością",
        "Koszyk i zamówienie w kilku kliknięciach",
        "Płatności przez operatora, z którego korzystasz (np. Przelewy24, BLIK, PayU, Stripe)",
        "Dostawa: koszty, paczkomaty i kurierzy, np. InPost",
        "Panel: zamówienia, statusy, produkty, promocje, kody rabatowe",
        "Powiadomienia o zamówieniu na e-mail dla klienta i sklepu",
        "Integracja z Twoim systemem ERP, księgowym lub CRM",
        "Potrzebne języki i waluta, znaczniki produktów dla Google",
        "Google Analytics z celami na zamówienie",
      ],
      steps: [
        { title: "Makieta sklepu", days: "1–2 dni", text: "Pokazujemy, jak będzie wyglądał Twój sklep, na Twoich produktach. Za darmo, przed umową." },
        { title: "Katalog i umowa", days: "2–4 dni", text: "Omawiamy asortyment, sposoby płatności i dostawy. Ustalamy cenę i termin." },
        { title: "Projekt graficzny", days: "1–2 tygodnie", text: "Strona główna, katalog, karta produktu, koszyk. Osobno dopracowujemy wersję na telefon." },
        { title: "Programowanie i płatności", days: "3–6 tygodni", text: "Budujemy sklep, podłączamy płatności online, dostawę i panel." },
        { title: "Integracja z systemem", days: "1–2 tygodnie", text: "Konfigurujemy wymianę danych z Twoim systemem lub magazynem, wgrywamy produkty." },
        { title: "Zamówienia testowe i start", days: "3–5 dni", text: "Przechodzimy całą ścieżkę klienta z prawdziwą płatnością i uruchamiamy sklep." },
      ],
      local: [
        { title: "Płatności, do których przywykli klienci", text: "Podłączamy operatora płatności, z którym już współpracujesz lub planujesz współpracować, np. Przelewy24, PayU albo Stripe z BLIK-iem." },
        { title: "Paczkomaty i kurierzy", text: "Wybór paczkomatu i kuriera w koszyku: łączymy sklep z firmami, z których korzystasz, np. InPost." },
        { title: "Twój system bez przepisywania", text: "Stany i ceny nie trzeba przenosić ręcznie: wymiana z Twoim systemem ERP lub magazynowym działa automatycznie." },
        { title: "RODO i regulamin", text: "Zgody w formularzach, baner cookies i miejsce na regulamin oraz politykę prywatności. Treść dokumentów przygotowuje Twój prawnik." },
      ],
      faq: [
        { q: "Ile kosztuje tworzenie sklepu internetowego?", a: "Od {price}. Cena zależy od liczby produktów, sposobów płatności i dostawy oraz integracji z Twoim systemem. Dokładną kwotę zapisujemy w umowie po briefie." },
        { q: "Ile trwa stworzenie sklepu internetowego?", a: "Zwykle {weeks} tygodni. Jeśli potrzebna jest integracja z ERP albo marketplace ze sprzedawcami, termin jest dłuższy i podajemy go z góry." },
        { q: "Jakie płatności online podłączycie?", a: "Te, z których korzystasz, np. Przelewy24, PayU albo Stripe. Umowę z operatorem płatności zawierasz Ty, część techniczną robimy my." },
        { q: "Czy można połączyć sklep z systemem magazynowym?", a: "Tak. Produkty, ceny i stany przychodzą z Twojego systemu ERP lub magazynowego, zamówienia wracają z powrotem." },
        { q: "Kto będzie dodawał produkty?", a: "Twój pracownik w panelu. Katalog można wgrać plikiem. Pierwsze wgranie produktów możemy zrobić my." },
        { q: "Czy pracujecie ze sklepami z Polski?", a: "Tak, zdalnie i na umowę. Ceny podajemy w dolarach, sposób płatności uzgadniamy w umowie." },
        { q: "Czy mogę zobaczyć sklep przed płatnością?", a: "Tak, pokażemy darmową makietę Twojego sklepu. Zobacz też nasze realizacje poniżej: sklepy z panelem właściciela." },
        { q: "A jeśli sprzedaję na Allegro lub na Instagramie?", a: "Własny sklep nie przeszkadza, tylko pomaga: link z profilu prowadzi do katalogu, zamówienie składa się samo, a od sprzedaży nie płacisz prowizji platformie." },
      ],
    },

    "mobile-apps": {
      title: "Aplikacje mobilne",
      query: "tworzenie aplikacji mobilnych",
      seoTitle: "Tworzenie aplikacji mobilnych na iOS i Android, od {priceShort} | DevUz",
      seoDescription:
        "Tworzenie aplikacji mobilnych na iOS i Android dla firm z Polski: projekt, programowanie, publikacja w App Store i Google Play. Od {priceShort}, makieta aplikacji przed płatnością.",
      h1: "Tworzenie aplikacji mobilnych na iOS i Android",
      lead:
        "Tworzenie aplikacji mobilnych na iOS i Android: od pomysłu i makiety do publikacji w App Store i Google Play. Robimy aplikacje do zamówień, rezerwacji, dostaw, nauki i wewnętrznych zadań firmy. Jeden kod na obie platformy oszczędza budżet, a klikalną makietę zobaczysz przed rozpoczęciem prac.",
      kinds: [
        { title: "Aplikacja dla klientów", text: "Katalog, zamówienie, płatność, program lojalnościowy, powiadomienia push. Dla sklepów, restauracji, klinik i serwisów." },
        { title: "Aplikacja dla pracowników", text: "Zgłoszenia, trasy kurierów, raporty ze zdjęciami, zadania. Działa także przy słabym internecie." },
        { title: "Aplikacja webowa (PWA)", text: "Aplikacja otwierana w przeglądarce i dodawana do ekranu telefonu, bez sklepu. Szybszy i tańszy start." },
      ],
      included: [
        "Badanie: kto będzie korzystał z aplikacji i po co",
        "Klikalna makieta wszystkich ekranów przed programowaniem",
        "Aplikacja na iOS i Android na jednym kodzie",
        "Backend i panel do zarządzania",
        "Logowanie e-mailem, numerem telefonu, przez Google lub Apple",
        "Płatności w aplikacji przez operatora, z którego korzystasz",
        "Powiadomienia push i wysyłki",
        "Język polski i inne, których potrzebują Twoi klienci",
        "Publikacja w App Store i Google Play",
        "Analityka: kto wchodzi, co zamawia, gdzie rezygnuje",
      ],
      steps: [
        { title: "Pomysł i scenariusze", days: "2–4 dni", text: "Opisujemy krok po kroku, co użytkownik robi w aplikacji. Odcinamy to, co zbędne w pierwszej wersji." },
        { title: "Klikalna makieta", days: "1–2 tygodnie", text: "Wszystkie ekrany można przejrzeć na telefonie, zanim powstanie pierwsza linijka kodu." },
        { title: "Umowa", days: "1–2 dni", text: "Ustalamy zakres pierwszej wersji, cenę i termin." },
        { title: "Programowanie", days: "6–10 tygodni", text: "Aplikacja, serwer i panel. Co dwa tygodnie pokazujemy działającą wersję." },
        { title: "Testy", days: "1–2 tygodnie", text: "Testujemy na różnych telefonach, poprawiamy, przygotowujemy materiały do sklepów." },
        { title: "Publikacja", days: "1–2 tygodnie", text: "Przechodzimy weryfikację App Store i Google Play i wydajemy aplikację." },
      ],
      local: [
        { title: "Zdalnie i krok po kroku", text: "Co dwa tygodnie działająca wersja na Twoim telefonie. Widzisz, za co płacisz, jeszcze przed premierą." },
        { title: "Płatności w aplikacji", text: "Podłączamy operatora płatności, z którym współpracujesz, np. Stripe, PayU lub Przelewy24. Umowę z nim zawierasz Ty." },
        { title: "Dane użytkowników", text: "Zgody, polityka prywatności i usuwanie konta z poziomu aplikacji: tego wymagają sklepy z aplikacjami i RODO." },
        { title: "Najpierw PWA, potem sklepy", text: "Jeśli chcesz szybko sprawdzić pomysł, zaczynamy od aplikacji webowej, a wersję w sklepach wydajemy jako drugi krok." },
      ],
      faq: [
        { q: "Ile kosztuje tworzenie aplikacji mobilnej?", a: "Od {price} za pierwszą wersję na iOS i Android. Cena zależy od liczby ekranów, płatności i integracji z Twoimi systemami. Zapisujemy ją w umowie." },
        { q: "Ile trwa tworzenie aplikacji?", a: "Pierwsza wersja: {weeks} tygodni, razem z makietą i publikacją w sklepach." },
        { q: "iOS i Android to dwie aplikacje?", a: "Nie, piszemy jedną na wspólnym kodzie: działa na obu platformach. To taniej i szybciej niż dwie osobne." },
        { q: "Czy można zacząć od prostszej wersji?", a: "Tak, i często to rozsądne: aplikacja webowa albo Mini App w Telegram startuje szybciej i nie wymaga instalacji. Gdy pojawią się klienci, wydajemy aplikację w sklepach." },
        { q: "Kto publikuje aplikację w App Store i Google Play?", a: "My: przygotowujemy opis, zrzuty ekranu i przechodzimy weryfikację sklepów. Konta deweloperskie zakładamy na Twoją firmę." },
        { q: "Czy będzie panel?", a: "Tak, do każdej aplikacji robimy panel: produkty, zamówienia, użytkownicy, wysyłki." },
        { q: "Czy mogę zobaczyć aplikację przed programowaniem?", a: "Tak, klikalną makietę wszystkich ekranów przeglądasz na swoim telefonie przed rozpoczęciem programowania." },
        { q: "Czy wspieracie aplikację po uruchomieniu?", a: "Tak: aktualizujemy ją pod nowe wersje iOS i Android, poprawiamy błędy i dodajemy funkcje." },
      ],
    },

    "telegram-bots": {
      title: "Boty Telegram",
      query: "tworzenie bota Telegram",
      seoTitle: "Tworzenie bota Telegram dla firm, od {priceShort} | DevUz",
      seoDescription:
        "Tworzenie bota Telegram dla firm, których klienci piszą na Telegramie: zamówienia i rezerwacje, płatności, wysyłki, integracja z CRM, odpowiedzi AI. Od {priceShort}, start od {weeks} tygodni.",
      h1: "Tworzenie bota Telegram dla firm",
      lead:
        "Tworzenie bota Telegram ma sens wtedy, gdy Twoi klienci już piszą na Telegramie. W Polsce to nie jest najpopularniejszy komunikator, ale korzysta z niego wiele osób, a dla takich firm bot przyjmuje zamówienia i rezerwacje, odpowiada na częste pytania, przyjmuje płatności, robi wysyłki i przekazuje zapytania handlowcowi i do CRM. Nasz własny bot pracuje codziennie: składa klientowi makietę strony od razu na czacie.",
      kinds: [
        { title: "Bot do zamówień i rezerwacji", text: "Menu, katalog, koszyk, rezerwacja terminu, płatność, powiadomienie dla handlowca." },
        { title: "Bot z wysyłkami i CRM", text: "Segmenty subskrybentów, wysyłki z panelu, zapytania w Twoim CRM, statystyki." },
        { title: "Bot z AI", text: "Odpowiada klientom własnymi słowami na podstawie Twoich usług i cen, zbiera zapytanie i przekazuje je człowiekowi." },
      ],
      included: [
        "Scenariusz: o co pyta bot i dokąd prowadzi klienta",
        "Menu, przyciski i teksty w potrzebnych językach",
        "Przyjmowanie zamówień, rezerwacji i zapytań",
        "Płatność za zamówienie przez operatora podłączonego do bota",
        "Powiadomienia dla handlowców na czacie zespołu",
        "Panel: zapytania, subskrybenci, wysyłki",
        "Integracja z Twoim CRM lub Arkuszami Google",
        "Mini App w Telegram, jeśli potrzebny jest katalog ze zdjęciami",
        "Statystyki: ile osób napisało, ile kupiło",
        "Hosting na serwerze i wsparcie",
      ],
      steps: [
        { title: "Scenariusz", days: "1–2 dni", text: "Rozpisujemy ścieżkę klienta: co pisze, co odpowiada bot, gdzie włącza się człowiek." },
        { title: "Umowa", days: "1 dzień", text: "Ustalamy funkcje, cenę i termin." },
        { title: "Programowanie", days: "1–2 tygodnie", text: "Budujemy bota, panel, płatności i integrację z CRM." },
        { title: "Testy", days: "2–3 dni", text: "Przechodzimy wszystkie scenariusze z Twoim zespołem, poprawiamy teksty." },
        { title: "Uruchomienie", days: "1 dzień", text: "Uruchamiamy bota, dodajemy link na stronę i do mediów społecznościowych, szkolimy zespół." },
      ],
      local: [
        { title: "Gdy klienci są na Telegramie", text: "Bot ma sens, jeśli Twoi klienci już tam piszą: na przykład klienci z innych krajów albo społeczność, która od dawna korzysta z Telegrama." },
        { title: "Kilka języków", text: "Bot pyta o język w pierwszej wiadomości i dalej w nim rozmawia: po polsku, angielsku, ukraińsku lub w innym." },
        { title: "Nocne zapytania nie giną", text: "Bot odpowiada także w nocy, a handlowiec rano dostaje gotowe zapytania." },
        { title: "Szczerze o wyborze kanału", text: "Jeśli Twoi klienci piszą głównie przez Messengera lub WhatsAppa, powiemy to wprost i doradzimy, od czego zacząć." },
      ],
      faq: [
        { q: "Ile kosztuje tworzenie bota Telegram?", a: "Od {price} za bota do zamówień lub rezerwacji. Bot z odpowiedziami AI i integracją z CRM kosztuje więcej, ceny są w tabeli powyżej." },
        { q: "Ile trwa stworzenie bota?", a: "Prosty bot: {weeks} tygodnie. Bot z płatnościami, CRM i Mini App trwa dłużej, termin podajemy z góry." },
        { q: "Czy bot może przyjmować płatności?", a: "Tak, przez operatora płatności podłączonego do bota albo linkiem do strony płatności." },
        { q: "Czy można połączyć bota z CRM?", a: "Tak, zapytania trafiają do Twojego CRM lub do Arkusza Google, a handlowiec dostaje powiadomienie." },
        { q: "Czy bot może odpowiadać jak żywy handlowiec?", a: "Tak, bot z AI odpowiada własnymi słowami na podstawie Twoich usług i cen. Gdy pytanie jest trudne, przekazuje rozmowę człowiekowi." },
        { q: "Czy można robić wysyłki do subskrybentów?", a: "Tak, z panelu lub z telefonu: do wszystkich subskrybentów albo do grup, z obrazkiem i przyciskami." },
        { q: "Czym jest Mini App?", a: "To aplikacja w Telegram: katalog ze zdjęciami, koszyk, rezerwacja. Otwiera się z bota bez instalacji." },
        { q: "Do kogo należy bot?", a: "Do Ciebie: bot jest rejestrowany na Twoje konto, kod i dane przekazujemy zgodnie z umową." },
      ],
    },

    "landing-page": {
      title: "Landing page",
      query: "tworzenie landing page",
      seoTitle: "Tworzenie landing page od {priceShort}, w {weeks} tygodnie | DevUz",
      seoDescription:
        "Tworzenie landing page pod reklamę i zapytania: oferta, projekt, formularz z powiadomieniem, Google Analytics z celami. Dla firm z Polski, od {priceShort}, makieta przed płatnością.",
      h1: "Tworzenie landing page pod klucz",
      lead:
        "Tworzenie landing page pod jedno zadanie: zebrać zapytania z reklamy na konkretną usługę lub produkt. Jedna strona, jasna oferta, ceny, opinie i formularz, który od razu wysyła zapytanie na e-mail lub do CRM. Makietę swojego landing page zobaczysz przed płatnością.",
      kinds: [
        { title: "Landing page pod reklamę", text: "Strona pod jedną usługę lub promocję dla Google Ads, Facebooka i Instagrama. Cele w Google Analytics, żeby liczyć koszt zapytania." },
        { title: "Landing page z animacją", text: "Scena przy przewijaniu, wideo, interakcje. Gdy trzeba zaskoczyć i zapaść w pamięć." },
        { title: "Kilka landing page", text: "Osobna strona pod każdą usługę lub miasto. Reklama prowadzi każdego klienta do jego oferty." },
      ],
      included: [
        "Oferta i struktura: co człowiek zobaczy na każdym ekranie",
        "Teksty, które mówią językiem klienta",
        "Projekt pod Twoją markę na telefon i komputer",
        "Formularz ze zgodą RODO i powiadomieniem na e-mail",
        "Przyciski WhatsApp, Messenger i połączenia",
        "Wersja polska i inne języki, jeśli są potrzebne",
        "Google Analytics i piksel reklamowy z celami",
        "Szybkie ładowanie na mobilnym internecie",
        "Domena i SSL",
        "Poprawki po pierwszej kampanii",
      ],
      steps: [
        { title: "Makieta", days: "1 dzień", text: "Składasz makietę na stronie w 2 minuty albo dostajesz ją od projektanta w {hours} godzin." },
        { title: "Oferta i teksty", days: "1–2 dni", text: "Formułujemy ofertę, korzyści i odpowiedzi na obiekcje." },
        { title: "Projekt graficzny", days: "2–4 dni", text: "Projektujemy ekrany na telefon i komputer, Ty je akceptujesz." },
        { title: "Kodowanie i formularze", days: "3–5 dni", text: "Budujemy stronę, podłączamy formularze, powiadomienia i analitykę." },
        { title: "Uruchomienie", days: "1 dzień", text: "Publikujemy na domenie, sprawdzamy cele i przekazujemy stronę pod reklamę." },
      ],
      local: [
        { title: "Pod reklamę w Google i Meta", text: "Landing page szybko otwiera się także we wbudowanej przeglądarce Facebooka i Instagrama i prowadzi prosto do zapytania." },
        { title: "Zapytanie w kilka sekund", text: "Numer telefonu i przycisk WhatsApp, bez długich formularzy." },
        { title: "Koszt zapytania jest widoczny", text: "Cele w Google Analytics pokazują, ile kosztuje każde zapytanie z reklamy." },
        { title: "RODO bez kombinowania", text: "Zgoda w formularzu i baner cookies od początku, żeby piksele reklamowe działały zgodnie z wyborem odwiedzającego." },
      ],
      faq: [
        { q: "Ile kosztuje tworzenie landing page?", a: "Od {price}. Landing page z animacją i kilka stron pod różne usługi kosztują więcej, ceny są w tabeli powyżej." },
        { q: "Ile trwa stworzenie landing page?", a: "{weeks} tygodnie razem z makietą, tekstami i podłączeniem analityki." },
        { q: "Czym landing page różni się od strony internetowej?", a: "Landing page to jedna strona pod jedno zadanie, najczęściej pod reklamę. Strona internetowa opowiada o całej firmie i przydaje się, gdy usług jest wiele." },
        { q: "Czy teksty piszecie Wy?", a: "Tak, piszemy teksty sami na podstawie krótkiego briefu. Twoje teksty też przyjmujemy i dopracowujemy." },
        { q: "Gdzie trafiają zapytania?", a: "Na e-mail od razu po wysłaniu, a jeśli masz CRM, to także do niego." },
        { q: "Czy landing page nadaje się do Google Ads i reklam na Facebooku?", a: "Tak, robimy go z myślą o telefonie, wbudowanych przeglądarkach i celach dla kont reklamowych." },
        { q: "Czy mogę zobaczyć landing page przed płatnością?", a: "Tak, makietę swojego landing page możesz złożyć na tej stronie w 2 minuty." },
        { q: "Czy landing page można potem zamienić w stronę internetową?", a: "Tak, landing page staje się stroną główną, a pozostałe sekcje dodajemy obok." },
      ],
    },

    "corporate-website": {
      title: "Strona firmowa",
      query: "strona firmowa",
      seoTitle: "Strona firmowa pod klucz, od {priceShort}, makieta przed płatnością | DevUz",
      seoDescription:
        "Strona firmowa pod klucz dla firm z Polski: usługi, projekty, zespół, oferty pracy, kilka języków, panel dla pracownika. Od {priceShort}, termin {weeks} tygodni.",
      h1: "Strona firmowa pod klucz",
      lead:
        "Strona firmowa dla firm, którym zależy na solidnym wizerunku wobec klientów, partnerów i inwestorów. Usługi i produkty, projekty, zespół, aktualności, oferty pracy i kontakty po polsku, angielsku i w innych potrzebnych językach. Teksty i aktualności zmienia Twój pracownik w panelu, bez programisty.",
      kinds: [
        { title: "Strona firmy", text: "Usługi, o firmie, projekty, kontakty w potrzebnych językach. Panel do aktualności i tekstów." },
        { title: "Strona producenta", text: "Katalog produktów bez koszyka, dokumenty i certyfikaty, zapytanie hurtowe i wycena." },
        { title: "Portal z kontami", text: "Konta klientów, partnerów lub inwestorów, dokumenty, zapytania i role pracowników." },
      ],
      included: [
        "Struktura pod Twoich klientów i partnerów",
        "Projekt w identyfikacji wizualnej firmy",
        "Wersja polska, angielska i inne",
        "Katalog usług lub produktów",
        "Projekty i case studies, aktualności, oferty pracy",
        "Panel do tekstów, aktualności i dokumentów",
        "Formularze ze zgodą RODO i powiadomieniem do CRM",
        "Znaczniki dla Google i mapa strony",
        "Google Analytics",
        "Przeniesienie treści ze starej strony bez utraty pozycji",
      ],
      steps: [
        { title: "Brief i makieta", days: "1–2 dni", text: "Omawiamy zadania strony i w {hours} godzin pokazujemy darmową makietę strony głównej." },
        { title: "Struktura i umowa", days: "2–4 dni", text: "Uzgadniamy sekcje, języki i funkcje. Ustalamy cenę i termin." },
        { title: "Projekt graficzny", days: "1–2 tygodnie", text: "Strona główna i podstrony na telefon i komputer." },
        { title: "Programowanie", days: "2–3 tygodnie", text: "Budujemy stronę, panel, formularze i wersje językowe." },
        { title: "Treści", days: "3–5 dni", text: "Przenosimy teksty, zdjęcia i dokumenty, sprawdzamy tłumaczenia." },
        { title: "Uruchomienie", days: "1–2 dni", text: "Podłączamy domenę, ustawiamy przekierowania ze starych adresów, zgłaszamy stronę do Google." },
      ],
      local: [
        { title: "Języki dla Twoich rynków", text: "Polski dla klientów w kraju, angielski dla partnerów i inwestorów, kolejne języki, jeśli działasz za granicą." },
        { title: "Przetargi i dokumenty", text: "Sekcja z certyfikatami, referencjami i danymi firmy: pytają o nie partnerzy i zamawiający w przetargach." },
        { title: "Przeprowadzka bez strat", text: "Jeśli stara strona jest już w Google, zachowujemy adresy i ustawiamy przekierowania." },
        { title: "Dostępność i RODO", text: "Czytelne kontrasty, obsługa z klawiatury, zgody w formularzach i baner cookies zakładamy od początku." },
      ],
      faq: [
        { q: "Ile kosztuje strona firmowa?", a: "Od {price}. Cena zależy od liczby sekcji, języków i funkcji, takich jak konta użytkowników. Zapisujemy ją w umowie." },
        { q: "Ile trwa tworzenie strony firmowej?", a: "{weeks} tygodni razem z projektem, treściami i uruchomieniem." },
        { q: "Ile języków będzie na stronie?", a: "Tyle, ile potrzebują Twoi klienci: zwykle polski i angielski, a do tego języki krajów, w których działasz." },
        { q: "Czy sami będziemy publikować aktualności?", a: "Tak, w panelu Twój pracownik publikuje aktualności, zmienia teksty i wgrywa dokumenty." },
        { q: "Czy przeniesiecie starą stronę?", a: "Tak, przenosimy teksty i dokumenty i ustawiamy przekierowania, żeby nie stracić pozycji w Google." },
        { q: "Czy można zrobić konto dla klientów lub partnerów?", a: "Tak, to portal z kontami: dokumenty, zapytania, statusy. Cena jest w tabeli powyżej." },
        { q: "Czy mogę zobaczyć stronę przed płatnością?", a: "Tak, pokażemy darmową makietę strony głównej Twojej witryny." },
        { q: "Czy pracujecie na umowę z firmami z Polski?", a: "Tak, na umowę z firmą lub jednoosobową działalnością, płatność w częściach: połowa na start, połowa po uruchomieniu. Ceny w dolarach, sposób płatności uzgadniamy w umowie." },
      ],
    },
  },
};
