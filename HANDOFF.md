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

## 📋 Фидбек Натальи — статус (все dev-пункты закрыты)

| Пункт                                         | Статус                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ |
| Нижнее меню налазит на кнопки/tasks           | ✅ Готово, в OTA                                                   |
| Splash/лого пикселит                          | ✅ Готово (текст-вордмарк), в OTA                                  |
| После подтверждения почты не возвращает в апп | ✅ Улучшено (бэкенд, см. ниже); полный авто = Universal Links      |
| Онбординг по шагам                            | ✅ In-app чек-лист «Kom igång» (в OTA) + пользователь делает видео |

## ⏳ Следующие шаги

### 1. Universal Links / App Links — для ПОЛНОГО авто-возврата из письма

Сейчас email-подтверждение открывает `byggexp://auth/magic?code=…`, но мобильные браузеры блокируют авто-открытие кастомной схемы без тапа. **Уже улучшено** (бэкенд `ByggExp-BackEnd/src/auth/auth.controller.ts` → `magicRedirectHtml`: крупная кнопка «Öppna ByggExp», шведский, отложенный auto-open; задеплоено). Клиент уже ловит ссылку (`src/components/MagicLinkHandler.jsx`, смонтирован в App.js). Для «автоматом без тапа» нужны **Universal Links (iOS)** + **App Links (Android)**: `apple-app-site-association` + `assetlinks.json` на хостинге + associatedDomains/intent-filter в app.json + **новый нативный билд**. Не начато.

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
