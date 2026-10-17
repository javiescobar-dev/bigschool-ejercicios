# Clase 4 — DRY, KISS y YAGNI

> **Proyecto:** OfiDocs · utilidades internas de facturación e informes
> **Principios:** DRY (Don't Repeat Yourself), KISS (Keep It Simple) y YAGNI (You Aren't Gonna Need It)

---

## El contexto

Esta es la carpeta de utilidades internas de OfiDocs: exportadores de CSV,
cálculo de portes, validación de emails, formateo de fechas e importes y el motor
de informes. Tres años de gente distinta tocando el mismo sitio.

Los 45 tests están en verde. Pero el código tiene las tres enfermedades clásicas
a la vez, y conviene aprender a distinguirlas porque **se curan de formas
distintas**:

| Principio | Síntoma | Cura |
| --- | --- | --- |
| **DRY** | La misma decisión escrita en varios sitios | Una única fuente de verdad |
| **KISS** | Código que hace lo correcto de la forma más enrevesada posible | Reescribir más simple |
| **YAGNI** | Flexibilidad construida para un futuro que no llegó | Borrar |

---

## Puesta en marcha

```bash
npm install
npm test          # 45 tests, todos en verde
npm run demo      # informe, CSV, portes y etiquetas de factura
```

---

## Qué hay dentro

```
src/
  types.ts
  validation.ts       Tres validadores de email casi idénticos
  pricing.ts          Portes con ifs anidados + el IVA repetido por ahí
  formatting.ts       Fechas, dinero, ordenación y etiquetas
  csv-exporters.ts    Tres exportadores casi idénticos
  report-engine.ts    El motor de informes
  demo.ts
```

---

## Tu misión

### Parte 1 — DRY

Hay duplicación en dos sitios muy claros: los **tres validadores de email** y los
**tres exportadores de CSV**. Además, el tipo de IVA aparece escrito a mano en
varios cálculos de `pricing.ts`.

Unifica. Pero hazlo con cuidado, porque aquí está la trampa de la clase:

> **Las tres copias no son idénticas. Han ido divergiendo.**
>
> Algunas diferencias son **reglas de negocio de verdad** y hay que conservarlas.
> Otras son **bugs** que se colaron al copiar y pegar y que nadie ha visto nunca
> porque no hay ningún test que pase por ahí.

Antes de unificar nada, haz un **diff conceptual** de las tres copias y clasifica
cada diferencia en una de las dos columnas. Después unifica, y **escribe un test
para cada diferencia que hayas decidido conservar**: si no está en un test, la
próxima persona la volverá a borrar.

> Pista: al menos una de las diferencias de `validation.ts` es una regla de
> negocio legítima, y al menos otra es un descuido. Y en `pricing.ts` hay una
> función con un tipo impositivo que no cuadra con las demás.

### Parte 2 — KISS

Cuatro funciones hacen lo correcto de la forma más complicada posible:

- `calculateShippingCost` — cinco niveles de `if` anidados. Es correcta y está
  bien cubierta por tests, pero nadie puede leerla y quedarse tranquilo.
- `formatDateSpanish` — 30 líneas de `else if` para traducir un número a un mes.
- `sortInvoicesByTotalDesc` — una burbuja escrita a mano.
- `invoiceLabel` — seis ternarios anidados.
- `formatMoney` — agrupación de millares carácter a carácter.

Reescríbelas de forma que **el código quepa en la cabeza de un lector**. Aquí no
se trata de añadir abstracciones: se trata de quitarlas.

> Cuidado con el falso KISS: sustituir seis ternarios anidados por una expresión
> regular incomprensible no es simplificar, es esconder. La medida de KISS no es
> el número de líneas, es **cuánto tarda otra persona en entenderlo**.

### Parte 3 — YAGNI

Abre `report-engine.ts`. Son ~300 líneas con: cuatro estrategias de caché, un
registro de plugins con prioridades, una fábrica abstracta de renderizadores,
una política de reintentos con *jitter*, y doce opciones de configuración.

Ahora busca en todo el proyecto (`src/` y `test/`) **quién usa cada cosa**.

Borra todo lo que no tenga ni un solo uso real. Tu objetivo es que la única
función que alguien llama de verdad —`generateReport(rows, title)`— siga
comportándose exactamente igual, con los dos tests de `report-engine.test.ts` en
verde, y que el archivo quepa en una pantalla.

> YAGNI no dice "no diseñes". Dice: **no construyas hoy la flexibilidad que crees
> que te hará falta mañana**, porque cuando llegue mañana el requisito será
> distinto del que imaginaste y encima tendrás que mantener lo que construiste de
> más. Y con Git, borrar no es perder: el código sigue en el historial.

---

## Criterios de aceptación

1. `npm test` en verde. Los tests existentes **no se modifican**; sí debes
   **añadir** los que cubran las reglas y los bugs que descubras en la Parte 1.
2. `npm run typecheck` sin errores.
3. `report-engine.ts` baja de 300 líneas a menos de 40.
4. Una sola función de validación de email y una sola de exportación a CSV.
5. El tipo de IVA aparece **una sola vez** en todo el proyecto.
6. Ninguna función de `formatting.ts` supera las 10 líneas.
7. Escribes en el PR (o en un comentario) la lista de diferencias que encontraste
   al unificar y qué decidiste con cada una.

---

## Pistas (si te atascas)

<details>
<summary>Pista 1 — DRY es sobre conocimiento, no sobre caracteres</summary>

La formulación original: *"cada pieza de conocimiento debe tener una
representación única y sin ambigüedad en el sistema"*. Habla de **conocimiento**,
no de líneas parecidas.

Corolario incómodo: dos trozos de código idénticos **por casualidad**, que
responden a dos reglas de negocio distintas que hoy coinciden, **no** deben
unificarse. Si los unes, el día que una regla cambie tendrás que volver a
separarlos, y para entonces habrá diez sitios llamando a la función común.
</details>

<details>
<summary>Pista 2 — cómo se aplana un árbol de ifs</summary>

Cuando un `if` anidado decide un **valor** en función de varias entradas
discretas, casi siempre es una **tabla** disfrazada. Escribe primero la tabla en
un comentario (país × exprés × peso × frágil → precio), compárala con el código y
verás si hay casos que se repiten o que faltan. Después conviértela en datos.
</details>

<details>
<summary>Pista 3 — la pregunta de YAGNI</summary>

Ante cada pieza, pregunta: *"¿quién llama a esto hoy?"*. Si la respuesta es
"nadie, pero por si acaso", bórralo. Si es "nadie, pero es que es una librería
pública", entonces es otra conversación — y este motor no es una librería
pública.
</details>

---

## Reto extra

Las tres enfermedades interactúan. `calculateShippingCost` viola KISS **y** repite
las tarifas que ya viste en la clase 1. Y `report-engine.ts` viola YAGNI, pero
algunas de sus piezas (el renderizador intercambiable) son exactamente lo que
pediría Open/Closed de la clase 1.

Escribe tres líneas argumentando **por qué en este proyecto sobra y en el de la
clase 1 faltaba**. Esa respuesta es la que separa a quien sabe recitar los
principios de quien sabe aplicarlos.
