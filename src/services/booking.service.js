import { assignmentService } from "./assignment.service";
import { clientService } from "./client.service";
import { projectService } from "./project.service";
import { normalizeId } from "../utils/schedule";
import {
  buildClientBody,
  enumerateDayKeys,
  planBookingChanges,
} from "../utils/scheduleBooking";

const notEmpty = (object) =>
  Object.fromEntries(
    Object.entries(object || {}).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

// Documents / photos picked in the booking form go to the order's documents.
const uploadFiles = async (projectId, files) => {
  if (!projectId || !files?.length) return true;
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append("documents", {
      uri: file.uri,
      name: file.name || `booking-document-${index + 1}`,
      type: file.mimeType || "application/octet-stream",
    });
  });
  try {
    await projectService.uploadDocuments(projectId, formData);
    return true;
  } catch {
    return false;
  }
};

// Create or edit a work order from the calendar — the same steps as the web
// admin: client (existing or new), the order's own fields, then the workers'
// bookings for every day of the range.
//   editing       { projectId, assignments } when an existing booking is open
//   existingOrder a project to add this booking to (new booking only)
//   loose         bookings made without an order, opened from the calendar:
//                 they are not booked again, they move onto the order
// Returns { projectId, filesSaved }.
export const saveBooking = async ({
  editing = null,
  existingOrder = null,
  loose = [],
  title,
  order = {},
  clientId = null,
  newClient = null,
  address = "",
  from,
  to,
  weekdaysOnly = false,
  start,
  hours,
  workerIds = [],
  note = "",
  rows = [],
  files = [],
}) => {
  const noteField = note ? { note } : {};
  const days = enumerateDayKeys(from, to, weekdaysOnly);
  const book = (projectId, pairs) =>
    Promise.all(
      pairs.map(({ userId, date }) =>
        assignmentService
          .create({
            userId,
            projectId,
            date,
            hours,
            startTime: start,
            ...noteField,
          })
          .catch(() => null),
      ),
    );
  // Bookings that already exist change only by the difference: people taken
  // off and days outside the range go, new people / days come, the kept ones
  // get the new time and comment — and the order, when they had none.
  const sync = (projectId, existing, adopt = false) => {
    const { toCreate, toDelete, toUpdate } = planBookingChanges({
      existing,
      workerIds,
      days,
      from,
      to,
      start,
      hours,
      note,
    });
    const kept = existing.filter(
      (assignment) => !toDelete.includes(assignment),
    );
    return Promise.all([
      book(projectId, toCreate),
      ...toDelete.map((assignment) =>
        assignmentService.remove(normalizeId(assignment)).catch(() => null),
      ),
      ...(adopt ? kept : toUpdate).map((assignment) =>
        assignmentService
          .update(normalizeId(assignment), {
            ...(adopt ? { projectId } : {}),
            startTime: start,
            hours,
            note,
          })
          .catch(() => null),
      ),
    ]);
  };
  const bookAll = (projectId) =>
    loose.length
      ? sync(projectId, loose, true)
      : book(
          projectId,
          workerIds.flatMap((userId) => days.map((date) => ({ userId, date }))),
        );

  // Add this booking (time, crew, article) to an order that already exists.
  if (existingOrder && !editing) {
    const projectId = normalizeId(existingOrder);
    const changes = {};
    if (rows.length) {
      changes.orderRows = [...(existingOrder.orderRows || []), ...rows];
    }
    if ((order.littera || "") !== (existingOrder.littera || "")) {
      changes.littera = order.littera || "";
    }
    if (Object.keys(changes).length) {
      await projectService.update(projectId, changes);
    }
    await bookAll(projectId);
    return { projectId, filesSaved: await uploadFiles(projectId, files) };
  }

  let resolvedClientId = clientId;
  if (newClient) {
    const created = await clientService.create(buildClientBody(newClient));
    resolvedClientId = normalizeId(created);
  }
  const orderFields = notEmpty(order);

  if (editing) {
    // Only the order's own fields — one booking never rewrites a project's
    // team or dates.
    const { projectId } = editing;
    await projectService.update(projectId, {
      ...orderFields,
      name: title,
      location: address,
      orderRows: rows,
      clientId: resolvedClientId || null,
    });
    await sync(projectId, editing.assignments || []);
    return { projectId, filesSaved: await uploadFiles(projectId, files) };
  }

  const project = await projectService.create({
    orderType: "service",
    ...orderFields,
    name: title,
    beginningDate: from,
    endDate: to,
    workers: workerIds,
    location: address,
    orderRows: rows,
    clientId: resolvedClientId || null,
  });
  const projectId = normalizeId(project);
  await bookAll(projectId);
  return { projectId, filesSaved: await uploadFiles(projectId, files) };
};

// «Ta bort ordern»: the whole order goes — every booking on it, then the
// order itself.
export const deleteBookingOrder = async (projectId) => {
  const bookings = await assignmentService
    .getRange("2000-01-01", "2100-12-31", projectId)
    .catch(() => []);
  await Promise.all(
    bookings.map((assignment) =>
      assignmentService.remove(normalizeId(assignment)).catch(() => null),
    ),
  );
  await projectService.delete(projectId);
};
