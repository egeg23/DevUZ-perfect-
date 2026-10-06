import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RiskNote } from "@/components/RiskNote";
import { StackStatus } from "@/components/StackStatus";

export default function Home() {
  return (
    <main className="wrap">
      <Header />
      <h1>Автоматическая торговля перпетуалами на Bybit</h1>
      <p className="muted" style={{ maxWidth: 680, fontSize: 18 }}>
        Сигнал модели Kronos → исполнение NautilusTrader → ваш кабинет Bybit. Дашборд в
        реальном времени и Telegram-бот. Сервис в разработке.
      </p>
      <RiskNote />
      <div className="grid">
        <StackStatus />
        <div className="card">
          <h3>Что дальше</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Регистрация с 2FA, подключение кабинета Bybit по API-ключу без права вывода,
            дашборд с честной статистикой после комиссий.
          </p>
          <Link href="/brand">Страница бренда →</Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
