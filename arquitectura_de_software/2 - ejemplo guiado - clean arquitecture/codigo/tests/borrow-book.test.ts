import { describe, expect, test } from "bun:test";
import { FixedClock } from "@/adapters/time/fixed-clock";
import { BorrowBook } from "@/application/borrow-book";
import type {
  BorrowingChanges,
  BorrowingRepository,
} from "@/application/ports/borrowing-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { Book } from "@/domain/book";
import {
  bookId,
  loanId,
  memberId,
  type BookId,
  type MemberId,
} from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";
import { Member } from "@/domain/member";

class RepositorySpy implements BorrowingRepository {
  savedChanges: BorrowingChanges | null = null;

  constructor(
    private readonly book: Book | null,
    private readonly member: Member | null,
  ) {}

  async findBookById(_id: BookId): Promise<Book | null> {
    return this.book;
  }

  async findMemberById(_id: MemberId): Promise<Member | null> {
    return this.member;
  }

  async saveBorrowing(changes: BorrowingChanges): Promise<void> {
    this.savedChanges = changes;
  }
}

const ids: IdGenerator = {
  nextLoanId: () => loanId("loan-42"),
};

function createUseCase(input?: {
  availableCopies?: number;
  activeLoanCount?: number;
  suspended?: boolean;
}): { useCase: BorrowBook; repository: RepositorySpy } {
  const repository = new RepositorySpy(
    Book.create(
      bookId("book-1"),
      "Domain-Driven Design",
      input?.availableCopies ?? 1,
    ),
    Member.create({
      id: memberId("member-1"),
      membershipType: "standard",
      ...(input?.activeLoanCount === undefined
        ? {}
        : { activeLoanCount: input.activeLoanCount }),
      ...(input?.suspended === undefined
        ? {}
        : { suspended: input.suspended }),
    }),
  );
  const useCase = new BorrowBook(
    repository,
    new FixedClock(LocalDate.parse("2026-09-01")),
    ids,
  );

  return { useCase, repository };
}

describe("BorrowBook", () => {
  test("persists the complete borrowing and returns its due date", async () => {
    const { useCase, repository } = createUseCase();

    const result = await useCase.execute({
      bookId: "book-1",
      memberId: "member-1",
    });

    expect(result).toEqual({
      ok: true,
      loanId: "loan-42",
      dueDate: "2026-09-15",
    });
    expect(repository.savedChanges?.book.availableCopies).toBe(0);
    expect(repository.savedChanges?.member.activeLoanCount).toBe(1);
  });

  test("does not persist when the book is unavailable", async () => {
    const { useCase, repository } = createUseCase({ availableCopies: 0 });

    const result = await useCase.execute({
      bookId: "book-1",
      memberId: "member-1",
    });

    expect(result).toEqual({ ok: false, reason: "book_unavailable" });
    expect(repository.savedChanges).toBeNull();
  });

  test("does not persist when the member reached the limit", async () => {
    const { useCase, repository } = createUseCase({ activeLoanCount: 3 });

    const result = await useCase.execute({
      bookId: "book-1",
      memberId: "member-1",
    });

    expect(result).toEqual({ ok: false, reason: "loan_limit_reached" });
    expect(repository.savedChanges).toBeNull();
  });
});
