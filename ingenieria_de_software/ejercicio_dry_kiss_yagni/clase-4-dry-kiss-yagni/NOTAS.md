# Clase 4 — DRY, KISS y YAGNI

Notas del refactor: qué diferencias había al unificar, qué decidimos con cada una y
por qué. (Criterio 7 de la entrega.)

---

## Parte 1 — DRY: *diff* conceptual y decisiones

### `validation.ts` — tres validadores de email

**Conocimiento unificado** en una única función interna `isValidEmailFormat`:
hay exactamente un `@`; la parte local no está vacía; el dominio no está vacío,
contiene un `.`, y no empieza ni termina por `.`. Los tres exports actuales
(`validateCustomerEmail`, `isValidNewsletterEmail`, `contactEmailIsValid`) se
conservan con su nombre y firma porque los tests los importan; ahora son
envoltorios finos que solo añaden su regla propia.

Diferencias entre las tres copias:

| # | Diferencia | Veredicto | Decisión | Test |
| - | ---------- | --------- | -------- | ---- |
| 1 | La newsletter rechaza alias con `+` en la parte local | **Regla de negocio** | Se conserva (la plataforma no los admite) | `regla del alias "+"...` |
| 2 | El contacto aplica `trim()` a la entrada | **Regla de negocio** | Se conserva (viene de un formulario) | ya existía |
| 3 | El contacto **no** comprobaba `domain.startsWith('.')` | **Descuido (bug)** | Se corrige: al pasar por el núcleo, el contacto ya rechaza `ana@.example.com` | `diferencia corregida: el dominio...` |
| 4 | El guard `email ?? ''` estaba solo en el contacto | **Defensa de frontera** | Se sube al núcleo, en un único sitio | — |

> Nota sobre la #2: el `trim` no llega a ser observable, porque el alta y la
> newsletter tampoco **rechazan** los espacios (simplemente no los miran). Se deja
> como regla propia del contacto por intención, aunque hoy no cambie resultados.

### `csv-exporters.ts` — tres exportadores

**Mecanismo unificado** en `csvEscape` (escapar `;` de los textos libres) y
`buildCsv` (cabecera + filas + línea final, unidas por `\n`).

Diferencias:

| # | Diferencia | Veredicto | Decisión | Test |
| - | ---------- | --------- | -------- | ---- |
| 1 | La línea final es **suma de importes** (ventas, devoluciones) o **recuento** (clientes) | **Regla de negocio** | Se conserva: "total en euros" y "cuántos hay" son cosas distintas | `la línea final de clientes es un recuento...` |
| 2 | El **email** no se escapa; solo el texto libre (nombre, motivo) | **Decisión** | Se conserva: un email válido no puede contener `;` | `no escapa el email...` |

> Las columnas distintas de cada exportador **no** son duplicación: es
> conocimiento distinto, no la misma decisión repetida.

### `pricing.ts` — el IVA

| # | Diferencia | Veredicto | Decisión | Test |
| - | ---------- | --------- | -------- | ---- |
| 1 | `refundAmount` dividía por `1.2` (20%) en vez de por el 21% | **Descuido (bug)** | Se corrige usando `removeTax` | `refundAmount...` |
| 2 | El 21% y el redondeo a 2 decimales estaban escritos a mano en 4-5 sitios | **Duplicación de conocimiento** | Se unifica en `TAX_RATE`, `round2`, `applyTax` y `removeTax` | — |

Criterio 5: el tipo impositivo aparece **una sola vez** (`const TAX_RATE = 0.21`).

---

## Parte 2 — KISS

| Función | Antes | Después |
| ------- | ----- | ------- |
| `calculateShippingCost` | 5 niveles de `if` anidados | Tabla de tarifas por zona × tipo × peso × frágil |
| `formatDateSpanish` | 12 ramas `else if` | Array `MESES` + índice |
| `sortInvoicesByTotalDesc` | burbuja escrita a mano | `[...invoices].sort(...)` |
| `invoiceLabel` | 6 ternarios anidados | `return` tempranos + dos ayudantes |
| `formatMoney` | agrupación de millares carácter a carácter | `Intl.NumberFormat('es-ES')` |

Detalle de `formatMoney`: hay que forzar `useGrouping: true`, porque el locale
español real no agrupa los números de 4 dígitos (`1000` → `1000`), y el test fija
el comportamiento clásico (`1.000`).

---

## Parte 3 — YAGNI

`report-engine.ts` pasó de ~300 líneas a ~23. Se eliminó todo lo que no tenía ni
un solo uso real en `src/` ni `test/`: `ReportEngine`, `ReportOptions`,
`RetryPolicy`, las cuatro estrategias de caché (`createCache`, `LruCache`,
`FifoCache`, `LfuCache`, `NoOpCache`), `PluginRegistry`, `ReportPlugin`,
`ReportRenderer`, `AbstractReportRendererFactory`, `TextReportRenderer`,
`TextReportRendererFactory`, `CacheEntry`, `ReportCache`, `CacheEvictionStrategy`
y `DEFAULT_OPTIONS`.

Sobrevive solo lo que alguien llama: `ReportRow` y `generateReport(rows, title)`.

---

## Reto extra

Lo que separa ambos casos **no es la técnica, sino si el eje de variación existe
hoy**. En la clase 1 el renderizador intercambiable respondía a una necesidad real
(varios formatos de salida), así que abstraerlo era OCP: añadir un formato nuevo no
tocaba el motor. Aquí el registro de plugins, las cuatro cachés y la fábrica
abstracta no tenían **ni un cliente**: era flexibilidad para un futuro imaginado,
y eso es exactamente YAGNI. Mismo patrón, distinta realidad: OCP se gana cuando hay
un eje de variación que de verdad existe; si no existe, construirlo por adelantado
solo añade mantenimiento.
