import { shortTitle, titleAddress } from "../egenkontrollTitle";

describe("egenkontroll title", () => {
  const full =
    "Egenkontroll gjutning av platta på mark – Björkvägen 12, Knivsta";

  it("drops the Egenkontroll prefix and the address", () => {
    expect(shortTitle(full)).toBe("Gjutning av platta på mark");
    expect(shortTitle("Badrum")).toBe("Badrum");
    expect(shortTitle("")).toBe("");
  });

  it("returns the address after the dash", () => {
    expect(titleAddress(full)).toBe("Björkvägen 12, Knivsta");
    expect(titleAddress("Badrum")).toBe("");
  });
});
