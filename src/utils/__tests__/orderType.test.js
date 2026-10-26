import { orderTypeNote } from "../orderType";

const t = (key) => ({ "projects.orderType.jour": "Jour" })[key] || key;

test("only a non-default order type gets a note on the card", () => {
  expect(orderTypeNote({ orderType: "jour" }, t)).toBe("Jour");
  expect(orderTypeNote({ orderType: "project" }, t)).toBeNull();
  expect(orderTypeNote({}, t)).toBeNull();
});
