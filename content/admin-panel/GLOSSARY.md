# Словарь терминов панели: ru → uz → pl

Одно слово — один перевод во всей панели. Узбекский — латиница, с `o‘`,
`g‘` (знак ‘ U+2018) и `’` (тутук белгиси, U+2019), деловой язык, как
говорят менеджеры в Ташкенте. Польский — как в польских CRM и SaaS
(Pipedrive, Livespace). Названия продуктов (DevUz, Telegram, Google,
Метрика → Metrika / Metryka), IT-термины (CRM, API, UTM) и имена не
переводятся.

| Русский | Узбекский | Польский |
|---|---|---|
| лид, лиды | lid, lidlar | lead, leady (leadów) |
| касание (холодное письмо компании) | aloqa | kontakt |
| «Касания» (раздел) | Aloqalar | Kontakty |
| порция дня | kunlik to‘plam | porcja dnia |
| поток «Получать лиды» | oqim | strumień |
| контакт клиента (телефон, ник) | mijoz kontakti | dane kontaktowe klienta |
| взять (лида) / взять себе | olish / o‘zimga olish | weź / przejmij |
| отпустить | qo‘yib yuborish | zwolnij |
| свободный лид | bo‘sh lid | wolny lead |
| на мне / мои | menda / meniki | moje |
| статус | holat | status |
| новые / в работе / отложены / выиграны / проиграны | yangi / ishda / qoldirilgan / yutilgan / yutqazilgan | nowe / w toku / odłożone / wygrane / przegrane |
| горячие / тёплые / дозреют / архив | issiq / iliq / pishib yetiladi / arxiv | gorące / ciepłe / do dojrzenia / archiwum |
| приоритет | ustuvorlik | priorytet |
| бюджет | byudjet | budżet |
| карточка лида | lid kartochkasi | karta leada |
| переписка | yozishma | korespondencja |
| заметка, обсуждение | izoh, muhokama | notatka, dyskusja |
| напоминание | eslatma | przypomnienie |
| срочно связаться | zudlik bilan bog‘lanish | pilny kontakt |
| план и факт | reja va fakt | plan i wykonanie |
| план касаний (на неделю) | aloqalar rejasi | plan kontaktów |
| к выплате | to‘lanadi | do wypłaty |
| начисление | hisoblanma | naliczenie |
| поступления | tushumlar | wpływy |
| касса | kassa | kasa |
| проект | loyiha | projekt |
| договор | shartnoma | umowa |
| счёт (на оплату) | hisob-faktura | faktura |
| заявка (из витрины) | buyurtma | zamówienie |
| смета | smeta | kosztorys |
| владелец | egasi | właściciel |
| руководитель (проектов) | rahbar (loyiha rahbari) | kierownik (kierownik projektów) |
| менеджер | menejer | menedżer |
| команда | jamoa | zespół |
| журнал | jurnal | dziennik |
| передать лида (коллеге) | lidni berish | przekaż leada |
| очередь | navbat | kolejka |
| сохранить | saqlash | zapisz |
| отмена / отменить | bekor qilish | anuluj |
| назад / вперёд | orqaga / oldinga | wstecz / dalej |
| всего | jami | łącznie |
| сегодня / вчера | bugun / kecha | dziś / wczoraj |
| неделя / месяц | hafta / oy | tydzień / miesiąc |
| сайт компании | kompaniya sayti | strona firmy |
| ИИ (модель) | sun’iy intellekt (SI) | AI |
| отказался / игнорирует | rad etdi / javob bermayapti | odmówił / ignoruje |

Суммы и даты — через `Intl` с `PANEL_INTL[locale]` (lib/admin/i18n.ts),
формы слова при числе — `plural()` для ru и pl; по-узбекски слово после
числа не меняется: «3 ta lid».
