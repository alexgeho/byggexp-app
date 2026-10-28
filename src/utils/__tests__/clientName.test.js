import { clientDisplayName } from "../clientName";

describe("clientDisplayName", () => {
  it("uses companyName when set", () => {
    expect(
      clientDisplayName({ companyName: "Bygg AB", firstName: "Anna" }),
    ).toBe("Bygg AB");
  });

  it("falls back to the person's name for private clients", () => {
    expect(
      clientDisplayName({
        clientType: "private",
        companyName: "",
        firstName: "Anna",
        lastName: "Svensson",
      }),
    ).toBe("Anna Svensson");
    expect(clientDisplayName({ firstName: "Anna" })).toBe("Anna");
  });

  it("returns an empty string when there is no name", () => {
    expect(clientDisplayName({})).toBe("");
    expect(clientDisplayName(null)).toBe("");
  });
});
