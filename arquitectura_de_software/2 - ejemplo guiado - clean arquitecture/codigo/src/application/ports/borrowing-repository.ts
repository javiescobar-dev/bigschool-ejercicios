import type { Book } from "@/domain/book";
import type { BookId, MemberId } from "@/domain/identifiers";
import type { Loan } from "@/domain/loan";
import type { Member } from "@/domain/member";

export type BorrowingChanges = Readonly<{
  book: Book;
  member: Member;
  loan: Loan;
}>;

export interface BorrowingRepository {
  findBookById(id: BookId): Promise<Book | null>;
  findMemberById(id: MemberId): Promise<Member | null>;
  saveBorrowing(changes: BorrowingChanges): Promise<void>;
}
