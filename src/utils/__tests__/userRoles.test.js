import {
  USER_ROLES,
  canCreateProjects,
  canCreateTasks,
  canManageEmployees,
  canManageTasks,
  canCompleteTasks,
  getCreatableRoles,
  isUserAssignedToProject,
} from "../userRoles";

describe("userRoles permissions", () => {
  it("only superadmin/companyAdmin can create projects", () => {
    expect(canCreateProjects(USER_ROLES.SUPERADMIN)).toBe(true);
    expect(canCreateProjects(USER_ROLES.COMPANY_ADMIN)).toBe(true);
    expect(canCreateProjects(USER_ROLES.PROJECT_ADMIN)).toBe(false);
    expect(canCreateProjects(USER_ROLES.WORKER)).toBe(false);
  });

  it("management roles can manage employees, workers cannot", () => {
    expect(canManageEmployees(USER_ROLES.PROJECT_ADMIN)).toBe(true);
    expect(canManageEmployees(USER_ROLES.WORKER)).toBe(false);
  });

  it("workers can create and complete tasks but not manage them", () => {
    expect(canCreateTasks(USER_ROLES.WORKER)).toBe(true);
    expect(canCompleteTasks(USER_ROLES.WORKER)).toBe(true);
    expect(canManageTasks(USER_ROLES.WORKER)).toBe(false);
  });

  it("returns the roles each role may create", () => {
    expect(getCreatableRoles(USER_ROLES.PROJECT_ADMIN)).toEqual([
      USER_ROLES.WORKER,
    ]);
    expect(getCreatableRoles(USER_ROLES.WORKER)).toEqual([]);
    expect(getCreatableRoles("unknownRole")).toEqual([]);
  });
});

describe("isUserAssignedToProject", () => {
  it("matches owner, project admins and workers (id or populated object)", () => {
    const project = {
      ownerId: "owner1",
      workers: ["u1", { _id: "u2" }],
      projectAdmins: [{ id: "pa1" }],
    };
    expect(isUserAssignedToProject(project, "owner1")).toBe(true);
    expect(isUserAssignedToProject(project, "u1")).toBe(true);
    expect(isUserAssignedToProject(project, "u2")).toBe(true);
    expect(isUserAssignedToProject(project, "pa1")).toBe(true);
    expect(isUserAssignedToProject(project, "u9")).toBe(false);
  });

  it("is safe with missing data", () => {
    expect(isUserAssignedToProject(null, "u1")).toBe(false);
    expect(isUserAssignedToProject({ workers: [] }, null)).toBe(false);
  });
});
