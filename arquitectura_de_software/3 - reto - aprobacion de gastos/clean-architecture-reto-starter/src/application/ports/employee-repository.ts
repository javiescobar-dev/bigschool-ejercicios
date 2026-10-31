import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Employee } from "@/domain/entities/employee";

export interface EmployeeRepository {
    findEmployeeById(id: EmployeeId): Promise<Employee | null>;
}
