# Смены и геозона (Shifts & Geofence) — как всё устроено

Справочник по системе рабочих смен и авто-геозоны: технологии, машина
состояний, ключевые функции и файлы, текущее поведение и открытые вопросы.
Смена = **биллинговые часы работника**, поэтому логику меняем только осознанно и
с тестами.

---

## 1. Технологии

| Слой            | Технология                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| Приложение      | React Native + **Expo** (managed workflow)                                          |
| Локация/геозона | `expo-location` (`startGeofencingAsync`, `watchPositionAsync`), `expo-task-manager` |
| iOS фон         | **OS region monitoring** (система сама будит по входу/выходу из региона)            |
| Android фон     | **Foreground service** с постоянными location-обновлениями                          |
| Foreground      | `ShiftLocationMonitor` — подстраховка, пока приложение открыто (особенно iOS)       |
| Бэкенд          | **NestJS** + **MongoDB** (репо `ByggExp-BackEnd`)                                   |
| Аудит           | коллекция `ShiftEvent` (таймлайн переходов на смену)                                |

Нативные возможности (фоновая локация) включаются **флагами сборки** в `app.json`:
`isIosBackgroundLocationEnabled: true`, `isAndroidBackgroundLocationEnabled: true`.
OTA их **не** меняет — только новый нативный билд.

---

## 2. Машина состояний смены

Единый источник правды — `src/tasks/shiftAutoTransition.js`:

```
выход из зоны (тот же проект)   -> PAUSE   (смена открыта, часы стоят)
возврат в зону (тот же проект)  -> RESUME  (та же смена, накопленное время сохранено)
переключение проекта            -> PAUSE   (смена старого проекта на паузе, минуты сохранены;
                                            вернулся + Play -> RESUME; paused не блокирует старт нового)
```

Бэкенд-контракт: **одна открытая смена на проект в день** и (важно!) **одна
АКТИВНАЯ смена на работника** — старт второй активной отклоняется (см. §6).

---

## 3. Ключевые функции (frontend)

`src/tasks/shiftAutoTransition.js` — все авто-переходы идут только через него,
чтобы фон и foreground вели себя одинаково.

| Функция                                                                              | Что делает                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `performShiftEnter({projectId, project})`                                            | Вход в зону: если текущая смена **на паузе** → `resume`; иначе `shiftService.start(projectId)`. Если бэк ответил «сегодня смена уже есть» — восстанавливает и делает `resume` (`recoverFromExistingShift`). |
| `performShiftExit({projectId})`                                                      | Выход из зоны: `shiftService.pause(currentShiftId, {reason: geofence exit})`. Паузит только **активную** смену.                                                                                             |
| `performShiftComplete({projectId, shiftId})`                                         | `shiftService.complete(reason: "project_switched")`. Вызывается **только** при переключении проекта.                                                                                                        |
| `resumeExisting(shift)`                                                              | `shiftService.resume(shiftId, {source: "gps"})` + announce «вернулся в зону».                                                                                                                               |
| `handleProjectSwitch({fromProjectId, fromShiftId, toProjectId, isWithinTargetArea})` | Переключение проекта: **complete** старой смены, затем (если задан новый проект и ты в его зоне) **start** новой.                                                                                           |
| `handleGeofenceTransition(enter/exit)`                                               | Роутер вход/выход для фоновых задач.                                                                                                                                                                        |
| `isDuplicateTransition(...)`                                                         | Дедуп: не дёргать API повторно, если ОС продублировала событие или GPS «моргнул» на границе.                                                                                                                |

Всё оборачивается в `runExclusive` (`shiftTransitionQueue`) — переходы
сериализуются, чтобы `complete` старого не обогнал `start` нового.

### Вызов при ручном переключении проекта

`src/screens/Main/HomeVariants/HomeVariant2.jsx` — при смене выбранного проекта,
если есть активная смена, вызывается:

```js
handleProjectSwitch({
  fromProjectId: prevId,
  fromShiftId: activeShift.id,
  toProjectId: selectedProjectId,
});
```

→ старая смена **завершается** (`complete`). Так было и раньше (коммит `aec7624f`
только вынес прямой `.complete()` в `handleProjectSwitch`; поведение — то же).

---

## 4. Логика решения «внутри/снаружи» (geofence)

`src/utils/geofenceEvaluation.js` — `evaluateGeofencePosition({distance, accuracy, radius})`:

```
если accuracy > max(150м, radius)                 -> UNKNOWN   (фикс слишком грубый, игнор)
если distance + accuracy <= radius                -> INSIDE
если distance - accuracy > radius + 60м           -> OUTSIDE   (гистерезис 60м)
иначе                                             -> UNKNOWN   (мёртвая зона у границы)
```

Три защиты от «дёрганья» смены самой по себе (Wi-Fi/сотовые фиксы гуляют на сотни метров):

1. **Полоса точности** — фикс считается, только если весь круг неопределённости однозначно с одной стороны.
2. **Гистерезис** (`EXIT_HYSTERESIS_METERS = 60`) — уйти нужно чуть дальше, чем войти.
3. **Подтверждение** (`CONFIRMATIONS_REQUIRED = 2`) — смену двигают только 2+ согласных подряд фикса.

Плюс отсечка «телепортов»: скачок ≥ `MIN_TELEPORT_JUMP_METERS = 250` со скоростью

> `MAX_PLAUSIBLE_SPEED_MPS = 40` (≈144 км/ч) отбрасывается (Wi-Fi «прыгнул» на далёкую точку).

Провалившийся вызов бэка не «залипает»: транзакция ретраится с backoff
(`TRANSITION_RETRY_BACKOFF_MS = [30с, 60с, 120с, 300с]`, макс `MAX_TRANSITION_ATTEMPTS = 5`).

### Радиус зоны

`src/config/shiftLocationPolicy.js`: `minBackgroundRadiusMeters: 180` — фоновый
радиус зажимается снизу до **180 м** (регион-мониторинг iOS ниже ненадёжен).
Опрос позиции — каждые ~15 с (`checkIntervalMs`).

### Диагностический лог

Тег `[geofence]` (`src/utils/shiftGeofenceDebug.js`), пример строки:

```
[geofence] d=414m acc=13m r=180m -> outside | was=false pending=- (0) | act=none
```

`d`=расстояние до точки проекта, `acc`=точность GPS, `r`=радиус. **Точный** фикс
(`acc` мал), показывающий большое `d`, означает: либо ты реально далеко, либо
**координаты/пин проекта заданы неверно** (расстояние меряется до сохранённой точки проекта).

---

## 5. Мониторы (кто зовёт переходы)

| Файл                                    | Роль                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tasks/shiftGeofenceTask.js`        | iOS: задача OS region-monitoring (`expo-task-manager`). Система будит по входу/выходу региона.                                                                                    |
| `src/tasks/shiftLocationUpdatesTask.js` | Android: foreground-service, постоянные location-обновления, сам считает вход/выход.                                                                                              |
| `ShiftLocationMonitor` (foreground)     | Подстраховка при **открытом** приложении. На iOS полная фоновая пауза (приложение закрыто) ограничена region-monitoring — поэтому есть foreground safety-net (коммит `902862c2`). |
| `src/utils/backgroundGeofence.js`       | Регистрирует/обновляет регион геозоны; ре-таргетит на активный проект.                                                                                                            |

---

## 6. Бэкенд (`ByggExp-BackEnd`, модуль `src/shifts`)

- **Контракт:** одна открытая смена на проект/день; **одна активная смена на работника**.
- **Гвард «Prevent duplicate active shifts»** (коммит `536db33`): `start` отклоняется,
  если у работника уже есть **активная** смена → на клиенте это алерт
  **«Pause the current shift before starting a new one»**. Пауза-смена (paused)
  активной не считается — стартовать другой проект при **приостановленной** смене можно.
- **Аудит `ShiftEvent`** (`src/shifts/schemas/shift-event.schema.ts`) — по строке на переход:
  `checked_in`, `paused`, `resumed`, `auto_paused_geofence_exit`,
  `auto_resumed_geofence_return`, `auto_paused_offline`, `completed`, `manual_hours_set`
  (+ source: `manual` / `gps` / `auto` / `system`, причина, время).
  Смотреть таймлайн: админка → **Shift log → смена** (или `GET /shifts/:id/timeline`).

---

## 7. Переключение проекта — текущее vs желаемое (ОТКРЫТЫЙ ВОПРОС)

**Сейчас (by design):** переключил проект → старая смена **COMPLETE** (завершается).
Если `complete` не успел до нажатия Play, старая ещё активна → бэк блокирует старт
новой: «Pause the current shift before starting a new one».

**Желаемое (запрос Alexander):**

- переключил проект → старая смена **PAUSE** (не complete);
- на новом проекте стартует своя смена;
- вернулся в старый проект → **RESUME** с теми же накопленными минутами.

**Почему это изменение модели, а не «просто фикс»:**
у работника сейчас может быть только **одна открытая смена**. Желаемое требует
**несколько открытых смен одновременно** (проект A — на паузе, проект B — активна,
running только одна). Нужно:

1. фронт: переключение = `PAUSE` вместо `COMPLETE` (в `handleProjectSwitch` / HomeVariant2);
2. фронт: возврат в проект с приостановленной сменой = `RESUME`;
3. бэкенд: `start` не должен блокировать, если другая смена **на паузе** (гвард
   `536db33` считать только running-смены; убедиться, что «одна открытая на проект/день» не мешает).

⚠️ Правим только после подтверждения модели — это биллинговые часы.

---

## 8. История ключевых изменений (git)

- `f0a69f43` feat: OS-level background geofencing (старт фичи)
- `aec7624f` fix: **pause on geofence exit, resume on return** (+ вынос `.complete()` переключения в `handleProjectSwitch`)
- `481794f2` fix: correct project-switch message + gate manual hours on-site
- `bbf80ec8` feat: close previous project's open shift on project switch
- `ff7053ea` fix: auto-complete shift on project switch + stale-fetch guard
- бэкенд `536db33` **Prevent duplicate active shifts** (гвард «одна активная смена»)
- `225b7d78` Android geofence FGS persistence fix; iOS foreground safety-net `902862c2`

---

## 9. Смежное (не про геозону, но рядом)

- **Команда проекта / добавление работников:** `SelectWorkers` теперь грузит всех
  сотрудников компании (`getMyCompanyUsers`), бэкенд `addWorkers` принимает любого
  члена компании (тенант-проверка сохранена). Раньше пикер фильтровал по `role=worker`
  и был пуст для компаний без worker-ролей.
