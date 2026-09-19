# ТЗ — задачи и статус (Upgrade 1.1.1, Android-скриншоты)

> Источник: Google Doc «Upgrade 1-1-1» + фидбэк Alexander по скриншотам (2026-09-19).
> Правило: делаю ВСЕ пункты за один заход, сверяюсь с этим файлом, потом OTA. Нерешённый пункт — в конец, но не стопорит остальные.

## Экран Projektadress (LocationPickerModal)

- [x] Кнопку сохранить — синяя галочка в шапке справа (как в Skapa projekt) — OTA
- [x] Выбор радиуса — над картой — OTA
- [x] Скрывать клавиатуру при выборе адреса / касании слайдера / карты — OTA
- [x] Слайдер радиуса не тянулся на Android (убрал сломавший wrapper, вернул прямой Slider) — OTA — ⏳ проверить перетаскивание на устройстве
- [x] Слайдер пропал → восстановил — OTA
- [x] Бегунок (thumb) не виден → белый thumb — OTA (виден на 6259)
- [x] Галочка на разной ВЫСОТЕ (модалка без safe-area) → paddingTop insets.top — OTA
- [x] Галочка РАЗНОГО ЦВЕТА на разных экранах → HeaderCheckButton теперь = theme.colors.primary (как FAB), убрал disabled-затухание на Projektadress — OTA

## Экран Skapa projekt (CreateProject)

- [x] Notes: не виден placeholder (тёмная тема) → placeholderTextColor — OTA
- [x] Notes: «чёрная полоса» = Android underline → underlineColorAndroid="transparent" — OTA
- [x] Notes: ячейку чуть меньше → minHeight 100→64 — OTA
- [x] Имя проекта: при клике авто-адрес очищается — OTA

## Меню / профиль

- [x] У АДМИНА в шапке меню «Sverige Bygg AB» → у companyAdmin имя-строка = РОЛЬ (Företagsadministratör), бейдж прячется если нет профессии — OTA
- [x] Home-счётчики «сверяются с БД» (рефетч на фокусе) — OTA
- [x] Тёмное меню (dark theme) — OTA (раунд 1)
- [x] Бейдж профессии вместо «Arbetare» у воркера — OTA (раунд 1)
- [x] Онбординг: шаг «Anpassa startsidan» админу — OTA

## Разъяснения (НЕ баги кода)

- [i] «Sverige Bygg AB» нигде не захардкожено (грепнул 3 репо) — это `user.name` аккаунта в БД
- [i] Оффер/фактура/клиент в чеклисте отмечены — запросы строго companyId-scoped; данные реально есть на аккаунте `company@byggexp.se`
- [i] «OTA не долетела до Android» — долетела (билд 26 = runtime 1.1.0/production); применяется на перезапуск
- [i] iOS геозона: realtime-push при выходе не приходит — ограничение iOS region-monitoring (foreground safety-net ловит на возврате); фикс = syslog-диагностика / больший радиус (трогает закреплённый конфиг) — открыто

## Раунд 3 (фидбэк 21:20+)

- [x] Онбординг «Bjud in ditt team» не отмечался после добавления сотрудника → `hasTeam` теперь = есть любой юзер компании кроме админа (вкл. приглашённых pending), без требования заполнять все поля — OTA
- [x] Слайдер thumb — белый, чуть выше (transform-скейл откатил: делал овал/клип); реально БОЛЬШЕ thumb = нужен `thumbImage`-ассет (могу добавить)
- [ ] Чёрная линия у notes — в КОДЕ источника нет (ни бордера, ни divider, ни глоб.дефолта); `underlineColorAndroid="transparent"` НЕ срабатывает на Android New-Arch (Fabric) для multiline; OTA с фиксом уже применён, линия осталась → нужен Android ПО КАБЕЛЮ (adb dump дерева вьюх), вслепую не найти

## Раунд 4 (adb-сессия, подтверждено на устройстве)

- [x] Чёрная линия notes — источник = нативный EditText underline (нашёл adb-дампом); фикс = сплошной backgroundColor — ✅ OTA
- [x] Слайдер радиуса **тянется на Android** — заменил @react-native-community/slider на свой `RadiusSlider` (PanResponder, сам захватывает касание) — ✅ ПОДТВЕРЖДЕНО Alexander'ом
- [x] Thumb крупный (44dp) + круговая тень (offset 0,0) — ✅
- [x] Меню: у админа имя (`user.name`) + бейдж профессии как у воркера (откат «роль вместо имени») — ✅ OTA
- [x] Ekonomi (`FieldInput`): крупнее/серая подпись + выровненные 2-колоночные пилюли — ✅ OTA
- [x] `/app/magic` fallback: кнопка + авто «Öppna appen» (deep-link), иначе стор — ✅ backend

## Открытые

- iOS геозона realtime-push при выходе (ограничение iOS region-monitoring) — ждёт решения (syslog / больший радиус)
