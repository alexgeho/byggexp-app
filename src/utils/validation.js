// Small, dependency-free validators shared across the auth screens.

// Standard "good enough" email shape check: something@something.tld with no
// spaces. We intentionally keep it permissive — the server is the source of
// truth; this only catches obvious typos before a network round-trip.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}
