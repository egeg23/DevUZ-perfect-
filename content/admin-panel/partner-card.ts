import { defineDict } from "@/lib/admin/i18n";

/** Карточка партнёра (app/admin/partners/[id], lib/partners/card.ts) — на языке сотрудника. */
export const partnerCardDict = defineDict({
  back: { ru: "← Все партнёры", uz: "← Barcha hamkorlar", pl: "← Wszyscy partnerzy" },
  gone: {
    ru: "Такого партнёра нет: его удалили или ссылка с ошибкой.",
    uz: "Bunday hamkor yo‘q: u o‘chirilgan yoki havolada xato bor.",
    pl: "Nie ma takiego partnera: został usunięty albo link jest błędny.",
  },

  clicks: { ru: "Переходов по ссылкам", uz: "Havolalar bo‘yicha o‘tishlar", pl: "Wejść z linków" },
  clients: { ru: "Клиентов", uz: "Mijozlar", pl: "Klienci" },
  clientsNote: {
    ru: (paid: number, projects: number) => `проектов оплачено ${paid} из ${projects}`,
    uz: (paid: number, projects: number) => `${projects} ta loyihadan ${paid} tasi to‘langan`,
    pl: (paid: number, projects: number) => `opłaconych projektów ${paid} z ${projects}`,
  },
  linksTitle: { ru: "Ссылки партнёра", uz: "Hamkor havolalari", pl: "Linki partnera" },
  linkStats: {
    ru: (clicks: number, leads: number) => `переходов ${clicks} · заявок ${leads}`,
    uz: (clicks: number, leads: number) => `o‘tishlar ${clicks} · arizalar ${leads}`,
    pl: (clicks: number, leads: number) => `wejść ${clicks} · zgłoszeń ${leads}`,
  },
  mainLink: { ru: "основная", uz: "asosiy", pl: "główny" },

  clientsTitle: { ru: "Клиенты партнёра", uz: "Hamkor mijozlari", pl: "Klienci partnera" },
  clientsLead: {
    ru: "Каждая заявка, которую засчитали партнёру: по его ссылке, от его агентства или по клиенту, которого он закрепил. Новые сверху. Нажмите на клиента — откроется карточка лида.",
    uz: "Hamkorga hisoblangan har bir ariza: uning havolasi, agentligi yoki u biriktirgan mijoz orqali. Yangilari tepada. Mijozni bosing — lid kartochkasi ochiladi.",
    pl: "Każde zgłoszenie zaliczone partnerowi: z jego linku, od jego agencji albo od klienta, którego przypiął. Nowe na górze. Kliknij klienta — otworzy się karta leada.",
  },
  stagesLine: {
    ru: (lead: number, work: number, contract: number, paid: number, lost: number) =>
      `заявок ${lead} · в работе ${work} · договор ${contract} · оплачено ${paid} · не сложилось ${lost}`,
    uz: (lead: number, work: number, contract: number, paid: number, lost: number) =>
      `arizalar ${lead} · ishda ${work} · shartnoma ${contract} · to‘langan ${paid} · bo‘lmadi ${lost}`,
    pl: (lead: number, work: number, contract: number, paid: number, lost: number) =>
      `zgłoszeń ${lead} · w pracy ${work} · umowa ${contract} · opłacone ${paid} · nie wyszło ${lost}`,
  },
  colWhen: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  colClient: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  colVia: { ru: "Откуда", uz: "Qayerdan", pl: "Skąd" },
  colStage: { ru: "Где сейчас", uz: "Hozir qayerda", pl: "Gdzie teraz" },
  colOwner: { ru: "Ведёт", uz: "Olib boradi", pl: "Prowadzi" },
  colProject: { ru: "Проект", uz: "Loyiha", pl: "Projekt" },
  colAccrual: { ru: "Начислено партнёру", uz: "Hamkorga hisoblangan", pl: "Naliczone partnerowi" },
  viaMain: { ru: "основная ссылка", uz: "asosiy havola", pl: "główny link" },
  nobody: { ru: "ничей", uz: "hech kimniki emas", pl: "niczyj" },
  noProject: { ru: "нет", uz: "yo‘q", pl: "brak" },
  voided: {
    ru: (reason: string) => `не засчитан: ${reason}`,
    uz: (reason: string) => `hisoblanmagan: ${reason}`,
    pl: (reason: string) => `niezaliczony: ${reason}`,
  },
  noClients: {
    ru: "Пока ни одной заявки. Переходы по ссылке есть в строке «Ссылки партнёра».",
    uz: "Hozircha birorta ariza yo‘q. Havola bo‘yicha o‘tishlar «Hamkor havolalari» qatorida.",
    pl: "Na razie żadnego zgłoszenia. Wejścia z linku są w wierszu «Linki partnera».",
  },

  stage_lead: { ru: "заявка", uz: "ariza", pl: "zgłoszenie" },
  stage_work: { ru: "в работе", uz: "ishda", pl: "w pracy" },
  stage_contract: { ru: "договор", uz: "shartnoma", pl: "umowa" },
  stage_signed: { ru: "договор подписан", uz: "shartnoma imzolangan", pl: "umowa podpisana" },
  stage_paid: { ru: "оплачено", uz: "to‘langan", pl: "opłacone" },
  stage_lost: { ru: "не сложилось", uz: "bo‘lmadi", pl: "nie wyszło" },

  acc_frozen: { ru: "заморожено", uz: "muzlatilgan", pl: "zamrożone" },
  acc_earned: { ru: "заработано", uz: "ishlab topilgan", pl: "zarobione" },
  acc_void: { ru: "не засчитано", uz: "hisoblanmagan", pl: "niezaliczone" },

  extraTitle: { ru: "Проекты, засчитанные руками", uz: "Qo‘lda hisoblangan loyihalar", pl: "Projekty zaliczone ręcznie" },
  extraLead: {
    ru: "Клиент пришёл не по ссылке, но проект привязан к партнёру в карточке проекта. Начисление по ним — как по остальным.",
    uz: "Mijoz havola orqali kelmagan, lekin loyiha kartochkasida hamkorga biriktirilgan. Ular bo‘yicha hisob — boshqalar kabi.",
    pl: "Klient nie przyszedł z linku, ale projekt jest przypięty do partnera w karcie projektu. Naliczenie jak przy pozostałych.",
  },
  agenciesTitle: { ru: "Агентства партнёра", uz: "Hamkor agentliklari", pl: "Agencje partnera" },
});
