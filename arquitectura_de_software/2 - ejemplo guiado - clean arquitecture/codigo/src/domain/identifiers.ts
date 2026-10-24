import { DomainRuleViolation } from "@/domain/domain-rule-violation";

export type BookId = string & { readonly __brand: "BookId" };
export type MemberId = string & { readonly __brand: "MemberId" };
export type LoanId = string & { readonly __brand: "LoanId" };

function createIdentifier<T extends string>(value: string, name: string): T {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new DomainRuleViolation(`${name} cannot be empty`);
  }

  return normalized as T;
}

export const bookId = (value: string): BookId =>
  createIdentifier<BookId>(value, "Book id");

export const memberId = (value: string): MemberId =>
  createIdentifier<MemberId>(value, "Member id");

export const loanId = (value: string): LoanId =>
  createIdentifier<LoanId>(value, "Loan id");
