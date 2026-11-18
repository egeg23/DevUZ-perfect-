import type { LandingLocale } from "@/content/service-landings";

/**
 * English service pages for clients in the United States, the United
 * Kingdom and Canada. Owner decision, 18.11.2026: each language version
 * targets the region of that language, so the English pages are written for
 * English-speaking markets, not for foreigners looking for a developer in
 * Tashkent. Queries come from what people search in those countries
 * ("website development company", "ecommerce website development", ...).
 * Tashkent appears only as the office address; we work with these clients
 * remotely.
 *
 * Same shape as ru.ts. Numbers only as placeholders: {price} and
 * {priceShort} render in US dollars (`LANDING_MONEY.en`), {weeks} is the
 * timeline in weeks, {hours} the hours for a free mockup, {staff},
 * {projects}, {countries} come from `proof`. The page query (`query`) sits
 * in the title, the description and the first sentence of the lead.
 */
export const en: LandingLocale = {
  ui: {
    breadcrumb: "Services",
    from: "Price from",
    weeks: "Timeline",
    weeksUnit: "weeks",
    mockupTitle: "See your future website in 2 minutes",
    mockupText:
      "Send us your website or Instagram address and pick your industry: we build a mockup with your name, services and contacts right on the screen. Free, no sales call.",
    mockupCta: "Build a mockup",
    talkCta: "Discuss a project",
    kindsTitle: "What we build and what it costs",
    includedTitle: "What the work includes",
    stepsTitle: "How the work goes",
    pricesTitle: "Prices and timelines",
    pricesNote:
      "The price is fixed in the contract before work starts. Payment in parts: half at the start, half after launch. Prices are in US dollars, and the payment method is agreed in the contract.",
    colType: "What we build",
    colPrice: "Price from",
    colTerm: "Timeline",
    localTitle: "Working with clients in the US, UK and Canada",
    compareTitle: "Studio, freelancer or website builder",
    compareCols: ["", "DevUz", "Freelancer", "Website builder (Wix, Squarespace)"],
    compareRows: [
      ["Contract and price", "Contract, price fixed before the start", "Often no contract", "Monthly subscription"],
      ["See it before paying", "A free mockup of your website", "No", "A template used by thousands of others"],
      ["Team", "Designer, developers, QA engineer", "One person does everything", "You do it all yourself"],
      ["Languages and search", "English plus any languages you need, markup for Google", "Hit or miss", "Limited by the platform"],
      ["Online payments", "We connect the payment provider you use", "Not always able to", "Only what the platform supports"],
      ["After launch", "We stay in touch and keep improving", "May disappear", "Platform support only"],
    ],
    casesTitle: "Our work",
    casesAll: "All case studies",
    faqTitle: "Frequently asked questions",
    relatedTitle: "Other services",
    officeTitle: "Where we are and how we work",
    officeText:
      "Our office is at 138 Shota Rustaveli Street, Tashkent. We work remotely with clients abroad: video calls scheduled in advance, a shared chat, and a contract signed however suits you.",
    facts: { staff: "in-house developers", projects: "completed projects", countries: "countries where our projects run" },
  },
  pages: {
    "web-development": {
      title: "Website development",
      query: "website development company",
      seoTitle: "Website development company: from {priceShort}, mockup first | DevUz",
      seoDescription:
        "A website development company for small and mid-size businesses: landing pages from {priceShort}, business websites, online stores. Free mockup before you pay, a contract, payment in parts.",
      h1: "A website development company that shows you the site before you pay",
      lead:
        "DevUz is a website development company for businesses that need leads, not just a page on the internet. We build landing pages, business websites and online stores in English and any other language your customers speak. We work remotely, and before you pay you see a mockup of your site: build one here in 2 minutes or get one from a designer in {hours} hours.",
      kinds: [
        { title: "Landing page", text: "One page for one service or ad campaign: offer, prices, reviews and an inquiry form that notifies you by email or in a messenger." },
        { title: "Business website", text: "A company website in one or several languages: services, projects, team, contacts and an admin panel where your staff edits the texts." },
        { title: "Online store", text: "A catalog with filters, a cart, online payment, shipping and a link to your inventory system." },
        { title: "Web app and client portal", text: "Client accounts, orders, calculations, staff roles, CRM sync. For when a website is not enough and you need a system." },
      ],
      included: [
        "A review of competitors in your niche and your market, then the site structure",
        "Design for your brand: mockup first, code second",
        "Mobile layout: most visitors come from their phones",
        "English plus any other languages your customers need",
        "An admin panel where you change texts, prices and photos yourself",
        "Inquiry forms that notify you by email, in a messenger and in your CRM",
        "Search basics: titles, descriptions, Schema.org markup, sitemap",
        "Google Analytics with goals for inquiries",
        "Domain, SSL and hosting on your server or ours",
        "Training your staff member to use the admin panel",
      ],
      steps: [
        { title: "Intro and mockup", days: "1–2 days", text: "You build a mockup on the site or send us a brief. Our designer prepares a free mockup of your website in {hours} hours." },
        { title: "Structure and contract", days: "1–3 days", text: "We get on a call and agree on pages, features and languages. Price and timeline go into the contract." },
        { title: "Design", days: "3–7 days", text: "We design the key screens for phone and desktop. You approve each screen before development starts." },
        { title: "Development", days: "1–5 weeks", text: "We build the site and connect the admin panel, forms, payments, CRM and analytics. You can follow progress online." },
        { title: "Content and testing", days: "2–4 days", text: "We fill the site in the languages you need, test it on phones and browsers, and speed up loading." },
        { title: "Launch", days: "1 day", text: "We connect the domain, submit the site to Google, hand over access and show you how everything works." },
      ],
      local: [
        { title: "Remote, like a team down the hall", text: "Video calls at a time that works for your time zone, a shared chat, and every stage visible online. No need to visit us." },
        { title: "A contract you can read", text: "Scope, price and timeline are written down before work starts. The payment method is agreed in the contract." },
        { title: "Built for your market", text: "Language, currency, phone format, payments and shipping match what your customers expect. Markup for Google and Bing." },
        { title: "Your tools stay", text: "We connect the CRM, email service and payment provider you already use instead of making you switch." },
      ],
      faq: [
        { q: "How much does a website development company charge?", a: "With us, a landing page starts from {price}. Business websites and online stores cost more, see the table above for each type. We give the exact price after a short brief and fix it in the contract." },
        { q: "How long does it take to build a website?", a: "A landing page takes {weeks} weeks. A business website takes a month or more, an online store two months or more. The timeline is written into the contract." },
        { q: "Do you work with clients in the US, UK and Canada?", a: "Yes, remotely: video calls, a shared chat, a contract. We schedule calls around your time zone and agree on the payment method in the contract." },
        { q: "Can I see the website before paying?", a: "Yes. On this page you can build a mockup of your website in 2 minutes. If you want a mockup from a designer, it will be ready in {hours} hours, free of charge." },
        { q: "How does payment work?", a: "Under a contract, in parts: half at the start, half after launch. Prices are in US dollars." },
        { q: "Can I change texts and prices myself?", a: "Yes. Every site has an admin panel: your staff member changes texts, prices, photos and adds pages without a developer. We show you how to use it." },
        { q: "Will the website show up in Google?", a: "We lay the search groundwork during development: titles, descriptions, markup, speed, sitemap. Ranking for specific keywords is separate work, and we do that too." },
        { q: "What happens after launch?", a: "We stay in touch: we fix anything that goes wrong and add new features when your business needs them." },
      ],
    },

    "online-store": {
      title: "Online store",
      query: "ecommerce website development",
      seoTitle: "Ecommerce website development from {priceShort} | DevUz",
      seoDescription:
        "Ecommerce website development for retailers and brands: catalog, cart, online payment, shipping, inventory sync and an admin panel. From {priceShort}, with a mockup before you pay.",
      h1: "Ecommerce website development",
      lead:
        "Ecommerce website development from catalog to checkout: filters, a cart, online payment, shipping and an admin panel for orders. We build stores for sellers in the US, UK, Canada and other countries, and ordering from a phone is as easy as from a computer. Before you pay, we show you a mockup of your store.",
      kinds: [
        { title: "Turnkey store", text: "Catalog, product pages, filters, cart, checkout and online payment. Suits retailers and brands." },
        { title: "Store with inventory sync", text: "Products, prices and stock come from your inventory or accounting system automatically, and orders go back. No manual copying." },
        { title: "Marketplace", text: "Multiple sellers, seller accounts, commissions and payouts. For when you are building a platform, not a single store." },
      ],
      included: [
        "Catalog with categories, filters and search",
        "Product page with photos, variants and stock status",
        "Cart and checkout in a few taps",
        "Online payment through the provider you use (for example Stripe or PayPal)",
        "Shipping: zones, rates and the carriers you work with",
        "Admin panel: orders, statuses, products, promotions, discount codes",
        "Order notifications by email and in a messenger for your team and the buyer",
        "Sync with your inventory system, CRM or spreadsheets",
        "The languages and currency you need, product markup for search",
        "Google Analytics with order goals",
      ],
      steps: [
        { title: "Store mockup", days: "1–2 days", text: "We show you how your store will look with your own products. Free, before the contract." },
        { title: "Catalog and contract", days: "2–4 days", text: "We go through your range, payment and shipping options. Price and timeline are fixed." },
        { title: "Design", days: "1–2 weeks", text: "Home page, catalog, product page, cart. The phone version is designed separately." },
        { title: "Development and payments", days: "3–6 weeks", text: "We build the store and connect online payment, shipping and the admin panel." },
        { title: "Inventory sync", days: "1–2 weeks", text: "We set up sync with your inventory system and load the products." },
        { title: "Test orders and launch", days: "3–5 days", text: "We walk through the whole buyer journey with real payments and launch the store." },
      ],
      local: [
        { title: "Your payments and shipping", text: "We connect the payment provider and carriers you already work with or plan to use." },
        { title: "Inventory without copying", text: "Stock and prices don't need to be moved by hand: sync with your system runs automatically." },
        { title: "Orders reach you right away", text: "A new order goes straight to your team by email or in a messenger, and the buyer gets the order status." },
        { title: "Sales tax and currency", text: "Prices in your currency, and taxes shown the way your payment provider and accountant set them up." },
      ],
      faq: [
        { q: "How much does ecommerce website development cost?", a: "From {price}. The price depends on the number of products, payment and shipping options, and inventory sync. We fix the exact amount in the contract after a brief." },
        { q: "How long does it take to build an online store?", a: "Usually {weeks} weeks. If you need inventory sync or a multi-seller marketplace, it takes longer, and we tell you upfront." },
        { q: "Which payment providers can you connect?", a: "The one you use, for example Stripe or PayPal. You sign the agreement with the payment provider, we handle the technical side." },
        { q: "Can the store sync with our inventory system?", a: "Yes. Products, prices and stock come from your system, and orders go back." },
        { q: "Who will add the products?", a: "Your staff member, in the admin panel. The catalog can be uploaded as a file. We can do the initial product upload for you." },
        { q: "Do you work with stores in the US, UK and Canada?", a: "Yes, remotely and under a contract. We schedule calls around your time zone and agree on the payment method in the contract." },
        { q: "Can I see the store before paying?", a: "Yes, we show you a free mockup of your store. Also see our work below: stores with an owner dashboard." },
        { q: "What if I already sell on Instagram or marketplaces?", a: "Your own store doesn't compete with them, it helps: the link in your profile leads to the catalog, orders go through on their own, and you don't pay a marketplace commission." },
      ],
    },

    "mobile-apps": {
      title: "Mobile apps",
      query: "mobile app development company",
      seoTitle: "Mobile app development company: iOS and Android | DevUz",
      seoDescription:
        "A mobile app development company for iOS and Android: design, development, publishing to the App Store and Google Play. From {priceShort}, with an app mockup before you pay.",
      h1: "A mobile app development company for iOS and Android",
      lead:
        "DevUz is a mobile app development company that takes you from the idea and mockup to publishing in the App Store and Google Play. We build apps for ordering, booking, delivery, learning and internal company tasks, for clients in the US, UK, Canada and other countries. One codebase for both platforms saves budget, and you see an interactive mockup before development starts.",
      kinds: [
        { title: "Customer app", text: "Catalog, ordering, payment, loyalty points, push notifications. For stores, restaurants, clinics and service businesses." },
        { title: "Staff app", text: "Requests, courier routes, photo reports, tasks. Works even on a weak connection." },
        { title: "Telegram Mini App", text: "An app inside Telegram with no store install: catalog, booking, payment. Faster and cheaper, if your customers use Telegram." },
      ],
      included: [
        "Research: who will use it and why",
        "An interactive mockup of every screen before development",
        "An iOS and Android app on a single codebase",
        "Backend and an admin panel to manage it",
        "Sign-in by email, phone number, Apple or Google account",
        "Online payments inside the app",
        "Push notifications and broadcasts",
        "English plus any other languages your users need",
        "Publishing to the App Store and Google Play",
        "Analytics: who signs in, what they order, where they drop off",
      ],
      steps: [
        { title: "Idea and user flows", days: "2–4 days", text: "We describe step by step what a person does in the app. We cut what the first version doesn't need." },
        { title: "Interactive mockup", days: "1–2 weeks", text: "You can swipe through every screen on a phone before the first line of code is written." },
        { title: "Contract", days: "1–2 days", text: "We fix the first version, the price and the timeline." },
        { title: "Development", days: "6–10 weeks", text: "App, backend and admin panel. Every two weeks we show you a working build." },
        { title: "Testing", days: "1–2 weeks", text: "We test on different phones, fix issues and prepare the store materials." },
        { title: "Publishing", days: "1–2 weeks", text: "We pass App Store and Google Play review and release the app." },
      ],
      local: [
        { title: "Remote, step by step", text: "Every two weeks a working build lands on your phone. You see what you are paying for long before launch." },
        { title: "Familiar sign-in", text: "Sign in with Apple, Google or email: no new password for your customers to remember." },
        { title: "Store rules handled", text: "Privacy labels, screenshots and review notes for the App Store and Google Play are part of the work." },
        { title: "Telegram Mini App", text: "If part of your audience already uses Telegram, you can start with a Mini App and release the store app as the second version." },
      ],
      faq: [
        { q: "How much does a mobile app development company charge?", a: "With us, from {price} for the first version on iOS and Android. The price depends on the number of screens, payments and integrations with your systems. We fix it in the contract." },
        { q: "How long does development take?", a: "The first version takes {weeks} weeks, including the mockup and publishing to the stores." },
        { q: "Are iOS and Android two separate apps?", a: "No, we write one app on a shared codebase that runs on both platforms. It is cheaper and faster than two separate apps." },
        { q: "Can we start with a Telegram Mini App?", a: "Yes, if your customers use Telegram: faster launch, no install needed. Once customers come, we release the app in the stores." },
        { q: "Who publishes the app to the App Store and Google Play?", a: "We do: we prepare the description and screenshots and pass store review. Developer accounts are registered to your company." },
        { q: "Will there be an admin panel?", a: "Yes, every app comes with an admin panel: products, orders, users, broadcasts." },
        { q: "Can I see the app before development?", a: "Yes, you swipe through an interactive mockup of every screen on your own phone before coding starts." },
        { q: "Do you support the app after launch?", a: "Yes: we update it for new iOS and Android versions, fix bugs and add features." },
      ],
    },

    "telegram-bots": {
      title: "Telegram bots",
      query: "telegram bot development",
      seoTitle: "Telegram bot development for business from {priceShort} | DevUz",
      seoDescription:
        "Telegram bot development for business: orders and bookings, payments, broadcasts, CRM integration, AI replies to customers. From {priceShort}, launch in {weeks} weeks.",
      h1: "Telegram bot development for business",
      lead:
        "Telegram bot development for businesses whose customers already message them in Telegram. The bot takes orders and bookings, answers common questions, accepts payments, sends broadcasts and passes inquiries to your team and CRM. Our own bot works every day: it builds a website mockup for a client right in the chat.",
      kinds: [
        { title: "Ordering and booking bot", text: "Menu, catalog, cart, time slot booking, payment, notification to your team." },
        { title: "Bot with broadcasts and CRM", text: "Subscriber segments, broadcasts from the admin panel, inquiries to your CRM, statistics." },
        { title: "AI bot", text: "Answers customers in its own words about your services and prices, collects the inquiry and hands it to a person." },
      ],
      included: [
        "Flow: what the bot asks and where it leads the customer",
        "Menu, buttons and texts in the languages you need",
        "Taking orders, bookings and inquiries",
        "Payment through a provider connected to the bot",
        "Notifications to your team in a work chat",
        "Admin panel: inquiries, subscribers, broadcasts",
        "Integration with HubSpot, Pipedrive, another CRM or Google Sheets",
        "A Mini App inside Telegram if you need a catalog with photos",
        "Statistics: how many wrote, how many bought",
        "Server hosting and support",
      ],
      steps: [
        { title: "Flow", days: "1–2 days", text: "We map the customer journey: what they write, what the bot answers, where a person steps in." },
        { title: "Contract", days: "1 day", text: "We fix the features, price and timeline." },
        { title: "Development", days: "1–2 weeks", text: "We build the bot, admin panel, payments and CRM integration." },
        { title: "Testing", days: "2–3 days", text: "We go through every flow with your team and polish the texts." },
        { title: "Launch", days: "1 day", text: "We launch the bot, add the link to your site and social profiles, and train your team." },
      ],
      local: [
        { title: "Where your customers already are", text: "Telegram is widely used in many countries and diaspora communities. If your customers write to you there, the bot meets them in the same place." },
        { title: "Several languages", text: "The bot asks for the language in the first message and keeps using it." },
        { title: "Night inquiries aren't lost", text: "The bot replies at night too, and your team gets ready inquiries in the morning." },
        { title: "Next to your other channels", text: "Inquiries from the bot land in the same CRM as those from your website, email and phone." },
      ],
      faq: [
        { q: "How much does Telegram bot development cost?", a: "From {price} for an ordering or booking bot. A bot with AI replies and CRM integration costs more, see the table above." },
        { q: "How long does it take to build a bot?", a: "A simple bot takes {weeks} weeks. A bot with payments, CRM and a Mini App takes longer, and we name the timeline upfront." },
        { q: "Can the bot accept payments?", a: "Yes, through a payment provider connected to the bot or with a link to a payment page." },
        { q: "Can the bot be connected to a CRM?", a: "Yes, inquiries go to your CRM or a Google Sheet, and your team gets a notification." },
        { q: "Can the bot reply like a real person?", a: "Yes, an AI bot answers in its own words about your services and prices. When a question is complex, it hands the conversation to a person." },
        { q: "Can we send broadcasts to subscribers?", a: "Yes, from the admin panel or a phone: to all subscribers or to groups, with an image and buttons." },
        { q: "What is a Mini App?", a: "It is an app inside Telegram: a catalog with photos, a cart, booking. It opens from the bot with no install." },
        { q: "Who owns the bot?", a: "You do: the bot is registered to your account, and we hand over the code and data under the contract." },
      ],
    },

    "landing-page": {
      title: "Landing page",
      query: "landing page design",
      seoTitle: "Landing page design from {priceShort}, in {weeks} weeks | DevUz",
      seoDescription:
        "Landing page design for ads and leads: offer, copy, design, a form that notifies you right away, Google Analytics with goals. From {priceShort}, with a mockup before you pay.",
      h1: "Landing page design that turns ad traffic into leads",
      lead:
        "We do landing page design for one job: collecting leads from ads for a specific service or product. One page, a clear offer, prices, reviews and a form that sends the inquiry to you right away. We build landing pages for businesses in the US, UK, Canada and other countries, and you see a mockup of yours before paying.",
      kinds: [
        { title: "Landing page for ads", text: "A page for one service or promotion for Google Ads, Meta and other ad platforms. Analytics goals to track the cost per lead." },
        { title: "Animated landing page", text: "A scroll-driven scene, video, interactive elements. For when you need to impress and be remembered." },
        { title: "Several landing pages", text: "A separate page for each service or city. Ads lead every customer to their own offer." },
      ],
      included: [
        "Offer and structure: what a person sees on each screen",
        "Copy written in the buyer's own words",
        "Design for your brand for phone and desktop",
        "Inquiry form that notifies you by email or in a messenger",
        "Call, text and WhatsApp buttons",
        "English plus other languages if you need them",
        "Google Analytics with goals",
        "Fast loading on mobile data",
        "Domain and SSL",
        "Adjustments based on the first ad results",
      ],
      steps: [
        { title: "Mockup", days: "1 day", text: "You build a mockup on the site in 2 minutes or get one from a designer in {hours} hours." },
        { title: "Offer and copy", days: "1–2 days", text: "We shape the offer, the benefits and the answers to objections." },
        { title: "Design", days: "2–4 days", text: "We design the screens for phone and desktop, you approve them." },
        { title: "Build and forms", days: "3–5 days", text: "We build the page and connect the forms, notifications and analytics." },
        { title: "Launch", days: "1 day", text: "We publish it on the domain, check the goals and hand the page over for ads." },
      ],
      local: [
        { title: "Made for your ad platforms", text: "Google Ads, Meta, TikTok: the page opens fast, including in in-app browsers, and leads to an inquiry." },
        { title: "An inquiry in seconds", text: "A phone number and a call or message button, no long forms." },
        { title: "Cost per lead is visible", text: "Goals in Google Analytics show how much each lead from ads costs." },
        { title: "Privacy basics", text: "A privacy policy link and a cookie notice where your market expects them, so the page is ready to run ads." },
      ],
      faq: [
        { q: "How much does landing page design cost?", a: "From {price}. An animated landing page and several pages for different services cost more, see the table above." },
        { q: "How long does a landing page take?", a: "{weeks} weeks, including the mockup, the copy and analytics setup." },
        { q: "How is a landing page different from a website?", a: "A landing page is one page for one job, usually for ads. A website tells the whole story of the company and is needed when you have many services." },
        { q: "Do you write the copy?", a: "Yes, we write the copy ourselves from a short brief. We also take your texts and polish them." },
        { q: "Where do inquiries go?", a: "To your team by email or in a messenger right after submission, and to your CRM if you have one." },
        { q: "Will the landing page work for Google Ads and Meta?", a: "Yes, we build it with the phone, in-app browsers and ad platform goals in mind." },
        { q: "Can I see the landing page before paying?", a: "Yes, you can build a mockup of your landing page right on this page in 2 minutes." },
        { q: "Can the landing page later become a full website?", a: "Yes, the landing page becomes the home page, and we add the other sections next to it." },
      ],
    },

    "corporate-website": {
      title: "Corporate website",
      query: "business website design",
      seoTitle: "Business website design from {priceShort}, mockup first | DevUz",
      seoDescription:
        "Business website design for companies: services, projects, team, careers, several languages, an admin panel for your staff. From {priceShort}, {weeks} weeks, with a mockup before you pay.",
      h1: "Business website design for companies",
      lead:
        "We do business website design for companies that need to look solid to clients, partners and investors. Services and products, projects, team, news, careers and contacts in English and any other languages you need, for companies in the US, UK, Canada and other countries. Your staff edits texts and news in the admin panel, without a developer.",
      kinds: [
        { title: "Company website", text: "Services, about the company, projects, contacts in the languages you need. Admin panel for news and texts." },
        { title: "Manufacturer website", text: "A product catalog without a cart, documents and certificates, wholesale and quote requests." },
        { title: "Portal with accounts", text: "Accounts for clients, partners or investors, documents, requests and staff roles." },
      ],
      included: [
        "A structure built around your clients and partners",
        "Design in your brand style",
        "English and other language versions",
        "Catalog of services or products",
        "Projects and case studies, news, careers",
        "Admin panel for texts, news and documents",
        "Inquiry forms that notify you by email, in a messenger and in your CRM",
        "Search markup and sitemap",
        "Google Analytics",
        "Moving content from the old site without losing search rankings",
      ],
      steps: [
        { title: "Brief and mockup", days: "1–2 days", text: "We go over what the site needs to do and show you a free home page mockup in {hours} hours." },
        { title: "Structure and contract", days: "2–4 days", text: "We agree on sections, languages and features. Price and timeline are fixed." },
        { title: "Design", days: "1–2 weeks", text: "Home page and inner pages for phone and desktop." },
        { title: "Development", days: "2–3 weeks", text: "We build the site, admin panel, forms and language versions." },
        { title: "Content", days: "3–5 days", text: "We move texts, photos and documents and check the translations." },
        { title: "Launch", days: "1–2 days", text: "We connect the domain, set up redirects from old addresses and submit the site to Google." },
      ],
      local: [
        { title: "Languages for your markets", text: "English for your main market, plus other languages if you sell or hire in other countries." },
        { title: "Documents and credentials", text: "A section with licenses, certificates and company details: partners and procurement teams ask for them." },
        { title: "Moving without losses", text: "If your old site already ranks in Google, we keep the addresses and set up redirects." },
        { title: "Accessible and readable", text: "We design with clear contrast and readable fonts, and build pages that can be used with a keyboard and a screen reader." },
      ],
      faq: [
        { q: "How much does business website design cost?", a: "From {price}. The price depends on the number of sections, languages and features such as client accounts. We fix it in the contract." },
        { q: "How long does development take?", a: "{weeks} weeks, including design, content and launch." },
        { q: "How many languages will the site have?", a: "As many as your clients need: usually English, plus the languages of the countries where you work." },
        { q: "Can we publish news ourselves?", a: "Yes, your staff publishes news, edits texts and uploads documents in the admin panel." },
        { q: "Will you move our old website?", a: "Yes, we move texts and documents and set up redirects so you don't lose search rankings." },
        { q: "Can you build accounts for clients or partners?", a: "Yes, that is a portal with accounts: documents, requests, statuses. See the price in the table above." },
        { q: "Can I see the website before paying?", a: "Yes, we show you a free mockup of your website's home page." },
        { q: "Do you work under a contract with companies abroad?", a: "Yes, under a contract, with payment in parts: half at the start, half after launch. Prices are in US dollars, and the payment method is agreed in the contract." },
      ],
    },
  },
};
