import {
  computeTotals,
  deriveSettlement,
  formatMoney,
  toIsoDate,
  addDaysIso,
  lineNet,
} from "../billingTotals";

describe("computeTotals", () => {
  it("sums net and 25% VAT across line items", () => {
    const items = [
      { quantity: 1, price: 18000, vatRate: 25 },
      { quantity: 40, price: 650, vatRate: 25 },
    ];
    expect(computeTotals(items)).toEqual({
      subtotal: 44000,
      vat: 11000,
      total: 55000,
    });
  });

  it("applies per-line discount to the net", () => {
    const items = [{ quantity: 2, price: 1000, discount: 10, vatRate: 25 }];
    // net = 2*1000*0.9 = 1800; vat = 450
    expect(computeTotals(items)).toEqual({
      subtotal: 1800,
      vat: 450,
      total: 2250,
    });
  });

  it("omits VAT under reverse charge", () => {
    const items = [{ quantity: 1, price: 1000, vatRate: 25 }];
    expect(computeTotals(items, { reverseVAT: true })).toEqual({
      subtotal: 1000,
      vat: 0,
      total: 1000,
    });
  });

  it("defaults an empty list to zeros", () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, vat: 0, total: 0 });
  });
});

describe("deriveSettlement (ROT + rounding)", () => {
  it("deducts 30% of labour and rounds to whole kronor", () => {
    const { rotDeduction, roundedTotal, rounding } = deriveSettlement(48000, {
      rotEnabled: true,
      rotLaborAmount: 26000,
    });
    expect(rotDeduction).toBe(7800);
    expect(roundedTotal).toBe(40200);
    expect(rounding).toBe(0);
  });

  it("caps the ROT deduction at 50 000 kr", () => {
    const { rotDeduction } = deriveSettlement(500000, {
      rotEnabled: true,
      rotLaborAmount: 300000, // 30% = 90 000 -> capped
    });
    expect(rotDeduction).toBe(50000);
  });

  it("applies öresavrundning on fractional totals", () => {
    const { roundedTotal, rounding } = deriveSettlement(100.4, {});
    expect(roundedTotal).toBe(100);
    expect(rounding).toBe(-0.4);
  });

  it("is a no-op when ROT is disabled", () => {
    expect(deriveSettlement(1000, { rotEnabled: false })).toEqual({
      rotDeduction: 0,
      rounding: 0,
      roundedTotal: 1000,
    });
  });
});

describe("lineNet", () => {
  it("multiplies quantity by price and discount", () => {
    expect(lineNet({ quantity: 3, price: 100, discount: 0 })).toBe(300);
    expect(lineNet({ quantity: 3, price: 100, discount: 50 })).toBe(150);
    expect(lineNet({})).toBe(0);
  });
});

describe("date helpers", () => {
  it("formats a Date to YYYY-MM-DD", () => {
    expect(toIsoDate(new Date(2026, 6, 29))).toBe("2026-07-29");
  });

  it("adds days across a month boundary", () => {
    expect(addDaysIso("2026-07-29", 20)).toBe("2026-08-18");
  });
});

describe("formatMoney", () => {
  it("renders Swedish money with two decimals and kr", () => {
    // Normalise whitespace to avoid NBSP vs space mismatches.
    expect(formatMoney(40200, "sv").replace(/\s/g, "")).toBe("40200,00kr");
  });
});
