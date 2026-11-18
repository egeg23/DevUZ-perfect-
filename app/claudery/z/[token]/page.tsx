import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { rub } from "@/lib/claudery/scenario";
import { OFFER_PATH, orderView } from "@/lib/claudery/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — ваш заказ" };

/**
 * Страница заказа Claudery: клиент выбирает подписку из витрины и платит.
 * Продаём товар, не услугу (владелец, 18.11.2026): подключение и ответы на
 * вопросы — бесплатная поддержка покупателя. Оплаты в боте нет (Telegram блокирует ботов,
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
      <p style={{ color: "#666", margin: 0 }}>Claudery · подписки на нейросети</p>
      <h1 style={{ fontSize: 26, margin: "4px 0 0" }}>Заказ {order.requestNo}</h1>
      {order.problem ? (
        <div style={box}>
          <p style={{ color: "#666", margin: "0 0 4px", fontSize: 14 }}>Ваш комментарий</p>
          <p style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{order.problem}</p>
        </div>
      ) : null}
      {order.status === "paid" ? (
        <div style={{ ...box, borderColor: "#1a7f37", background: "#f0fff4" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Оплачено, спасибо!</p>
          <p style={{ margin: "4px 0 0" }}>{order.product ? `Вы купили: ${order.product}. ` : ""}Доступ пришлём в Telegram. Эту страницу можно закрыть.</p>
        </div>
      ) : (
        <form method="post" action={`/claudery/z/${token}/pay`} style={box}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Выберите подписку</p>
          {order.products.map((p, i) => (
            <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: i ? "1px solid #eee" : undefined, cursor: "pointer" }}>
              <input type="radio" name="p" value={i} defaultChecked={order.product ? order.product === p.title : i === 0} style={{ marginTop: 5 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, overflowWrap: "anywhere" }}>{p.title}</span>
                {p.note ? <span style={{ display: "block", fontSize: 14, color: "#666", overflowWrap: "anywhere" }}>{p.note}</span> : null}
              </span>
              <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                {p.price < p.full ? <s style={{ color: "#999", fontWeight: 400, marginRight: 6 }}>{rub(p.full)}</s> : null}
                {rub(p.price)}
              </span>
            </label>
          ))}
          {order.discount > 0 ? (
            <p style={{ margin: "8px 0 0", color: "#1a7f37" }}>Вы уже покупали у нас, поэтому скидка {order.discount}% на любую подписку.</p>
          ) : null}
          {order.status === "pending" ? (
            <p style={{ margin: "8px 0 0", color: "#666" }}>
              Оплата пока не подтверждена. Если вы уже оплатили, обновите страницу через минуту: подтверждение приходит от платёжной системы.
            </p>
          ) : null}
          {failed && order.status === "open" ? (
            <p role="alert" style={{ margin: "8px 0 0", color: "#b42318" }}>
              Не получилось открыть страницу оплаты. Попробуйте ещё раз через минуту. Если не выйдет, напишите нам в боте: заказ уже записан.
            </p>
          ) : null}
          <button
            type="submit"
            style={{ width: "100%", marginTop: 14, padding: "14px 16px", border: 0, borderRadius: 12, background: "#111", color: "#fff", font: "600 16px system-ui, sans-serif", cursor: "pointer" }}
          >
            Оплатить
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#666" }}>
            Оплата через Platega (СБП). Оплачивая, вы принимаете <a href={OFFER_PATH}>оферту</a>. Подключение и поддержка покупателя бесплатно.
          </p>
        </form>
      )}
    </main>
  );
}
