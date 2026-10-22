'use strict';

/* Подписи полей в «Контент-менеджере»: имена полей в коде латиницей, человек видит русские. */
module.exports = {
  mainField: { project: 'code', 'object-type': 'name', service: 'name', 'news-item': 'title', 'team-member': 'name', lead: 'name', 'log-entry': 'label' },
  /* Что видно в свёрнутой строке повторяемого блока. */
  componentMain: { 'shared.step': 'text', 'shared.link': 'label', 'block.stat': 'label' },
  /* Столбцы в списках и порядок по умолчанию. */
  list: {
    project: ['code', 'title', 'category', 'cover'], 'object-type': ['name'], service: ['name', 'facts', 'photo'],
    'news-item': ['title', 'dates', 'place'], 'team-member': ['photo', 'name', 'role'],
    lead: ['createdAt', 'name', 'phone', 'projectType', 'stage'], 'log-entry': ['createdAt', 'user', 'action', 'model', 'label'],
  },
  sort: {
    project: { defaultSortBy: 'order', defaultSortOrder: 'ASC' }, 'team-member': { defaultSortBy: 'order', defaultSortOrder: 'ASC' },
    service: { defaultSortBy: 'order', defaultSortOrder: 'ASC' }, lead: { defaultSortBy: 'createdAt', defaultSortOrder: 'DESC' },
    'log-entry': { defaultSortBy: 'createdAt', defaultSortOrder: 'DESC' },
  },
  types: {
    project: {
      code: 'Код проекта', slug: 'Адрес страницы', category: 'Раздел', title: 'Название', subtitle: 'Коротко о проекте',
      objectTypes: 'Типы объекта', area: 'Площадь, м²', termMonths: 'Срок, месяцев', date: 'Дата', lead: 'Описание',
      steps: 'Что было сделано', cover: 'Обложка', drawing: 'Чертёж', gallery: 'Фото проекта', featured: 'Показать на главной',
      order: 'Порядок', seo: 'Для поисковиков',
    },
    'object-type': { name: 'Название', slug: 'Адрес', projects: 'Проекты' },
    service: { name: 'Услуга', subtitle: 'Подзаголовок', description: 'Описание', facts: 'Цена и срок', photo: 'Фото', order: 'Порядок' },
    'news-item': { title: 'Заголовок', kind: 'Что это', dates: 'Даты', place: 'Где', text: 'Текст', cover: 'Обложка', gallery: 'Фото', link: 'Ссылка' },
    'team-member': { name: 'Имя', role: 'Должность', photo: 'Фото', order: 'Порядок' },
    lead: { createdAt: 'Когда', name: 'Имя', phone: 'Телефон', email: 'Почта', message: 'Сообщение', source: 'Откуда', stage: 'Статус', projectType: 'Что нужно', notes: 'Заметки менеджера' },
    'log-entry': { createdAt: 'Когда', action: 'Действие', model: 'Раздел', recordId: 'Запись', label: 'Что', user: 'Кто' },
    home: { blocks: 'Блоки главной (порядок — перетаскиванием)', seo: 'Для поисковиков' },
    contact: { phone: 'Телефон', mobile: 'Мобильный (WhatsApp)', email: 'Почта', address: 'Адрес', metro: 'Метро', hours: 'Часы работы', whatsapp: 'WhatsApp, номер', telegram: 'Telegram, ссылка', social: 'Соцсети' },
  },
  components: {
    'shared.seo': { metaTitle: 'Заголовок вкладки', metaDescription: 'Описание в поиске', shareImage: 'Картинка для ссылок' },
    'shared.step': { text: 'Текст' },
    'shared.link': { label: 'Название', url: 'Ссылка' },
    'block.hero': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок', photos: 'Фото' },
    'block.text': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок' },
    'block.stats': { hidden: 'Скрыть блок', items: 'Цифры' },
    'block.stat': { value: 'Число', label: 'Подпись' },
    'block.projects': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок', category: 'Какие проекты', photos: 'Фото' },
    'block.gallery': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок', photos: 'Фото' },
    'block.services': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок', photos: 'Фото' },
    'block.process': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок', steps: 'Этапы' },
    'block.news': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок' },
    'block.team': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок' },
    'block.contacts': { title: 'Заголовок', text: 'Текст', hidden: 'Скрыть блок' },
  },
};
