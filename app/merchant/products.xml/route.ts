import { merchantFeed } from "@/lib/merchant-feed";
import { isLocale } from "@/lib/i18n";

/**
 * Фид товаров для Google Merchant Center — `/merchant/products.xml?lang=en`.
 *
 * Владелец, 14.11.2026: «сделай так, чтобы все что мы делаем было в виде
 * товаров в гугл merchant». Услуги (разработка сайтов, ботов, приложений)
 * Merchant Center запрещает — «труд, время, экспертиза без передачи товара в
 * собственность» (support.google.com/merchants/answer/6150006, «Services»):
 * за них предупреждение и блокировка аккаунта. В фиде — только готовые
 * продукты, исходный код в собственность (`merchantItems`).
 *
 * Merchant Center сам забирает файл по расписанию; язык фида — `lang`
 * (en по умолчанию), ссылки ведут на страницу продукта на этом языке.
 */
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") ?? "en";
  const locale = isLocale(lang) ? lang : "en";
  return new Response(merchantFeed(locale), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
