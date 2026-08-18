import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchAddressesWithNominatim,
  normalizeLocationSuggestions,
  enrichAddressLabelWithQueryHouseNumber,
} from "../utils/projectLocationSearch";

// Debounced address autocomplete (Nominatim). While `enabled`, it searches
// `query` after a 250ms debounce (queries under 2 chars clear the list) and
// keeps only the latest in-flight request via a request-id guard, so stale
// responses never overwrite fresher ones. Returns the current suggestions,
// a loading flag, and a clear() for when the caller picks or closes.
//
// Note: going from enabled -> disabled intentionally leaves the last
// suggestions in place; call clearSuggestions() to wipe them.
export const useAddressSearch = (query, enabled) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const clearSuggestions = useCallback(() => {
    requestIdRef.current += 1;
    setSuggestions([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const normalizedQuery = (query || "").trim();
    if (normalizedQuery.length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const debounceId = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const matches = await searchAddressesWithNominatim(normalizedQuery, 2);
        const nextSuggestions = normalizeLocationSuggestions(matches).map(
          function enrichSuggestion(suggestion) {
            return {
              ...suggestion,
              label: enrichAddressLabelWithQueryHouseNumber(
                suggestion.label,
                normalizedQuery,
              ),
            };
          },
        );

        if (requestIdRef.current === requestId) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setSuggestions([]);
        }
        console.error("Failed to search project addresses:", error);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(debounceId);
  }, [enabled, query]);

  return { suggestions, loading, clearSuggestions };
};
