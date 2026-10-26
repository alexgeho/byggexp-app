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

  it("builds a draft: article ids + quantities, date as YYYY-MM-DD", () => {
    const payload = buildOrderPayload({
      projectId: "p",
      supplier: "Lundagrossisten",
      rows: addArticle([], plank),
      desiredDate: new Date(2026, 9, 28, 15),
      comment: "  till bakdörren ",
    });
    expect(payload).toEqual({
      projectId: "p",
      supplier: "Lundagrossisten",
      rows: [{ articleId: "a1", quantity: 1 }],
      desiredDate: "2026-10-28",
      comment: "till bakdörren",
    });
  });
});

describe("who may change an order", () => {
  const { canEditOrder, parseDateOnly } = require("../materialOrder");
  it("own draft yes; sent or a colleague's no; new order yes", () => {
    expect(canEditOrder({ status: "draft", createdBy: "w1" }, "w1")).toBe(true);
    expect(canEditOrder({ status: "sent", createdBy: "w1" }, "w1")).toBe(false);
    expect(canEditOrder({ status: "draft", createdBy: "w2" }, "w1")).toBe(
      false,
    );
    expect(canEditOrder(undefined, "w1")).toBe(true);
    expect(canEditOrder({ status: "draft", createdBy: "w2" }, "a", true)).toBe(
      true,
    );
    expect(canEditOrder({ status: "sent", createdBy: "w2" }, "a", true)).toBe(
      false,
    );
  });
  it("wanted date stays the same calendar day", () => {
    const d = parseDateOnly("2026-10-28T00:00:00.000Z");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 28]);
  });
});

describe("order value at purchase price", () => {
  const { orderTotal, addArticle } = require("../materialOrder");
  it("admin rows carry a price, the total sums them", () => {
    const rows = addArticle(
      addArticle([], { _id: "a", purchasePriceExclMoms: 40 }),
      { _id: "a", purchasePriceExclMoms: 40 },
    );
    expect(orderTotal(rows)).toBe(80);
  });
  it("worker rows have no price, so no total", () => {
    expect(orderTotal(addArticle([], { _id: "a" }))).toBeNull();
  });
});
