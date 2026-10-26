// Material order drafts: rows picked from the company's article register.
// Only articles that came from a grossist price list (supplier set) can be
// ordered, and one order goes to one supplier.

export const isOrderable = (article) =>
  article?.active !== false && Boolean(String(article?.supplier || "").trim());

export const articleToRow = (article) => ({
  articleId: article._id || article.id,
  articleNumber: article.articleNumber || "",
  name: article.name || "",
  unit: article.unit || "st",
  quantity: 1,
});

// Adding an article already on the order bumps its quantity instead of
// adding a second row.
export const addArticle = (rows, article) => {
  const row = articleToRow(article);
  const existing = rows.findIndex((r) => r.articleId === row.articleId);
  if (existing === -1) return [...rows, row];
  return rows.map((r, i) =>
    i === existing ? { ...r, quantity: r.quantity + 1 } : r,
  );
};

export const setQuantity = (rows, index, quantity) => {
  const next = Math.max(0, Number(quantity) || 0);
  return next === 0
    ? rows.filter((_, i) => i !== index)
    : rows.map((r, i) => (i === index ? { ...r, quantity: next } : r));
};

// A worker may change or delete an order only while it is their own draft;
// a sent order (or a colleague's) is read-only.
export const canEditOrder = (order, userId) =>
  !order ||
  (order.status !== "sent" &&
    Boolean(userId) &&
    String(order.createdBy?._id || order.createdBy) === String(userId));

// The wanted date as a local date (the API returns midnight UTC).
export const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : null;
};

// YYYY-MM-DD in local time, so "tomorrow" is the worker's tomorrow.
export const toDateOnly = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// The backend fills art.nr, name and unit from the register by articleId, and
// takes the company from the token and always saves a draft.
export const buildOrderPayload = ({
  projectId,
  supplier,
  rows,
  desiredDate,
  comment,
}) => ({
  projectId,
  supplier,
  rows: rows.map(({ articleId, quantity }) => ({ articleId, quantity })),
  desiredDate: desiredDate ? toDateOnly(desiredDate) : undefined,
  comment: comment?.trim() || undefined,
});
