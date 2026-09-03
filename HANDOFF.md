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

## 📋 Фидбек Натальи — статус

| Пункт                                                     | Статус                                      |
| --------------------------------------------------------- | ------------------------------------------- |
| Нижнее меню налазит на кнопки/tasks                       | ✅ Готово, в OTA                            |
| Splash-лого пикселит → SVG                                | ⏳ WIP (см. ниже)                           |
| После подтверждения почты не возвращает в апп (deep-link) | ⏳ не начато (нужен бэкенд + app scheme)    |
| Онбординг по шагам                                        | 🔵 на пользователе (видео + отдельно в апп) |

## ⏳ Следующие шаги

### 1. SVG-логотип (пикселит) — WIP, ЗАБЛОКИРОВАН вопросом бренда

- Пикселит **`src/assets/logo-byggexp.png` (2 КБ)** — вордмарк на `LoaderScreen.jsx` и `LoginScreen.jsx` (не native splash; splash = `icon.png` 1024² норм).
- Начато: `src/assets/byggexpWordmark.js` (WIP, **не закоммичен**) — SVG-вордмарк из `byggexp-admin/src/assets/byggexp-logo.svg`. **Он БЕЛЫЙ** (`fill="white"`) → для светлых экранов перекрасить в нави (заменить `fill="white"`→`#052D50`), рендерить через `SvgXml` из `react-native-svg` (есть, v15), заменить `<Image>` в обоих экранах. Это JS → OTA-able.
- ❗ **БЛОКЕР: бренд BYGGEXP или BYGGHUB?** Framer-лендинг = **BYGGHUB** (webbyrå), приложение/админка = **BYGGEXP**. Пока не решено — какой логотип ставить. Уточнить у пользователя перед доделкой.

### 2. Email deep-link после верификации почты

Нужен бэкенд (ссылка `se.byggexp.app://…` в письме) + обработка scheme в приложении. Не начато.

### 3. Косметика Customize

Длинные шведские подписи обрезаются в узком drawer («Arbetspa…», «Dagsrap…», «Projektfil…»). Варианты: шрифт пилюль 17→15, шире drawer, или короче слова. Не решено.

### 4. Новые нативные билды (если нужно в сторы)

`eas build -p ios/android --profile production` → `eas submit`. Нужны только чтобы шведский был с первого открытия у свежих скачиваний; текущим юзерам всё раздаётся по OTA.

## 🔑 Ключевой контекст

- Все живые сборки runtime `1.1.0` → OTA долетает.
- Локальный iOS-запуск: `yarn ios` требует iOS 18.2 (нет) → `npx expo run:ios --device <udid>` на созданном iPhone 16 / iOS 18.5. Локального Android SDK на маке нет (только homebrew adb) — Android только через облако EAS.
- Проверка перед коммитом: `yarn lint && yarn compile && yarn test:i18n && yarn jest`.
- НИКОГДА `expo prebuild` (уничтожит кастомную нативку).
- Android-тест на телефоне: internal test track в Play Console (build 19). adb: `/opt/homebrew/bin/adb`.
