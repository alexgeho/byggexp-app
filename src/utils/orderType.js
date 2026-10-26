// Kind of order a project is (project.orderType). "project" is the default and
// is never labelled on a card — only the others are worth a note.
export const ORDER_TYPES = [
  "project",
  "service",
  "installation",
  "jour",
  "garanti",
];

export const orderTypeNote = (project, t) =>
  project?.orderType && project.orderType !== "project"
    ? t(`projects.orderType.${project.orderType}`)
    : null;
