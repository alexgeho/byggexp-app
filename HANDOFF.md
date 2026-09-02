# Рабочий лог — сессия 2026-09-02/03

Состояние работы над мобильным приложением ByggExp. Всё закоммичено и запушено в `main`. Изменения **чисто JS** → раздаются через OTA.

## ✅ Что сделано (13 коммитов, все в `main`)

### Дефолты для нового пользователя (первый запуск)

| Что                 | Значение                                                                   | Где в коде                                                                                     |
| ------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Язык**            | Шведский (`sv`)                                                            | `src/i18n/index.js` → `DEFAULT_LANGUAGE = "sv"`                                                |
| **Тема**            | Синяя (`blue`)                                                             | `src/theme/ThemeContext.jsx` → `useState("blue")` (уже было)                                   |
| **Кнопки — worker** | Play + Camera (круглые), Shifts + Tasks (квадратные), Project Files (блок) | `src/constants/mainButtons.js` → `workerDefaultEnabledButtons`, `workerDefaultEnabledSections` |
| **Кнопки — admin**  | Всё включено (полный набор)                                                | `src/constants/mainButtons.js` → `defaultEnabledButtons` (не-worker)                           |

Роле-зависимые дефолты через `getDefaultEnabledButtons(role)` / `getDefaultEnabledSections(role)`; применяются в `HomeVariant2.jsx`, `MainButtonsGrid.jsx`, `CustomizeHomeScreen.jsx`. `getEnabledSections()` теперь возвращает `null` при отсутствии сохранённого — UI подставляет роль-дефолт. **Меняется только первый запуск, сохранённые настройки не трогаются.**

### Customize-экран (drawer) — приведён к Figma 1:1 (тёмная тема)

- Пилюли: активная `#3A73F0`, неактивная `#484848 @40%` + бордер `#595959`, текст белый 17px, иконка 20px, высота 52, gap 14.
- Кружки тем 44px, активное кольцо `#3A73F0` 3px. Secondary-пилюли (Camera/Play) — иконка+текст **по центру**.
- **Drag-to-reorder** с 6-точечным хэндлом ⣿ (Figma) вместо стрелок ↑↓ — новый компонент `src/screens/Menu/DraggablePillList.jsx` (на `react-native-gesture-handler` + `Animated`, без reanimated, OTA-safe).
- Figma-нода: file `5DUxYAIucudqDuxoRDoWrC`, drawer node `1957:4822`.

### Тёмная тема — свип по всему приложению (~30 экранов)

Захардкоженные светлые цвета → токены `theme.content.*` (`surfaceMuted` / `border` / `divider` / `inputSurface` / `textMuted`). На светлой теме вид не меняется, тёмная — чинится.

- 1-й свип (26 экранов): Shifts, Schedule, Chats, Projects, Camera, create-формы, About/Legal/Help/ReportBug/Notifications, Employees, Documents, Language.
- 2-й свип: EmployeeProfile, ChatList, Tools, Economy.
- **Намеренно НЕ трогали:** белый текст/иконки/спиннеры на цветных элементах, тема-зависимые тернарники (`colorMode === "light" ? …`), «стекло» в `BackButton`/`BottomBar`, белый кружок-галочка и cancel-кнопка в ChatList.

### Android

- **Фикс клавиатуры:** на Register/Forgot/CodeLogin/RegisterVerify `KeyboardAvoidingView` имел `behavior=undefined` на Android → клавиатура перекрывала поля. Поставили `"height"` (как в рабочем LoginScreen).
- **Локальная сборка Android невозможна** на этом маке — нет полного Android SDK (только `adb` из homebrew). Сборка только через облако EAS.

### Тесты

- `shiftAutoTransition.test.js` — обновлены ожидания под метаданные аудита (`pause/resume` с `{ reason, source }`). **326/326 зелёные.**

## ⏳ Следующие шаги (что осталось)

### 1. Раздать изменения — OTA (быстро, без ревью)

Все правки — JS, долетят до **живых** сборок (iOS build 173 / Android build 18, обе runtime `1.1.0`, channel `production`).

```
eas login                 # интерактивно, в своём терминале (через ! не работает — stdin)
eas update --branch production --message "customize Figma + dark theme + role defaults + sv default"
```

Аккаунт Expo: username `alexgeho`, email `alexander.gerhard@outlook.com`.
На телефоне после OTA: закрыть приложение полностью и открыть заново (иногда со 2-го раза).

### 2. Новые нативные билды (нужны, только чтобы шведский был с ПЕРВОГО открытия у свежих скачиваний)

```
eas build -p ios --profile production        # → .ipa, App Store
eas build -p android --profile production     # → .aab, Google Play
# или обе: eas build -p all --profile production
```

Отправка в сторы:

```
eas submit -p ios --latest
eas submit -p android --latest
```

- `appVersionSource: remote` + `autoIncrement` → номера поднимутся сами (iOS ~174, Android ~19).
- Пройдут review (iOS ~день, Android быстрее). Правки JS → рисков отказа нет.
- Билды идут в облаке EAS — локальный Android SDK не нужен.

### 3. Мелочи на потом

- Пара экранов имеет захардкоженные светлые цвета в **других** паттернах (module-констан­ты типа `billingForm.styles.js` `CARD`/`MUTED`) — требуют рефактора с прокидыванием темы. Низкий приоритет.
- OTA (`eas update`) ещё **НЕ запускалось** — ждёт входа в EAS.

## 🔑 Ключевой контекст

- Runtime всех живых сборок = `1.1.0` → OTA до них долетает.
- Локальный запуск iOS-симулятора: проектный `yarn ios` требует iOS 18.2 (нет). Использовали `npx expo run:ios --device <udid>` на созданном iPhone 16 / iOS 18.5.
- Проверка перед коммитом: `yarn lint && yarn compile && yarn jest` (compile = `scripts/check-compile.js`).
- НИКОГДА не запускать `expo prebuild` (уничтожит кастомную нативку).
