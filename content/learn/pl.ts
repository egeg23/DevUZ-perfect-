import type { LearnCopy } from "@/content/learn";

/**
 * Szkolenia po polsku. Te same klucze, lekcje, akapity i warianty co w
 * ru.ts — sprawdza to tests/learn.test.ts. Cyrylica tylko w «»: słowa,
 * które klient pisze po rosyjsku, i wiadomości bota (bot pisze na razie po
 * rosyjsku). Pierwszy wariant odpowiedzi jest zawsze poprawny.
 */
export const pl: LearnCopy = {
  courses: {
    /* ── 1. Kontakt w dwóch krokach ────────────────────────────────────── */
    hello: {
      title: "Kontakt w dwóch krokach",
      summary: "Dlaczego najpierw idzie tylko «Здравствуйте», co się dzieje po odpowiedzi i dlaczego bez odpowiedzi już nie piszemy.",
      lessons: {
        why: {
          title: "Dlaczego najpierw tylko powitanie",
          paras: [
            "Do obcej osoby konto firmowe pisze jako pierwsze tylko jedno słowo: «Здравствуйте». Do strony uzbeckiej: «Assalomu alaykum». Tak zdecydował właściciel 07.10.2026.",
            "Powód jest prosty. Telegram ogranicza konto, gdy ludzie zgłaszają je jako spam. Zgłaszają długie wiadomości od nieznajomych. Na powitanie nikt się tak nie skarży: odpowiada się «да?» albo milczy.",
            "Ograniczone konto przez dobę nie pisze do nikogo. Tracimy i nowe kontakty, i rozmowy, które już szły z tego numeru. Dlatego jedno krótkie słowo jest cenniejsze niż najładniejsza wiadomość.",
          ],
        },
        how: {
          title: "Jak to wygląda u ciebie",
          paras: [
            "Kontakt przygotowujesz jak zwykle: «Skontaktuj się», czytasz wiadomość, «Wyślij». Najpierw wychodzi powitanie. Sama wiadomość czeka w karcie, aż klient odpowie. Karta pokazuje, że powitanie wyszło, a kółko albo wiadomość wyjdzie po odpowiedzi klienta.",
            "Do liczby kontaktów, porcji dnia i limitu „trzy na godzinę” liczy się samo powitanie. Dla Telegramu pierwsza wiadomość do nieznajomego to właśnie kontakt.",
            "Pierwsze wiadomości wychodzą z jednego konta najwyżej trzy na godzinę i tylko od 07:30 do 20:30 czasu taszkenckiego. Rozmowa z tymi, którzy odpowiedzieli, idzie o każdej porze.",
          ],
        },
        after: {
          title: "Co się dzieje po odpowiedzi",
          paras: [
            "Odpowiedział po rosyjsku («Здравствуйте», «да?», «кто это?») — po dwóch minutach wychodzi rosyjskie kółko. Po uzbecku — uzbeckie kółko. W innym języku — po trzech minutach wiadomość w jego języku, bez powitania.",
            "Odpowiedział «не пишите» albo «позвоните» — nic nie wychodzi. Bot woła ciebie i pisze, że klient widział tylko powitanie. Dalej decydujesz ty.",
            "Nie odpowiedział — nic więcej nie wychodzi. Po samym powitaniu nie ma przypominania. Jeśli sprawdzenie strony ma więcej niż trzy dni, wiadomość też nie wychodzi: bot woła ciebie, sprawdź stronę i napisz sam.",
          ],
        },
        dont: {
          title: "Czego nie robić",
          paras: [
            "Nie wysyłaj drugiego powitania, „jest pan?” ani „proszę odpowiedzieć”. Właśnie na to ludzie się skarżą.",
            "Nie wysyłaj ręcznie wiadomości o stronie przed odpowiedzią klienta. Nie zaczynaj wiadomości od powitania: ono już poszło osobno.",
            "Nie pisz do nieznajomych w nocy ani z prywatnego numeru z pominięciem kolejki. Jeśli kolejka jest długa, napisz sam z tego samego konta firmowego i kliknij «Skontaktowano samodzielnie».",
          ],
        },
      },
      quiz: {
        first: {
          q: "Co jako pierwsze wychodzi z konta firmowego do obcej firmy?",
          options: ["Tylko «Здравствуйте» (do strony uzbeckiej — «Assalomu alaykum»)", "Wiadomość o stronie z tezami", "Kółko z propozycją makiety", "Link do warunków makiety"],
          why: "Najpierw idzie tylko powitanie. Wiadomość i kółko — po odpowiedzi.",
        },
        spam: {
          q: "Dlaczego nie piszemy od razu długiej wiadomości?",
          options: ["Telegram ogranicza konto za zgłoszenia spamu, a zgłasza się długie wiadomości od nieznajomych", "Długa wiadomość więcej kosztuje", "Klienci nie czytają po rosyjsku"],
          why: "Ograniczone konto przez dobę nie pisze do nikogo, dlatego najpierw idzie jedno słowo.",
        },
        silent: {
          q: "Klient od trzech dni nie odpowiada na powitanie. Co robimy?",
          options: ["Nic: po samym powitaniu nie ma przypominania", "Piszemy „jest pan?”", "Wysyłamy wiadomość o stronie bez odpowiedzi"],
          why: "Bez odpowiedzi nic więcej nie wychodzi — ani wiadomość, ani przypomnienie.",
        },
        who: {
          q: "Klient odpowiedział po rosyjsku: «Кто это?». Co wyjdzie?",
          options: ["Po dwóch minutach rosyjskie kółko", "Od razu wiadomość z tezami", "Nic, rozmowa trafia do człowieka"],
          why: "«да?», «кто это?» to zwykła odpowiedź na powitanie. Po rosyjsku odpowiada na nią kółko.",
        },
        call: {
          q: "Na powitanie odpisano: «Позвоните мне». Co się stanie?",
          options: ["Wiadomość nie wychodzi, bot woła ciebie i pisze, że klient widział tylko powitanie", "Wychodzi kółko", "Wychodzi wiadomość o stronie"],
          why: "Prośba o telefon i odmowa zawsze trafiają do człowieka, bez wiadomości.",
        },
        count: {
          q: "Co liczy się do kontaktów i porcji dnia?",
          options: ["Samo powitanie", "Tylko wiadomość po odpowiedzi", "Tylko odpowiedź klienta"],
          why: "Dla Telegramu kontakt to pierwsza wiadomość do nieznajomego, czyli powitanie.",
        },
      },
    },

    /* ── 2. Kółko ──────────────────────────────────────────────────────── */
    circle: {
      title: "Kółko",
      summary: "Co jest w kółku, kto dostaje który język, skąd bot je bierze i kiedy zamiast kółka wychodzi wiadomość.",
      lessons: {
        what: {
          title: "Czym jest kółko",
          paras: [
            "Kółko to krótkie wideo od studia w Telegramie. Przedstawiamy się i mówimy, że obejrzeliśmy ich stronę i znaleźliśmy kilka błędów, przez które odchodzą klienci. Na końcu: odpowiedz, a je rozpiszemy.",
            "Na odpowiedź na kółko bot sam wysyła analizę: wiadomość ze sprawdzenia strony, co jest nie tak i czym to grozi dla kupujących, a na końcu propozycję, że w 12 godzin za darmo zrobimy makietę strony głównej. Tak zdecydował właściciel 22.10.2026. Klient odpowiada «+» albo „tak” już na analizę i robimy makietę.",
            "Właściciel, 07.10.2026: po odpowiedzi — kółko i krótki tekst. Żywa twarz i głos budzą więcej zaufania niż tekst od nieznajomego.",
          ],
        },
        lang: {
          title: "Które kółko wychodzi",
          paras: [
            "Odpowiedział po rosyjsku — wychodzi rosyjskie kółko. Po uzbecku — uzbeckie. Odpowiedź bez słów (naklejka, «+») liczy się w języku powitania. Inny język — po trzech minutach wiadomość w jego języku.",
            "Kółko wychodzi dwie minuty po odpowiedzi, jako kopia z «Zapisanych» tego samego konta firmowego, a nie przekazanie. Odpowiedź po sekundzie wygląda jak robot.",
            "Rosyjskie kółko to ostatnie kółko w «Zapisanych». Uzbeckie — tylko to, które bot sam tam położył i zapamiętał. Z wideo nie da się poznać języka, dlatego uzbeckie kółko trafia do pracy tylko przez dział «Konta» albo bota studia, który pyta o język przyciskami.",
          ],
        },
        fail: {
          title: "Kiedy zamiast kółka wychodzi wiadomość",
          paras: [
            "W «Zapisanych» nie ma kółka w potrzebnym języku — zamiast niego wychodzi wiadomość. Odbiorca zablokował wiadomości głosowe i wideo — też wiadomość, w języku jego odpowiedzi. Właściciel, 09.10.2026: kto zablokował głosówki i kółka, temu piszemy w języku odpowiedzi.",
            "Raport o 18:00 mówi, ile razy w ciągu dnia kółko nie wyszło. 08.10.2026 cały dzień tak minął niezauważony — dlatego ta liczba jest teraz w raporcie.",
            "Kółka wgrywają kierownik i właściciel: «Konta» → «Kółko do kontaktów» → «Kółko po rosyjsku» albo «Kółko po uzbecku», plik MP4 do minuty, «Wgraj kółko». Albo przekazują kółko botowi studia — bot zapyta o język. W ciągu dziesięciu minut bot sam kładzie je do «Zapisanych» każdego konta.",
          ],
        },
        record: {
          title: "Jak nagrać dobre kółko",
          paras: [
            "Do minuty. Twarz w kadrze, jasno, cicho. Mów spokojnie, jak do kolegi z biura, a nie jak lektor.",
            "Jedna myśl: kim jesteś, że obejrzałeś ich stronę i znalazłeś kilka błędów, przez które odchodzą klienci. Jedna prośba na końcu: „odpowiedz, a je rozpiszę”. Analizę i propozycję makiety bot wyśle sam.",
            "Bez cen, bez „gwarantujemy”, bez „wypromujemy na szczyt”, bez technicznych słów. Żadnych terminów poza 12 godzinami: innych studio nie obiecywało.",
          ],
        },
      },
      quiz: {
        offer: {
          q: "Co mówi kółko?",
          options: ["Że na ich stronie znaleźliśmy kilka błędów i rozpiszemy je, jeśli odpowiedzą", "Rabat na stronę", "Rozmowę z menedżerem"],
          why: "Kółko to jedna myśl i jedna prośba: znaleźliśmy błędy, odpowiedz, a je rozpiszemy. Analiza z propozycją makiety przychodzi po odpowiedzi.",
        },
        uz: {
          q: "Klient odpowiedział «Assalomu alaykum». Co wyjdzie?",
          options: ["Uzbeckie kółko", "Rosyjskie kółko", "Wiadomość po rosyjsku"],
          why: "Język kółka to język odpowiedzi: na uzbecką odpowiedź wychodzi uzbeckie kółko.",
        },
        other: {
          q: "Klient odpowiedział po angielsku. Co wyjdzie?",
          options: ["Po trzech minutach wiadomość po angielsku, bez powitania", "Rosyjskie kółko", "Nic"],
          why: "Kółka są tylko rosyjskie i uzbeckie. Inny język — wiadomość w nim.",
        },
        forbidden: {
          q: "Odbiorca zablokował wiadomości głosowe i wideo. Co się stanie?",
          options: ["Zamiast kółka wyjdzie wiadomość w języku jego odpowiedzi", "Kółko zostanie ponowione za godzinę", "Kontakt się zamknie"],
          why: "Kółko nie przeszło — zamiast niego wiadomość w języku klienta.",
        },
        letter: {
          q: "Klient odpowiedział na kółko „tak”. Co wyjdzie?",
          options: ["Analiza strony z propozycją darmowej makiety na końcu", "„Przyjęte, przygotowujemy makietę” z linkiem do warunków", "Nic, rozmowa przechodzi do człowieka"],
          why: "„Tak” na kółko znaczy „rozpiszcie”. Najpierw analiza, makieta po «+» albo „tak” już na analizę.",
        },
        upload: {
          q: "Jak uzbeckie kółko trafia do pracy?",
          options: ["Przez «Konta» → «Kółko po uzbecku» albo przez bota studia, który pyta o język", "Położyć je ręcznie w «Zapisanych» — bot pozna język z wideo", "Wysłać klientowi samemu"],
          why: "Z wideo nie da się poznać języka, więc bot bierze tylko uzbeckie kółko, które sam położył.",
        },
      },
    },

    /* ── 3. «+» — zgoda na makietę ─────────────────────────────────────── */
    plus: {
      title: "«+» — zgoda na makietę",
      summary: "Które odpowiedzi znaczą „tak, chcę makietę”, co bot robi sam, kto bierze prototyp i jak działają warunki makiety.",
      lessons: {
        yes: {
          title: "Co jest zgodą",
          paras: [
            "«+», „plus” na wiadomość z analizą — zawsze tak. „Tak” na analizę znaczy to samo: «да», «давайте», «делайте», «хорошо, жду», «хочу», «ок», «ha», «mayli», «qiling». Na samo kółko „tak” i «+» znaczą „rozpiszcie”: bot wysyła analizę, a nie makietę.",
            "Każda wzmianka o makiecie albo prototypie to też zgoda: «да, соберите», «хочу макет», «prototip yig‘ib bering».",
            "«да?» ze znakiem zapytania to nie zgoda, tylko pytanie. Zajmuje się nim człowiek. Krótkiej, niejasnej odpowiedzi model też nie rusza — woła ciebie.",
          ],
        },
        after: {
          title: "Co dzieje się od razu",
          paras: [
            "Klient sam dostaje odpowiedź, że przygotowujemy dla niego darmową makietę i wyślemy link, gdy będzie gotowa — oraz link do warunków makiety, w jego języku.",
            "Autor kontaktu dostaje «🛠 Хотят прототип» z przyciskiem «🛠 Беру прототип». Przez pierwsze 30 minut prototyp jest tylko jego.",
            "Nie wziął w pół godziny — do całego zespołu idzie «🔥 Нужен прототип — бери срочно». Kto pierwszy kliknie, ten ma leada i rozmowę. W nocy ta wiadomość czeka do 07:00.",
          ],
        },
        terms: {
          title: "Warunki: link bez „zgadzam się”",
          paras: [
            "Link do warunków wychodzi sam, do zapoznania się. O zgodę w odpowiedzi nie prosimy. Warunki przyjmuje się działaniem: klient kontynuuje rozmowę o projekcie, dostaje albo otwiera makietę.",
            "Zrezygnować z warunków można tylko przed otrzymaniem makiety. Linku nie trzeba powtarzać — już poszedł. Jeśli rozmowa nie toczy się w Telegramie, ta odpowiedź czeka w karcie kontaktu: wyślij ją sam.",
            "Punktu o odpowiedzialności w warunkach nie łagodzimy i nie negocjujemy „na słowo”: to ochrona naszej pracy, dopóki nie ma umowy.",
          ],
        },
        deadline: {
          title: "12 godzin i hasło",
          paras: [
            "Makietę składa człowiek, bot sam ich nie robi. Link do klienta — w 12 godzin, jak obiecano. Przypomnienie na 2 godziny przed terminem ustawia się samo.",
            "Makietę zamyka się hasłem: «Makiety» → «Wygeneruj hasło». Pięć cyfr, ważne 24 godziny. «Kopiuj dla klienta» daje gotowy tekst: link, hasło, do której godziny działa i link do warunków.",
            "Każdy klient dostaje własne hasło. Hasło pokazuje się raz: zgubiłeś — wygeneruj nowe.",
          ],
        },
      },
      quiz: {
        go: {
          q: "Klient odpowiedział na kółko: «давайте». Co to jest?",
          options: ["Prośba o rozpisanie błędów: bot wysyła analizę strony z propozycją makiety na końcu", "Zgoda na makietę: bot od razu odpowiada, że przygotowujemy makietę", "Odmowa"],
          why: "Kółko obiecuje rozpisać błędy, więc «давайте» na nie znaczy „rozpiszcie”. Zgoda na makietę to «+» albo „tak” już na analizę.",
        },
        agree: {
          q: "Czy trzeba pytać klienta „zgadza się pan z warunkami?”",
          options: ["Nie: warunki przyjmuje się działaniem — rozmowa o projekcie, otrzymanie albo otwarcie makiety", "Tak, bez „zgadzam się” nie robimy makiety", "Tak, pisemnie na e-mail"],
          why: "Akceptacja przez działanie. Pytanie „zgadza się pan?” tylko hamuje klienta.",
        },
        minutes: {
          q: "Przez ile minut prototyp jest tylko u autora kontaktu?",
          options: ["30 minut", "12 godzin", "5 minut"],
          why: "Pół godziny u autora, potem «🔥 Нужен прототип» do całego zespołu.",
        },
        hours: {
          q: "W jakim terminie obiecujemy makietę?",
          options: ["12 godzin", "3 dni", "Tydzień"],
          why: "W kółku i wiadomości — 12 godzin. Innych terminów studio nie obiecuje.",
        },
        question: {
          q: "Na kółko odpisano «да?» ze znakiem zapytania. Co to jest?",
          options: ["Pytanie — zajmuje się nim człowiek", "Zgoda na makietę", "Odmowa"],
          why: "Ze znakiem zapytania to już pytanie, a nie „tak”.",
        },
        refuse: {
          q: "Do kiedy klient może zrezygnować z warunków makiety?",
          options: ["Tylko do otrzymania makiety", "W każdej chwili, także później", "Nie można zrezygnować"],
          why: "Dostał albo otworzył makietę — warunki są przyjęte.",
        },
      },
    },

    /* ── 4. Obiekcje ───────────────────────────────────────────────────── */
    objections: {
      title: "Obiekcje",
      summary: "Gotowe odpowiedzi na „drogo”, „nie mam czasu”, „mamy już stronę”, „kim jesteście”, „proszę przysłać ofertę”, „proszę zadzwonić” i odmowę.",
      lessons: {
        rules: {
          title: "Zasady ogólne",
          paras: [
            "Odpowiadaj krótko i ludzkim językiem. Najpierw przyznaj, co klient powiedział, potem wróć do korzyści dla niego i jednego łatwego kroku — darmowej makiety w 12 godzin.",
            "W kontakcie nie ma cen: ani w wiadomości, ani w przypomnieniu nie podajemy ceny. Ceny na stronach klientów są zwykle obrazkami i bot ich nie widzi. Cena to rozmowa człowieka, gdy zadanie jest jasne.",
            "Nie wolno: kłócić się, naciskać, „gwarantujemy”, „wypromujemy na szczyt”, procenty. Nie wolno technicznych słów: „serwer”, „indeksacja”, „SEO”, kody błędów. Klient ich nie zna.",
          ],
        },
        price: {
          title: "„Drogo” i „nie mam czasu”",
          paras: [
            "„Ile to kosztuje?” albo „Drogo”. Odpowiedź: „Rozumiem. Cena zależy od zadania. Makietę strony głównej zrobimy za darmo — zobaczy pan i zdecyduje, czy iść dalej. Zrobić?” Nie podawaj kwoty od razu: bez zadania zawsze wydaje się duża.",
            "„Nie mam czasu”. Odpowiedź: „Od pana nic nie trzeba: makietę zrobimy sami w 12 godzin, obejrzy pan, kiedy znajdzie chwilę. Wysłać, kiedy będzie gotowa?”",
            "Sens obu odpowiedzi jest ten sam: zdejmujemy ryzyko. Za darmo, szybko i do niczego nie zobowiązuje.",
          ],
        },
        site: {
          title: "„Mamy już stronę” i „kim jesteście?”",
          paras: [
            "„Mamy już stronę”. Odpowiedź: „Tak, właśnie ją oglądaliśmy. Na przykład na głównej nie da się znaleźć telefonu i część kupujących odchodzi. Makieta pokaże, jak to może wyglądać inaczej. Pokazać?” Fakt bierz tylko ze sprawdzenia strony, nie wymyślaj własnych znalezisk.",
            "Nie mów, że ich strona jest „zła” albo „przestarzała”. Ten człowiek ją zamówił i za nią zapłacił. Mów o kupujących: czego nie znajdują i dokąd odchodzą.",
            "„Kim jesteście?” albo „Skąd macie mój numer?”. Odpowiedź: „Tu [imię] ze studia DevUz, robimy strony. Kontakt wzięliśmy z pana strony. Obejrzeliśmy ją i znaleźliśmy, gdzie giną zapytania”. Uczciwie i krótko.",
          ],
        },
        stop: {
          title: "„Proszę przysłać ofertę”, „proszę zadzwonić”, odmowa",
          paras: [
            "„Proszę przysłać ofertę”, „na e-mail”. Model sam oferty nie wysyła i woła ciebie. Wyślij ją sam tego samego dnia. Dobrze najpierw dopytać o jedną rzecz w zadaniu: oferta bez zadania to cennik, a cennik porównuje się tylko po cenie.",
            "„Proszę zadzwonić”. Zadzwoń sam jak najszybciej: model nie dzwoni, już cię zawołał. Przed telefonem otwórz kartę: strona, tezy, co klient pisał.",
            "„Nie interesuje mnie”, „proszę nie pisać”. Nic więcej nie pisz: kolejna wiadomość po takiej prośbie to powód blokady konta. Kliknij «🙅 Клиент отказался» — kontakt się zamknie, przypomnienie nie wyjdzie.",
          ],
        },
      },
      quiz: {
        price: {
          q: "Klient w pierwszej odpowiedzi pyta: „Ile to kosztuje?” Co odpowiedzieć?",
          options: ["Nie podawać kwoty od razu: cena zależy od zadania, zaproponować darmową makietę", "Od razu podać najniższą cenę", "Obiecać rabat"],
          why: "Bez zadania każda kwota wydaje się duża. Najpierw korzyść i darmowy krok.",
        },
        stop: {
          q: "Klient napisał: «Не пишите больше». Co robić?",
          options: ["Nic nie pisać i kliknąć «🙅 Клиент отказался»", "Przeprosić i wysłać kółko", "Za trzy dni napisać ponownie"],
          why: "Wiadomość po „proszę nie pisać” to powód zgłoszenia i ograniczenia konta.",
        },
        kp: {
          q: "„Proszę przysłać ofertę na e-mail”. Kto i kiedy ją wysyła?",
          options: ["Ty sam, tego samego dnia: model tylko cię woła", "Model wyśle sam", "Nikt, to wymówka"],
          why: "Model nie może obiecywać, że coś wyśle. To twoja praca, jeszcze dziś.",
        },
        site: {
          q: "„Mamy już stronę”. Najlepsza odpowiedź?",
          options: ["Przyznać, podać jedno znalezisko ze sprawdzenia strony i zaproponować darmową makietę", "Powiedzieć, że ich strona jest zła", "Obiecać promocję strony „na szczyt”"],
          why: "Mówimy o kupujących i jednym fakcie, a nie o tym, że strona jest zła.",
        },
        jargon: {
          q: "Jakich słów nie wolno pisać klientowi?",
          options: ["Technicznych: „serwer”, „indeksacja”, „SEO”, kody błędów", "„makieta” i „za darmo”", "Nazwy jego firmy"],
          why: "Klient nie zna technicznego języka. Piszemy, co widzi i robi kupujący.",
        },
        call: {
          q: "Klient prosi: „Proszę zadzwonić”. Co robić?",
          options: ["Zadzwonić samemu jak najszybciej: model nie dzwoni i już cię zawołał", "Odpowiedzieć kółkiem", "Wysłać wiadomość o stronie"],
          why: "Prośba o telefon zawsze idzie do człowieka. Im szybszy telefon, tym cieplejsza rozmowa.",
        },
      },
    },

    /* ── 5. Podejścia w wiadomościach ──────────────────────────────────── */
    letters: {
      title: "Podejścia w wiadomościach: PAS, pytanie, „swoi w branży”",
      summary: "Jak zbudowana jest wiadomość po odpowiedzi, trzy podejścia z kursów sprzedaży na prawdziwych tekstach autoprzebiegu i jak uczciwie porównywać teksty.",
      lessons: {
        texts: {
          title: "Wiadomość pisze tekst, a nie model",
          paras: [
            "Wiadomość o stronie składa się z tekstu: twój własny (do dwóch — to A/B) → wspólne teksty zespołu → podejścia autoprzebiegu. Fakty o stronie wstawiają się same, jako tezy: co jest nie tak, czym to grozi i, jeśli jest, nasz projekt z jego branży.",
            "Wstawki: {kim} — „Tu [imię] ze studia DevUz”, {strona}, {tezy}, {prototyp} — zdanie o darmowym prototypie w 12 godzin.",
            "Zasady sprawdzania: od 12 do 100 słów (alfabetem łacińskim — do 130), bez powitania na początku, bez technicznych słów, bez procentów i „na szczyt”. Liczby — tylko z tez i „12 godzin”. Nie wolno wymieniać naszego projektu spoza jego branży.",
          ],
        },
        pas: {
          title: "PAS: problem → czym grozi → rozwiązanie",
          paras: [
            "PAS to problem, wzmocnienie, rozwiązanie. Najpierw fakt o jego stronie, potem czym grozi kupującym, potem rozwiązanie i jedno łatwe pytanie.",
            "Oto prawdziwy tekst podejścia „Ból i rozwiązanie” w autoprzebiegu (szablon po rosyjsku). Tezy robią dwa pierwsze kroki, {prototyp} trzeci, a pytanie na końcu to łatwe pytanie, na które łatwo odpowiedzieć „tak”.",
          ],
        },
        spin: {
          title: "Pytanie ze SPIN",
          paras: [
            "SPIN to sprzedaż pytaniami. Najmocniejsze jest pytanie o jego straty. Pytanie o jego pieniądze trzyma uwagę dłużej niż opowieść o nas.",
            "Oto tekst podejścia „Pytanie”. Zaczyna się od pytania, potem fakty, potem propozycja. Pytanie na końcu znów zaprasza do odpowiedzi.",
          ],
        },
        rival: {
          title: "„Swoi w branży”",
          paras: [
            "Dowód społeczny w pierwszym zdaniu: już pracujemy w jego branży. Właściciel firmy ufa temu, co zrobiono dla podobnych firm.",
            "To podejście bierze się tylko wtedy, gdy naprawdę mamy projekt z jego branży — wtedy w tezach jest do niego link. Wymyślony przypadek klient sprawdzi jednym kliknięciem. Oto tekst podejścia:",
          ],
        },
        ab: {
          title: "A/B: uczciwie i bez pośpiechu",
          paras: [
            "Dwa własne teksty to A/B: kontakty dzielą się między nie losowo i po równo. Kontakt pamięta, którym tekstem wyszedł.",
            "Dopóki na każdy tekst nie wyjdzie co najmniej po 20 wiadomości, panel pisze, że za wcześnie na ocenę. Przy dziesięciu wiadomościach każdy tekst może wygrać przypadkiem.",
            "Edycja tekstu nie psuje statystyki: poprzedni idzie do archiwum ze swoimi liczbami, nowy liczy się od zera. Pisz w «Kontakty» → «Teksty wiadomości i A/B».",
          ],
        },
      },
      quiz: {
        pas: {
          q: "Co oznacza PAS?",
          options: ["Problem → czym grozi → rozwiązanie i jedno łatwe pytanie", "Cena → rabat → termin", "Powitanie → o studiu → cennik"],
          why: "PAS: Problem, Agitate, Solve — fakt, skutki, rozwiązanie.",
        },
        rival: {
          q: "Kiedy można pisać podejściem „swoi w branży”?",
          options: ["Tylko gdy naprawdę mamy projekt z branży klienta", "Zawsze", "Tylko do stron uzbeckich"],
          why: "Bez prawdziwego projektu z linkiem to pusta obietnica.",
        },
        words: {
          q: "Ile słów może mieć wiadomość?",
          options: ["Od 12 do 100", "Od 40 do 300", "Dowolnie dużo"],
          why: "To replika w rozmowie: długiego tekstu na telefonie nikt nie doczyta.",
        },
        numbers: {
          q: "Jaką liczbę można napisać w tekście od siebie?",
          options: ["Tylko „12 godzin” — pozostałe liczby pochodzą z tez", "Dowolny procent wzrostu sprzedaży", "„Zrobimy w 3 dni”"],
          why: "Liczba spoza sprawdzenia to obietnica, której studio nie dało.",
        },
        ab: {
          q: "Kiedy można ocenić, który tekst w A/B jest lepszy?",
          options: ["Nie wcześniej niż po 20 wysłanych wiadomościach na każdy tekst", "Po pierwszych trzech odpowiedziach", "Zaraz po edycji"],
          why: "Przy małej liczbie wiadomości każdy tekst może wygrać przypadkiem.",
        },
        spin: {
          q: "Od czego zaczyna się podejście „Pytanie”?",
          options: ["Od pytania o jego straty: czy wie pan, ile zapytań traci pana strona?", "Od opowieści o studiu", "Od ceny"],
          why: "Pytanie ze SPIN dotyczy pieniędzy klienta, nie nas.",
        },
      },
    },

    /* ── 6. Ciepłe leady ───────────────────────────────────────────────── */
    warm: {
      title: "Ciepłe leady",
      summary: "Jak działa kolejka ciepłych leadów, jak brać leada, dlaczego liczy się szybkość i jak przekazać leada koledze.",
      lessons: {
        queue: {
          title: "Kolejka ciepłych leadów",
          paras: [
            "Leady rozdaje się po kolei, a nie temu, kto szybciej kliknie. W dzień, od 08:00 do 18:00, nowy lead trafia do jednej osoby na 30 minut — do tej, która w miesiącu ma najmniej „wziął + pominął”. Karta: «⏳ Лид ваш на 30 минут».",
            "Nie wziąłeś w pół godziny — lead idzie do następnej osoby, a pominięcie liczy się jako otrzymana szansa. Nikt nie wziął przez całe koło — lead jest otwarty dla wszystkich.",
            "W nocy, od 18:00 do 08:00, lead jest od razu otwarty dla wszystkich, ale można wziąć najwyżej równy udział w miesiącu.",
            "Odpowiedź na kontakt autoprzebiegu przychodzi z nagłówkiem «🤖 Ответ на касание автопрогона» i idzie tą samą kolejką. Leady z twoich własnych kontaktów do kolejki nie trafiają — są od razu twoje.",
          ],
        },
        take: {
          title: "Jak brać leada",
          paras: [
            "«✅ Взять в работу» w Telegramie albo «Przejmij» w karcie. Wtedy lead jest twój, status „w toku”, po 4 godzinach przyjdzie przypomnienie „co dalej?”.",
            "Dane kontaktowe klienta i rozmowa otwierają się dopiero po wzięciu. Każde otwarcie trafia do dziennika — otwieraj, gdy zamierzasz pisać.",
            "Wziąłeś, ale nie możesz prowadzić — «Zwróć do kolejki». «🗄 Отклонить» w Telegramie znaczy „klient nie jest nam potrzebny”: lead będzie „odłożony”, a w dzienniku widać, kto zdecydował.",
          ],
        },
        speed: {
          title: "Szybkość i ton",
          paras: [
            "Klient napisał przed chwilą. Za godzinę rozmawia już z innym studiem. Odpowiadaj w pierwszych minutach.",
            "Model odpowiada w twoim imieniu, dopóki nie klikniesz «Odpowiadam osobiście». Odpowiadaj klientowi tylko z tego konta firmowego, z którego wyszedł kontakt: wiadomość z innego numeru to dla niego obca osoba.",
            "Po każdej rozmowie zmieniaj status. Lead bez ruchu trafia do «Pilny kontakt»: gorący po 2 dniach, ciepły po 3. Nie wyszło — ustaw „przegrany”, a nie porzucaj.",
          ],
        },
        handover: {
          title: "Przekazać leada koledze",
          paras: [
            "W karcie «Przekaż»: komu i dlaczego, potem «Poproś o przekazanie». Lead jest u ciebie, dopóki kierownik albo właściciel nie potwierdzi go w Telegramie przyciskami.",
            "Lead z kontaktu idzie razem z rozmową: odpowiedzi klienta, przypomnienia i podpis modelu są teraz u kolegi. Wolnego leada się nie przekazuje — się go bierze.",
            "Lead od partnera omija kolejkę: od razu do wszystkich, bot przypomina co 15 minut, dopóki nikt go nie weźmie. Partner poręczył za klienta — dzwonimy pierwsi.",
          ],
        },
      },
      quiz: {
        day: {
          q: "W dzień przyszedł ciepły lead. Komu jest proponowany?",
          options: ["Jednej osobie na 30 minut — tej, która ma w miesiącu najmniej „wziął + pominął”", "Wszystkim: bierze ten, kto pierwszy kliknie", "Tylko kierownikowi"],
          why: "W dzień — po kolei, po pół godziny na osobę.",
        },
        missed: {
          q: "Nie wziąłeś leada w 30 minut. Co dalej?",
          options: ["Lead idzie do następnej osoby, pominięcie liczy się jako otrzymana szansa", "Lead czeka na ciebie do wieczora", "Lead jest usuwany"],
          why: "Inaczej osoba na urlopie trzymałaby każdego leada przez pół godziny.",
        },
        contact: {
          q: "Kiedy można otworzyć dane kontaktowe klienta?",
          options: ["Tylko po «Przejmij»; każde otwarcie trafia do dziennika", "Od razu, wszystkim", "Tylko kierownikowi"],
          why: "Kontakt — tylko dla tego, czyj jest lead, i z wpisem w dzienniku.",
        },
        transfer: {
          q: "Chcesz oddać leada koledze. Jak?",
          options: ["«Poproś o przekazanie» z powodem — potwierdzi kierownik albo właściciel", "Wysłać koledze kontakt prywatnie", "Kliknąć «🗄 Отклонить»"],
          why: "Przekazanie idzie przez potwierdzenie: lead nie wisi między dwiema osobami.",
        },
        account: {
          q: "Z którego konta odpowiadać klientowi z kontaktu?",
          options: ["Tylko z konta firmowego, z którego wyszedł kontakt", "Z dowolnego prywatnego", "Zawsze z głównego"],
          why: "Dla klienta to jeden rozmówca. Inny numer to obca osoba.",
        },
        release: {
          q: "Wziąłeś leada, ale nie możesz go prowadzić. Co kliknąć?",
          options: ["«Zwróć do kolejki»", "„przegrany”", "Nic, lead sam odejdzie"],
          why: "«Zwróć do kolejki» otwiera leada dla wszystkich i zdejmuje twoje przypomnienia.",
        },
      },
    },
  },

  /* ── Test z panelu ────────────────────────────────────────────────────── */
  panel: {
    title: "Test z panelu",
    summary: "Pytania o działy, które masz otwarte. Pomyłka — obok link do właściwego punktu instrukcji.",
    questions: {
      "lead-queue": {
        q: "W dzień lead z kolejki trafił do ciebie. Jak długo jest tylko twój?",
        options: ["30 minut", "4 godziny", "Do końca dnia"],
        why: "W dzień lead jest u jednej osoby pół godziny, potem idzie dalej.",
      },
      "lead-reject": {
        q: "Co znaczy «🗄 Отклонить» pod kartą leada w Telegramie?",
        options: ["„Klient nie jest nam potrzebny”: lead przypisuje się klikającemu i staje się „odłożony”", "Lead idzie do następnej osoby w kolejce", "Lead znika bez śladu"],
        why: "Odmowa musi mieć autora — dlatego lead najpierw przypisuje się tobie.",
      },
      "lead-contact": {
        q: "Kiedy w karcie otwiera się «Pokaż dane kontaktowe»?",
        options: ["Tylko dla przejętego leada, a każde otwarcie trafia do dziennika", "Od razu każdemu, kto widzi leada", "Tylko właścicielowi"],
        why: "Kontakt — po «Przejmij», z wpisem w dzienniku.",
      },
      "lead-reminder": {
        q: "Po jakim czasie od wzięcia leada przychodzi automatyczne przypomnienie?",
        options: ["Po 4 godzinach", "Po dobie", "Po tygodniu"],
        why: "Lead nieruszony od rana do wieczora już wystygł — dlatego 4 godziny.",
      },
      "lead-transfer": {
        q: "Kto potwierdza przekazanie leada koledze?",
        options: ["Twój kierownik albo właściciel", "Kolega, któremu przekazujesz", "Nikt, lead przechodzi od razu"],
        why: "Dostają wiadomość z przyciskami potwierdzenia i odrzucenia.",
      },
      "lead-urgent": {
        q: "Kiedy gorący lead „w toku” trafia do «Pilny kontakt»?",
        options: ["Po 2 dniach bez ruchu", "Po godzinie", "Po 14 dniach"],
        why: "Gorący — 2 dni, ciepły — 3, do dojrzenia — 5, archiwum — 14.",
      },
      portion: {
        q: "Co o 18:00 dzieje się z niezrobioną częścią porcji dnia?",
        options: ["Wraca do wspólnej puli, wiadomość jest kasowana", "Przechodzi na jutro do ciebie", "Bot wysyła ją sam"],
        why: "Wiadomość jest podpisana twoim imieniem, więc się kasuje, a firma wraca do puli.",
      },
      "hello-count": {
        q: "Co w kontakcie w dwóch krokach liczy się do „trzech na godzinę” i porcji dnia?",
        options: ["Samo powitanie", "Tylko wiadomość po odpowiedzi", "Kółko"],
        why: "Pierwsza wiadomość do nieznajomego to to, co liczy Telegram.",
      },
      "fact-check": {
        q: "Jak długo ważne jest sprawdzenie strony przed wiadomością?",
        options: ["Trzy dni", "Miesiąc", "Godzinę"],
        why: "Starsze niż trzy dni — wiadomość nie wyjdzie, kliknij «Skontaktuj się» ponownie.",
      },
      "account-queue": {
        q: "Jak konto firmowe wysyła pierwsze wiadomości do nowych firm?",
        options: ["Najwyżej trzy na godzinę i tylko od 07:30 do 20:30 czasu taszkenckiego", "Wszystkie naraz, bez przerwy", "Tylko w nocy"],
        why: "Inaczej Telegram uzna nas za masową wysyłkę i ograniczy konto.",
      },
      self: {
        q: "Po co klikać «Skontaktowano samodzielnie»?",
        options: ["Kontakt liczy się tobie, lead zakłada się na ciebie, a kolega nie napisze do tej samej osoby", "Żeby bot wysłał wiadomość jeszcze raz", "Żeby zamknąć kontakt"],
        why: "Bez oznaczenia dla panelu do nikogo nie pisałeś.",
      },
      ignore: {
        q: "Co robi «🔇 Игнорирует»?",
        options: ["Zamyka kontakt: przypomnienie nie wychodzi, lead „przegrany”, ale kontakt zostaje zaliczony", "Wysyła klientowi przypomnienie", "Usuwa firmę z bazy"],
        why: "Do klienta naprawdę napisano — dlatego kontakt się liczy.",
      },
      followups: {
        q: "Kiedy bot przypomina się klientowi, który milczy?",
        options: ["3 i 7 dni po wiadomości bota, w dni robocze od 10:00 do 17:00; po samym powitaniu nie ma przypomnień", "Codziennie, aż odpowie", "Godzinę po powitaniu"],
        why: "Przypomnienia są tylko dla wiadomości wysłanych przez bota i tylko dwa razy.",
      },
      texts: {
        q: "Gdzie pisze się własny tekst wiadomości albo dwa teksty do A/B?",
        options: ["«Kontakty» → «Teksty wiadomości i A/B»", "W «Zespół»", "W karcie leada"],
        why: "Tam jest też wynik każdego tekstu i „za wcześnie na ocenę” do 20 wiadomości.",
      },
      "reply-myself": {
        q: "Co robi «Odpowiadam osobiście» w karcie leada?",
        options: ["Zabiera rozmowę modelowi: dalej wiadomości klienta przychodzą do ciebie", "Wysyła klientowi kółko", "Przekazuje leada koledze"],
        why: "Po kliknięciu model milczy, rozmowa jest twoja.",
      },
      autopilot: {
        q: "Ile wiadomości dziennie ma wysłać autoprzebieg kontaktów?",
        options: ["Co najmniej 20, które naprawdę wyszły w Telegramie", "Dokładnie 20 prób", "Tyle, ile menedżerowie zdążą sprawdzić"],
        why: "Próby się nie liczą: dopóki nie wyjdzie dwadzieścia, autoprzebieg bierze następną firmę.",
      },
      "mockup-password": {
        q: "Jak długo działa hasło z «Wygeneruj hasło» w «Makiety»?",
        options: ["24 godziny, pięć cyfr", "Tydzień", "Na zawsze"],
        why: "Dostęp klienta kończy się razem z hasłem.",
      },
      "mockup-closed": {
        q: "Co pierwsze hasło robi z makietą otwartą przez link?",
        options: ["Zamyka ją: bez hasła widać już tylko pole hasła", "Nic, link działa jak dawniej", "Usuwa makietę"],
        why: "Dotyczy to także tych, którym link wysłano wcześniej.",
      },
      "project-lead": {
        q: "Kto zostaje prowadzącym projekt?",
        options: ["Ten, kto założył projekt", "Kierownik zespołu", "Ten, kto pierwszy otworzył kartę"],
        why: "Naliczenia idą do prowadzącego — zakładaj swój projekt sam.",
      },
      "project-stage": {
        q: "Kto zmienia etap projektu?",
        options: ["Tylko właściciel", "Prowadzący menedżer", "Klient"],
        why: "Etap to obietnica dla klienta, a nie znaczek wykonawcy.",
      },
      "finance-base": {
        q: "Od czego liczy się twój procent od transakcji?",
        options: ["Od czystego zysku: kwota umowy minus podatek i koszt wykonania", "Od całej kwoty umowy", "Od pierwszej płatności"],
        why: "Podatek i koszt wpisuje właściciel.",
      },
      "finance-frozen": {
        q: "Co znaczy „zamrożone” w «Finanse»?",
        options: ["Transakcja jest, ale klient nie zapłacił jeszcze całej kwoty", "Wypłata odrzucona", "Projekt anulowany"],
        why: "„Zarobione” — gdy klient zapłacił za projekt w całości.",
      },
      "stats-lost": {
        q: "Dlaczego ważne jest ustawić „przegrany”, a nie porzucić leada?",
        options: ["Odsetek wygranych liczy się tylko z zamkniętych transakcji", "Inaczej lead się usunie", "Inaczej nie przyjdzie porcja"],
        why: "Wygrane ÷ (wygrane + przegrane): porzucony lead psuje obraz.",
      },
      "scout-strong": {
        q: "W «Wyszukiwanie» przyszedł mocny sygnał (70+). Co robić?",
        options: ["Nie pisać samemu: za parę minut przyjdzie kolejką leadów z gotową odpowiedzią", "Od razu napisać do autora prywatnie", "Przekazać na czat zespołu"],
        why: "Jeśli do człowieka napiszą dwie osoby, wyglądamy jak spam.",
      },
      "orders-flow": {
        q: "Jaką drogę przechodzi zamówienie w «Zamówienia»?",
        options: ["nowe → faktura wystawiona → opłacone → przekazane", "nowe → w toku → wygrane", "brief → projekt graficzny → start"],
        why: "Albo „anulowane” — na każdym kroku.",
      },
      "help-language": {
        q: "Gdzie zapamiętuje się język panelu RU / UZ / PL?",
        options: ["Przy tobie: na każdym urządzeniu panel otworzy się w tym samym języku", "Tylko w tej przeglądarce", "Dla całego zespołu naraz"],
        why: "Język zmienia się tylko sobie i jest zapisany w twoim profilu.",
      },
      "team-plan": {
        q: "Jak tygodniowy plan kontaktów zamienia się w porcję dnia?",
        options: ["Plan ÷ 5, od 2 do 15 firm dziennie", "Cały plan w poniedziałek", "Porcja zawsze 20"],
        why: "Bez planu — 5 dziennie, 0 — porcji nie ma.",
      },
      "partner-count": {
        q: "Kiedy lead z linku zalicza się partnerowi?",
        options: ["Gdy to nie on sam, klient nie był u nas wcześniej, a partner nie jest zablokowany", "Zawsze, bez warunków", "Tylko po płatności"],
        why: "Po zaliczeniu partner dostaje «🤝 По вашей ссылке пришёл…».",
      },
      "partner-payout": {
        q: "Kto decyduje o wniosku partnera o wypłatę?",
        options: ["Tylko właściciel", "Kierownik", "Sam partner"],
        why: "To pieniądze dla osób z zewnątrz — decyzja należy do właściciela.",
      },
      "accounts-circle": {
        q: "Jak często bot zagląda do «Zapisanych» kont firmowych po kółka?",
        options: ["Raz na dziesięć minut", "Raz na dobę", "Tylko przy restarcie"],
        why: "Dlatego wiersze o kółkach odświeżają się z opóźnieniem.",
      },
    },
  },
};
