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
    what: "Tutaj są robocze konta Telegram. Z nich studio pierwsze pisze do firm i prowadzi korespondencję z klientami. Konto główne jest już podłączone, tutaj dodaje się dodatkowe.",
    items: [
      {
        id: "add",
        title: "Podłączenie konta",
        body: [
          "Wpisz nazwę konta i numer telefonu, kliknij **«Wyślij kod»**. Kod przyjdzie do aplikacji Telegram na tym telefonie, zwykle nie SMS-em. Wpisz go i kliknij **«Zaloguj»**.",
          "Nie przekazuj nikomu kodu: przesłany dalej kod Telegram unieważnia. Jeśli pojawi się prośba o hasło weryfikacji dwuetapowej, wpisz je i znowu kliknij **«Zaloguj»**. Nie przechowujemy go.",
          "Na telefonie pojawi się nowa sesja. Nie kończ jej, bo konto się odłączy. Błąd przy logowaniu? Kliknij «Odłącz» i podłącz konto od nowa.",
        ],
      },
      {
        id: "limits",
        title: "Ile wiadomości i z którego konta",
        body: [
          "Każde konto wysyła nowym osobom do trzech pierwszych wiadomości na godzinę, w godzinach 07:30-20:30. Nowemu numerowi w pierwszym tygodniu ustaw 1-2 w polu «Wiadomości na godzinę».",
          "Wiadomość wychodzi z konta, na którym wcześniej zwolniło się miejsce. Potem do klienta pisze się z tego samego numeru. Autopilot (bot, który sam pisze do firm) działa tylko z kont dodatkowych.",
          "Znacznik «połączone» oznacza, że konto działa. Zniknął na dłużej niż trzy minuty? Podłącz konto od nowa.",
        ],
      },
      {
        id: "staff",
        title: "Kto pracuje na koncie",
        body: [
          "W bloku **«Kto pracuje na koncie»** zaznacz osoby i kliknij **«Zapisz»**. Ich pierwsze wiadomości będą wychodzić tylko z ich kont. Dzięki temu klient dostaje wiadomość z numeru swojego menedżera.",
          "Ktoś nie jest zaznaczony nigdzie? Jego wiadomości bierze dowolne konto.",
        ],
      },
      {
        id: "circle",
        title: "Kółko do kontaktów",
        body: [
          "Kółko (krótkie wideo) dostają ci, którzy odpowiedzieli na «Здравствуйте». Kto odpisał po rosyjsku, dostaje rosyjskie, kto po uzbecku, uzbeckie. Gdy klient odpowie, bot wyśle analizę strony ([kontakt w dwóch krokach](#prospect-hello)).",
          "Wgraj oba kółka w bloku **«Kółko do kontaktów»**: plik MP4, kwadrat, do minuty. Kliknij **«Wgraj kółko»**, a w ciągu dziesięciu minut bot zapisze je w «Zapisanych» wszystkich kont.",
          "Kółko można też przesłać botowi studia, zapyta o język. Brakuje potrzebnego kółka? Wtedy klient dostanie wiadomość tekstową.",
        ],
      },
      {
        id: "circle-niches",
        title: "Kółka według branż",
        body: [
          "W bloku **«Kółka według branż»** kółko nagrywa się pod branżę: do stomatologii o stomatologii, do producenta mebli o meblach. Gdy nie ma kółka branży, wychodzi ogólne.",
          "Wybierz **«Branża»** i **«Język kółka»**, plik i kliknij **«Wgraj kółko branży»**. Linijka «Brakuje: …» pokazuje, których kółek nie ma.",
          "Kółka branż dostaje połowa kontaktów: tak porównujemy dwa podejścia ([A/B](#prospect-sales-ab)).",
        ],
      },
      {
        id: "stop",
        title: "Pauza, ograniczenie i odłączenie",
        body: [
          "**«Wstrzymaj»** zatrzymuje pierwsze wiadomości, odpowiedzi w rozpoczętych rozmowach idą dalej. **«Przywróć do pracy»** włącza konto z powrotem.",
          "Jeśli Telegram ograniczy konto, staje ono na dobę albo na termin podany przez Telegram. Bot uprzedzi zespół. Póki ograniczenie trwa, pisz z innego konta ([kto pracuje na koncie](#accounts-staff)).",
          "Telegram zamroził konto? Bot podpowie, jak się odwołać. Po odmrożeniu kliknij «Przywróć do pracy».",
          "**«Odłącz»** zamyka sesję. Rozmowy z tego konta prowadź dalej ręcznie.",
        ],
      },
    ],
  },

  /* ── Надзор ───────────────────────────────────────────────────────── */
  "/admin/talks": {
    what: "Tutaj jest analiza rozmów z zimnych kontaktów: co zaciekawiło klienta, gdzie rozmowa się urwała i jaka z tego lekcja.",
    items: [
      {
        id: "when",
        title: "Kiedy pojawia się analiza",
        body: [
          "Mniej więcej godzinę po ostatniej odpowiedzi klienta. Klient napisał znowu, a rozmowa zostanie przeanalizowana od nowa.",
          "Trafiają tu tylko kontakty, w których klient choć raz odpowiedział.",
        ],
      },
      {
        id: "read",
        title: "Jak czytać wiersz",
        body: [
          "Wynik pokazuje, jak skończyła się rozmowa: «odmówił», «poprosił o człowieka», «rozmowa utknęła» albo «jeszcze trwa».",
          "Lekcja jest na zielono. Niżej «Zaciekawiło», «Zarzut» i «Posypało się». Klient napisał mniej niż dwie wiadomości? Wtedy lekcji nie ma.",
        ],
      },
      {
        id: "use",
        title: "Co z tym zrobić",
        body: {
          manager: [
            "Czytaj lekcje, zanim zaczniesz pisać wiadomości: co przyciąga ludzi i gdzie milkną.",
            "Link «lead →» otwiera Twój lead z tej rozmowy.",
          ],
          head: [
            "Omawiaj lekcje z zespołem: które zaczepki działają i gdzie tracimy klientów.",
          ],
          admin: [
            "Lekcje na razie tylko się zbierają i nie trafiają do wiadomości. Dodawać je do wiadomości warto, gdy zbierze się kilkadziesiąt odpowiedzi.",
          ],
        },
      },
    ],
  },

  /* ── Макеты ───────────────────────────────────────────────────────── */
  "/admin/mockups": {
    what: "Tu są wszystkie makiety studia: prototypy na devuz.studio i projekty witryny. Widać, dla kogo zrobiono makietę i czy poszła do klienta. Tu też wydajesz hasło, żeby klient otworzył swoją makietę.",
    items: [
      {
        id: "list",
        title: "Co jest na liście",
        body: [
          "Na liście są wszystkie makiety, które może zobaczyć klient. Nowa makieta pojawia się tu sama, gdy tylko jest gotowa. Szkiców nie ma: pod ich linkiem klient nic nie zobaczy.",
          "Etykiety mówią, skąd jest makieta. «witryna» to projekt witryny, a «makieta w bocie» i «zebrana na stronie» znaczą, że klient zebrał ją sam. «z bota, zebrał pracownik» znaczy, że makietę zebrał ktoś z zespołu dla swojego klienta.",
          "Przy każdej makiecie widać stronę klienta, «Branża», «Zrobiona» i link. «otwarcia klienta: 3» pokazuje, ile razy klient otworzył makietę. Twoje otwarcia z panelu i podgląd linku w komunikatorze się nie liczą.",
          "Najnowsze makiety są na górze. Wyszukiwarka szuka po nazwie, stronie, branży, osobie odpowiedzialnej i kliencie. Przyciski «Wszystkie», «Zrobione ręcznie», «Niewysłane» i «Witryna» zostawiają na liście tylko to, czego potrzebujesz.",
        ],
      },
      {
        id: "bot-mockup",
        title: "Makieta w bocie: klient składa sam",
        body: [
          "Klient może sam złożyć makietę swojej strony w prywatnym czacie z botem studia, komendą /maket. Gotowe szablony ma czternaście branż: stomatologia, centrum medyczne, meble-remont, restauracja, biuro podróży, centrum szkoleniowe, nieruchomości, salon urody, sklep internetowy, warsztat samochodowy, logistyka, budowa i remont, usługi dla firm, salon samochodowy. Każdy szablon powstał z naszej prawdziwej makiety tej branży, ale klientowi nie mówimy słowa «szablon».",
          "Najpierw bot pyta o język. Potem klient przysyła adres strony albo Instagram i wybiera branżę przyciskiem. Nie ma strony? Klika «Nie mam strony» i odpowiada na cztery pytania. Po minucie lub dwóch przychodzi link do makiety.",
          "Ze strony bot bierze nazwę, logo, kolory, usługi, ceny i adres. Czego nie ma na stronie, tego nie będzie na makiecie. Branży nie ma na liście? Klient klika «Inna branża», pisze ją dwoma słowami, a bot bierze najbliższą makietę.",
          "Razem z makietą przychodzą przyciski «📄 Oferta handlowa» i «🛠 Panel administracyjny». W ofercie jest cena strony i dodatki, cena obowiązuje 48 godzin. Panel pokazuje, jak klient będzie prowadził stronę. Jeśli branża nie ma panelu, nie ma też przycisku.",
          "Makieta nie przeszła kontroli? Wtedy bot obiecuje klientowi makietę od projektanta w 12 godzin. Tak samo jest, gdy klient wybrał angielski, arabski lub polski, a branża to nie stomatologia, centrum medyczne ani restauracja. Dostajesz lead (zgłoszenie klienta) z nagłówkiem «🔥 Нужен макет вручную».",
          "Kto wziął taki lead, składa makietę i wysyła ją z karty leada kanałem «Do klienta od bota studia». Zdąż w 12 godzin: klient już dostał taką obietnicę.",
          "Gotowa makieta z bota sama pojawia się na tej liście i działa jak każda nasza makieta. Klient przychodzi jako lead ze źródłem «makieta w bocie». Jedno konto w Telegramie dostaje jedną makietę, za drugim razem bot wyśle link do już zebranej.",
          "Pracownicy nie mają limitu. Napisz do bota /maket i złóż makietę dla swojego klienta. Twoja makieta nie staje się leadem.",
          "To samo można zrobić na stronie głównej, w oknie «Zbuduj makietę». Taka makieta ma etykietę «zebrana na stronie». Lead przychodzi tylko wtedy, gdy człowiek sam zostawi pod makietą Telegram lub telefon.",
          "Na stronie pracownik też nie ma limitu, jeśli w tej przeglądarce jest zalogowany do panelu. Pod gotową makietą masz przycisk «Zbuduj od nowa», klienci go nie mają. Klikniesz «Wyloguj» w panelu, a strona znów traktuje cię jak gościa.",
        ],
      },
      {
        id: "shown",
        title: "«Pokazałem makietę» prosto z listy",
        body: [
          "Pokazałeś klientowi makietę? Zaznacz to. W bloku «Do kogo wysłano» kliknij **«Pokazałem makietę»** i wybierz «na wideo» albo «na żywo». Znacznik od razu trafia do [etapów sprzedaży](/admin/stages) i do normy: 2 pokazy w tygodniu.",
          "Zaznaczasz pokaz swojemu klientowi, kierownik i właściciel zaznaczają każdy. Jeśli przycisku nie ma, wysyłka nie jest powiązana z leadem. Wtedy zaznacz pokaz w [karcie leada](#leads-sales-marks).",
        ],
      },
      {
        id: "owner",
        title: "Odpowiedzialny i wysyłka do klienta",
        body: {
          manager: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny». To osoba, która prowadzi makietę z klientem. Panel znajduje ją sam: kogo wyznaczono, kto zlecił makietę [zadaniem](#tasks-mockup-order), czyj jest lead, kto pisał do klienta albo kto zebrał makietę. Zmienić odpowiedzialnego mogą kierownik i właściciel.",
            "«wysłana klientowi 14.10 17:27» pokazuje, kiedy link pierwszy raz poszedł do klienta z konta roboczego. Wysyłki z prywatnego konta bot nie widzi i makieta zostanie «nie wysłano klientowi». Dlatego wysyłaj z konta roboczego.",
            "W bloku «Do kogo wysłano» każda wysyłka ma swój wiersz: klient, konto i godzina. Jeśli klient ma lead, jego imię prowadzi do karty.",
          ],
          head: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny». To osoba, która prowadzi makietę z klientem. Panel znajduje ją sam: kogo wyznaczono, kto zlecił makietę [zadaniem](#tasks-mockup-order), czyj jest lead, kto pisał do klienta albo kto zebrał makietę.",
            "Zmienić odpowiedzialnego możesz ty i właściciel: wybierz osobę z listy. Pierwsza pozycja listy zdejmuje wyznaczenie. Odpowiedzialny dostaje wiadomość od bota, gdy makieta [zamknie się na hasło](#mockups-auto-close).",
            "«wysłana klientowi 14.10 17:27» pokazuje, kiedy link pierwszy raz poszedł do klienta z konta roboczego. Wysyłki z prywatnego konta bot nie widzi i makieta zostanie «nie wysłano klientowi». W bloku «Do kogo wysłano» każda wysyłka ma swój wiersz: klient, konto i godzina.",
          ],
          admin: [
            "Pod każdą makietą jest wiersz «Odpowiedzialny». To osoba, która prowadzi makietę z klientem. Panel znajduje ją sam: kogo wyznaczono, kto zlecił makietę [zadaniem](#tasks-mockup-order), czyj jest lead, kto pisał do klienta albo kto zebrał makietę.",
            "Zmienić odpowiedzialnego możesz ty i kierownik: wybierz osobę z listy. Pierwsza pozycja listy zdejmuje wyznaczenie. Odpowiedzialny dostaje wiadomość od bota, gdy makieta [zamknie się na hasło](#mockups-auto-close).",
            "«wysłana klientowi 14.10 17:27» pokazuje, kiedy link pierwszy raz poszedł do klienta z konta roboczego. Wysyłki z prywatnego konta bot nie widzi i makieta zostanie «nie wysłano klientowi». W bloku «Do kogo wysłano» każda wysyłka ma swój wiersz: klient, konto i godzina.",
          ],
        },
      },
      {
        id: "password",
        title: "Hasło na dobę",
        body: [
          "**«Wygeneruj hasło»** daje hasło z pięciu cyfr. Działa 24 godziny. Potem klient znów zobaczy pole na hasło.",
          "Każde kliknięcie daje nowe hasło, stare działają do swojej godziny. Dlatego każdemu klientowi lepiej dawać osobne. Hasło widać tylko raz: zgubione, wygeneruj nowe.",
          "**«Kopiuj dla klienta»** kopiuje gotowy tekst w języku makiety: link, hasło, termin i link do warunków. Możesz go od razu wysłać. **«Kopiuj hasło»** kopiuje same cyfry.",
          "Niektóre makiety strona studia pokazuje w case studies. Gość strony otwiera je przyciskiem na stronie case study bez hasła. Klient z bezpośrednim linkiem i tak potrzebuje hasła.",
        ],
      },
      {
        id: "offer",
        title: "Promocja 48 godzin po makiecie",
        body: {
          manager: [
            "Link do makiety poszedł do klienta z konta roboczego i zaczyna się 48 godzin warunków specjalnych. Landing według makiety kosztuje 500 $ zamiast 1 700 $, strona firmowa 1 000 $ zamiast 2 500 $. Po 3 minutach bot sam pisze klientowi warunki.",
            "Niektóre makiety mają własną cenę promocji, napisaną na samej makiecie. Wtedy na liście jest «promocja 48 godz.: … $ zamiast … $», a bot podaje klientowi tylko tę cenę.",
            "Codziennie o 13:00 bot przypomina klientowi, ile zostało, i jeszcze raz 2 godziny przed końcem. W nocy do klienta nie pisze. Termin minął i ceny są znów zwykłe: tak mów klientowi.",
            "Wysłałeś klientowi cudzy projekt jako przykład? Promocji nie będzie: to nie jego makieta. Linku z prywatnego konta bot nie widzi i wtedy klient nie dostanie ani warunków, ani przypomnień.",
          ],
          head: [
            "Link do makiety poszedł do klienta z konta roboczego i zaczyna się 48 godzin warunków specjalnych. Landing według makiety kosztuje 500 $ zamiast 1 700 $, strona firmowa 1 000 $ zamiast 2 500 $. Po 3 minutach bot sam pisze klientowi warunki.",
            "Niektóre makiety mają własną cenę promocji, napisaną na samej makiecie. Wtedy na liście jest «promocja 48 godz.: … $ zamiast … $», a bot podaje klientowi tylko tę cenę.",
            "Codziennie o 13:00 bot przypomina klientowi, ile zostało, i jeszcze raz 2 godziny przed końcem. W nocy do klienta nie pisze. Ceny i terminy w przypomnieniach bot sprawdza sam, zbędnych obietnic tam nie będzie.",
            "Wysłałeś klientowi cudzy projekt jako przykład? Promocji nie będzie: to nie jego makieta. Linku z prywatnego konta bot nie widzi i wtedy klient nie dostanie ani warunków, ani przypomnień.",
            "Tobie i właścicielowi bot wysyła kartę makiety, gdy klient dostał warunki. O 13:00 przychodzi lista «🎨 Макеты клиентов». Tę samą listę otworzysz komendą /mockups w bocie.",
            "Pod kartą są dwa przyciski. «🔒 Закрыть паролем» daje hasło na dobę i tekst dla klienta. «✅ Утверждён → Егору» zatrzymuje przypomnienia i stawia zadanie zrobienia strony według makiety.",
          ],
          admin: [
            "Link do makiety poszedł do klienta z konta roboczego i zaczyna się 48 godzin warunków specjalnych. Landing według makiety kosztuje 500 $ zamiast 1 700 $, strona firmowa 1 000 $ zamiast 2 500 $. Po 3 minutach bot sam pisze klientowi warunki.",
            "Niektóre makiety mają własną cenę promocji, napisaną na samej makiecie. Wtedy na liście jest «promocja 48 godz.: … $ zamiast … $», a bot podaje klientowi tylko tę cenę.",
            "Codziennie o 13:00 bot przypomina klientowi, ile zostało, i jeszcze raz 2 godziny przed końcem. W nocy do klienta nie pisze. Ceny i terminy w przypomnieniach bot sprawdza sam, zbędnych obietnic tam nie będzie.",
            "Wysłałeś klientowi cudzy projekt jako przykład? Promocji nie będzie: to nie jego makieta. Linku z prywatnego konta bot nie widzi i wtedy klient nie dostanie ani warunków, ani przypomnień.",
            "Tobie i kierownikowi bot wysyła kartę makiety, gdy klient dostał warunki. O 13:00 przychodzi lista «🎨 Макеты клиентов». Tę samą listę otworzysz komendą /mockups w bocie.",
            "Pod kartą są dwa przyciski. «🔒 Закрыть паролем» daje hasło na dobę i tekst dla klienta. «✅ Утверждён → Егору» zatrzymuje przypomnienia i stawia zadanie zrobienia strony według makiety.",
          ],
        },
      },
      {
        id: "scan",
        title: "Skan makiet: co przeszło bokiem",
        body: {
          manager: [
            "Dwa razy dziennie, o 09:00 i 15:00, bot szuka naszych linków do makiet w korespondencji kont roboczych z 14 dni. Jeśli link poszedł do klienta, a na liście go nie ma, bot go dopisze.",
            "Wstecz bot do klienta nie pisze. Link poszedł ponad 3 godziny temu? Warunków i przypomnień nie będzie, powiedz klientowi sam. Wysyłki z prywatnego konta skan też nie widzi.",
          ],
          head: [
            "Dwa razy dziennie, o 09:00 i 15:00, bot szuka naszych linków do makiet w korespondencji kont roboczych z 14 dni. Jeśli link poszedł do klienta, a na liście go nie ma, bot go dopisze.",
            "Wstecz bot do klienta nie pisze. Link poszedł ponad 3 godziny temu? Warunków i przypomnień nie będzie, a ty dostaniesz kartę «🔎 Макет найден сканом». Ponad 48 godzin temu? Promocja już się skończyła.",
            "Jeśli skan coś znalazł, ty i właściciel dostajecie wiersz «🔎 Скан макетов». Nic nie znalazł, a bot milczy.",
          ],
          admin: [
            "Dwa razy dziennie, o 09:00 i 15:00, bot szuka naszych linków do makiet w korespondencji kont roboczych z 14 dni. Jeśli link poszedł do klienta, a na liście go nie ma, bot go dopisze.",
            "Wstecz bot do klienta nie pisze. Link poszedł ponad 3 godziny temu? Warunków i przypomnień nie będzie, a ty dostaniesz kartę «🔎 Макет найден сканом». Ponad 48 godzin temu? Promocja już się skończyła.",
            "Jeśli skan coś znalazł, ty i kierownik dostajecie wiersz «🔎 Скан макетов». Nic nie znalazł, a bot milczy.",
          ],
        },
      },
      {
        id: "closed",
        title: "«otwarta przez link» i «na hasło»",
        body: {
          manager: [
            "«otwarta przez link» znaczy, że makietę otworzy każdy, kto ma link. Pierwsze hasło ją zamyka. Potem hasło jest potrzebne wszystkim, nawet tym, którzy dostali link wcześniej.",
            "«na hasło» znaczy, że makieta jest już zamknięta. Z panelu nie da się jej znów otworzyć bez hasła. Jeśli to potrzebne, powiedz właścicielowi.",
          ],
          head: [
            "«otwarta przez link» znaczy, że makietę otworzy każdy, kto ma link. Pierwsze hasło ją zamyka. Potem hasło jest potrzebne wszystkim, nawet tym, którzy dostali link wcześniej.",
            "«na hasło» znaczy, że makieta jest już zamknięta. Z panelu nie da się jej znów otworzyć bez hasła. Jeśli to potrzebne, powiedz właścicielowi.",
          ],
          admin: [
            "«otwarta przez link» znaczy, że makietę otworzy każdy, kto ma link. Pierwsze hasło ją zamyka. Potem hasło jest potrzebne wszystkim, nawet tym, którzy dostali link wcześniej.",
            "«na hasło» znaczy, że makieta jest już zamknięta. Twoje stałe hasło na makiecie działa razem z hasłami na dobę. Przycisku, który znów otwiera makietę bez hasła, w panelu nie ma: robi to programista.",
          ],
        },
      },
      {
        id: "auto-close",
        title: "24 godziny przez link, potem na hasło",
        body: [
          "Każda makieta jest otwarta przez link 24 godziny, potem zamyka się sama. Czas liczy się od pierwszej wysyłki do klienta. Jeśli wysyłki nie było, to od pierwszego otwarcia przez klienta.",
          "W wierszu makiety widać, ile zostało: «otwarta jeszcze 5 godz., potem na hasło». Po zamknięciu jest tam napis «zamknięta na hasło od …: minęły 24 godziny». Makiety, które właściciel kazał trzymać otwarte, i projekty witryny same się nie zamykają.",
          "Gdy makieta się zamknie, [odpowiedzialny](#mockups-owner) dostaje wiadomość z przyciskiem «🔑 Сгенерировать пароль». Kliknij go, a bot wyśle hasło na dobę i gotowy tekst dla klienta.",
        ],
      },
      {
        id: "open",
        title: "Otworzyć samemu",
        body: [
          "**«Otwórz»** otwiera makietę w nowej karcie. Prototyp z devuz.studio otworzy ci się bez hasła, nawet zamknięty. To się nie liczy jako otwarcie przez klienta.",
          "Zamknięty projekt witryny poprosi o kod. Pasuje hasło na dobę wydane tutaj.",
          "**«Kopiuj link»** kopiuje link bez hasła. Jeśli makieta jest zamknięta, wyślij klientowi tekst z «Kopiuj dla klienta»: jest w nim też hasło.",
        ],
      },
    ],
  },

  /* ── Кандидаты ────────────────────────────────────────────────────── */
  "/admin/candidates": {
    what: "Tu analizuje się CV przed rozmową. Wgrywasz PDF, a panel pisze, czy warto zatrudnić osobę i o co ją zapytać. Dział widzą tylko kierownik i właściciel, bo są w nim cudze dane osobowe.",
    items: [
      {
        id: "upload",
        title: "Wgraj CV",
        body: [
          "W polu «Na jakie stanowisko patrzymy» wpisz wakat. Wybierz plik w «CV w PDF» i kliknij **«Analizuj»**. Analiza trwa do minuty.",
          "Potrzebny jest PDF, z którego da się skopiować tekst, do 8 MB. Czytane jest pierwsze 12 stron. Skanu ani zdjęcia panel nie przeczyta i powie o tym.",
        ],
      },
      {
        id: "result",
        title: "Co jest w analizie",
        body: [
          "Na górze werdykt: «zatrudnić», «zatrudnić warunkowo» albo «nie zatrudniać», i dlaczego. Niżej «Mocne strony», «Przeszkody» (co niepokoi), «Co CV mówi wprost» i «Zapytaj na rozmowie». Na końcu «Jak sprawdzić w praktyce»: zadanie na jeden płatny dzień próbny.",
          "Analiza pomaga przygotować się do rozmowy. Decyzję podejmujesz Ty.",
        ],
      },
      {
        id: "privacy",
        title: "Dane osobowe",
        body: [
          "Sam plik nie jest przechowywany. Zostają imię, stanowisko, werdykt i analiza. Przycisk «Usuń analizę» kasuje ją na stałe.",
          "Wiek, płeć, stan cywilny, narodowość, religia, wygląd i miejsce urodzenia nie biorą udziału w ocenie. Jeśli analiza mimo to się na nich oparła, nie zostanie zapisana. Panel poprosi, żeby spróbować jeszcze raz.",
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
    what: "Liczby dla wszystkich leadów (zgłoszeń klientów) studia: ile przychodzi, skąd i ile wygrywamy. Zaglądaj tu raz w tygodniu, żeby zobaczyć, gdzie gubimy klientów.",
    items: [
      {
        id: "tiles",
        title: "Główne liczby",
        body: [
          "**«leadów łącznie»** pokazuje, ile zgłoszeń jest w bazie, a **«przyjęte do pracy»** pokazuje, ile z nich ma prowadzącego menedżera.",
          "**«odsetek wygranych»** liczy się tylko z zamkniętych transakcji: wygrane dzielimy przez wygrane i przegrane. Lead w toku nie jest jeszcze przegrany. Dlatego nie porzucaj leada po cichu, tylko ustaw mu status «przegrany».",
          "**«mediana do przejęcia»** pokazuje, ile zwykle mija od zgłoszenia do kliknięcia «Przejmij». Jeden lead zapomniany na weekend prawie jej nie przesuwa. Gdy lead przejdzie do kolegi, czas liczy się od nowa.",
        ],
      },
      {
        id: "panels",
        title: "Bloki poniżej",
        body: [
          "«Napływ w tygodniach» pokazuje zgłoszenia z 12 tygodni, tydzień zaczyna się w poniedziałek. «Jakość leadów» dzieli zgłoszenia na litery A, B, C i D.",
          "W «O co pytają» jeden lead może stać w kilku wierszach, więc suma jest większa niż liczba leadów.",
          "«Rabat 30%» liczy zgłoszenia z rabatem. «pierwsza minuta» znaczy, że klient napisał na czacie, gdy na stronie leciał licznik. «gwarancja 20 sekund» znaczy, że nie odpisaliśmy w 20 sekund.",
        ],
      },
      {
        id: "people",
        title: "Tabela według osób",
        body: {
          manager: [
            "Tabelę według osób widzą tylko kierownik i właściciel. Swoje liczby sprawdzisz na «Pulpicie»: «Moja praca», «Moje etapy w tym tygodniu» i [«Plan i wykonanie»](#hq-week).",
          ],
          head: [
            "Tabela «Mój zespół» pokazuje ciebie i twoich menedżerów: «W toku», «Wygrane», «Przegrane» i «Łącznie» za cały czas. Lead liczy się temu, kto ma go teraz. Menedżerowie tej tabeli nie widzą.",
          ],
          admin: [
            "Tabela «Według menedżerów» pokazuje wszystkich aktywnych pracowników za cały czas. Lead liczy się temu, kto ma go teraz. Kierownik widzi tylko siebie i swój zespół, menedżerowie nie widzą tabeli wcale.",
          ],
        },
      },
      {
        id: "plans",
        title: "Gdzie są plany",
        body: {
          manager: [
            "W tej sekcji nie ma planów. «Plan i wykonanie» jest na dole [«Pulpitu»](#hq-week). Swój plan kontaktów widzisz w sekcji [«Zimne kontakty»](/admin/prospect).",
          ],
          head: [
            "W tej sekcji nie ma planów. «Plan i wykonanie» jest na dole [«Pulpitu»](#hq-week). Plan kontaktów menedżerom ustawiasz w sekcji [«Zespół»](/admin/team).",
          ],
          admin: [
            "W tej sekcji nie ma planów. «Plan i wykonanie» jest na dole [«Pulpitu»](#hq-week). Plan kontaktów ustawia się w sekcji [«Zespół»](/admin/team).",
          ],
        },
      },
    ],
  },

  /* ── Трафик ───────────────────────────────────────────────────────── */
  "/admin/stages": {
    what: "Firmy i leady według etapów sprzedaży, od pierwszej wiadomości do płatności. Tu widać, gdzie transakcje utykają i kogo czas popchnąć dalej.",
    items: [
      {
        id: "list",
        title: "Lista etapu: jak czytać",
        body: {
          manager: [
            "Na górze wybierz etap, od «napisaliśmy» do «płatność», i okres: «w 7 dni», «7 dni wcześniej», «w 30 dni» albo «od poniedziałku».",
            "Niżej pojawią się firmy, które doszły do tego etapu. W wierszu widać, czyj to lead, kiedy doszedł i czy jest już następny etap (jest zielony).",
            "Widzisz tylko swoje transakcje: te, które prowadzisz, i te, gdzie pokaz albo cenę oznaczyłeś ty. Kliknij wiersz, a otworzy się karta. Te same liczby z tygodnia są na «Pulpicie» w bloku [«Moje etapy w tym tygodniu»](#hq-my-stages).",
          ],
          head: [
            "Na górze wybierz etap, od «napisaliśmy» do «płatność», i okres: «w 7 dni», «7 dni wcześniej», «w 30 dni» albo «od poniedziałku».",
            "Niżej pojawią się firmy, które doszły do tego etapu. W wierszu widać, czyj to lead, kiedy doszedł i czy jest już następny etap (jest zielony).",
            "Widzisz transakcje całego zespołu. Kwot pieniędzy tu nie ma. Te same liczby z 7 i 30 dni są na «Pulpicie» w bloku [«Etapy sprzedaży»](#hq-stages).",
          ],
          admin: [
            "Na górze wybierz etap, od «napisaliśmy» do «płatność», i okres: «w 7 dni», «7 dni wcześniej», «w 30 dni» albo «od poniedziałku».",
            "Niżej pojawią się firmy, które doszły do tego etapu. W wierszu widać, czyj to lead, kiedy doszedł i czy jest już następny etap (jest zielony).",
            "Widzisz transakcje całego zespołu. Na liście nie ma kwot. Kwoty płatności widzisz tylko ty, na «Pulpicie» w bloku [«Etapy sprzedaży»](#hq-stages).",
          ],
        },
      },
      {
        id: "marks",
        title: "Dlaczego etap jest pusty",
        body: [
          "Prawie wszystkie etapy panel ustawia sam. Pokazu makiety nie widzi. Pokazałeś makietę na wideo albo na żywo? Kliknij «Pokazałem makietę» w sekcji [«Makiety»](/admin/mockups), w «Moje makiety» na «Pulpicie» albo w [karcie leada](#leads-sales-marks).",
          "Cenę panel oznacza sam, gdy bot wysyła ją klientowi po «+». Podałeś cenę sam, w wiadomości albo przez telefon? Kliknij w karcie leada «Podałem cenę» i wpisz kwotę. Bez oznaczenia etap zostanie pusty, a sprzedaż wyda się gorsza, niż jest.",
          "Jeśli wierszy jest więcej niż 200, widać pierwsze 200: wybierz krótszy okres. Klienci, którzy przyszli sami (zgłoszenie ze strony, z czatu albo z bota), nie trafiają do «napisaliśmy». Od razu liczą się jako ci, którzy odpisali.",
        ],
      },
    ],
  },

  "/admin/traffic": {
    what: "Tu widać, ile osób wchodzi na stronę devuz.studio i skąd przychodzą. Liczby pochodzą z Yandex Metryki i Google Analytics. Zgłoszenia przychodzą ze strony: mniej wejść dziś oznacza mniej zgłoszeń za tydzień lub dwa. Dział widzą właściciel i kierownik.",
    items: [
      {
        id: "numbers",
        title: "Co znaczą liczby",
        body: [
          "W prawym górnym rogu wybierz okres: «7 dni», «30 dni» albo «90 dni». Strzałka przy liczbie porównuje ją z takim samym okresem wcześniej. Zielona strzałka znaczy lepiej, żółta gorzej, a «nowe» znaczy, że wcześniej było zero.",
          "«wizyty» pokazują, ile razy wchodzono na stronę. Jedna osoba rano i wieczorem to dwie wizyty. «użytkownicy» to różne osoby, a dokładniej różne przeglądarki. «odsłony» liczą wszystkie otwarte strony.",
          "«odrzucenia» to odsetek wizyt, w których ktoś otworzył jedną stronę i od razu wyszedł. Tu wzrost jest zły, a strzałka będzie żółta. «śr. wizyta» pokazuje, ile średnio trwa wizyta.",
          "Niżej są «Wizyty dziennie», «Skąd przychodzą» i «Strony wejścia». W Google źródła są po angielsku: «Organic Search» to wyszukiwarka, «Direct» to wejścia bezpośrednie, «Referral» to przejścia z innych stron. Liczby odświeżają się co 10 minut.",
        ],
      },
      {
        id: "two-sources",
        title: "Dlaczego Metryka i Google pokazują co innego",
        body: [
          "Metryka i Google liczą wizyty po swojemu, więc liczby się nie zgadzają. To normalne i nie trzeba ich sumować. Patrz, w którą stronę idą obie: rosną razem, czyli ludzi naprawdę przybyło.",
          "Wejście na stronę to jeszcze nie klient. Ile osób napisało, sprawdzisz w dziale [«Statystyki»](/admin/stats). Wejść więcej, a zgłoszeń brak? Ludzie nie znajdują na stronie tego, po co przyszli.",
        ],
      },
      {
        id: "connect",
        title: "Jak się podłącza",
        body: {
          head: [
            "Metrykę i Google podłącza właściciel. Ty masz tu tylko liczby i nie zepsujesz stąd podłączenia.",
            "Widzisz, że nic nie jest podłączone albo Google przestał wpuszczać? Powiedz właścicielowi, zajmie mu to minutę. Brak odpowiedzi zwykle mija sam: odśwież stronę za minutę.",
          ],
          admin: [
            "Metryka podłącza się tokenem Yandex. Dopóki nie jest podłączona, kroki są opisane na karcie «Yandex Metryka». Token trafia do ustawień serwera albo do sejfu sekretów.",
            "Google Analytics podłącza się logowaniem przez twoje konto Google. Raz utwórz aplikację w Google Cloud według kroków z karty, wklej Client ID i Client secret i kliknij «Zapisz i zaloguj przez Google». Nie odznaczaj «See and download your Google Analytics data»: panel tylko czyta liczby.",
            "Google przestał wpuszczać? Kliknij «Zaloguj przez Google». Najczęściej aplikacja w Google Cloud została w trybie «Testing», gdzie logowanie żyje 7 dni: kliknij tam «Publish app». Konto zmienisz linkiem «zaloguj ponownie» pod liczbami.",
          ],
        },
      },
    ],
  },

  /* ── Договоры ─────────────────────────────────────────────────────── */
  /* ── Reklamy ──────────────────────────────────────────────────────── */
  "/admin/outside": {
    what: "Tu są szkice artykułów o studiu dla vc.ru, Dzen i Tenchat. Raz w tygodniu program pisze po jednym na każdą platformę. Publikujesz go z konta studia i wklejasz tu link. Dzięki temu dowiadują się o nas właściciele firm w Rosji i WNP, a strona dostaje linki.",
    items: [
      {
        id: "how",
        title: "Jak to działa",
        body: [
          "Raz w tygodniu, w dzień czasu Taszkentu, każda platforma dostaje szkic. Temat dobiera się według tego, czego szukają w Rosji. Fakty pochodzą z naszych case studies na stronie.",
          "Zanim szkic tu trafi, przechodzi kontrolę. Nie ma w nim cen, procentów ani zmyślonych liczb, a linki prowadzą tylko na naszą stronę. Nie przeszedł w czterech próbach? Szkicu nie będzie, a właściciel i kierownik dostaną linijkę w raporcie.",
          "Nowy szkic platforma dostaje, gdy poprzedni jest opublikowany albo pominięty. Publikuje człowiek. Robot, który sam loguje się na konto, łamie zasady platform, a konto dostaje bana.",
        ],
      },
      {
        id: "publish",
        title: "Jak opublikować",
        body: [
          "W bloku «Czekają na publikację» przy szkicu są przyciski. «Kopiuj tytuł» i «Kopiuj» wkładają tekst do schowka. Wkleił się krzywo? Kliknij «Kopiuj bez formatowania».",
          "Przycisk «Otwórz vc.ru» (albo innej platformy) otwiera ją w nowej karcie. Zaloguj się na konto studia, wklej tytuł i tekst, dodaj obrazek i opublikuj. Szkic przeczytasz wcześniej przyciskiem «Pokaż tekst».",
          "Skopiuj adres opublikowanego artykułu, wklej go w «Link do opublikowanego artykułu» i kliknij «Opublikowałem». Szkic się nie nadaje? Kliknij «Pomiń», za tydzień przyjdzie nowy.",
        ],
      },
      {
        id: "links",
        title: "Opublikowane i sprawdzanie linku",
        body: [
          "W bloku «Opublikowane» są wydane artykuły. 10 minut po «Opublikowałem», a potem raz w tygodniu panel sam otwiera artykuł i szuka linku do naszej strony. Na górze działu widać, ile artykułów wyszło w 30 dni.",
          "Pod artykułem pojawia się wynik. Link, który przekazuje moc w wyszukiwarce, pomaga stronie w Google i Yandex. Oznaczenie nofollow znaczy, że mocy nie ma, ale ludzie w link klikają. Linku nie znaleziono albo strona się nie otworzyła? Artykuł mógł zostać usunięty albo schowany za logowaniem.",
        ],
      },
      {
        id: "auto",
        title: "Publikuje się samo: Telegraph, VK, kanał Telegram",
        roles: ["admin", "head"],
        body: [
          "W bloku «Publikuje się samo» są platformy, na których artykuł wychodzi bez człowieka. Szkic przechodzi tę samą kontrolę i od razu pojawia się w «Opublikowane». Nie wyszło? Wróci do «Czekają na publikację» z powodem i opublikuje się go ręcznie.",
          "Telegraph niczego nie wymaga. Konto studia zakłada się tam samo przy pierwszym artykule.",
          "VK i kanał Telegram idą przez serwis Postiz. Raz zarejestruj się tam, podłącz kanały przyciskiem «Add Channel» i weź klucz w Settings → Developers → Public API. Wklej go w «Klucz API Postiz» i kliknij «Zapisz i sprawdź»: klucz zapisze się tylko wtedy, gdy Postiz go przyjął.",
        ],
      },
      {
        id: "publisher",
        title: "Kto publikuje",
        roles: ["admin", "head"],
        body: [
          "W bloku «Kto publikuje» wybierz, komu bot wyśle kartę o gotowych szkicach. Nikogo nie wybrano? Karta trafi do właściciela i kierownika.",
          "Na liście są ci, którym ten dział jest otwarty. Menedżerowi otwiera go właściciel ptaszkiem w [«Zespół»](/admin/team) → «Działy». Loginów do platform nie wpisuje się do panelu, ma je ten, kto publikuje.",
        ],
      },
    ],
  },
  "/admin/ads": {
    what: "To autopilot reklam w Google Ads i Yandex Direct dla agencji i marketerów. Raz na dobę przegląda raporty konta reklamowego i proponuje zmiany z powodem i liczbami. Sam niczego nie zmienia, dopóki człowiek nie kliknie «Akceptuj». Dział widzą właściciel i kierownik.",
    items: [
      {
        id: "what",
        title: "Co robi autopilot",
        body: [
          "**Wykluczające słowa.** Autopilot szuka słów w zapytaniach, na które poszły pieniądze, a zgłoszeń nie było: «za darmo», «pobierz», «praca». Takie słowa proponuje wykluczyć. Słów z fraz kampanii nie rusza.",
          "**Budżet.** Pieniądze przechodzą z kampanii z drogim zgłoszeniem do kampanii z tanim, jeśli ta dobija do swojego budżetu. Propozycja pojawia się tylko wtedy, gdy różnica jest niemal na pewno prawdziwa. Łączny budżet się nie zmienia.",
          "**Testy reklam.** Jeśli w grupie jest jedna reklama, autopilot pisze drugą. Po 10-45 dniach zostaje ta, która daje więcej zgłoszeń, a druga idzie na pauzę.",
          "Stawek za frazy autopilot nie rusza. Prowadzą je same Google i Yandex.",
        ],
      },
      {
        id: "setup",
        title: "Jak założyć konto agencji",
        body: [
          "Po lewej jest lista kont. Kliknij «Nowe konto», wpisz nazwę, wybierz, kto to jest, i język. Potem kliknij «Utwórz».",
          "W bloku «Osoby» dodaj ludzi agencji: Telegram id, imię i przycisk «Dodaj». Logują się na devuz.studio/ads przez bota studia i dostają powiadomienia. Usuniesz osobę, a jej logowanie od razu przestaje działać.",
          "Kliknij «Dodaj konto reklamowe» i podaj platformę, nazwę oraz login w Direct albo numer konta Google. Potem kliknij «Połącz»: właściciel reklam da dostęp na stronie Yandex albo Google. Za parę minut pojawią się pierwsze propozycje.",
        ],
      },
      {
        id: "proposals",
        title: "Propozycje: «Akceptuj» i «Odrzuć»",
        body: [
          "W bloku «Propozycje» jest to, co autopilot znalazł w 30 dni. «Akceptuj» od razu zmienia konto reklamowe, «Odrzuć» usuwa propozycję. Po 14 dniach nierozstrzygnięta propozycja się przedawnia.",
          "Przed zmianą autopilot jeszcze raz sprawdza konto. Jeśli coś zmieniono tam ręcznie, zmiana się nie zastosuje, a pod nią pojawi się powód. To ochrona, a nie awaria.",
          "«Odśwież teraz» pobierze raporty od razu, zwykle w 1-2 minuty. Wynik przyjdzie też na Telegram.",
        ],
      },
      {
        id: "limits",
        title: "Tryb, limity i hamulec",
        body: [
          "Blok «Tryb i limity». Na początku autopilot tylko proponuje, a decyduje człowiek. Drugi tryb, «Sam, w granicach limitów», stosuje propozycje sam i pisze o tym na Telegram.",
          "Limity mówią, o ile procent można przesunąć budżet kampanii naraz (najwyżej 30) i ile zmian autopilot zrobi sam w ciągu doby. Tam też są słowa, których nie wolno wykluczać: marka, miasto, usługa.",
          "W każdym trybie łączny budżet nie rośnie, a usuwania nie ma, tylko pauza. «Hamulec: zatrzymaj wszystkie zmiany» zatrzymuje wszystko, nawet «Akceptuj». Cofnąć zrobione można i przy nim.",
        ],
      },
      {
        id: "journal",
        title: "Dziennik, cofanie i raport tygodnia",
        body: [
          "W «Dziennik» jest każda zmiana: kiedy, kto, co było i dlaczego. Zmiany autopilota mają oznaczenie «sam». «Cofnij» przywraca stan jednym kliknięciem.",
          "Blok «Z 7 dni» pokazuje, ile zmian zastosowano i ile pieniędzy miesięcznie nie idzie już na śmieciowe zapytania. W poniedziałki po 09:00 ludzie konta dostają raport tygodnia. «Wyślij raport tygodnia na Telegram» wyśle go tobie teraz.",
        ],
      },
      {
        id: "alerts",
        title: "Alarmy",
        body: [
          "Raz na dobę autopilot porównuje wczorajszy dzień ze zwykłym. Alarm pojawi się, gdy kampania nic nie wydała, wydatki wzrosły dwukrotnie bez nowych zgłoszeń, zgłoszeń nie ma wcale albo platforma odrzuciła reklamę. Zero zgłoszeń przy zwykłych wydatkach często znaczy, że zepsuł się formularz na stronie.",
          "Alarm przychodzi ludziom konta na Telegram raz i widać go w żółtym bloku «Alarmy» na górze. Powód zniknął, a alarm znika sam. Autopilot po alarmie niczego nie zmienia.",
        ],
      },
      {
        id: "stub",
        title: "Atrapa: testy bez konta reklamowego",
        body: [
          "Platforma «Atrapa (testy)» to konto szkoleniowe ze zmyślonymi liczbami. Działa tam wszystko, ale prawdziwe konta się nie zmieniają. Wygodnie pokazać ją agencji przed podłączeniem.",
          "Przycisk «Przewiń 7 dni» jest tylko w atrapie. Dodaje tydzień wyświetleń, żeby test reklam szybciej dotarł do wyniku.",
        ],
      },
      {
        id: "keys",
        title: "Klucze i włączanie",
        roles: ["admin"],
        body: [
          "Codzienne odświeżanie włącza osobne ustawienie na serwerze. Bez niego działają tylko przyciski.",
          "Do przycisku «Połącz» potrzebne są klucze aplikacji Yandex Direct i Google Ads w sejfie sekretów. Tokeny klientów są przechowywane w postaci zaszyfrowanej. Po zmianie klucza szyfrowania wszystkie konta trzeba podłączyć od nowa.",
        ],
      },
      {
        id: "google",
        title: "Google: klucze i planer słów kluczowych",
        roles: ["admin", "head"],
        body: [
          "Planer słów kluczowych Google pokazuje, ile razy w miesiącu szuka się frazy. Program, który pisze artykuły na stronę i platformy, bierze jego podpowiedzi razem z Google Trends i Wordstatem. Bez planera artykuły wychodzą tak samo, tylko bez jego danych.",
          "Podłącza właściciel albo kierownik, jeden raz. Dopóki planer nie działa, kroki są opisane w bloku «Klucze aplikacji Google». Tam też wklej Client ID i sekret i kliknij «Zapisz».",
          "Google otwiera planer projektowi z poziomem dostępu Basic. Dopóki poziom jest niższy, przycisk «Sprawdź» to powie.",
          "Potem załóż konto studia, dodaj konto reklamowe Google z numerem z 10 cyfr i kliknij «Połącz». W bloku «Planer słów kluczowych» wybierz je i kliknij «Sprawdź». Odpowiedź, że działa, i lista częstych zapytań znaczą, że wszystko gotowe.",
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
