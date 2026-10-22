'use strict';

/*
 * Первое наполнение панели: проекты архива бюро (65), услуги, коллектив,
 * выставки, контакты и блоки главной — из seed/data.json, фото — из папки
 * SIA_IMAGES (по умолчанию снимки макета, ../../../../public/protos/sia).
 * Запуск: npm run seed. Повторный запуск ничего не дублирует: если проекты
 * уже есть, скрипт выходит.
 */

const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

process.env.SIA_SEED = '1';

const ROOT = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed/data.json'), 'utf8'));
const IMAGES = path.resolve(ROOT, process.env.SIA_IMAGES || '../../../../public/protos/sia');
const uid = (n) => `api::${n}.${n}`;

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';
  try {
    if ((await app.documents(uid('project')).count({})) > 0) {
      console.log('Проекты уже есть, наполнение пропущено.');
      return;
    }
    const uploaded = new Map();
    const file = async (rel, alt) => {
      if (!rel) return null;
      if (uploaded.has(rel)) return uploaded.get(rel);
      const fp = path.join(IMAGES, rel);
      if (!fs.existsSync(fp)) return null;
      const [f] = await app.plugin('upload').service('upload').upload({
        data: { fileInfo: { name: path.basename(rel), alternativeText: alt || '' } },
        files: { filepath: fp, originalFilename: path.basename(rel), mimetype: 'image/webp', size: fs.statSync(fp).size },
      });
      uploaded.set(rel, f.id);
      return f.id;
    };
    const files = async (list, alt) => (await Promise.all((list || []).map((r) => file(r, alt)))).filter(Boolean);
    const publish = (n, data) => app.documents(uid(n)).create({ data, status: 'published' });

    const types = {};
    for (const name of [...new Set(DATA.projects.flatMap((p) => p.objectTypes))]) {
      types[name] = (await publish('object-type', { name })).documentId;
    }
    for (const p of DATA.projects) {
      await publish('project', {
        code: p.code, slug: p.slug, category: p.category, title: p.title, subtitle: p.subtitle,
        objectTypes: p.objectTypes.map((t) => types[t]), area: p.area, termMonths: p.termMonths, date: p.date,
        featured: p.featured, order: p.order, lead: p.lead, steps: p.steps.map((text) => ({ text })),
        cover: await file(p.cover, p.title), drawing: await file(p.drawing, ''), gallery: await files(p.gallery, p.title),
      });
    }
    for (const s of DATA.services) await publish('service', { ...s, photo: await file(s.photo, s.name) });
    for (const t of DATA.team) await publish('team-member', { ...t, photo: await file(t.photo, t.name) });
    for (const n of DATA.news) await publish('news-item', n);
    await app.documents(uid('contact')).create({ data: DATA.contact });
    const blocks = [];
    for (const b of DATA.home) {
      const out = { ...b };
      if (b.photos) out.photos = await files(b.photos, b.title);
      if (b.__component === 'block.process') out.steps = b.steps.map((text) => ({ text }));
      blocks.push(out);
    }
    await publish('home', { blocks });
    console.log(`Готово: проектов ${DATA.projects.length}, услуг ${DATA.services.length}, людей ${DATA.team.length}, выставок ${DATA.news.length}, фото ${uploaded.size}.`);
  } finally {
    /* дать Strapi дописать события о созданных записях */
    await new Promise((r) => setTimeout(r, 1500));
    await app.destroy();
  }
}

main().catch((e) => {
  console.error(e.message, JSON.stringify(e.details || {}));
  process.exit(1);
});
