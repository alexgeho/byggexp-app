export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  COMPANY_ADMIN: "companyAdmin",
  PROJECT_ADMIN: "projectAdmin",
  WORKER: "worker",
};

const ROLE_LABELS = {
  [USER_ROLES.SUPERADMIN]: "Super Admin",
  [USER_ROLES.COMPANY_ADMIN]: "Company Admin",
  [USER_ROLES.PROJECT_ADMIN]: "Project Admin",
  [USER_ROLES.WORKER]: "Worker",
};

const CREATABLE_ROLES_BY_ROLE = {
  [USER_ROLES.SUPERADMIN]: [
    USER_ROLES.WORKER,
    USER_ROLES.PROJECT_ADMIN,
    USER_ROLES.COMPANY_ADMIN,
    USER_ROLES.SUPERADMIN,
  ],
  [USER_ROLES.COMPANY_ADMIN]: [
    USER_ROLES.WORKER,
    USER_ROLES.PROJECT_ADMIN,
  ],
  [USER_ROLES.PROJECT_ADMIN]: [USER_ROLES.WORKER],
  [USER_ROLES.WORKER]: [],
};

const MANAGEMENT_ROLES = [
  USER_ROLES.SUPERADMIN,
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.PROJECT_ADMIN,
];

function hasRole(role, allowedRoles) {
  return allowedRoles.includes(role);
}

function getEntityId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || null;
}

export function canManageEmployees(role) {
  return hasRole(role, MANAGEMENT_ROLES);
}

/** Create projects — backend: SuperAdmin, CompanyAdmin only */
export function canCreateProjects(role) {
  return hasRole(role, [USER_ROLES.SUPERADMIN, USER_ROLES.COMPANY_ADMIN]);
}

/** Update projects, workers, project documents — backend includes ProjectAdmin */
export function canManageProjects(role) {
  return hasRole(role, MANAGEMENT_ROLES);
}

/** Create / update / delete tasks, reopen, upload task docs */
export function canCreateTasks(role) {
  return hasRole(role, MANAGEMENT_ROLES);
}

export function canManageTasks(role) {
  return canCreateTasks(role);
}

export function canReopenTasks(role) {
  return canManageTasks(role);
}

/** Workers can mark tasks complete */
export function canCompleteTasks(role) {
  return hasRole(role, [...MANAGEMENT_ROLES, USER_ROLES.WORKER]);
}

export function canManageTools(role) {
  return hasRole(role, MANAGEMENT_ROLES);
}

export function canManageWorkers(role) {
  return hasRole(role, [USER_ROLES.COMPANY_ADMIN, USER_ROLES.PROJECT_ADMIN]);
}

export function canManageDocuments(role) {
  return hasRole(role, MANAGEMENT_ROLES);
}

export function getCreatableRoles(role) {
  return CREATABLE_ROLES_BY_ROLE[role] || [];
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "User";
}

export const USER_ACCOUNT_STATUS = {
  WAITING_FOR_APPROVAL: "waiting_for_approval",
  ACTIVE: "active",
};

export function shouldShowAccountStatus(status) {
  return status === USER_ACCOUNT_STATUS.WAITING_FOR_APPROVAL;
}

export function getAccountStatusLabel(status) {
  if (status === USER_ACCOUNT_STATUS.WAITING_FOR_APPROVAL) {
    return "Waiting for approval";
  }

  return null;
}

export function getCreatableRoleOptions(role) {
  return getCreatableRoles(role).map((value) => ({
    value,
    label: getRoleLabel(value),
  }));
}

/**
 * Matches backend project membership used by findAllByUser /
 * shift & task access for projectAdmin and worker.
 */
export function isUserAssignedToProject(project, userId) {
  if (!project || !userId) {
    return false;
  }

  const normalizedUserId = String(userId);

  const matches = (value) => {
    const id = getEntityId(value);
    return id != null && String(id) === normalizedUserId;
  };

  if (matches(project.ownerId) || matches(project.projectManagerId)) {
    return true;
  }

  if (Array.isArray(project.projectAdmins) && project.projectAdmins.some(matches)) {
    return true;
  }

  if (Array.isArray(project.workers) && project.workers.some(matches)) {
    return true;
  }

  return false;
}

export function isHomeButtonVisible(button, enabledButtonIds, userRole) {
  if (button.id === "next") {
    return false;
  }

  if (!enabledButtonIds.includes(button.id)) {
    return false;
  }

  if (button.adminOnly && !canManageEmployees(userRole)) {
    return false;
  }

  return true;
}

export function isHomeButtonCustomizable(button, userRole) {
  if (button.adminOnly && !canManageEmployees(userRole)) {
    return false;
  }

  return true;
}
