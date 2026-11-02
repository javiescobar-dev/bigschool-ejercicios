import { SystemClock } from '@/adapters/clock/system-clock';
import { ConsoleNotificationAdapter } from '@/adapters/notification/console-notification-adapter';
import { InMemoryEmployeeRepository } from '@/adapters/persistence/in-memory/in-memory-employee-repository';
import { InMemoryExpenseRepository } from '@/adapters/persistence/in-memory/in-memory-expense-repository';
import { Employee } from '@/domain/entities/employee';
import { EmployeeId } from '@/domain/value-objects/employee-id';
import { Role } from '@/domain/value-objects/role';
import { SubmitExpenseUseCase } from '@/application/use-cases/submit-expense.use-case';
import { ApproveExpenseUseCase } from '@/application/use-cases/approve-expense.use-case';
import { RejectExpenseUseCase } from '@/application/use-cases/reject-expense.use-case';

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

// 3. Crear use cases
const submitExpenseUseCase = new SubmitExpenseUseCase(expenseRepository, clock, notifications);
const approveExpenseUseCase = new ApproveExpenseUseCase(expenseRepository, employeeRepository, clock, notifications);
const rejectExpenseUseCase = new RejectExpenseUseCase(expenseRepository, employeeRepository, clock, notifications);

// 4. Probar el flujo
async function main() {
    // Probar flujo para aprobar manualmente una solicitud de gasto
    const expense = await submitExpenseUseCase.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Gasto de prueba" });
    console.log("Estado tras submit:", expense.getStatus().value); // Estado tras submit: pending

    await approveExpenseUseCase.execute({ expenseId: expense.id.value, deciderId: "4" });
    console.log("Estado tras aprobar:", expense.getStatus().value);
    console.log("");
    // Notificación enviada al empleado 1 sobre el gasto f948e246-2344-47b9-a1da-43d4defe3181
    // Estado tras aprobar: approved

    // Probar flujo para rechazar manualmente una solicitud de gasto
    const expense2 = await submitExpenseUseCase.execute({ requesterId: "2", amountCents: 15000, category: "training", description: "Gasto para rechazar" });
    console.log("Estado tras submit (gasto2):", expense2.getStatus().value); // Estado tras submit (gasto2): pending

    await rejectExpenseUseCase.execute({ expenseId: expense2.id.value, reason: "Fuera de presupuesto", deciderId: "4" });
    console.log("Estado tras rechazar:", expense2.getStatus().value);
    console.log("Motivo de rechazo (gasto2):", expense2.getDecision()?.reason);
    console.log("");
    // Notificación enviada al empleado 2 sobre el gasto 53bb33ce-e79c-4660-a438-35214ea87753
    // Estado tras rechazar: rejected
    // Motivo de rechazo (gasto2): Fuera de presupuesto

    // Probar flujo para aprobar automáticamente una solicitud de gasto
    const expense3 = await submitExpenseUseCase.execute({ requesterId: "3", amountCents: 10000, category: "equipment", description: "Gasto aprobar automáticamente"});
    console.log("Estado tras submit (gasto3):", expense3.getStatus().value,); // Estado tras submit (gasto3): approved
    console.log("");

    // Probar flujo para aprobar manualmente con finance una solicitud de gasto
    const expense4 = await submitExpenseUseCase.execute({ requesterId: "4", amountCents: 180000, category: "travel", description: "Gasto aprobar manualmente con finance"})
    console.log("Estado tras submit (gasto4):", expense4.getStatus().value); // Estado tras submit (gasto4): pending

    await approveExpenseUseCase.execute({ expenseId: expense4.id.value, deciderId: "5" });
    console.log("Estado tras aprobar (gasto4):", expense4.getStatus().value);
    console.log("");
    // Notificación enviada al empleado 4 sobre el gasto 21a2b16c-4448-4066-b0d4-f0639415716d
    // Estado tras aprobar (gasto4): approved

    // Probar flujo para rechazar automáticamente una solicitud de gasto personal
    const expense5 = await submitExpenseUseCase.execute({ requesterId: "5", amountCents: 5000, category: "personal", description: "Gasto personal para rechazar automáticamente"});
    console.log("Estado tras submit (gasto5):", expense5.getStatus().value);
    console.log("Motivo de rechazo (gasto5):", expense5.getDecision()?.reason);
    console.log("");
    // Notificación enviada al empleado 5 sobre el gasto f8360094-670e-4bbd-bf88-71ee6906941b
    // Estado tras submit (gasto5): rejected
    // Motivo de rechazo (gasto5): Gasto de categoría personal

    // Probar flujo para aprobar el mismo empleado que solicita el gasto (debe fallar)
    const expense6 = await submitExpenseUseCase.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Gasto para aprobar el mismo empleado que solicita el gasto"});
    console.log("Estado tras submit (gasto6):", expense6.getStatus().value); // Estado tras submit (gasto6): pending

    try {
        await approveExpenseUseCase.execute({ expenseId: expense6.id.value, deciderId: "1" });
    } catch (error) {
        console.log("Error al aprobar el mismo empleado que solicita el gasto:", (error as Error).message);
    }
    console.log("");

    // Error al aprobar el mismo empleado que solicita el gasto: El mismo empleado no puede resolver su propia solicitud, no se puede realizar la operación.

    // Probar flujo para aprobar un gasto un rol que no corresponde (debe fallar)
    const expense7 = await submitExpenseUseCase.execute({ requesterId: "2", amountCents: 160000, category: "training", description: "Gasto para aprobar un gasto un rol que no corresponde"});
    console.log("Estado tras submit (gasto7):", expense7.getStatus().value); // Estado tras submit (gasto7): pending

    try {
        await approveExpenseUseCase.execute({ expenseId: expense7.id.value, deciderId: "4" });
    } catch (error) {
        console.log("Error al aprobar un gasto con un rol que no corresponde:", (error as Error).message);
    }
    console.log("");
    // Error al aprobar un gasto con un rol que no corresponde: El rol del empleado que toma la decisión no es el requerido, no se puede realizar la operación.

    // Probar flujo para aprobar un gasto que ya ha sido resuelto (debe fallar)
    const expense8 = await submitExpenseUseCase.execute({ requesterId: "3", amountCents: 10000, category: "meals", description: "Gasto para aprobar un gasto que ya ha sido resuelto"});
    console.log("Estado tras submit (gasto8):", expense8.getStatus().value); // Estado tras submit (gasto8): approved

    try {
        await approveExpenseUseCase.execute({ expenseId: expense8.id.value, deciderId: "4" });
    } catch (error) {
        console.log("Error al aprobar un gasto que ya ha sido resuelto:", (error as Error).message);
    }
    console.log("");
    // Error al aprobar un gasto que ya ha sido resuelto: El gasto ya ha sido resuelto previamente, no se puede realizar esa operación de nuevo.

    // Probar flujo para rechazar un gasto sin motivo (debe fallar)
    const expense9 = await submitExpenseUseCase.execute({ requesterId: "2", amountCents: 15000, category: "training", description: "Gasto para rechazar un gasto sin motivo"});
    console.log("Estado tras submit (gasto9):", expense9.getStatus().value); // Estado tras submit (gasto9): pending

    try {
        await rejectExpenseUseCase.execute({ expenseId: expense9.id.value, reason: "", deciderId: "4" });
    } catch (error) {
        console.log("Error al rechazar un gasto sin motivo:", (error as Error).message);
    }
    console.log("");
    // Error al rechazar un gasto sin motivo: El motivo de rechazo no puede estar vacío, no se puede realizar la operación.
}

main();
