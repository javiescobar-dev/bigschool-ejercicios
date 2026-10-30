import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";
import { EmployeeId } from "@/domain/value-objects/employee-id";

const RESULTS = ["approved", "rejected"] as const;
export type ResultType = (typeof RESULTS)[number];

export class Decision {
    private constructor(readonly decidedBy: EmployeeId, readonly decidedAt: Date, readonly result: ResultType, readonly reason?: string) { }

    static approve(decidedBy: EmployeeId, decidedAt: Date): Decision {
        return new Decision(decidedBy, decidedAt, "approved");
    }

    static reject(decidedBy: EmployeeId, reason: string, decidedAt: Date): Decision {
        if (!reason || reason.trim() === "") {
            throw new DomainRuleViolation("El motivo de rechazo es obligatorio.");
        }

        return new Decision(decidedBy, decidedAt, "rejected", reason.trim());
    }
}
