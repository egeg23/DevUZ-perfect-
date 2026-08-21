export const dynamic = "force-dynamic";

/**
 * Проба состояния.
 *
 * Обычный вызов намеренно не трогает ни базу, ни Telegram, ни модель: проба
 * отвечает на вопрос «жив ли процесс», а не «работают ли все внешние
 * сервисы». Иначе недоступность Supabase перезапускала бы исправный
 * контейнер. Именно её дёргает healthcheck Docker.
 *
 * С `?deep=1` дополнительно проверяется, доходят ли запросы до модели. Это
 * не паранойя: заданный ключ и доступный API — разные вещи. Ключ может быть
 * верным, а запрос отвергнут на границе по географии — Anthropic обслуживает
 * не все страны, и сервер в неподдерживаемой стране получает 403 ещё до
 * того, как запрос дойдёт до API. Снаружи это выглядит как «чат молчит», и
 * без такой проверки причину ищут в коде.
 */
export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";

  const body: Record<string, unknown> = {
    ok: true,
    commit: process.env.GIT_COMMIT ?? "unknown",
    // Флаги без значений: видно, что настроено, но ничего не утекает.
    configured: {
      llm: Boolean(process.env.ANTHROPIC_API_KEY),
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_SALES_CHAT_ID),
      webhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      database: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  };

  if (deep) body.reachable = await probeModel();

  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Через что уходят исходящие запросы.
 *
 * Пароль из адреса прокси вырезается: проба открыта наружу, и светить в ней
 * учётные данные — значит поменять одну проблему на другую.
 */
function describeEgress(): string {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return "напрямую";
  try {
    const url = new URL(proxy);
    return `через прокси ${url.hostname}:${url.port || "80"}`;
  } catch {
    return "через прокси";
  }
}

/**
 * Минимальный запрос к модели: один токен на выходе.
 *
 * Дешевле любой другой проверки и при этом проходит весь путь целиком —
 * сеть, географию, ключ и доступ к модели.
 */
async function probeModel(): Promise<Record<string, unknown>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { status: "no_key", hint: "ANTHROPIC_API_KEY не задан" };

  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");

  try {
    const response = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (response.ok) return { status: "ok", endpoint: base, egress: describeEgress() };

    const text = await response.text();

    // 403 без идентификатора запроса означает, что до API мы не доехали:
    // запрос отвергли на границе. Самая частая причина — страна сервера.
    if (response.status === 403 && !response.headers.get("request-id")) {
      return {
        status: "blocked",
        code: 403,
        egress: describeEgress(),
        hint:
          "Запрос отвергнут на границе, до API он не дошёл. Обычно это значит, " +
          "что страна сервера не обслуживается. Проверьте: " +
          "curl -s https://ipinfo.io/country — и сверьтесь со списком " +
          "anthropic.com/supported-countries",
      };
    }

    if (response.status === 401) {
      return { status: "bad_key", code: 401, hint: "Ключ отклонён — проверьте ANTHROPIC_API_KEY" };
    }

    return { status: "error", code: response.status, body: text.slice(0, 200) };
  } catch (error) {
    return {
      status: "unreachable",
      hint: "Сеть недоступна из контейнера",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
