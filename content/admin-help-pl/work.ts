import type { HelpEntry } from "@/lib/admin/help";

/**
 * Польская инструкция, часть «работа»: Надзор, Кандидаты, Проекты,
 * Статистика, Трафик, Договоры, Расходы, Финансы.
 *
 * Перевод тех же разделов admin-help-ru.ts абзац в абзац. Названия кнопок и
 * блоков — как на польской панели. Русскими остаются только тексты, которые
 * уходят в договор и счёт заказчику (срок в договоре, заметка платежа).
 */
export const workSections: Record<string, HelpEntry> = {
  /* ── Рабочие аккаунты ──────────────────────────────────────────────── */
  "/admin/accounts": {
    what: "Konta robocze Telegrama, z których wychodzą pierwsze wiadomości kontaktów i toczy się korespondencja z klientami. Główne jest podłączone na serwerze i dodatkowo czyta czaty; tutaj podłącza się dodatkowe i zaznacza, kto na którym pracuje. Sekcję widzą właściciel i kierownik.",
    items: [
      {
        id: "add",
        title: "Podłącz konto",
        body: [
          "Wpisz nazwę konta (na przykład «Konto Dilnozy») i jego numer telefonu — +998… albo 9 cyfr bez kodu kraju. Kliknij **«Wyślij kod»**. Za kilka sekund skaut poprosi Telegram o kod, a przy koncie pojawi się pole «Kod z Telegrama»; w trakcie logowania strona odświeża się sama.",
          "Kod przychodzi do aplikacji Telegram na telefonie tego konta — wiadomością od Telegrama, zwykle nie SMS-em. Wpisz go i kliknij **«Zaloguj»**. Nie przesyłaj nikomu kodu i nie wysyłaj go na czat: Telegram unieważnia kod przesłany wiadomością i logowanie trzeba zaczynać od nowa.",
          "Jeśli włączona jest weryfikacja dwuetapowa, pojawi się pole «Hasło weryfikacji dwuetapowej»: wpisz hasło i znowu **«Zaloguj»**. Hasła nie przechowujemy: skaut je sprawdza i od razu usuwa. Udało się — status «pracuje», a obok nazwa konta. Na telefonie konta na liście urządzeń pojawi się nowa sesja — to my; nie kończ jej, bo konto się odłączy.",
          "«kod nie pasuje» — wpisz kod jeszcze raz; «kod wygasł» albo inny błąd — kliknij **«Odłącz»** i podłącz konto ponownie tym samym numerem.",
        ],
      },
      {
        id: "limits",
        title: "Ile wiadomości i z którego konta",
        body: [
          "Każde konto ma własny limit pierwszych wiadomości do nowych osób na godzinę: główne — 3, nowe — też 3. Świeżemu numerowi przez pierwszy tydzień lepiej ustawić 1–2 w polu «Wiadomości na godzinę»: nowe konto Telegram ogranicza szybciej. Pierwsze wiadomości wychodzą codziennie od 07:30 do 20:30 czasu taszkenckiego — dodane w nocy czekają i wychodzą rano; korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Na górze sekcji — ile wychodzi ze wszystkich razem; ta sama liczba stoi nad listą w [Zimnych kontaktach](/admin/prospect).",
          "Kolejka kontaktów jest jedna: wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce — menedżer niczego nie wybiera; jeśli ktoś jest przypisany do kont (punkt [kto pracuje na koncie](#accounts-staff)), — tylko z jego kont. Odpowiedzi do klienta, odpowiedzi modelu i poprawka wiadomości idą z tego samego konta, z którego wyszła pierwsza wiadomość: napisać do człowieka z innego numeru to pojawić się w jego rozmowie jako nieznajomy.",
          "Pod każdym kontem — ile pierwszych wiadomości wyszło w ostatniej godzinie i dziś, oraz «połączone», jeśli skaut trzyma je podłączone (znacznik co minutę). Brak znacznika dłużej niż trzy minuty — skaut nie pracuje tym kontem: sprawdź serwer albo podłącz konto ponownie.",
        ],
      },
      {
        id: "staff",
        title: "Kto pracuje na koncie",
        body: [
          "Pod kontem głównym i pod każdym podłączonym — blok **«Kto pracuje na koncie»**: pola wyboru ze wszystkimi, którzy pracują w studiu. Zaznacz osoby tego konta i kliknij **«Zapisz»**. Ta sama osoba może być na kilku kontach — zaznacz ją na każdym; odznaczenie zdejmuje ją z konta.",
          "Po co: pierwsze wiadomości zaznaczonej osoby wychodzą tylko z jej kont — z tego, na którym wcześniej zwolni się miejsce w limicie «3 na godzinę». Dzięki temu klient dostaje wiadomość z numeru, za którym stoi jego menedżer. Osoba niezaznaczona na żadnym koncie — jej wiadomości bierze dowolne konto, jak wcześniej: nowy menedżer może pisać od razu, bez czekania na przypisanie. Konto odłączono — jego przypisania znikają same, a wiadomości jego ludzi znowu biorą pozostałe. Kto kogo przypisał, zapisuje się w dzienniku działań.",
        ],
      },
      {
        id: "circle",
        title: "Kółko do kontaktów",
        body: [
          "Tym, którzy odpowiedzieli na powitanie po rosyjsku, wychodzi kółko po rosyjsku, po uzbecku — kółko po uzbecku: krótkie wideo od studia: obejrzeliśmy stronę, znaleźliśmy kilka błędów, zaraz je rozpiszemy. Analizę z propozycją darmowej makiety bot wysyła, gdy klient odpowie na kółko ([kontakt w dwóch krokach](#prospect-hello)). Tym, którzy odpowiedzieli w innym języku, wychodzi wiadomość w ich języku, bez kółka. Bot bierze kółko w potrzebnym języku z «Zapisanych» tego konta firmowego, z którego szedł kontakt, i wysyła kopię, bez oznaczenia „przekazano”.",
          "Nie trzeba ręcznie zapisywać kółek w «Zapisanych» każdego konta: w bloku **«Kółko do kontaktów»** na górze tej strony są dwa miejsca — **«Kółko po rosyjsku»** i **«Kółko po uzbecku»**. Do każdego wgraj plik — MP4, kwadratowe wideo do minuty (kółko zapisane z Telegrama pasuje bez zmian) — i kliknij **«Wgraj kółko»**. W ciągu dziesięciu minut bot sam zapisze je w «Zapisanych» konta głównego i każdego podłączonego. Tam też widać, które kółko w każdym języku wychodzi teraz, kiedy i przez kogo zostało wgrane; nowe zastępuje poprzednie w tym samym języku na wszystkich kontach, kółko w drugim języku zostaje. Kto wgrał — w dzienniku działań. Można też bez pliku: przekaż kółko botowi studia na prywatnym czacie — bot zapyta o język, wybierz «🇷🇺 Русский» albo «🇺🇿 O‘zbekcha», a on odpowie na przykład «Узбекский кружок сохранён для касаний». Kółka mogą zmieniać właściciel i kierownik.",
          "Przy każdym koncie są tu dwa wiersze — o kółku po rosyjsku («Kółko po rosyjsku: jest, zapisane …» albo «Brak kółka po rosyjsku») i o kółku po uzbecku. Nie ma potrzebnego — zamiast kółka wyjdzie wiadomość w języku odpowiedzi. Bot zagląda do «Zapisanych» co dziesięć minut, więc wiersze nie odświeżą się od razu. Kółko po rosyjsku można zapisać w «Zapisanych» także ręcznie — bot weźmie ostatnie. Po uzbecku — tylko przez ten blok albo bota: po wideo języka nie poznać, a kółko zapisane ręcznie bot uznaje za rosyjskie. Jeśli kółko nie wyszło, bo go nie ma, mówi o tym też wiersz w raporcie o 18:00.",
        ],
      },
      {
        id: "circle-niches",
        title: "Kółka według branż",
        body: [
          "Pod ogólnymi kółkami są **«Kółka według branż»**: kółko na branżę i język. Branże: centrum medyczne, stomatologia, meble, restauracja, salon urody, biuro podróży, centrum szkoleniowe, nieruchomości. Kółko branży wychodzi do firm z tej branży w nowej połowie kontaktów ([A/B](/admin/prospect/texts#sales-ab)); nie ma kółka branży w potrzebnym języku, wychodzi ogólne, jak dotąd. Branżę firmy panel bierze z jej karty, a jeśli jej nie ma, z nazwy i adresu strony.",
          "Wiersz **«Brakuje: …»** pokazuje, których kółek branż nie ma ani wśród wgranych, ani w «Zapisanych» kont. Niżej dla każdej branży i języka: «jest» z datą wgrania albo «brak, wychodzi ogólne».",
          "Wgrywanie: wybierz **«Branża»** i **«Język kółka»**, plik (MP4, kwadrat, do minuty) i kliknij **«Wgraj kółko branży»**. W ciągu 10 minut bot zapisze je w «Zapisanych» każdego konta. Albo przekaż kółko botowi studia: zapyta o język, potem przyciskami o branżę.",
        ],
      },
      {
        id: "stop",
        title: "Wstrzymanie, ograniczenie i odłączenie",
        body: [
          "**«Wstrzymaj»** — konto przestaje pisać pierwsze wiadomości, ale odpowiada w już rozpoczętych rozmowach. **«Przywróć do pracy»** — znowu pisze.",
          "Jeśli Telegram ograniczy konto za masową wysyłkę, samo staje na dobę: pierwsze wiadomości wychodzą z pozostałych, korespondencja trwa, a przy koncie widać, do kiedy stoi. Wiadomość, przy której to się stało, wraca do kolejki i wyjdzie z innego konta. Jeśli nie ma już kto pisać, kolejka jest zdejmowana w całości, jak wcześniej. Co godzinę każde konto, także główne, samo pyta @SpamBot, czy nie jest ograniczone. Teraz to sprawdzanie jest wyłączone decyzją właściciela (od 03.11.2026): o ograniczeniu dowiadujemy się dopiero, gdy Telegram odmówi wysłania. Jeśli Telegram podał termin dłuższy niż doba, konto stoi do tego terminu. O ograniczeniu bot pisze do całego zespołu: które konto i do której godziny stoi, ile i czyich wiadomości czeka właśnie na nie i co robić — pisać do klientów z prywatnego konta albo z innego konta roboczego. Gdy ograniczenie zniknie, bot napisze, że konto znowu pisze. Żeby wiadomości menedżera nie czekały na ograniczone konto, przypisz go jeszcze do jednego — punkt [kto pracuje na koncie](#accounts-staff).",
          "**«Odłącz»** — skaut zamyka sesję w Telegramie (zniknie z urządzeń na telefonie) i usuwa ją u nas. Rozmowy rozpoczęte z tego konta zostają w «Zimnych kontaktach», ale dalej odpowiadasz w nich sam: z tego numeru nie ma już kto pisać.",
        ],
      },
    ],
  },

  /* ── Надзор ───────────────────────────────────────────────────────── */
  "/admin/talks": {
    what: "Analiza rozmów z zimnych kontaktów. Każdą rozmowę, która ucichła, czyta drugi model — nie ten, który ją prowadził — i odpowiada: co zaciekawiło klienta, jaki padł zarzut, na czym się posypało i jaka z tego lekcja. Lekcja przydaje się temu, kto pisze następną wiadomość.",
    items: [
      {
        id: "when",
        title: "Kiedy pojawia się analiza",
        body: [
          "Mniej więcej godzinę po ostatniej odpowiedzi klienta. Jeśli klient napisze coś później, rozmowa jest analizowana od nowa, a stara analiza zostaje zastąpiona nową. Analiza powstaje od nowa także wtedy, gdy kontakt zamknięto przyciskiem «🙅 Klient odmówił» albo «🔇 Ignoruje»: wynik zmienia się na «odmówił» albo «rozmowa utknęła».",
          "Analizowane są tylko rozmowy z kontaktów, w których klient choć raz odpowiedział. Czaty ze strony i z bota tu nie trafiają.",
        ],
      },
      {
        id: "read",
        title: "Jak czytać wiersz",
        body: [
          "Wynik: «odmówił», «poprosił o człowieka», «wstępna rozmowa zamknięta», «rozmowa utknęła» albo «jeszcze trwa». «Rozmowa utknęła» to wszystko pozostałe: milczenie, prośba o przesłanie pliku, niejasna odpowiedź.",
          "Na zielono — lekcja. Poniżej — «Zaciekawiło», «Zarzut», «Posypało się». «Za mało rozmowy — wniosek słaby» oznacza, że klient napisał mniej niż dwie wiadomości: z jednej wypowiedzi nie wyciąga się wniosków i lekcji tam nie ma.",
          "Kafelki u góry: ile rozmów przeanalizowano, ile jest lekcji opartych na słowach klienta, ile odmów i ile rozmów po uzbecku.",
        ],
      },
      {
        id: "use",
        title: "Co z tym zrobić",
        body: {
          manager: [
            "Przeczytaj świeże lekcje, zanim zaczniesz poprawiać wiadomości z porcji dnia: co przyciąga ludzi i na czym rozmowy się urywają. Lekcje nie są na razie same dodawane do wiadomości — zdecyduje o tym właściciel, gdy uzbiera się kilkadziesiąt odpowiedzi.",
            "«lead →» otwiera leada z tej rozmowy, jeśli jest Twój.",
          ],
          head: [
            "Omawiaj lekcje z zespołem: które haczyki działają, na jakich zarzutach rozmowy się sypią. Na razie nie są same dodawane do wiadomości — zdecyduje o tym właściciel, gdy uzbiera się kilkadziesiąt odpowiedzi.",
          ],
          admin: [
            "Lekcje na razie tylko się zbierają i nie trafiają do wiadomości. Dodawanie ich do promptu pierwszej wiadomości to Twoja decyzja — warto ją podjąć, gdy uzbiera się kilkadziesiąt odpowiedzi.",
          ],
        },
      },
    ],
  },

  /* ── Макеты ───────────────────────────────────────────────────────── */
  "/admin/mockups": {
    what: "Wszystkie makiety studia na jednej liście: prototypy na devuz.studio i projekty witryny globalex. Widać tu, dla kogo zrobiono makietę, w jakiej branży i czy jest zamknięta hasłem. Tu też wydaje się hasło na dobę, żeby klient otworzył swoją makietę.",
    items: [
      {
        id: "list",
        title: "Co jest na liście",
        body: [
          "Prototypy na devuz.studio, zbudowane ręcznie pod konkretnego klienta. Nowy prototyp pojawia się tu sam, gdy tylko jest gotowy. Prototypów, które bot budował sam do [kontaktów](/admin/prospect) do 07.10.2026, tu nie ma, żeby nie myliły się z naszymi (właściciel, 09.10.2026); jeśli klient dostał taki link wcześniej, nadal mu się otwiera. Szkiców na liście nie ma: pod ich linkiem klient niczego nie zobaczy.",
          "Projekty witryny globalex, z oznaczeniem «witryna». Większość z nich jest otwarta dla wszystkich, także dla wyszukiwarek: tak zdecydował właściciel, nie ustawia się im hasła, a zamiast przycisku jest napis «hasło niepotrzebne». Hasłem zamknięte są MAVERA, Golden House i Engelberg.",
          "Przy każdej makiecie: nazwa (dla kogo ją zrobiono) i strona klienta, «Branża», «Zrobiona», dostęp i link, który trafia do klienta. «otwarcia klienta: 3» to liczba otwarć makiety przez kogoś innego niż my: nasze otwarcia z panelu i podglądy linku w komunikatorach się nie liczą.",
          "Najnowsze makiety są na górze. Pole wyszukiwania szuka po nazwie, stronie, branży, osobie odpowiedzialnej i kliencie, do którego poszła makieta, a przyciski «Wszystkie», «Zrobione ręcznie», «Niewysłane» i «Witryna» zostawiają na liście tylko swoje. Liczba na przycisku to liczba makiet w tej grupie.",
        ],
      },
      {
        id: "bot-mockup",
        title: "Makieta w bocie: klient buduje sam",
        body: [
          "Od 10.11.2026 klient może sam zbudować makietę w prywatnym czacie z botem studia: komenda /maket albo link t.me/<bot>?start=maket. Gotowe szablony ma czternaście branż: stomatologia, centrum medyczne, meble-remont (od 12.11.2026 tak nazywa się przycisk: szablon pasuje i do mebli, i do ekip remontowych), restauracja, salon urody, biuro podróży, centrum szkoleniowe, nieruchomości i od 12.11.2026 warsztat samochodowy, salon samochodowy, sklep internetowy, budowa i remont, logistyka, usługi dla firm; każdy złożony z naszej gotowej makiety tej branży. Ręcznie w 12 godzin projektant składa tylko wtedy, gdy składanie nie przeszło kontroli. Przycisk «Inne» nie jest ślepą uliczką (od 12.11.2026): bot prosi, by w dwóch słowach napisać, czym zajmuje się firma, na przykład «remont mieszkań», rozpoznaje po tych słowach branżę i składa najbliższą naszą makietę, a jeśli nie rozpozna, składa uniwersalną «Usługi dla firm»; branżę można też napisać zamiast przycisku. Najpierw bot pyta o język przyciskami «🇷🇺 Русский» i «🇺🇿 O‘zbekcha»: w wybranym języku prowadzi dalej rozmowę i buduje makietę, nawet jeśli aplikacja Telegram klienta jest w innym. Potem klient wysyła adres strony (albo naciska przycisk bez strony i odpowiada na cztery pytania), wybiera branżę przyciskiem, a po minucie lub dwóch bot przysyła link do makiety i cenę strony z dodatkami. Postęp budowy klient widzi krok po kroku: czytamy stronę, logo i kolory, usługi i ceny, budujemy, sprawdzamy, gotowe.",
          "Projekt i bloki to nasz gotowy szablon branży, model tylko czyta stronę klienta: nazwę, logo, kolory, usługi, ceny, lekarzy, adres. Czego nie ma na jego stronie, tego nie ma na makiecie. Szablony są dla stomatologii (z naszej makiety Nek), centrum medycznego (z naszej makiety Shox Hospital) i mebli (z naszej makiety vTashkente: kuchnia składa się podczas przewijania, obliczenie metrów, zgłoszenie na pomiar) i restauracji (z naszej makiety Agora: menu z wyszukiwaniem i zamówieniem z wyprzedzeniem, rezerwacja stolika w dwóch dotknięciach, sala w pasku, «Jak dojechać») i biura podróży (z naszej makiety SEM Travel: trasa z Taszkentu z ceną «od», dobór wycieczki, mapa kierunków, zgłoszenie w Telegramie; z naszej makiety Apollo Travel: zakładki wyszukiwania «Туры», «Авиабилеты», «Отели» i ekran wyszukiwania z łukiem przelotu i kartami, gdzie cena jest tylko od biura, a bez niej «цена по запросу»; na mapę trafiają tylko kraje, które biuro podało u siebie z ceną w dolarach) oraz centrum szkoleniowego (z naszej makiety MedAcademy, ciemny wariant z limonką: kursy z cenami w zakładkach, wykładowcy na obracanych kartach, pasek przewijany i zapis w Telegramie centrum; makieta jest zawsze fioletowa z limonką, kolor klienta jej nie zmienia) oraz biura nieruchomości (z naszej makiety MAVERA, wariant «Premium»: jasny ekran ze zdjęciem, taśma usług z cenami klienta, plan osiedla z klikalnymi budynkami i szachownica mieszkań jako przykład działania strony, bez cudzych cen i metraży, kroki transakcji i zgłoszenie w Telegramie biura). W stomatologii, centrum medycznym, restauracji, meblach i biurze podróży makieta otwiera się przelotem przy przewijaniu na neutralnych kadrach branży, tych samych dla wszystkich klientów: w restauracji kamera wlatuje przez drzwi, obok hostessy do kuchni, nad płytą z ogniem, a w ciemności pojawia się nazwa lokalu; w meblach robotnicy wynoszą stare, robią remont i wstawiają nowe meble, nazwa staje nad sofą; w biurze podróży człowiek przewija feed w telefonie, dotyka zdjęcia wyspy i ląduje na leżaku nad oceanem. Salon urody ma osobny szablon: kamera wlatuje przez drzwi pod szyldem z nazwą salonu, mija recepcję, strzyżenie, manicure i koloryzację (w podpisach stoją usługi i ceny samego salonu, jeśli są na jego stronie), potem kadr zakrywa kropla w kolorze salonu i od niej zaczyna się strona; dalej kropla spada własnym pasem po prawej stronie tekstu i ląduje na paznokciu na zdjęciu dłoni, gdzie gość dobiera odcień i wykończenie przed zapisem (paznokcie na zdjęciu zmieniają kolor); farba pierwszego ekranu przy przewijaniu powoli spływa; na stronie są «Наши работы» z suwakiem «До и после» oraz «Отзывы гостей»: kadry i opinie są tam przykładowe i tak podpisane, na stronie roboczej będą zdjęcia i opinie samego salonu. Centrum szkoleniowe i nieruchomości przelotu nie mają. Klientowi z innej branży bot uczciwie pisze, że makietę zrobi ręcznie nasz projektant w ciągu 12 godzin, i daje linki do naszych realizacji z jego branży (gdy ich brak — do wszystkich realizacji). Tak samo, gdy składanie się nie udało.",
          "Razem z ceną bot wysyła przycisk «📄 Коммерческое предложение» (od 11.11.2026): strona na naszym blankiecie obok makiety, pod adresem makiety z /kp. Jest na niej podstawa do wyboru (landing 500 $ zamiast 1 700 $ albo strona firmowa 1 000 $ zamiast 2 500 $), dodatki branży z cenami o 30% niższymi niż w naszych wcześniejszych makietach tej branży (od 12.11.2026; razem nie więcej niż 1 500 $, cała strona nie więcej niż 2 500 $), suma liczy się sama, i licznik: cena jest zablokowana na 48 godzin od złożenia. Modelu tam nie ma, wstawiane są tylko nazwa klienta i data. «Хочу такой сайт» kopiuje wybór, klient wkleja go w czat bota i zgłoszenie trafia do was. Oferta otwiera się tym samym hasłem co makieta: po 24 godzinach klient prosi o hasło w bocie.",
          "Pod linkiem do makiety bot daje drugi przycisk, «🛠 Админка» (od 11.11.2026): pod adresem makiety z /admin otwiera się gotowy panel naszej wcześniejszej makiety z tej samej branży, na danych klienta. Dla stomatologii i centrum medycznego to panel kliniki (zapisy, grafik lekarzy, wiadomości ze wszystkich kanałów w jednym oknie, połączenia, role), dla restauracji panel z logowaniem kodem, rezerwacjami, zamówieniami, menu i stop-listą, dla biura podróży panel ze zgłoszeniami, kalendarzem zajętych dat i turystami (z naszej makiety Sunday), dla centrum szkoleniowego panel ze zgłoszeniami, uczniami, kursami i nauczycielami (z naszej makiety FinTax), dla mebli panel sklepu z zamówieniami, zyskiem, dostawą i montażem, ratami i ruchem na stronie (z naszej makiety Greenwell), dla nieruchomości panel biura ze zgłoszeniami i transakcjami, oglądaniami, domami z piętrami, umowami, rachunkami i raportem dla właściciela (z naszej makiety Soffice). Zgłoszenia i liczby są w nim demonstracyjne, z oznaczeniem. Zapis albo rezerwacja zrobiona przez klienta na jego makiecie pojawia się w jego panelu w pierwszym wierszu: tak widzi, jak to będzie działać. Panel nie jest rysowany od nowa, nie ma tam modelu. Salon urody ma panel z naszej strony kliniki kosmetologii: w jednym oknie zbiera czat strony, Instagram Direct, WhatsApp, Telegram i VKontakte, odpowiedź idzie tym samym kanałem; obok artykuły (strona, kanał Telegram, Instagram), zarządzanie stroną (usługi, ceny, promocje, mistrzowie, teksty), połączenia, zespół i historia. Jest po rosyjsku także w makiecie uzbeckiej. Branża bez własnego panelu nie ma przycisku.",
          "Taki klient trafia do was jako lead ze źródłem «makieta ręcznie z bota», a karta zaczyna się od «🔥 Нужен макет вручную» i branży. Kto wziął leada, składa makietę i wysyła link z karty leada, «Do klienta od bota studia», zanim minie 12 godzin: klientowi już to obiecano. W nocy karta czeka do rana jak każdy lead, a klient dostaje odpowiedź od razu.",
          "Taka makieta pojawia się na tej liście sama, od razu jako wysłana klientowi, z tymi samymi zasadami: warunki, odcisk, 24 godziny przez link, potem hasło. Lead trafia do kolejki ciepłych leadów ze źródłem «makieta w bocie», w notatce jest branża, strona i link do makiety. Odpowiedzieć klientowi można z karty leada.",
          "Od 12.11.2026 proces jest otwarty dla wszystkich (właściciel: «Otwieramy dla wszystkich»). Każdy, kto pierwszy raz pisze do bota, dostaje najpierw wybór języka, a potem wiadomość «Przyślij adres strony albo Instagrama — w 2 minuty złożymy makietę» z przyciskami «Собрать макет» i «У меня другой вопрос». Zwykłe pytanie zamiast adresu i «У меня другой вопрос» trafiają do dotychczasowej rozmowy. Klient dostaje jedną makietę na konto Telegram: przy drugiej próbie bot odsyła link do już złożonej. Dziennego limitu nie ma. Pracownicy, menedżerowie też, bez ograniczeń: napisz do bota /maket i złóż makietę dla swojego klienta. Z makiety pracownika lead nie powstaje, a na tej liście ma ona oznaczenie «z bota, zebrał pracownik». Jedna osoba nie zamieni się w kilka kart «🔥 Нужен макет вручную»: powtórna prośba z tego samego konta w ciągu 7 dni nie tworzy nowej karty.",
          "Od 13.11.2026 to samo można zrobić na stronie głównej, w oknie «Собрать макет» (właściciel: «tak jak zrobiliśmy w tg… wynik dostaje od razu w tym interaktywnym oknie»). Budowanie jest to samo: te same branże, kontrole, odcisk i warunki, a okno pokazuje samą makietę, którą człowiek dostał. Taka makieta jest na tej liście oznaczona «zebrana na stronie». Bez konta Telegram limit jest inny: jedna makieta na przeglądarkę, nie więcej niż trzy z jednego adresu na dobę i osiemdziesiąt dla wszystkich dziennie; dalej proponujemy makietę ręczną. Lead przychodzi tylko wtedy, gdy człowiek sam zostawił pod makietą Telegram lub telefon: ze źródłem «makieta w bocie», w notatce jest, że zebrano ją na stronie, odpowiedź przez ten kontakt. Takie makiety nie wchodzą do liczby makiet subskrybentów bota na «Pulpicie».",
          "Od 16.11.2026 na stronie, tak jak w bocie, pracownik składa makiety bez ograniczeń (właściciel: «Na stronie pracownicy też mogą składać makietę bez ograniczeń… I przycisk ma być tylko u pracowników: złóż od nowa»). Strona rozpoznaje cię po logowaniu do panelu: po zalogowaniu otwórz panel w tej samej przeglądarce choć raz, a okno «Собрать макет» przestanie liczyć limity. Pod gotową makietą zobaczysz «Zbuduj od nowa»: okno zacznie od adresu, poprzednia makieta zostanie na tej liście. Klienci tego przycisku nie mają. Twoja makieta ma oznaczenie «zebrał pracownik», nie staje się leadem, kontakt zostawiony pod nią nie tworzy leada i nie wlicza się do dziennego limitu strony. Po «Wyloguj» w panelu strona znów traktuje cię jak odwiedzającego.",
        ],
      },
      {
        id: "shown",
        title: "«Pokazałem makietę» — prosto na liście",
        body: [
          "Przy każdej wysyłce w «Do kogo wysłano» jest przycisk **«Pokazałem makietę»**: kliknij i wybierz «na wideo» (nagrałeś wideo z makietą i je wysłałeś) albo «na żywo» (pokazałeś na spotkaniu lub rozmowie z ekranem). Zaznaczenie zapisuje się z datą i twoim imieniem, trafia do dziennika i od razu do [etapów sprzedaży](/admin/stages) oraz do normy — 2 pokazy w tygodniu.",
          "Zaznaczyć możesz pokaz dla swojego klienta; kierownik i właściciel — dla dowolnego. Przycisku nie ma, jeśli wysyłka nie jest powiązana ani z leadem, ani z kontaktem (np. makieta poszła ręcznie z prywatnego konta) — wtedy zaznacz pokaz w [karcie leada](#leads-sales-marks). Ten sam przycisk jest w «Moje makiety» na «Pulpit».",
        ],
      },
      {
        id: "owner",
        title: "Osoba odpowiedzialna i wysyłka do klienta",
        body: {
          manager: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny» i wysyłka do klienta. Osobę odpowiedzialną panel znajduje sam, po kolei: wyznaczona ręcznie («wyznaczony»), potem ten, kto zlecił makietę zadaniem («według zlecenia», zob. [zlecenie makiety](#tasks-mockup-order)), potem właściciel leada, do którego makieta poszła najpierw («według leada»), potem autor kontaktu («według kontaktu»), potem ten, kto zbudował makietę w panelu («zbudował»). Nikogo z nich nie ma — «nie wyznaczono». Makiety witryny zbudowane ręcznie nie mają «zbudował»: osoba odpowiedzialna to tam wyznaczona ręcznie, właściciel leada albo autor kontaktu, a jeśli witryny jeszcze nie wysyłano z kont roboczych — «nie wysyłano z kont roboczych». Wyznaczyć lub zmienić osobę odpowiedzialną mogą kierownik i właściciel.",
            "«wysłana klientowi 14.10 17:27» — kiedy link do makiety pierwszy raz poszedł do klienta z konta roboczego: z karty leada, odpowiedzią modelu, ręcznie w Telegramie albo znalazł go [skan](#mockups-scan) o 09:00 i 15:00. «nie wysłano klientowi» — takiej wysyłki nie ma. Linku z konta prywatnego bot nie widzi i makieta zostanie «nie wysłano»: wysyłaj z konta roboczego. Przycisk «Niewysłane» zostawia na liście tylko takie makiety. Niżej — «Do kogo wysłano»: każda wysyłka osobnym wierszem — klient (kto ma leada — link do jego karty), z którego konta roboczego i kiedy. Pierwsze trzy widać od razu, resztę pod «jeszcze N». «konto nie zapisane» — wczesne wysyłki, gdy konto jeszcze nie było zapamiętywane. Wyszukiwarka znajduje makietę także po kliencie.",
          ],
          head: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny» i wysyłka do klienta. Osobę odpowiedzialną panel znajduje sam, po kolei: wyznaczona ręcznie («wyznaczony»), potem ten, kto zlecił makietę zadaniem («według zlecenia», zob. [zlecenie makiety](#tasks-mockup-order)), potem właściciel leada, do którego makieta poszła najpierw («według leada»), potem autor kontaktu («według kontaktu»), potem ten, kto zbudował makietę w panelu («zbudował»). Nikogo z nich nie ma — «nie wyznaczono». Makiety witryny zbudowane ręcznie nie mają «zbudował»: osoba odpowiedzialna to tam wyznaczona ręcznie, właściciel leada albo autor kontaktu, a jeśli witryny jeszcze nie wysyłano z kont roboczych — «nie wysyłano z kont roboczych».",
            "Zmienić osobę odpowiedzialną możesz ty i właściciel: w wierszu «Odpowiedzialny» wybierz osobę z listy. Pierwsza pozycja listy to osoba znaleziona przez panel (na przykład «Арсений (według leada)») albo «nie wyznaczono»: wybierz ją, żeby zdjąć wyznaczenie. Każde wyznaczenie trafia do dziennika. Do osoby odpowiedzialnej bot pisze, gdy makieta [zamknęła się na hasło po 24 godzinach](#mockups-auto-close). Menedżer widzi osobę odpowiedzialną, ale jej nie zmienia.",
            "«wysłana klientowi 14.10 17:27» — kiedy link do makiety pierwszy raz poszedł do klienta z konta roboczego: z karty leada, odpowiedzią modelu, ręcznie w Telegramie albo znalazł go [skan](#mockups-scan) o 09:00 i 15:00. «nie wysłano klientowi» — takiej wysyłki nie ma. Linku z konta prywatnego bot nie widzi i makieta zostanie «nie wysłano»: wysyłaj z konta roboczego. Przycisk «Niewysłane» zostawia na liście tylko takie makiety. Niżej — «Do kogo wysłano»: każda wysyłka osobnym wierszem — klient (kto ma leada — link do jego karty), z którego konta roboczego i kiedy. Pierwsze trzy widać od razu, resztę pod «jeszcze N». «konto nie zapisane» — wczesne wysyłki, gdy konto jeszcze nie było zapamiętywane. Wyszukiwarka znajduje makietę także po kliencie.",
          ],
          admin: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny» i wysyłka do klienta. Osobę odpowiedzialną panel znajduje sam, po kolei: wyznaczona ręcznie («wyznaczony»), potem ten, kto zlecił makietę zadaniem («według zlecenia», zob. [zlecenie makiety](#tasks-mockup-order)), potem właściciel leada, do którego makieta poszła najpierw («według leada»), potem autor kontaktu («według kontaktu»), potem ten, kto zbudował makietę w panelu («zbudował»). Nikogo z nich nie ma — «nie wyznaczono». Makiety witryny zbudowane ręcznie nie mają «zbudował»: osoba odpowiedzialna to tam wyznaczona ręcznie, właściciel leada albo autor kontaktu, a jeśli witryny jeszcze nie wysyłano z kont roboczych — «nie wysyłano z kont roboczych».",
            "Zmienić osobę odpowiedzialną możesz ty i kierownik: w wierszu «Odpowiedzialny» wybierz osobę z listy. Pierwsza pozycja listy to osoba znaleziona przez panel (na przykład «Арсений (według leada)») albo «nie wyznaczono»: wybierz ją, żeby zdjąć wyznaczenie. Każde wyznaczenie trafia do dziennika. Do osoby odpowiedzialnej bot pisze, gdy makieta [zamknęła się na hasło po 24 godzinach](#mockups-auto-close). Menedżer widzi osobę odpowiedzialną, ale jej nie zmienia.",
            "«wysłana klientowi 14.10 17:27» — kiedy link do makiety pierwszy raz poszedł do klienta z konta roboczego: z karty leada, odpowiedzią modelu, ręcznie w Telegramie albo znalazł go [skan](#mockups-scan) o 09:00 i 15:00. «nie wysłano klientowi» — takiej wysyłki nie ma. Linku z konta prywatnego bot nie widzi i makieta zostanie «nie wysłano»: wysyłaj z konta roboczego. Przycisk «Niewysłane» zostawia na liście tylko takie makiety. Niżej — «Do kogo wysłano»: każda wysyłka osobnym wierszem — klient (kto ma leada — link do jego karty), z którego konta roboczego i kiedy. Pierwsze trzy widać od razu, resztę pod «jeszcze N». «konto nie zapisane» — wczesne wysyłki, gdy konto jeszcze nie było zapamiętywane. Wyszukiwarka znajduje makietę także po kliencie.",
          ],
        },
      },
      {
        id: "password",
        title: "Hasło na dobę",
        body: [
          "**«Wygeneruj hasło»** daje nowe hasło z pięciu cyfr. Działa 24 godziny, potem przestaje. Dostęp klienta kończy się razem z hasłem: kto już je wpisał, po dobie też zobaczy pole na hasło.",
          "Każde kliknięcie daje nowe hasło. Wydane wcześniej nie są anulowane i działają do swojej godziny, dlatego każdemu klientowi lepiej dać jego własne. «hasło klienta do …» w wierszu pokazuje, do której godziny działa ostatnie wydane.",
          "Hasło pokazuje się tylko raz, zaraz po kliknięciu. U nas zapisany jest tylko jego odcisk, hasła nie da się potem odczytać. Zgubione? Wygeneruj nowe.",
          "**«Kopiuj dla klienta»** kopiuje gotowy tekst w języku makiety: link, hasło, do której godziny czasu Taszkentu działa i link do warunków korzystania z makiety. Można go od razu wysłać klientowi. **«Kopiuj hasło»** kopiuje tylko pięć cyfr.",
          "Makietę, którą strona studia pokazuje w realizacjach bez hasła (teraz to SamAuto), hasło zamyka tylko pod bezpośrednim linkiem, tym, który poszedł do klienta. Gość strony, który kliknął «Otwórz prototyp» na stronie realizacji albo pod filmem na stronie głównej, widzi makietę bez hasła, nawet jeśli hasło już wydano: realizacja pokazuje naszą pracę wszystkim. Takie otwarcia nie trafiają do dziennika wyświetleń i nie przychodzi wiersz «klient otworzył makietę»: to gość strony, a nie klient.",
        ],
      },
      {
        id: "offer",
        title: "Promocja 48 godzin po makiecie",
        body: {
          manager: [
            "Gdy tylko link do makiety trafia do klienta z konta roboczego — z karty leada, odpowiedzią modelu albo ręcznie w Telegramie — klient ma **48 godzin warunków specjalnych**: landing page według tej makiety z pełną funkcjonalnością i 3 dodatkami do wyboru — 500 $ zamiast 1 700 $, pełna strona firmowa — 1 000 $ zamiast 2 500 $. 3 minuty po makiecie bot sam pisze klientowi warunki i termin z tego samego konta. Ten sam link wysłany ponownie nie przedłuża terminu.",
            "**Przykład cudzego projektu to nie makieta klienta** i promocji nie ma (od 25.10.2026). Gdy w przykładzie wysłano witrynę lub prototyp innej firmy (Comfort Mebel stolarni), bot nie pisze warunków ani nie przypomina: „landing według tej makiety” przy cudzej makiecie tylko myli klienta. Własną makietę bot rozpoznaje po kontakcie, stronie i nazwie firmy: zbudowana pod ten kontakt, ta sama strona albo jedna nazwa zawiera drugą („Karomat” i „Karomat oilaviy restorani”). Link wysłany na @nick bez kontaktu — nie ma z czym porównać, więc promocja startuje jak dawniej.",
            "Niektóre makiety mają **własną cenę promocji** — tę, która jest napisana na samej makiecie (na przykład strona i aplikacja — 1 000 $ zamiast 4 800 $). Wtedy bot pisze klientowi w warunkach i przypomnieniach tylko ją, bez ogólnych cen landing page i strony firmowej, a na liście «Makiety» przy takiej makiecie widać «promocja 48 godz.: … $ zamiast … $». Własną cenę ustawia ten, kto składał makietę; jeśli jej nie ma, obowiązują ogólne ceny powyżej.",
            "Potem bot sam przypomina klientowi: codziennie o 13:00 czasu Taszkentu — ile zostało, i jeszcze raz 2 godziny przed końcem (jeśli to noc — poprzedniego wieczoru o 21:00). W nocy do klienta nie pisze. Termin minął — promocja przestaje obowiązywać, ceny są standardowe; tak mówcie klientowi. Klient odmówił albo lead jest przegrany — przypomnienia się kończą.",
            "Link z prywatnego konta się nie liczy: bot go nie widzi. Wysyłajcie makietę z konta roboczego — inaczej klient nie dostanie ani warunków, ani przypomnień.",
          ],
          head: [
            "Gdy tylko link do makiety trafia do klienta z konta roboczego — z karty leada, odpowiedzią modelu albo ręcznie w Telegramie — klient ma **48 godzin warunków specjalnych**: landing page według tej makiety z pełną funkcjonalnością i 3 dodatkami do wyboru — 500 $ zamiast 1 700 $, pełna strona firmowa — 1 000 $ zamiast 2 500 $. 3 minuty po makiecie bot sam pisze klientowi warunki i termin z tego samego konta. Ten sam link wysłany ponownie nie przedłuża terminu.",
            "**Przykład cudzego projektu to nie makieta klienta** i promocji nie ma (od 25.10.2026). Gdy w przykładzie wysłano witrynę lub prototyp innej firmy (Comfort Mebel stolarni), bot nie pisze warunków ani nie przypomina: „landing według tej makiety” przy cudzej makiecie tylko myli klienta. Własną makietę bot rozpoznaje po kontakcie, stronie i nazwie firmy: zbudowana pod ten kontakt, ta sama strona albo jedna nazwa zawiera drugą („Karomat” i „Karomat oilaviy restorani”). Link wysłany na @nick bez kontaktu — nie ma z czym porównać, więc promocja startuje jak dawniej.",
            "Niektóre makiety mają **własną cenę promocji** — tę, która jest napisana na samej makiecie (na przykład strona i aplikacja — 1 000 $ zamiast 4 800 $). Wtedy bot pisze klientowi w warunkach i przypomnieniach tylko ją, bez ogólnych cen landing page i strony firmowej, a na liście «Makiety» przy takiej makiecie widać «promocja 48 godz.: … $ zamiast … $». Własną cenę ustawia ten, kto składał makietę; jeśli jej nie ma, obowiązują ogólne ceny powyżej.",
            "Tobie i właścicielowi bot przysyła kartę makiety, gdy tylko do klienta poszły warunki, linijkę, gdy promocja się skończyła, i o 13:00 — listę «🎨 Макеты клиентов», jeśli u kogokolwiek promocja trwa. Ta sama lista — komendą «Макеты клиентов» albo /mockups w bocie: do kogo poszła makieta, ile zostało z promocji, link do leada. Klient spoza kontaktów (nie ma do niego kontaktu) jest na liście, ale bot nie pisze mu przypomnień.",
            "Pod każdą makietą są dwa przyciski. **«🔒 Закрыть паролем»** — hasło na dobę, jak «Wygeneruj hasło» tutaj: pierwsze hasło zamyka otwartą makietę, bot przysyła gotowy tekst dla klienta. **«✅ Утверждён → Егору»** — klient zatwierdził makietę: przypomnienia do niego się kończą, Egor dostaje zadanie «Сайт по макету» z linkami do makiety i leada oraz informacją, czy makietę zatwierdzono w terminie promocji.",
            "Przypomnienia pisze tani model, a ceny, termin i to, ile zostało, wstawia i sprawdza kod: w wiadomości nie będzie obcych liczb, linków ani obietnic przedłużenia promocji. Nie przeszło kontroli — idzie gotowy tekst. Same warunki zawsze idą gotowym tekstem.",
          ],
          admin: [
            "Gdy tylko link do makiety trafia do klienta z konta roboczego — z karty leada, odpowiedzią modelu albo ręcznie w Telegramie — klient ma **48 godzin warunków specjalnych**: landing page według tej makiety z pełną funkcjonalnością i 3 dodatkami do wyboru — 500 $ zamiast 1 700 $, pełna strona firmowa — 1 000 $ zamiast 2 500 $. 3 minuty po makiecie bot sam pisze klientowi warunki i termin z tego samego konta. Ten sam link wysłany ponownie nie przedłuża terminu.",
            "**Przykład cudzego projektu to nie makieta klienta** i promocji nie ma (od 25.10.2026). Gdy w przykładzie wysłano witrynę lub prototyp innej firmy (Comfort Mebel stolarni), bot nie pisze warunków ani nie przypomina: „landing według tej makiety” przy cudzej makiecie tylko myli klienta. Własną makietę bot rozpoznaje po kontakcie, stronie i nazwie firmy: zbudowana pod ten kontakt, ta sama strona albo jedna nazwa zawiera drugą („Karomat” i „Karomat oilaviy restorani”). Link wysłany na @nick bez kontaktu — nie ma z czym porównać, więc promocja startuje jak dawniej.",
            "Niektóre makiety mają **własną cenę promocji** — tę, która jest napisana na samej makiecie (na przykład strona i aplikacja — 1 000 $ zamiast 4 800 $). Wtedy bot pisze klientowi w warunkach i przypomnieniach tylko ją, bez ogólnych cen landing page i strony firmowej, a na liście «Makiety» przy takiej makiecie widać «promocja 48 godz.: … $ zamiast … $». Własną cenę ustawia ten, kto składał makietę; jeśli jej nie ma, obowiązują ogólne ceny powyżej.",
            "Tobie i kierownikowi bot przysyła kartę makiety, gdy tylko do klienta poszły warunki, linijkę, gdy promocja się skończyła, i o 13:00 — listę «🎨 Макеты клиентов», jeśli u kogokolwiek promocja trwa. Ta sama lista — komendą «Макеты клиентов» albo /mockups w bocie: do kogo poszła makieta, ile zostało z promocji, link do leada. Klient spoza kontaktów (nie ma do niego kontaktu) jest na liście, ale bot nie pisze mu przypomnień.",
            "Pod każdą makietą są dwa przyciski. **«🔒 Закрыть паролем»** — hasło na dobę, jak «Wygeneruj hasło» tutaj: pierwsze hasło zamyka otwartą makietę, bot przysyła gotowy tekst dla klienta. **«✅ Утверждён → Егору»** — klient zatwierdził makietę: przypomnienia do niego się kończą, Egor dostaje zadanie «Сайт по макету» z linkami do makiety i leada oraz informacją, czy makietę zatwierdzono w terminie promocji.",
            "Przypomnienia pisze tani model, a ceny, termin i to, ile zostało, wstawia i sprawdza kod: w wiadomości nie będzie obcych liczb, linków ani obietnic przedłużenia promocji. Nie przeszło kontroli — idzie gotowy tekst. Same warunki zawsze idą gotowym tekstem.",
          ],
        },
      },
      {
        id: "scan",
        title: "Skan makiet: co poszło bokiem",
        body: {
          manager: [
            "Dwa razy dziennie, o 09:00 i 15:00 czasu Taszkentu, bot sam szuka naszych linków do makiet (devuz.studio/proto/… i cases.devuz.studio/…) w korespondencji z 14 dni: w wychodzących kontaktach, w korespondencji leadów w panelu i w dialogach każdego roboczego konta Telegram. Wszystko, co poszło do klienta, ale nie trafiło na listę (skaut się restartował, link wklejono ręcznie), dopisuje sam. Model w tym nie uczestniczy, tylko reguły.",
            "Bot nie pisze do klienta wstecz: wysłane ponad 48 godzin temu — promocja u klienta już się skończyła, wiersz po prostu zostaje w historii; wysłane w ciągu 48 godzin, ale ponad 3 godziny temu — promocja trwa, ale klient nie dostanie ani warunków, ani przypomnień: w razie potrzeby powiedzcie mu sami. Świeże (do 3 godzin) — jak zwykle, z warunkami po 3 minutach. Linku z prywatnego konta bot nie widzi także po skanie.",
          ],
          head: [
            "Dwa razy dziennie, o 09:00 i 15:00 czasu Taszkentu, bot sam szuka naszych linków do makiet (devuz.studio/proto/… i cases.devuz.studio/…) w korespondencji z 14 dni: w wychodzących kontaktach, w korespondencji leadów w panelu i w dialogach każdego roboczego konta Telegram. Wszystko, co poszło do klienta, ale nie trafiło na listę (skaut się restartował, link wklejono ręcznie), dopisuje sam. Model w tym nie uczestniczy, tylko reguły. Konto ograniczone przez Telegram skan pomija; dialogi czyta po jednym, z przerwami.",
            "Bot nie pisze do klienta wstecz: wysłane ponad 48 godzin temu — promocja u klienta już się skończyła, wiersz po prostu zostaje w historii; wysłane w ciągu 48 godzin, ale ponad 3 godziny temu — promocja trwa, ale klient nie dostanie ani warunków, ani przypomnień, a do Ciebie przychodzi karta «🔎 Макет найден сканом»; świeże (do 3 godzin) — jak zwykle, z warunkami po 3 minutach. Ten sam link do tego samego klienta nie zapisuje się drugi raz i nie przedłuża terminu.",
            "Jeśli skan coś znalazł, Ty i właściciel dostajecie jedną linijkę «🔎 Скан макетов» z listą znalezionych; nic nie znalazł — bot milczy. W «Макеты клиентов» takie makiety mają znak «🔎 найдено сканом», na [Stronie głównej](/admin/hq) — wiersz «znalezione skanem w 7 dni» w karcie makiet i «Skan znalazł makietę» w aktualnościach.",
          ],
          admin: [
            "Dwa razy dziennie, o 09:00 i 15:00 czasu Taszkentu, bot sam szuka naszych linków do makiet (devuz.studio/proto/… i cases.devuz.studio/…) w korespondencji z 14 dni: w wychodzących kontaktach, w korespondencji leadów w panelu i w dialogach każdego roboczego konta Telegram. Wszystko, co poszło do klienta, ale nie trafiło na listę (skaut się restartował, link wklejono ręcznie), dopisuje sam. Model w tym nie uczestniczy, tylko reguły. Konto ograniczone przez Telegram skan pomija; dialogi czyta po jednym, z przerwami.",
            "Bot nie pisze do klienta wstecz: wysłane ponad 48 godzin temu — promocja u klienta już się skończyła, wiersz po prostu zostaje w historii; wysłane w ciągu 48 godzin, ale ponad 3 godziny temu — promocja trwa, ale klient nie dostanie ani warunków, ani przypomnień, a do Ciebie przychodzi karta «🔎 Макет найден сканом»; świeże (do 3 godzin) — jak zwykle, z warunkami po 3 minutach. Ten sam link do tego samego klienta nie zapisuje się drugi raz i nie przedłuża terminu.",
            "Jeśli skan coś znalazł, Ty i kierownik dostajecie jedną linijkę «🔎 Скан макетов» z listą znalezionych; nic nie znalazł — bot milczy. W «Макеты клиентов» takie makiety mają znak «🔎 найдено сканом», na [Stronie głównej](/admin/hq) — wiersz «znalezione skanem w 7 dni» w karcie makiet i «Skan znalazł makietę» w aktualnościach.",
          ],
        },
      },
      {
        id: "closed",
        title: "«otwarta przez link» i «na hasło»",
        body: {
          manager: [
            "«otwarta przez link» oznacza, że makietę otworzy każdy, kto ma link. Z pierwszym hasłem się zamyka: panel dopyta, a potem link bez hasła pokazuje tylko pole na hasło. Dotyczy to także tych, którym link wysłano wcześniej: oni też będą potrzebować hasła.",
            "«na hasło» oznacza, że makieta jest już zamknięta. Jeśli na makiecie jest stałe hasło właściciela, działa jak dotąd, razem z hasłami na dobę. Ponownie otworzyć makietę przez link bez hasła z panelu się nie da: jeśli to potrzebne, powiedz właścicielowi.",
          ],
          head: [
            "«otwarta przez link» oznacza, że makietę otworzy każdy, kto ma link. Z pierwszym hasłem się zamyka: panel dopyta, a potem link bez hasła pokazuje tylko pole na hasło. Dotyczy to także tych, którym link wysłano wcześniej: oni też będą potrzebować hasła.",
            "«na hasło» oznacza, że makieta jest już zamknięta. Jeśli na makiecie jest stałe hasło właściciela, działa jak dotąd, razem z hasłami na dobę. Ponownie otworzyć makietę przez link bez hasła z panelu się nie da: jeśli to potrzebne, powiedz właścicielowi.",
          ],
          admin: [
            "«otwarta przez link» oznacza, że makietę otworzy każdy, kto ma link. Z pierwszym hasłem się zamyka: panel dopyta, a potem link bez hasła pokazuje tylko pole na hasło. Dotyczy to także tych, którym link wysłano wcześniej: oni też będą potrzebować hasła.",
            "«na hasło» oznacza, że makieta jest już zamknięta. Twoje stałe hasło na makiecie działa jak dotąd, razem z hasłami na dobę. Przycisku, który znowu otwiera makietę przez link bez hasła, nie ma: robi się to w bazie, w prototypie czyści się pole `closed_at`.",
          ],
        },
      },
      {
        id: "auto-close",
        title: "24 godziny przez link, potem na hasło",
        body: [
          "Każda nasza makieta jest otwarta przez link 24 godziny, potem zamyka się sama — tak, jakby wydano pierwsze hasło. Czas liczy się od chwili, gdy link do makiety pierwszy raz poszedł do klienta z konta roboczego; jeśli o wysłaniu nic nie wiadomo — od pierwszego otwarcia nie przez nas (nasze otwarcia z panelu się nie liczą); jeśli makiety jeszcze nikt nie otwierał — od minuty, gdy pojawiła się na liście. To reguła, nie model: liczy ją kod co pięć minut.",
          "W wierszu makiety widać, co się z nią dzieje: «otwarta jeszcze 5 godz., potem na hasło» — tyle zostało; «zamknięta na hasło od 14.10 15:00: minęły 24 godziny» — zamknęła reguła; «zamknięta na hasło od …» — zamknęło pierwsze wydane hasło. Już zamkniętej makiety reguła nie rusza. Jeśli na makiecie jest stałe hasło właściciela z własną godziną włączenia, makieta zamyka się o tej godzinie, a nie po 24 godzinach. Makiety, którą właściciel kazał trzymać otwartą bez hasła (jak SamAuto), reguła nie zamyka: nie ma przy niej napisu «otwarta jeszcze … godz.». Hasło przyciskiem można na nią wydać jak na każdą.",
          "Gdy makieta się zamknęła, [osobie odpowiedzialnej](#mockups-owner) (wyznaczonej ręcznie, inaczej właścicielowi leada albo autorowi kontaktu) bot pisze: «🔒 Макет … закрылся паролем: прошло 24 часа. Нужен клиенту — нажмите „Сгенерировать пароль“» — z przyciskiem «🔑 Сгенерировать пароль», który od razu wydaje hasło na dobę i gotowy tekst dla klienta. Nie znamy osoby odpowiedzialnej — linijka idzie do właściciela i kierownika. Projektów witryny cases.devuz.studio reguła nie zamyka: to nasze prace dla strony studia.",
        ],
      },
      {
        id: "open",
        title: "Otworzyć samemu",
        body: [
          "**«Otwórz»** otwiera makietę w nowej karcie. Prototyp z devuz.studio otwiera się bez hasła, nawet zamknięty: panel sam daje ci dostęp na 12 godzin. Takie otwarcie nie liczy się jako otwarcie klienta i bot nie napisze, że klient otworzył prototyp.",
          "Projekt witryny otwiera się na samej witrynie. Zamknięty poprosi o kod: zadziała hasło na dobę wygenerowane tutaj.",
          "**«Kopiuj link»** kopiuje link do makiety bez hasła. Jeśli makieta jest zamknięta, wysyłaj klientowi tekst z «Kopiuj dla klienta»: jest w nim też hasło.",
        ],
      },
    ],
  },

  /* ── Кандидаты ────────────────────────────────────────────────────── */
  "/admin/candidates": {
    what: "Analiza CV przed rozmową kwalifikacyjną. Wgrywasz PDF i piszesz, na jakie stanowisko patrzymy — panel pokazuje werdykt, mocne strony, przeszkody i pytania, które warto zadać. Widzą to tylko kierownicy i właściciel: w analizach są cudze dane osobowe i decyzja o człowieku.",
    items: [
      {
        id: "upload",
        title: "Wgraj CV",
        body: [
          "Pole «Na jakie stanowisko patrzymy» — wpisz stanowisko (domyślnie menedżer sprzedaży). Potem «CV w PDF» i **«Analizuj»**. Analiza trwa do minuty.",
          "Potrzebny jest PDF, z którego da się skopiować tekst, do 8 MB; czytanych jest pierwszych 12 stron. Skan ani obrazki nie zostaną odczytane — panel to powie.",
        ],
      },
      {
        id: "result",
        title: "Co jest w analizie",
        body: [
          "Werdykt: «zatrudnić», «zatrudnić warunkowo» albo «nie zatrudniać» — i dlaczego. Dalej: «Mocne strony», «Przeszkody», «Co CV mówi wprost», «Zapytaj na rozmowie» (pytanie do każdej przeszkody) i «Jak sprawdzić w praktyce» — zadanie na jeden płatny dzień próbny.",
          "Analiza to przygotowanie do rozmowy, a nie wyrok. Decyzja należy do Ciebie.",
        ],
      },
      {
        id: "privacy",
        title: "Dane osobowe",
        body: [
          "Plik nigdzie nie jest zapisywany — zostają tylko imię, stanowisko, werdykt i sama analiza. Przycisk «Usuń analizę» usuwa ją na zawsze.",
          "Wiek, płeć, stan cywilny, narodowość, religia, wygląd i miejsce urodzenia nie biorą udziału w ocenie. Jeśli analiza mimo to się na nich oparła, nie zostanie zapisana: «Analiza oparła się na czymś, co nie dotyczy pracy… spróbuj jeszcze raz».",
          "Każda analiza i każde usunięcie trafiają do dziennika.",
        ],
      },
    ],
  },

  /* ── Проекты ──────────────────────────────────────────────────────── */
  "/admin/projects": {
    what: "Projekt to praca, którą już uzgodniliśmy z klientem. Dopóki nie ma projektu z kwotą, nikt nie dostanie pieniędzy za transakcję.",
    items: [
      {
        id: "tasks",
        title: "Zadania w projekcie",
        body: [
          "W karcie projektu jest blok «Zadania w projekcie». Są w nim wszystkie zadania projektu: kto zlecił, komu i na kiedy. Więcej o zadaniach w punkcie [zadania](#tasks-board).",
          "Przycisk **«Zleć zadanie»** po prawej otworzy formularz z już wybranym projektem.",
        ],
      },
      {
        id: "create",
        title: "Załóż projekt",
        body: {
          manager: [
            "Klient zgodził się na współpracę? Załóż projekt. W bloku «Nowy projekt» wpisz nazwę, klienta, kwotę i termin, a potem kliknij «Utwórz».",
            "Projekt prowadzi ten, kto go założył, i to on dostaje pieniądze za transakcję. Osobę prowadzącą może zmienić tylko właściciel. Dlatego zakładaj swój projekt sam.",
            "Termin minął? Na liście pojawi się oznaczenie «po terminie». Przycisk «pokaż zamknięte» pokaże zakończone i anulowane projekty.",
          ],
          head: [
            "Projekt prowadzi ten, kto go założył, i to on dostaje pieniądze za transakcję. Ty dostajesz 5% od projektów swojego zespołu.",
            "Pilnuj, żeby menedżerowie zakładali swoje projekty sami. Osobę prowadzącą może zmienić tylko właściciel.",
          ],
          admin: [
            "Pracownik, który zakłada projekt, sam zostaje osobą prowadzącą. Gdy zakładasz Ty, wybierz, kto prowadzi: to on dostanie pieniądze za transakcję.",
            "Wybierzesz siebie i zespół nic z projektu nie dostanie. Osobę prowadzącą zmienisz w bloku [«Dane projektu»](#projects-data), w polu «Prowadzi».",
          ],
        },
      },
      {
        id: "stages",
        title: "Etapy",
        body: [
          "Etapy po kolei: «brief», «umowa», «design», «programowanie», «odbiór», «uruchomienie», «wsparcie». Są jeszcze «wstrzymany», «zamknięty» i «anulowany».",
          "Etap zmienia tylko właściciel, bo to obietnica dla klienta. Każda zmiana trafia do dziennika.",
          "Na pieniądze wpływa tylko «anulowany»: z takiego projektu nikt nic nie dostanie.",
        ],
      },
      {
        id: "card",
        title: "Karta projektu",
        body: {
          manager: [
            "W bloku «Kosztorys» wybierz kategorię i termin w tygodniach. Panel policzy próg, poniżej którego projekt się nie zwraca. Zejść niżej może tylko właściciel.",
            "W bloku «Pieniądze» wybierz «Rodzaj transakcji»: «nowy klient» albo «dosprzedaż». Od tego zależy Twój procent. «Kwota z umowy, $» wpisuj w pełnych dolarach. Po pierwszej płatności kwotę zmienia tylko właściciel.",
            "Podatek, koszt wytworzenia i płatności klienta wpisuje właściciel. Dopóki klient nie zapłaci całości, Twoje pieniądze z projektu są zamrożone.",
            "W bloku «Umowa» widać numer, status i kwotę umowy. Dopóki umowy nie ma, jest tam formularz do jej przygotowania. Więcej w sekcji [«Umowy»](/admin/contracts).",
          ],
          head: [
            "Widzisz kartę każdego projektu, a pieniądze tylko w swoich projektach i projektach zespołu.",
            "Kosztorys i kwotę edytują osoba prowadząca i właściciel. W projektach zespołu tylko je widzisz.",
            "W naliczeniach jest Twój wiersz «kierownik», 5% od projektu zespołu. U współzałożyciela wynosi zero: i tak dostaje udział w całym zysku.",
          ],
          admin: [
            "Edytujesz wszystko w dowolnym momencie. Tylko Ty wpisujesz «Podatek, %» i «Koszt wytworzenia, $». Dzięki temu nikt nie podniesie sobie naliczenia.",
            "Przy wierszu naliczenia «ustaw» zmienia procent dla tej transakcji, a «według poziomu» przywraca stawkę z poziomu pracownika. W bloku «Partner» wybierz, kto polecił klienta.",
            "Płatność klienta zapisuj przyciskiem «Zapisz płatność». Płatność za fakturę z umowy zapisze się sama po Twoim potwierdzeniu.",
            "Dokładny udział właściciela, już bez udziału partnera, widać w sekcji [«Finanse»](/admin/finance).",
          ],
        },
      },
      {
        id: "data",
        title: "«Dane projektu»",
        body: [
          "Nazwę, klienta, termin i notatki edytują osoba prowadząca, jej kierownik i właściciel.",
          "Osobę prowadzącą zmienia tylko właściciel, w polu «Prowadzi». Kwotę edytuje się w bloku «Pieniądze».",
        ],
      },
    ],
  },

  /* ── Статистика ───────────────────────────────────────────────────── */
  "/admin/stats": {
    what: "Liczby dla całego studia: ile zgłoszeń przychodzi, skąd, jakiej jakości, ile wygrywamy i jak szybko bierzemy leady do pracy. Przydaje się, żeby raz w tygodniu zobaczyć, gdzie tracimy klientów.",
    items: [
      {
        id: "tiles",
        title: "Najważniejsze liczby",
        body: [
          "**«leadów łącznie»**, **«przyjęte do pracy»** — ile leadów ma teraz osobę prowadzącą.",
          "**«odsetek wygranych»** — wygrane ÷ (wygrane + przegrane). Liczony od zamkniętych transakcji: to, co jest jeszcze w toku, nie jest przegrane. Dlatego ważne jest, żeby ustawiać status «przegrane», a nie porzucać leada.",
          "**«mediana do przejęcia»** — ile zwykle mija od zgłoszenia do «Przejmij». Mediana, a nie średnia: jeden lead, który przeleżał weekend, nie psuje obrazu. Przekazanie leada zeruje ten czas.",
        ],
      },
      {
        id: "panels",
        title: "Panele poniżej",
        body: [
          "«Napływ w tygodniach» — 12 tygodni, tydzień od poniedziałku. «Jakość leadów» — według liter A–D. «Statusy». «Skąd przychodzą» — czat, formularz, bot, witryna, skaut, kontakty. «Język zgłoszenia». «O co pytają» — jeden lead może być w kilku wierszach. «Rabat 30%» — ile zgłoszeń dostało rabat i za co: «pierwsza minuta» — klient napisał do asystenta, gdy na stronie leciał licznik pierwszej minuty; «gwarancja 20 sekund» — nie zdążyliśmy z odpowiedzią. Każdy taki rabat to 30% rachunku.",
        ],
      },
      {
        id: "people",
        title: "Tabela według osób",
        body: {
          manager: [
            "Tabeli według osób nie widzisz — widzą ją kierownik i właściciel. Publiczny ranking obok nazwiska kolegi zmienia zachowanie szybciej niż wynik: leady zaczyna się brać według łatwości, a nie ważności. Swoje liczby sprawdzaj na «Pulpit»: «Moja praca», «Moje etapy w tym tygodniu» i [«Plan i wykonanie»](#hq-week).",
          ],
          head: [
            "«Mój zespół» — Ty i Twoi menedżerowie: «W toku», «Wygrane», «Przegrane», «Łącznie» — za cały czas, według tego, kto teraz prowadzi leada. Menedżerowie tej tabeli nie widzą.",
          ],
          admin: [
            "«Według menedżerów» — wszyscy aktywni pracownicy, za cały czas, według tego, kto teraz prowadzi leada. Kierownik widzi tylko siebie i swój zespół, menedżerowie w ogóle nie widzą tabeli.",
          ],
        },
      },
      {
        id: "plans",
        title: "Gdzie są plany",
        body: {
          manager: [
            "Planów tu nie ma. «Plan i wykonanie» jest na dole [«Pulpit»](/admin/hq), plan kontaktów — w [Zimnych kontaktach](/admin/prospect).",
          ],
          head: [
            "Planów tu nie ma. «Plan i wykonanie» jest na dole [«Pulpit»](/admin/hq), plan kontaktów dla zespołu ustawia się w [Zespole](/admin/team).",
          ],
          admin: [
            "Planów tu nie ma. «Plan i wykonanie» jest na dole [«Pulpit»](/admin/hq), plan kontaktów — w [Zespole](/admin/team).",
          ],
        },
      },
    ],
  },

  /* ── Трафик ───────────────────────────────────────────────────────── */
  "/admin/stages": {
    what: "Lista firm i leadów według etapów sprzedaży: do kogo napisaliśmy, kto odpowiedział, wykazał zainteresowanie, dostał makietę, widział prezentację, usłyszał cenę i zapłacił. Tu widać, gdzie dokładnie utyka sprzedaż i kogo trzeba popchnąć dalej. Wcześniej lista otwierała się tylko z liczby na «Pulpit», teraz to punkt w «Raporty». Liczy kod z bazy, bez sieci neuronowej.",
    items: [
      {
        id: "list",
        title: "Lista etapu: jak czytać",
        body: {
          manager: [
            "Na górze — etapy: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność» — i okres: 7 lub 30 dni. Kliknij etap — niżej pojawią się firmy i leady, które do niego doszły w tym okresie: czyje, kiedy doszły i czy doszły do następnego etapu (na zielono — doszły).",
            "Widzisz tylko swoje firmy i leady: te, które prowadzisz, i te, gdzie prezentację lub cenę zaznaczyłeś ty. Kliknij wiersz — otworzy się karta leada lub kontaktu. Te same liczby za tydzień — w bloku [«Moje etapy w tym tygodniu»](#hq-my-stages) na «Pulpit».",
          ],
          head: [
            "Na górze — etapy: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność» — i okres: 7 lub 30 dni. Kliknij etap — niżej pojawią się firmy i leady, które do niego doszły w tym okresie: czyje, kiedy doszły i czy doszły do następnego etapu (na zielono — doszły).",
            "Widzisz transakcje całego zespołu, w każdym wierszu — czyj to lead. Te same liczby za 7 i 30 dni — w bloku [«Etapy sprzedaży»](#hq-stages) na «Pulpit». Pieniędzy tu nie ma nikt: sumy wpływów widzi tylko właściciel na «Pulpit».",
          ],
          admin: [
            "Na górze — etapy: «napisaliśmy», «odpisali», «zainteresowanie», «makieta wysłana», «makieta pokazana», «cena podana», «płatność» — i okres: 7 lub 30 dni. Kliknij etap — niżej pojawią się firmy i leady, które do niego doszły w tym okresie: czyje, kiedy doszły i czy doszły do następnego etapu (na zielono — doszły).",
            "Widzisz transakcje całego zespołu, w każdym wierszu — czyj to lead. Te same liczby za 7 i 30 dni — w bloku [«Etapy sprzedaży»](#hq-stages) na «Pulpit». Na liście nie ma pieniędzy: sumy transakcji — w tym samym bloku, tylko u ciebie.",
          ],
        },
      },
      {
        id: "marks",
        title: "Dlaczego etap jest pusty",
        body: [
          "«Makieta pokazana» i «cena podana» baza sama nie widzi: prezentację przez wideo lub na żywo zaznacza człowiek przyciskiem «Pokazałem makietę» — w [«Makiety»](/admin/mockups), w «Moje makiety» na «Pulpit» albo w [karcie leada](#leads-sales-marks). Bez zaznaczenia etap zostanie zerem, a wszystko po nim wyda się gorsze, niż jest.",
          "Jeśli wierszy jest ponad 200 — pokazujemy pierwsze 200 i linię «jeszcze N»: zawęź okres do 7 dni. Firmy, które przyszły same (zgłoszenie ze strony, czatu lub bota), nie wchodzą do «napisaliśmy» — od razu są «odpisali».",
        ],
      },
    ],
  },

  "/admin/traffic": {
    what: "Ile osób wchodzi na stronę devuz.studio, skąd przychodzą i od której strony zaczynają — według Yandex Metryki i Google Analytics. Przydaje się, żeby widzieć, czy działają reklama i publikacje: leady przychodzą ze strony, a jeśli ludzie przestali na nią wchodzić, leadów będzie mniej za tydzień lub dwa. Widzą to właściciel i kierownicy, menedżerowie — nie.",
    items: [
      {
        id: "numbers",
        title: "Co znaczą liczby",
        body: [
          "W prawym górnym rogu — okres: **«7 dni»**, **«30 dni»** albo **«90 dni»**. Strzałka przy każdej liczbie pokazuje, o ile wzrosła lub spadła w porównaniu z taką samą liczbą dni wcześniej: przy «30 dni» — w porównaniu z poprzednimi 30. Zielona strzałka — dobrze, żółta — źle, «nowe» — wcześniej było zero.",
          "**«wizyty»** — ile razy wchodzono na stronę: jedna osoba rano i wieczorem to dwie wizyty. **«użytkownicy»** — ile różnych osób, a dokładniej różnych przeglądarek: ta sama osoba z telefonu i z laptopa liczy się podwójnie. **«odsłony»** — ile stron otwarto łącznie.",
          "**«odrzucenia»** — odsetek wizyt, w których ktoś otworzył jedną stronę i prawie od razu wyszedł. Tu jest odwrotnie: wzrost odrzuceń to żółta strzałka, czyli źle. **«śr. wizyta»** — ile średnio trwa wizyta, minuty:sekundy.",
          "Słupki — wizyty dziennie; najedź na słupek, a zobaczysz datę i liczbę. **«Skąd przychodzą»** — z wyszukiwarki, mediów społecznościowych, reklamy albo bezpośrednio z linku. Metryka podaje nazwy po rosyjsku, Google — po angielsku: «Organic Search» — wyszukiwarka, «Direct» — wejścia bezpośrednie, «Referral» — przejścia z innych stron, «Organic Social» i «Paid Social» — media społecznościowe, «Paid Search» — reklama w wyszukiwarce. **«Strony wejścia»** — od której strony ktoś zaczął wizytę.",
          "Liczby odświeżają się co 10 minut: panel nie pyta Metryki i Google przy każdym otwarciu, więc dopiero co uruchomiona reklama nie pojawi się tu od razu.",
        ],
      },
      {
        id: "two-sources",
        title: "Dlaczego Metryka i Google pokazują co innego",
        body: [
          "Metryka i Google Analytics stoją obok siebie i się nie sumują. Każda liczy wizytę po swojemu i po swojemu odsiewa roboty, a część osób ma w przeglądarce zablokowaną jedną z nich, ale nie drugą. Dlatego liczby się różnią i to normalne: suma byłaby liczbą, której nie ma ani tu, ani tam.",
          "Patrz na kierunek, a nie na dokładną liczbę. Obie pokazują wzrost po uruchomieniu reklamy — reklama przyprowadza ludzi. Rośnie tylko jedna — najpewniej chodzi o sposób liczenia, a nie o ludzi.",
          "Wejście na stronę to jeszcze nie klient. Ile osób napisało, widać w [Statystykach](/admin/stats), w bloku «Skąd przychodzą»: tam są zgłoszenia, tu — odwiedziny. Jeśli odwiedzin jest więcej, a zgłoszeń nie — ludzie przychodzą, ale nie znajdują tego, po co przyszli.",
        ],
      },
      {
        id: "connect",
        title: "Jak to jest podłączone",
        body: {
          head: [
            "Podłącza właściciel: Metryka potrzebuje klucza na serwerze, Google — logowania jego kontem Google. Nie masz przycisków podłączania, tylko liczby — stąd nie da się zepsuć ani zmienić podłączenia.",
            "Jeśli na karcie jest «Nie podłączono» albo «Google przestał wpuszczać przez logowanie właściciela» — powiedz właścicielowi, zajmie mu to minutę. «Brak odpowiedzi» to zwykle coś chwilowego: odśwież stronę za minutę, a jeśli się powtarza — też do właściciela.",
          ],
          admin: [
            "**Metryka** podłącza się tokenem `YANDEX_METRIKA_TOKEN` (numer licznika panel zna sam) — w `/opt/devuz/.env` na serwerze albo w magazynie sekretów Supabase (Vault) pod nazwą `app.YANDEX_METRIKA_TOKEN`: jeśli w `.env` nie ma klucza, panel bierze go stamtąd.",
            "**Google Analytics** podłącza się logowaniem przez Google, bez kluczy i bez serwera. Raz w Google Cloud tworzy się «klienta» — przepustkę, po której Google rozpoznaje nasz panel; krok po kroku opisano to bezpośrednio na karcie «Google Analytics». Jego Client ID i Client secret wkleja się na kartę, a potem — **«Zapisz i zaloguj przez Google»**. Zaloguj się kontem Google, które ma dostęp do Analytics strony, i nie odznaczaj «See and download your Google Analytics data». Numer usługi panel znajduje sam — po liczniku strony `G-L52MCVNS0W`. Wszystko, co otrzymano, leży w zaszyfrowanym magazynie sekretów Supabase, a panel ma dostęp tylko do odczytu: nie może niczego zmienić w Analytics. Każde logowanie widać w [Dzienniku](/admin/audit).",
            "Jeśli Google przestał wpuszczać — karta pisze «Google nie wpuszcza już przez zapisane logowanie», a rozwiązaniem jest przycisk **«Zaloguj przez Google»**. Najczęściej przyczyna jest jedna: aplikacja w Google Cloud nie jest opublikowana — w trybie «Testing» Google wyłącza logowanie po 7 dniach, dlatego trzeba tam raz kliknąć «Publish app». Jeśli panel nie znalazł sam numeru usługi (nie włączono «Google Analytics Admin API» albo usługa jest na innym koncie), poprosi o jego wpisanie: Google Analytics → «Administracja» → «Szczegóły usługi», same cyfry. Link **«zaloguj ponownie»** pod liczbami służy do zmiany konta Google.",
            "Kierownicy widzą tę sekcję, ale bez kroków podłączania, bez przycisków logowania i bez adresu Twojego konta Google — zamiast nich jest napisane «Podłącza właściciel». Menedżerowie tej sekcji nie widzą. Dawniej «Ruch» był zakładką na stronie głównej — stare zakładki w przeglądarce prowadzą tutaj.",
          ],
        },
      },
    ],
  },

  /* ── Договоры ─────────────────────────────────────────────────────── */
  /* ── Reklamy ──────────────────────────────────────────────────────── */
  "/admin/outside": {
    what: "Szkice artykułów dla vc.ru, Dzen i Tenchat: raz w tygodniu model pisze po jednym na platformę, człowiek publikuje je z konta studia na platformie i wkleja tu link. Potrzebne, żeby o studiu pisano tam, gdzie czytają właściciele firm w Rosji i WNP, i żeby z tych artykułów przychodzili ludzie i linki do naszej strony.",
    items: [
      {
        id: "how",
        title: "Jak to działa",
        body: [
          "Raz w tygodniu, w dzień czasu taszkenckiego (od 11:00), dla każdej platformy przygotowuje się szkic. Temat jest z listy w kodzie, a zapytanie do niego sprawdza się w Wordstacie i Google Trends dla Rosji: tam głównie czyta się te platformy. Pisze tani model, na podstawie faktów z naszych case studies na stronie.",
          "Zanim szkic pojawi się tutaj, sprawdza go kod: zapytanie stoi w tytule i pierwszym akapicie, nie ma długich myślników ani klisz sieci neuronowych, nie ma cen, procentów i liczb, których nie ma w case studies, linki prowadzą tylko do naszej strony i naszych case studies, nie więcej niż dwa (w Tenchat — jeden). Nie przeszedł w trzech próbach — szkicu nie ma, a właściciel dostaje wiadomość, co nie wyszło.",
          "Szkice się nie gromadzą: platforma dostaje nowy dopiero, gdy poprzedni jest opublikowany albo pominięty. W jednym tygodniu trzy platformy mają trzy różne tematy, a jeden temat na każdej platformie pisze się własnym tekstem: na vc.ru analiza, w Dzen prostym językiem, w Tenchat krótki post.",
          "Publikuje człowiek, a nie robot: te platformy nie mają otwartego sposobu publikowania programem, a robot, który sam loguje się na konto, łamie ich regulamin i konto zostaje zablokowane.",
        ],
      },
      {
        id: "publish",
        title: "Jak opublikować",
        body: [
          "W bloku **«Czekają na publikację»** przy szkicu są platforma, zapytanie i przyciski. **«Kopiuj tytuł»** — do pola tytułu w edytorze. **«Kopiuj»** — cały tekst: dla vc.ru i Dzen z formatowaniem (śródtytuły, listy i linki wkleją się tak, jak są), dla Tenchat — zwykłym tekstem. Jeśli edytor wkleił tekst krzywo — **«Kopiuj bez formatowania»**.",
          "**«Otwórz vc.ru»** (albo inną platformę) otwiera ją w nowej karcie: zaloguj się na konto studia, zacznij nową publikację, wklej tytuł i tekst, dodaj obrazek i opublikuj. **«Pokaż tekst»** — przeczytać szkic wcześniej; poprawić można od razu w edytorze platformy.",
          "Po publikacji skopiuj adres artykułu z paska przeglądarki, wklej go w **«Link do opublikowanego artykułu»** i kliknij **«Opublikowałem»**. Link jest przyjmowany tylko z adresu tej platformy i tylko https. **«Pomiń»** — jeśli szkic się nie nadaje: platforma dostanie nowy w przyszłym tygodniu.",
          "Linki w tekście prowadzą na naszą stronę z oznaczeniami dla Metryki (w oznaczeniu — nazwa platformy): w [Ruchu](/admin/traffic) widać, ile osób przyszło z każdej platformy.",
        ],
      },
      {
        id: "links",
        title: "Opublikowane i sprawdzanie linku",
        body: [
          "W bloku **«Opublikowane»** są artykuły z linkiem do nich, kto i kiedy opublikował. 10 minut po „Opublikowałem”, a potem raz w tygodniu kod sam otwiera stronę artykułu i szuka na niej linku do devuz.studio.",
          "Wiersz pod artykułem: „przekazuje moc w wyszukiwarce” — zwykły link, pomaga stronie w Google i Yandex; „oznaczyła go nofollow” — platforma poprosiła wyszukiwarki, żeby nie liczyły linku: mocy nie ma, ale ludzie z niego przechodzą, dla takich platform to normalne; „nie znaleźliśmy linku” — usunięto go podczas moderacji albo artykuł widać dopiero po zalogowaniu; „strona nie otworzyła się” — artykuł usunięto albo platforma nie wpuszcza sprawdzania.",
          "Na górze działu — ile artykułów opublikowano w 30 dni i ile szkiców pominięto.",
        ],
      },
      {
        id: "auto",
        title: "Publikuje się samo: Telegraph, VKontakte, kanał Telegram",
        roles: ["admin", "head"],
        body: [
          "Blok **«Publikuje się samo»** to platformy, na których wolno publikować programem według ich regulaminu. Dostają szkic raz w tygodniu, jak vc.ru, przechodzą to samo sprawdzenie kodem i wychodzą bez człowieka: artykuł od razu pojawia się w **«Opublikowane»** z dopiskiem «wyszedł sam», a link do nas kod sprawdza tak samo jak u pozostałych. Jeśli się nie uda (platforma nie odpowiedziała, kanał odłączono), szkic wraca do **«Czekają na publikację»** z powodem i publikuje się go ręcznie.",
          "**Telegraph** (telegra.ph, strony-artykuły Telegrama) nie wymaga rejestracji: konto studia kod zakłada sam przy pierwszym artykule, jego klucz leży w sejfie sekretów. Nic nie trzeba robić.",
          "**VKontakte i kanał Telegram** idą przez Postiz, serwis publikacji odroczonych z oficjalnym połączeniem z platformami. Jeden raz: zarejestrować się na postiz.com, kliknąć «Add Channel» i zalogować się do społeczności VKontakte i kanału Telegram studia, potem Settings → Developers → Public API → skopiować klucz i wkleić go w **«Klucz API Postiz»**, przycisk **«Zapisz i sprawdź»**. Klucz zapisuje się tylko wtedy, gdy Postiz go przyjął; z powrotem panel pokazuje tylko «ustawiony» albo «pusty», do dziennika działań trafia bez wartości. Wiersz pod polem mówi, jakie kanały widzi Postiz i które nasze platformy publikują się same. Platforma bez kanału w Postiz nie dostaje szkicu.",
        ],
      },
      {
        id: "publisher",
        title: "Kto publikuje",
        roles: ["admin", "head"],
        body: [
          "Na dole — **«Kto publikuje»**: komu bot wysyła kartę «📝 Статьи на площадки», gdy szkice są gotowe. Nikt nie wybrany — karta idzie do właściciela i kierownika, jeśli w «Zespole» nie mają odznaczonego pola «Raporty».",
          "Na liście są ci, którzy mają dostęp do tego działu. Jest on otwarty dla właściciela i kierownika; menedżerowi, który będzie publikował, właściciel otwiera go zaznaczeniem w [Zespole](/admin/team) → «Działy». Konta na platformach zakłada się na studio; login i hasło ma ten, kto publikuje, do panelu się ich nie wpisuje.",
        ],
      },
    ],
  },
  "/admin/ads": {
    what: "Autopilot reklam w Google Ads i Yandex Direct — nowa usługa studia dla marketerów i agencji. Raz na dobę pobiera raporty konta reklamowego i proponuje trzy rzeczy: wykluczające słowa kluczowe, przesunięcie budżetu i testy reklam, — każdą z powodem i liczbami. Domyślnie sam niczego nie zmienia: decyduje człowiek przyciskami «Akceptuj» i «Odrzuć». Widzą to właściciel i kierownicy, menedżerowie — nie.",
    items: [
      {
        id: "what",
        title: "Co robi autopilot",
        body: [
          "**Wykluczenia.** Zapytania, na które wyświetlała się reklama, są dzielone na słowa i pary słów, a dla każdego sumuje się pieniądze i zgłoszenia. Słowo, które wydało nie mniej niż zwykły koszt zgłoszenia, zebrało kliknięcia i nie przyniosło żadnego zgłoszenia («za darmo», «pobierz», «praca»), jest proponowane do wykluczenia. Zapytania, których reguła nie widzi, ale które wyraźnie nie dotyczą tej firmy, oznacza tani model. Przed propozycją kod sprawdza, że wykluczenie nie blokuje żadnego słowa kluczowego kampanii. W Direct są jeszcze **wykluczenia krzyżowe**: jeśli ogólne słowo kluczowe («kursy angielskiego») i doprecyzowane («kursy angielskiego dla dzieci») są w różnych grupach, do ogólnej grupy proponowane jest wykluczenie «dzieci», żeby takie zapytanie trafiało do swojej reklamy.",
          "**Budżet.** Pieniądze przechodzą z kampanii z drogim zgłoszeniem do kampanii z tanim, ale tylko jeśli ta codziennie wyczerpuje swój budżet. Przy małej ilości danych porównanie «na oko» wprowadza w błąd, dlatego autopilot liczy prawdopodobieństwo, że jedna kampania naprawdę jest lepsza, i proponuje przesunięcie dopiero przy 90% i więcej. Łączny budżet się przy tym nie zmienia.",
          "**Testy reklam.** Jeśli w grupie jest jedna reklama, model pisze drugi wariant w języku grupy, bez długich myślników, sztampy i obietnic typu «gwarancja» czy «najlepszy». Po 10–45 dniach zostaje ta, która przynosi więcej zgłoszeń, druga idzie na pauzę.",
          "Stawek za słowa kluczowe autopilot nie rusza: robią to same Google i Yandex w swoich strategiach. Szczegóły — w `docs/ads-autopilot/design.md`.",
        ],
      },
      {
        id: "setup",
        title: "Jak założyć konto agencji",
        body: [
          "Po lewej — lista kont. **«Nowe konto»**: nazwa, kto to (studio, agencja albo firma) i język — w nim bot pisze do osób z tego konta. Kliknij **«Utwórz»**, a konto otworzy się po prawej.",
          "W bloku **«Osoby»** dodaj te osoby, które będą pracować na koncie po stronie agencji: liczbowy Telegram id i imię, przycisk **«Dodaj»**. Logują się na devuz.studio/ads przez bota studia — przycisk «Zaloguj przez Telegram» wysyła jednorazowy link — i dostają powiadomienia. Usunięta osoba traci dostęp od razu.",
          "**«Dodaj konto reklamowe»**: platforma, nazwa, login klienta w Direct (dla agencji) albo numer konta Google w formacie 123-456-7890. Potem na samym koncie — **«Połącz»**: otworzy się strona Yandex lub Google, gdzie właściciel reklam udziela dostępu. Klucz jest przechowywany w postaci zaszyfrowanej, nikt go nie widzi, łącznie ze studiem. Zaraz po podłączeniu autopilot sam pobiera raporty — propozycje pojawią się w ciągu kilku minut. Jeśli konto przestanie się później odświeżać (dostęp cofnięty, platforma odmówiła), osoby z konta dostaną jedną wiadomość na Telegram, a na koncie będzie widoczna przyczyna.",
        ],
      },
      {
        id: "proposals",
        title: "Propozycje: «Akceptuj» i «Odrzuć»",
        body: [
          "W bloku **«Propozycje»** — to, co autopilot znalazł w ostatnich 30 dniach, każda z powodem prostymi słowami i liczbami. **«Akceptuj»** od razu stosuje zmianę na koncie reklamowym, **«Odrzuć»** usuwa propozycję. Nierozstrzygnięta propozycja po 14 dniach się przedawnia: dane w niej są już nieaktualne.",
          "Przed zastosowaniem autopilot jeszcze raz patrzy na konto w obecnym stanie. Jeśli budżet zmieniono już ręcznie, kampania zaczęła się uczyć albo do słów kluczowych dodano słowo, które blokuje wykluczenie, zmiana nie zostanie zastosowana, a pod propozycją pojawi się wiersz z powodem. To nie awaria, tylko ochrona.",
          "**«Odśwież teraz»** pobiera raporty i pisze propozycje bez czekania doby — zwykle w 1–2 minuty, wynik przyjdzie też na Telegram.",
        ],
      },
      {
        id: "limits",
        title: "Tryb, limity i hamulec",
        body: [
          "W bloku **«Tryb i limity»** są dwa tryby. **«Proponuję — Ty zatwierdzasz»** jest domyślny: bez człowieka nic się nie zmienia. **«Sam, w granicach limitów»** — autopilot sam stosuje propozycje i pisze o tym na Telegram. Warto go włączyć, gdy agencja przez tydzień lub dwa akceptowała propozycje i się z nimi zgadza.",
          "Limity: o ile procent można naraz przesunąć budżet jednej kampanii (domyślnie 20, więcej niż 30 w ogóle nie wolno) i ile zmian autopilot może zrobić sam w ciągu doby. Progi dla wykluczeń, własny koszt zgłoszenia, słowa, których nie wolno wykluczać (marka, miasto, usługa), i kilka zdań o firmie pomagają dokładniej odróżniać śmieciowe zapytania.",
          "Co nie zmienia się w żadnym trybie: łączny budżet nie rośnie, kampanii w trakcie nauki się nie rusza, wykluczenie nie blokuje słów kluczowych, budżet jednej kampanii zmienia się nie częściej niż raz na 3 dni, nic nie jest usuwane — tylko pauza. **«Hamulec: zatrzymaj wszystkie zmiany»** zatrzymuje wszystko, łącznie z przyciskiem «Akceptuj»; cofać zrobione można także przy nim.",
        ],
      },
      {
        id: "journal",
        title: "Dziennik, cofanie i raport tygodnia",
        body: [
          "W **«Dzienniku»** każda zmiana: kiedy, kto (człowiek czy autopilot, znacznik «sam»), co było i dlaczego. **«Cofnij»** jednym kliknięciem przywraca stan sprzed zmiany: wykluczenia — tylko te dodane przez nas, budżet — tylko jeśli od tamtej pory nie zmieniano go ręcznie, reklama — znów się włącza albo idzie na pauzę. Zmiana trybu i hamulec też trafiają do dziennika.",
          "Blok **«Z 7 dni»** pokazuje, ile zmian zastosowano, ile pieniędzy miesięcznie wykluczenia nie wpuszczają już na śmieciowe zapytania i ile propozycji czeka na decyzję. Raport tygodnia przychodzi osobom z konta na Telegram w poniedziałki po 09:00; **«Wyślij raport tygodnia na Telegram»** wyśle go Tobie teraz.",
        ],
      },
      {
        id: "alerts",
        title: "Alarmy",
        body: [
          "Raz na dobę, razem z odświeżeniem, autopilot porównuje wczorajszy dzień ze zwykłym — średnią z siedmiu dni przed nim. Alarm pojawia się, jeśli kampania wczoraj nic nie wydała, choć zwykle wydaje; jeśli wydatek wzrósł dwukrotnie, a zgłoszeń nie przybyło; jeśli przy zwykłych pieniądzach nie przyszło żadne zgłoszenie (zwykle to zepsuty formularz albo cel w Metryce); jeśli platforma odrzuciła reklamę; jeśli wykluczenie blokuje słowo kluczowe kampanii.",
          "Każdy alarm przychodzi osobom z konta na Telegram raz i jest widoczny jako żółty blok **«Alarmy»** na górze konta. Gdy przyczyna ustąpi — na przykład kampania znów wydaje — alarm znika sam, nic nie trzeba klikać. Sam autopilot w reakcji na alarmy niczego nie zmienia: to sygnał dla człowieka.",
        ],
      },
      {
        id: "stub",
        title: "Atrapa: testy bez konta reklamowego",
        body: [
          "Platforma **«Atrapa (testy)»** to ośrodek szkoleniowy w Taszkencie z realistycznymi liczbami w sumach. Widać na niej wszystko: propozycje, «Akceptuj», dziennik i cofanie, — a na żadnym prawdziwym koncie reklamowym nic się nie dzieje. Wygodnie pokazać agencji przed podłączeniem.",
          "**«Przewiń 7 dni»** jest tylko przy atrapie i tylko w panelu: dodaje tydzień wyświetleń, żeby test reklam doszedł do wyniku bez czekania dwóch tygodni.",
        ],
      },
      {
        id: "keys",
        title: "Klucze i włączenie",
        roles: ["admin"],
        body: [
          "Przebiegi w tle włącza `ADS_AUTOPILOT=1` (w `/opt/devuz/.env` albo w magazynie sekretów jako `app.ADS_AUTOPILOT`); bez tego działają tylko przyciski. Klucze klientów są szyfrowane `ADS_TOKEN_KEY` — 32 losowe bajty w base64; zmiana oznacza ponowne podłączenie wszystkich kont.",
          "Przycisk «Połącz» potrzebuje kluczy aplikacji: `YANDEX_DIRECT_CLIENT_ID` i `YANDEX_DIRECT_CLIENT_SECRET`, `GOOGLE_ADS_CLIENT_ID` i `GOOGLE_ADS_CLIENT_SECRET`. Jak je zdobyć i co złożyć w Yandex i Google — krok po kroku w `docs/ads-autopilot/api-access.md`. Zużycie modelu widać w `model_usage` z etykietami `ads-negatives` i `ads-copy`.",
        ],
      },
      {
        id: "google",
        title: "Google: klucze i planer słów kluczowych",
        roles: ["admin", "head"],
        body: [
          "Planer słów kluczowych Google Ads mówi, ile razy w miesiącu fraza jest wyszukiwana w Google. Od 07.11.2026 to trzecie źródło dla każdego artykułu obok Trends i Wordstatu: artykuły strony patrzą na region swojego języka (wersja rosyjska — Rosja, Uzbekistan, Kazachstan, Białoruś i Kirgistan razem, uzbecka — Uzbekistan, angielska — USA, Wielka Brytania i Kanada, polska — Polska), artykuły na platformach — na Rosję. Frazy z największą liczbą wyszukiwań model dostaje jako pierwsze. Niepodłączony — artykuły idą jak dawniej, bez niego.",
          "Co zrobić w Google raz (właściciel; te same kroki słowami „Krok 1 — …” — w samym bloku **«Klucze aplikacji Google»**, dopóki planer nie zadziała): w console.cloud.google.com — projekt, w nim «Google Ads API» → Enable. «OAuth consent screen»: typ External, status In production, branding — nazwa, logo, e-mail, strona https://devuz.studio, polityka https://devuz.studio/ru/privacy, domena devuz.studio → «Verify branding». «Credentials» → «OAuth client ID» → Web application, w Authorized redirect URI — adres z bloku **«Klucze aplikacji Google»** (przycisk **«Kopiuj»**). Client ID i sekret wklej w ten sam blok i kliknij **«Zapisz»**.",
          "Poziom dostępu: «Google Ads API» → «Overview» → «Upgrade access level» → «Apply for access», najpierw Explorer, potem Basic. Planer Google udostępnia dopiero od Basic; dopóki poziom jest niższy, **«Sprawdź»** tak właśnie powie. Po weryfikacji marki Basic zwykle przyznawany jest w kilka minut.",
          "Konto: po lewej załóż przestrzeń (studio), dodaj konto reklamowe Google z numerem z 10 cyfr (jest na górze ads.google.com) i kliknij przy nim «Połącz» — zaloguj się kontem, które ma dostęp do tego konta reklamowego. Potem w bloku **«Planer słów kluczowych»** wybierz je (jeśli jest jedno, bierze się samo) i kliknij **«Sprawdź»**: powinno odpowiedzieć „działa” i pokazać, co wyszukuje się najczęściej. Autopilot na tym koncie sam nic nie zmienia, tylko proponuje.",
        ],
      },
    ],
  },

  "/admin/contracts": {
    what: "Umowę naszej działalności gospodarczej z klientem przygotowuje się w karcie projektu. Przygotować ją może każdy z zespołu, a zatwierdza tylko właściciel. Wtedy w dokumencie pojawia się jego podpis.",
    items: [
      {
        id: "prepare",
        title: "Przygotuj umowę",
        body: [
          "Otwórz [projekt](/admin/projects) i znajdź blok «Umowa». Wybierz makietę w bloku [«Skład z makiety»](#contracts-compose). Kosztorys, kwota, przedmiot i termin wstawią się same.",
          "Dane klienta wklej w «Wklej dane firmy» i kliknij «Rozłóż na pola». Wpisz datę i etapy, udziały etapów razem dają dokładnie 100%. Kliknij **«Przygotuj umowę»**.",
          "Powstanie szkic bez podpisu. Czego brakuje do podpisu, widać na liście nad dokumentem. Druga umowa w projekcie nie powstanie: przycisk otworzy pierwszą.",
        ],
      },
      {
        id: "compose",
        title: "«Skład z makiety» i «Wklej dane firmy»",
        body: [
          "Wybierz makietę, a pojawią się podstawa i dodatki z cenami, tak jak klient widział je na makiecie. Dodatki z ★ są już zaznaczone. Odznacz zbędne.",
          "Możesz dodać do trzech własnych wierszy z ceną. Cena 0 oznacza prezent. Makiety nie ma na liście? Wgraj kosztorys plikiem.",
          "W «Wklej dane firmy» wklej tekst klienta tak, jak jest, i kliknij «Rozłóż na pola». Panel znajdzie nazwę, INN, rachunek, MFO i bank. Sprawdź pola wzrokiem.",
        ],
      },
      {
        id: "to-sign",
        title: "«Umowy do podpisu»",
        roles: ["admin"],
        body: [
          "Pierwszy na stronie jest blok «Umowy do podpisu». Kliknij wiersz, a otworzy się umowa.",
          "W umowie są dwa przyciski: «Zatwierdź i podpisz» oraz «Zwróć do poprawy».",
        ],
      },
      {
        id: "review",
        title: "Strona umowy: kosztorys i wysłanie do podpisu",
        body: {
          manager: [
            "W szkicu kliknij **«Wgraj kosztorys»** (Excel, CSV albo PDF z tekstem) i podaj **«Termin»**. Plik się nie odczytał? Kliknij **«Wklej wiersze kosztorysu ręcznie»**: nazwa, ilość, cena rozdzielone «;».",
            "Kliknij **«Wyślij do podpisu»**. Właściciel dostanie wiadomość w Telegramie, a umowy nie da się już edytować.",
            "Właściciel zatwierdzi umowę albo zwróci ją do poprawy. Gdy klient podpisze, wgraj skan przyciskiem **«Wgraj podpisaną»**.",
          ],
          head: [
            "Robisz to samo co menedżer. Umowę zatwierdza i anuluje tylko właściciel.",
          ],
          admin: [
            "Umowa do podpisu przychodzi do Ciebie w Telegramie i widać ją w «Wymaga uwagi» na «Pulpit». Kliknij **«Zatwierdź i podpisz»** albo **«Zwróć do poprawy»**.",
            "Zatwierdzenie stawia Twój podpis i od razu wystawia fakturę za pierwszy etap. Zatwierdzonej umowy nie da się edytować, do poprawek przygotowuje się nową.",
            "Umowę można anulować: wpisz «Powód anulowania» i kliknij «Anuluj».",
          ],
        },
      },
      {
        id: "invoices",
        title: "Faktury za etapy i link dla zamawiającego",
        body: {
          manager: [
            "Każdy etap klient opłaca z góry. Faktura za pierwszy etap wystawi się sama, kolejne wystawiaj przyciskiem **«Wystaw fakturę»**.",
            "Pieniądze wpłynęły? Kliknij **«Opłacona»**. Gdy właściciel potwierdzi płatność, Twoje pieniądze z niej się odmrożą.",
            "**«Link dla zamawiającego»** otwiera klientowi umowę i faktury. Link widać tylko raz, skopiuj go od razu.",
          ],
          head: [
            "Każdy etap klient opłaca z góry. Faktura za pierwszy etap wystawi się sama, kolejne wystawiaj przyciskiem **«Wystaw fakturę»**.",
            "Pieniądze wpłynęły? Kliknij **«Opłacona»**. Gdy właściciel potwierdzi płatność, pieniądze zespołu z niej się odmrożą.",
            "**«Link dla zamawiającego»** otwiera klientowi umowę i faktury. Link widać tylko raz, skopiuj go od razu.",
          ],
          admin: [
            "Każdy etap klient opłaca z góry. Faktura za pierwszy etap wystawi się sama, kolejne wystawiaj przyciskiem **«Wystaw fakturę»**.",
            "Twoje oznaczenie «Opłacona» od razu zapisuje płatność w projekcie. Oznaczył pracownik? Kliknij **«Potwierdź płatność»** albo **«Nie było wpłaty»**.",
            "**«Link dla zamawiającego»** otwiera klientowi umowę i faktury. Link widać tylko raz, skopiuj go od razu.",
          ],
        },
      },
      {
        id: "signature",
        title: "Twój podpis",
        roles: ["admin"],
        body: [
          "W bloku «Podpis» wgraj obraz PNG z przezroczystym tłem, do 2 MB. Jest jeden na wszystkie umowy.",
          "Podpis widać tylko na zatwierdzonych umowach i ich fakturach.",
        ],
      },
      {
        id: "protects",
        title: "Przed czym chroni umowa",
        body: [
          "Spory rozstrzyga arbitraż. Odpowiadamy najwyżej do kwoty otrzymanych pieniędzy, utraconych korzyści nie zwracamy.",
          "Klient milczy 5 dni roboczych po oddaniu etapu? Etap jest odebrany. Prawa do kodu przechodzą na klienta po pełnej zapłacie.",
          "Prawnik nie sprawdzał dokumentu. Trudny przypadek pokaż prawnikowi.",
        ],
      },
    ],
  },

  /* ── Расходы ──────────────────────────────────────────────────────── */
  "/admin/expenses": {
    what: "Tu są wspólne wydatki studia i ile z każdego przypada na każdego współzałożyciela. Są tu też terminy podatkowe na dwa tygodnie.",
    items: [
      {
        id: "split",
        title: "Jak dzieli się wydatek",
        body: [
          "Wydatek dzieli się według udziałów współzałożycieli. Przy udziałach 70 i 30 reklama za $100 dzieli się na $70 i $30.",
          "Kosztu wytworzenia projektu tu nie wpisuj: jest już odjęty w samym projekcie.",
        ],
      },
      {
        id: "add",
        title: "Zapisz i usuń",
        body: {
          head: [
            "W bloku «Dodaj wydatek» wypełnij datę, kategorię i kwotę, a potem kliknij «Zapisz».",
            "Wydatki usuwa tylko właściciel. Pomyłka? Powiedz mu.",
          ],
          admin: [
            "«Dodaj wydatek» zapisuje wydatek, a «usuń» w wierszu go usuwa. Kierownik może tylko zapisywać.",
            "Te same wydatki są w sekcji [«Finanse»](/admin/finance).",
          ],
        },
      },
      {
        id: "payer",
        title: "Kto zapłacił",
        body: {
          head: [
            "«Wspólnie» w polu «Kto zapłacił» znaczy, że zapłacono wspólnymi pieniędzmi studia.",
            "Zapłacił ktoś jeden z własnych pieniędzy? Wybierz go i kliknij «Zapisz». Ta kwota wróci do niego przed podziałem.",
            "Każdy dołożył swoją część? Zapisz wydatek dwoma wierszami.",
          ],
          admin: [
            "«Wspólnie» w polu «Kto zapłacił» znaczy, że zapłacono wspólnymi pieniędzmi studia.",
            "Zapłacił ktoś jeden z własnych pieniędzy? Wybierz go i kliknij «Zapisz». Ta kwota wróci do niego przed podziałem, widać to w sekcji [«Finanse»](/admin/finance).",
            "Każdy dołożył swoją część? Zapisz wydatek dwoma wierszami. Każda zmiana trafia do sekcji [«Dziennik»](/admin/audit).",
          ],
        },
      },
      {
        id: "taxes",
        title: "Terminy podatkowe",
        body: [
          "Blok «Podatki: co się zbliża» pokazuje terminy na 14 dni do przodu. Gdy do terminu zostały 3 dni lub mniej, data robi się żółta.",
          "Daty nie są potwierdzone przez księgowego. Sprawdź je z nim.",
        ],
      },
      {
        id: "no-profit",
        title: "Dlaczego tu nie ma zysku",
        body: {
          head: [
            "Zysk i udziały w nim widzi tylko właściciel.",
          ],
          admin: [
            "Kierownik widzi tu tylko wydatki. Zysk i udziały widzisz tylko Ty, w sekcji [«Finanse»](/admin/finance).",
          ],
        },
      },
    ],
  },

  /* ── Финансы ──────────────────────────────────────────────────────── */
  "/admin/finance": {
    what: "Tu widać, ile każdy zarobił na transakcjach, ile czeka na płatność klienta i ile już wypłacono. Pensji nie ma: każdy dostaje procent od swoich transakcji.",
    items: [
      {
        id: "how",
        title: "Jak liczy się procent",
        body: [
          "Procent liczy się od zysku netto transakcji: kwota umowy minus podatek i koszt wytworzenia. Podatek i koszt wpisuje właściciel.",
          "Od nowego klienta menedżer dostaje 10%, a po 3 transakcjach w poprzednim miesiącu 15%. Od dosprzedaży (nowej pracy dla starego klienta) 5%, młodszy menedżer 0. Kierownik dostaje 30%.",
          "Kierownik dostaje jeszcze 5% od transakcji swojego zespołu. Kto przyprowadził agencję albo partnera, przez 12 miesięcy dostaje 5% od kwoty jego projektów.",
          "Za zamówienie Claudery (pomoc z AI z bota) osoba prowadząca dostaje 40% kwoty. Właściciel może ustawić własny procent dla każdej transakcji.",
        ],
      },
      {
        id: "grade",
        title: "Poziom za transakcje i «Premie za transakcje»",
        body: [
          "Transakcja to projekt z pierwszą płatnością, liczony w miesiącu tej płatności. 3 transakcje w miesiącu dają 15% zamiast 10% w następnym miesiącu.",
          "Do tego za każde 3 transakcje w miesiącu jest premia $200. Widać ją w bloku «Premie za transakcje» i od razu wchodzi do «Do wypłaty».",
        ],
      },
      {
        id: "freeze",
        title: "Zamrożone, zarobione, do wypłaty",
        body: [
          "**«Zamrożone»** znaczy, że klient jeszcze nie zapłacił całej kwoty. **«Zarobione»** znaczy, że klient zapłacił wszystko.",
          "**«Do wypłaty»** to zarobione minus wypłacone.",
          "Liczby przeliczają się przy każdym otwarciu strony.",
        ],
      },
      {
        id: "page",
        title: "Co jest na stronie",
        body: {
          manager: [
            "Na górze Twoje kafelki. Niżej «Według projektów»: kwota, czy zapłacono w całości i Twoje naliczenie.",
            "Chcesz więcej? Szukaj nowych klientów i zakładaj [projekty](/admin/projects) sam.",
          ],
          head: [
            "Widzisz siebie i swój zespół: saldo, projekty i wypłaty.",
            "Zysk studia widzi tylko właściciel.",
          ],
          admin: [
            "Kafelki dla całego studia, od «Z umów» do «Zostaje właścicielowi».",
            "«Udziały współzałożycieli» pokazują, co wpłynęło, co odjęto (partnerzy, agencje, wydatki) i ile komu wypłacić.",
          ],
        },
      },
      {
        id: "payouts",
        title: "Wypłaty",
        body: {
          manager: [
            "Wypłaty zapisuje właściciel, gdy przeleje pieniądze. Zmniejszają «Do wypłaty».",
          ],
          head: [
            "Wypłaty zapisuje tylko właściciel.",
          ],
          admin: [
            "Najpierw przelej pieniądze, potem zapisz wypłatę w bloku «Wypłaty» przyciskiem «Zapisz wypłatę». Sobie wypłaty zapisać nie można.",
          ],
        },
      },
      {
        id: "cash",
        title: "Kasa, oczekiwane płatności i podatki",
        roles: ["admin"],
        body: [
          "Na dole sekcji jest «Kasa w podziale na miesiące» za pół roku, oczekiwane płatności i terminy podatkowe.",
          "Wydatki biorą się z sekcji [«Wydatki»](/admin/expenses). Te bloki widzisz tylko Ty.",
        ],
      },
    ],
  },
};
