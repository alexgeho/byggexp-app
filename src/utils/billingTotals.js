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

export const lineNet = (item) => {
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
