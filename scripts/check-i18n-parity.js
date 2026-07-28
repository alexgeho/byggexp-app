#!/usr/bin/env node
/**
 * Verifies that every locale defines exactly the same set of translation keys.
 * Fails (exit 1) if any key is missing from a locale, printing the offenders.
 * Zero dependencies — runnable via `node scripts/check-i18n-parity.js` or CI.
 */
const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "src", "i18n", "locales");
const REFERENCE = "en"; // locale whose key set is treated as the baseline

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const loadLocale = (file) =>
  JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"));

const localeFiles = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith(".json"));

const keySets = {};
for (const file of localeFiles) {
  const locale = path.basename(file, ".json");
  keySets[locale] = new Set(flatten(loadLocale(file)));
}

if (!keySets[REFERENCE]) {
  console.error(`Reference locale "${REFERENCE}.json" not found.`);
  process.exit(1);
}

const referenceKeys = keySets[REFERENCE];
let hasMismatch = false;

for (const [locale, keys] of Object.entries(keySets)) {
  if (locale === REFERENCE) {
    continue;
  }

  const missing = [...referenceKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !referenceKeys.has(key));

  if (missing.length || extra.length) {
    hasMismatch = true;
    console.error(`\n✗ ${locale}.json is out of sync with ${REFERENCE}.json:`);
    if (missing.length) {
      console.error(`  Missing ${missing.length} key(s): ${missing.join(", ")}`);
    }
    if (extra.length) {
      console.error(`  Extra ${extra.length} key(s): ${extra.join(", ")}`);
    }
  }
}

if (hasMismatch) {
  process.exit(1);
}

console.log(
  `✓ i18n parity OK — ${localeFiles.length} locales, ${referenceKeys.size} keys each.`,
);
