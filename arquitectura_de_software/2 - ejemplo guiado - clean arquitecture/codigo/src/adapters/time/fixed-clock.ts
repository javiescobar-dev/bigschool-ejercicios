import type { Clock } from "@/application/ports/clock";
import { LocalDate } from "@/domain/local-date";

export class FixedClock implements Clock {
  constructor(private readonly date: LocalDate) {}

  today(): LocalDate {
    return this.date;
  }
}
