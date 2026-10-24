import type { BookId, LoanId, MemberId } from "@/domain/identifiers";
import type { LoanPeriod } from "@/domain/loan-period";

export class Loan {
  private constructor(
    readonly id: LoanId,
    readonly bookId: BookId,
    readonly memberId: MemberId,
    readonly period: LoanPeriod,
  ) {}

  static create(input: {
    id: LoanId;
    bookId: BookId;
    memberId: MemberId;
    period: LoanPeriod;
  }): Loan {
    return new Loan(input.id, input.bookId, input.memberId, input.period);
  }
}
