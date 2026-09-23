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

## App Store 1.1.2 — итоговый набор (sv, 2026-09-23)

Ключи — из SEO-банка сайта (`ByggExp-NextJs/docs/seo/keywords-master.md`): tidrapporteringssystem bygg 5400,
projekthantering bygg 2900, tidrapportering hantverkare 2400, schemaläggningssystem 2400, app för tidrapportering 1900,
stämpelklocka 720. Apple склеивает слова из названия, подзаголовка и ключей, поэтому «bygg» стоит в подзаголовке,
а слова не повторяются. «personalliggare» (1000) не взят — модуля в приложении ещё нет.

- **Subtitle** (29/30): `Tidrapport & projekt för bygg`
- **Keywords** (96/100): `tidrapporteringssystem,tidrapportering,hantverkare,projekthantering,schemaläggning,stämpelklocka`
- **Promotional Text** (145/170): Tidrapportering för hantverkare: tiden räknas med GPS eller fylls i för hand. Projekt, planering och fakturor i samma app – nu även i mörkt läge.

**Description** (1748/4000):

```
Stämpla in när du kommer till bygget – ByggExp räknar tiden åt dig med GPS, och du fyller i den för hand när det passar bättre. Samma app håller ordning på projekten, uppgifterna, planeringen och fakturorna, så timmarna blir underlag för både lön och faktura utan att någon skriver av dem en gång till.

Byggd för hantverkare och byggföretag – från enmansföretaget till laget med tjugo man på flera byggen.

TIDRAPPORTERING
• Automatisk stämpelklocka med GPS: kommer du till projektets adress startar tiden, lämnar du platsen pausas den
• Manuell tidrapport när GPS inte behövs – fyll i timmarna direkt i kalendern
• Planerade timmar per projekt utifrån arbetsdagen, så du ser plan mot utfall
• Påminnelse när timmar saknas, och en tydlig logg över in- och utstämplingar
• Export av tidrapporten till PDF och Excel – färdigt löneunderlag

PROJEKTHANTERING
• Alla byggprojekt med adress, datum, team, dokument och foton på ett ställe
• Kvitton fotograferas och läses av automatiskt – kostnaden hamnar på projektet
• Verktyg kopplas till projekt och anställda
• Projektets ekonomi: timmar, kostnad och marginal

UPPGIFTER OCH PLANERING
• Ge uppgifter till en person eller hela laget, med datum, påminnelser och foton
• Schemaläggning av pass och personal i kalendern

FAKTURERING
• Offerter och fakturor med ROT-avdrag och omvänd byggmoms
• Kreditfakturor, helt eller delvis
• Leverantörsfakturor med påminnelse när de förfaller
• Kunder, artiklar, Bankgiro och Plusgiro

FÖR HELA FÖRETAGET
• Roller för administratör, arbetsledare och anställd – var och en ser det som gäller dem
• Mörkt tema och 11 språk, bland annat svenska, engelska, polska, ukrainska och estniska
• Samma konto i appen och i webbversionen för kontoret

Prova gratis i 14 dagar.
```
