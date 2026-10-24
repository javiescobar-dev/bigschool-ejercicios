import { describe, expect, test } from "bun:test";
import { BorrowBookController } from "@/adapters/http/borrow-book-controller";
import type {
  BorrowBookInput,
  BorrowBookResult,
  BorrowBookUseCase,
} from "@/application/borrow-book";

class BorrowBookStub implements BorrowBookUseCase {
  constructor(private readonly result: BorrowBookResult) {}

  async execute(_input: BorrowBookInput): Promise<BorrowBookResult> {
    return this.result;
  }
}

describe("BorrowBookController", () => {
  test("rejects invalid transport input", async () => {
    const controller = new BorrowBookController(
      new BorrowBookStub({ ok: false, reason: "book_not_found" }),
    );

    const response = await controller.handle({ body: { bookId: "book-1" } });

    expect(response).toEqual({
      status: 400,
      body: { error: "invalid_request" },
    });
  });

  test("maps a successful borrowing to HTTP 201", async () => {
    const controller = new BorrowBookController(
      new BorrowBookStub({
        ok: true,
        loanId: "loan-1",
        dueDate: "2026-09-15",
      }),
    );

    const response = await controller.handle({
      body: { bookId: "book-1", memberId: "member-1" },
    });

    expect(response.status).toBe(201);
  });

  test("maps a business conflict to HTTP 409", async () => {
    const controller = new BorrowBookController(
      new BorrowBookStub({ ok: false, reason: "member_suspended" }),
    );

    const response = await controller.handle({
      body: { bookId: "book-1", memberId: "member-1" },
    });

    expect(response).toEqual({
      status: 409,
      body: { error: "member_suspended" },
    });
  });
});
