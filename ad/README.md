# Реклама студии

Картинка свёрстана, а не нарисована: текст правится строкой, шрифт и цвета
берутся те же, что на сайте, и любую правку видно на снимке через секунду.
Реклама, набранная чужой гарнитурой, читается как чужая, и человек, дошедший
до сайта, не узнаёт место, из которого пришёл.

Два языка — два файла с одной вёрсткой: `telegram-post-ru.html` и
`telegram-post-uz.html`. Отличаются они только текстом. Разводить их в две
разные вёрстки нельзя: поправив одну, вторую забудут, и через месяц у студии
окажется две разные рекламы.

Узбекские слова взяты с сайта (`content/services.ts`): «bepul», «prototip»,
«soat», «Marketpleyslar», «AI agentlar». Реклама, набранная другими словами,
чем сайт, читается как чужая ровно так же, как набранная другим шрифтом.

## Собрать заново

```
node scripts/shot.mjs ad/telegram-post-ru.html ad/telegram-post-ru.png 540x675 2
node scripts/shot.mjs ad/telegram-post-uz.html ad/telegram-post-uz.png 540x675 2
```

Получается 1080×1350 — 4:5, максимум, который телеграм показывает в ленте
целиком, без обрезки.

## Проверить перед отправкой

```
node scripts/legibility.mjs ad/telegram-post-ru.html 390 488
node scripts/legibility.mjs ad/telegram-post-uz.html 390 488
```

В ленте телефона картинка занимает около 390 px по ширине — втрое меньше, чем
её грузят. Поэтому все размеры в макете заданы в `vw`, а не в пикселях: тот же
файл можно снять на 390 и увидеть ровно то, что увидит человек. Порог — 4% от
ширины кадра, на 390 px это 15,6 px. Скрипт возвращает ненулевой код, если
что-то мельче или вылезло за кадр.

Проверять обе версии обязательно: узбекские слова длиннее русских, и строка,
помещавшаяся в две, у близнеца легко уходит в три.

Ссылка, список услуг и условия из картинки убраны сознательно: в размер,
который переживает такое уменьшение, они не помещаются. Их место — в тексте
поста, где они кликаются и не мешают.

## Текст поста · русский

> Бесплатный рабочий прототип вашего сайта за 22 часа ⚡️
>
> Не картинка в фигме — живая страница по ссылке: открывается на телефоне,
> кнопки нажимаются, форма отправляет заявку. Посмотрите и решите, продолжать
> или нет. Без предоплаты и без обязательств.
>
> Как это работает: присылаете задачу или ссылку на действующий сайт — через
> 22 часа получаете ссылку на прототип.
>
> Сайты · Приложения · AI-агенты · Маркетплейсы
>
> DevUz.Studio — пишем код, который приносит деньги 💰
> Написать в ЛС: @DevUz_Studio

## Текст поста · узбекский

> Saytingizning ishlaydigan prototipi — 22 soatda, bepul ⚡️
>
> Figmadagi rasm emas — havola orqali ochiladigan tirik sahifa: telefonda
> ochiladi, tugmalar bosiladi, forma murojaatni yuboradi. Ko‘rib chiqing va
> davom etish-etmaslikni o‘zingiz hal qiling. Oldindan to‘lovsiz, hech qanday
> majburiyatsiz.
>
> Qanday ishlaydi: vazifangizni yoki amaldagi saytingiz havolasini yuborasiz —
> 22 soatdan keyin prototip havolasini olasiz.
>
> Saytlar · Mobil ilovalar · AI agentlar · Marketpleyslar
>
> DevUz.Studio — pul keltiradigan kod yozamiz 💰
> Shaxsiyga yozing: @DevUz_Studio
