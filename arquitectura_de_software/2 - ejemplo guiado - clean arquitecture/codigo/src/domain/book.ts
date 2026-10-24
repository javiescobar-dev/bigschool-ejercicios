import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import type { BookId } from "@/domain/identifiers";

export type BorrowCopyResult =
  | { readonly ok: true; readonly book: Book }
  | { readonly ok: false; readonly reason: "book_unavailable" };

export class Book {
  private constructor(
    readonly id: BookId,
    readonly title: string,
    readonly availableCopies: number,
  ) {}

  static create(id: BookId, title: string, availableCopies: number): Book {
    if (title.trim().length === 0) {
      throw new DomainRuleViolation("Book title cannot be empty");
    }

    if (!Number.isSafeInteger(availableCopies) || availableCopies < 0) {
      throw new DomainRuleViolation(
        "Available copies must be a non-negative integer",
      );
    }

    return new Book(id, title.trim(), availableCopies);
  }

  borrowCopy(): BorrowCopyResult {
    if (this.availableCopies === 0) {
      return { ok: false, reason: "book_unavailable" };
    }

    return {
      ok: true,
      book: new Book(this.id, this.title, this.availableCopies - 1),
    };
  }
}
