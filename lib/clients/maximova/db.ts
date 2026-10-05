import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * База школы Дарьи — один файл SQLite на нашем сервере в России.
 *
 * Почему не Supabase, как у студии: здесь персональные данные родителей и
 * детей, граждан РФ, и по 152-ФЗ их первичная запись и хранение должны быть
 * в базе на территории России. Сервер студии стоит в России; файл лежит на
 * его диске (папка монтируется в контейнер, см. docker-compose.yml), а не в
 * образе, который пересобирается на каждой выкатке.
 *
 * Почему SQLite, а не отдельный Postgres: у школы десятки учеников, а не
 * миллионы. Файл не требует ни сервиса, ни пароля, ни сети — и переезжает на
 * сервер Дарьи вместе с сайтом одной копией. Модуль встроен в Node 22.
 */

let db: DatabaseSync | null = null;

/** Папка с базой: на сервере — смонтированный том, локально — .data/. */
export function dataDir(env: Record<string, string | undefined> = process.env): string {
  return env.MAXIMOVA_DATA_DIR || join(process.cwd(), ".data", "maximova");
}

const SCHEMA = `
  create table if not exists bookings (
    id integer primary key autoincrement,
    created_at text not null,
    language text not null,
    age text not null,
    format text not null,
    parent_name text not null,
    contact text not null,
    preferred_time text not null default '',
    comment text not null default '',
    telegram_id integer,
    status text not null default 'new',
    notified integer not null default 0
  );
  create index if not exists bookings_telegram on bookings(telegram_id);

  create table if not exists users (
    telegram_id integer primary key,
    first_name text not null default '',
    last_name text not null default '',
    username text not null default '',
    role text not null default 'parent',
    consent_at text not null,
    created_at text not null,
    last_login_at text not null
  );

  create table if not exists login_tokens (
    token text primary key,
    nonce_hash text not null,
    consent integer not null default 0,
    created_at integer not null,
    telegram_id integer,
    confirmed_at integer,
    used_at integer
  );

  -- Дневник. О ребёнке — только имя: фамилия, дата рождения и школа для
  -- занятий не нужны, а каждый лишний столбец — данные несовершеннолетнего.
  create table if not exists groups (
    id integer primary key autoincrement,
    title text not null,
    language text not null,
    age text not null,
    schedule text not null default '',
    created_at text not null
  );

  create table if not exists students (
    id integer primary key autoincrement,
    name text not null,
    language text not null,
    age text not null,
    group_id integer references groups(id) on delete set null,
    level text not null default '',
    parent_telegram_id integer,
    invite_code text not null unique,
    active integer not null default 1,
    created_at text not null
  );
  create index if not exists students_parent on students(parent_telegram_id);

  -- Задание — группе (student_id пусто) или одному ученику.
  create table if not exists homework (
    id integer primary key autoincrement,
    group_id integer references groups(id) on delete cascade,
    student_id integer references students(id) on delete cascade,
    text text not null,
    due text not null default '',
    created_at text not null
  );

  create table if not exists remarks (
    id integer primary key autoincrement,
    student_id integer not null references students(id) on delete cascade,
    kind text not null default 'remark',
    text text not null,
    created_at text not null
  );

  create table if not exists payments (
    id integer primary key autoincrement,
    student_id integer not null references students(id) on delete cascade,
    title text not null,
    amount text not null default '',
    due text not null default '',
    status text not null default 'due',
    created_at text not null,
    reminded_at text
  );

  create table if not exists sessions (
    id_hash text primary key,
    telegram_id integer not null,
    created_at integer not null,
    expires_at integer not null
  );
`;

/** Открыть базу (один раз на процесс) и накатить схему. */
export function open(path?: string): DatabaseSync {
  if (db && !path) return db;
  const file = path ?? join(dataDir(), "school.db");
  if (file !== ":memory:") mkdirSync(join(file, ".."), { recursive: true });
  const conn = new DatabaseSync(file);
  // WAL: запись заявки не ждёт, пока кто-то читает кабинет.
  if (file !== ":memory:") conn.exec("pragma journal_mode = wal");
  conn.exec("pragma foreign_keys = on");
  conn.exec(SCHEMA);
  // Поля, добавленные после первой выкатки: у старой базы их нет, а
  // create table if not exists существующую таблицу не меняет.
  addColumn(conn, "login_tokens", "invite text");
  // Ученик входит в свой дневник по своей ссылке — не по родительской:
  // ученику не видны оплата и замечания для родителя.
  addColumn(conn, "students", "student_code text");
  addColumn(conn, "students", "student_telegram_id integer");
  for (const row of conn.prepare("select id from students where student_code is null").all() as { id: number }[]) {
    conn.prepare("update students set student_code = ? where id = ?").run(randomBytes(9).toString("base64url"), row.id);
  }
  conn.exec("create unique index if not exists students_student_code on students(student_code)");
  conn.exec("create index if not exists students_learner on students(student_telegram_id)");
  if (!path) db = conn;
  return conn;
}

function addColumn(conn: DatabaseSync, table: string, column: string) {
  const name = column.split(" ")[0];
  const exists = conn.prepare(`select 1 from pragma_table_info('${table}') where name = ?`).get(name);
  if (!exists) conn.exec(`alter table ${table} add column ${column}`);
}

/** Для тестов: подставить свою базу (обычно :memory:). */
export function useDatabase(conn: DatabaseSync | null) {
  db = conn;
}
