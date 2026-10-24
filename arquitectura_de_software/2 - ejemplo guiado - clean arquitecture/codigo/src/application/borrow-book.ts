import type { BorrowingRepository } from "@/application/ports/borrowing-repository";
import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { bookId, memberId } from "@/domain/identifiers";
import { Loan } from "@/domain/loan";
import { LoanPeriod } from "@/domain/loan-period";

export type BorrowBookInput = Readonly<{
  bookId: string;
  memberId: string;
}>;

export type BorrowBookResult =
  | {
      readonly ok: true;
      readonly loanId: string;
      readonly dueDate: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | "book_not_found"
        | "member_not_found"
        | "book_unavailable"
        | "member_suspended"
        | "loan_limit_reached";
    };

export interface BorrowBookUseCase {
  execute(input: BorrowBookInput): Promise<BorrowBookResult>;
}

export class BorrowBook implements BorrowBookUseCase {
  constructor(
    private readonly repository: BorrowingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: BorrowBookInput): Promise<BorrowBookResult> {
    const book = await this.repository.findBookById(bookId(input.bookId));

    if (!book) {
      return { ok: false, reason: "book_not_found" };
    }

    const member = await this.repository.findMemberById(
      memberId(input.memberId),
    );

    if (!member) {
      return { ok: false, reason: "member_not_found" };
    }

    const borrowedBook = book.borrowCopy();

    if (!borrowedBook.ok) {
      return borrowedBook;
    }

    const borrowingMember = member.registerLoan();

    if (!borrowingMember.ok) {
      return borrowingMember;
    }

    const period = LoanPeriod.forMembership(
      this.clock.today(),
      member.membershipType,
    );
    const loan = Loan.create({
      id: this.ids.nextLoanId(),
      bookId: book.id,
      memberId: member.id,
      period,
    });

    await this.repository.saveBorrowing({
      book: borrowedBook.book,
      member: borrowingMember.member,
      loan,
    });

    return {
      ok: true,
      loanId: loan.id,
      dueDate: period.dueOn.toString(),
    };
  }
}
