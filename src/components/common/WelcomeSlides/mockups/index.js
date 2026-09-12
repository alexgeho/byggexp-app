import React from "react";

import { CalendarMock } from "./CalendarMock";
import { EmployeesMock } from "./EmployeesMock";
import { NotificationMock } from "./NotificationMock";
import { PhotosMock } from "./PhotosMock";
import { CostsMock } from "./CostsMock";
import { DocumentsMock } from "./DocumentsMock";

// Maps a slide's `illustration` key (see WelcomeSlides SLIDES_BY_ROLE) to its
// rebuilt React Native mockup.
const MOCKUPS = {
  calendar: CalendarMock,
  employees: EmployeesMock,
  notification: NotificationMock,
  photos: PhotosMock,
  costs: CostsMock,
  documents: DocumentsMock,
};

export function Mockup({ name }) {
  const Component = MOCKUPS[name];
  return Component ? <Component /> : null;
}
