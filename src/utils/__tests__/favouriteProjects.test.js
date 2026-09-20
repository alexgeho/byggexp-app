import { sortByFavourite, toggleFavouriteProject } from "../favouriteProjects";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const idOf = (item) => item.id;

describe("sortByFavourite", () => {
  it("floats pinned items to the top, keeping the rest in order", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

    expect(sortByFavourite(items, ["c"], idOf).map(idOf)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("keeps the incoming order when nothing is pinned", () => {
    const items = [{ id: "a" }, { id: "b" }];

    expect(sortByFavourite(items, [], idOf).map(idOf)).toEqual(["a", "b"]);
  });

  it("compares ids as strings, so a numeric id still matches", () => {
    const items = [{ id: 1 }, { id: 2 }];

    expect(sortByFavourite(items, ["2"], idOf).map(idOf)).toEqual([2, 1]);
  });

  it("does not mutate the array it was given", () => {
    const items = [{ id: "a" }, { id: "b" }];
    sortByFavourite(items, ["b"], idOf);

    expect(items.map(idOf)).toEqual(["a", "b"]);
  });
});

describe("toggleFavouriteProject", () => {
  it("ignores an empty id rather than pinning nothing", async () => {
    await expect(toggleFavouriteProject("")).resolves.toEqual([]);
  });
});
