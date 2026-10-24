import type {
  BorrowBookInput,
  BorrowBookUseCase,
} from "@/application/borrow-book";

export type HttpRequest = Readonly<{ body: unknown }>;
export type HttpResponse = Readonly<{ status: number; body: unknown }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseInput(body: unknown): BorrowBookInput | null {
  if (
    !isRecord(body) ||
    typeof body.bookId !== "string" ||
    body.bookId.trim().length === 0 ||
    typeof body.memberId !== "string" ||
    body.memberId.trim().length === 0
  ) {
    return null;
  }

  return { bookId: body.bookId, memberId: body.memberId };
}

export class BorrowBookController {
  constructor(private readonly borrowBook: BorrowBookUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = parseInput(request.body);

    if (!input) {
      return { status: 400, body: { error: "invalid_request" } };
    }

    const result = await this.borrowBook.execute(input);

    if (result.ok) {
      return { status: 201, body: result };
    }

    if (
      result.reason === "book_not_found" ||
      result.reason === "member_not_found"
    ) {
      return { status: 404, body: { error: result.reason } };
    }

    return { status: 409, body: { error: result.reason } };
  }
}
