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
          "Każde konto ma własny limit pierwszych wiadomości do nowych osób na godzinę: główne — 3, nowe — też 3. Świeżemu numerowi przez pierwszy tydzień lepiej ustawić 1–2 w polu «Wiadomości na godzinę»: nowe konto Telegram ogranicza szybciej. Pierwsze wiadomości wychodzą codziennie od 07:30 do 20:30 czasu taszkenckiego — dodane w nocy czekają i wychodzą rano; korespondencja z tymi, którzy już odpisali, toczy się o każdej porze i bez limitu. Na górze sekcji — ile wychodzi ze wszystkich razem; ta sama liczba stoi nad listą w [Kontaktach](/admin/prospect).",
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
          "Tym, którzy odpowiedzieli na powitanie po rosyjsku, wychodzi kółko — krótkie wideo od studia z ofertą: darmowa makieta strony głównej w 12 godzin i prośba o wysłanie «+» ([kontakt w dwóch krokach](#prospect-hello)). Tym, którzy odpowiedzieli w innym języku, wychodzi wiadomość w ich języku, bez kółka. Bot bierze ostatnie kółko z «Zapisanych» tego konta firmowego, z którego szedł kontakt, i wysyła kopię, bez oznaczenia „przekazano”.",
          "Nie trzeba ręcznie zapisywać kółka w «Zapisanych» każdego konta: wgraj plik raz w bloku **«Kółko do kontaktów»** na górze tej strony — MP4, kwadratowe wideo do minuty (kółko zapisane z Telegrama pasuje bez zmian) — i kliknij **«Wgraj kółko»**. W ciągu dziesięciu minut bot sam zapisze je w «Zapisanych» konta głównego i każdego podłączonego. Tam też widać, które kółko wychodzi teraz, kiedy i przez kogo zostało wgrane; nowe zastępuje je na wszystkich kontach. Kto wgrał — w dzienniku działań. Można też bez pliku: przekaż kółko botowi studia na prywatnym czacie, bot odpowie «Кружок сохранён для касаний» i dalej wszystko działa tak samo. Kółko mogą zmieniać właściciel i kierownik.",
          "Przy każdym koncie jest tu napisane, czy kółko jest: «Kółko do wiadomości: jest, zapisane …» albo «Brak kółka» — wtedy zamiast kółka wyjdzie wiadomość. Bot zagląda do «Zapisanych» co dziesięć minut, więc wiersz nie odświeży się od razu. Zapisałeś nowe kółko w «Zapisanych» ręcznie — bot je weźmie: zawsze bierze ostatnie. Jeśli kółko nie wyszło, bo go nie ma, mówi o tym też wiersz w raporcie o 18:00.",
        ],
      },
      {
        id: "stop",
        title: "Wstrzymanie, ograniczenie i odłączenie",
        body: [
          "**«Wstrzymaj»** — konto przestaje pisać pierwsze wiadomości, ale odpowiada w już rozpoczętych rozmowach. **«Przywróć do pracy»** — znowu pisze.",
          "Jeśli Telegram ograniczy konto za masową wysyłkę, samo staje na dobę: pierwsze wiadomości wychodzą z pozostałych, korespondencja trwa, a przy koncie widać, do kiedy stoi. Wiadomość, przy której to się stało, wraca do kolejki i wyjdzie z innego konta. Jeśli nie ma już kto pisać, kolejka jest zdejmowana w całości, jak wcześniej. Co godzinę każde konto, także główne, samo pyta @SpamBot, czy nie jest ograniczone. Jeśli Telegram podał termin dłuższy niż doba, konto stoi do tego terminu. O ograniczeniu bot pisze do całego zespołu: które konto i do której godziny stoi, ile i czyich wiadomości czeka właśnie na nie i co robić — pisać do klientów z prywatnego konta albo z innego konta roboczego. Gdy ograniczenie zniknie, bot napisze, że konto znowu pisze. Żeby wiadomości menedżera nie czekały na ograniczone konto, przypisz go jeszcze do jednego — punkt [kto pracuje na koncie](#accounts-staff).",
          "**«Odłącz»** — skaut zamyka sesję w Telegramie (zniknie z urządzeń na telefonie) i usuwa ją u nas. Rozmowy rozpoczęte z tego konta zostają w «Kontaktach», ale dalej odpowiadasz w nich sam: z tego numeru nie ma już kto pisać.",
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
          "Najnowsze makiety są na górze. Pole wyszukiwania szuka po nazwie, stronie i branży, a przyciski «Wszystkie», «Zrobione ręcznie» i «Witryna» zostawiają na liście tylko swoje. Liczba na przycisku to liczba makiet w tej grupie.",
        ],
      },
      {
        id: "password",
        title: "Hasło na dobę",
        body: [
          "**«Wygeneruj hasło»** daje nowe hasło z pięciu cyfr. Działa 24 godziny, potem przestaje. Dostęp klienta kończy się razem z hasłem: kto już je wpisał, po dobie też zobaczy pole na hasło.",
          "Każde kliknięcie daje nowe hasło. Wydane wcześniej nie są anulowane i działają do swojej godziny, dlatego każdemu klientowi lepiej dać jego własne. «hasło klienta do …» w wierszu pokazuje, do której godziny działa ostatnie wydane.",
          "Hasło pokazuje się tylko raz, zaraz po kliknięciu. U nas zapisany jest tylko jego odcisk, hasła nie da się potem odczytać. Zgubione? Wygeneruj nowe.",
          "**«Kopiuj dla klienta»** kopiuje gotowy tekst w języku makiety: link, hasło, do której godziny czasu Taszkentu działa i link do warunków korzystania z makiety. Można go od razu wysłać klientowi. **«Kopiuj hasło»** kopiuje tylko pięć cyfr.",
        ],
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
    what: "Praca, na którą już się umówiliśmy: na jakim etapie, do kiedy, na jaką kwotę, kto prowadzi i ile klient zapłacił. Od projektu zależą naliczenia w «Finansach»: bez projektu z kwotą nikt nie dostanie pieniędzy za transakcję.",
    items: [
      {
        id: "tasks",
        title: "Zadania w projekcie",
        body: [
          "W karcie projektu, zaraz pod nazwą, jest **«Zadania w projekcie»**: wszystkie zadania do niego przypisane — od kogo, dla kogo, termin i co się z nimi teraz dzieje. Otwarte na górze, od najbliższego terminu, zamknięte niżej. Jeśli zadanie jest dla Ciebie albo Ty je zleciłeś, przyciski są tu te same co na stronie głównej.",
          "Żeby zlecić zadanie w projekcie, kliknij **«Zleć zadanie»** po prawej: otworzy się strona główna z formularzem, w którym ten projekt jest już wybrany. Zadanie można przypisać do projektu tylko wtedy, gdy projekt jest założony tutaj, w «Projektach» — dlatego najpierw zakłada się projekt klienta. Więcej o zadaniach — w punkcie [zadania](#leads-tasks).",
        ],
      },
      {
        id: "create",
        title: "Załóż projekt",
        body: {
          manager: [
            "Klient zgodził się na współpracę — załóż projekt: blok «Nowy projekt», nazwa, klient, kwota, termin i «Utwórz».",
            "**Osobą prowadzącą zostaje ten, kto założył projekt.** Naliczenia idą do osoby prowadzącej, a zmienić ją może tylko właściciel — dlatego zakładaj swój projekt sam, nie proś o to kolegi.",
            "Lista: «N dni na tym etapie», «prowadzi …», «termin …» i «po terminie», jeśli termin minął. «pokaż zamknięte» — zakończone i anulowane.",
          ],
          head: [
            "Projekt może założyć każdy — i osobą prowadzącą zostaje ten, kto go założył. Naliczenia idą do osoby prowadzącej (a Tobie 5% z projektów Twojego zespołu), a zmienić osobę prowadzącą może tylko właściciel. Pilnuj, żeby menedżerowie zakładali swoje projekty sami.",
            "Lista jest wspólna dla wszystkich: etap, dni na nim, osoba prowadząca, termin i «po terminie».",
          ],
          admin: [
            "Pracownik, który zakłada projekt, sam zostaje osobą prowadzącą. Gdy zakładasz Ty, w pierwszym polu wybierz, **kto prowadzi**: to jemu idą naliczenia. Wybierzesz siebie — zespół nie dostanie naliczeń z projektu, a właściciel dostaje resztę, a nie procent. Osobę prowadzącą możesz zmienić w każdej chwili: [«Dane projektu»](#projects-data) → «Prowadzi»; w karcie projektu, który prowadzisz Ty, wisi żółta podpowiedź.",
            "Na liście widać, ile dni projekt jest na danym etapie i czy nie minął mu termin.",
          ],
        },
      },
      {
        id: "stages",
        title: "Etapy",
        body: [
          "Po kolei: «brief» → «umowa» → «design» → «programowanie» → «odbiór» → «uruchomienie» → «wsparcie». Osobno: «wstrzymany», «zamknięty», «anulowany».",
          "Etap zmienia tylko właściciel: etap to obietnica dla klienta, a nie notatka o samopoczuciu wykonawcy. Każda zmiana trafia do dziennika razem z tym, ile dni projekt stał na poprzednim etapie.",
          "Na pieniądze wpływa tylko «anulowany» — wtedy naliczenia mają status «nie nalicza się». «Zamknięty» i «anulowany» blokują też osobie prowadzącej edycję kwoty.",
        ],
      },
      {
        id: "card",
        title: "Karta projektu",
        body: {
          manager: [
            "Od góry: «Etap», «Kosztorys», «Pieniądze», «Dane projektu», «Umowa».",
            "**«Kosztorys»** — wybierz kategorię i termin w tygodniach, a panel policzy «nie mniej niż» (próg), «do» i termin. Próg to kwota, poniżej której projekt się nie zwraca; zejść niżej może tylko właściciel.",
            "**«Pieniądze»**: «Rodzaj transakcji» — «nowy klient» albo «dosprzedaż» (od tego zależy Twój procent, zob. [Finanse](/admin/finance)) i «Kwota z umowy, $». Wpisuj pełne dolary, bez «$» i centów, inaczej pole się wyczyści. Kwotę edytujesz Ty, dopóki w projekcie nie ma żadnej płatności; potem — tylko właściciel.",
            "Podatek i koszt wytworzenia wpisuje właściciel po podpisaniu umowy. Płatności klienta też zapisuje właściciel — i dopiero wtedy Twoje naliczenia się odmrażają. Wpłata z faktury do umowy trafia tu sama, gdy właściciel ją potwierdzi; do tego czasu w «Płatnościach klienta» wisi żółty wiersz «płatność nie jest jeszcze potwierdzona».",
            "**«Dane projektu»** — nazwa, klient, termin, notatki; edytujesz je Ty jako osoba prowadząca. **«Umowa»** — link do umowy projektu i jej stan: szkic, u właściciela do podpisu, zatwierdzona, podpisana. Dopóki umowy nie ma, jest formularz do jej przygotowania; jeśli się nie przygotowała, nad formularzem jest napisane, co poprawić. Więcej — [umowy](/admin/contracts).",
          ],
          head: [
            "Bloki: «Etap», «Kosztorys», «Pieniądze», «Dane projektu», «Umowa». Widzisz kartę każdego projektu; pieniądze — w swoich projektach i projektach zespołu.",
            "Kosztorys i kwotę edytuje osoba prowadząca projekt i właściciel — w projektach zespołu tylko je widzisz. Kwota — w pełnych dolarach; po pierwszej płatności zmienia ją tylko właściciel.",
            "Wiersze naliczeń: osoba prowadząca według poziomu i Ty — «kierownik · 5 %» z projektów zespołu (u współzałożyciela ten wiersz wynosi 0).",
          ],
          admin: [
            "Edytujesz wszystko: etap (10 przycisków), kosztorys, kwotę i rodzaj transakcji w każdej chwili, **«Podatek, %»** (domyślnie 4) i **«Koszt wytworzenia, $»** — tylko Ty, żeby nikt nie podniósł sobie naliczenia, zaniżając koszt wytworzenia.",
            "W wierszach naliczeń — procent od tej transakcji: «ustaw» albo powrót do «według poziomu». Blok **«Partner»**: kto polecił, procent dla partnera («według progu» — według kwoty projektu i modelu partnera: od zysku 10–30% albo od obrotu 6–20%), «Zlecenie agencji» — jeśli projekt przyszedł od agencji partnera — i «Nie zaliczać, powód».",
            "**«Płatności klienta»** → «Zapisz płatność»: kwota, data, tytuł płatności. Gdy wszystko jest opłacone, naliczenia zmieniają się na «zarobione», a partner dostaje wiadomość. Wpłaty z faktur do umowy zapisują się tu same — po Twoim oznaczeniu «Opłacona» albo po «Potwierdź płatność» w umowie; dopóki wpłata czeka na Ciebie, jest tu żółty wiersz z linkiem do umowy. «Zostaje właścicielowi» w karcie — bez odjęcia udziału partnera; dokładna liczba jest w [Finansach](/admin/finance).",
          ],
        },
      },
      {
        id: "data",
        title: "«Dane projektu»",
        body: [
          "Nazwę, klienta, termin i notatki edytuje osoba prowadząca projekt, jej kierownik i właściciel; pozostali widzą je bez formularza. Osobę prowadzącą zmienia tylko właściciel — pole «Prowadzi»: od osoby prowadzącej zależą naliczenia, a pracownik nie może przepisać projektu na kogoś innego.",
          "Kwoty nie edytuje się już tutaj — jest w bloku «Pieniądze».",
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
            "Tabeli według osób nie widzisz — widzą ją kierownik i właściciel. Publiczny ranking obok nazwiska kolegi zmienia zachowanie szybciej niż wynik: leady zaczyna się brać według łatwości, a nie ważności. Swoje liczby sprawdzaj na [stronie głównej](/admin): kafelki i «Plan i wykonanie».",
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
            "Planów tu nie ma. «Plan i wykonanie» jest na [stronie głównej](/admin), plan kontaktów — w [Kontaktach](/admin/prospect).",
          ],
          head: [
            "Planów tu nie ma. «Plan i wykonanie» jest na [stronie głównej](/admin), plan kontaktów dla zespołu ustawia się w [Zespole](/admin/team).",
          ],
          admin: [
            "Planów tu nie ma. «Plan i wykonanie» jest na zakładce «Zespół» [strony głównej](/admin), plan kontaktów — w [Zespole](/admin/team).",
          ],
        },
      },
    ],
  },

  /* ── Трафик ───────────────────────────────────────────────────────── */
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
    ],
  },

  "/admin/contracts": {
    what: "Umowa naszej działalności gospodarczej (IP) z zamawiającym. Przygotować i sprawdzić może każdy z zespołu, zatwierdza tylko właściciel — w tym momencie w dokumencie pojawia się jego podpis. Potem — faktury za etapy i link dla zamawiającego. Nie ma tu listy umów: umowa żyje w karcie projektu.",
    items: [
      {
        id: "prepare",
        title: "Przygotuj umowę",
        body: [
          "Otwórz [projekt](/admin/projects) → blok «Umowa». Wypełnij: datę, kwotę, pełną nazwę zamawiającego, adres i kontakt, INN lub PINFL, bank, numer rachunku (20 cyfr), MFO (5 cyfr), przedmiot umowy i etapy. **Udziały etapów muszą dać razem dokładnie 100%**. Kliknij **«Przygotuj umowę»**.",
          "Powstanie szkic z numerem w rodzaju DU-2026-07. Szkic fizycznie nie ma podpisu w dokumencie — nie da się go wydrukować i przedstawić jako podpisanego.",
          "Umowy z kwotą poniżej progu kosztorysu nie da się przygotować — o tym decyduje tylko właściciel. Jeśli po kliknięciu nic się nie pojawiło, sprawdź pola: panel na razie nie pisze, które z nich jest nie tak.",
        ],
      },
      {
        id: "review",
        title: "Strona umowy: kosztorys i wysyłka do podpisu",
        body: {
          manager: [
            "Dopóki umowa jest szkicem: **«Wgraj kosztorys»** i **«Termin»** (w umowie po rosyjsku, np. «60 рабочих дней с даты аванса» — 60 dni roboczych od daty zaliczki). Kosztorys jest odczytywany wiersz po wierszu z Excela (xlsx), CSV, TSV i PDF z tekstem: panel znajduje kolumny po nagłówkach (rosyjskich, uzbeckich albo angielskich, np. «Name», «Qty», «Price», «Total»), pomija wiersz sumy, a suma wierszy staje się kwotą umowy. Skanu PDF ani pliku Word nie da się odczytać — wtedy **«Wklej wiersze kosztorysu ręcznie»**: skopiuj wiersze z Excela albo wpisz po jednym wierszu na pozycję — nazwa, ilość, cena, oddzielone «;». Bez wierszy kosztorysu umowy nie da się wysłać do podpisu.",
            "**«Wyślij do podpisu»** — panel sprawdzi, czy wszystko jest na miejscu, a jeśli nie, napisze «Brakuje: …». Po wysłaniu właściciel dostaje wiadomość w Telegramie, umowa ma status «Wysłana właścicielowi do podpisu» i nie można jej już edytować.",
            "Właściciel zatwierdzi — status «Zatwierdzona przez właściciela» — albo zwróci ją do poprawy. Po zatwierdzeniu klient podpisuje swoją część, a Ty klikasz **«Wgraj podpisaną»** (PDF albo zdjęcie) — umowa zmieni się na «Podpisana przez obie strony».",
            "Jeśli Telegram nie dostarczył powiadomienia, panel to powie — wtedy powiedz właścicielowi osobiście.",
          ],
          head: [
            "Robisz to samo co menedżer: kosztorys (Excel, CSV, PDF z tekstem albo wiersze ręcznie — bez wierszy nie da się wysłać), «Termin», «Wyślij do podpisu», «Wgraj podpisaną», faktury i link dla zamawiającego. Zatwierdza, zwraca i anuluje umowę tylko właściciel — zatwierdzenie to właśnie jego podpis.",
          ],
          admin: [
            "Umowa do podpisu przychodzi do Ciebie w Telegramie i jest widoczna na zakładce «Dziś» — «Umowy do podpisu». Przyciski: **«Zatwierdź i podpisz»** albo **«Zwróć do poprawy»**. Zwrot to normalna część pracy, nie błąd.",
            "Zatwierdzenie składa Twój podpis i **od razu wystawia fakturę za pierwszy etap**. Anulowanie zatwierdzonej umowy — «Powód anulowania» i «Anuluj»: umowy się nie usuwa, tylko oznacza. Zatwierdzonej nie da się edytować — jeśli potrzebna jest zmiana, przygotowuje się nową.",
            "Po wgraniu skanu z podpisami Twojego podpisu nie widać już na ekranie umowy — jest już na skanie.",
          ],
        },
      },
      {
        id: "invoices",
        title: "Faktury za etapy i link dla zamawiającego",
        body: {
          manager: [
            "Każdy etap jest płatny z góry, 100% jego wartości. Faktura za pierwszy etap wystawia się sama przy zatwierdzeniu, kolejne — przyciskiem **«Wystaw fakturę»**. Termin płatności — 14 dni. Pieniądze przyszły — **«Opłacona»**: oznacza ten, kto zobaczył wpłatę w banku.",
            "Po Twoim oznaczeniu właściciel dostaje wiadomość w Telegramie. Klika «Potwierdź płatność» — i wpłata staje się płatnością w [projekcie](/admin/projects): trafia do pieniędzy, a Twoje naliczenia z niej się odmrażają. Dopóki nie potwierdzi, przy fakturze jest napisane «czeka na potwierdzenie właściciela», a w karcie projektu — żółty wiersz. Oznaczyłeś przez pomyłkę — powiedz właścicielowi, on może zdjąć oznaczenie.",
            "**«Link dla zamawiającego»** — strona, na której klient widzi umowę i faktury. Link pokazuje się tylko raz — skopiuj go od razu. «Wygeneruj nowy link» unieważnia poprzedni.",
          ],
          head: [
            "Każdy etap jest płatny z góry, 100% jego wartości. Faktura za pierwszy etap wystawia się sama przy zatwierdzeniu, kolejne — przyciskiem **«Wystaw fakturę»**. Termin płatności — 14 dni. Pieniądze przyszły — **«Opłacona»**: oznacza ten, kto zobaczył wpłatę w banku.",
            "Po oznaczeniu właściciel dostaje wiadomość w Telegramie. Klika «Potwierdź płatność» — i wpłata staje się płatnością w [projekcie](/admin/projects): trafia do pieniędzy, a naliczenia z niej — Twoje i zespołu — się odmrażają. Dopóki nie potwierdzi, przy fakturze jest napisane «czeka na potwierdzenie właściciela», a w karcie projektu — żółty wiersz. Oznaczyłeś przez pomyłkę — powiedz właścicielowi, on może zdjąć oznaczenie.",
            "**«Link dla zamawiającego»** — strona, na której klient widzi umowę i faktury. Link pokazuje się tylko raz — skopiuj go od razu. «Wygeneruj nowy link» unieważnia poprzedni.",
          ],
          admin: [
            "Każdy etap jest płatny z góry, 100% jego wartości. Faktura za pierwszy etap wystawia się sama przy zatwierdzeniu, kolejne — przyciskiem **«Wystaw fakturę»**. Termin płatności — 14 dni. Pieniądze przyszły — **«Opłacona»**: oznacza ten, kto zobaczył wpłatę w banku.",
            "Twoje oznaczenie «Opłacona» od razu zapisuje płatność w projekcie — nie trzeba jej drugi raz zapisywać w karcie projektu: kwota faktury, data — dzisiejsza, tytuł płatności — zaliczka przy pierwszym etapie i reszta przy ostatnim, w notatce «Счёт № … по договору № …» (faktura nr … do umowy nr …). Jeśli wpłatę oznaczył pracownik, dostajesz wiadomość w Telegramie, a przy fakturze są **«Potwierdź płatność»** i **«Nie było wpłaty»** (zdejmuje błędne oznaczenie). Potwierdzoną płatność usuwa się jak zwykłą, w karcie projektu; potem faktura znów czeka na potwierdzenie.",
            "**«Link dla zamawiającego»** — strona, na której klient widzi umowę i faktury. Link pokazuje się tylko raz — skopiuj go od razu. «Wygeneruj nowy link» unieważnia poprzedni.",
          ],
        },
      },
      {
        id: "signature",
        title: "Twój podpis",
        roles: ["admin"],
        body: [
          "Blok «Podpis» na tej stronie: PNG z przezroczystym tłem, do 2 MB, jeden na wszystkie umowy — «Wgraj» albo «Zamień».",
          "Podpis pokazuje się tylko w zatwierdzonych umowach i fakturach do nich. Bez pliku podpisu zatwierdzona umowa wydrukuje się bez niego — panel ostrzeże.",
        ],
      },
      {
        id: "protects",
        title: "Przed czym chroni umowa",
        body: [
          "Spory — w arbitrażu; odpowiedzialność — nie większa niż otrzymana kwota; utraconych korzyści nie zwracamy; jeśli zamawiający milczy 5 dni roboczych po oddaniu etapu — etap jest odebrany; prawa do kodu przechodzą po pełnej zapłacie.",
          "Dokument nie był sprawdzony przez prawnika — trudny przypadek lepiej mu pokazać.",
        ],
      },
    ],
  },

  /* ── Расходы ──────────────────────────────────────────────────────── */
  "/admin/expenses": {
    what: "Wspólne wydatki studia — reklama, usługi, podwykonawcy, biuro — i ile z każdego przypada na każdego współzałożyciela. Do tego terminy podatkowe na najbliższe dwa tygodnie. Widzą to obaj współzałożyciele: wydatek zmniejsza udział każdego z nich.",
    items: [
      {
        id: "split",
        title: "Jak dzieli się wydatek",
        body: [
          "W tej samej proporcji co zysk — według udziałów współzałożycieli. Przykład właściciela: reklama za $100 to 70 dla jednego i 30 dla drugiego. Ostatni dostaje resztę, żeby części zawsze zgadzały się co do centa.",
          "Kosztu wytworzenia konkretnego projektu się tu nie wpisuje: jest już odjęty w samym projekcie i tutaj zostałby odjęty drugi raz.",
        ],
      },
      {
        id: "add",
        title: "Zapisz i usuń",
        body: {
          head: [
            "«Dodaj wydatek»: data, kategoria («reklama», «usługi i subskrypcje», «podwykonawcy», «biuro i łączność», «pozostałe»), kwota i na co — «Zapisz». Zapisywać możesz Ty i właściciel: wymyślony wydatek zmniejsza też Twój udział, więc nie da się oszukać na swoją korzyść.",
            "Usuwa tylko właściciel: usunięciem można by wymazać z obrazu cudzy wydatek. Pomyliłeś się — powiedz mu.",
          ],
          admin: [
            "«Dodaj wydatek» i «usuń» przy każdym wierszu. Kierownik-współzałożyciel może zapisywać, ale nie usuwać: usunięciem można wymazać z obrazu cudzy wydatek, a wymyślony wydatek zmniejsza też udział tego, kto go zapisał.",
            "Są tu te same wydatki co w bloku «Wydatki studia» w [Finansach](/admin/finance).",
          ],
        },
      },
      {
        id: "taxes",
        title: "Terminy podatkowe",
        body: [
          "Blok «Podatki: co się zbliża» — terminy na 14 dni do przodu: podatek od obrotu i podatek socjalny — do 15. dnia każdego miesiąca, roczne sprawozdanie — do 1 kwietnia. Na 3 dni lub mniej — na żółto.",
          "Przy każdej dacie jest dopisek «data niepotwierdzona przez księgowego»: to punkt wyjścia do rozmowy z księgowym, a nie jego słowo. Kara za spóźnienie przychodzi raz i w całości, dlatego ten blok jest pierwszy.",
        ],
      },
      {
        id: "no-profit",
        title: "Dlaczego nie ma tu zysku",
        body: {
          head: [
            "Widać tu tylko wydatki i ich podział. Zysk i udziały w nim widzi właściciel: pokazanie 30% oznacza pokazanie także pozostałych 70%, jedno wylicza się z drugiego w pamięci.",
          ],
          admin: [
            "Kierownik widzi tu tylko wydatki: zysk i udziały w nim są tylko u Ciebie, w bloku «Udziały współzałożycieli» w [Finansach](/admin/finance). Pokazanie jego 30% oznaczałoby pokazanie także Twoich 70%.",
          ],
        },
      },
    ],
  },

  /* ── Финансы ──────────────────────────────────────────────────────── */
  "/admin/finance": {
    what: "Pieniądze zespołu: ile każdy zarobił na transakcjach, ile czeka, aż klient dopłaci, i ile już wypłacono. Nie ma pensji — każdy dostaje procent od zysku netto swoich transakcji.",
    items: [
      {
        id: "how",
        title: "Jak liczy się procent",
        body: [
          "**Zysk netto z transakcji** = kwota z umowy − podatek − koszt wytworzenia. Procent liczy się od niego, a nie od kwoty umowy. Podatek i koszt wytworzenia wpisuje właściciel.",
          "Stawki według poziomu: **młodszy menedżer** — 10% od nowego klienta i 0 od dosprzedaży; **menedżer** — 15% i 5%; **kierownik** — 30% i 30%. Poziom i stawkę indywidualną ustawia właściciel w sekcji «Zespół». Stawka indywidualna zastępuje poziom tylko przy nowych klientach.",
          "Kierownik dodatkowo dostaje 5% z każdej transakcji menedżerów swojego zespołu — ponad to, a nie z ich udziału. U kierownika-współzałożyciela ten wiersz wynosi 0: i tak dostaje udział we wszystkim, co zostało.",
          "Właściciel może ustawić procent na konkretną transakcję — ma on pierwszeństwo przed poziomem i stawką indywidualną. Naliczenie pojawia się, gdy projekt ma kwotę i osobę prowadzącą. Transakcja wyszła na minus — naliczenie wynosi 0: minus to zmartwienie właściciela.",
        ],
      },
      {
        id: "freeze",
        title: "Zamrożone, zarobione, do wypłaty",
        body: [
          "**«Zamrożone»** — transakcja jest, ale klient jeszcze nie zapłacił całej kwoty. **«Zarobione»** — klient zapłacił za projekt w całości (właściciel zapisał płatności w karcie projektu). **«Nie nalicza się»** — projekt jest anulowany.",
          "**«Do wypłaty»** = zarobione − wypłacone. Wartość ujemna — «wypłacone z góry».",
          "Naliczenia nie są przechowywane, tylko liczone od nowa przy każdym otwarciu — zmieniono koszt wytworzenia i liczba od razu jest inna.",
        ],
      },
      {
        id: "page",
        title: "Co jest na stronie",
        body: {
          manager: [
            "Kafelki dla Ciebie: «Zarobione», «Zamrożone», «Wypłacone», «Do wypłaty». Poniżej «Według projektów» — Twoje projekty: kwota, czy opłacone w całości i Twoje naliczenie. I lista Twoich wypłat.",
            "Chcesz więcej — szukaj nowych klientów: od nowego klienta procent jest wyższy niż od dosprzedaży. I zakładaj swoje [projekty](/admin/projects) sam — naliczenie idzie do tego, kto prowadzi.",
          ],
          head: [
            "Kafelki — Twoje saldo. Tabela osób — Ty i Twój zespół: poziom, projekty, zamrożone, zarobione, wypłacone, do wypłaty. «Według projektów» — Twoje i zespołu, z naliczeniami Twojego zakresu. «Wypłaty» — Twoje i zespołu.",
            "Udziały w zysku studia i jego resztę widzi tylko właściciel.",
          ],
          admin: [
            "Kafelki dla studia: «Z umów», «Zapłacone przez klientów», «Zysk netto» (z dopiskiem, ile projektów nie ma kosztu wytworzenia), «Naliczone zespołowi i partnerom», «Zostaje właścicielowi».",
            "Tabela osób i «Według projektów» — z kolumnami podatku, kosztu wytworzenia, zysku i «Dla właściciela» (po odjęciu partnerów). «Udziały współzałożycieli» — co wpłynęło minus wydatki i jak to się dzieli. «Wydatki studia» — ta sama lista co w [Wydatkach](/admin/expenses).",
          ],
        },
      },
      {
        id: "payouts",
        title: "Wypłaty",
        body: {
          manager: [
            "Wypłaty zapisuje właściciel, gdy przeleje pieniądze. Pojawiają się na liście «Wypłaty» i zmniejszają «Do wypłaty».",
          ],
          head: [
            "Wypłaty zapisuje tylko właściciel. Widzisz wypłaty dla siebie i swojego zespołu.",
          ],
          admin: [
            "«Wypłaty» → «Komu», «Kwota, $», «Data» (puste — dziś), «Notatka» («za sierpień») → «Zapisz wypłatę». Najpierw przelej pieniądze, potem zapisz. Wypłaty dla siebie nie da się zapisać: Tobie zostaje reszta.",
          ],
        },
      },
    ],
  },
};
