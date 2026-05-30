import projectService from "../services/project.service";

const HOUSE_NUMBER_PATTERN =
  /\b(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?(?:-\d+[a-zA-Z]?)?)\b/;

export const formatResolvedAddress = (address) => {
  if (!address) {
    return "";
  }

  const streetLine = [address.street, address.streetNumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  return [
    address.name,
    streetLine,
    address.city || address.subregion || address.region,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

export const extractHouseNumberFromQuery = (query = "") => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return "";
  }

  const matches = normalizedQuery.match(
    new RegExp(HOUSE_NUMBER_PATTERN.source, "g"),
  );

  if (!matches?.length) {
    return "";
  }

  return matches[matches.length - 1];
};

export const labelIncludesHouseNumber = (label = "", houseNumber = "") => {
  if (!label || !houseNumber) {
    return false;
  }

  return new RegExp(`\\b${houseNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
    label,
  );
};

export const enrichAddressLabelWithQueryHouseNumber = (label = "", query = "") => {
  const normalizedLabel = label.trim();
  const houseNumber = extractHouseNumberFromQuery(query);

  if (!normalizedLabel || !houseNumber) {
    return normalizedLabel;
  }

  if (labelIncludesHouseNumber(normalizedLabel, houseNumber)) {
    return normalizedLabel;
  }

  const [firstSegment, ...restSegments] = normalizedLabel.split(",");
  const streetLine = firstSegment.trim();

  if (!streetLine || HOUSE_NUMBER_PATTERN.test(streetLine)) {
    return normalizedLabel;
  }

  const enrichedFirstSegment = `${streetLine} ${houseNumber}`;
  return [enrichedFirstSegment, ...restSegments].join(", ").trim();
};

export const reverseGeocodeWithNominatim = async (latitude, longitude) => {
  const data = await projectService.reverseGeocode(latitude, longitude);
  return data?.label || "";
};

export const searchAddressesWithNominatim = async (query, limit = 5) => {
  const data = await projectService.searchAddressSuggestions(query, limit);
  return Array.isArray(data) ? data : [];
};

export const normalizeLocationSuggestions = (matches = []) => {
  const seenLabels = new Set();

  return matches.reduce((suggestions, match, index) => {
    const label =
      match?.label?.trim?.() || match?.display_name?.trim();
    const latitude = Number(match?.latitude ?? match?.lat);
    const longitude = Number(match?.longitude ?? match?.lon);

    if (
      !label ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      seenLabels.has(label)
    ) {
      return suggestions;
    }

    seenLabels.add(label);
    suggestions.push({
      id: String(match?.id || match?.place_id || `${label}-${index}`),
      label,
      latitude,
      longitude,
    });

    return suggestions;
  }, []);
};

export const getCoordinateCacheKey = (latitude, longitude) =>
  `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
