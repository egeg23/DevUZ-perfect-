// Мост SOCKS5 → HTTP CONNECT.
//
// Зачем он вообще. У сервера нет прямого выхода в интернет: всё идёт через
// HTTP-прокси, заданный в HTTPS_PROXY (без него не отвечает ни Anthropic, ни
// Bot API). Клиент Telegram при этом ходит не по HTTP, а своим протоколом по
// голому TCP, и HTTP-прокси он не понимает — умеет только SOCKS4/5 и MTProxy.
//
// Развилка была такая: либо лезть в приватные поля библиотеки и подменять там
// способ открытия сокета, либо поднять рядом то, что библиотека понимает без
// доработок. Выбрано второе. Внутренности чужой библиотеки меняются между
// версиями молча, и такая правка отвалилась бы при первом же обновлении —
// причём не сообщением, а тем, что скаут просто перестал бы видеть чаты.
//
// Мост живёт в том же процессе и слушает только 127.0.0.1: наружу он не
// торчит, отдельного юнита systemd не требует и на новом сервере не окажется
// забытым.
//
// Реализована ровно одна команда SOCKS5 — CONNECT, без аутентификации:
// клиент у нас один и находится в том же процессе.
import { connect } from "node:net";
import { createServer } from "node:net";

const VERSION = 0x05;
const CMD_CONNECT = 0x01;
const ATYP_IPV4 = 0x01;
const ATYP_DOMAIN = 0x03;
const ATYP_IPV6 = 0x04;

const REPLY_OK = 0x00;
const REPLY_GENERAL_FAILURE = 0x01;
const REPLY_CMD_UNSUPPORTED = 0x07;
const REPLY_ATYP_UNSUPPORTED = 0x08;

/** Разбирает http://user:pass@host:port в части. */
export function parseProxyUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`мост умеет только http-прокси, а задан ${url.protocol}`);
  }
  return {
    host: url.hostname,
    port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
    auth:
      url.username || url.password
        ? Buffer.from(
            `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`,
          ).toString("base64")
        : null,
  };
}

/**
 * Открывает туннель до host:port через HTTP-прокси.
 *
 * Ответ прокси читаем до первой пустой строки, а не целиком: после заголовков
 * сразу начинается туннель, и всё, что придёт следом, — уже данные Telegram.
 * Их нужно не проглотить, а вернуть вызывающему, иначе первые байты ответа
 * сервера потеряются и рукопожатие зависнет.
 */
function openTunnel(proxy, host, port) {
  return new Promise((resolve, reject) => {
    const socket = connect(proxy.port, proxy.host);
    let buffer = Buffer.alloc(0);

    const fail = (error) => {
      socket.destroy();
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    socket.setNoDelay(true);
    socket.once("error", fail);

    socket.on("connect", () => {
      const lines = [
        `CONNECT ${host}:${port} HTTP/1.1`,
        `Host: ${host}:${port}`,
        // Некоторые прокси без этого закрывают соединение после ответа.
        "Proxy-Connection: keep-alive",
      ];
      if (proxy.auth) lines.push(`Proxy-Authorization: Basic ${proxy.auth}`);
      socket.write(`${lines.join("\r\n")}\r\n\r\n`);
    });

    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const end = buffer.indexOf("\r\n\r\n");
      if (end === -1) {
        // Заголовки без конца — почти наверняка не прокси на том конце.
        if (buffer.length > 16 * 1024) fail(new Error("прокси прислал слишком длинный ответ"));
        return;
      }

      socket.off("data", onData);
      socket.off("error", fail);

      const head = buffer.subarray(0, end).toString("latin1");
      const status = Number(head.split(/\r?\n/, 1)[0].split(" ")[1]);

      if (status !== 200) {
        socket.destroy();
        reject(new Error(`прокси отказал: ${head.split(/\r?\n/, 1)[0]}`));
        return;
      }

      resolve({ socket, leftover: buffer.subarray(end + 4) });
    };

    socket.on("data", onData);
  });
}

function reply(socket, code) {
  // Адрес в ответе не важен: клиент его не использует, а выдумывать
  // настоящий локальный адрес туннеля незачем.
  socket.write(Buffer.from([VERSION, code, 0x00, ATYP_IPV4, 0, 0, 0, 0, 0, 0]));
}

/** Читает ровно n байт из сокета. */
function readExactly(socket, n, prefix = Buffer.alloc(0)) {
  return new Promise((resolve, reject) => {
    let buffer = prefix;
    if (buffer.length >= n) {
      resolve({ data: buffer.subarray(0, n), rest: buffer.subarray(n) });
      return;
    }

    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length < n) return;
      socket.off("data", onData);
      socket.off("error", onError);
      resolve({ data: buffer.subarray(0, n), rest: buffer.subarray(n) });
    };
    const onError = (error) => {
      socket.off("data", onData);
      reject(error);
    };

    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function serveClient(client, proxy, live) {
  client.setNoDelay(true);
  live.add(client);
  client.once("close", () => live.delete(client));

  // Приветствие: версия, число методов, сами методы.
  const greeting = await readExactly(client, 2);
  if (greeting.data[0] !== VERSION) throw new Error("не SOCKS5");
  const methods = await readExactly(client, greeting.data[1], greeting.rest);
  // Отвечаем «без аутентификации»: клиент свой и в том же процессе.
  client.write(Buffer.from([VERSION, 0x00]));

  // Запрос: версия, команда, резерв, тип адреса.
  const header = await readExactly(client, 4, methods.rest);
  const [, command, , atyp] = header.data;

  if (command !== CMD_CONNECT) {
    reply(client, REPLY_CMD_UNSUPPORTED);
    client.end();
    return;
  }

  let host;
  let rest = header.rest;

  if (atyp === ATYP_IPV4) {
    const read = await readExactly(client, 4, rest);
    host = Array.from(read.data).join(".");
    rest = read.rest;
  } else if (atyp === ATYP_DOMAIN) {
    const length = await readExactly(client, 1, rest);
    const name = await readExactly(client, length.data[0], length.rest);
    host = name.data.toString("utf8");
    rest = name.rest;
  } else if (atyp === ATYP_IPV6) {
    const read = await readExactly(client, 16, rest);
    const parts = [];
    for (let i = 0; i < 16; i += 2) parts.push(read.data.readUInt16BE(i).toString(16));
    host = parts.join(":");
    rest = read.rest;
  } else {
    reply(client, REPLY_ATYP_UNSUPPORTED);
    client.end();
    return;
  }

  const portRead = await readExactly(client, 2, rest);
  const port = portRead.data.readUInt16BE(0);

  let tunnel;
  try {
    tunnel = await openTunnel(proxy, host, port);
  } catch (error) {
    console.error(`scout: туннель до ${host}:${port} не открылся —`, error.message);
    reply(client, REPLY_GENERAL_FAILURE);
    client.end();
    return;
  }

  reply(client, REPLY_OK);

  // Хвост, пришедший вместе с заголовками ответа прокси, — это уже данные
  // сервера. Отдаём их клиенту до того, как свяжем потоки.
  if (tunnel.leftover.length) client.write(tunnel.leftover);
  // И то, что клиент успел прислать после запроса SOCKS.
  if (portRead.rest.length) tunnel.socket.write(portRead.rest);

  live.add(tunnel.socket);
  tunnel.socket.once("close", () => live.delete(tunnel.socket));

  const stop = () => {
    client.destroy();
    tunnel.socket.destroy();
  };
  client.on("error", stop);
  tunnel.socket.on("error", stop);

  client.pipe(tunnel.socket);
  tunnel.socket.pipe(client);
}

/**
 * Поднимает мост и возвращает описание, которое библиотека Telegram примет
 * как обычный SOCKS5-прокси.
 *
 * Порт нулевой — его выбирает система: фиксированный однажды окажется занят,
 * и разбираться, почему скаут не стартует, придётся по косвенным признакам.
 */
export async function startProxyBridge(proxyUrl) {
  const proxy = parseProxyUrl(proxyUrl);

  // Живые сокеты приходится держать списком: у TCP-сервера, в отличие от
  // HTTP-сервера, нет closeAllConnections, а `server.close()` сам по себе
  // только перестаёт принимать новых и ждёт, пока разойдутся старые.
  const live = new Set();

  const server = createServer((client) => {
    serveClient(client, proxy, live).catch((error) => {
      console.error("scout: мост —", error.message);
      client.destroy();
    });
  });

  // Наружу мост не торчит: слушаем только петлю.
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  return {
    server,
    socks: { socksType: 5, ip: "127.0.0.1", port, timeout: 15 },
    /**
     * Закрытие рвёт живые соединения, а не ждёт их.
     *
     * Соединение с Telegram держится часами и само расходиться не
     * собирается, а `server.close()` его дожидается. Без принудительного
     * разрыва остановка скаута висла бы до таймаута systemd, и на
     * перезапуске это выглядело бы как «сервис не останавливается».
     *
     * Найдено мутационной проверкой: подменённый ответ прокси подвесил не
     * тест, а именно закрытие.
     */
    close: () =>
      new Promise((resolve) => {
        for (const socket of live) socket.destroy();
        live.clear();
        server.close(resolve);
      }),
  };
}
