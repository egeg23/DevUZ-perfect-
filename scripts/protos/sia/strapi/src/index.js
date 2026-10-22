'use strict';

/*
 * Админка бюро SIA на Strapi (Community, бесплатная).
 * При каждом запуске приводит в порядок то, что Strapi хранит в базе, а не
 * в коде: подписи полей по-русски, роли бюро с правами, открытое чтение
 * для сайта и приём заявок с сайта. И пишет журнал действий: в бесплатной
 * версии Strapi своего журнала нет, поэтому он свой (коллекция «Журнал»).
 */

const LABELS = require('./labels');

const SITE = ['project', 'service', 'news-item', 'team-member', 'object-type'];
const SINGLE = ['home', 'contact'];
const LOGGED = ['project', 'service', 'news-item', 'team-member', 'object-type', 'home', 'contact', 'lead'];
const uid = (n) => `api::${n}.${n}`;
const SYSTEM = ['createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations', 'documentId', 'id'];

/* Пути полей для прав: у компонента — каждое его поле через точку. */
function fieldsOf(strapi, model, prefix = '') {
  const out = [];
  for (const [name, a] of Object.entries(model.attributes)) {
    if (SYSTEM.includes(name)) continue;
    const path = prefix + name;
    if (a.type === 'component') out.push(...fieldsOf(strapi, strapi.components[a.component], path + '.'));
    else out.push(path);
  }
  return out;
}

const CM = (action) => `plugin::content-manager.explorer.${action}`;
const UPLOAD = ['plugin::upload.read', 'plugin::upload.assets.create', 'plugin::upload.assets.update', 'plugin::upload.assets.download', 'plugin::upload.assets.copy-link'];

/* Роли бюро. «Владелец» — встроенный Super Admin. */
const ROLES = [
  {
    code: 'sia-editor', name: 'Редактор сайта', description: 'Проекты, услуги, новости, коллектив, главная и контакты; медиатека. Заявки не видит.',
    content: { project: 'full', service: 'full', 'news-item': 'full', 'team-member': 'full', 'object-type': 'full', home: 'full', contact: 'full', 'log-entry': 'read' }, upload: true,
  },
  {
    code: 'sia-media', name: 'Медиа', description: 'Фото: медиатека, снимки проектов, новостей, услуг, коллектива и блоков главной. Тексты не меняет.',
    content: { project: 'media', 'news-item': 'media', 'team-member': 'media', service: 'media', home: 'media' }, upload: true,
  },
  {
    code: 'sia-sales', name: 'Менеджер заявок', description: 'Заявки с сайта: статус и заметки. Сайт не меняет.',
    content: { lead: 'full', project: 'read' }, upload: false,
  },
];

function permsFor(strapi, role) {
  const out = [];
  for (const [name, mode] of Object.entries(role.content)) {
    const model = strapi.contentTypes[uid(name)];
    const all = fieldsOf(strapi, model);
    const media = all.filter((f) => {
      const top = model.attributes[f.split('.')[0]];
      return top && (top.type === 'media' || top.type === 'dynamiczone');
    });
    const add = (action, fields) => out.push({ action: CM(action), subject: uid(name), properties: fields ? { fields } : {}, conditions: [] });
    if (mode === 'read') add('read', all);
    if (mode === 'media') { add('read', all); add('update', media); }
    if (mode === 'full') {
      add('read', all); add('create', all); add('update', all); add('delete');
      if (model.options && model.options.draftAndPublish) add('publish');
    }
  }
  if (role.upload) for (const action of UPLOAD) out.push({ action, subject: null, properties: {}, conditions: [] });
  return out;
}

async function syncRoles(strapi) {
  const roles = strapi.service('admin::role');
  for (const r of ROLES) {
    let role = await roles.findOne({ code: r.code });
    if (!role) role = await roles.create({ name: r.name, code: r.code, description: r.description });
    await roles.assignPermissions(role.id, permsFor(strapi, r));
  }
}

/* Сайт читает опубликованное без ключа; заявку с сайта можно только создать. */
async function syncPublic(strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const want = [
    ...SITE.flatMap((n) => [`${uid(n)}.find`, `${uid(n)}.findOne`]),
    ...SINGLE.map((n) => `${uid(n)}.find`),
    `${uid('lead')}.create`,
  ];
  const q = strapi.db.query('plugin::users-permissions.permission');
  const have = await q.findMany({ where: { role: role.id } });
  for (const action of want) if (!have.some((p) => p.action === action)) await q.create({ data: { action, role: role.id } });
}

/* Подписи полей по-русски в «Контент-менеджере». */
async function syncLabels(strapi) {
  const cm = strapi.plugin('content-manager');
  const types = cm.service('content-types');
  const comps = cm.service('components');
  const apply = (conf, labels) => {
    for (const [field, label] of Object.entries(labels)) {
      const m = conf.metadatas && conf.metadatas[field];
      if (!m) continue;
      if (m.edit) m.edit.label = label;
      if (m.list) m.list.label = label;
    }
    return { settings: conf.settings, metadatas: conf.metadatas, layouts: conf.layouts };
  };
  for (const [key, labels] of Object.entries(LABELS.types)) {
    const ct = strapi.contentTypes[uid(key)];
    if (!ct) continue;
    const conf = await types.findConfiguration(ct);
    if (LABELS.mainField[key]) conf.settings.mainField = LABELS.mainField[key];
    if (LABELS.list[key]) conf.layouts.list = LABELS.list[key];
    if (LABELS.sort[key]) Object.assign(conf.settings, LABELS.sort[key]);
    await types.updateConfiguration(ct, apply(conf, labels));
  }
  for (const [key, labels] of Object.entries(LABELS.components)) {
    const c = strapi.components[key];
    if (!c) continue;
    const conf = await comps.findConfiguration(c);
    if (LABELS.componentMain[key]) conf.settings.mainField = LABELS.componentMain[key];
    await comps.updateConfiguration(c, apply(conf, labels));
  }
}

/* Журнал: кто, что и когда изменил. Пишется на уровне документа, а не
   строки базы: у черновика и опубликованной версии одна запись. Первое
   наполнение (npm run seed) журнал не засоряет. */
const ACTIONS = { create: 'Создано', update: 'Изменено', delete: 'Удалено', publish: 'Опубликовано', unpublish: 'Снято с публикации' };
function logMiddleware(strapi) {
  const who = () => {
    const ctx = strapi.requestContext.get();
    const u = ctx && ctx.state && ctx.state.user;
    if (u) return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || 'пользователь';
    return ctx ? 'сайт' : 'система';
  };
  const last = new Map();
  return async (ctx, next) => {
    const result = await next();
    if (process.env.SIA_SEED || !ACTIONS[ctx.action] || !LOGGED.map(uid).includes(ctx.uid)) return result;
    const doc = (result && (result.entries ? result.entries[0] : result)) || {};
    /* Одно сохранение в панели Strapi делает несколько записей в базу — в журнал идёт одна строка. */
    const key = `${ctx.uid}:${doc.documentId}:${ctx.action}`;
    if (Date.now() - (last.get(key) || 0) < 3000) return result;
    last.set(key, Date.now());
    try {
      await strapi.db.query(uid('log-entry')).create({
        data: {
          action: ACTIONS[ctx.action],
          model: strapi.contentTypes[ctx.uid].info.displayName,
          recordId: doc.documentId || (ctx.params && ctx.params.documentId) || '',
          label: String(doc.title || doc.name || doc.code || doc.phone || '').slice(0, 250),
          user: who(),
        },
      });
    } catch (e) {
      strapi.log.warn(`журнал: ${e.message}`);
    }
    return result;
  };
}

module.exports = {
  register({ strapi }) {
    strapi.documents.use(logMiddleware(strapi));
  },
  async bootstrap({ strapi }) {
    await syncPublic(strapi);
    await syncRoles(strapi);
    await syncLabels(strapi);
  },
};
