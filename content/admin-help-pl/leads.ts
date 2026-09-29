import type { HelpCopy } from "../admin-help";
import type { HelpEntry } from "@/lib/admin/help";

/**
 * Польская инструкция, часть первая: шапка страницы инструкций и раздел
 * «Лиды» (/admin) — главная, очередь, карточка лида, напоминания.
 *
 * Перевод admin-help-ru.ts абзац в абзац. Названия кнопок и блоков — как на
 * польской панели (content/admin-panel/home.ts, dashboard.ts,
 * lead-card.ts); сообщения и кнопки бота в Telegram — по-русски, как их
 * видит сотрудник.
 */

export const head: Pick<
  HelpCopy,
  "title" | "lead" | "contentsTitle" | "sectionsTitle" | "openSection" | "viewAs" | "roleNames" | "ownerOnly"
> = {
  title: "Instrukcje",
  lead: "Jak działa panel i jak z niego korzystać — sekcja po sekcji, prostymi słowami. Znajdziesz tu tylko to, do czego masz dostęp. Z każdej sekcji prowadzi tu przycisk «Jak korzystać z sekcji» w nagłówku, a «?» przy blokach otwiera właściwy punkt.",
  contentsTitle: "Spis treści",
  sectionsTitle: "Sekcje",
  openSection: "otwórz sekcję",
  viewAs: "Pokaż jako:",
  roleNames: { admin: "właściciel", head: "kierownik", manager: "menedżer" },
  ownerOnly: "Widzi tylko właściciel",
};

export const leadsSections: Record<string, HelpEntry> = {
  /* ── Лиды ─────────────────────────────────────────────────────────── */
  "/admin": {
    what: "Strona główna panelu i wszystkie zgłoszenia klientów: z czatu na stronie, formularza, bota w Telegramie, witryny, «Wyszukiwania» i Twoich kontaktów. Widać tu, kto napisał, czego potrzebuje, jak pilna jest sprawa i kto się nią zajmuje. Każde działanie na leadzie — przejęcie, otwarcie danych kontaktowych, zmiana statusu — trafia do dziennika z imieniem i godziną.",
    items: [
      {
        id: "home",
        title: "Co jest na stronie głównej",
        body: {
          manager: [
            "Na górze są kafelki: **«do wypłaty»** — ile już zarobiłeś, a jeszcze nie dostałeś (niżej drobnym drukiem — ile czeka, aż klient dopłaci), **«leady w toku»**, **«pilny kontakt»** i **«wpływy w miesiącu»** z Twoich projektów.",
            "Jeśli kierownik ustalił Ci plan kontaktów, nad kafelkami zobaczysz wiersz w rodzaju «Do planu zostało 12 — w tym tygodniu 18 z 30». Szczegóły — w punkcie [plan kontaktów](#prospect-plan).",
            "Niżej: [«Pilny kontakt»](#leads-urgent) — Twoje leady, które od dawna stoją w miejscu; «Rekomendacje na tydzień» — co poprawić (zob. [rekomendacje](#leads-coach)); [«Plan i wykonanie»](#leads-plan-fact) — cele, które Ci wyznaczono; a na samym dole — [lista leadów](#leads-list).",
          ],
          head: [
            "Na początku — **«Czeka na Twoją decyzję»**: prośby menedżerów o przekazanie leada koledze. Decydujesz Ty albo właściciel — szczegóły w punkcie [przekazanie leada](#leads-transfer).",
            "Kafelki liczą Ciebie i Twój zespół razem: **«do wypłaty»** — tylko Twoje saldo, **«leady zespołu w toku»**, **«pilny kontakt»**, **«wpływy w tygodniu»**.",
            "Dalej: «Na dziś» — poranne wskazówki do Twoich leadów, [«Pilny kontakt»](#leads-urgent) dla Ciebie i zespołu z imionami, [«Zespół w tym tygodniu»](#leads-team-week), rekomendacje dla zespołu i dla Ciebie, «Najlepsi w tygodniu», [«Plan i wykonanie»](#leads-plan-fact) i [lista leadów](#leads-list).",
            "Zespół to menedżerowie przypisani do Ciebie w sekcji [«Zespół»](/admin/team). Dopóki nie masz zespołu, jego bloków na stronie głównej nie ma.",
          ],
          admin: [
            "Twoja strona główna jest podzielona na zakładki, żeby nie przewijać jednej długiej listy. Zakładka zapisuje się w adresie — możesz ją dodać do zakładek przeglądarki.",
            "**«Dziś»** — od czego zacząć dzień: «Czeka na Twoją decyzję» (prośby o przekazanie leada), «Umowy do podpisu», kafelki z pieniędzmi, wskazówki «Na dziś» (przycisk «wygeneruj ponownie» zużywa jedno wywołanie modelu), «Pilny kontakt» dla całego studia i terminy podatkowe na dwa tygodnie.",
            "**«Leady»** — [lista leadów](#leads-list) ze wszystkimi filtrami. Złota liczba na zakładce — ile leadów jest teraz wolnych.",
            "**«Finanse»** — «Kasa w podziale na miesiące» (wpływy i wydatki z pół roku, pod każdym miesiącem — różnica) i «Oczekiwane płatności»: ile jeszcze klienci mają zapłacić w aktywnych projektach.",
            "**«Zespół»** — [tabela tygodnia](#leads-team-week), najlepsi, rekomendacje dla każdego i [«Plan i wykonanie»](#leads-plan-fact), gdzie ustalasz i zmieniasz cele.",
            "Ruch na stronie z Metryki (Yandex Metrica) i Google Analytics to nie zakładka, tylko osobna sekcja [«Ruch»](/admin/traffic): widzisz ją Ty i kierownicy. Stare zakładki przeglądarki do dawnej zakładki prowadzą tam samo.",
          ],
        },
      },
      {
        id: "queue",
        title: "Jak lead trafia do człowieka: kolejka",
        body: {
          manager: [
            "Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie. Kiedyś jedna szybka osoba zabierała wszystko, a na zimne kontakty nikomu nie zostawało czasu.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (także w weekendy), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostajesz w Telegramie kartę: «⏳ Лид ваш на 30 минут — до 14:30» (lead jest Twój przez 30 minut, do 14:30). Pozostali jej nie widzą i nie mogą go przejąć.",
            "Nie przejmiesz go w ciągu 30 minut — lead trafia do kolejnej osoby, a Ty dostajesz «⌛ 30 минут на лид вышли» (30 minut minęło). Przepuszczenie liczy się jako otrzymana szansa: inaczej osoba na urlopie zawsze byłaby pierwsza w kolejce, a każdy lead czekałby na nią pół godziny.",
            "Jeśli nikt nie przejmie leada przez całą rundę, otwiera się on dla wszystkich: «🔓 Никто из очереди не взял — лид открыт всем. Берёт первый, кто нажмёт» (nikt z kolejki nie wziął, lead jest otwarty dla wszystkich, bierze pierwszy, kto kliknie).",
            "**W nocy, od 18:00 do 08:00**, zasada pół godziny nie obowiązuje — lead od razu jest otwarty dla wszystkich w kolejce. Ale można przejąć nie więcej niż równą część na miesiąc: jeśli swoją część już wykorzystałeś, w karcie leada zobaczysz «🌙 …Twoja część na ten miesiąc jest już wykorzystana — trafi do osób, które mają mniej». Inaczej w nocy leady znów zabierałby ten, kto nie śpi.",
            "Dopóki lead jest w kolejce u kogoś innego, nick klienta w karcie jest ukryty — «ukryty — lead nie jest teraz Twój». Leady z Twoich własnych [kontaktów](/admin/prospect) nie trafiają do kolejki: od razu są Twoje.",
            "Jeśli karta nie dotarła do nikogo — na przykład serwer na chwilę stracił połączenie z Telegramem — przyjdzie później, gdy połączenie wróci, z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie: karta nie dotarła przez awarię łączności). Lead jest wtedy rozdzielany od nowa według zasad godziny, w której przyszło dosłanie: w dzień — po kolei, w nocy — wszystkim. Leady starsze niż trzy doby nie są dosyłane.",
          ],
          head: [
            "Stoisz w kolejce na równi z menedżerami — zasady są te same. Leady są rozdzielane po kolei, a nie temu, kto szybciej kliknie.",
            "**W dzień, od 08:00 do 18:00 czasu taszkenckiego** (także w weekendy), nowy lead jest proponowany jednej osobie — tej, która w tym miesiącu ma najmniej «przejął + przepuścił». Dostaje ona w Telegramie «⏳ Лид ваш на 30 минут» (lead jest Twój przez 30 minut). Pozostali tej karty nie widzą.",
            "Nie przejął w 30 minut — lead trafia do kolejnej osoby. Przepuszczenie liczy się jako otrzymana szansa. Jeśli nikt nie przejmie go przez całą rundę, lead otwiera się dla wszystkich: bierze pierwszy, kto kliknie.",
            "**W nocy, od 18:00 do 08:00**, lead od razu jest otwarty dla wszystkich w kolejce, ale każdy może przejąć nie więcej niż równą część na miesiąc.",
            "Dopóki lead jest wolny, jego danych kontaktowych i korespondencji nie otworzysz także Ty — najpierw «Przejmij». Nick klienta jest ukryty przed wszystkimi, do których kolejka jeszcze nie doszła. Inaczej kolejkę dałoby się obejść jednym przyciskiem.",
            "W kolejce są tylko osoby z połączonym Telegramem: bez niego nie da się człowiekowi powiedzieć, że lead jest jego.",
            "Karta, która przez awarię łączności serwera z Telegramem nie dotarła do nikogo, jest dosyłana sama, gdy połączenie wróci — z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Leady starsze niż trzy doby nie są dosyłane.",
          ],
          admin: [
            "Jesteś **poza kolejką**: możesz przejąć dowolny wolny lead w dowolnej chwili, a limit nocnej części Cię nie dotyczy. W kolejce stoją menedżerowie i kierownicy z połączonym Telegramem.",
            "W dzień (08:00–18:00 czasu taszkenckiego, codziennie) lead jest proponowany jednej osobie na 30 minut — tej, która w miesiącu ma najmniej «przejął + przepuścił». Ty i czat sprzedaży dostajecie kopię: «👁 В очереди у @ник до 14:30. Вы вне очереди — можете взять сами» (w kolejce u @nick do 14:30, jesteś poza kolejką, możesz przejąć sam). W karcie leada też widzisz, u kogo jest teraz; pozostałym to imię się nie wyświetla, żeby nie zaczynały się spory.",
            "Nie przejął w 30 minut — do następnej osoby; minęła runda — lead otwarty dla wszystkich. Jeśli przejmiesz lead, który jest właśnie komuś proponowany, jego propozycja się zamyka i nie liczy się mu jako przepuszczenie.",
            "W nocy (18:00–08:00) lead jest od razu otwarty dla wszystkich, ale każdy bierze nie więcej niż równą część na miesiąc: «przejęte od początku miesiąca ÷ liczba osób w kolejce», z zaokrągleniem w górę.",
            "Z pominięciem kolejki idą: leady z kontaktów (od razu do osoby, która pisała) i zamówienia z witryny powyżej $10 000 — przychodzą tylko do Ciebie.",
            "Jeśli karta leada nie dotarła do nikogo — serwer stracił połączenie z Telegramem — sweep dośle ją, gdy Telegram znów odpowie: z dopiskiem «⚠️ Досылка: карточка не дошла из-за сбоя связи» (dosłanie po awarii łączności) i według zasad bieżącej godziny. Sprawdzanie co pięć minut; leady starsze niż trzy doby nie są dosyłane. Tak 26 września dotarł nocny lead z formularza, który przez dobę leżał niczyj.",
          ],
        },
      },
      {
        id: "take",
        title: "Przejęcie leada i rezygnacja z niego",
        body: [
          "Leada przejmiesz w jego karcie przyciskiem **«Przejmij»** albo od razu w Telegramie przyciskiem **«✅ Взять в работу»** (weź do pracy) pod kartą. Od tej chwili lead jest Twój: status «w toku», po 4 godzinach przyjdzie automatyczne przypomnienie «Взят в работу — что дальше?» (przejęty — co dalej?), a wszystkim, do których przyszła karta, zmieni się ona na «✅ В работе у @ник» (w toku u @nick).",
          "Jeśli dwie osoby klikną jednocześnie, lead dostanie jedna, a druga zobaczy w panelu «Tego leada przejął już ktoś inny» (w Telegramie — «Лида уже взял кто-то другой»). Jeśli to nie Twoja kolej — «To nie Twoja kolej: lead jest teraz zaproponowany komuś innemu» (w Telegramie — «Не ваша очередь»). Komu dokładnie — celowo nie jest mówione.",
          "**«🗄 Отклонить»** (odrzuć) w Telegramie to decyzja «ten klient nie jest nam potrzebny». Lead najpierw zostaje przypisany do osoby, która kliknęła, a potem dostaje status «odłożony»: odmowa musi mieć autora, a w dzienniku widać, kto zdecydował.",
          "Przejąłeś, ale nie możesz go prowadzić — kliknij **«Zwróć do kolejki»** w karcie. Lead znów będzie wolny i otworzy się dla wszystkich, a Twoje automatyczne przypomnienia do niego zostaną anulowane. Nie pójdzie od nowa przez całą kolejkę: pół godziny na każdą osobę to za długo dla leada, z którym już pracowano.",
        ],
      },
      {
        id: "list",
        title: "Lista leadów: filtry i kolumny",
        body: {
          manager: [
            "Widzisz **wolne leady i swoje**. Lead przejęty przez kolegę nie jest Ci pokazywany ani na liście, ani pod bezpośrednim linkiem — tak zdecydował właściciel. Dlatego kafelek «łącznie» to u Ciebie wolne plus Twoje.",
            "Filtry na górze: «wszystkie leady / wolne / moje leady», priorytet i status. Na liście jest 50 leadów na stronę.",
            "**«Kiedy»** — czas taszkencki. **«Budżet»** — to nie kwota, tylko to, jak klient mówi o pieniądzach: «podany i zatwierdzony», «jest, porównuje oferty» albo «nie podany». W zgłoszeniach z formularza i z kontaktów budżet prawie zawsze jest «nie podany» — rozmowy o pieniądzach jeszcze nie było.",
            "**«Ocena»** — ocena leada od 0 do 100 i litera: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — ocena A albo klient prosił o żywego człowieka; «ciepły» — B; «do dojrzenia» — pozostałe; «archiwum» — klient odmówił.",
            "Danych kontaktowych na liście celowo nie ma: otwierają się w [karcie leada](#leads-card), a każde otwarcie jest zapisywane.",
          ],
          head: [
            "Widzisz **wszystkie leady studia** — wolne, swoje i cudze. Filtry: «wszystkie leady / wolne / moje leady», priorytet i status; 50 na stronę.",
            "**«Budżet»** — to nie kwota, tylko to, jak klient mówi o pieniądzach: «podany i zatwierdzony», «jest, porównuje oferty» albo «nie podany». **«Ocena»** — od 0 do 100 i litera: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — A albo prosił o żywego człowieka, «ciepły» — B, «do dojrzenia» — pozostałe, «archiwum» — odmówił.",
            "Pod statusem widać nick osoby, która prowadzi leada. Danych kontaktowych na liście nie ma — otwierają się w [karcie leada](#leads-card) i trafiają do dziennika.",
          ],
          admin: [
            "Lista jest na zakładce «Leady». Widzisz wszystkie leady. Filtry: «wszystkie leady / wolne / moje leady», priorytet i status; 50 na stronę.",
            "**«Budżet»** — jak klient mówi o pieniądzach («podany i zatwierdzony», «jest, porównuje oferty», «nie podany»), a nie kwota. **«Ocena»**: A — od 75, B — od 55, C — od 35, D — poniżej. **«Priorytet»**: «gorący» — A albo prosił o człowieka, «ciepły» — B, «do dojrzenia» — pozostałe, «archiwum» — odmówił.",
            "Danych kontaktowych na liście celowo nie ma: inaczej «kto widział kontakty» znaczyłoby «wszyscy, którzy otworzyli panel». W karcie każde otwarcie danych kontaktowych to wiersz w [dzienniku](/admin/audit).",
          ],
        },
      },
      {
        id: "card",
        title: "Karta leada",
        body: {
          manager: [
            "Otwiera się z listy, z «Pilny kontakt» i przyciskiem «🔓 Открыть карточку» (otwórz kartę) w Telegramie — ten przycisk sam loguje Cię do panelu. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»** — do kogo lead jest przypisany. Tu są przyciski [«Przejmij» i «Zwróć do kolejki»](#leads-take) oraz [«Poproś o przekazanie»](#leads-transfer).",
            "**«Status»** — «nowy», «w toku», «odłożony», «wygrany», «przegrany». Zmieniaj go po każdej rozmowie: na podstawie statusów liczone są [statystyki](/admin/stats) i «Pilny kontakt». «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» ma tylko wolny lead: Twój go nie ma, a żeby zwolnić leada, użyj «Zwróć do kolejki».",
            "**«Dane kontaktowe klienta»** → «Pokaż dane kontaktowe». Otwierają się tylko dla przejętego leada: najpierw «Przejmij». Każde otwarcie trafia do dziennika, więc otwieraj je wtedy, gdy zamierzasz napisać.",
            "**«Korespondencja z klientem»** → «Pokaż korespondencję»: wszystko, co klient powiedział asystentowi na stronie albo w bocie o zadaniu, pieniądzach i terminach. Też tylko po przejęciu i też jest zapisywane. Zgłoszenia z formularza nie mają korespondencji.",
            "**«Dyskusja»** — notatki o kliencie dla całego zespołu; osoba prowadząca leada dostaje wiadomość w Telegramie. Nie wklejaj tam danych kontaktowych klienta. Niżej — brief, kosztorys ze strony i notatki. O leadach z kontaktów — punkt [pierwsza rozmowa po kontakcie](#prospect-replies).",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
          ],
          head: [
            "Otwierasz dowolną kartę. Każde otwarcie jest zapisywane.",
            "**«Prowadzi»**: [«Przejmij»](#leads-take) dla wolnego leada, «Zwróć do kolejki» i [«Przekaż»](#leads-transfer) dla każdego przejętego — Twoje przekazanie działa od razu, bez zatwierdzania.",
            "**«Status»** możesz zmieniać w każdym leadzie: «nowy», «w toku», «odłożony», «wygrany», «przegrany». «Wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia. «Nowy» — tylko dla wolnego leada; przypisany go nie ma, a leada zwalnia «Zwróć do kolejki».",
            "**«Pokaż dane kontaktowe»** i **«Pokaż korespondencję»** działają dla każdego przejętego leada. Dla wolnego — dopiero po «Przejmij»: w kolejce jesteś na równi ze wszystkimi. Każde otwarcie trafia do dziennika.",
            "**«Dyskusja»** — notatki dla całego zespołu, osoba prowadząca leada dostaje je w Telegramie. Niżej — brief, kosztorys i notatki.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku.",
          ],
          admin: [
            "Otwierasz dowolną kartę i możesz wszystko: przejąć, zwrócić do kolejki, przekazać, zmienić status, otworzyć dane kontaktowe i korespondencję — także w wolnym leadzie, przed przejęciem. Każde działanie trafia do dziennika z Twoim imieniem.",
            "W wolnym leadzie na górze widać, u kogo jest teraz w kolejce: «👁 W kolejce u … do 14:30». Pozostałym to imię się nie wyświetla.",
            "**«Status»**: «wygrany», «przegrany» i «odłożony» anulują automatyczne przypomnienia; «nowy» ma tylko wolny lead, przypisany go nie ma — leada zwalnia «Zwróć do kolejki».",
            "**«Dyskusję»** widzi cały zespół, osoba prowadząca leada dostaje ją w Telegramie. Niżej — brief, kosztorys i notatki asystenta.",
            "Żółta etykieta obok numeru zgłoszenia oznacza, że klient ma rabat 30%, i jest napisane, za co: **«napisał w pierwszej minucie»** — napisał do asystenta na stronie albo w Telegramie, kiedy na stronie odliczał się licznik pierwszej minuty; **«nie zdążyliśmy w 20 sekund»** — zadziałała gwarancja odpowiedzi. Klient już widział ten rabat i nie podlega on negocjacji — uwzględnij go w wycenie. Przepraszać za czekanie trzeba tylko w drugim przypadku. Ile jest takich rabatów i z jakiego powodu — w [Statystykach](/admin/stats), długość minuty — `FIRST_MINUTE_SECONDS` na serwerze (domyślnie 60, 0 wyłącza).",
          ],
        },
      },
      {
        id: "reminders",
        title: "Przypomnienia",
        body: {
          manager: [
            "Przypomnienia to Twoja pamięć: przychodzą w Telegramie od bota, od razu z przyciskami **«Открыть»** (otwórz), **«+2 часа»** (+2 godziny) i **«Готово»** (gotowe).",
            "**Automatyczne przypomnienie** ustawia się samo 4 godziny po tym, jak przejmiesz leada: «Взят в работу — что дальше?» (przejęty — co dalej?). Nie po dobie — lead, który przyszedł rano i do wieczora nikt go nie ruszył, już ostygł. Wyłączasz je przyciskiem «Wyłącz automatyczne przypomnienia» w karcie; Twoje ręczne przypomnienia zostają.",
            "**Własne przypomnienie**: w bloku «Przypomnienia» — «przypomnij za 24 godz.» (można od 0,5 godziny wzwyż), opis «o czym przypomnieć» i «Ustaw».",
            "Statusy na liście: «wysłano», «po terminie» (czas minął, bot jeszcze próbuje) i «nie dostarczono» — po pięciu próbach. To znaczy, że bot nie może do Ciebie napisać: sprawdź, czy go nie zablokowałeś, i kliknij w nim «Start». Jeśli natomiast serwer na chwilę traci połączenie z Telegramem, próby się nie liczą: przypomnienie poczeka na połączenie i przyjdzie później.",
            "Zrobione — kliknij «zrobione» w karcie albo «Готово» w Telegramie. Zamknąć możesz tylko swoje przypomnienie.",
          ],
          head: [
            "Przypomnienia przychodzą w Telegramie z przyciskami **«Открыть»** (otwórz), **«+2 часа»** (+2 godziny) i **«Готово»** (gotowe).",
            "**Automatyczne przypomnienie** — 4 godziny po przejęciu leada. Wyłącza się je w karcie, ręczne przy tym zostają.",
            "**Własne przypomnienie**: «przypomnij za N godz.», opis i «Ustaw». Możesz ustawiać i zamykać przypomnienia w każdym leadzie, także w leadach zespołu.",
            "«Nie dostarczono» po pięciu próbach oznacza, że bot nie może napisać do tej osoby — niech sprawdzi, czy go nie zablokowała. Awaria łączności serwera z Telegramem nie liczy się jako próba — przypomnienie przyjdzie, gdy połączenie wróci.",
          ],
          admin: [
            "Przypomnienia przychodzą w Telegramie z przyciskami «Открыть», «+2 часа» i «Готово». Rozsyła je sweep — przebieg według harmonogramu co pięć minut. Jeśli nie przeszedł od ponad pół godziny, wszyscy zobaczą na stronie głównej czerwony pasek [«Przypomnienia nie są dostarczane»](#leads-banner).",
            "Automatyczne przypomnienie — 4 godziny po przejęciu leada; ręczne — «przypomnij za N godz.» i «Ustaw». Ustawiasz i zamykasz przypomnienia w każdym leadzie.",
            "«Nie dostarczono» po pięciu próbach — bot nie może napisać do tej osoby: jest zablokowany albo ta osoba ani razu nie kliknęła «Start». Próby liczą się tylko wtedy, gdy Telegram odpowiada: jeśli serwer w ogóle nie widzi Telegrama, przypomnienie czeka, a nie przepada.",
          ],
        },
      },
      {
        id: "transfer",
        title: "Przekazanie leada koledze",
        body: {
          manager: [
            "Nie dajesz rady z leadem albo klient bardziej pasuje koledze — w karcie, w bloku «Przekazanie», wybierz komu i napisz, dlaczego przekazujesz, a potem kliknij **«Poproś o przekazanie»**.",
            "Lead zostaje u Ciebie, dopóki prośby nie zatwierdzi Twój kierownik albo właściciel: dostają w Telegramie wiadomość z przyciskami «Подтвердить» (zatwierdź) i «Отклонить» (odrzuć) — decydują od razu tam, bez panelu. Lead nie wisi między dwiema osobami, czekając na decyzję.",
            "Zatwierdzili — lead jest u kolegi, dostaje on wiadomość i nowe przypomnienie za 4 godziny. Lead z kontaktu przechodzi razem z korespondencją: odpowiedzi klienta, ponawianie i podpis modelu są teraz u kolegi. Odrzucili — dostaniesz «Передачу не подтвердили. Лид остаётся у вас» (przekazania nie zatwierdzono, lead zostaje u Ciebie).",
            "Wolnego leada się nie przekazuje — przejmuje się go przyciskiem «Przejmij».",
          ],
          head: [
            "Twój przycisk to **«Przekaż»**: lead od razu trafia do wybranej osoby, która dostaje wiadomość «…передал вам лид. Он уже ваш» (…przekazał Ci leada, jest już Twój).",
            "Prośby menedżerów z Twojego zespołu («Poproś o przekazanie») przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decyduj od razu w wiadomości; «Открыть лид» (otwórz leada) prowadzi do karty, jeśli najpierw chcesz zajrzeć. Te same prośby są na stronie głównej w «Czeka na Twoją decyzję» i w karcie leada. Gdy zdecyduje jedna osoba, u pozostałych przyciski zmienią się na «Подтвердил …» (zatwierdził) albo «Отклонил …» (odrzucił). Możesz decydować o każdej prośbie w studiu, nie tylko ze swojego zespołu.",
            "Zatwierdzony lead dostaje nowe przypomnienie za 4 godziny. Lead z kontaktu przechodzi razem z korespondencją: wiadomości klienta, ponawianie i podpis modelu — do nowej osoby prowadzącej. Dawne przypomnienia poprzedniej osoby nie zamykają się same — w razie potrzeby zamknij je.",
          ],
          admin: [
            "Twój przycisk to **«Przekaż»**: lead przechodzi od razu. Prośby menedżerów przychodzą do Ciebie w Telegramie z przyciskami **«✅ Подтвердить»** (zatwierdź) i **«✖ Отклонить»** (odrzuć) — decydujesz od razu w wiadomości — a także na zakładkę «Dziś» do «Czeka na Twoją decyzję» i do karty leada. Może je rozstrzygnąć także kierownik: dostaje prośby swojego zespołu z tymi samymi przyciskami. Kto zdecyduje pierwszy — u pozostałych przyciski zmienią się na wynik i ponownie kliknąć rozstrzygniętej prośby się nie da.",
            "Tak działa to według Twojej zasady: lead przechodzi za zatwierdzeniem kierownika albo Twoim i do decyzji zostaje u dotychczasowej osoby prowadzącej. Lead z kontaktu przechodzi razem z korespondencją — u kogo lead, u tego rozmowa z klientem.",
          ],
        },
      },
      {
        id: "urgent",
        title: "«Pilny kontakt»",
        body: [
          "Tu są leady ze statusem «w toku», które zbyt długo stoją w miejscu: «gorący» — 2 dni i dłużej, «ciepły» — 3, «do dojrzenia» — 5, «archiwum» — 14.",
          "Ruch to każde działanie na leadzie w panelu (nawet samo otwarcie karty) albo wiadomość w «Dyskusji». Dlatego lead znika z listy, gdy tylko ktoś się nim zajmie. Ale uczciwiej jest zrobić krok: napisać do klienta, zmienić status, ustawić przypomnienie.",
          "Na górze — najstarsze. Pusto — «Wszystkie leady w toku miały niedawno ruch».",
        ],
      },
      {
        id: "plan-fact",
        title: "«Plan i wykonanie»",
        body: {
          manager: [
            "Cele wyznaczone Ci na tydzień albo miesiąc: **«wpływy, $»** (pieniądze od klientów z Twoich projektów), **«wygrane leady»** i **«pierwsze kontakty»** — ile razy kliknąłeś «Pokaż dane kontaktowe».",
            "Pasek pokazuje, ile zrobiono: od 100% — zielony, poniżej 50% — złoty. Tydzień liczy się od poniedziałku według czasu taszkenckiego.",
            "Plan ustala kierownik albo właściciel — nikt nie wyznacza planu sam sobie.",
          ],
          head: [
            "Cele na tydzień albo miesiąc: «wpływy, $», «wygrane leady», «pierwsze kontakty» (kliknięcia «Pokaż dane kontaktowe»).",
            "Możesz **ustalić nowy plan** swojemu menedżerowi: «Dla kogo», «Okres», «Wskaźnik», «Cel» i «Ustaw plan». Zmieniać i usuwać już ustalony plan może tylko właściciel, a sobie planu nie ustala nikt.",
            "Pasek: od 100% — zielony, poniżej 50% — złoty.",
          ],
          admin: [
            "Na zakładce «Zespół». Ustalasz plan komukolwiek, a do tego przyciskami «zmień» i «usuń» możesz zmienić albo usunąć dowolny plan. Kierownik może tylko dodać plan swojemu menedżerowi — tak zdecydowałeś.",
            "Wskaźniki: «wpływy, $», «wygrane leady», «pierwsze kontakty» (to kliknięcia «Pokaż dane kontaktowe»). Okresy: bieżący tydzień od poniedziałku i bieżący miesiąc.",
          ],
        },
      },
      {
        id: "coach",
        title: "Rekomendacje",
        body: {
          manager: [
            "**«Rekomendacje na tydzień»** powstają w poniedziałki od 06:00 czasu taszkenckiego na podstawie Twoich liczb z poprzedniego tygodnia: «Poprzedni okres», «Na co zwrócić uwagę», «Co robić», «Czego się nauczyć», «Co idzie dobrze».",
            "To podpowiedź, a nie ocena. Za tydzień — nowy pomiar i nowy plan.",
          ],
          head: [
            "**«Na dziś»** — codziennie rano od 07:00: co zrobić dziś w Twoich leadach i leadach zespołu.",
            "**«Rekomendacje na tydzień»** — w poniedziałki od 06:00, dla Ciebie i każdego w zespole. Rekomendacje dla zespołu widzisz w bloku «Rekomendacje dla zespołu na tydzień» — wygodnie omawiać je na odprawie.",
          ],
          admin: [
            "Tygodniowe powstają w poniedziałki od 06:00 dla wszystkich oprócz Ciebie; «Na dziś» — codziennie rano od 07:00 dla Ciebie i kierowników.",
            "Przycisk «wygeneruj ponownie» masz tylko Ty: każde generowanie to wywołania modelu, czyli pieniądze.",
          ],
        },
      },
      {
        id: "team-week",
        title: "«Zespół w tym tygodniu»",
        roles: ["head", "admin"],
        body: {
          head: [
            "Tabela dla Ciebie i Twojego zespołu, strzałka — w porównaniu z poprzednim tygodniem.",
            "**«W toku»** — leady ze statusem «w toku». **«Pilne»** — ile z nich [od dawna stoi w miejscu](#leads-urgent). **«Kontakty»** — wszystkie działania osoby na leadach w tygodniu: otwarcie karty, danych kontaktowych, przypomnienie, status, wiadomość w dyskusji. To praca z leadami, a nie zimne kontakty z sekcji «Kontakty». **«Pierwsze kontakty»** — kliknięcia «Pokaż dane kontaktowe». **«Wygrane»**, **«Wpływy»** — pieniądze z jej projektów w tygodniu. **«Plan kontaktów»** — zimne kontakty wobec planu, który ustalasz w sekcji [«Zespół»](/admin/team).",
            "«Najlepsi w tygodniu» pojawiają się, gdy w zespole są co najmniej dwie osoby.",
          ],
          admin: [
            "Tabela dla wszystkich oprócz Ciebie; strzałka — w porównaniu z poprzednim tygodniem.",
            "**«Kontakty»** — wszystkie działania osoby na leadach w tygodniu (otwarcie, dane kontaktowe, przypomnienie, status, dyskusja), a nie zimne kontakty; zimne są w kolumnie **«Plan kontaktów»**. **«Pierwsze kontakty»** — kliknięcia «Pokaż dane kontaktowe». Kolumnę **«Do wypłaty»** widzisz tylko Ty.",
          ],
        },
      },
      {
        id: "banner",
        title: "Czerwony pasek «Przypomnienia nie są dostarczane»",
        body: {
          manager: [
            "Pojawia się na górze strony głównej, jeśli od ponad pół godziny nikt nie rozsyłał przypomnień. Od razu powiedz właścicielowi: dopóki pasek wisi, przypomnienia do Twoich leadów nie przychodzą — sprawdzaj je sam w kartach.",
          ],
          head: [
            "Pojawia się, jeśli sweep — przebieg według harmonogramu co pięć minut — nie przeszedł od ponad pół godziny. Dopóki pasek wisi, przypomnienia nie przychodzą do nikogo. Powiedz właścicielowi.",
          ],
          admin: [
            "Sweep to przebieg timera na serwerze co pięć minut: rozsyła przypomnienia, przesuwa kolejkę leadów, rozdziela porcje kontaktów. Pasek pojawia się, jeśli udanego przebiegu nie było od ponad 30 minut.",
            "Co sprawdzić: `systemctl status devuz-reminders.timer` na serwerze i `REMINDER_SWEEP_SECRET` w `.env`. Szybki przegląd — GitHub → Actions → «Осмотр связи с сервером» (przegląd połączenia z serwerem).",
          ],
        },
      },
    ],
  },
};
