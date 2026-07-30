# Store Release Checklist — ByggExp

Tracking checklist for App Store and Google Play submission.
Tick items as they are completed.

## Key facts (reference)

- **Bundle ID / package:** `se.byggexp.app` (iOS + Android)
- **Expo slug:** `byggexp` · **EAS projectId:** `e64be0f7-ffc0-440c-8c72-5cffe89943b7`
- **Firebase project:** `byggexp`
- **Internal Android Kotlin package:** still `com.anonymous.totbygghubmobileapp` (not store-facing; harmless)
- **Account deletion:** in-app at Profile → "Ta bort konto" → `POST /gdpr/me/erase`
- **Privacy policy page:** built (`privacy-policy.html`) — needs hosting on `byggexp.se/privacy`

---

## ✅ Done

- [x] In-app account deletion (Apple 5.1.1(v) / Google data deletion)
- [x] Privacy policy page authored (SV/EN) — _hosting pending_
- [x] Branded bundle id `se.byggexp.app`
- [x] Android FCM push: `google-services.json` (EAS secret) + FCM V1 service-account key uploaded to EAS
- [x] Sentry crash reporting (disabled in dev via `__DEV__`)
- [x] iOS permission usage strings (camera / photos / location)
- [x] `ITSAppUsesNonExemptEncryption: false` (export compliance)
- [x] iPhone-only (`supportsTablet: false`) — no iPad screenshots needed

---

## 🍎 App Store

### Account & access

- [ ] Active **Apple Developer Program** membership ($99/yr)
- [ ] **Demo/reviewer account** with sample data → credentials in App Review Notes _(critical for login-gated app)_
- [ ] Create App Store Connect **app record** with `se.byggexp.app`
- [ ] Update `ascAppId` in `eas.json` to the new app record's ID (current `6748280779` is tied to the old bundle id)

### Metadata & assets

- [ ] App icon 1024×1024 (no alpha/transparency)
- [ ] Screenshots — iPhone **6.7"** (required)
- [ ] Name, subtitle, description, keywords, category (Business/Productivity)
- [ ] **Privacy Policy URL** (host the page first)
- [ ] Support URL (+ optional Marketing URL)
- [ ] **App Privacy** questionnaire (data collected: location, contact info, identifiers, usage…)
- [ ] Age rating questionnaire
- [x] Sign in with Apple — N/A (no third-party login)

### Build & submit

- [ ] iOS production build: `eas build -p ios --profile production`
- [ ] `eas submit -p ios` (needs Apple credentials in EAS)
- [ ] TestFlight smoke test before submitting for review

---

## 🤖 Google Play

### Account & access

- [ ] **Google Play Developer** account ($25 one-time)
- [ ] Create Play Console app with package `se.byggexp.app`
- [ ] **Play submission service account** (`google-service-account.json` in `eas.json`) — a Google Cloud service account with Play permissions. _Different from the FCM V1 key._

### Store listing & assets

- [ ] App icon 512×512
- [ ] **Feature graphic 1024×500** (required)
- [ ] Screenshots — phone (min 2)
- [ ] Short description (≤80) + full description (≤4000)
- [ ] Category, contact email
- [ ] **Privacy Policy URL** + **Data deletion** field (point to privacy page / erase flow)
- [ ] **Data safety** form (data collection & sharing)
- [ ] Content rating (IARC questionnaire)
- [ ] Target audience & content; Ads = No

### Build & submit

- [ ] Production `.aab`: `eas build -p android --profile production`
- [ ] Upload to **internal testing** track first
- [ ] `eas submit -p android`
- [ ] Confirm push works on a production build (FCM V1)

---

## 📋 Cross-cutting

- [ ] **Terms of Service** page (privacy text references "användarvillkor")
- [ ] Test on real iOS + Android devices, no crashes
- [ ] Confirm target API level meets Play requirement (Expo SDK 54 → API 35 ✓)

---

## ⚠️ Watch-outs / notes

- EAS build warned "No environment variables … for the preview environment" — if an Android build fails on missing `google-services.json`, attach the secret to the environment:
  `eas env:create --environment preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret` (repeat for `production`).
- `google-services.json` and the FCM service-account key are **gitignored** — keep them out of commits.
- Company owner / last-admin self-deletion currently de-identifies the user but does not reassign/delete the company — consider guarding later.
