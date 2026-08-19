// shiftConflict imports the services barrel + sentry at module load; the pure
// error-classifier under test uses neither, so stub them so the module loads.
import { isShiftAlreadyExistsError } from "../shiftConflict";

jest.mock("../../services", () => ({ shiftService: {} }));
jest.mock("../sentry", () => ({ captureException: jest.fn() }));

describe("isShiftAlreadyExistsError", () => {
  it("recognises a 409 conflict response", () => {
    expect(isShiftAlreadyExistsError({ response: { status: 409 } })).toBe(true);
  });

  it("recognises the backend 'already exists' / 'resume it' messages", () => {
    expect(
      isShiftAlreadyExistsError({
        response: {
          data: { message: "A shift for this project already exists today." },
        },
      }),
    ).toBe(true);
    expect(
      isShiftAlreadyExistsError({ message: "Please resume it instead" }),
    ).toBe(true);
  });

  it("is false for unrelated errors", () => {
    expect(
      isShiftAlreadyExistsError({
        response: { status: 500, data: { message: "Server error" } },
      }),
    ).toBe(false);
    expect(isShiftAlreadyExistsError({ message: "Network Error" })).toBe(false);
    expect(isShiftAlreadyExistsError(null)).toBe(false);
    expect(isShiftAlreadyExistsError({})).toBe(false);
  });
});
