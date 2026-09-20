# WORKLOG — единый рабочий файл (задачи, статус, план)

> **Это ЕДИНСТВЕННЫЙ живой рабочий файл.** Сюда: очередь новых задач, статус, следующие шаги. Начинать каждую сессию с чтения этого файла.
> `HANDOFF.md` = архив прошлых сессий (не веду активно). `docs/*` = релизные/тех-доки.
> Правило: новые задачи Alexander СНАЧАЛА пишу в «Очередь» ниже как `[ ]`, потом делаю, отмечаю `[x]`, в конце сверяюсь. Делаю ВСЕ пункты за один заход; нерешённый — в конец, но не стопорит остальные.

## 📥 Очередь (capture ПЕРЕД работой)

> Как только Alexander кидает задачи (текст/скриншоты) — СНАЧАЛА выписываю каждую сюда как `[ ]`, потом делаю. Отмечаю `[x]` по мере готовности. В конце сессии тут не должно остаться `[ ]` без явной пометки почему отложено. Сделанное переношу вниз в раунды.

- [x] Heldag убран ОТОВСЮДУ (строка, стейт, `buildAllDayRange` + мёртвые хелперы, стили, ключи `createTask.allDay*` во всех 11 локалях). Блок Schema = только Börjar/Slutar
- [ ] Создание задачи — остаток сверки с админкой: НЕТ в мобиле `priority` (low/normal/high) и `recurrence` (none/daily/weekdays/weekly/biweekly/monthly), оба поддержаны бэкендом; админка предзаполняет даты сегодня + дефолт 08:00 старт / 17:00 дедлайн

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

## Раунд 5 (фидбэк 23:xx, iPhone по кабелю)

- [x] Удаление проекта: ProjectAdmin получал `[403] Access denied` → бэкенд: добавил ProjectAdmin в `@Roles` на `DELETE /projects/:id` + `assertCanDeleteProject` (ProjectAdmin удаляет только свои: owner/projectManager) — ✅ прод `89280b9` (серверный, без пересборки/OTA)
- [x] Диагностика удаления: on-screen Alert показывает `[status] message` — сработало (скриншот `[403]`). NB: `idevicesyslog` на iOS 26 мёртв (Apple сменила протокол c iOS 17+), релиз режет console.* — логи по кабелю НЕ работают, юзать on-screen диагностику
- [x] Orderreferens: перенёс в ту же карточку, что Projektnamn, строкой под ним, без рамки (floating label + hairline sep) — ✅ OTA `bd0c4e8e`
- [x] Ekonomi «цвет как на создании»: замерил реальные пиксели — лейблы уже были идентичны (#7F7F7F=#000@50%). По выбору Alexander (AskUserQuestion, выбрал ВСЕ 3): лейблы → чёрные, поля → безрамочные, заголовки EKONOMI/AVTAL → чёрные. Через новые пропсы FieldInput `borderless`/`labelStyle` (shared-компонент не сломан) — ✅ OTA `60e55866`
- [x] Anteckning: отступ снизу 28→20 = как у всех блоков (сверху/снизу одинаково) — ✅ OTA `60e55866`
- [i] Процесс: при «сделай цвет как X» — СНАЧАЛА замерять пиксели+код, не на глаз; сохранено в память `feedback_color_match_sample_pixels`

## Раунд 6 (фидбэк 08:36)

- [x] Убрал кнопку «Avtal» на Skapa projekt (Ekonomi теперь единственная строка в блоке) + карточку AVTAL/Avtalsnr из окна Ekonomi; выпилил `ContractSection`, стейт `contractNumber` и его append в submit
- [x] Ekonomi: поля из 2-колоночных пилюль → полноширинные СТРОКИ
- [x] Ekonomi: 3 блока по 2 строки (budget/timmar · planerat/förbrukat material · självkostnad/debiteras)
- [x] Строки = новый `FloatingField` (floating label + hairline sep, безрамочный) — точь-в-точь как Projektnamn/Orderreferens, без звёздочки (не обязательные)
- [i] Заголовок «EKONOMI» внутри убрал — шапка экрана уже «Ekonomi» (дубль)

## Раунд 7 (фидбэк 08:40 — «всё в одном стиле»)

- [x] Anteckningar на Home: пока заметок нет — центрированный пустой стейт с иконкой (`edit-3`) + текст «Skriv en anteckning…», карточка 130px как у Dagsrapport/Uppgifter (был левый инлайн-инпут = выбивался). Инпут остаётся смонтированным (свёрнут), тап по пустому стейту разворачивает и фокусит — OTA `3cd2996a`

## Раунд 8 (инструменты + онбординг, 08:46–09:0x)

- [x] БАГ: создал инструмент → «Verktyg skapat», а в списке пусто. ProjectAdmin в `findAccessible` видел ТОЛЬКО инструменты своих проектов, а у нового инструмента `projectIds` пуст → создатель не видел собственный инструмент. ProjectAdmin и так работает по компании (attach-эндпоинты проверяют только companyId) → скоупим список по companyId как у CompanyAdmin — ✅ прод `530701f`
- [x] БАГ: «Koppla till projekt» и «Koppla till arbetare» пусты. `GET /users/role/:role` = ТОЛЬКО superadmin → 403 для company/projectAdmin, и один `Promise.all` reject обнулял ЗАОДНО и проекты. Теперь `/users/my-company` + фильтр role==='worker', загрузки независимы (`allSettled`) — ✅ OTA `80e73987`
- [x] Сканирование на «Lägg till verktyg»: новая строка «QR-kod» → камера (новый переиспользуемый `QrScannerModal`, вынесен из ToolScanScreen) → отсканированный код сохраняется как `qrId` инструмента; бэкенд принимает `qrId` на create (trim+upper, 409 если код занят), иначе генерит сам. Ключи в 11 языках — ✅ бэкенд `1c85b4f` + OTA `80e73987`
- [x] Онбординг «Anpassa startsidan» отмечался при ПРОСТОМ ОТКРЫТИИ дровера → теперь флаг ставится внутри дровера, когда реально меняешь тему/кнопку/секцию — ✅ OTA `80e73987`
- [i] Остальные галочки (företagsuppgifter / klient / offert-faktura) — НЕ баг кода: все три запроса строго companyId-scoped (проверил clients/offers/invoices `findAccessible`), демо-сидов нет. Значит в компании реально есть orgNumber + ≥1 клиент + ≥1 оффер/фактура (заведены раньше через админку). Если нужно «сделал ли это Я», надо менять сигнал на per-user — спросить Alexander'а

## Открытые / след. шаги

- iOS геозона realtime-push при выходе (ограничение iOS region-monitoring) — ждёт решения (больший радиус трогает закреплённый gps-конфиг; syslog по кабелю на iOS 26 недоступен без pymobiledevice3+tunnel)
- Слайдер радиуса на Android — перетаскивание подтверждено; ⏳ проверить в свежем OTA-билде что не регрессировало
- Ekonomi: те же чёрные-безрамочные стили НЕ применены к экрану деталей проекта (ProjectScreen Ekonomi) — если Alexander захочет консистентности, применить те же пропсы там (call sites ProjectScreen.jsx:706/714, ecoSectionTitle)
- Проверить на устройстве после OTA `60e55866`: Ekonomi (чёрные лейблы/заголовки, без рамок) + равные отступы Anteckning
