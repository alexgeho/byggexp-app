# Тексты магазинов (Play + App Store)

Рабочий файл для описаний приложения в сторах. Правим здесь, потом копируем в
Play Console / App Store Connect (в коде эти тексты не живут).

## Что должно звучать обязательно

Требование от 2026-09-20 — текущая строка в Google Play слишком слабая:

> «Time reporting via GPS, projects, teams and invoicing – all in one app.»

Она не говорит главного: **время считается автоматически по GPS, но его можно
ввести и вручную**. Плюс должны быть названы все четыре опоры продукта:

1. **Время** — автоматически по GPS (геозона: пришёл на объект → пошёл отсчёт,
   ушёл → пауза), **и вручную**, когда GPS не нужен или телефон был выключен.
2. **Управление проектами** — объекты, адреса, фото, документы, экономика.
3. **Задачи** — назначение, сроки, напоминания, повторение.
4. **Планирование** — смены и бригады на календаре.
5. **Инвойсинг** — клиенты, артикулы, офферты, фактуры, ROT, byggmoms.

Тон: не перечисление функций через запятую, а обещание результата. Без
превосходных степеней («bäst», «nummer ett») — их не любят ни сторы, ни
покупатель.

## Варианты (черновики)

### Google Play — короткое описание (макс. 80 знаков)

- SV: `Tid automatiskt med GPS eller manuellt. Projekt, uppgifter, planering, faktura.` (79)
- EN: `Time by GPS or by hand. Projects, tasks, planning and invoicing in one app.` (75)

### App Store — подзаголовок (макс. 30 знаков)

- SV: `Tid, projekt och fakturor` (25)
- EN: `Time, projects, invoices` (24)

### Промо / первый абзац полного описания

**SV**

> Stämpla in när du kommer till bygget — appen räknar tiden åt dig med GPS, och
> du fyller i den för hand när det passar bättre. Samma app håller ordning på
> projekten, uppgifterna, planeringen och fakturorna, så timmarna blir
> underlag för lön och faktura utan att någon skriver av dem en gång till.

**EN**

> Clock in when you reach the site — the app counts the hours for you over GPS,
> and you enter them by hand whenever that suits better. The same app keeps the
> projects, the tasks, the schedule and the invoices, so those hours turn into
> payroll and invoices without anyone typing them out twice.

## Где обновлять

- Google Play Console → Main store listing → Short/Full description (11 языков,
  как минимум sv + en).
- App Store Connect → App Information → Subtitle + Description + Promotional
  text.

Важно: после смены текста в Play описание уходит на ревью вместе со следующим
релизом.
