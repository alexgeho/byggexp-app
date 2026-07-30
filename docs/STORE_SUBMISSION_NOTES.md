# Store Submission — Review Notes, Privacy Answers, Play Service Account

Companion to [STORE_RELEASE.md](./STORE_RELEASE.md).

> ⚠️ The privacy answers below reflect the app's current data footprint
> (no analytics/ads/tracking SDKs). Verify against real data flows and have
> legal review the handling of Swedish **personnummer** (sensitive ID).

---

## 1. App Review Notes (paste into App Store Connect & Play Console)

Fill in the demo credentials, then paste. Keep it short — reviewers skim.

```
This app is a B2B tool for construction companies (project management, time
tracking, tasks, chat, offers & invoices). It requires a login provided by
the employer, so a demo account is included below.

DEMO ACCOUNT
  Email:    <demo@byggexp.se>      <-- fill in
  Password: <demo-password>        <-- fill in
  (This account has sample projects, tasks and shifts so all features are
  visible.)

QUICK WALKTHROUGH
  1. Log in with the demo account above.
  2. Home: start/stop a work shift (timer) and pick a project.
  3. Projekt / Uppgifter: view and create projects and tasks.
  4. Anställda / Verktyg: employee status and tools (admin demo account).
  5. Ekonomi: create an offer/invoice from a client (admin only).
  6. Chat: messaging between office and workers.
  7. Profil: edit account. Account deletion is at
     Profil -> "Ta bort konto" (GDPR erase).

PERMISSIONS
  - Location: used only to tag work shifts (geofencing) while on the clock.
  - Camera / Photos: attach photos to shifts/tasks and set an avatar.
  - Notifications: task and shift reminders.

CONTACT
  support@byggexp.se
```

**Where to enter it**

- Apple: App Store Connect → your app → the version → **App Review Information**
  → Sign-In required = Yes → username/password + **Notes**.
- Google: Play Console → **App content → App access** → "All or some
  functionality is restricted" → add the demo credentials + instructions.

---

## 2. Apple — App Privacy (nutrition labels)

App Store Connect → App Privacy. Answer **"Yes, we collect data"**, then per type:

**Data used to track you:** **None** (no ads/analytics/3rd-party trackers, no
IDFA, no data brokers).

| Apple data type                                       | Collected | Purpose           | Linked to user |
| ----------------------------------------------------- | --------- | ----------------- | -------------- |
| Contact Info — Name, Email, Phone                     | Yes       | App Functionality | Yes            |
| Contact Info — client/customer details (for invoices) | Yes       | App Functionality | Yes            |
| Sensitive Info — personnummer                         | Yes       | App Functionality | Yes            |
| User Content — Photos or Videos                       | Yes       | App Functionality | Yes            |
| User Content — Other (documents, chat messages)       | Yes       | App Functionality | Yes            |
| Identifiers — User ID                                 | Yes       | App Functionality | Yes            |
| Identifiers — Device ID (push token)                  | Yes       | App Functionality | Yes            |
| Location — Precise Location                           | Yes       | App Functionality | Yes            |
| Diagnostics — Crash Data                              | Yes       | App Functionality | No*            |

\* Crash Data via Sentry. If you attach user identity to Sentry events, mark
"Linked = Yes". Currently Sentry is disabled in dev; keep user context minimal.

**Not collected:** Health, Financial (payment) info, Browsing/Search history,
Contacts (address book), Purchases, Audio.

---

## 3. Google Play — Data safety

Play Console → App content → **Data safety**.

- **Does your app collect or share user data?** Yes, collect. **Share:** No
  (Sentry is a processor/service provider, not "sharing").
- **Encrypted in transit:** Yes (HTTPS/TLS).
- **Users can request data deletion:** **Yes** — in-app (Profil → Ta bort
  konto) and via email. Provide the deletion URL: the privacy policy page.

| Data type (Google)                                    | Collected | Purpose                               |
| ----------------------------------------------------- | --------- | ------------------------------------- |
| Personal info — Name, Email, Phone                    | Yes       | App functionality, Account management |
| Personal info — User IDs                              | Yes       | App functionality                     |
| Personal info — Other (personnummer, client contacts) | Yes       | App functionality                     |
| Location — Precise location                           | Yes       | App functionality                     |
| Photos and videos                                     | Yes       | App functionality                     |
| Files and docs                                        | Yes       | App functionality                     |
| Messages — In-app messages                            | Yes       | App functionality                     |
| App activity — Other actions                          | Optional  | App functionality                     |
| App info & performance — Crash logs, Diagnostics      | Yes       | App functionality (Sentry)            |
| Device or other IDs                                   | Yes       | App functionality (push token)        |

**Not collected:** Financial payment info, Health, Web browsing history,
Contacts (address book), Calendar, Audio.

---

## 4. Google Play submission service account (for `eas submit`)

This is **separate** from the FCM V1 key. It lets EAS upload builds to Play.
`eas.json` already points to `./google-service-account.json`.

**A. Create the service account + JSON key (Google Cloud)**

1. https://console.cloud.google.com → select the project linked to Play
   (or create one).
2. **IAM & Admin → Service Accounts → Create service account**
   (name e.g. `eas-play-submit`; no roles needed at the GCP level).
3. Open the new SA → **Keys → Add key → Create new key → JSON** → download.
4. Save it as `google-service-account.json` in the project root
   (**gitignored** — do not commit) or store as an EAS file secret.

**B. Grant it access in Play Console**

1. Google Play Console → **Users and permissions → Invite new users**.
2. Enter the service account **email** (`...@...iam.gserviceaccount.com`).
3. Grant app permissions: at minimum **Release to testing tracks** +
   **Release to production** + **Manage store presence** (or Admin for the app).
4. Save/confirm.

   _(Alternative path: Play Console → Setup → API access → link the Cloud
   project → grant the service account access there.)_

**C. Submit**

```
eas build -p android --profile production   # produces the .aab
eas submit -p android --profile production  # uploads via the service account
```

First upload usually goes to the **internal testing** track (see `eas.json`
`submit.production.android.track: internal`).

---

## Reference

- Bundle id / package: `se.byggexp.app`
- No third-party analytics/ads SDKs (checked in `package.json`)
- Data collectors in use: expo-location, expo-camera, expo-image-picker,
  expo-document-picker, expo-file-system, expo-notifications, @sentry/react-native
