import { Alert } from "react-native";

import { enqueueShiftAlert, resetShiftAlertQueue } from "../shiftAlertQueue";

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}));

const dismissCurrentAlert = () => {
  const lastCall = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1];
  const buttons = lastCall[2];
  buttons[0].onPress();
};

beforeEach(() => {
  jest.clearAllMocks();
  resetShiftAlertQueue();
});

it("presents only one alert at a time", () => {
  enqueueShiftAlert({ key: "a", title: "First", message: "One" });
  enqueueShiftAlert({ key: "b", title: "Second", message: "Two" });

  expect(Alert.alert).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenCalledWith(
    "First",
    "One",
    expect.any(Array),
    expect.any(Object),
  );
});

it("presents the queued alert once the previous one is dismissed", () => {
  enqueueShiftAlert({ key: "a", title: "First", message: "One" });
  enqueueShiftAlert({ key: "b", title: "Second", message: "Two" });

  dismissCurrentAlert();

  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(Alert.alert.mock.calls[1][0]).toBe("Second");
});

it("collapses duplicate messages queued under the same key", () => {
  enqueueShiftAlert({
    key: "shift-auto-paused",
    title: "Paused",
    message: "x",
  });
  enqueueShiftAlert({
    key: "shift-auto-paused",
    title: "Paused",
    message: "x",
  });
  enqueueShiftAlert({
    key: "shift-auto-paused",
    title: "Paused",
    message: "x",
  });

  dismissCurrentAlert();

  expect(Alert.alert).toHaveBeenCalledTimes(1);
});

it("ignores an alert with neither title nor message", () => {
  enqueueShiftAlert({ key: "empty" });

  expect(Alert.alert).not.toHaveBeenCalled();
});
