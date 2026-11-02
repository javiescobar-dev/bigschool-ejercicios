import { SystemClock } from '@/adapters/clock/system-clock';
import { ConsoleNotificationAdapter } from '@/adapters/notification/console-notification-adapter';
import { InMemoryEmployeeRepository } from '@/adapters/persistence/in-memory/in-memory-employee-repository';
import { InMemoryExpenseRepository } from '@/adapters/persistence/in-memory/in-memory-expense-repository';
import { Employee } from '@/domain/entities/employee';
import { EmployeeId } from '@/domain/value-objects/employee-id';
import { Role } from '@/domain/value-objects/role';

// 1. Crear adaptadores
const clock = new SystemClock();
const notifications = new ConsoleNotificationAdapter();

// 2. Crear repositorios
// cargamos datos de prueba para los empleados, para poder probar el flujo de aprobación de gastos
const employees = [
  new Employee(EmployeeId.fromString("1"), Role.fromString("Employee")),
  new Employee(EmployeeId.fromString("2"), Role.fromString("Employee")),
  new Employee(EmployeeId.fromString("3"), Role.fromString("Employee")),
  new Employee(EmployeeId.fromString("4"), Role.fromString("Manager")),
  new Employee(EmployeeId.fromString("5"), Role.fromString("Finance")),
];
const employeeRepository = new InMemoryEmployeeRepository(new Map(employees.map((e) => [e.id.value, e])));
const expenseRepository = new InMemoryExpenseRepository();
