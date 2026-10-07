# Что взято с 21st.dev

Код 21st.dev — React + Tailwind + framer-motion. В прототипе всё переписано
на чистый CSS и JS, анимации — только `transform` и `opacity`. Брали идеи и
числа, а не файлы. Лицензию смотрели в поле License на странице компонента
(`https://21st.dev/@автор/components/<имя>.md`), 07.10.2026.

| Где в прототипе | Компонент на 21st.dev | Автор | Лицензия |
|---|---|---|---|
| Запись, шаг «День и время»: полоса дней и сетка времени, занятое зачёркнуто | [Booking Slot Calendar](https://21st.dev/@bidyut10/components/booking-slot-calendar) | bidyut10 | MIT |
| Карточка врача: по наведению выезжает «Записаться», фото чуть увеличивается | [Team Member Card](https://21st.dev/@Shatlyk1011/components/team-member-card) | Shatlyk1011 | MIT |
| Отзывы: бегущая лента, пауза при наведении, затухание по краям, копия набора `aria-hidden` | [Testimonials with Marquee](https://21st.dev/@serafimcloud/components/testimonials-with-marquee) | Serafim | MIT |
| Цифры о клинике: счёт при появлении, затухание к концу (easeOutExpo), `tabular-nums` | [Count Up](https://21st.dev/@unlumen/components/count-up) | unlumen | MIT |
| Направления: бенто-сетка, большая плитка на 2×2, «Записаться →» появляется при наведении | [Bento Grid](https://21st.dev/@dillionverma/components/bento-grid) | Dillion Verma (Magic UI) | MIT |
| Филиалы: точки на схеме с расходящейся волной | [Globe](https://21st.dev/@youcefbnm/components/globe) | YoucefBnm | MIT |

Только идея, код не брали (лицензия unknown):
- [DoctorLiveChatCard](https://21st.dev/@ruixen.ui/components/doctor-live-chat-card)
  — раскладка карточки врача;
- [Perspective Parallax Animation](https://21st.dev/@mohammad.naim.sheikh/components/perspective-parallax-animation)
  — слои с разной скоростью.

Сознательно не взяли:
- Container Scroll Animation и World Map от Aceternity: у Aceternity своя
  лицензия.
- Lenis и любой «плавный скролл»: это перехват прокрутки, запрещён в
  proto-master.
- Календарь на `scroll-snap`: проверка прототипа считает его перехватом.

3D-пролёт по врачам — своя сборка: CSS `perspective` + `preserve-3d`, камера —
`translateZ` у сцены. Ближе всего к нему Glyph Portal из прототипа
bloger.agency (MIT, Christian Katzmann), но кода оттуда нет.
