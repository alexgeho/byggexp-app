import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { companyService } from "../services";

// Day-report fields the employer switched off (company.hiddenReportFields):
// overtime, ob, travel, mileage, perDiem, absence, photos, receipts. Empty =
// all shown; hours are always shown. Cached for the session so the card never
// flashes rows in and out, refreshed every time the screen comes into focus.
let cached = [];

export default function useHiddenReportFields() {
  const [hidden, setHidden] = useState(cached);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.resolve()
        .then(() => companyService.getMyCompany())
        .then((company) => {
          cached = Array.isArray(company?.hiddenReportFields)
            ? company.hiddenReportFields
            : [];
          if (active) setHidden(cached);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  return hidden;
}
