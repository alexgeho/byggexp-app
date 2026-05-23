const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const resolveNewestTimestamp = (...values) => {
  for (const value of values) {
    const timestamp = toTimestamp(value);
    if (timestamp > 0) {
      return timestamp;
    }
  }

  return 0;
};

export const sortByNewest = (items, getComparableValues) =>
  [...items].sort((leftItem, rightItem) => {
    const leftValues = getComparableValues(leftItem);
    const rightValues = getComparableValues(rightItem);

    const leftTimestamp = Array.isArray(leftValues)
      ? resolveNewestTimestamp(...leftValues)
      : resolveNewestTimestamp(leftValues);
    const rightTimestamp = Array.isArray(rightValues)
      ? resolveNewestTimestamp(...rightValues)
      : resolveNewestTimestamp(rightValues);

    return rightTimestamp - leftTimestamp;
  });
