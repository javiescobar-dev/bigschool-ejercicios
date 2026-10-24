import { LocalDate } from "@/domain/local-date";
import type { MembershipType } from "@/domain/member";

const LOAN_DURATION_DAYS: Readonly<Record<MembershipType, number>> = {
  standard: 14,
  premium: 28,
};

export class LoanPeriod {
  private constructor(
    readonly startsOn: LocalDate,
    readonly dueOn: LocalDate,
  ) {}

  static forMembership(
    startsOn: LocalDate,
    membershipType: MembershipType,
  ): LoanPeriod {
    return new LoanPeriod(
      startsOn,
      startsOn.plusDays(LOAN_DURATION_DAYS[membershipType]),
    );
  }
}
