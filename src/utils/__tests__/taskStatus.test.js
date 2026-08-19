import { getTaskDisplayStatus } from "../taskStatus";

describe("getTaskDisplayStatus", () => {
  it("reports completed tasks regardless of due date", () => {
    expect(getTaskDisplayStatus({ status: "completed" })).toEqual({
      label: "Completed",
      tone: "completed",
    });
    expect(
      getTaskDisplayStatus({ status: "completed", dueDate: "2000-01-01" }),
    ).toEqual({ label: "Completed", tone: "completed" });
  });

  it("marks a past-due, non-completed task as overdue", () => {
    expect(getTaskDisplayStatus({ dueDate: "2000-01-01" })).toEqual({
      label: "Overdue",
      tone: "overdue",
    });
  });

  it("treats future / missing / unparseable due dates as open", () => {
    expect(getTaskDisplayStatus({ dueDate: "2999-01-01" })).toEqual({
      label: "Open",
      tone: "open",
    });
    expect(getTaskDisplayStatus({})).toEqual({ label: "Open", tone: "open" });
    expect(getTaskDisplayStatus({ dueDate: "not-a-date" })).toEqual({
      label: "Open",
      tone: "open",
    });
  });
});
