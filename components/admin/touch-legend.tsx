import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { HOURLY_CAP } from "@/lib/admin/outreach";

/**
 * Как читать цифры в «Касаниях».
 *
 * Владелец: «дай расшифровку цифр в касаниях — новички не понимают». У
 * карточки три числа справа, цветные метки находок и строки над списком, и
 * без подписи новичок видит «поиск 58 · −24…48 · 72» как шифр. Подсказки
 * при наведении были, но на телефоне наводить нечем.
 *
 * Свёрнуто по умолчанию: тем, кто уже знает, оно не нужно, а новичку одно
 * нажатие.
 */
export function TouchLegend() {
  return (
    <details className="mt-6 rounded-xl border border-line bg-surface px-5 py-3 text-sm">
      <summary className="cursor-pointer text-xs uppercase tracking-wider text-faint hover:text-text">
        Как читать цифры
      </summary>

      <dl className="mt-4 grid gap-x-6 gap-y-4 leading-relaxed sm:grid-cols-2">
        <Term name={<span className="font-mono text-green">поиск 84</span>}>
          <b>Видимость в поиске</b>, от 0 до 100: насколько легко найти сайт в Google и Яндексе.
          Считается по тому, что мешает поиску: нет описания, нет карты сайта, страницы с одинаковыми
          заголовками. <span className="text-green">80 и выше</span> — в порядке,{" "}
          <span className="text-gold">50–79</span> — есть что поправить,{" "}
          <span className="text-red-300">ниже 50</span> — находят плохо, до 10 — сайт закрыт от поиска.
        </Term>

        <Term name={<span className="font-mono text-red-300">−24…48</span>}>
          <b>Сколько обращений теряется</b> из каждых ста человек, которые уже открыли сайт и готовы
          были написать или позвонить: от 24 до 48. Это наша оценка по найденным проблемам (нет цен,
          телефон не нажимается, с телефона не читается), а не статистика клиента — так и говорите.
          С поиском не связано: сайт может хорошо находиться и при этом терять людей.
        </Term>

        <Term name={<span className="font-mono text-gold">52</span>}>
          <b>Общая оценка сайта</b>, от 0 до 100: сто минус 25 за каждую критичную находку, 12 за
          серьёзную и 5 за мелкую. <span className="text-gold">Жёлтым</span> — ниже 60. Ноль — сайт не
          открылся, и оценить его было нечем. Чем ниже оценка, тем больше честных поводов написать.
        </Term>

        <Term
          name={
            <span className="flex flex-wrap gap-1">
              <Chip tone="border-red-500/40 text-red-300">критично</Chip>
              <Chip tone="border-gold/40 text-gold">серьёзно</Chip>
              <Chip tone="border-line text-muted">мелочь</Chip>
            </span>
          }
        >
          <b>Находки</b> — что не так на сайте. Цвет рамки — насколько это важно. Наведите курсор или
          откройте карточку: там написано, чем это оборачивается для клиентов и что мы с этим делаем.
          Начинайте разговор с находки про клиентов и деньги, а не с технической.
        </Term>

        <Term name={<span className="text-faint">ушло 1 из {HOURLY_CAP} · в очереди 3</span>}>
          <b>Очередь рабочего аккаунта.</b> Бот пишет с аккаунта студии не больше {HOURLY_CAP} новых
          компаний в час — иначе Telegram примет это за рассылку и ограничит аккаунт. «В очереди» —
          сколько сообщений ждут своей минуты. Не хотите ждать — напишите со своего аккаунта и
          нажмите «Связался сам».
        </Term>

        <Term name={<span className="text-faint">осталось 12 — сделано 18 из 30</span>}>
          <b>План касаний на неделю</b> — его ставит руководитель своим людям или владелец. Считаются
          касания с понедельника: отправленные ботом и отмеченные «Связался сам» (в Telegram — «Написал
          сам»). Порция дня — это план недели, разложенный по дням: сделали порцию — идёте по плану.
        </Term>
      </dl>

      <p className="mt-4 text-xs text-faint">
        Статусы карточки: <b>не писали</b> — ещё никто не касался; <b>сообщение готово</b> — письмо
        написано, не отправлено; <b>в очереди на отправку</b> — ждёт своей минуты у бота;{" "}
        <b>отправлено</b> — ушло, ждём ответа, через 3 и 7 дней молчания бот сам напомнит о себе;{" "}
        <b>писать руками</b> — в Telegram не найти, звоните или пишите в WhatsApp; <b>не ушло</b> —
        бот не смог доставить, откройте карточку; <b>пропущен</b> — решили не писать.{" "}
        <HelpHint topic={helpAnchor("/admin/prospect", "numbers")} label="Подробнее в инструкции" />
      </p>
    </details>
  );
}

function Term({ name, children }: { name: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm">{name}</dt>
      <dd className="mt-1 text-xs text-muted">{children}</dd>
    </div>
  );
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${tone}`}>{children}</span>;
}
