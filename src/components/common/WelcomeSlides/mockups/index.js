import React from "react";

import { WorkerTimeMock } from "./WorkerTimeMock";
import { ArbetspassMock } from "./ArbetspassMock";
import { EmployeesMock } from "./EmployeesMock";
import { NotificationMock } from "./NotificationMock";
import { PhotosMock } from "./PhotosMock";
import { CostsMock } from "./CostsMock";
import { DocumentsMock } from "./DocumentsMock";
import { ReceiptMock } from "./ReceiptMock";

// Maps a slide's `illustration` key (see WelcomeSlides SLIDES_BY_ROLE) to its
// rebuilt React Native mockup.
const MOCKUPS = {
  workerTime: WorkerTimeMock,
  arbetspass: ArbetspassMock,
  employees: EmployeesMock,
  notification: NotificationMock,
  photos: PhotosMock,
  costs: CostsMock,
  documents: DocumentsMock,
  receipt: ReceiptMock,
};

export function Mockup({ name }) {
  const Component = MOCKUPS[name];
  return Component ? <Component /> : null;
}
