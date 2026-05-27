import projectService from "../services/project.service";

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
