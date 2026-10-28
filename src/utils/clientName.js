// Display name of a client (customer register). Company clients carry
// companyName; private clients may only have firstName/lastName (created on the
// web or in Kunder), so fall back to the person's name.
export const clientDisplayName = (client) =>
  String(client?.companyName || "").trim() ||
  [client?.firstName, client?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
