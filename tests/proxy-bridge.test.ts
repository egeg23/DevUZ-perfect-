/**
 * Мост SOCKS5 → HTTP CONNECT.
 *
 * Он стоит между скаутом и Telegram на сервере, у которого нет прямого
 * выхода в интернет. Сломается он — скаут не увидит ни одного сообщения, и
 * узнать об этом будет неоткуда: со стороны это выглядит как тихий чат.
 *
 * Поэтому проверяется не «функция вернула объект», а сквозной путь: поднят
 * настоящий подставной HTTP-прокси, настоящий SOCKS5-клиент ходит через мост
 * к настоящему серверу назначения, и сверяются байты с обеих сторон.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer, connect, type Server } from "node:net";
import { test } from "node:test";

import { parseProxyUrl, probeTunnel, startProxyBridge } from "../scout/http-proxy-bridge.mjs";

/** Куда мост в итоге должен доставить байты. */
function echoServer(): Promise<{ server: Server; port: number }> {
  const server = createServer((socket) => {
    socket.on("data", (chunk) => socket.write(Buffer.concat([Buffer.from("эхо:"), chunk])));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, port: (server.address() as { port: number }).port }),
    ),
  );
}

/**
 * Подставной HTTP-прокси: принимает CONNECT и связывает с назначением.
 *
 * `requireAuth` — чтобы проверить, что мост действительно шлёт
 * Proxy-Authorization: без него прокси с паролем отвечает 407, и скаут
 * молча остаётся без чатов.
 */
function httpProxy(options: { requireAuth?: string; refuse?: boolean; coalesce?: boolean } = {}): Promise<{
  server: Server;
  port: number;
  seen: string[];
}> {
  const seen: string[] = [];

  const server = createServer((client) => {
    let head = Buffer.alloc(0);

    const onData = (chunk: Buffer) => {
      head = Buffer.concat([head, chunk]);
      const end = head.indexOf("\r\n\r\n");
      if (end === -1) return;
      client.off("data", onData);

      const text = head.subarray(0, end).toString("latin1");
      seen.push(text);

      if (options.refuse) {
        client.end("HTTP/1.1 403 Forbidden\r\n\r\n");
        return;
      }
      if (options.requireAuth && !text.includes(`Proxy-Authorization: Basic ${options.requireAuth}`)) {
        client.end("HTTP/1.1 407 Proxy Authentication Required\r\n\r\n");
        return;
      }

      const [, target] = text.split(/\r?\n/, 1)[0].split(" ");
      const [host, port] = target.split(":");
      const upstream = connect(Number(port), host, () => {
        const rest = head.subarray(end + 4);
        if (rest.length) upstream.write(rest);

        if (options.coalesce) {
          // Ответ и первые байты сервера уходят ОДНОЙ записью — так бывает,
          // когда сервер здоровается сразу и всё умещается в один сегмент.
          // Мост обязан отдать этот хвост клиенту: проглотив его, он теряет
          // начало рукопожатия Telegram, и соединение молча виснет.
          upstream.once("data", (first: Buffer) => {
            client.write(
              Buffer.concat([
                Buffer.from("HTTP/1.0 200 Connection established\r\n\r\n"),
                first,
              ]),
            );
            client.pipe(upstream);
            upstream.pipe(client);
          });
          return;
        }

        // Ответ версии 1.0: ровно так отвечает прокси на боевом сервере.
        client.write("HTTP/1.0 200 Connection established\r\n\r\n");
        client.pipe(upstream);
        upstream.pipe(client);
      });
      upstream.on("error", () => client.destroy());
    };

    client.on("data", onData);
    client.on("error", () => client.destroy());
  });

  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, port: (server.address() as { port: number }).port, seen }),
    ),
  );
}

/** Минимальный SOCKS5-клиент: ровно то, что делает библиотека Telegram. */
function socksRequest(
  bridgePort: number,
  host: string,
  port: number,
  payload: string,
): Promise<{ reply: number; body: string }> {
  return new Promise((resolve, reject) => {
    const socket = connect(bridgePort, "127.0.0.1");
    let stage: "greet" | "reply" | "data" = "greet";
    let buffer = Buffer.alloc(0);
    let reply = -1;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("мост не ответил за 2 секунды"));
    }, 2000);

    socket.on("connect", () => socket.write(Buffer.from([0x05, 0x01, 0x00])));

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      if (stage === "greet" && buffer.length >= 2) {
        buffer = buffer.subarray(2);
        stage = "reply";
        const addr = host.split(".").map(Number);
        const request = Buffer.from([0x05, 0x01, 0x00, 0x01, ...addr, port >> 8, port & 0xff]);
        socket.write(request);
      }

      if (stage === "reply" && buffer.length >= 10) {
        reply = buffer[1];
        buffer = buffer.subarray(10);
        stage = "data";
        if (reply !== 0x00) {
          clearTimeout(timer);
          socket.destroy();
          resolve({ reply, body: "" });
          return;
        }
        socket.write(payload);
      }

      if (stage === "data" && buffer.length) {
        clearTimeout(timer);
        socket.destroy();
        resolve({ reply, body: buffer.toString("utf8") });
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

test("адрес прокси разбирается вместе с логином и паролем", () => {
  const plain = parseProxyUrl("http://10.0.0.1:8000");
  assert.equal(plain.host, "10.0.0.1");
  assert.equal(plain.port, 8000);
  assert.equal(plain.auth, null, "без логина заголовок авторизации не выдумывается");

  const withAuth = parseProxyUrl("http://user:p%40ss@10.0.0.1:8000");
  assert.equal(
    Buffer.from(withAuth.auth as string, "base64").toString(),
    "user:p@ss",
    "пароль со спецсимволом должен раскодироваться",
  );

  // SOCKS-адрес в этой переменной означает, что мост не нужен вовсе, — и
  // молча принять его значило бы гонять SOCKS внутри SOCKS.
  assert.throws(() => parseProxyUrl("socks5://10.0.0.1:1080"));
});

test("байты доходят до назначения и обратно", async () => {
  const echo = await echoServer();
  const proxy = await httpProxy();
  const bridge = await startProxyBridge(`http://127.0.0.1:${proxy.port}`);

  try {
    const result = await socksRequest(bridge.socks.port, "127.0.0.1", echo.port, "привет");
    assert.equal(result.reply, 0x00, "SOCKS ответил отказом");
    assert.equal(result.body, "эхо:привет", "данные исказились по дороге");

    // Мост должен просить у прокси именно тот адрес, который назвал клиент.
    assert.match(proxy.seen[0], new RegExp(`^CONNECT 127\\.0\\.0\\.1:${echo.port} HTTP/1\\.1`));
  } finally {
    await bridge.close();
    echo.server.close();
    proxy.server.close();
  }
});

test("логин и пароль доезжают до прокси", async () => {
  // Без заголовка авторизации прокси с паролем отвечает 407, и скаут
  // остаётся без чатов — молча, потому что со стороны это тихий чат.
  const auth = Buffer.from("user:secret").toString("base64");
  const echo = await echoServer();
  const proxy = await httpProxy({ requireAuth: auth });
  const bridge = await startProxyBridge(`http://user:secret@127.0.0.1:${proxy.port}`);

  try {
    const result = await socksRequest(bridge.socks.port, "127.0.0.1", echo.port, "пинг");
    assert.equal(result.reply, 0x00, "прокси не принял авторизацию");
    assert.equal(result.body, "эхо:пинг");
  } finally {
    await bridge.close();
    echo.server.close();
    proxy.server.close();
  }
});

test("отказ прокси доходит до клиента отказом, а не тишиной", async () => {
  // Клиент должен получить внятный код ошибки SOCKS. Повисшее соединение
  // библиотека Telegram разбирает как таймаут и уходит в повторы по десять
  // секунд — то есть настоящая причина теряется.
  const proxy = await httpProxy({ refuse: true });
  const bridge = await startProxyBridge(`http://127.0.0.1:${proxy.port}`);

  try {
    const result = await socksRequest(bridge.socks.port, "127.0.0.1", 1234, "неважно");
    assert.notEqual(result.reply, 0x00, "отказ прокси выдан за успех");
  } finally {
    await bridge.close();
    proxy.server.close();
  }
});

test("мост слушает только петлю", async () => {
  // Наружу он торчать не должен: это открытый SOCKS без пароля.
  const proxy = await httpProxy();
  const bridge = await startProxyBridge(`http://127.0.0.1:${proxy.port}`);

  try {
    const address = bridge.server.address() as { address: string };
    assert.equal(address.address, "127.0.0.1", "мост слушает не только петлю");
  } finally {
    await bridge.close();
    proxy.server.close();
  }
});

test("первые байты сервера не теряются, если пришли вместе с ответом прокси", async () => {
  // Самый коварный случай во всём мосте. Прокси отвечает «200» и тут же, в
  // том же сегменте TCP, отдаёт начало ответа сервера. Мост читает заголовки
  // до пустой строки — и всё, что за ней, обязан вернуть клиенту. Если
  // проглотит, Telegram не получит начало рукопожатия и соединение повиснет
  // без единой ошибки в логах.
  const greeter = createServer((socket) => socket.write("ЗДРАВСТВУЙ"));
  await new Promise<void>((resolve) => greeter.listen(0, "127.0.0.1", resolve));
  const greeterPort = (greeter.address() as { port: number }).port;

  const proxy = await httpProxy({ coalesce: true });
  const bridge = await startProxyBridge(`http://127.0.0.1:${proxy.port}`);

  try {
    // Клиент ничего не шлёт — ему должны прийти байты, которые сервер сказал
    // первым. Единственный путь для них — тот самый хвост.
    const result = await socksRequest(bridge.socks.port, "127.0.0.1", greeterPort, "");
    assert.equal(result.reply, 0x00);
    assert.equal(result.body, "ЗДРАВСТВУЙ", "хвост ответа прокси потерялся");
  } finally {
    await bridge.close();
    greeter.close();
    proxy.server.close();
  }
});

test("закрытие не ждёт живое соединение", async () => {
  // Соединение с Telegram держится часами и само не расходится, а
  // `server.close()` его дожидается — значит остановка скаута висла бы до
  // таймаута systemd и выглядела как «сервис не останавливается».
  //
  // Найдено мутационной проверкой: подменённый ответ прокси подвесил не
  // тест, а именно закрытие моста.
  const echo = await echoServer();
  const proxy = await httpProxy();
  const bridge = await startProxyBridge(`http://127.0.0.1:${proxy.port}`);

  // Открываем соединение и НЕ закрываем: оно должно остаться живым.
  const held = connect(bridge.socks.port, "127.0.0.1");
  await new Promise<void>((resolve) => held.once("connect", () => resolve()));
  held.write(Buffer.from([0x05, 0x01, 0x00]));
  await new Promise<void>((resolve) => held.once("data", () => resolve()));

  try {
    const closed = await Promise.race([
      bridge.close().then(() => "закрылся"),
      new Promise((resolve) => setTimeout(() => resolve("завис"), 2000)),
    ]);
    assert.equal(closed, "закрылся", "мост не закрылся при живом соединении");
  } finally {
    held.destroy();
    echo.server.close();
    proxy.server.close();
  }
});

test("проверка перед подключением: живой прокси пускает, мёртвый и отказавший — нет", async () => {
  // 25–26 сентября прокси умер: порт принимал соединение и молчал, а скаут
  // сутки перезапускался по кругу. Проверка решает, идти ли через прокси
  // или напрямую, и не должна висеть дольше своего срока.
  const echo = await echoServer();
  const alive = await httpProxy();
  const refusing = await httpProxy({ refuse: true });
  const silent = createServer(() => undefined);
  await new Promise<void>((resolve) => silent.listen(0, "127.0.0.1", () => resolve()));
  const silentPort = (silent.address() as { port: number }).port;

  try {
    assert.equal(await probeTunnel(`http://127.0.0.1:${alive.port}`, "127.0.0.1", echo.port, 1000), null);
    assert.match(String(await probeTunnel(`http://127.0.0.1:${refusing.port}`, "127.0.0.1", echo.port, 1000)), /403/);

    const started = Date.now();
    const reason = await probeTunnel(`http://127.0.0.1:${silentPort}`, "127.0.0.1", echo.port, 300);
    assert.match(String(reason), /не ответил/);
    assert.ok(Date.now() - started < 2000, "проверка ждала дольше своего срока");
  } finally {
    echo.server.close();
    alive.server.close();
    refusing.server.close();
    silent.close();
  }
});
