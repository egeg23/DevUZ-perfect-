/* База сайта CZECHFARM: один файл SQLite на сервере компании
   (/opt/czechfarm/data). node:sqlite — без сторонних пакетов. */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SCHEMA = `
create table if not exists users(
  id integer primary key, login text unique not null, name text not null,
  role text not null, pass text not null, disabled integer not null default 0,
  kinds text not null default '', created_at integer not null);
create table if not exists sessions(
  id text primary key, user_id integer not null, created_at integer not null, last_at integer not null);
create table if not exists settings(k text primary key, v text not null);
create table if not exists leads(
  id integer primary key, no text unique not null, key text not null, at integer not null,
  kind text not null, src text not null default 'site', page text not null default '', lang text not null default 'ru',
  name text not null default '', org text not null default '', email text not null default '',
  phone text not null default '', country text not null default '', msg text not null default '',
  extra text not null default '{}', status text not null default 'new', note text not null default '',
  owner_id integer, tg_chat text not null default '', crm_id text not null default '', crm_err text not null default '');
create index if not exists leads_at on leads(at);
create table if not exists lead_msgs(
  id integer primary key, lead_id integer not null, at integer not null, dir text not null, text text not null, who text not null default '');
create index if not exists lead_msgs_l on lead_msgs(lead_id, id);
create table if not exists log(id integer primary key, at integer not null, who text not null, t text not null, lead_id integer);
create index if not exists log_lead on log(lead_id);
create table if not exists products(
  id integer primary key, data text not null, pub integer not null default 0, sort integer not null default 0, at integer not null);
create table if not exists news(
  id integer primary key, data text not null, pub integer not null default 0, ts integer not null, at integer not null);
create table if not exists seo(k text primary key, t text not null default '', d text not null default '');
create table if not exists ir_docs(
  id integer primary key, title text not null, file text not null, name text not null, size integer not null, at integer not null);
create table if not exists ir_links(
  token text primary key, name text not null, org text not null default '', lang text not null default 'ru',
  created_at integer not null, created_by text not null, revoked integer not null default 0, last_at integer);
create table if not exists ir_views(id integer primary key, token text not null, doc_id integer, at integer not null, ip text not null default '');
create index if not exists ir_views_t on ir_views(token, at);
create table if not exists tg_staff(chat_id text primary key, user_id integer not null, at integer not null);
create table if not exists tg_codes(code text primary key, user_id integer not null, until integer not null);
create table if not exists notices(chat_id text not null, message_id integer not null, lead_id integer not null, primary key(chat_id, message_id));
create table if not exists faq(id integer primary key, q text not null, a text not null, sort integer not null default 0);
create table if not exists bot_users(
  chat text primary key, name text not null default '', username text not null default '', lang text not null default '',
  kind text not null default '', account_id integer, first_at integer not null, last_at integer not null, blocked_at integer);
create table if not exists broadcasts(
  id integer primary key, at integer not null, by text not null, text text not null, photo text not null default '',
  seg text not null, via text not null default 'panel', total integer not null default 0, sent integer not null default 0,
  failed integer not null default 0, blocked integer not null default 0, state text not null default 'queued', done_at integer);
create table if not exists broadcast_q(broadcast_id integer not null, chat text not null, primary key(broadcast_id, chat));
create table if not exists bc_drafts(chat text primary key, text text not null default '', photo text not null default '', at integer not null);
create table if not exists accounts(
  id integer primary key, kind text not null, name text not null, org text not null default '', email text unique not null,
  phone text not null default '', country text not null default '', lang text not null default 'ru', pass text not null,
  status text not null, created_at integer not null, approved_by text not null default '', tg_chat text not null default '');
create table if not exists account_sessions(id text primary key, account_id integer not null, created_at integer not null, last_at integer not null);
create table if not exists acc_codes(code text primary key, account_id integer not null, until integer not null);
`;
/* Правки текстов страниц из панели: страница «*» — шапка и подвал на всех страницах. */
const SITE_TEXT = "create table if not exists site_text(lang text not null, page text not null, h text not null, v text not null, def text not null default '', primary key(lang, page, h))";
/* Колонки, добавленные после первой выкатки: в базе, созданной раньше, их нет. */
const LATER = ["alter table leads add column account_id integer"];

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000;");
  db.exec(SCHEMA);
  db.exec(SITE_TEXT);
  for (const sql of LATER) { try { db.exec(sql); } catch { /* колонка уже есть */ } }
  const st = new Map();
  const q = (sql) => { let s = st.get(sql); if (!s) { s = db.prepare(sql); st.set(sql, s); } return s; };
  return {
    raw: db,
    all: (sql, ...a) => q(sql).all(...a),
    get: (sql, ...a) => q(sql).get(...a),
    run: (sql, ...a) => q(sql).run(...a),
    tx(fn) { db.exec("begin"); try { const r = fn(); db.exec("commit"); return r; } catch (e) { db.exec("rollback"); throw e; } },
    close: () => db.close(),
  };
}
