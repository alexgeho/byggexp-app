// Egenkontroll titles are often "Egenkontroll <arbete> – <adress>".

// One-line title: "Egenkontroll" is already the screen's subject and the
// address goes on its own line.
export const shortTitle = (title = "") =>
  title
    .split(/\s[–-]\s/)[0]
    .replace(/^egenkontroll\s*[-–:]?\s*/i, "")
    .replace(/^./, (ch) => ch.toUpperCase()) || title;

// The address part after the dash ("Björkvägen 12, Knivsta"), or "".
export const titleAddress = (title = "") => {
  const parts = title.split(/\s[–-]\s/);
  return parts.length > 1 ? parts.slice(1).join(" – ").trim() : "";
};
