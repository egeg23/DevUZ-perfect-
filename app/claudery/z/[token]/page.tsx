import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { rub } from "@/lib/claudery/scenario";
import { OFFER_PATH, orderView } from "@/lib/claudery/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — ваша заявка" };

/**
 * Страница заявки Claudery. Оплаты в боте нет (Telegram блокирует ботов,
 * принимающих оплату мимо Stars): бот даёт только ссылку сюда, цена и кнопка
 * оплаты — здесь. Токен в адресе связывает страницу, платёж Platega и чат
 * клиента; после подтверждения Platega бот сам пишет клиенту «спасибо».
 */
export default async function ClauderyOrder({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { token } = await params;
  const failed = (await searchParams).pay === "failed";
  const order = await orderView(token);
  if (!order) notFound();
  const box = { border: "1px solid #e5e5e5", borderRadius: 14, padding: 16, margin: "16px 0" } as const;
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <p style={{ color: "#666", margin: 0 }}>Claudery · удалённая помощь с ИИ</p>
      <h1 style={{ fontSize: 26, margin: "4px 0 0" }}>Заявка {order.requestNo}</h1>
      {order.problem ? (
        <div style={box}>
          <p style={{ color: "#666", margin: "0 0 4px", fontSize: 14 }}>Что случилось</p>
          <p style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{order.problem}</p>
        </div>
      ) : null}
      {order.status === "paid" ? (
        <div style={{ ...box, borderColor: "#1a7f37", background: "#f0fff4" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Оплачено, спасибо!</p>
          <p style={{ margin: "4px 0 0" }}>Специалист напишет вам в Telegram. Эту страницу можно закрыть.</p>
        </div>
      ) : (
        <div style={box}>
          <p style={{ margin: 0 }}>
            Стоимость помощи: <b>{rub(order.amount)}</b>
          </p>
          {order.amount < order.full ? (
            <p style={{ margin: "4px 0 0", color: "#1a7f37" }}>
              Вы уже обращались к нам, поэтому скидка {order.discount}%: {rub(order.amount)} вместо {rub(order.full)}.
            </p>
          ) : null}
          {order.status === "pending" ? (
            <p style={{ margin: "8px 0 0", color: "#666" }}>
              Оплата пока не подтверждена. Если вы уже оплатили, обновите страницу через минуту: подтверждение приходит от платёжной системы.
            </p>
          ) : null}
          {failed && order.status === "open" ? (
            <p role="alert" style={{ margin: "8px 0 0", color: "#b42318" }}>
              Не получилось открыть страницу оплаты. Попробуйте ещё раз через минуту. Если не выйдет, напишите нам в боте: заявка уже записана.
            </p>
          ) : null}
          <form method="post" action={`/claudery/z/${token}/pay`} style={{ marginTop: 14 }}>
            <button
              type="submit"
              style={{ width: "100%", padding: "14px 16px", border: 0, borderRadius: 12, background: "#111", color: "#fff", font: "600 16px system-ui, sans-serif", cursor: "pointer" }}
            >
              Оплатить {rub(order.amount)}
            </button>
          </form>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#666" }}>
            Оплата через Platega (СБП). Оплачивая, вы принимаете <a href={OFFER_PATH}>оферту</a>.
          </p>
        </div>
      )}
    </main>
  );
}
