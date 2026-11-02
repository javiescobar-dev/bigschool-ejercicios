# Progreso del reto — Aprobación de gastos

> Archivo vivo para conservar el contexto entre sesiones y tras una compactación.
> Al empezar una sesión, léelo y retoma desde **Próximo paso**. Al terminar cada
> paso, actualízalo sin borrar el histórico.

- **Proyecto:** `clean-architecture-reto-starter`
- **Inicio:** 2026-10-26
- **Fase actual:** 6 — Reflexión final
- **Estado:** Composición y validación completadas. Reflexión registrada.

## Modo de trabajo

- El usuario escribe el código y toma las decisiones; el agente actúa como tutor.
- Todo se explica en español, paso a paso, sin entregar la solución.
- Un paso cada vez: objetivo, preguntas, intento del usuario, revisión y siguiente paso.

## Plan de fases

- [x] **1. Entender el problema** — actores, reglas, estados, escenarios y dudas.
- [x] **2. Modelar el dominio** — proteger las reglas y las transiciones sin depender
      de HTTP, frameworks, bases de datos ni SDKs.
- [x] **3. Casos de uso** — `SubmitExpense`, `ApproveExpense` y `RejectExpense`.
- [x] **4. Puertos y adaptadores** — persistencia (in-memory), notificaciones (console), fecha (system clock).
- [x] **5. Composición y tests** — composition root visible, pruebas manuales de casos límite y guardas.
- [x] **6. Reflexión final** — qué ocurre si se guarda la solicitud pero falla la notificación.

## Fuentes del ejercicio

- `README.md` — requisitos, comandos y entrega esperada.
- `ENUNCIADO.md` — reglas de negocio, restricciones y evaluación.
- `requirements/expense-approval.feature` — escenarios de aceptación.
- `AGENTS.md` (raíz del repo) — comandos, convenciones y modo tutor.

## Bitácora

### 2026-10-26 — Inicio
- Se revisó el repositorio, se creó AGENTS.md with modo tutor and this file of progreso.

### 2026-10-28 — Paso 1 completado
- Actores, estados, transiciones y tabla definidos. Política automática al presentar.

### 2026-10-29 — Paso 2 en curso
- Entidades y objetos valor definidos. Iniciando invariantes.

### 2026-10-31 — Dominio y aplicación iniciados
- Value Objects: Money, Description, Category, Role, ExpenseStatus, EmployeeId, ExpenseId, Decision, DomainRuleViolation.
- Entidades: Employee, Expense con submit/approve/reject y guardas.
- Puertos: ExpenseRepository, EmployeeRepository, Clock, NotificationPort.
- Casos de uso: SubmitExpenseUseCase, ApproveExpenseUseCase, RejectExpenseUseCase.

### 2026-11-01 — Aplicación completada
- Puertos definidos en application/ports.
- Casos de uso creados en application/use-cases con orquestación y notificación tras resolución.
- Adaptadores implementados: InMemoryExpenseRepository, InMemoryEmployeeRepository, ConsoleNotificationAdapter, SystemClock.

### 2026-11-02 — Composition root y pruebas manuales
- `src/main.ts` cableado with adaptadores, repositorios y use cases.
- Pruebas manuales exitosas:
  - 150€ (>100 y <=1000): `pending` (Manager), aprobado/rechazado with motivo por decisor distinto al solicitante, with notificación.
  - <=100€: aprobado automáticamente, notificación tras resolución.
  - >1000€: `pending`, aprobado correctly por `Finance` (`id 5`).
  - Categoría personal: rejected automáticamente with motivo, notificación.
- Guardas validadas (lanzan `DomainRuleViolation`):
  - Mismo solicitante intenta resolver su propia solicitud.
  - Rol incorrecto para importe >1000€ (Manager intenta resolverlo en lugar de Finance).
  - Gasto ya resuelto: intento de aprobar/rechazar nuevamente.
  - Rechazo manual sin motivo / solo espacios: lanza `DomainRuleViolation` desde `Decision.reject`.
- Todas las guardas principales del dominio, casos de política/composición fueron probados via composition root.

### 2026-11-02 — Reflexión final
- **¿Qué ocurre si se guarda la solicitud pero falla la notificación?** La solicitud ya queda resuelta (aprobada/rechazada) y guardada correctamente en el repositorio. El fallo de notificación no altera el estado ni impide guardar. Los use cases envuelven `sendTo()` con `try/catch` para ignorarlo. Para hacerlo más robusto se podría añadir un flag `notified` o usar reintentos/colas de eventos.
