import type { Metadata } from "next";

import { rub } from "@/lib/claudery/scenario";
import { loadSetup } from "@/lib/claudery/store";
import { appSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — оферта на удалённую помощь" };

/**
 * Публичная оферта Claudery. Владелец, 17.11.2026: «Клиенты в рублях —
 * оферта от ИП в РФ, реквизиты из хранилища, в репозиторий их не клади».
 * Исполнитель и ИНН — из `app.INVOICE_RU_*` при каждом показе; цена — из
 * настроек бота; условия и гарантию владелец пишет в конструкторе.
 */
export default async function ClauderyOffer() {
  const [payee, taxId, scenario] = await Promise.all([appSecret("INVOICE_RU_PAYEE"), appSecret("INVOICE_RU_TAX_ID"), loadSetup()]);
  const price = rub(scenario.amount);
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 26 }}>Публичная оферта на услугу «Claudery: удалённая помощь»</h1>
      <p>
        Исполнитель: {payee ?? "индивидуальный предприниматель (реквизиты уточняются)"}
        {taxId ? `, ИНН ${taxId}` : ""}.
      </p>
      <h2 style={{ fontSize: 20 }}>1. Предмет</h2>
      <p>
        Исполнитель оказывает Заказчику удалённую консультационную помощь по работе с нейросетями и ИИ-сервисами по заявке, оставленной в Telegram-боте
        Claudery. Помощь оказывается через Telegram и средства удалённой связи.
      </p>
      <h2 style={{ fontSize: 20 }}>2. Цена и оплата</h2>
      <p>
        Стоимость одной заявки — {price}. Оплата через платёжный сервис Platega на странице заявки на сайте. Оплата означает согласие с этой офертой (акцепт).
        Заявка берётся в работу после того, как платёжный сервис подтвердит оплату.
      </p>
      <h2 style={{ fontSize: 20 }}>3. Порядок оказания</h2>
      <p>Специалист связывается с Заказчиком в Telegram с 06:00 до 19:00 по московскому времени.</p>
      {scenario.terms ? (
        <>
          <h2 style={{ fontSize: 20 }}>4. Условия и гарантия</h2>
          <p style={{ whiteSpace: "pre-line" }}>{scenario.terms}</p>
        </>
      ) : null}
      <h2 style={{ fontSize: 20 }}>{scenario.terms ? "5" : "4"}. Персональные данные</h2>
      <p>
        Для оказания услуги Исполнитель обрабатывает имя пользователя Telegram и текст заявки, только чтобы связаться с Заказчиком и помочь ему.
      </p>
    </main>
  );
}
