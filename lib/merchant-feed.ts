import { company } from "@/content/company";
import { products, type Product } from "@/content/products";
import { t, type Locale } from "@/lib/i18n";
import { productCovers } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

/**
 * Товары для Google Merchant Center (фид — `app/merchant/products.xml`).
 *
 * Берём только то, что Google пускает в Shopping:
 * - готовый продукт (исходный код в собственность), а не услугу: услуги —
 *   «Unsupported Shopping content», блокировка аккаунта;
 * - с одной ценой: цена в фиде обязана совпадать с ценой на странице, а у
 *   продукта с вилкой (`priceToUsd`, лендинг «$500 – $2 500») её нет.
 * Новый продукт с одной ценой попадает в фид сам.
 */
export function merchantItems(): Product[] {
  return products.filter((p) => !p.priceToUsd);
}

/** Google product category: Software > Computer Software. */
const GOOGLE_CATEGORY = "313";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

function images(product: Product): string[] {
  const list = product.shots?.length ? product.shots.map((s) => s.src) : productCovers(product.slug).map((c) => c.src);
  return list.map((src) => absoluteUrl(src.replace(/^\//, "")));
}

export function merchantItem(product: Product, locale: Locale): string {
  const [image, ...more] = images(product);
  const title = t(product.title, locale);
  const description = `${t(product.description, locale)} ${t(product.savings, locale)}`.slice(0, 4900);
  const tags = [
    `<g:id>${esc(product.slug)}</g:id>`,
    `<g:title>${esc(title.slice(0, 150))}</g:title>`,
    `<g:description>${esc(description)}</g:description>`,
    `<g:link>${esc(absoluteUrl(`${locale}/products/${product.slug}`))}</g:link>`,
    `<g:image_link>${esc(image)}</g:image_link>`,
    ...more.slice(0, 10).map((src) => `<g:additional_image_link>${esc(src)}</g:additional_image_link>`),
    `<g:availability>in_stock</g:availability>`,
    `<g:price>${product.priceUsd.toFixed(2)} USD</g:price>`,
    `<g:condition>new</g:condition>`,
    `<g:brand>${esc(company.name)}</g:brand>`,
    // У исходного кода нет штрихкода и артикула производителя.
    `<g:identifier_exists>no</g:identifier_exists>`,
    `<g:google_product_category>${GOOGLE_CATEGORY}</g:google_product_category>`,
    `<g:product_type>Software &gt; Source code</g:product_type>`,
    // Код передаётся файлами: доставки нет, сумма доставки — ноль.
    `<g:shipping><g:price>0.00 USD</g:price></g:shipping>`,
  ];
  return `<item>\n${tags.map((x) => `  ${x}`).join("\n")}\n</item>`;
}

export function merchantFeed(locale: Locale): string {
  const items = merchantItems().map((p) => merchantItem(p, locale)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(company.name)}</title>
<link>${esc(absoluteUrl(`${locale}/products`))}</link>
<description>${esc(t(company.tagline, locale))}</description>
${items}
</channel>
</rss>
`;
}
