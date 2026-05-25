export const GEOCODER_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
};

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
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      headers: GEOCODER_HEADERS,
    },
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.display_name || "";
};

export const searchAddressesWithNominatim = async (query, limit = 5) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`,
    {
      headers: GEOCODER_HEADERS,
    },
  );

  if (!response.ok) {
    throw new Error(`Address search failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const normalizeLocationSuggestions = (matches = []) => {
  const seenLabels = new Set();

  return matches.reduce((suggestions, match, index) => {
    const label = match?.display_name?.trim();
    const latitude = Number(match?.lat);
    const longitude = Number(match?.lon);

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
      id: String(match?.place_id || `${label}-${index}`),
      label,
      latitude,
      longitude,
    });

    return suggestions;
  }, []);
};

export const getCoordinateCacheKey = (latitude, longitude) =>
  `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
