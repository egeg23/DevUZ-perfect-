# Картинки и ролик главной

- `office.mp4` — фон первого экрана: пролёт по офису студии петлёй, как
  гифка (владелец, 13.11.2026: «Убери здание с фона… видео с пролетом через
  офис, сделай просто гиф анимацией… но затемни сам фон»). Взят из фильма
  студии `public/film/devuz-studio.mp4` — сплошной пролёт 0,6–4,0 с, до
  врезок мониторов и здания; замедлен в 1,7 раза с интерполяцией кадров и
  склеен вперёд-назад, поэтому шва в петле нет. Затемнён в файле чуть-чуть,
  основное затемнение — слоем в `glass.module.css` (`.photo::after`).
- `office.webp` — первый кадр, постер: стоит сразу и при «меньше движения».
- `box-pro*.webp` — коробка DevUz Box в «Продуктах студии».

Собрать ролик заново (ffmpeg):

```
ffmpeg -ss 0.6 -t 3.4 -i public/film/devuz-studio.mp4 -an -filter_complex \
 "[0:v]minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,setpts=1.7*PTS,fps=30,eq=brightness=-0.05:saturation=0.88,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[o]" \
 -map "[o]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 31 -preset slow -g 60 -movflags +faststart public/home/office.mp4
ffmpeg -i public/home/office.mp4 -frames:v 1 -c:v libwebp -quality 70 public/home/office.webp
```
