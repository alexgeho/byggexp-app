// «Intern tid»: every company has one internal project (project.internal) for
// time spent off a client's site — grossist, warehouse, van service, ID06
// training. Its hours go to payroll, never to an invoice. It has no address,
// so no geofence.

export const isInternalProject = (project) => Boolean(project?.internal);

export const withoutInternal = (projects) =>
  Array.isArray(projects)
    ? projects.filter((project) => !isInternalProject(project))
    : projects;

// Client projects first, Intern tid as the last row.
export const internalLast = (projects) =>
  Array.isArray(projects)
    ? [
        ...projects.filter((project) => !isInternalProject(project)),
        ...projects.filter(isInternalProject),
      ]
    : projects;

// The backend names it in Swedish; show it in the user's language.
export const projectDisplayName = (project, t) =>
  isInternalProject(project) ? t("projects.internalTime") : project?.name || "";
