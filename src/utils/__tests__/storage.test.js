import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveToken,
  getToken,
  removeToken,
  saveRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  saveUser,
  getUser,
  removeUser,
  saveSelectedProject,
  getSelectedProject,
  removeSelectedProject,
} from "../storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("token storage", () => {
  it("round-trips and removes the jwt token", async () => {
    expect(await getToken()).toBeNull();
    await saveToken("jwt-abc");
    expect(await getToken()).toBe("jwt-abc");
    await removeToken();
    expect(await getToken()).toBeNull();
  });

  it("round-trips and removes the refresh token", async () => {
    await saveRefreshToken("refresh-xyz");
    expect(await getRefreshToken()).toBe("refresh-xyz");
    await removeRefreshToken();
    expect(await getRefreshToken()).toBeNull();
  });
});

describe("user storage", () => {
  it("serializes and restores the user object", async () => {
    expect(await getUser()).toBeNull();
    const user = { _id: "u1", name: "Roger", role: "companyAdmin" };
    await saveUser(user);
    expect(await getUser()).toEqual(user);
    await removeUser();
    expect(await getUser()).toBeNull();
  });
});

describe("selected project storage", () => {
  it("serializes and restores the selected project", async () => {
    expect(await getSelectedProject()).toBeNull();
    const project = { _id: "p1", name: "Villa Ek" };
    await saveSelectedProject(project);
    expect(await getSelectedProject()).toEqual(project);
    await removeSelectedProject();
    expect(await getSelectedProject()).toBeNull();
  });
});
