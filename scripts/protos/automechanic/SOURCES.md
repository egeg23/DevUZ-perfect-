# Фото прототипа AUTOMECHANIC — откуда и на каких условиях

Своих снимков годного размера на automechanic.uz нет (галерея — пресс-фото
чужих машин, их не берём), поэтому в прототипе — открытые снимки Wikimedia
Commons с разрешением на коммерческое использование. Unsplash и Pexels из
этой среды закрыты защитой от ботов. Скачаны 07.10.2026, обработаны
`photos.py`: кадр, вырезка по слоям, цвет. Нейросетью ничего не нарисовано:
машина отделена от фона сегментацией (rembg, isnet-general-use), струя масла —
по цвету, место под ней заполнено cv2.inpaint из соседних пикселей.

| Слой в `public/protos/automechanic/` | Исходный файл на Commons | Автор | Лицензия |
|---|---|---|---|
| `car.webp`, `rim-f.webp`, `rim-r.webp`, иконки `icon-*.png`, `apple-180.png` | [White_BMW_5_Series_F10_side_view.jpg](https://commons.wikimedia.org/w/index.php?curid=147862442) | ReneeWrites | CC BY 4.0 |
| `garage-far.webp`, `deck.webp` | [Car_repair_in_an_auto_shop_with_tools_and_equipment_present_on_the_floor_and_a_partially_disassembled_vehicle_on_a_lift.jpg](https://commons.wikimedia.org/w/index.php?curid=186889546) | Shixart1985 | CC BY 2.0 |
| `post.webp`, `lift.webp` | [Car_lift_in_an_auto_repair_shop_with_vehicles_and_tools_present.jpg](https://commons.wikimedia.org/w/index.php?curid=186889537) | Shixart1985 | CC BY 2.0 |
| `oil-base.webp`, `oil-stream.webp`, `oil-drop.webp` | [Pouring_engine_oil_to_motor.jpg](https://commons.wikimedia.org/w/index.php?curid=51476546) | Santeri Viinamäki | CC BY-SA 4.0 (обработанные слои — на тех же условиях) |
| `s-dvs.webp` | Car_engine_repair_process_taking_place_in_a_garage_during_daylight_with_visible_battery_and_components.jpg | Shixart1985 | CC BY 2.0 |
| `s-hodovaya.webp` | Car_mechanic_worker_repairing_suspension_of_lifted_automobile_at_auto_repair_garage_shop.jpg | Shixart1985 | CC BY 2.0 |
| `s-elektro.webp` | Wires_and_connections_inside_a_vehicle's_electronic_control_unit_during_repair_in_a_garage_setting.jpg | Shixart1985 | CC BY 2.0 |
| `s-diag.webp` | Car_engine_part_shows_details_of_throttle_body_and_surrounding_components_during_a_repair_in_a_garage.jpg | Shixart1985 | CC BY 2.0 |
| `s-meh.webp` | Man_working_on_a_mechanical_part_in_a_garage_while_holding_a_small_metal_nut_in_his_hand.jpg | Shixart1985 | CC BY 2.0 |
| `s-salon.webp` | Mechanic_repairing_car_door_lock_on_concrete_surface_in_garage.jpg | Shixart1985 | CC BY 2.0 |
| `s-svarka.webp` | [TIG-toorts.jpg](https://commons.wikimedia.org/wiki/File:TIG-toorts.jpg) | Erik Wannee | CC0 |
| `s-farkop.webp` | [Tow_hitch_01.jpg](https://commons.wikimedia.org/wiki/File:Tow_hitch_01.jpg) | CosyCobra | CC BY-SA 3.0 |

Снимки «было / стало» (`ba-*.webp`): «было» — веб-архив automechanic.uz от
06.04.2022 (снят через Firecrawl) и сегодняшний automechanic.uz в Chromium
(предупреждение о сертификате и пустая страница), «стало» — этот прототип.

Авторы и лицензии перечислены и на самом прототипе — страница «Что дальше»,
блок «Откуда снимки» (условие CC BY).

Как пересобрать слои: скачать оригиналы с Commons в одну папку под именами
`bmw.jpg`, `garage.jpg`, `lift.jpg`, `oil.jpg`, `s-*.jpg` и запустить
`python3 -I photos.py <папка> ../../../public/protos/automechanic`
(нужны `opencv-python-headless` и `rembg[cpu]`).
