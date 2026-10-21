# Análisis — Clase 5: patrones de diseño

**Proyecto:** TicketBox · venta de entradas
**Resultado:** 30/30 tests, `typecheck` limpio, `checkout()` de 152 → **31 líneas**.

---

## Fase 1 — Problemas detectados (en lenguaje llano)

Sin nombrar patrones todavía. Esto es la "pregunta" antes de elegir la "respuesta".

| # | Problema |
|---|----------|
| P1 | `checkout()` mezcla caché, logging, validaciones, cálculo del precio, cobro, ciclo de vida del pedido, avisos y construcción del resultado. |
| P2 | El `switch (request.paymentMethod)` tiene ~80 líneas; añadir un método de pago obliga a editar el servicio. |
| P3 | Después de cobrar se llaman **cinco sistemas distintos por su nombre**; añadir uno nuevo (antifraude) obliga a editar el servicio. |
| P4 | La traducción a `LegacyPaymentRequest` está escrita a mano en dos sitios (tarjeta y monedero), y los códigos numéricos de la pasarela se traducen dentro del servicio. |
| P5 | `withLogging`, `withRetry` y `withCache` están enredados dentro de `callGateway()`; son tres preocupaciones distintas en el mismo método. |
| P6 | `createCheckoutRequest()` tiene 14 parámetros posicionales: en la llamada no se sabe qué es cada cosa. |
| P7 | `Order` repite el conocimiento del estado en tres `switch` y varias cadenas de `if`; cada estado nuevo obliga a tocar varios métodos. |
| P8 | Las validaciones propias de cada método de pago (`cardToken`, `walletAccountId`, `voucherCode`) viven mezcladas con las validaciones comunes del checkout. |
| P9 | *(Hallazgo durante el refactor)* `availableActions()` en `paid` no anuncia `cancel`, pero `cancel()` **sí** permite cancelar desde `paid`. La API dice menos de lo que permite. |

---

## Fase 2 y 3 — Patrones considerados y decisión

| Patrón | Problema que ataca | Decisión |
|--------|--------------------|----------|
| **Strategy** | P2, P8 | ✅ **Aplicado** |
| **Observer** | P3 | ✅ **Aplicado** |
| **Adapter** | P4 | ✅ **Aplicado** |
| **State** | P7 | ❌ Descartado (tabla de transiciones) |
| **Decorator** | P5 | ❌ Descartado (método privado) |
| **Builder** | P6 | ❌ Descartado (objeto literal) |
| **Chain of Responsibility** | P8 | ❌ Descartado |
| **Proxy** | P5 (caché) | ❌ Descartado |
| **Factory** | P2, P6 | ❌ Descartado (el registro basta) |
| **Facade** | P1 | ❌ Descartado (`CheckoutService` ya lo es) |

---

## Patrones aplicados y por qué

### 1. Strategy — métodos de pago

**Qué resuelve en general:** cuando una operación tiene varias variantes y un `switch` elige entre ellas, se define una interfaz común y una clase por variante. El cliente delega y la selección se hace una sola vez en un registro.

**Aplicado aquí:**

- `PaymentStrategy` con `validate(request)` y `charge(amount, request, chargeFn)`.
- `CardPaymentStrategy`, `WalletPaymentStrategy`, `TransferPaymentStrategy`, `VoucherPaymentStrategy` y, después, `ApplePayPaymentStrategy`.
- `defaultPaymentStrategies()` registra las implementaciones.
- `CheckoutService` solo hace `this.strategies.get(request.paymentMethod)` y delega.

**Por qué:** hay cuatro métodos de pago y Apple Pay estaba confirmado. El criterio no es "el `switch` es feo", sino "por ahí va a cambiar el código". Además, cada validación específica se fue con su estrategia (P8).

**Coste:** 1 interfaz + 5 estrategias + 1 registro. Un nivel de indirección.

**Cuándo NO:** dos métodos estables que no van a crecer. Un `switch` corto sería más claro que cinco clases.

---

### 2. Observer — avisos posteriores a la compra

**Qué resuelve en general:** el emisor no conoce a los receptores; mantiene una lista de suscriptores y publica un evento. Añadir un receptor es añadir un suscriptor.

**Aplicado aquí:**

- `PurchaseEvent` y `PurchaseObserver.onPurchase(event)`.
- Observadores: email, analítica, inventario, fidelización, imprenta y, después, antifraude.
- `defaultPurchaseObservers()` los registra.
- `CheckoutService` solo recorre `this.observers`.

**Por qué:** eran cinco sistemas y el criterio 5 pedía añadir antifraude sin tocar el servicio. Con Observer, antifraude es un archivo nuevo y una línea en el registro.

**Coste:** 1 evento + 1 interfaz + 6 observadores + 1 registro. Los observadores son muy pequeños.

**Cuándo NO:** dos avisos estables; o si se necesita orden estricto y transaccionalidad, donde un pipeline explícito se lee mejor.

**Ojo:** Observer es "dispara y olvida". Si un observador lanza una excepción, los siguientes no se ejecutan. Hoy el comportamiento original también era secuencial, así que no se añadió aislamiento; en producción habría que decidir si cada aviso debe ser independiente.

---

### 3. Adapter — pasarela legacy

**Qué resuelve en general:** traducir la interfaz de una librería externa a la interfaz que espera el dominio, en un único sitio.

**Aplicado aquí:**

- Puerto `ChargeGateway` con `ChargeRequest` / `ChargeResult`.
- `LegacyGatewayAdapter` envuelve `PaymentsGatewayV1` y traduce:
  - `amountInCents` → `AMOUNT_IN_CENTS`
  - `cardToken`/`accountId` → `CARD_TOKEN`/`ACCOUNT_ID`
  - códigos `05/51/99` → mensajes de dominio y `retryable`.

**Por qué:** la traducción estaba duplicada en tarjeta y monedero, y `translateGatewayCode()` vivía en el servicio. Ahora hay **una** traducción y el servicio no conoce la API de 2011. Además, es la costura que permite que las estrategias no sepan nada de la pasarela.

**Coste:** 2 archivos (~50 líneas).

**Cuándo NO:** un solo punto de llamada y una API externa estable que no va a cambiar.

---

## Patrones descartados y por qué

### State (P7) — descartado; tabla en su lugar

`Order` tiene **seis estados cerrados y estables** (created, reserved, paid, issued, cancelled, refunded). El patrón State pediría una interfaz y seis clases, con muchos métodos que lanzan o no hacen nada: más indirección y riesgo de ISP/LSP para un conjunto que no crece.

En su lugar se aplicó una **tabla de transiciones** (KISS, no un patrón GoF):

```ts
const TRANSITIONS = {
  created: { reserve: 'reserved', cancel: 'cancelled' },
  reserved: { markPaid: 'paid', cancel: 'cancelled' },
  paid: { issueTickets: 'issued', refund: 'refunded', cancel: 'cancelled' },
  issued: { refund: 'refunded' },
}
```

Los tres `switch` desaparecen, `describe`/`isFinal`/`availableActions` pasan a ser datos y añadir una transición es una fila. **Cuándo sí usar State:** si los estados crecieran cada trimestre o si cada estado tuviera comportamiento propio complejo.

### Decorator (P5) — descartado

Solo hay dos preocupaciones reales que envolver: **logging** y **retry**. `withCache` no es del gateway: cachea el resultado del checkout por `orderId`, y decorar el cobro con caché sería peligroso (riesgo de doble cobro).

Dos o tres clases decoradoras para ahorrar ~15 líneas no compensan. Se queda un método privado `callGateway()` con la lógica, que sigue siendo legible. **Cuándo sí:** si aparecen más preocupaciones (métricas, circuit breaker, timeout) y se quiere componerlas.

### Builder (P6) — descartado

Un Builder resolvería los 14 parámetros posicionales, pero hay **un solo punto de llamada** (el demo) y `CheckoutRequest` ya es un objeto con campos nombrados. Se sustituyó por un **literal**:

```ts
const peticion: CheckoutRequest = {
  orderId: 'ORD-2045',
  paymentMethod: 'card',
  // ...
}
```

Se eliminó `createCheckoutRequest()`. **Aclaración:** una Factory no resuelve este problema; decide *qué clase* instanciar, no *cómo* rellenar 14 posiciones. **Cuándo sí usar Builder:** muchos parámetros opcionales y varios puntos de llamada.

### Chain of Responsibility (P8) — descartado

Las seis validaciones comunes son `if` simples y **el orden importa** (los tests fijan el primer mensaje que salta). Una cadena de validadores añadiría seis clases y escondería ese orden. **Cuándo sí:** reglas que se configuran desde fuera o que cambian con el cliente.

### Proxy (caché) — descartado

La caché son tres líneas (`get`/`set` en un `Map`) y no se testea en el ejercicio. Una clase Proxy sería ceremonia sin beneficio. **Cuándo sí:** si la caché tuviera políticas de expiración, tamaño o invalidación.

### Factory (P2/P6) — descartado

- Para `Order` no hay variantes que crear.
- Para las estrategias, el `Map` del registro ya hace la selección. No hace falta una jerarquía de factorías.

### Facade (P1) — descartado

`CheckoutService` **ya es** la fachada/orquestador del caso de uso. Añadir otra capa sería indirección gratuita. Lo que sí se hizo fue aplicar **SRP** dentro de la clase: extraer `validatedStrategy`, `price`, `notify`, `callGateway`, `readCache`/`writeCache`, `logStart`/`logEnd` y `failureResult`/`successResult`.

---

## Evidencias del resultado

| Criterio | Resultado |
|----------|-----------|
| `npm test` | 30/30, tests originales sin tocar |
| `npm run typecheck` | limpio |
| `checkout()` | **31 líneas** (antes 152) |
| Apple Pay | archivo nuevo + una línea en el registro de estrategias; `checkout-service.ts` sin tocar |
| Antifraude | archivo nuevo + una línea en el registro de observadores; `checkout-service.ts` sin tocar |
| Empatía con la clase 4 | Builder, Decorator, State, Chain y Proxy descartados por YAGNI/KISS |

### Hallazgos que merecen mención

- **P9:** `availableActions()` en `paid` devuelve `['issueTickets', 'refund']`, pero `cancel()` permite cancelar desde `paid`. Es una incoherencia del código original. No se corrigió porque los tests fijan el comportamiento; en un proyecto real habría que decidir cuál es la fuente de verdad.
- **La pasarela legacy rechaza importes > 300 €** (`AMOUNT_IN_CENTS > 30000`). El demo de Apple Pay usa 272,70 € para poder mostrar el camino feliz y, a la vez, superar el umbral de antifraude (200 €).
- `withCache` se conservó, pero no tiene tests. Es deuda técnica heredada, no del refactor.

---

## Reto extra — revisión crítica

### ¿Dónde me he pasado de ingeniería?

- **Adapter con solo dos puntos de llamada.** Es el candidato más discutible: un helper `toLegacyRequest()` habría quitado la duplicación sin crear un puerto. Se mantiene porque es la costura que hace que las estrategias no dependan de la pasarela y porque el día que cambie el proveedor solo se cambia un archivo.
- **Seis archivos de observadores muy pequeños.** Es mucho archivo para poco código. Se justifica por el criterio 5 (antifraude como archivo nuevo) y porque cada observador tiene un motivo de cambio distinto. Si no existiera ese criterio, un solo archivo con seis funciones sería más simple.

### ¿Dónde me he quedado corto?

- **`validatedStrategy()` tiene 26 líneas** y mezcla validación con búsqueda de estrategia. Se podría extraer un `CheckoutValidator`, pero con seis reglas simples y un orden fijado por tests, un validador con clase propia sería otra vez sobreingeniería. Queda como el método más largo de la clase.
- **P9 sin corregir.** La incoherencia entre `availableActions()` y `cancel()` se documenta, pero no se arregla. Hacerlo bien requeriría cambiar un test, y el ejercicio no lo permite.
- **Apple Pay reutiliza `CARD_TOKEN`.** Es una concesión a la pasarela legacy: en una integración real, Apple Pay tendría su propio puerto/token. El adaptador es precisamente el lugar donde esa concesión queda aislada.
- **`withCache` sin tests.** Si el cliente activa la caché, hoy nadie lo verifica.

### Decisión final

Me quedo con **tres patrones** (Strategy, Observer, Adapter) y la tabla de `Order` como mejora KISS. Aplicar State, Decorator o Builder habría hecho el código más "de catálogo" y menos mantenible para el tamaño real del proyecto. La mayor deuda pendiente no es de patrones: es **testear la caché** y decidir qué hacer con P9.
