import type { LoanId } from "@/domain/identifiers";

export interface IdGenerator {
  nextLoanId(): LoanId;
}
