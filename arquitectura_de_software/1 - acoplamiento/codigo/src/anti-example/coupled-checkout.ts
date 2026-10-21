type CheckoutRequest = {
  body: {
    customerEmail?: string;
    productId?: string;
    quantity?: number;
  };
};

type CheckoutResponse = {
  status: (code: number) => CheckoutResponse;
  json: (body: unknown) => void;
};

type DatabaseClient = {
  query: (sql: string, values: readonly unknown[]) => Promise<void>;
};

type PaymentSdk = {
  charge: (input: { amount: number; email: string }) => Promise<{ id: string }>;
};

export async function checkout(
  request: CheckoutRequest,
  response: CheckoutResponse,
  database: DatabaseClient,
  payments: PaymentSdk,
): Promise<void> {
  const { customerEmail, productId, quantity } = request.body;

  if (!customerEmail || !productId || !quantity || quantity < 1) {
    response.status(400).json({ error: "Invalid checkout" });
    return;
  }

  const unitPrice = 2_500;
  const total = unitPrice * quantity;
  const payment = await payments.charge({ amount: total, email: customerEmail });

  await database.query(
    "INSERT INTO orders (email, product_id, quantity, total, payment_id) VALUES (?, ?, ?, ?, ?)",
    [customerEmail, productId, quantity, total, payment.id],
  );

  response.status(201).json({ total });
}
