import { getApiErrorMessage } from "../apiError";

describe("getApiErrorMessage", () => {
  it("returns a plain string message from the backend", () => {
    const error = { response: { data: { message: "Not allowed" } } };
    expect(getApiErrorMessage(error, "fallback")).toBe("Not allowed");
  });

  it("joins an array of validation messages", () => {
    const error = {
      response: { data: { message: ["name is required", "email invalid"] } },
    };
    expect(getApiErrorMessage(error, "fallback")).toBe(
      "name is required, email invalid",
    );
  });

  it("falls back to the axios error message when there is no response body", () => {
    const error = { message: "Network Error" };
    expect(getApiErrorMessage(error, "fallback")).toBe("Network Error");
  });

  it("uses the caller fallback when nothing else is available", () => {
    expect(getApiErrorMessage({}, "Something went wrong")).toBe(
      "Something went wrong",
    );
    expect(getApiErrorMessage(null, "Something went wrong")).toBe(
      "Something went wrong",
    );
  });

  it("prefers the backend message over the axios message", () => {
    const error = {
      response: { data: { message: "Forbidden" } },
      message: "Request failed with status code 403",
    };
    expect(getApiErrorMessage(error, "fallback")).toBe("Forbidden");
  });
});
