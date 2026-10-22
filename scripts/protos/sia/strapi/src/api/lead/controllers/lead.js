'use strict';

const { factories } = require('@strapi/strapi');

/* Заявка с сайта: посетитель задаёт только то, что сам написал. Статус и заметки — дело менеджера. */
const FROM_SITE = ['name', 'phone', 'email', 'message', 'projectType'];

module.exports = factories.createCoreController('api::lead.lead', () => ({
  async create(ctx) {
    const data = (ctx.request.body && ctx.request.body.data) || {};
    const clean = {};
    for (const k of FROM_SITE) if (typeof data[k] === 'string') clean[k] = data[k].slice(0, 2000);
    if (!clean.phone && !clean.email) return ctx.badRequest('Нужен телефон или почта');
    ctx.request.body = { data: { ...clean, source: 'Сайт', stage: 'Новая' } };
    return super.create(ctx);
  },
}));
