// Дополнительные рабочие аккаунты: вход из панели и работа наравне с главным.
//
// Владелец, 02.10.2026: «У нас дополнительно будет 2 аккаунта, которые я бы
// хотел подвязать для связи с клиентами».
//
// Подключает их владелец в панели (/admin/accounts), без сервера и без
// строки сессии в руках: номер → код из Telegram → пароль, если включён.
// Панель кладёт ввод в tg_accounts, этот модуль раз в несколько секунд
// забирает шаг и говорит с Telegram — библиотека и дорога к дата-центру есть
// только у скаута. Сессия после входа уходит в хранилище Supabase (Vault),
// в таблице её нет.
//
// Дальше каждый подключённый аккаунт получает того же работника, что и
// главный (startWorker в runner.mjs): первые касания со своим пределом в час,
// переписка и правки по своим письмам, входящее в личку. Чатов
// дополнительные аккаунты не читают.
import telegram from "teleproto";

import {
  accountSession,
  codeSent,
  liveAccounts,
  loggedIn,
  loginFailed,
  loginJobs,
  loginPassword,
  loginSession,
  logoutDone,
  markFlood,
  markSeen,
  markSessionDead,
  needPassword,
  removedPending,
} from "@/lib/admin/work-accounts-store";
import { canSend, loginErrorOf } from "@/lib/admin/work-accounts";

/** Как часто смотреть, не ввёл ли владелец номер, код или пароль. */
const LOGIN_MS = 5_000;
/** Как часто сверять список аккаунтов с панелью и отмечаться «на связи». */
const SYNC_MS = 60_000;

const why = (error) => String(error?.errorMessage ?? error?.message ?? error);

export function startAccounts({ makeClient, StringSession, Api, apiId, apiHash, workers, startWorker }) {
  /** Подключённые: id → { client, account }. Состояние из панели — в account, обновляется каждую сверку. */
  const connected = new Map();
  const timers = [];

  /* ── Вход ──────────────────────────────────────────────────────────── */

  const finish = async (id, client) => {
    const me = await client.getMe();
    const name = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || null;
    const ok = await loggedIn(id, client.session.save(), {
      userId: me?.id === undefined || me?.id === null ? null : String(me.id),
      username: me?.username ?? null,
      name,
    });
    console.log(`аккаунты: вошли${me?.username ? ` как @${me.username}` : ""}${ok ? "" : " — но сессия не записалась"}`);
  };

  const step = async (job) => {
    if (job.status === "code_requested") {
      // Код просит этот ключ — им же его и проверять: сессия до входа
      // кладётся в хранилище, а не держится в памяти, иначе выкатка между
      // «прислали код» и «ввели код» обнуляла бы вход.
      const client = makeClient(new StringSession(""));
      try {
        await client.connect();
        const sent = await client.sendCode({ apiId, apiHash }, job.phone);
        await codeSent(job.id, sent.phoneCodeHash, client.session.save());
        console.log(`аккаунты: код отправлен на ${job.phone.slice(0, 6)}…`);
      } catch (error) {
        const message = why(error);
        await loginFailed(job.id, loginErrorOf(message), message, "failed");
        console.error(`аккаунты: код не отправлен — ${message}`);
      } finally {
        await client.disconnect().catch(() => {});
      }
      return;
    }

    const saved = await loginSession(job.id);
    if (!saved) {
      await loginFailed(job.id, "code_expired", "сессия входа потерялась — начните заново", "failed");
      return;
    }
    const client = makeClient(new StringSession(saved));
    try {
      await client.connect();
      if (job.status === "code_submitted") {
        if (!job.code || !job.phoneCodeHash) {
          await loginFailed(job.id, "code_expired", "нет кода", "failed");
          return;
        }
        try {
          await client.invoke(new Api.auth.SignIn({ phoneNumber: job.phone, phoneCodeHash: job.phoneCodeHash, phoneCode: job.code }));
        } catch (error) {
          const message = why(error);
          // Двухфакторная защита: код верный, дальше — пароль.
          if (/SESSION_PASSWORD_NEEDED/i.test(message)) {
            await needPassword(job.id);
            return;
          }
          const kind = loginErrorOf(message);
          // Опечатка в коде — можно ввести снова; всё остальное — заново.
          await loginFailed(job.id, kind, message, kind === "code_invalid" ? "awaiting_code" : "failed");
          return;
        }
        await finish(job.id, client);
        return;
      }

      if (job.status === "password_submitted") {
        const password = await loginPassword(job.id);
        if (!password) {
          await loginFailed(job.id, "other", "пароль не дошёл — введите ещё раз", "awaiting_password");
          return;
        }
        try {
          const params = await client.invoke(new Api.account.GetPassword());
          const check = await telegram.password.computeCheck(params, password);
          await client.invoke(new Api.auth.CheckPassword({ password: check }));
        } catch (error) {
          const message = why(error);
          const kind = loginErrorOf(message);
          await loginFailed(job.id, kind, message, kind === "password_invalid" ? "awaiting_password" : "failed");
          return;
        }
        await finish(job.id, client);
      }
    } catch (error) {
      const message = why(error);
      await loginFailed(job.id, loginErrorOf(message), message, "failed");
      console.error(`аккаунты: вход не прошёл — ${message}`);
    } finally {
      await client.disconnect().catch(() => {});
    }
  };

  let logging = false;
  timers.push(
    setInterval(async () => {
      if (logging) return;
      logging = true;
      try {
        for (const job of await loginJobs()) await step(job);
      } catch (error) {
        console.error("аккаунты: шаги входа не прочитались —", why(error));
      } finally {
        logging = false;
      }
    }, LOGIN_MS),
  );

  /* ── Работа ────────────────────────────────────────────────────────── */

  const drop = async (id) => {
    const live = connected.get(id);
    if (!live) return;
    connected.delete(id);
    workers.get(id)?.stop();
    workers.delete(id);
    await live.client.disconnect().catch(() => {});
  };

  const connect = async (account) => {
    const session = await accountSession(account.id);
    if (!session) {
      await markSessionDead(account.id, "сессии нет в хранилище — подключите аккаунт заново");
      return;
    }
    const client = makeClient(new StringSession(session));
    try {
      await client.connect();
      if (!(await client.isUserAuthorized())) {
        // Владелец завершил сеанс на телефоне или номер заблокирован.
        await markSessionDead(account.id, "Telegram отозвал сессию — подключите аккаунт заново");
        await client.disconnect().catch(() => {});
        return;
      }
    } catch (error) {
      console.error(`аккаунты: «${account.label}» не подключился — ${why(error)}`);
      await client.disconnect().catch(() => {});
      return;
    }

    const entry = { client, account };
    connected.set(account.id, entry);
    workers.set(
      account.id,
      startWorker({
        client,
        key: account.id,
        label: account.label,
        cap: () => entry.account.hourlyCap,
        // Пауза из панели или сутки после ограничения — первых писем нет.
        paused: () => !canSend({ status: entry.account.status, flood_until: entry.account.floodUntil }),
        onFlood: async (reason) => {
          await markFlood(account.id, reason);
          entry.account = { ...entry.account, floodUntil: new Date(Date.now() + 24 * 3600_000).toISOString() };
        },
      }),
    );
    console.log(`аккаунты: «${account.label}» на связи`);
  };

  const sync = async () => {
    const live = await liveAccounts();
    const ids = new Set(live.map((account) => account.id));

    // Сняли в панели, отозвали, или связь пропала насовсем — отпускаем.
    for (const [id, entry] of connected) {
      if (!ids.has(id) || entry.client.disconnected) await drop(id);
    }

    for (const account of live) {
      const entry = connected.get(account.id);
      if (entry) entry.account = account;
      else await connect(account);
    }

    // Отключённые в панели: закрыть сеанс в Telegram и стереть сессию.
    for (const id of await removedPending()) {
      const session = await accountSession(id);
      if (session) {
        const client = makeClient(new StringSession(session));
        try {
          await client.connect();
          await client.invoke(new Api.auth.LogOut());
        } catch (error) {
          console.error("аккаунты: сеанс не закрылся —", why(error));
        } finally {
          await client.disconnect().catch(() => {});
        }
      }
      await logoutDone(id);
      console.log("аккаунты: аккаунт отключён, сеанс закрыт");
    }

    await markSeen([...connected.keys()]);
  };

  let syncing = false;
  const tick = async () => {
    if (syncing) return;
    syncing = true;
    try {
      await sync();
    } catch (error) {
      console.error("аккаунты: сверка не прошла —", why(error));
    } finally {
      syncing = false;
    }
  };
  void tick();
  timers.push(setInterval(tick, SYNC_MS));

  return {
    stop: async () => {
      for (const timer of timers) clearInterval(timer);
      for (const id of [...connected.keys()]) await drop(id);
    },
  };
}
