import { taskAssigneeLabel } from "../taskStatus";

describe("taskAssigneeLabel", () => {
  it("uses the single assignee", () => {
    expect(taskAssigneeLabel({ assigneeUserName: "Alex R" })).toBe("Alex R");
  });

  it("falls back to the chosen recipients", () => {
    expect(
      taskAssigneeLabel({
        notificationSettings: {
          assignees: [
            { id: "a1", name: "Adam" },
            { id: "r1", name: "Roger" },
          ],
        },
      }),
    ).toBe("Adam +1");
  });

  it("reads settings stored as JSON", () => {
    expect(
      taskAssigneeLabel({
        notificationSettings: JSON.stringify({
          assignees: [{ id: "a1", name: "Adam" }],
        }),
      }),
    ).toBe("Adam");
  });

  it("is empty for a whole-team task", () => {
    expect(taskAssigneeLabel({ notificationSettings: { assignees: [] } })).toBe(
      "",
    );
  });
});
