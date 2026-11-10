// Конструктор цены макета Nek Dental Studio: сайт и допы тумблерами.
//
// Владелец DevUz, 10.11.2026: «Сайт 1000$, с допами должно быть вместе не
// дороже 3000$. Мы делали для Сияния Севера, возьми от туда фишки». Тумблер
// включает и выключает настоящий блок на сайте (data-addon="<id>"), итог —
// сразу, как у Optimal Prime. Обычная цена 2 500 $ — оценка DevUz для сайта
// клиники на трёх языках с пролётом и записью (SOURCES.md, подтвердить).
// Допы — то, что у Сияния Севера клиника взяла первым (админка с записью,
// пролёт, квиз, чат), и то, что в Тбилиси уже есть у клиник, которые лечат
// иностранцев (план визита для приезжих). Все допы вместе — 2 000 $, с
// сайтом — 3 000 $.

export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  en: { t: "Nek Dental Studio website", d: "In English, Georgian and Russian, phone first: eight services in your words, care before the procedure, the team, your space in photos, reviews, questions, a booking in two taps to WhatsApp or a call, the map and hours." },
  ka: { t: "Nek Dental Studio-ს საიტი", d: "ინგლისურად, ქართულად და რუსულად, ჯერ ტელეფონისთვის: რვა მომსახურება თქვენი სიტყვებით, ზრუნვა პროცედურამდე, გუნდი, თქვენი სივრცე ფოტოებში, შეფასებები, კითხვები, ჩაწერა ორ შეხებაში WhatsApp-ში ან ზარით, რუკა და საათები." },
  ru: { t: "Сайт Nek Dental Studio", d: "На английском, грузинском и русском, сначала под телефон: восемь услуг вашими словами, забота до процедуры, команда, ваше пространство на фото, отзывы, вопросы, запись в два нажатия в WhatsApp или звонком, карта и часы." },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* star — клиники берут первым (Сияние Севера); who — у кого это уже есть. */
export const ADDONS = [
  { id: "fly", price: 350, star: true,
    en: { t: "Fly-through: from reception into the tooth", e: "The camera enters your flower sign, flies through the lounge into the treatment room and ends on a restored tooth; drawn from your photos, separate for phone and computer", who: "not seen at Tbilisi clinics" },
    ka: { t: "გადაფრენა: რეცეფციიდან კბილამდე", e: "კამერა თქვენს ყვავილის ნიშანში შედის, სივრცეში გადის კაბინეტში და აღდგენილ კბილზე სრულდება; თქვენი ფოტოებით, ცალკე ტელეფონისა და კომპიუტერისთვის", who: "თბილისის კლინიკებთან ვერ ვნახეთ" },
    ru: { t: "Пролёт: от ресепшена до зуба", e: "Камера входит в ваш знак-цветок, пролетает лаунж в кабинет и заканчивает на реставрированном зубе; по вашим фото, отдельно под телефон и компьютер", who: "у клиник Тбилиси не нашли" } },
  { id: "admin", price: 450, star: true,
    en: { t: "Clinic panel: bookings, messengers, schedule", e: "Requests from the site arrive first in the list; the administrator confirms a time, and the patient sees the status on the site. WhatsApp, Instagram, Telegram and Viber through Wazzup in one window, the reply goes to the same channel. amoCRM or Bitrix24, a Telegram bot for the administrator, reminders to patients. Schedule by doctor, roles: the administrator does not see revenue, history of actions, three languages", who: "as in our Greenwell and Syanie Severa panels" },
    ka: { t: "კლინიკის პანელი: ჩაწერა, მესენჯერები, განრიგი", e: "საიტიდან მოთხოვნა სიაში პირველი ჩნდება; ადმინისტრატორი ადასტურებს დროს და პაციენტი სტატუსს საიტზე ხედავს. WhatsApp, Instagram, Telegram და Viber Wazzup-ით ერთ ფანჯარაში, პასუხი იმავე არხში მიდის. amoCRM ან Bitrix24, Telegram ბოტი ადმინისტრატორისთვის, შეხსენებები პაციენტებს. განრიგი ექიმების მიხედვით, როლები: ადმინისტრატორი შემოსავალს ვერ ხედავს, ქმედებების ისტორია, სამი ენა", who: "როგორც ჩვენს Greenwell-ისა და Syanie Severa-ს პანელებში" },
    ru: { t: "Панель клиники: запись, мессенджеры, расписание", e: "Заявка с сайта первой строкой, администратор подтверждает время, пациент видит статус на сайте. WhatsApp, Instagram, Telegram и Viber через Wazzup одним окном, ответ уходит в тот же канал. amoCRM или Bitrix24, Telegram-бот администратору, напоминания пациентам. Расписание по врачам, роли: администратор не видит выручку, история действий, три языка", who: "как в наших панелях Greenwell и «Сияния Севера»" } },
  { id: "quiz", price: 150,
    en: { t: "Smile quiz in 4 steps", e: "What bothers you, which teeth, how soon, which language; at the end the service to start with and a booking with the answers", who: "quizzes are common at clinics in Russia, rare in Tbilisi" },
    ka: { t: "ღიმილის ქვიზი 4 ნაბიჯად", e: "რა გაწუხებთ, რომელი კბილები, რამდენად სასწრაფოდ, რომელ ენაზე; ბოლოს მომსახურება, რომლითაც დაიწყოთ, და ჩაწერა პასუხებით", who: "ქვიზი რუსეთის კლინიკებში ხშირია, თბილისში იშვიათი" },
    ru: { t: "Квиз «Ваша улыбка» из 4 шагов", e: "Что беспокоит, какие зубы, как скоро, на каком языке; в конце услуга, с которой начать, и запись с ответами", who: "у клиник России обычное дело, в Тбилиси редкость" } },
  { id: "chat", price: 250, star: true,
    en: { t: "Chat on the site: answers or the administrator", e: "The patient writes on the site; answers come from your clinic's questions and facts, or from the administrator straight from Telegram. The conversation is in the panel", who: "as in Syanie Severa" },
    ka: { t: "ჩატი საიტზე: პასუხები ან ადმინისტრატორი", e: "პაციენტი საიტზე წერს; პასუხი მოდის კლინიკის კითხვებიდან და ფაქტებიდან, ან ადმინისტრატორისგან პირდაპირ Telegram-იდან. მიმოწერა პანელშია", who: "როგორც Syanie Severa-ში" },
    ru: { t: "Чат на сайте: ответы или администратор", e: "Пациент пишет на сайте; отвечают вопросы и факты клиники или администратор прямо из Telegram. Переписка видна в панели", who: "как у «Сияния Севера»" } },
  { id: "remind", price: 200,
    en: { t: "Visit reminders to the patient", e: "A day before and two hours before the visit the patient gets a message with the time, the doctor and the map link", who: "clinics in Tbilisi remind by phone call" },
    ka: { t: "ვიზიტის შეხსენება პაციენტს", e: "ვიზიტამდე ერთი დღით და ორი საათით ადრე პაციენტი იღებს შეტყობინებას დროით, ექიმით და რუკის ბმულით", who: "თბილისის კლინიკები ზარით ახსენებენ" },
    ru: { t: "Напоминание о визите пациенту", e: "За день и за два часа до визита пациенту приходит сообщение со временем, врачом и ссылкой на карту", who: "клиники Тбилиси напоминают звонком" } },
  { id: "abroad", price: 200, star: true,
    en: { t: "Treatment for visitors to Tbilisi", e: "A page for patients from abroad: they choose the dates of the trip and the service, and the request comes with the dates, the language and the country", who: "NB Dental and Bucho Denti sell treatment to visitors" },
    ka: { t: "მკურნალობა თბილისის სტუმრებისთვის", e: "გვერდი საზღვარგარეთელი პაციენტებისთვის: ირჩევენ მოგზაურობის თარიღებს და მომსახურებას, მოთხოვნა მოდის თარიღებით, ენით და ქვეყნით", who: "NB Dental და Bucho Denti სტუმრებს მკურნალობას სთავაზობენ" },
    ru: { t: "Лечение для приезжих в Тбилиси", e: "Раздел для пациентов из-за границы: выбирают даты поездки и услугу, заявка приходит с датами, языком и страной", who: "NB Dental и Bucho Denti продают лечение приезжим" } },
  { id: "reviews", price: 150,
    en: { t: "Google reviews on the site", e: "The rating and fresh reviews from your Google card update themselves; after a visit the patient gets a request to leave a review", who: "most clinics only link to Google" },
    ka: { t: "Google-ის შეფასებები საიტზე", e: "რეიტინგი და ახალი შეფასებები თქვენი Google ბარათიდან თავად ახლდება; ვიზიტის შემდეგ პაციენტი იღებს თხოვნას, დატოვოს შეფასება", who: "კლინიკების უმეტესობა მხოლოდ Google-ის ბმულს აძლევს" },
    ru: { t: "Отзывы Google на сайте", e: "Оценка и свежие отзывы из вашей карточки Google обновляются сами, после визита пациенту приходит просьба оставить отзыв", who: "у большинства клиник только ссылка на Google" } },
  { id: "pages", price: 250,
    en: { t: "Service pages for search", e: "Restoration, braces, whitening, implants, crowns: a page for each, in three languages, so patients find you in Google", who: "your clinic has no site yet: you are not found in search" },
    ka: { t: "მომსახურების გვერდები ძიებისთვის", e: "რესტავრაცია, ბრეკეტები, გათეთრება, იმპლანტები, გვირგვინები: გვერდი თითოეულისთვის, სამ ენაზე, რომ პაციენტებმა Google-ში გიპოვონ", who: "კლინიკას ჯერ საიტი არ აქვს: ძიებაში არ ჩანს" },
    ru: { t: "Страницы услуг под поиск", e: "Реставрация, брекеты, отбеливание, импланты, коронки: страница на каждую, на трёх языках, чтобы пациенты находили вас в Google", who: "сайта пока нет: в поиске клиники не видно" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
