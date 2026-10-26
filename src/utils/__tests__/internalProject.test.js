import {
  internalLast,
  isInternalProject,
  projectDisplayName,
  withoutInternal,
} from "../internalProject";

const site = { _id: "p1", name: "BRF Hamngatan 74" };
const intern = { _id: "p0", name: "Intern tid", internal: true };
const t = (key) => (key === "projects.internalTime" ? "Internal time" : key);

test("client lists leave Intern tid out", () => {
  expect(withoutInternal([intern, site])).toEqual([site]);
});

test("the shift picker shows Intern tid as the last row", () => {
  expect(internalLast([intern, site])).toEqual([site, intern]);
});

test("Intern tid is named in the user's language", () => {
  expect(isInternalProject(intern)).toBe(true);
  expect(projectDisplayName(intern, t)).toBe("Internal time");
  expect(projectDisplayName(site, t)).toBe("BRF Hamngatan 74");
});
