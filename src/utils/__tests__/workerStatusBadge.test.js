import {
  isWorkerAtWork,
  statusBadgeFor,
  getWorkerStatusBadge,
} from "../workerStatusBadge";
import { USER_ACCOUNT_STATUS } from "../userRoles";

const t = (key) => key;
const c = {
  statusWaitingSoft: "wsoft",
  statusWaiting: "w",
  statusAtWorkSoft: "asoft",
  statusAtWork: "a",
  statusOffDutySoft: "osoft",
  statusOffDuty: "o",
  statusNotAtWorkSoft: "nsoft",
  statusNotAtWork: "n",
};

describe("isWorkerAtWork", () => {
  it("is true for a working worker when no project is specified", () => {
    expect(isWorkerAtWork({ workStatus: "working" })).toBe(true);
  });

  it("is true only when the working project matches", () => {
    const worker = { workStatus: "working", workStatusProjectId: "p1" };
    expect(isWorkerAtWork(worker, "p1")).toBe(true);
    expect(isWorkerAtWork(worker, "p2")).toBe(false);
  });

  it("is false for a non-working or missing worker", () => {
    expect(isWorkerAtWork({ workStatus: "off" })).toBe(false);
    expect(isWorkerAtWork(null)).toBe(false);
  });
});

describe("statusBadgeFor", () => {
  it("maps each status kind to its label + theme colors", () => {
    expect(statusBadgeFor("waiting", t, c)).toEqual({
      label: "employees.waitingApproval",
      backgroundColor: "wsoft",
      color: "w",
    });
    expect(statusBadgeFor("at_work", t, c)).toEqual({
      label: "• employees.atWork",
      backgroundColor: "asoft",
      color: "a",
    });
    expect(statusBadgeFor("off_duty", t, c)).toEqual({
      label: "• employees.offDuty",
      backgroundColor: "osoft",
      color: "o",
    });
  });

  it("falls back to not-at-work for an unknown kind", () => {
    expect(statusBadgeFor("something-else", t, c)).toEqual({
      label: "• employees.notAtWork",
      backgroundColor: "nsoft",
      color: "n",
    });
  });
});

describe("getWorkerStatusBadge", () => {
  it("shows the waiting badge for accounts pending approval", () => {
    const worker = {
      accountStatus: USER_ACCOUNT_STATUS.WAITING_FOR_APPROVAL,
    };
    expect(getWorkerStatusBadge(worker, null, t, c).label).toBe(
      "employees.waitingApproval",
    );
  });

  it("shows at-work vs not-at-work based on the live work status", () => {
    expect(
      getWorkerStatusBadge({ workStatus: "working" }, null, t, c).label,
    ).toBe("• employees.atWork");
    expect(getWorkerStatusBadge({ workStatus: "off" }, null, t, c).label).toBe(
      "• employees.notAtWork",
    );
  });
});
