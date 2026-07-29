// Pure calendar-grid helpers for the shifts screen. No i18n / network /
// storage dependencies so the logic stays unit-testable in isolation.

export const getISOWeekNumber = (date) => {
  const normalizedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayNum = normalizedDate.getDay() || 7;
  normalizedDate.setDate(normalizedDate.getDate() + 4 - dayNum);
  const yearStart = new Date(normalizedDate.getFullYear(), 0, 1);

  return Math.ceil(((normalizedDate - yearStart) / 86400000 + 1) / 7);
};

export const getCalendarWeekNumber = (
  year,
  month,
  firstDayIndex,
  rowStartCellIndex,
) => {
  const mondayOffsetFromFirst = rowStartCellIndex - firstDayIndex;
  const mondayDate = new Date(year, month - 1, 1 + mondayOffsetFromFirst);

  return getISOWeekNumber(mondayDate);
};

// Build the month grid for the shifts calendar from a "YYYY-MM" key.
// Returns Monday-first weeks padded with nulls, plus per-column and
// per-row date lists that back the column/row bulk-selection toggles.
export const buildCalendarLayout = (selectedMonth) => {
  if (!selectedMonth) {
    return { columnDates: [], rowDates: [], rows: [] };
  }

  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${selectedMonth}-${day.toString().padStart(2, "0")}`);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const columnDates = Array.from({ length: 7 }, () => []);
  const rowDates = [];

  for (let rowIndex = 0; rowIndex < cells.length / 7; rowIndex += 1) {
    const rowStartIndex = rowIndex * 7;
    const datesInRow = [];

    for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
      const dateStr = cells[rowStartIndex + columnIndex];
      if (dateStr) {
        columnDates[columnIndex].push(dateStr);
        datesInRow.push(dateStr);
      }
    }

    rowDates.push(datesInRow);
  }

  const rows = [];
  for (let rowIndex = 0; rowIndex < cells.length / 7; rowIndex += 1) {
    const rowStartIndex = rowIndex * 7;
    const weekNumber = getCalendarWeekNumber(
      year,
      month,
      firstDayIndex,
      rowStartIndex,
    );

    rows.push({
      rowIndex,
      weekNumber,
      cells: cells.slice(rowStartIndex, rowStartIndex + 7),
    });
  }

  return { columnDates, rowDates, rows };
};
