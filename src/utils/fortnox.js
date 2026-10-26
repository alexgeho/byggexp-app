// Invoice pushed to the company's Fortnox. Planned field: invoice.fortnoxStatus
// ("sent"); fortnoxSentAt / fortnoxId are accepted too until the contract lands.
export const isSentToFortnox = (invoice) =>
  invoice?.fortnoxStatus === "sent" ||
  Boolean(invoice?.fortnoxSentAt) ||
  Boolean(invoice?.fortnoxId);
