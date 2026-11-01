import { EmployeeRepository } from "@/application/ports/employee-repository";
import { Employee } from "@/domain/entities/employee";
import { EmployeeId } from "@/domain/value-objects/employee-id";

export class InMemoryEmployeeRepository implements EmployeeRepository {
    private readonly employees: Map<string, Employee>;

    // el constructor puede aceptar un mapa creado previamente
    constructor(initial?: Map<string, Employee>) {
        this.employees = initial ?? new Map<string, Employee>();
    }

    async findEmployeeById(id: EmployeeId): Promise<Employee | null> {
        return this.employees.get(id.value) ?? null;
    }

    // metodo adicional para guardar empleado
    async save(employee: Employee): Promise<void> {
        this.employees.set(employee.id.value, employee);
    }
}
