# 🆕 Сессия 2026-09-10 — редизайн нижней пилюли (BottomBar) + раздача OTA

Всё в `main` + **роздано `eas update --branch production`** (runtime 1.1.0, iOS+Android). Проблема, которую решали: плавающая нав-пилюля **сливалась на белых экранах** (белая заливка+белая рамка) и **бросалась в глаза на синей Home** (яркое белое кольцо 30%), оттягивая фокус с главной Play-кнопки.

**Сделано (файлы: `src/components/common/BottomBar/BottomBar.jsx` + `.styles.js`, `src/screens/Main/HomeVariants/HomeVariant2.jsx`):**

1. **Мягкая тень + приглушённая обводка** (commit `d05740eb`, OTA `01a08b74`):
   - Добавлен внешний wrapper `menuShadow` (iOS `shadow*`, radius 18) — НЕ клипается `overflow:hidden` пилюли; Android — `elevation:8` на самой пилюле (тень рисуется снаружи даже при overflow hidden). Применяется только когда `!isTransparent`.
   - Дефолтная рамка `#FFFFFF` → нейтральный hairline `rgba(60,60,67,0.12)` (читается на белом).
   - Glass-обводка (Home) смягчена: белое кольцо 30%→`rgba(255,255,255,0.16)` iOS / `0.55` Android.
   - Результат: на белых экранах пилюля лежит на тени, не сливается. **Подтверждено на устройстве — «гораздо лучше».**
2. **Home: непрозрачная пилюля под цвет фона** (commit `3c975578`, OTA `01a08ba3`) — по просьбе Александра («никаких сплошных бело/синих, тока синюю как фон, размеры те же»):
   - Новый проп `BottomBar` **`pillColor`** → опаковая заливка, убирает blur/glass-кольцо (стиль `menuWrapperOpaque`, border 0).
   - HomeVariant2 передаёт `pillColor={gradientColors[последний]}` (нижний цвет градиента активной темы; blue = `#0D5DB8`), иконки белые на цветных/тёмных темах, тёмные на светлых (`isLightBlueTheme ? theme.colors.text : "#FFFFFF"`). Убраны `glass`/`darkOverride`.
   - Пилюля сливается с фоном, держится только на тени → не тянет фокус с Play.

**Также в этих же OTA долетел вчерашний i18n-фикс кнопки «Visa Kom igång igen»** (был не роздан — теперь роздан).

**Проверено по пути:** Play internal — AAB **vc22 (1.1.0)** активен ✅; Android developer verification (`se.byggexp.app`) — **Registrerad** ✅ (дедлайн Google 30.09.2026 нас не касается).

### ⏭️ Следующие шаги

1. **Свериться на устройстве** после 2 перезапусков (Build должен стать `production · 01a08ba3`): Home — насколько чисто пилюля сливается с фоном, читаются ли белые иконки. Если пилюля выходит чуть темнее фона (градиент светлее нижнего цвета у самой пилюли) и хочется точнее — подогнать оттенок `pillColor` (взять цвет чуть светлее `#0D5DB8`, ближе к позиции пилюли).
2. Проверить пилюлю на **других home-темах** (green/orange/black/lightBlue/lightGray) — заливка и контраст иконок.
3. **Отложенная опция (Александр просил «на подумать»):** вариант «сплошная синяя непрозрачная» пилюля как отдельный стиль — сейчас НЕ делаем, выбран «под цвет фона». Если текущий не зайдёт — вернуться.
4. Дальше — незакрытый бэклог ниже (Play vc22 device-QA + shared-компоненты + обед→зарплата + magic-login language + iOS-стиль остальных экранов + dark-theme палитра).

---

# 🆕 Сессия 2026-09-09 — i18n-фикс кнопки «Руководство»

**Сделано (в `main`, коммит на push):**

- Экран **«Руководство»** (`HelpGuideScreen.jsx`): кнопка **«Visa Kom igång igen»** оставалась по-шведски на всех языках — ключ `guide.replayChecklist` отсутствовал в локалях, в коде висел шведский inline-fallback.
- Добавил `guide.replayChecklist` во **все 11 локалей** (`src/i18n/locales/*.json`), ссылаясь на локальный `gettingStartedTitle`. ru → «Показать «Начало работы» снова», sv → «Visa Kom igång igen», en → «Show Getting started again» и т.д.
- Паритет-тест `localeParity.test.js` зелёный (8/8), JSON валиден. Коммит `i18n(guide): localize 'Visa Kom igång igen'…`.

### ⏭️ Следующие шаги

1. **Раздать OTA** — фикс чисто-JS, нужен `eas update --branch production` (runtime 1.1.0). На конец сессии НЕ роздано (нужен `eas login`). До этого на устройстве старая шведская кнопка.
2. Свериться на устройстве после 2 перезапусков: экран «Руководство» полностью на русском (и на др. языках — кнопка переведена).
3. Дальше — незакрытый бэклог из сессии 2026-09-07 ниже (Play vc22 QA + shared-компоненты + обед→зарплата + magic-login language + iOS-стиль остальных экранов).

---

# 🆕 Сессия 2026-09-07 — онбординг/валу-тур, права, verify-фикс, /app/magic, Play-билд

Всё в `main` + роздано `eas update --branch production` (runtime 1.1.0). Бэкенд — auto-deploy на push.

**Валу-тур в приложении (`WelcomeSlides`) — только для роли АДМИН (не для веб-админки!).**

- ВАЖНО: заказ «валу 2 из 6 пунктов» был для **мобилки, роль админа**, НЕ для веб-админки. Я по ошибке сделал в `byggexp-admin` → **откатил** (удалил `features/onboarding/ValueTour.jsx`, коммит `69b2346`). Не повторять. См. память `project_onboarding_value_tour`.
- Admin-слайды: было 3 → стало **6** (Projekt&team / Se personalen i realtid / Tid→lön&faktura / Uppgifter / Foton&kvitton / Ekonomi på autopilot). Копия в i18n `welcome.admin.slide.1..6` (`.title` + `.text`), переведено на **все 11 языков** (localeParity-тест требует ВСЕ локали).
- Отображение: **по 2 блока на экран** (6→3 страницы, `perPage` в `WelcomeSlides.jsx`), только у админа; worker — по одному.
- По просьбе: короткий `.title` НЕ показываем — только `.text` в стиле заголовка (`text = t(.text) || t(.title)`), шрифт **обычный, не жирный** (`title`/`pairTitle` weight 400).
- Seen-key поднят до `welcome-slides-seen-v5` (показать один раз заново).
- en-правка: «Job photos» → «Photo reports» (`welcome.worker.slide.4.title`).

**HomeOnboarding «Kom igång» — фокус-иерархия (память `feedback_focus_hierarchy`).**

- Принцип Александра: на экране ОДИН главный фокус, остальное подчинено; конкурирующие фокусы = «сломано».
- Шаг 1 (`needsFocus`): показываем ТОЛЬКО вопрос + 2 кнопки выбора (чек-лист скрыт, пока направление не выбрано). Заголовок: «Kom igång» маленьким серым eyebrow + вопрос большим. Все шрифты на карточке ОДНОГО размера 16 (`focusText`), кнопки чуть крупнее.
- Шаг 2 (чек-лист после выбора): заголовок «Kom igång» убран, только прогресс «X av Y klara».

**Чат-лист:** карточки людей теперь **3 строки** как в Employees (имя+бейдж / превью / проект). Логику проекта вынес в общий `src/utils/personProjectLabel.js` (используется в EmployeesScreen + ChatListScreen).

**Ekonomi-экраны:** убраны подзаголовки «Details»/«New article» (Clients/Articles) и блок **Unit** в Articles (дефолт `st`).

**Права: project-админ может создавать проекты.** `canCreateProjects` → `MANAGEMENT_ROLES` (все, кроме worker); бэкенд `@Roles` на `POST /projects` + ProjectAdmin (коммит `0d6527b`); тест обновлён.

**Access-denied «Go back» был НЕвидим** (стиль `backButton` использовал несуществующий `c.primary` → прозрачный фон). Фикс: синяя кнопка-пилюля на `c.accent`.

**Verify-email идемпотентность vs предпросмотр писем (память `reference_email_link_preview_consumes_tokens`).**

- Баг «Verification failed»: Apple Mail/Outlook **пре-фетчат GET-ссылку** для превью → съедали одноразовый токен до тапа юзера. Фикс (`users.service.ts` `verifyEmailByToken`, коммит `3f565e4`): НЕ обнулять `emailVerificationToken` при верификации — жив до истечения (7 дней). Безопасность на коротком magic-коде (15 мин).
- Гоча: ссылка, уже съеденная превью ДО фикса, мертва → пересоздать инвайт (Resend).

**Страница `/app/magic` (десктоп/нет приложения):** убрал бесполезную кнопку «Öppna appen» (deep-link `byggexp://` не работает вне телефона; на телефоне Universal Link открывает приложение сам). Осталось: 2 store-кнопки, radius 16 (как карточка), не жирный текст. Коммиты `216674c`/`bbbe70d`/`b3dd6f6`.

**Shifts (Arbetspass):** не гасить календарь при каждом входе. `useShiftHistory` на фокусе делает `setLoading(true)` → раньше прятался весь экран за спиннером («пусто, потом появилось»). Теперь спиннер только на ПЕРВОЙ загрузке (`loading && !days.length`), календарь остаётся при повторных входах (коммит `fdca37c3`).

**Google Play билд — ГОТОВ ✅:**

- Профили: `preview` = APK (только sideload), **`production` = AAB** (`app-bundle`) → Play; `eas.json` submit.production.track = **internal**.
- Команды: `eas build -p android --profile production` затем `eas submit -p android --profile production` (или `--auto-submit`).
- Билд **`5193293e` собран** (version code **22**, commit `fdca37c3`). AAB: `https://expo.dev/artifacts/eas/LqQ4DFNo2tlOj3xpmQchvRkSySxRVBcndYAKZ7UJT-g.aab`. Версии бампнуты → коммит `602d3dfe` (Android vc22 / iOS build 179).
- Submit: `eas submit -p android --profile production` → «Select a build from EAS» → **vc22 (`5193293e`)**, НЕ старый vc21 (`e27d4ce3`). На конец сессии завершение submit НЕ подтверждено — проверить в Play Console.

## ⏭️ Следующие шаги (продолжить здесь)

1. **Подтвердить, что AAB vc22 (`5193293e`) залит в Play → internal testing** (Play Console). Если нет — `eas submit -p android --profile production`, выбрать vc22.
2. Поставить internal-билд на телефон, прогнать: онбординг (worker+admin), валу-тур (6 слайдов, 2/экран, текст не жирный), создание проекта под **project-админом**, verify-инвайт (переслать СВЕЖИЙ — старые ссылки мертвы), Shifts (без пустого мелькания), `/app/magic` на десктопе (2 store-кнопки, без «Öppna appen»).
3. Свериться визуально на устройстве после **2 перезапусков** (OTA, runtime 1.1.0).
4. Бэклог (из прошлых сессий, ещё не сделано): shared-компоненты (FieldRow/Card/Divider в ui, миграция экранов), обед → вычет в часах/зарплате (hours.service + payroll + тесты), «Skapa uppgift» объединить назначение в один мультиселект, magic-login не возвращает `user.language`, миграция остальных экранов на iOS-стиль, локализация инлайновых дефолтов, вход админом для само-сверки, dark-theme iOS-палитра.

---

# Сессия 2026-09-06 (вечер) — iOS-редизайн UI + мелкие фичи (всё в OTA, runtime 1.1.0)

Большой заход по «сделать как в iOS 1:1» + мелкие фичи. Всё в `main` + роздано `eas update --branch production`. Само-сверка: поднимал **expo web** (`npx expo start --web`, порт 8081) + Chrome (mcp) и скриншотил сам; Chrome автозаполнил сохранённый логин `svbyggmaleri@gmail.com` — но это **Arbetare (worker)**, админ-экраны (Skapa projekt/Anställd) с него недоступны → для их само-сверки нужен ВХОД АДМИНОМ.

**Палитра/типографика (Apple 1:1):** iOS system colours в `theme.content` (light): label `#000`, secondaryLabel `#6C6C70`, systemGray `#8E8E93`, bg `#F2F2F7`, cards `#FFFFFF`, separator `#C6C6C8`, systemBlue `#007AFF`; border смягчён до `#E5E5EA`. Switch → зелёный `#34C759`. Шрифт → системный **SF** (`fontFamily: "System"` в themes.js + App.js). Спек-таблица в памяти: `reference_ios_palette.md`.

**Иконки:** новый `AppIcon` (react-native-feather поверх react-native-svg) — тонкий штрих 1.5, синие, БЕЗ пилюли-бейджа (`primaryIconBadge`→transparent). Размер 28. **Важный баг-паттерн:** локальные `FieldIcon` рендерили белый глиф на прозрачном бейдже → невидимо; чинил переводом на AppIcon.

**Меню:** сворачиваемые категории (Projekt&arbete / Ekonomi / Inställningar / Information / Support), Ekonomi раскрывает регистры (Offerter/Fakturor/Klienter/Artiklar/Företagsuppgifter, Offerter/Fakturor → EconomyScreen с параметром `mode`). Строки: Feather-глиф 28, инсет-разделители (от текста), заголовки групп bold 22 + синий шеврон.

**Skapa projekt:** Ekonomi/Avtal/Arbetspass вынесены в строки-переходы → внутренние шиты (Modal, стейт в форме). Arbetspass: инлайн-редактирование (компактный time-picker + пилюли), тумблер убран (смена вкл по умолч. 07–16), обед (Lunchavdrag) 0/30/60 дефолт 60, маргинал 0/30 дефолт 30. Инсет-разделители через дочернюю линию (rowSep 16 / rowSepIcon 58) — НЕ marginLeft на строку (иначе overflow/сдвиг).

**Общий `ScreenHeader`** (`components/common/ScreenHeader`) для шитов; **Card** ui → белый без рамки r10; **SectionTitle/FieldInput** лейблы поправлены.

**Anställd/Verktyg:** иконки видны (AppIcon), инсет-разделители в обеих карточках, заголовки рядов заметнее (#6C6C70/600), верхняя карточка получила иконки в рядах; project=folder (отдельно от briefcase/tool); Anteckningar = стандартная высота.

**Язык:** метки на шведском, БЕЗ кириллицы (Ryska/Ukrainska/Bosniska…); + Spanska/Portugisiska/Franska в конце (фолбэк на английский, бандлов нет).

**Guide:** кнопка **«Visa Kom igång igen»** (сброс `home-onboarding-dismissed` + событие `home-onboarding:reopen`) рядом с «Visa introduktionen igen». Само-проверил на web (worker): скрыл→Guide→кнопка→чеклист вернулся ✅.

**Обед в бэкенде:** `shiftSchedule.lunchMinutes` (default 60) добавлен в схему+DTO (ByggExp-BackEnd, авто-деплой). ⚠️ **Вычет из часов/зарплаты НЕ реализован** — поле только сохраняется.

### ⏭️ СЛЕДУЮЩИЕ ШАГИ (эта сессия)

1. **РЕФАКТОРИНГ (главное, обсудили):** сейчас `FieldIcon` дублируется ×4, `PlainFormRow`/`SelectRow` ×2, стили `groupCard/rowSep/rowSepIcon/fieldLabel` скопированы в каждый `.styles.js`. Сделать ОДИН общий набор в `components/common/ui` — `GroupCard`(=Card), `FieldRow`/`SelectRow` (иконка+заголовок+значение/инпут+шеврон+инсет-divider), `Divider` — и мигрировать ВСЕ экраны, удалив локальные копии. Это устранит дрейф/баги.
2. **Обед → вычет часов/зарплаты** — `hours.service` + `payroll-math` в backend + тесты + паритет с админкой (сейчас поле лежит, но не вычитается). Осторожно (payroll).
3. **Skapa uppgift: слить назначение в 1 мультивыбор-ячейку** — дефолт вся команда, выбрать 1+ (сейчас 2 взаимоисключающие ячейки personalTaskUser/assignToLabel; учесть worker-flow + submit `assigneeUserId` vs `assigneeIds`).
4. **magic-login не отдаёт `user.language`** — `generateTokens` в backend не кладёт language → на входе по ссылке админ-язык не применяется.
5. **Экраны ещё не под общий iOS-стиль:** Skapa uppgift, Shifts, EmployeeProfile, Clients, Artiklar, ChatList, CompanyDetails, Dokument, MyAccount.
6. **Локализовать инлайн-дефолты** в 11 языков: `economy.registers`("Register"), `createProject.workHoursShort`("Arbetspass"), `createProject.lunchDeduction`("Lunchavdrag"), `guide.replayChecklist`.
7. **Само-сверка админ-экранов:** нужен вход админом в expo web (worker-аккаунт не видит их).
8. Тёмная тема iOS-палитры (сейчас захардкожены light-значения в меню/шитах).

---

# 🆕 Сессия 2026-09-06 (день) — фиксы после теста на устройстве (всё в OTA, runtime 1.1.0)

Диагностика с реального iPhone (idevicesyslog/idevicecrashreport через libimobiledevice; Developer Mode на телефоне ВЫКЛ, поэтому devicectl к процессам не пускает). iOS уже LIVE в App Store (ByggExp, by Alexander Gerhard).

**Сделано (все запушено в `main` + роздано `eas update --branch production`):**

1. **Верификация приглашённого юзера — идемпотентность** (backend `ByggExp-BackEnd/src/users/users.service.ts` `verifyEmailByToken`, commit `f9eaa26`). Было: «Verification failed / Invalid or expired» даже на свежей ссылке, если аккаунт уже Active (resendInvite даёт новый токен, но не сбрасывает статус, а запрос требовал `WaitingForApproval`). Стало: матч по токену+сроку без привязки к статусу; одноразовость сохранена. **Backend auto-deploy** на api.byggexp.se (НЕ OTA).
2. **Онбординг per-user** (mobile, commits `dff2471`+`50b8905`). Флаги value-тура/«Kom igång» были на устройство → новый юзер на затёртом телефоне онбординга не видел. Добавлен `resetOnboardingForNewUser(userId)` в `src/utils/onboardingStorage.js`, дёргается из `AuthContext.applyAuthSession` (новый id → сброс флагов; тот же id → прогресс сохраняется). Тест `onboardingStorage.test.js` 5/5. WelcomeSlides SEEN-ключ вынесен в onboardingStorage.
3. **Кнопка «назад»** на Articles/Clients/CompanyDetails (commit `b416e99`). Было `<BackButton />` без `iconSource`/`onPress` → пустой кружок, не работала. Подключены `goBack()` + стрелка.
4. **Языки в переключателе → шведские названия, БЕЗ кириллицы/эндонимов/транслита** (commits `b416e99`, `69d406c`). Итог: Svenska, Bosniska / Kroatiska / Serbiska, Engelska, Estniska, Finska, Lettiska, Litauiska, Norska, Polska, **Ryska**, **Ukrainska** (Swedish-first + алфавит). Mobile `src/i18n/index.js` + `CreateEmployeeScreen.LANGUAGE_OPTIONS`. Admin уже был на шведском — не трогали. (Alexander жёстко: никакого «Русский»/«Russkij».)
5. **Ekonomi UX — регистры в шапку** (commit `886027a`). Клиенты/Артикулы/Данные компании убраны из-под таба «Предложения/Счета» (читались как фильтры оферт) → в кнопку **«•••»** справа в шапке → шит «Register». `EconomyScreen.jsx`.
6. **Home — убраны лишние ссылки** «Показать смены»/«Показать задачи» из пустых карточек (дублировали «Показать все»). `ShiftHistoryPreview.jsx`, `TasksPreview.jsx` (commit `1588dee`).

### ⏭️ СЛЕДУЮЩИЕ ШАГИ (эта сессия)

1. **ПРОВЕРИТЬ НА УСТРОЙСТВЕ** — OTA применяется со 2-го запуска: закрыть-открыть приложение дважды, потом тестить. Проверить: back-кнопки, онбординг у нового юзера, шведские лейблы языков, «•••» в Финансах.
2. **Локализовать заголовок шита «Register»** — сейчас inline-дефолт `t("economy.registers","Register")` (одинаково на всех языках). Добавить ключ `economy.registers` во ВСЕ 11 locale-JSON (иначе parity-чек упадёт) + шведский/переводы.
3. **magic-login не отдаёт `user.language`** (backend `generateTokens` возвращает role/companyId, но не language) → на входе по ссылке админский язык не применяется, падает на устройство/сохранённый. Починить: добавить `language` в объект user в `generateTokens` + убедиться, что `applyServerLanguage` его подхватывает. НЕ начато.
4. **«Серый таб ›» на левом крае** — в нашем коде НЕ найден; вероятно системная плашка iOS «вернуться в предыдущее приложение» (открывал по ссылке из Mail/Safari). Проверить: запуск с иконки → должна пропасть. Если нет — копать дальше.
5. Хвосты из прошлой сессии (маркетинг-копия 11 языков, пульс-хинт, нативные билды+сабмит для Universal Links, локализация пушей) — см. ниже.

---

# Рабочий лог — сессия 2026-09-02/03

Мобильное приложение ByggExp (Expo/React Native). Всё закоммичено в `main`, если не помечено WIP. Правки **чисто JS** → раздаются через **OTA** (см. ниже).

## 🌍 Мультиязычность — 11 языков (2026-09-05, все 3 репо) — ГОТОВО, в проде/OTA

Языки: **sv, en, no, pl, uk, ru, fi, et, lt, lv, bs** (11). `bs` = BCS (босн/серб/хорв), один пункт латиницей, метка **«Bosniska / Kroatiska / Serbiska»** (шведская группировка BKS), admin antd-локаль = `hr_HR`. Переводы делали параллельные суб-агенты (14 для 10 языков + 2 для bs), parity 100%.

**Порядок в переключателе:** Swedish-first, дальше по алфавиту метки. Кириллические эндонимы показаны латиницей (**Ukrainska, Russkij**) — список единообразно латиницей.

**Архитектура «язык на пользователе»:** админ при инвайте выбирает язык юзера → сохраняется на юзере → определяет язык его писем + дефолт приложения (пока юзер сам не сменит).

- **Backend** (`ByggExp-BackEnd`): `src/common/language.ts` (`SUPPORTED_LANGS`, `languageCode()`); все per-user письма (invite/reset/login-code/company-invite) берут `user.language`, копия в `src/mail/email-copy.ts` (+ GREETING_FALLBACK/COMPANY_FALLBACK); `resolveMailLang` (no→nb); `getRoleLabel(role, lang)` локализован. **Письма ЗАКАЗЧИКУ (Swedish-first):** company-verification (шаг 1) + trial-welcome — ЖЁСТКО шведские (первое касание); company-invite = по `company.country` (SE→sv).
- **Admin** (`byggexp-admin`): селект языка в `UserCreateForm` (хранит `{код: имя}`); словари `messages/<code>.js` (по 1610 ключей, keyed по англ-строке) + `messages.js` + `LanguageProvider` (antd + `SUPPORTED_LANGS`) + переключатель в `DashboardHeader`. Норв. код = `nb`.
- **Mobile**: `applyServerLanguage(user.language)` в `AuthContext` (приоритет: выбор юзера > язык от админа > sv); `locales/<code>.json` (по 1180 ключей, parity ✓, lazy-load) + `localeLoaders`/`SUPPORTED_LANGUAGES` в `src/i18n/index.js`; пикер языка в `CreateEmployeeScreen`. Норв. код = `no` (бэк маппит no→nb).

**Проверки:** mobile parity 11×1180 ✓ compile ✓ jest 326/326 ✓; admin словари 1610×0-расхождений ✓ build ✓ eslint ✓; backend tsc ✓.

### 🔧 Прочие фиксы этой сессии (в OTA)

- **Ekonomi — постоянный вход к регистрам:** экраны Clients/Articles/CompanyDetails существовали и работали, но открывались ТОЛЬКО из онбординг-чеклиста. Добавлен ряд быстрых кнопок на `EconomyScreen` (Klienter · Artiklar · Företagsuppgifter), переиспользуя `clientForm.title`/`articleForm.title`/`companyDetails.title`.

### ⏭️ СЛЕДУЮЩИЕ ШАГИ (чтобы продолжить, а не начинать заново)

1. **Маркетинг-копия «11 языков»** (НЕ начато) — тексты для App Store / Google Play (What's New) + блок на лендинг (`byggexp-lp-react`) + пост, на sv+en. УТП для шведского стройрынка с мигрантами.
2. **Пульс-хинт на Home** (НЕ начато) — шаг «Välj projekt» в «Kom igång» подсвечивает реальную кнопку `Välj eller skapa projekt` (Animated-пульс, без reanimated), а не просто переходит. Дозакрыть онбординг.
3. **Нативные билды + сабмит** (НЕ начато, нужен юзер) — `eas build -p all --profile production` → `eas submit`. Разблокирует: 11 языков/шведский с первого запуска у НОВЫХ установок + активацию **Universal Links** (код готов; нужен ENV на сервере: `APPLE_TEAM_ID=33667XUA76`, `ANDROID_SHA256=…` см. раздел Universal Links ниже + pm2 restart). Билд длинный/по квоте — юзер даёт «го» на `eas build`.
4. **Пуш-уведомления НЕ локализованы** (гэп, НЕ начато) — `notifications.service.ts` шлёт захардкоженный текст (напр. `"You are outside the project area"`). Локализовать по `user.language` (как письма) — task-assign, hours-reminder, geofence-exit. Дозакрывает мультиязычность.
5. **Ревью переводов носителями** (опц.) — агентские переводы структурно чисты (плейсхолдеры/parity ✓), но нюансы pl/uk/ru/fi/bs стоит вычитать перед широким пушем.
6. **Арабский + RTL** (стратегич., большой) — крупнейшая мигрант-группа; требует RTL-верстки (зеркалирование), не только перевода. Румынский/турецкий юзер отклонил.
7. **Онбординг-воронка** — оставлена как есть (данные n=2, ждём трафик). Считает по компаниям, не по ролям; при желании — срез worker/admin (события роль хранят).

### 📌 Как добавить ещё язык (чек-лист)

- Mobile: `locales/<code>.json` (полный parity) → `localeLoaders` + `SUPPORTED_LANGUAGES` в `src/i18n/index.js`; метка в `CreateEmployeeScreen.LANGUAGE_OPTIONS`. Норв.=`no`.
- Admin: `messages/<code>.js` → `messages.js` + `LanguageProvider` (antd-локаль + `SUPPORTED_LANGS`) + `DashboardHeader` + `UserCreateForm.LANGUAGE_OPTIONS`. Норв.=`nb`.
- Backend: `email-copy.ts` (MailLang/MAIL_LANGS + 4 copy-мапы + GREETING/COMPANY_FALLBACK), `common/language.ts` SUPPORTED_LANGS, `getRoleLabel`. DeepL-сервис есть (`translation.service.ts`, нужен `DEEPL_API_KEY`) — можно для машинного прогона.
- Переводы: удобно фан-аутить суб-агентами (по языку), потом `yarn test:i18n` (mobile) + node-сверка ключей (admin).

---

## 🆕 Сессия 2026-09-05 — value-тур v5, тап-00:00, гайды часов, success-зелёный, шведские письма (всё в OTA)

Всё чисто-JS (кроме бэкенд-писем) → раздано `eas update --branch production`. Куча мелких OTA за сессию.

**Value-тур (`WelcomeSlides`) — большой редизайн под фидбек Натальи «чище/меньше элементов»:**

- **Стиль слайда:** убран круг-медальон из SVG (`valueIllustrations.js` — сняты 2 фоновых `<circle>`, белым фигурам добавлена тонкая обводка `#E3ECF7`), убрана белая карточка (`card` → прозрачная), фон посветлён (`#f5f9fe→#eaf2fb`). Иллюстрация **+30%** (317×244, `hero` height 248).
- **Контент = одно предложение-выгода КАК ЗАГОЛОВОК** (title-стиль), без мелкого заголовка, без текста-подписи, **без зелёных буллетов**. Рендер: `item.features?bullets : item.text?text : null` — но и worker, и admin теперь только title.
- **worker = 4 слайда** (было 3): Tid / Missa inget / **Projekt (отдельный слайд, своя иллюстрация `projects`)** / Foto+kvittoskanning. Тексты 1:1 из копий юзера (шведский), чек чеков = «kvitton skannas in i systemet».
- **admin = 3 слайда** в том же стиле (одно предложение-заголовок каждый).
- **Тур можно открыть снова:** `openWelcomeTour()` (DeviceEventEmitter, экспортится из WelcomeSlides) + кнопка **«Visa introduktionen igen»** в Guide (HelpGuideScreen). i18n `guide.replayTour`.

**Барабан часов — discoverability (было в открытых пунктах, теперь сделано):**

- **Тап по крупному 00:00 (Timer) на Home → открывает барабан** (`HomeVariant2.jsx`: Timer обёрнут в `TouchableOpacity` → `handleEnterEditHours`). Раньше только через скрытую вторичную кнопку. i18n `home.tapToEnterHours`.
- **Проходные экраны-гайды в онбординге** (`HomeOnboarding`): при выборе «Fyll i timmar» и «I Arbetspass» показывается 3-шаговый гайд ВНУТРИ того же bottom-sheet (свап контента, `guide` = null|"manual"|"shifts"), потом кнопка «Öppna nu»/«Öppna Arbetspass». Ключи `onboarding.manualGuide.*` / `onboarding.shiftsGuide.*`. Текст барабана ссылается на «den stora klockan 00:00 (eller tiden som visas)» — т.к. по GPS может быть не 00:00.

**Success-зелёный — унификация (фидбек «один и тот же цвет для одного правила»):**

- Галочка выполненного шага в «Kom igång» + текст «Klar» + буллеты welcome → все на **success-зелёном из попапа создания проекта** = `successPopupIconColor` (`rgb(69,179,107)`), а done-кружок в **мягком** стиле: фон `successPopupIconBackground` (rgba .18) + зелёная галочка (как SuccessPopupIcon). Не синий accent.

**Прочее:**

- **Поиск проектов** (`ProjectsScreen`) скрыт, пока проектов не > 10.
- **Шведские письма (бэкенд `ByggExp-BackEnd/src/mail/mail.service.ts`):** reset-password и login-code были захардкожены на английском → локализованы (sv дефолт, nb/en; `resolveMailLang`). Запушено на api.byggexp.se (авто-деплой), НЕ через OTA.

**ОТКРЫТО после этой сессии:** зелёные check-badge внутри самих SVG-иллюстраций всё ещё `#34C759` (не тронуты, отличаются от rgb(69,179,107) буллетов — при желании унифицировать). Рефакторинг value-тура/онбординга — по запросу.

---

## 🚀 OTA — как раздавать изменения (ГЛАВНОЕ)

Залогинен в EAS как `alexgeho` (сессия сохранена в `~/.expo`). Публикация:

```
eas update --branch production --message "что изменил"
```

- Канал `production` → долетает до **всех живых сборок** (iOS build 173, Android 18/19), runtime `1.1.0`. Отдельно «только мне» на этом канале нельзя.
- На телефоне: **полностью закрыть приложение и открыть 2 раза** (1-й — качает в фоне, 2-й — применяет).
- Уже опубликовано несколько OTA за сессию (Customize, тёмная тема, дефолты, фиксы баров).

## 🔢 Версии сборок — ВАЖНО (было сломано, починено)

`appVersionSource` переключён с `remote` на **`local`** (`eas.json`), т.к. remote пинил iOS на 1.0.0 (App Store закрыл этот поезд) и игнорил app.json. Теперь версия из `app.json`:

- `version: 1.1.0`, `ios.buildNumber: 177`, `android.versionCode: 20` (выше живых 173/19).
- `eas build -p ios --profile production` → выйдет **1.1.0 (177+)**, свежий поезд, `eas submit -p ios --latest` пройдёт. **Старые .ipa 1.0.0 не заливать** (Transporter будет падать 409).
- `autoIncrement` в профилях сам поднимает номера.

## ✅ Что сделано (коммиты в main)

### Дефолты нового пользователя (первый запуск)

- **Язык** шведский (`src/i18n/index.js`), **тема** синяя (`ThemeContext.jsx`, уже было).
- **Роль-дефолты кнопок** (`src/constants/mainButtons.js` → `getDefaultEnabledButtons/Sections(role)`): **worker** = Play+Camera, Shifts+Tasks, Project Files; **admin** = всё. Применяется в HomeVariant2 / MainButtonsGrid / CustomizeHomeScreen. Меняется только первый запуск.

### Customize-drawer (тёмная тема, под Figma)

- Пилюли `#3A73F0` / `#484848@40%`+бордер `#595959`, белый текст 17px, иконки 20px, кружки тем 44px.
- **Drag-to-reorder** 6-точечным хэндлом ⣿ — компонент `src/screens/Menu/DraggablePillList.jsx` (gesture-handler+Animated, без reanimated).
- **Заголовки-разделители типов:** `Runda knappar` (селектор круглой) → `Knappar` (сетка) → `Block` (карточки). Лейбл hours одним словом: **Timmar** (`home.secondaryHours`).

### Тёмная тема — свип ~30 экранов

Захардкоженные светлые цвета → токены `theme.content.*` (`surfaceMuted`/`border`/`divider`/`inputSurface`/`textMuted`). Экраны: Shifts, Schedule, Chats, Projects, Camera, create-формы, About/Legal/Help/ReportBug/Notifications, Employees, Documents, Language, EmployeeProfile, ChatList, Tools, Economy. Белый текст/иконки на цветном, тема-тернарники, BackButton/BottomBar-«стекло» — намеренно не трогали.

### Android + баг-фиксы

- Клавиатура больше не перекрывает поля (Register/Forgot/CodeLogin/RegisterVerify → `behavior="height"`).
- **Нижний бар над системным навбаром** Android (`BottomBar.jsx`, `insets.bottom+12`; iOS без изменений).
- **Контент не уходит под плавающий бар** на Home (`HomeVariant2.jsx`, `bottomBarClearance`) — фидбек Натальи «меню налазит на tasks».
- Тест `shiftAutoTransition.test.js` под метаданные аудита → **326/326 зелёные**.

### Логотип, онбординг, полировка (всё в OTA)

- **Лого** больше не пикселит: `logo-byggexp.png` (2 КБ) заменён на текст-вордмарк `src/components/common/ByggExpWordmark/` — BYGGEXP, DM Sans Bold, `#0785F4` (бренд из Figma = BYGGEXP; Framer-лендинг BYGGHUB — отдельная история). На LoaderScreen + LoginScreen.
- **Онбординг «Kom igång» — роль-зависимый чек-лист** на Home: `HomeOnboarding` + `useOnboardingProgress({role})` + `onboardingStorage`.
  - **admin**: create project → invite team → start shift (данные projectService/userService/shiftService).
  - **worker**: Tillåt plats → Starta pass → Slå på notiser (expo-location/notifications permissions + shiftService).
  - Авто-галочки, прогресс, dismiss, прячется когда done. i18n `onboarding.*`.
- **Welcome-слайды** — `src/components/common/WelcomeSlides/`, 3 брендовых слайда при 1-м запуске, флаг в AsyncStorage, смонтирован в App.js поверх навигатора.
- **Priming разрешений** — уже было: `LocationConsentBootstrap` + `NotificationBootstrap` в App.js (проактивно); worker-чеклист ещё и линкует на `LocationConsent`/`NotificationsSettings`.
- **Пустое состояние смен** — `ShiftHistoryPreview`: иконка + «Visa arbetspass →» CTA вместо голого текста.
- **Обрезка длинных подписей** в Customize пофикшена (`adjustsFontSizeToFit` + `minimumFontScale` в DraggablePillList/secondary).
- ⚠️ НЕ делали: floating-тултип на кнопке Play (избыточно — действие подсвечено чеклистом+слайдом+CTA; coachmark хрупкий). Можно инлайн-хинт по запросу.

### Онбординг v2 — роль-слайды + аналитика (2026-09-04, в OTA)

- **Value-слайды теперь роль-зависимые и ПОСЛЕ логина** (`WelcomeSlides.jsx`): роль есть только после входа. worker (2 слайда: one-tap in/out, foto/uppgifter/chat) vs admin (2: projekt+team+GPS, ekonomi+anpassning). Копия в i18n `welcome.<worker|admin>.slide.*`. Ключ `welcome-slides-seen-v2` → показ 1 раз всем заново.
- **Аналитика онбординга** — новый `src/utils/analytics.js` (зеркало админского `shared/analytics.js`): буфер → `POST /analytics/events` (бэк сам ставит user/company/role из JWT), `trackOnce` через AsyncStorage, флаш по AppState. Бэк-эндпоинт уже существовал + есть funnel-репорт `GET /analytics/onboarding/funnel` (superadmin).
- **События:** welcome_started/slide_viewed/completed/skipped; onboarding_step_clicked/step_completed/completed/dismissed. Видно, где отваливаются worker vs admin.
- Отклонено из референса (B2C-воронка Puffcount): survey «сколько сотрудников», social-proof, paywall — не наша B2B-модель.

### Онбординг v3 (2026-09-04, всё в OTA, runtime 1.1.0)

- **Value-тур** (`WelcomeSlides`, после логина, ключ `welcome-slides-seen-v4`): worker 3 экрана, admin 3 экрана, списки выгод, SVG-иллюстрации (`valueIllustrations.js`: worker/tasks/photos/adminTeam/adminEconomy). Стиль = **логин** (светлый градиент #eaf2fb→#dce9f6, белая карточка + синяя плашка под иллюстрацию, навы #052d50, кнопка #3183ff).
- **Kom igång карточка** (`HomeOnboarding`, 90% непрозр.): worker 4 шага (Välj projekt → Rapportera tid[шит: GPS/Fyll timmar/Arbetspass] → Fyll profil → Anpassa startsidan); admin project/team/shift + кнопка оферта/фактура. Роль-детект в `useOnboardingProgress` (+ `selectedProjectId`, `userId`).
- **Фикс:** worker «Välj projekt» = done только при выбранном `selectedProjectId` (было по getMyProjects → ложный Klar → «Välj ett projekt innan du loggar timmar»).
- Прочее в OTA: вектор-лого (`ByggExpWordmark`→SvgXml, навы #052D50), email-лого навы 900×115, worker роль скрыта на Mitt konto, письмо-инвайт без пароля, Android intent package `se.byggexp.app`, web-admin ссылка только админам на reset-success.

### Онбординг v4 + Economy-экраны (2026-09-04 вечер, всё в OTA)

**Value-тур (`WelcomeSlides`) — стиль ЛОГИНА (светлый):** градиент #eaf2fb→#dce9f6, белая карточка, навы #052d50, кнопка #3183ff. Иллюстрации на **светлом медальоне** (без тяжёлой синей плашки), галочки **зелёные** (#34C759), синий только на кнопке. Свайп влево/вправо (`onMomentumScrollEnd`) + назад. worker 3 экрана / admin 3 экрана. Тексты worker — дословно из копий юзера. Ключ показа `welcome-slides-seen-v4`. Иллюстрации: `valueIllustrations.js` (worker/tasks/photos/adminTeam/adminEconomy), рендер-проверка через resvg в scratchpad.

**Kom igång карточка (`HomeOnboarding`):** рамка убрана, 90% непрозр.

- **worker (4):** Välj projekt (done по `selectedProjectId`, НЕ по наличию проектов) → Rapportera tid (шит: GPS/Fyll timmar/Arbetspass) → Fyll profil (done при сохранении Mitt konto) → Anpassa startsidan (done при открытии Customize).
- **admin — ДВА НАПРАВЛЕНИЯ как в вебе** (`focus` в onboardingStorage): вопрос «Vad är viktigast just nu?» →
  - **Hantera projekt och team:** project→team→task→tools
  - **Skicka offert eller faktura:** företagsuppgifter→**klient→artiklar**→offert/faktura
  - переключение фокуса + «Byt fokus»; done по реальным данным.

**Новые мобильные экраны (1:1 с админкой):**

- `CompanyDetailsScreen` (route `CompanyDetails`) — name/org.nr/adress/e-post/telefon → companyService.update.
- `Economy/ArticlesScreen` (route `Articles`) + `services/article.service.js` — name/авто-Art.nr/Moms%(по стране)/Enhet/notes + kontering.
- `Economy/ClientsScreen` (route `Clients`) — все поля веб-визарда (company/private, реквизиты, адрес, контакты, оплата, reverseVAT). Инпуты стабильные (модульный `LabeledInput` — без потери фокуса).

**Баг-фиксы (в OTA/деплой):**

- Тёмная тема: видимость текста через токены на `ShiftsScreen`(Arbetspass), `CreateProjectScreen`, `CreateTaskScreen` (было navy-hardcode → невидимо).
- **Магик-ссылка мигала** — обрабатывалась дважды (getInitialURL + listener); дедуп кода в `MagicLinkHandler`.
- Лого навы (#052D50) на login/loader + подъём над Android-навбаром (safe-area).
- Письмо-инвайт **без пароля**; email-лого навы 900×115.
- Воркеру **скрыта роль** на Mitt konto.
- **Backend:** инвайт на существующий e-mail → сообщение с ролью («…redan registrerad som Företagsadministratör»); reset-success web-admin ссылка только админам; Android intent package `se.byggexp.app`.

### ⏳ ОТКРЫТО / СЛЕД. ШАГИ

- **Тест воркера:** приглашать на СВЕЖИЙ e-mail (НЕ demo@byggexp.se — это админ). demo@byggexp.se всегда войдёт как админ.
- **Не сделано (ждёт «го»):**
  1. Тап по таймеру **00:00 → колесо часов** (сейчас «барабан» только через вторичную круглую кнопку в режиме "hours" = Customize; по умолч. камера).
  2. **Хинты-подсветка в визарде** (Arbetspass «+», где жать) — предлагал баннер+подсветка, не начато.
- **Universal Links активация:** ENV на сервере (`APPLE_TEAM_ID`, `ANDROID_SHA256` — значения в разделе выше) + pm2 restart + новый нативный билд + submit.
- **Нативные билды + submit** в сторы (для свежих установок / App Links). Сейчас всё едет по OTA (runtime 1.1.0).
- **Веб byggexp.expo.app** — юзер сказал забыть/не трогать; OTA туда не идёт (отдельный EAS Hosting). Админку (admin.byggexp.se) НЕ трогать.
- **Geofence:** авто-off по радиусу работает; откат `c22cd737` (re-point на новый проект) НЕ трогаем без «да». iOS bg-локация OFF намеренно (App Store 2.5.4), не включать.
- **Аналитика онбординга:** данные копятся (`POST /analytics/events`), funnel `GET /analytics/onboarding/funnel` (superadmin) — глянуть где отваливаются worker vs admin.

### ⚙️ Инструменты сессии

- SVG→PNG растеризация: `@resvg/resvg-js` установлен в scratchpad (`.../scratchpad`), скрипты `render.mjs` — для проверки/генерации лого и иллюстраций.

## 📋 Фидбек Натальи — статус (все dev-пункты закрыты)

## 📋 Фидбек Натальи — статус (все dev-пункты закрыты)

| Пункт                                         | Статус                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ |
| Нижнее меню налазит на кнопки/tasks           | ✅ Готово, в OTA                                                   |
| Splash/лого пикселит                          | ✅ Готово (текст-вордмарк), в OTA                                  |
| После подтверждения почты не возвращает в апп | ✅ Улучшено (бэкенд, см. ниже); полный авто = Universal Links      |
| Онбординг по шагам                            | ✅ In-app чек-лист «Kom igång» (в OTA) + пользователь делает видео |

## ⏳ Следующие шаги

### 1. Universal Links / App Links — КОД ГОТОВ, нужна активация

Реализовано (app + backend), домен **api.byggexp.se**, путь **/app/magic?code=**:

- **App** (закоммичено): `app.json` → `ios.associatedDomains: ["applinks:api.byggexp.se"]` + `android.intentFilters` (host api.byggexp.se, pathPrefix /app/magic, autoVerify). `MagicLinkHandler.jsx` ловит и https app-link, и `byggexp://`.
- **Backend** (закоммичено, авто-деплой): `app.controller.ts` отдаёт `/.well-known/apple-app-site-association` + `/.well-known/assetlinks.json` из ENV. `auth.controller.ts` → кнопка подтверждения = universal link `/app/magic?code=`; `GET /app/magic` = install/open fallback.

**ЧТОБЫ ЗАРАБОТАЛО (осталось):**

1. **ENV на сервере** api.byggexp.se (оба значения ПОЛУЧЕНЫ), затем pm2 restart:
   ```
   APPLE_TEAM_ID=33667XUA76
   ANDROID_SHA256=4A:54:96:1E:A7:C2:0A:C7:96:E8:5F:56:E1:B7:7C:55:B6:17:DB:5A:03:F9:0D:B8:A2:B3:08:FC:BA:B8:A9:9F,0A:41:A9:37:C0:A4:C2:45:E8:11:AA:3C:79:F1:A5:79:3B:43:C1:2B:BC:A2:86:65:6C:27:AB:7D:4E:85:9C:50
   ```
   (первый SHA-256 = App signing key из Play App Signing; второй = upload key. Оба в assetlinks — не мешает.)
2. **Новый нативный билд + submit** (associatedDomains/intentFilters — нативные): `eas build -p all --profile production` → `eas submit`.
3. Проверить: `curl https://api.byggexp.se/.well-known/apple-app-site-association` (должен вернуть JSON с реальным Team ID), и что nginx не перехватывает `/.well-known/` (ACME использует только `/.well-known/acme-challenge/`, наши пути другие).

Заметка: до нового билда у текущих (старых) юзеров кнопка ведёт на `/app/magic` fallback (лишний тап «Öppna appen») — не регресс, но seamless-open только после билда.

### 2. Спрятать системный навбар Android (immersive)

Пользователь откладывал. Возможно через `expo-navigation-bar` (`setVisibilityAsync("hidden")`) — но не рекомендуется по UX; наш бар уже поднят над системным. Не начато.

### 3. Онбординг — доработки (по желанию)

Mobile-онбординг сделан для обеих ролей (worker + admin чек-листы) + welcome-слайды + пустые состояния — всё в OTA. Остаётся по желанию: floating-тултип на Play (пока не делали), больше пустых состояний (tasks/projects), приветствие до логина. Проверить визуально на СВЕЖЕМ пустом аккаунте (у test5/существующих все шаги done → карточка скрыта).

**Десктоп-онбординг УЖЕ ЕСТЬ** (репо `byggexp-admin`): `src/features/dashboard/OnboardingChecklist.jsx` (309 строк) на дашборде, показывается новым компаниям по умолчанию (`view='open'`), шаги company/team/project + fieldwork/billing, deep-link `?create=1`, collapse/resume-бар. Закоммичено+запушено, auto-deploy `.github/workflows/deploy.yml`. Наталья просила «перенести чеклист в онбординг на десктопе» — **уже сделано**; если не видит — старый деплой/свёрнуто. Дублировать НЕ нужно; при желании только проверить, что live-админка на последней версии.

### Фидбек Натальи (2026-09-03) — ВСЁ ЗАКРЫТО

Онбординг в приложении ✅ (чек-лист), меню/скролл ✅ (её коммент был на вчерашней версии, фикс в OTA), десктоп-онбординг ✅ (уже есть). Черновик ответа ей — в истории чата.

### 4. Новые нативные билды (если нужно в сторы)

`eas build -p ios/android --profile production` → `eas submit`. Нужны только чтобы шведский был с первого открытия у свежих скачиваний; текущим юзерам всё раздаётся по OTA.

## 🔑 Ключевой контекст

- Все живые сборки runtime `1.1.0` → OTA долетает.
- Локальный iOS-запуск: `yarn ios` требует iOS 18.2 (нет) → `npx expo run:ios --device <udid>` на созданном iPhone 16 / iOS 18.5. Локального Android SDK на маке нет (только homebrew adb) — Android только через облако EAS.
- Проверка перед коммитом: `yarn lint && yarn compile && yarn test:i18n && yarn jest`.
- НИКОГДА `expo prebuild` (уничтожит кастомную нативку).
- Android-тест на телефоне: internal test track в Play Console (build 19). adb: `/opt/homebrew/bin/adb`.
