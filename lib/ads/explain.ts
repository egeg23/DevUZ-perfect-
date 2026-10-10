import { money } from "@/lib/ads/negatives";
import type { Proposal } from "@/lib/ads/store";

/**
 * Предложение на языке читающего.
 *
 * Причина пишется при создании по-русски (её же читает бот и журнал), а
 * кабинет агентства бывает узбекским, панель — ещё и польской. Перевод — не
 * по готовой строке, а заново из цифр и содержимого предложения: так в нём
 * те же суммы и слова, что и в русском.
 */

export type ExplainLocale = "ru" | "uz" | "pl";

export function explain(p: Pick<Proposal, "title" | "why" | "numbers" | "payload">, locale: ExplainLocale, currency: string): { title: string; why: string } {
  if (locale === "ru") return { title: p.title, why: p.why };
  const m = (n: number) => money(n, currency, locale === "uz" ? "uz" : "ru").replace(" сум", " UZS");
  const n = p.numbers;
  const pay = p.payload;
  const pct = (v: unknown) => `${Math.round(Number(v ?? 0) * 100)}%`;
  switch (pay.kind) {
    case "negatives": {
      const list = pay.phrases.slice(0, 8).map((x) => `«${x}»`).join(", ");
      return locale === "uz"
        ? {
            title: `Minus-so‘zlar: «${pay.campaignName}» uchun ${pay.phrases.length} ta`,
            why: `30 kunda shu so‘zli so‘rovlar ${m(Number(n.wasted))} sarfladi (${n.clicks} klik) va birorta ariza keltirmadi: ${list}. Kalit so‘zlaringizga tegmasligi tekshirilgan.`,
          }
        : {
            title: `Wykluczenia: ${pay.phrases.length} w «${pay.campaignName}»`,
            why: `W 30 dni zapytania z tymi słowami wydały ${m(Number(n.wasted))} (${n.clicks} kliknięć) i nie przyniosły żadnego zgłoszenia: ${list}. Sprawdzone: nie blokują Twoich słów kluczowych.`,
          };
    }
    case "budget": {
      const donor = pay.moves.find((x) => x.to < x.from);
      const taker = pay.moves.find((x) => x.to > x.from);
      const amount = m(Number(n.amount));
      return locale === "uz"
        ? {
            title: `Byudjet: kuniga ${amount} «${donor?.campaignName}» dan «${taker?.campaignName}» ga`,
            why: `«${taker?.campaignName}» da ariza arzonroq va u har kuni byudjetga tiralib qoladi. Ehtimollik: ${pct(n.confidence)}. Umumiy byudjet o‘zgarmaydi.`,
          }
        : {
            title: `Budżet: ${amount} dziennie z «${donor?.campaignName}» do «${taker?.campaignName}»`,
            why: `W «${taker?.campaignName}» zgłoszenie jest tańsze, a kampania codziennie wyczerpuje budżet. Prawdopodobieństwo: ${pct(n.confidence)}. Łączny budżet się nie zmienia.`,
          };
    }
    case "ad_test":
      return locale === "uz"
        ? {
            title: "E’lonlar testi",
            why: `Guruhda bitta e’lon bor, ${n.impressions} ta ko‘rsatish. Yoniga yangi variant qo‘yamiz: «${pay.copy.headlines.join(" | ")}». 10–45 kundan keyin ko‘proq ariza keltirgani qoladi, ikkinchisi pauzaga qo‘yiladi.`,
          }
        : {
            title: "Test reklam",
            why: `W grupie jest jedna reklama, ${n.impressions} wyświetleń. Dodajemy nowy wariant: «${pay.copy.headlines.join(" | ")}». Po 10–45 dniach zostaje ten, który daje więcej zgłoszeń, drugi idzie na pauzę.`,
          };
    case "ad_winner":
      return locale === "uz"
        ? { title: "Test natijasi: yutqazgan e’lon pauzaga", why: `G‘olib qoladi, ikkinchisi pauzaga qo‘yiladi. Ehtimollik: ${pct(n.probability)}.` }
        : { title: "Wynik testu: przegrany wariant na pauzę", why: `Zwycięzca zostaje, drugi idzie na pauzę. Prawdopodobieństwo: ${pct(n.probability)}.` };
  }
}
