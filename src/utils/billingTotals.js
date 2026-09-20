// Client-side money math for offers & invoices. The server always
// recomputes these on save; here they drive the live totals bar so the
// numbers match the admin panel (offer-math / invoice-math).

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const DEFAULT_VAT_RATE = 25;
export const ROT_RATE = 0.3;
export const ROT_MAX = 50000;

// Monotonic client-only key so the editor can use a stable React key even as
// rows are inserted/removed (index keys would misattach input state). Stripped
// from the payload before saving — see the create screens' buildPayload().
let lineItemSeq = 0;

export const emptyLineItem = () => ({
  _key: `li_${(lineItemSeq += 1)}`,
  description: "",
  quantity: 1,
  unit: "st",
  price: 0,
  discount: 0,
  vatRate: DEFAULT_VAT_RATE,
});

// A text-only row: a heading or a note printed between the priced rows. It
// carries no amount and never reaches the totals — same shape as the web's
// TEXT_ITEM so both ends read each other's documents.
export const emptyTextRow = () => ({
  _key: `li_${(lineItemSeq += 1)}`,
  isText: true,
  description: "",
  quantity: 0,
  unit: "",
  price: 0,
  discount: 0,
  vatRate: 0,
});

// Units that mark a row as labour, so the client's agreed hourly rate and
// labour article can be dropped onto it. Same list as the web form.
const HOUR_UNITS = new Set([
  "tim",
  "timme",
  "timmar",
  "timma",
  "h",
  "hr",
  "hrs",
  "hour",
  "hours",
  "t",
]);

export const isHourRow = (item) =>
  HOUR_UNITS.has(
    String(item?.unit || "")
      .trim()
      .toLowerCase(),
  );

export const lineNet = (item) => {
  if (item?.isText) return 0;
  const quantity = Number(item?.quantity) || 0;
  const price = Number(item?.price) || 0;
  const discount = Number(item?.discount) || 0;
  return quantity * price * (1 - discount / 100);
};

// Subtotal (excl. VAT), VAT and gross total for a set of line items.
export const computeTotals = (items = [], { reverseVAT = false } = {}) => {
  let subtotal = 0;
  let vat = 0;

  items.forEach((item) => {
    if (item?.isText) return;
    const net = lineNet(item);
    subtotal += net;
    if (!reverseVAT) {
      const rate =
        item?.vatRate == null ? DEFAULT_VAT_RATE : Number(item.vatRate);
      vat += net * (rate / 100);
    }
  });

  subtotal = round2(subtotal);
  vat = round2(vat);
  return { subtotal, vat, total: round2(subtotal + vat) };
};

// ROT deduction + öresavrundning, mirroring deriveInvoiceSettlement.
export const deriveSettlement = (
  total,
  { rotEnabled, rotLaborAmount } = {},
) => {
  const rotDeduction = rotEnabled
    ? Math.min(round2(ROT_RATE * (Number(rotLaborAmount) || 0)), ROT_MAX)
    : 0;
  const payable = (Number(total) || 0) - rotDeduction;
  const roundedTotal = Math.round(payable);
  const rounding = round2(roundedTotal - payable);
  return { rotDeduction, rounding, roundedTotal };
};

// Swedish money formatting: "40 200,00 kr".
export const formatMoney = (value, locale = "sv") => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
  return `${formatted} kr`;
};

export const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDaysIso = (baseIso, days) => {
  const base = baseIso ? new Date(baseIso) : new Date();
  if (Number.isNaN(base.getTime())) {
    return "";
  }
  base.setDate(base.getDate() + (Number(days) || 0));
  return toIsoDate(base);
};
