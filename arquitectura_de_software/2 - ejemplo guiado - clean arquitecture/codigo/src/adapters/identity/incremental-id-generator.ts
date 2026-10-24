import type { IdGenerator } from "@/application/ports/id-generator";
import { loanId, type LoanId } from "@/domain/identifiers";

export class IncrementalIdGenerator implements IdGenerator {
  private current = 0;

  nextLoanId(): LoanId {
    this.current += 1;
    return loanId(`loan-${this.current}`);
  }
}
