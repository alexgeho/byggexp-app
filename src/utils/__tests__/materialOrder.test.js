import {
  addArticle,
  buildOrderPayload,
  isOrderable,
  setQuantity,
} from "../materialOrder";

const plank = {
  _id: "a1",
  articleNumber: "100",
  name: "Regel 45x95",
  unit: "m",
  supplier: "Lundagrossisten",
  priceExclMoms: 40,
};

describe("material order drafts", () => {
  it("only grossist articles can be ordered", () => {
    expect(isOrderable(plank)).toBe(true);
    expect(isOrderable({ ...plank, supplier: "" })).toBe(false);
    expect(isOrderable({ ...plank, active: false })).toBe(false);
  });

  it("adding the same article again bumps the quantity", () => {
    const rows = addArticle(addArticle([], plank), plank);
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(2);
  });

  it("quantity 0 removes the row", () => {
    const rows = addArticle([], plank);
    expect(setQuantity(rows, 0, 5)[0].quantity).toBe(5);
    expect(setQuantity(rows, 0, 0)).toEqual([]);
  });

  it("builds a draft without prices, date as YYYY-MM-DD", () => {
    const payload = buildOrderPayload({
      companyId: "c",
      projectId: "p",
      supplier: "Lundagrossisten",
      rows: addArticle([], plank),
      desiredDate: new Date(2026, 9, 28, 15),
      comment: "  till bakdörren ",
    });
    expect(payload).toEqual({
      companyId: "c",
      projectId: "p",
      supplier: "Lundagrossisten",
      rows: [
        {
          articleId: "a1",
          articleNumber: "100",
          name: "Regel 45x95",
          unit: "m",
          quantity: 1,
        },
      ],
      desiredDate: "2026-10-28",
      comment: "till bakdörren",
      status: "draft",
    });
  });
});
