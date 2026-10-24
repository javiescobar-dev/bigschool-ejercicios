import { BorrowBookController } from "@/adapters/http/borrow-book-controller";
import { IncrementalIdGenerator } from "@/adapters/identity/incremental-id-generator";
import { InMemoryBorrowingRepository } from "@/adapters/persistence/in-memory-borrowing-repository";
import { FixedClock } from "@/adapters/time/fixed-clock";
import { BorrowBook } from "@/application/borrow-book";
import { Book } from "@/domain/book";
import { bookId, memberId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";
import { Member } from "@/domain/member";

const repository = new InMemoryBorrowingRepository({
  books: [Book.create(bookId("book-clean-code"), "Clean Code", 1)],
  members: [
    Member.create({
      id: memberId("member-ada"),
      membershipType: "standard",
    }),
  ],
});
const borrowBook = new BorrowBook(
  repository,
  new FixedClock(LocalDate.parse("2026-09-01")),
  new IncrementalIdGenerator(),
);
const controller = new BorrowBookController(borrowBook);

const response = await controller.handle({
  body: { bookId: "book-clean-code", memberId: "member-ada" },
});

console.log(response);
