import type { PanelLocale } from "@/lib/admin/i18n";

/**
 * Видеокурс в «Обучении»: 13 роликов для менеджеров.
 *
 * Задача Александра, утверждена владельцем 13.10.2026: «за 60 минут
 * менеджеры стали гуру продаж». Речь по-русски, субтитры на узбекском.
 * Сценарии и как ролики собраны — docs/training/video-guides/. Сами файлы
 * загружают владелец и руководитель прямо на странице «Обучение»: ролик
 * хранится как видео к инструкции (lib/admin/help-videos.ts) с ключом
 * course-01 … course-13.
 *
 * Порядок здесь — порядок блоков в сценарии. Ключ ролика не меняется, даже
 * если поменялось название: по нему лежит файл.
 */
export type VideoLesson = {
  key: string;
  minutes: number;
  title: { readonly [L in PanelLocale]: string };
};

export const VIDEO_LESSONS: readonly VideoLesson[] = [
  {
    key: "course-01",
    minutes: 4,
    title: { ru: "Кто мы и что такое сайт", uz: "Biz kimmiz va sayt nima", pl: "Kim jesteśmy i czym jest strona" },
  },
  {
    key: "course-02",
    minutes: 6,
    title: {
      ru: "Словарик: десять слов простыми словами",
      uz: "Lug‘at: o‘nta so‘z oddiy tilda",
      pl: "Słowniczek: dziesięć pojęć prostymi słowami",
    },
  },
  {
    key: "course-03",
    minutes: 6,
    title: { ru: "Что мы продаём: меню студии", uz: "Biz nima sotamiz: studiya menyusi", pl: "Co sprzedajemy: menu studia" },
  },
  {
    key: "course-04",
    minutes: 4,
    title: {
      ru: "Владелец покупает не сайт, а заявки",
      uz: "Ega sayt emas, ariza sotib oladi",
      pl: "Właściciel kupuje zgłoszenia, a nie stronę",
    },
  },
  {
    key: "course-05",
    minutes: 4,
    title: {
      ru: "Путь клиента, часть 1: от «Здравствуйте» до «+»",
      uz: "Mijoz yo‘li, 1-qism: salomdan «+»gacha",
      pl: "Droga klienta, część 1: od powitania do «+»",
    },
  },
  {
    key: "course-06",
    minutes: 5,
    title: {
      ru: "Путь клиента, часть 2: макет, акция 48 часов, договор",
      uz: "Mijoz yo‘li, 2-qism: maket, 48 soatlik aksiya, shartnoma",
      pl: "Droga klienta, część 2: makieta, promocja 48 godzin, umowa",
    },
  },
  {
    key: "course-07",
    minutes: 5,
    title: { ru: "Кто такой владелец бизнеса: эмпатия", uz: "Biznes egasi kim: empatiya", pl: "Kim jest właściciel firmy: empatia" },
  },
  {
    key: "course-08",
    minutes: 4,
    title: {
      ru: "Страхи и вопросы, часть 1",
      uz: "Qo‘rquvlar va savollar, 1-qism",
      pl: "Obawy i pytania, część 1",
    },
  },
  {
    key: "course-09",
    minutes: 4,
    title: {
      ru: "Страхи и вопросы, часть 2",
      uz: "Qo‘rquvlar va savollar, 2-qism",
      pl: "Obawy i pytania, część 2",
    },
  },
  {
    key: "course-10",
    minutes: 5,
    title: {
      ru: "Продажи на доверии: как покупают в Узбекистане",
      uz: "Ishonch bilan sotish: O‘zbekistonda qanday sotib olishadi",
      pl: "Sprzedaż na zaufaniu: jak kupuje się w Uzbekistanie",
    },
  },
  {
    key: "course-11",
    minutes: 4,
    title: {
      ru: "Сарафанное радио: рекомендации и партнёры",
      uz: "Og‘izdan og‘izga: tavsiyalar va hamkorlar",
      pl: "Poczta pantoflowa: polecenia i partnerzy",
    },
  },
  {
    key: "course-12",
    minutes: 4,
    title: {
      ru: "Фантазия: рисуем картинку будущего на наших макетах",
      uz: "Tasavvur: maketlarimizda kelajak rasmini chizamiz",
      pl: "Wyobraźnia: malujemy obraz przyszłości na naszych makietach",
    },
  },
  {
    key: "course-13",
    minutes: 2,
    title: {
      ru: "Итог: шпаргалка и чего мы никогда не обещаем",
      uz: "Xulosa: shpargalka va biz hech qachon va’da qilmaydigan narsalar",
      pl: "Podsumowanie: ściągawka i czego nigdy nie obiecujemy",
    },
  },
];

export const VIDEO_COURSE_MINUTES = VIDEO_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0);
