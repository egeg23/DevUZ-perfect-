// Факты Nek Dental Studio — только из их Instagram, Facebook, TikTok,
// карточки на картах и справочников yell.ge и 100doc.ge (SOURCES.md).
// Тексты на трёх языках: en (главная), ka, ru. Что не подтверждено
// клиникой, помечено в SOURCES.md «уточнить».

export const LANGS = ["en", "ka", "ru"];

export const CLINIC = {
  name: "Nek Dental Studio",
  tel: "+995596330303",
  phone: "+995 596 330 303",
  wa: "995596330303",
  mail: "nekdentalstudio@gmail.com",
  map: "https://maps.app.goo.gl/uFvc6nnvKVviaFnXA",
  ig: "https://www.instagram.com/nekdentalstudio/",
  fb: "https://www.facebook.com/NekDental/",
  tt: "https://www.tiktok.com/@nekdentalstudio",
  addr: {
    en: "65 Zakaria Paliashvili St., Vake, Tbilisi",
    ka: "ზ. ფალიაშვილის 65, ვაკე, თბილისი",
    ru: "Тбилиси, Ваке, ул. Захария Палиашвили, 65",
  },
  hours: {
    en: "Monday to Saturday, 11:00-19:00",
    ka: "ორშაბათი-შაბათი, 11:00-19:00",
    ru: "Понедельник-суббота, 11:00-19:00",
  },
  langs: {
    en: "We speak Georgian, English and Russian",
    ka: "ვსაუბრობთ ქართულად, ინგლისურად და რუსულად",
    ru: "Говорим по-грузински, по-английски и по-русски",
  },
  slogan: {
    en: "A modern clinic and caring staff",
    ka: "თანამედროვე კლინიკა და მზრუნველი პერსონალი",
    ru: "Современная клиника и заботливый персонал",
  },
};

/* Услуги: первые три — их посты (реставрация, брекеты, отбеливание),
   остальные — направления клиники в каталоге 100doc.ge. */
export const SERVICES = [
  { id: "resto", icon: "tooth", post: true,
    en: ["Artistic restoration", "The precise restoration of a tooth's shape, color and natural aesthetics, so the smile looks harmonious and natural. Every restoration is planned individually."],
    ka: ["მხატვრული რესტავრაცია", "ფორმის, ფერისა და ბუნებრივი ესთეტიკის ზუსტი აღდგენა, რათა ღიმილი ჰარმონიულად და ბუნებრივად გამოიყურებოდეს. თითოეული რესტავრაცია ინდივიდუალურად იგეგმება."],
    ru: ["Художественная реставрация", "Точное восстановление формы, цвета и естественной эстетики зуба, чтобы улыбка выглядела гармонично и естественно. Каждая реставрация планируется индивидуально."] },
  { id: "ortho", icon: "brace", post: true,
    en: ["Braces and orthodontics", "Braces are not only a straight smile. They are a step towards a healthy bite, correct tooth alignment and more confidence."],
    ka: ["ბრეკეტები და ორთოდონტია", "ბრეკეტები მხოლოდ სწორი ღიმილი არ არის. ეს არის ნაბიჯი ჯანმრთელი თანკბილვის, კბილების სწორი განლაგებისა და მეტი თავდაჯერებულობისკენ."],
    ru: ["Брекеты и ортодонтия", "Брекеты это не только ровная улыбка. Это шаг к здоровому прикусу, правильному положению зубов и уверенности в себе."] },
  { id: "white", icon: "spark", post: true, price: 550,
    en: ["Professional teeth whitening", "A white, healthy smile is an important part of self-confidence."],
    ka: ["კბილების პროფესიონალური გათეთრება", "თეთრი და მოვლილი ღიმილი თავდაჯერებულობის მნიშვნელოვანი ნაწილია."],
    ru: ["Профессиональное отбеливание", "Белая, ухоженная улыбка: важная часть уверенности в себе."] },
  { id: "implant", icon: "implant",
    en: ["Implantology", "Restoring a missing tooth with an implant, planned together with the surgeon."],
    ka: ["იმპლანტოლოგია", "დაკარგული კბილის აღდგენა იმპლანტით, ქირურგთან ერთად დაგეგმილი."],
    ru: ["Имплантология", "Восстановление потерянного зуба на импланте, план вместе с хирургом."] },
  { id: "prost", icon: "crown",
    en: ["Prosthodontics", "Crowns and prosthetics that look and work like your own teeth."],
    ka: ["ორთოპედია", "გვირგვინები და პროთეზირება, რომლებიც საკუთარი კბილებივით გამოიყურება და მუშაობს."],
    ru: ["Протезирование", "Коронки и протезы, которые выглядят и работают как свои зубы."] },
  { id: "surg", icon: "shield",
    en: ["Oral and maxillofacial surgery", "Extractions and surgical treatment by an oral and a maxillofacial surgeon."],
    ka: ["ქირურგია და ყბა-სახის ქირურგია", "კბილის ამოღება და ქირურგიული მკურნალობა ქირურგისა და ყბა-სახის ქირურგის მიერ."],
    ru: ["Хирургия и челюстно-лицевая хирургия", "Удаление и хирургическое лечение у хирурга и челюстно-лицевого хирурга."] },
  { id: "perio", icon: "drop",
    en: ["Periodontics", "Care for the gums, the foundation that every smile stands on."],
    ka: ["პაროდონტოლოგია", "ღრძილების მოვლა: საფუძველი, რომელზეც ყველა ღიმილი დგას."],
    ru: ["Пародонтология", "Лечение дёсен: основа, на которой стоит любая улыбка."] },
  { id: "thera", icon: "care",
    en: ["Therapy and fillings", "Treating cavities and restoring teeth, from the first visit to the follow-up."],
    ka: ["თერაპია და ბჟენი", "კარიესის მკურნალობა და კბილების აღდგენა, პირველი ვიზიტიდან საკონტროლომდე."],
    ru: ["Терапия и пломбы", "Лечение кариеса и восстановление зубов, от первого визита до контрольного."] },
];

/* Забота до процедуры: их пост DY7UOtsImCP. */
export const CARE = [
  { en: ["Professional specialists", "Every stage of treatment is planned by the doctor who carries it out."], ka: ["პროფესიონალი სპეციალისტები", "მკურნალობის თითოეულ ეტაპს გეგმავს ექიმი, რომელიც მას ატარებს."], ru: ["Профессиональные специалисты", "Каждый этап лечения планирует врач, который его проводит."] },
  { en: ["Safe and sterile environment", "Modern equipment, a clean space and attention to every detail."], ka: ["უსაფრთხო და სტერილური გარემო", "თანამედროვე ტექნიკა, სუფთა გარემო და ყურადღება თითოეულ დეტალზე."], ru: ["Безопасная и стерильная среда", "Современная техника, чистое пространство и внимание к мелочам."] },
  { en: ["Comfort in every detail", "A calm visit starts with the right environment: the lounge, the light, the people."], ka: ["კომფორტი თითოეულ დეტალში", "მშვიდი ვიზიტი სწორი გარემოდან იწყება: სივრცე, სინათლე, ადამიანები."], ru: ["Комфорт во всём", "Спокойный визит начинается с правильной среды: лаунж, свет, люди."] },
];

/* Команда — открытый каталог 100doc.ge, уточнить у клиники. Имена — латиницей
   (en, ru) и по-грузински. */
export const TEAM = [
  { ka: "გიორგი ბანცაძე", en: "Giorgi Bantsadze", r: { en: "Maxillofacial surgeon", ka: "ყბა-სახის ქირურგი", ru: "Челюстно-лицевой хирург" } },
  { ka: "მარიამ ხეჩუაშვილი", en: "Mariam Khechuashvili", r: { en: "Prosthodontist", ka: "ორთოპედი", ru: "Ортопед" } },
  { ka: "ნინო მარტიაშვილი", en: "Nino Martiashvili", r: { en: "Therapist, periodontist, surgeon", ka: "თერაპევტი, პაროდონტოლოგი, ქირურგი", ru: "Терапевт, пародонтолог, хирург" } },
  { ka: "თამარ დგებუაძე", en: "Tamar Dgebuadze", r: { en: "Dentist", ka: "სტომატოლოგი", ru: "Стоматолог-терапевт" } },
  { ka: "თამარ მგებრიშვილი", en: "Tamar Mgebrishvili", r: { en: "Dentist", ka: "სტომატოლოგი", ru: "Стоматолог-терапевт" } },
  { ka: "ნიკოლოზ გზირიშვილი", en: "Nikoloz Gzirishvili", r: { en: "Orthodontist", ka: "ორთოდონტი", ru: "Ортодонт" } },
  { ka: "თეკლე გავაშელიშვილი", en: "Tekle Gavashelishvili", r: { en: "Dentist", ka: "სტომატოლოგი", ru: "Стоматолог-терапевт" } },
  { ka: "ელისო ცაცანაშვილი", en: "Eliso Tsatsanashvili", r: { en: "Oral surgeon", ka: "ქირურგი", ru: "Хирург" } },
  { ka: "გუკი ბიჩიკაშვილი", en: "Guki Bichikashvili", r: { en: "Dentist", ka: "სტომატოლოგი", ru: "Стоматолог-терапевт" } },
  { ka: "თამარ ფიფია", en: "Tamar Pipia", r: { en: "Dentist", ka: "სტომატოლოგი", ru: "Стоматолог-терапевт" } },
];

/* Отзывы — 100doc.ge, как написаны (английский оригинал); перевод — наш. */
export const REVIEWS = [
  { who: "Buzz L.", at: "21.05.2024",
    en: "Everything is just perfect down here. All from reception to surgeon are exceptional professionals and cordially care about you and your health.",
    ka: "აქ ყველაფერი უბრალოდ შესანიშნავია. რეცეფციიდან ქირურგამდე ყველა გამორჩეული პროფესიონალია და გულით ზრუნავს თქვენზე და თქვენს ჯანმრთელობაზე.",
    ru: "Здесь всё просто идеально. Все, от ресепшена до хирурга, настоящие профессионалы и искренне заботятся о вас и вашем здоровье." },
  { who: "Mariia Zaitseva", at: "10.03.2022",
    en: "Excellent dental studio. Thanks for the treatment and gentle care. Dentists speak eng, geo, rus.",
    ka: "შესანიშნავი სტომატოლოგიური სტუდია. მადლობა მკურნალობისა და ნაზი მზრუნველობისთვის. ექიმები საუბრობენ ინგლისურად, ქართულად და რუსულად.",
    ru: "Отличная стоматология. Спасибо за лечение и бережную заботу. Врачи говорят по-английски, по-грузински и по-русски." },
  { who: "Mikhail Vodopianov", at: "21.12.2023",
    en: "It's a beautiful place to solve your teeth issues. Tamara's wide range of expertise is impressive. Friendly staff members.",
    ka: "მშვენიერი ადგილია კბილების პრობლემების მოსაგვარებლად. თამარის ფართო გამოცდილება შთამბეჭდავია. მეგობრული პერსონალი.",
    ru: "Красивое место, где решают проблемы с зубами. Широкий опыт Тамары впечатляет. Дружелюбный персонал." },
];

/* Вопросы о реставрации: общее, без обещаний сроков и цен (их нет у клиники). */
export const FAQ = [
  { en: ["How long does an artistic restoration take?", "It depends on the tooth and on how much of it needs restoring. The doctor tells you after the examination, before the work starts."], ka: ["რამდენ ხანს გრძელდება მხატვრული რესტავრაცია?", "ეს დამოკიდებულია კბილზე და იმაზე, რამდენის აღდგენაა საჭირო. ექიმი გეტყვით დათვალიერების შემდეგ, სამუშაოს დაწყებამდე."], ru: ["Сколько длится художественная реставрация?", "Зависит от зуба и от того, сколько нужно восстановить. Врач скажет после осмотра, до начала работы."] },
  { en: ["Will the restored tooth differ in color?", "The color is matched to your own teeth, layer by layer, so the restoration looks natural next to them."], ka: ["განსხვავდება თუ არა ფერით აღდგენილი კბილი?", "ფერი შეირჩევა თქვენი კბილების მიხედვით, ფენა ფენა, რათა რესტავრაცია მათ გვერდით ბუნებრივად გამოიყურებოდეს."], ru: ["Будет ли зуб отличаться по цвету?", "Цвет подбирается под ваши зубы, слой за слоем, чтобы реставрация рядом с ними выглядела естественно."] },
  { en: ["Do braces suit adults?", "Yes, the doctor plans each stage individually for your bite. Ask about it at the consultation."], ka: ["შეეფერება თუ არა ბრეკეტები ზრდასრულებს?", "დიახ, ექიმი თითოეულ ეტაპს ინდივიდუალურად გეგმავს თქვენი თანკბილვისთვის. იკითხეთ კონსულტაციაზე."], ru: ["Подходят ли брекеты взрослым?", "Да, врач планирует каждый этап под ваш прикус. Спросите на консультации."] },
  { en: ["Can I come from abroad?", "Patients come to Tbilisi for treatment. Write to us before the trip, and we will plan the visits around your dates."], ka: ["შემიძლია ჩამოვიდე საზღვარგარეთიდან?", "პაციენტები თბილისში მკურნალობისთვის ჩამოდიან. მოგზაურობამდე მოგვწერეთ და ვიზიტებს თქვენს თარიღებზე დავგეგმავთ."], ru: ["Можно приехать на лечение из-за границы?", "Пациенты приезжают в Тбилиси на лечение. Напишите до поездки, и мы спланируем визиты под ваши даты."] },
  { en: ["Which languages do the doctors speak?", "Georgian, English and Russian."], ka: ["რომელ ენებზე საუბრობენ ექიმები?", "ქართულად, ინგლისურად და რუსულად."], ru: ["На каких языках говорят врачи?", "По-грузински, по-английски и по-русски."] },
  { en: ["Where are you and when are you open?", "65 Zakaria Paliashvili St. in Vake, Monday to Saturday from 11:00 to 19:00."], ka: ["სად ხართ და როდის მუშაობთ?", "ზ. ფალიაშვილის 65, ვაკე, ორშაბათიდან შაბათის ჩათვლით 11:00-დან 19:00-მდე."], ru: ["Где вы и когда работаете?", "Ул. Палиашвили, 65, Ваке, с понедельника по субботу с 11:00 до 19:00."] },
];

/* Главы пролёта по прокрутке: доля сцены, где глава в центре. */
export const CHAPTERS = [
  { at: 0.06, en: ["Vake, 65 Paliashvili", "Nek Dental Studio"], ka: ["ვაკე, ფალიაშვილის 65", "Nek Dental Studio"], ru: ["Ваке, Палиашвили, 65", "Nek Dental Studio"] },
  { at: 0.3, en: ["The aesthetics of dentistry", "lie in the details"], ka: ["სტომატოლოგიის ესთეტიკა", "დეტალებშია"], ru: ["Эстетика стоматологии", "в деталях"] },
  { at: 0.52, en: ["A calm visit", "starts with the right environment"], ka: ["მშვიდი ვიზიტი", "სწორი გარემოდან იწყება"], ru: ["Спокойный визит", "начинается с правильной среды"] },
  { at: 0.74, en: ["Safe and sterile", "comfort in every detail"], ka: ["უსაფრთხო და სტერილური", "კომფორტი თითოეულ დეტალში"], ru: ["Безопасно и стерильно", "и спокойно на каждом шаге"] },
  { at: 0.94, en: ["Every restoration", "is planned individually"], ka: ["თითოეული რესტავრაცია", "ინდივიდუალურად იგეგმება"], ru: ["Каждая реставрация", "планируется индивидуально"] },
];
