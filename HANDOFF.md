# Рабочий лог — сессия 2026-09-02/03

Мобильное приложение ByggExp (Expo/React Native). Всё закоммичено в `main`, если не помечено WIP. Правки **чисто JS** → раздаются через **OTA** (см. ниже).

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

### ⏳ ОТКРЫТО (онбординг)

- **БАГ репорт юзера:** «переустановил — вообще ничего нет». Гипотеза: тестит **веб byggexp.expo.app в Safari** (OTA туда НЕ идёт, нужен отдельный deploy EAS Hosting) ИЛИ старая сборка 1.0 из публичного стора (runtime mismatch). Надо: подтвердить источник (нативный vs веб); если веб — задеплоить веб.
- **Не сделано (ждёт «го»):** тап по таймеру 00:00 → колесо часов (сейчас «барабан» только через вторичную круглую кнопку в режиме "hours", вкл. в Customize — по умолчанию камера); хинты-подсветка в визарде (Arbetspass «+», колесо, вкл. кнопки).
- **Веб-мастер создания проекта** (`byggexp-admin` ProjectCreateForm шаг Team): добавить «+ пригласить воркера по email» (у свежего админа нет воркеров в списке). Не начато.
- Geofence: авто-off по радиусу работает; откат `c22cd737` (re-point на новый проект) — НЕ трогаем без «да». iOS bg-локация OFF намеренно (2.5.4), не включать.

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
