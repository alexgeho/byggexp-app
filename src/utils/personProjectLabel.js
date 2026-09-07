import { getEntityId } from "./entityId";

// Shared helpers for the third ("project") line on every person card
// (employees list, chat list, worker pickers). Single source of truth so the
// lists stay visually identical — same 3-row layout, same project resolution.

// id -> project name lookup from a list of projects.
export const buildProjectNameById = (projects = []) => {
  const map = new Map();
  projects.forEach((project) => {
    const id = getEntityId(project);
    if (id && project?.name) {
      map.set(id, project.name);
    }
  });
  return map;
};

// A person's project ids, from their own projectIds AND any project whose
// workers array lists them (covers both shapes the backend returns).
export const getPersonProjectIds = (person, projects = []) => {
  const ids = new Set();
  const personId = getEntityId(person);

  if (Array.isArray(person?.projectIds)) {
    person.projectIds.forEach((projectId) => {
      const normalizedId = getEntityId({ id: projectId });
      if (normalizedId) {
        ids.add(normalizedId);
      }
    });
  }

  projects.forEach((project) => {
    if (!Array.isArray(project?.workers)) {
      return;
    }
    const isAssigned = project.workers.some((worker) => {
      const workerId =
        typeof worker === "string" ? worker : worker?._id || worker?.id;
      return getEntityId({ id: workerId }) === personId;
    });
    if (isAssigned) {
      const projectId = getEntityId(project);
      if (projectId) {
        ids.add(projectId);
      }
    }
  });

  return [...ids];
};

const MAX_PROJECT_NAME_LENGTH = 35;

export const truncateProjectName = (name) => {
  if (!name || name.length <= MAX_PROJECT_NAME_LENGTH) {
    return name;
  }
  return `${name.slice(0, MAX_PROJECT_NAME_LENGTH - 3)}...`;
};

// Comma-joined, truncated project names for a person, or null if none.
export const getPersonProjectLabel = (
  person,
  projectNameById,
  projects = [],
) => {
  const projectNames = getPersonProjectIds(person, projects)
    .map((projectId) => truncateProjectName(projectNameById.get(projectId)))
    .filter(Boolean);
  return projectNames.length === 0 ? null : projectNames.join(", ");
};
