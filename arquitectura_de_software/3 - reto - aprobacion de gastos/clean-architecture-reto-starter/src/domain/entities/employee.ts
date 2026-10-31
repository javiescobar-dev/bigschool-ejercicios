import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Role } from "@/domain/value-objects/role";

export class Employee {
  constructor(
    readonly id: EmployeeId,
    readonly role: Role,
  ) {}
}
