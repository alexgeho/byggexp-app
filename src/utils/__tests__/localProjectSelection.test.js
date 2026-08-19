import {
  setLocalProjectSelectionHandler,
  resolveLocalProjectSelection,
} from "../localProjectSelection";

describe("localProjectSelection", () => {
  it("forwards the resolved project to the registered handler", () => {
    const handler = jest.fn();
    const project = { _id: "p1" };

    setLocalProjectSelectionHandler(handler);
    resolveLocalProjectSelection(project);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(project);
  });

  it("consumes the handler so it only fires once", () => {
    const handler = jest.fn();
    setLocalProjectSelectionHandler(handler);

    resolveLocalProjectSelection({ id: "a" });
    resolveLocalProjectSelection({ id: "b" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when no handler is registered", () => {
    setLocalProjectSelectionHandler(null);
    expect(() => resolveLocalProjectSelection({ id: "x" })).not.toThrow();
  });

  it("ignores a non-function handler", () => {
    setLocalProjectSelectionHandler("not a function");
    expect(() => resolveLocalProjectSelection({ id: "y" })).not.toThrow();
  });
});
