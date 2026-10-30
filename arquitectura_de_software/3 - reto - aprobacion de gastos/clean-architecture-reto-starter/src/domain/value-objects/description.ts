import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class Description {
    private constructor(readonly value: string) { }

    static fromString(value: string): Description {
        if (!value || value.trim() === "") {
            throw new DomainRuleViolation("La descripción no puede estar vacía.");
        }

        return new Description(value.trim());
    }
}
