# 🆕 Сессия 2026-09-06 — фиксы после теста на устройстве (всё в OTA, runtime 1.1.0)

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
