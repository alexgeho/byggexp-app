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

## App Store 1.1.2 — итоговый набор (sv, 2026-09-23; блоки TIDRAPPORTERING / PROJEKTHANTERING / FAKTURERING обновлены 2026-10-26 для 1.1.5)

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
• Manuell dagrapport: arbetstid, övertid, OB, restid, bil, traktamente och frånvaro – med foton, kvitton och kommentar
• Intern tid för verkstad, service och utbildning – går till lön, inte till faktura
• Vecka, månad eller valfri period, och dagen sparas automatiskt
• Påminnelse när timmar saknas
• Export till PDF och Excel – färdigt löneunderlag, även till Fortnox Lön

PROJEKTHANTERING
• Alla byggprojekt med adress, datum, team, dokument och foton på ett ställe
• Ordertyp: projekt, service, installation, jour eller garanti
• Materialbeställning till grossisten direkt från projektet
• Kvitton och fakturor läses av automatiskt – kostnaden hamnar på projektet
• Projektets ekonomi: timmar, material, kostnad och marginal

UPPGIFTER OCH PLANERING
• Ge uppgifter till en person eller hela laget, med datum, påminnelser och foton
• Schemaläggning av pass och personal i kalendern

FAKTURERING
• Offerter och fakturor med ROT, RUT, Grön teknik och omvänd byggmoms
• Fakturor och löneunderlag direkt till Fortnox
• Kreditfakturor, helt eller delvis
• Leverantörsfakturor med påminnelse när de förfaller

FÖR HELA FÖRETAGET
• Roller för administratör, arbetsledare och anställd – var och en ser det som gäller dem
• Mörkt tema och 11 språk, bland annat svenska, engelska, polska, ukrainska och estniska
• Samma konto i appen och i webbversionen för kontoret

Prova gratis i 14 dagar.
```

## 1.1.6 — Nyheter (2026-10-27)

### sv

- Välj leverantör först i materialbeställningen – Ahlsell, Beijer, Dahl, Lundagrossisten, Optimera och fler
- Lägg till, ändra och ta bort leverantörer direkt i appen
- Tydligare beställning: leveransadress och leveransdatum på samma ställe
- Leverantörsfakturor från Fortnox hamnar automatiskt i projektets kostnader
- Se vilka kostnader som redan fakturerats vidare till kunden
- Förbättringar och buggfixar

### en

- Pick the supplier first in a material order – Ahlsell, Beijer, Dahl, Lundagrossisten, Optimera and more
- Add, edit and remove suppliers right in the app
- Clearer order form: delivery address and delivery date in one place
- Supplier invoices from Fortnox land in project costs automatically
- See which costs have already been invoiced on to the customer
- Improvements and bug fixes

## 1.1.5 — Nyheter (2026-10-26)

### sv

- Dagrapport: arbetstid, övertid, OB, restid, bil, traktamente och frånvaro samlat på dagen – med kommentar, foton och kvitton
- Vecka, Månad och Period i Arbetspass, med timstapel på varje dag
- Dagen sparas automatiskt en sekund efter ändring, och ↺ kopierar förra resans restid och km
- Spara timmar manuellt utan att välja projekt först
- Intern tid: rapportera tid utanför projekt – verkstad, service av bil eller utbildning
- Arbetsgivaren väljer vilka fält som visas i dagrapporten
- Materialbeställning: beställ material från grossisten direkt från projektet, med leveransadress och önskat datum, och få avisering när den skickas
- Projektets ekonomi visar beställt material
- Ordertyp på projekt: Service, Installation, Jour, Garanti
- ROT, RUT och Grön teknik på fakturor, och fakturor visar när de skickats till Fortnox
- Bifoga kvitto eller faktura som foto eller PDF för avläsning
- Mjukare fönster och avisering som öppnar rätt sak direkt
- Förbättringar och buggfixar

### en

- Daily report: hours, overtime, OB (inconvenient hrs), travel, mileage, daily allowance and absence on one day – with comment, photos and receipts
- Week, Month and Period views in Shifts, with an hours bar on every day
- The day saves itself a second after a change, and ↺ copies last trip's travel time and km
- Save manual hours without picking a project first
- Internal time: log time outside projects – workshop, vehicle service or training
- Employers choose which fields appear in the daily report
- Material orders: order from your wholesaler right from the project, with delivery address and desired date, and get notified when it's sent
- Project economy shows ordered material
- Order type on projects: Service, Installation, On-call, Warranty
- ROT, RUT and green technology deductions on invoices, and invoices show when they've been sent to Fortnox
- Attach a receipt or invoice as a photo or PDF for scanning
- Smoother sheets, and notifications open the right thing directly
- Improvements and bug fixes

### Description (en) — the same three blocks

```
TIME TRACKING
• Automatic GPS time clock: arrive at the project address and time starts, leave the site and it pauses
• Manual daily report: hours, overtime, OB (inconvenient hrs), travel, mileage, daily allowance and absence – with photos, receipts and comment
• Internal time for workshop, service and training – goes to payroll, not to the invoice
• Week, month or any period, and the day saves itself
• Reminder when hours are missing
• Export to PDF and Excel – ready payroll data, also to Fortnox Lön

PROJECT MANAGEMENT
• Every construction project with address, dates, team, documents and photos in one place
• Order type: project, service, installation, on-call or warranty
• Material orders to the wholesaler right from the project
• Receipts and invoices are read automatically – the cost lands on the project
• Project economy: hours, material, cost and margin

INVOICING
• Quotes and invoices with ROT, RUT, green technology and reverse construction VAT
• Invoices and payroll data straight to Fortnox
• Credit invoices, in full or in part
• Supplier invoices with a reminder when they fall due
```

## 1.1.4 — Nyheter (2026-10-15)

### sv

- Egenkontroll: läs in kontrakt med AI, fyll i punkter, fota, signera och dela PDF
- Företagsuppgifter: Bankgiro/Plusgiro, kontonummer, Momsreg.nr och F-skatt – fakturor från appen ser ut som på webben
- Kunder: tryck på en kund för att öppna och ändra
- Kamera: ta bort ett kvitto direkt i telefonen
- Startskärmen: dölj projektväljare, klocka och runda knappar i Anpassa
- Snyggare och tydligare formulär i hela appen

### en

- Self-inspection: read a contract with AI, fill in points, take photos, sign and share a PDF
- Company details: Bankgiro/Plusgiro, account number, VAT no. and F-tax – invoices from the app match the web
- Clients: tap a client to open and edit
- Camera: delete a receipt right on the phone
- Home: hide the project picker, clock and round buttons in Customize
- Cleaner, clearer forms throughout the app
