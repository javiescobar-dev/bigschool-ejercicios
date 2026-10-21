import type { PlaceOrder, PlaceOrderInput } from "@/application/place-order";
import { DomainRuleViolation } from "@/domain/domain-rule-violation";

export type HttpRequest = Readonly<{ body: unknown }>;
export type HttpResponse = Readonly<{ status: number; body: unknown }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseInput(body: unknown): PlaceOrderInput | null {
  if (!isRecord(body) || typeof body.customerEmail !== "string") {
    return null;
  }

  if (!Array.isArray(body.lines)) {
    return null;
  }

  const lines = body.lines.flatMap((line) => {
    if (
      !isRecord(line) ||
      typeof line.productId !== "string" ||
      typeof line.quantity !== "number" ||
      typeof line.unitPriceCents !== "number"
    ) {
      return [];
    }

    return [
      {
        productId: line.productId,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
      },
    ];
  });

  if (lines.length !== body.lines.length) {
    return null;
  }

  return { customerEmail: body.customerEmail, lines };
}

export class PlaceOrderController {
  constructor(private readonly placeOrder: PlaceOrder) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = parseInput(request.body);

    if (!input) {
      return { status: 400, body: { error: "invalid_request" } };
    }

    try {
      const result = await this.placeOrder.execute(input);

      if (!result.ok) {
        return { status: 422, body: { error: result.reason } };
      }

      return { status: 201, body: result };
    } catch (error: unknown) {
      if (error instanceof DomainRuleViolation) {
        return {
          status: 422,
          body: { error: "business_rule_violation", message: error.message },
        };
      }

      throw error;
    }
  }
}
