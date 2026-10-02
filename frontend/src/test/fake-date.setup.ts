import { vi } from "vitest";

// Meal plans are seeded by the calendar date, so a defect can sit hidden until
// the day a particular menu comes up. Fake only Date (timers stay real).
if (process.env.FAKE_DATE) {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(`${process.env.FAKE_DATE}T09:00:00Z`) });
}
