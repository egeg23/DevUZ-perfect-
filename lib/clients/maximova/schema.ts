import { CONTACTS, CUTS, FAQ, PHOTOS, TEACHER } from "@/content/clients/maximova/facts";
import type { Landing } from "@/content/clients/maximova/pages";
import { asset, url } from "@/lib/clients/maximova/seo";

/**
 * Разметка schema.org для Яндекса и Google.
 *
 * Только то, что правда: адрес — город и метро, без выдуманной улицы; цена —
 * её; оценок и отзывов нет, пока их нет на самом деле (выдуманный рейтинг
 * в разметке — нарушение правил обоих поисковиков).
 */

const SCHOOL_ID = url("#school");
const PERSON_ID = url("#daria");

const address = {
  "@type": "PostalAddress",
  addressLocality: "Москва",
  addressRegion: "Москва",
  addressCountry: "RU",
};

export function schoolGraph() {
  return [
    {
      "@type": "EducationalOrganization",
      "@id": SCHOOL_ID,
      name: "Дарья Максимова — английский и французский для детей",
      url: url(),
      telephone: CONTACTS.phone,
      image: asset(PHOTOS.urban.cut),
      address,
      areaServed: { "@type": "City", name: "Москва" },
      priceRange: "2900–4000 ₽",
      founder: { "@id": PERSON_ID },
      sameAs: [`https://t.me/${CONTACTS.telegram}`],
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: TEACHER.name,
      alternateName: TEACHER.fullName,
      jobTitle: TEACHER.role,
      worksFor: { "@type": "CollegeOrUniversity", name: "Российский университет дружбы народов (РУДН)" },
      knowsLanguage: ["ru", "en", "fr"],
      image: { "@type": "ImageObject", url: asset(PHOTOS.urban.cut), width: CUTS.urban.width, height: CUTS.urban.height },
    },
  ];
}

export function faqPage(questions: readonly { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function faqFor(prefixes: string[]) {
  return FAQ.filter((item) => prefixes.some((p) => item.q.startsWith(p)));
}

export function landingGraph(page: Landing) {
  const graph: unknown[] = [
    ...schoolGraph(),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: url() },
        { "@type": "ListItem", position: 2, name: page.h1, item: url(`/${page.slug}`) },
      ],
    },
    faqPage(faqFor(page.faq)),
  ];
  if (page.course) {
    graph.push({
      "@type": "Course",
      name: page.course.name,
      description: page.description,
      inLanguage: "ru",
      provider: { "@id": SCHOOL_ID },
      offers: { "@type": "Offer", price: page.course.price, priceCurrency: "RUB", url: url(`/${page.slug}`) },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: ["onsite", "online"],
        instructor: { "@id": PERSON_ID },
        location: { "@type": "Place", name: "У метро Китай-город", address },
      },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function homeGraph() {
  return { "@context": "https://schema.org", "@graph": [...schoolGraph(), faqPage(FAQ)] };
}
