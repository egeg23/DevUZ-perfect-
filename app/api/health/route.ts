export const dynamic = "force-dynamic";

/**
 * Проба состояния для healthcheck контейнера и для внешнего мониторинга.
 *
 * Намеренно не трогает ни базу, ни Telegram, ни модель: проба должна
 * отвечать на вопрос «жив ли процесс», а не «работают ли все внешние
 * сервисы». Иначе недоступность Supabase перезапускала бы контейнер,
 * который на самом деле исправен.
 */
export async function GET() {
  return Response.json(
    {
      ok: true,
      // Помогает убедиться, что на сервере крутится именно тот деплой.
      commit: process.env.GIT_COMMIT ?? "unknown",
      // Флаги без значений: видно, что настроено, но ничего не утекает.
      configured: {
        llm: Boolean(process.env.ANTHROPIC_API_KEY),
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_SALES_CHAT_ID),
        webhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
        database: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
