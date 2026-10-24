import type {
  BorrowingChanges,
  BorrowingRepository,
} from "@/application/ports/borrowing-repository";
import type { Book } from "@/domain/book";
import type { BookId, LoanId, MemberId } from "@/domain/identifiers";
import type { Loan } from "@/domain/loan";
import type { Member } from "@/domain/member";

export class InMemoryBorrowingRepository implements BorrowingRepository {
  private readonly books = new Map<BookId, Book>();
  private readonly members = new Map<MemberId, Member>();
  private readonly loans = new Map<LoanId, Loan>();

  constructor(seed?: { books?: readonly Book[]; members?: readonly Member[] }) {
    for (const book of seed?.books ?? []) {
      this.books.set(book.id, book);
    }

    for (const member of seed?.members ?? []) {
      this.members.set(member.id, member);
    }
  }

  async findBookById(id: BookId): Promise<Book | null> {
    return this.books.get(id) ?? null;
  }

  async findMemberById(id: MemberId): Promise<Member | null> {
    return this.members.get(id) ?? null;
  }

  async saveBorrowing(changes: BorrowingChanges): Promise<void> {
    this.books.set(changes.book.id, changes.book);
    this.members.set(changes.member.id, changes.member);
    this.loans.set(changes.loan.id, changes.loan);
  }

  async findLoanById(id: LoanId): Promise<Loan | null> {
    return this.loans.get(id) ?? null;
  }
}
