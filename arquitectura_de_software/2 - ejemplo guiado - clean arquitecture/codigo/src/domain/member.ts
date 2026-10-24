import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import type { MemberId } from "@/domain/identifiers";

export type MembershipType = "standard" | "premium";

export type RegisterLoanResult =
  | { readonly ok: true; readonly member: Member }
  | {
      readonly ok: false;
      readonly reason: "member_suspended" | "loan_limit_reached";
    };

const ACTIVE_LOAN_LIMIT: Readonly<Record<MembershipType, number>> = {
  standard: 3,
  premium: 5,
};

export class Member {
  private constructor(
    readonly id: MemberId,
    readonly membershipType: MembershipType,
    readonly activeLoanCount: number,
    readonly suspended: boolean,
  ) {}

  static create(input: {
    id: MemberId;
    membershipType: MembershipType;
    activeLoanCount?: number;
    suspended?: boolean;
  }): Member {
    const activeLoanCount = input.activeLoanCount ?? 0;

    if (!Number.isSafeInteger(activeLoanCount) || activeLoanCount < 0) {
      throw new DomainRuleViolation(
        "Active loan count must be a non-negative integer",
      );
    }

    return new Member(
      input.id,
      input.membershipType,
      activeLoanCount,
      input.suspended ?? false,
    );
  }

  registerLoan(): RegisterLoanResult {
    if (this.suspended) {
      return { ok: false, reason: "member_suspended" };
    }

    if (this.activeLoanCount >= ACTIVE_LOAN_LIMIT[this.membershipType]) {
      return { ok: false, reason: "loan_limit_reached" };
    }

    return {
      ok: true,
      member: new Member(
        this.id,
        this.membershipType,
        this.activeLoanCount + 1,
        this.suspended,
      ),
    };
  }
}
