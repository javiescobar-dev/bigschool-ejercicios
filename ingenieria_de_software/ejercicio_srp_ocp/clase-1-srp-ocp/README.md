# Clase 1 — Single Responsibility & Open/Closed

> **Proyecto:** PedidoExpress · procesador de pedidos de una tienda online
> **Principios:** SRP (Single Responsibility) y OCP (Open/Closed)

---

## El contexto

Trabajas en **PedidoExpress**, una tienda online que lleva tres años en producción.
Todo lo que ocurre cuando un cliente confirma una compra vive en una sola clase:
`OrderService`.

Funciona. Los tests están en verde. El negocio está contento.

Pero esta mañana te han llegado tres peticiones de producto:

1. Entra un nuevo tipo de cliente: **`partner`**, con un 15 % de descuento.
2. Se añade **Bizum** como método de pago, con una comisión del 0,5 %.
3. Marketing quiere la factura también en **PDF**, y el equipo de contabilidad
   quiere una **exportación en JSON**.

Antes de escribir una sola línea, abre `src/order-service.ts` y hazte la pregunta
incómoda: **¿cuántos sitios distintos tengo que tocar para cada una de esas tres
peticiones?**

---

## Puesta en marcha

```bash
npm install
npm test          # 18 tests, todos en verde
npm run demo      # procesa un pedido de ejemplo y lo imprime
```

Requisitos: Node 22 o superior (el proyecto no necesita build, se ejecuta el
TypeScript directamente).

---

## Qué hay dentro

```
src/
  types.ts                  Modelo de dominio (Order, Customer, OrderLine…)
  order-service.ts          ⟵ TODO el trabajo de la clase está aquí
  demo.ts                   Script de ejemplo ejecutable
  infra/
    database.ts             "Base de datos" en memoria
    email-gateway.ts        Pasarela de email simulada
test/
  order-service.test.ts     18 tests que describen el comportamiento actual
```

`OrderService.processOrder()` hace, en este orden: valida el pedido, calcula el
subtotal, aplica el descuento del cliente, suma la comisión de la pasarela de
pago, calcula los gastos de envío, aplica el IVA, redacta la factura en texto,
la guarda en base de datos y envía el email de confirmación.

---

## Tu misión

Refactoriza el proyecto para que cumpla SRP y OCP, **sin cambiar una sola línea
de los tests**.

### Parte 1 — Single Responsibility

`OrderService` tiene, como mínimo, media docena de razones para cambiar: cambia
la ley del IVA y hay que tocarla; cambia el diseño de la factura y hay que
tocarla; cambia el proveedor de email y hay que tocarla.

Separa esas responsabilidades en colaboradores con un único motivo de cambio.
Después del refactor, `processOrder` debería leerse casi como el enunciado del
caso de uso: *valida, calcula, factura, guarda, notifica*.

### Parte 2 — Open/Closed

Localiza los puntos donde el código está **cerrado a la extensión**: para añadir
un caso nuevo hay que abrir y modificar código existente y ya probado. Hay tres
candidatos claros (descuentos, comisiones, envío) y uno más discreto
(`exportInvoice`).

Rediséñalos para que **añadir un caso nuevo sea añadir código, no modificarlo**.

### La prueba del algodón

Cuando creas que has terminado, implementa de verdad las tres peticiones del
principio:

- [ ] Cliente `partner` con 15 % de descuento
- [ ] Pago con Bizum, comisión del 0,5 %
- [ ] Exportación de la factura en JSON

Si cada una se resuelve **creando un archivo nuevo** y registrándolo, has
aplicado OCP. Si has tenido que volver a abrir un `switch`, todavía no.

---

## Criterios de aceptación

1. `npm test` sigue en verde. **Los tests no se modifican**: son tu red de
   seguridad, y si cambias la red de seguridad ya no estás refactorizando, estás
   reescribiendo.
2. `npm run typecheck` sin errores.
3. Ninguna clase o módulo nuevo mezcla cálculo de dinero con formato de texto,
   persistencia o envío de emails.
4. Añadir un tipo de cliente, un método de pago o un formato de factura **no
   obliga a editar código existente**.
5. Escribe tests nuevos para los tres casos nuevos (esos sí, añádelos).

---

## Pistas (si te atascas)

<details>
<summary>Pista 1 — cómo detectar violaciones de SRP</summary>

Describe en voz alta lo que hace la clase. Si necesitas la palabra **"y"** más de
una vez, tienes más de una responsabilidad. Otro truco: imagina qué
departamentos de la empresa pueden pedir un cambio en esta clase. ¿Contabilidad?
¿Marketing? ¿Infraestructura? Cada departamento es un motivo de cambio distinto.
</details>

<details>
<summary>Pista 2 — el olor que delata a OCP</summary>

Un `switch` (o una escalera de `if/else if`) sobre un **tipo** o un **estado** es
casi siempre una violación de OCP esperando a que llegue el caso número seis.
Fíjate además en algo revelador: los cuatro `switch` del servicio recorren
conceptos distintos, pero todos comparten la misma forma.
</details>

<details>
<summary>Pista 3 — cuidado con el efecto colateral escondido</summary>

Mira `exportInvoice()` con atención. ¿Qué le pasa a la base de datos y al buzón
de correo cada vez que alguien pide la factura en HTML? Ese bug existe
precisamente porque el cálculo y los efectos están pegados en el mismo método.
Arreglar el diseño lo arregla solo.
</details>

---

## Reto extra

Los gastos de envío usan `order.country` con un `if/else`. Cuando PedidoExpress
abra en Italia, Alemania y Marruecos con tarifas distintas, ¿tu solución aguanta?
Aplícale el mismo tratamiento que a los descuentos y compara: ¿ha quedado mejor
o has añadido una capa de abstracción que nadie pidió? (Spoiler: esa pregunta la
respondemos en la clase 4, con YAGNI.)
