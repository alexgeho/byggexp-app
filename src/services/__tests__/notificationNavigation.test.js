// Tapping a push on a cold start: the tap arrives while the login stack is up.
// It must wait for the target screen instead of being dropped (→ Home).

let mockRouteNames = [];
let mockReady = false;
const mockNavigate = jest.fn();
let mockListener = null;

jest.mock("../../navigation/navigationRef", () => ({
  isNavigationReady: () => mockReady,
  navigate: (name, params) => {
    if (!mockReady) return false;
    mockNavigate(name, params);
    return true;
  },
  navigationRef: { getRootState: () => ({ routeNames: mockRouteNames }) },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: (cb) => {
    mockListener = cb;
    return { remove: jest.fn() };
  },
  getLastNotificationResponseAsync: () => Promise.resolve(null),
  clearLastNotificationResponseAsync: () => Promise.resolve(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock("expo-constants", () => ({}));
jest.mock("expo-device", () => ({}));
jest.mock("../api", () => ({}));
jest.mock("../user-activity.service", () => ({ logUserActivity: jest.fn() }));

const {
  initializeNotificationListeners,
  flushPendingNotificationNavigation,
} = require("../notifications.service");

const tap = (data) =>
  mockListener({ notification: { request: { content: { data } } } });

const bill = {
  type: "supplier_invoice_due",
  screen: "Economy",
  entityId: "inv1",
};

beforeEach(() => {
  mockNavigate.mockClear();
});

test("cold start: waits for the app stack, then opens the bill", async () => {
  initializeNotificationListeners();
  mockReady = true;
  mockRouteNames = ["Login", "Register"];
  await tap(bill);
  flushPendingNotificationNavigation();
  expect(mockNavigate).not.toHaveBeenCalled();

  mockRouteNames = ["Main", "SupplierInvoices"];
  flushPendingNotificationNavigation();
  expect(mockNavigate).toHaveBeenCalledWith("SupplierInvoices", {
    entityId: "inv1",
  });
});

test("app already open: navigates straight away", async () => {
  mockReady = true;
  mockRouteNames = ["Main", "SupplierInvoices"];
  await tap(bill);
  expect(mockNavigate).toHaveBeenCalledWith("SupplierInvoices", {
    entityId: "inv1",
  });
});

test("material order push opens the order, marked as from a push", async () => {
  mockReady = true;
  mockRouteNames = ["Main", "MaterialOrder"];
  await tap({
    type: "material_order_sent",
    screen: "MaterialOrder",
    entityId: "o1",
    projectId: "p1",
  });
  expect(mockNavigate).toHaveBeenCalledWith("MaterialOrder", {
    orderId: "o1",
    projectId: "p1",
    fromPush: true,
  });
});
