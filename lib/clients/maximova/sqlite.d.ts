/**
 * Типы встроенного node:sqlite (Node 22). В репозитории стоит @types/node 20,
 * где этого модуля ещё нет; поднимать типы всему сайту ради одной базы не
 * стоит — объявлено ровно то, чем пользуется db.ts и store.ts.
 */
declare module "node:sqlite" {
  type Value = null | number | bigint | string | Uint8Array;
  export class StatementSync {
    run(...params: Value[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: Value[]): Record<string, unknown> | undefined;
    all(...params: Value[]): Record<string, unknown>[];
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
