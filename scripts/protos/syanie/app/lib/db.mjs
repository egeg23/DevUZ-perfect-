/* База сайта клиники: один файл SQLite на сервере клиники (/opt/syanie/data).
   node:sqlite — без сторонних пакетов: образ собирается без компилятора. */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SCHEMA = `
create table if not exists users(
  id integer primary key, login text unique not null, name text not null,
  role text not null, pass text not null, disabled integer not null default 0,
  created_at integer not null);
create table if not exists sessions(
  id text primary key, user_id integer not null, created_at integer not null, last_at integer not null);
create table if not exists settings(k text primary key, v text not null);
create table if not exists leads(
  id integer primary key, key text not null, at integer not null, src text not null,
  name text not null default '', phone text not null default '', what text not null default '',
  wish text not null default '', status text not null default 'new', note text not null default '',
  conv_id integer, amo_id integer, amo_at integer, amo_err text not null default '');
create index if not exists leads_at on leads(at);
create table if not exists convs(
  id integer primary key, channel text not null, kind text not null, ext text not null,
  wz_channel text not null default '', name text not null default '', phone text not null default '',
  last_at integer not null, last_dir text not null default 'in', unread integer not null default 0,
  sid text not null default '', unique(channel, ext));
create index if not exists convs_last on convs(last_at);
create table if not exists msgs(
  id integer primary key, conv_id integer not null, at integer not null, dir text not null,
  text text not null, who text not null default '', ext_id text not null default '', state text not null default '');
create index if not exists msgs_conv on msgs(conv_id, id);
create table if not exists log(id integer primary key, at integer not null, who text not null, t text not null);
create table if not exists tg_staff(chat_id text primary key, user_id integer not null, at integer not null);
create table if not exists tg_codes(code text primary key, user_id integer not null, until integer not null);
create table if not exists notices(
  chat_id text not null, message_id integer not null, conv_id integer, lead_id integer,
  primary key(chat_id, message_id));
`;

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000;");
  db.exec(SCHEMA);
  const st = new Map();
  /* Подготовленные запросы кэшируются по тексту. */
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
