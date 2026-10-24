import { describe, expect, test } from "bun:test";
import { Book } from "@/domain/book";
import { bookId } from "@/domain/identifiers";

describe("Book", () => {
  test("returns an updated copy when one is available", () => {
    const book = Book.create(bookId("book-1"), "Refactoring", 1);

    const result = book.borrowCopy();

    expect(result.ok).toBe(true);
    expect(book.availableCopies).toBe(1);
    if (result.ok) expect(result.book.availableCopies).toBe(0);
  });

  test("rejects borrowing when no copy is available", () => {
    const book = Book.create(bookId("book-1"), "Refactoring", 0);

    expect(book.borrowCopy()).toEqual({
      ok: false,
      reason: "book_unavailable",
    });
  });
});
