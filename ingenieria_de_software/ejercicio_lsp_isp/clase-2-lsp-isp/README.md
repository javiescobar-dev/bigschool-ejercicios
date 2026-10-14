# Clase 2 — Liskov & Interface Segregation

> **Proyecto:** OfiDocs · gestión documental de una oficina
> **Principios:** LSP (Liskov Substitution) e ISP (Interface Segregation)

---

## El contexto

**OfiDocs** gestiona dos cosas: el parque de aparatos de la oficina (impresoras,
escáner, multifunción) y los almacenes donde se guardan los documentos (disco
local, bucket en la nube y el archivo histórico sellado por normativa).

El código funciona y los 19 tests están en verde. Pero si lees los dos clientes
del sistema —`OfficeWorkflow` y `ArchiveService`— vas a encontrar algo raro:
**están escritos a la defensiva**. Llenos de `try/catch` que se tragan
excepciones, de `instanceof` para tratar a unos distintos que a otros, y de
comprobaciones para verificar que una operación ha hecho lo que dijo que hacía.

Ese estilo defensivo no es paranoia del programador. Es el **síntoma**. Tu
trabajo es encontrar la enfermedad.

Empieza ejecutando `npm run demo` y mira la última línea. El archivo histórico
dice haber purgado un documento… y el documento sigue ahí.

---

## Puesta en marcha

```bash
npm install
npm test          # 19 tests, todos en verde
npm run demo      # digitaliza, imprime, archiva y purga
```

---

## Qué hay dentro

```
src/
  types.ts
  devices/
    office-device.ts            Interfaz común de TODOS los aparatos
    multifunction-printer.ts    Imprime, escanea, faxea, grapa
    basic-inkjet-printer.ts     Solo imprime
    network-scanner.ts          Solo escanea
  storage/
    document-storage.ts         Clase base con el CONTRATO documentado
    local-disk-storage.ts
    object-bucket-storage.ts
    read-only-archive-storage.ts
  office-workflow.ts            ⟵ Cliente de los aparatos
  archive-service.ts            ⟵ Cliente de los almacenes
  demo.ts
```

---

## Tu misión

### Parte 1 — Interface Segregation (los aparatos)

`OfficeDevice` obliga a todos los aparatos a declarar seis operaciones:
`getStatus`, `print`, `scan`, `fax`, `staple` y `refillToner`. Como ninguna
impresora de la oficina sabe hacerlas todas, las que sobran se implementan
lanzando `UnsupportedOperationError`.

Consecuencia: `OfficeWorkflow` no tiene forma de saber qué sabe hacer un aparato
**salvo llamándolo y viendo si explota**. Lee `printDocument()` y `digitize()`:
el `try/catch` no está capturando un error, está preguntando "¿tú sabes hacer
esto?".

Rediseña las interfaces para que **cada aparato solo declare lo que realmente
sabe hacer**, y para que el workflow pueda seleccionar el aparato adecuado sin
provocar excepciones.

> Fíjate también en `BasicInkjetPrinter.refillToner()`: es de tinta, no de
> tóner, así que devuelve `0` en silencio. Es la otra salida de emergencia
> cuando una interfaz te obliga a implementar algo que no te corresponde.

### Parte 2 — Liskov Substitution (los almacenes)

`DocumentStorage` documenta un contrato explícito en su cabecera. Comprueba si
cada subclase lo cumple de verdad:

| Implementación | ¿Cumple lo que promete la clase base? |
| --- | --- |
| `LocalDiskStorage` | … |
| `ObjectBucketStorage` | … |
| `ReadOnlyArchiveStorage` | … |

Hay **dos** violaciones distintas y conviene saber nombrarlas:

1. Una subclase **exige más** de lo que exige la base (rechaza entradas que la
   base acepta) → precondición reforzada.
2. Una subclase **cumple menos** de lo que promete la base (dice que ha hecho
   algo que no ha hecho) → postcondición debilitada.

Encuéntralas, y luego rediseña la jerarquía de forma que `ArchiveService` **pueda
fiarse de cualquier almacén que reciba** y se quede sin ningún `instanceof`.

### La prueba del algodón

- [ ] `OfficeWorkflow` no contiene ningún `try/catch` para averiguar capacidades.
- [ ] `ArchiveService` no contiene ningún `instanceof`.
- [ ] `ArchiveService.purge()` ya no necesita comprobar a mano si el borrado
      ocurrió de verdad: el valor devuelto es de fiar.
- [ ] Añade a la oficina un **fax de sobremesa** (solo envía faxes) y una
      **guillotina** (solo grapa y corta). Si puedes añadirlos sin escribir ni un
      solo método que lance "no soportado", has aplicado ISP.

---

## Criterios de aceptación

1. `npm test` en verde. **Los tests no se tocan.**
2. `npm run typecheck` sin errores.
3. Ninguna implementación lanza `UnsupportedOperationError`. De hecho, esa clase
   debería poder borrarse del proyecto.
4. `ReadOnlyArchiveStorage` sigue existiendo y sigue siendo consultable, pero ya
   no se le puede pedir por error una escritura: **el compilador lo impide**.
5. La última línea del `demo` deja de ser una contradicción.

---

## Pistas (si te atascas)

<details>
<summary>Pista 1 — el test de Liskov en una frase</summary>

*"Si sustituyo la clase base por cualquiera de sus hijas, ¿el código que las usa
sigue funcionando sin enterarse?"*

Si para que funcione hay que preguntar de qué clase es, o envolver la llamada en
un `try/catch`, la respuesta es no. Y ojo: **la herencia no es el problema**; el
problema es prometer un contrato que luego no se cumple.
</details>

<details>
<summary>Pista 2 — cuándo una jerarquía está mal cortada</summary>

`ReadOnlyArchiveStorage` no es "un almacén con una limitación". Es **otra cosa**:
algo que se lee pero no se escribe. Cuando una subclase tiene que *quitar*
capacidades de su padre, casi siempre es señal de que la abstracción del padre
era demasiado grande. Divídela por capacidades, no por tecnologías.
</details>

<details>
<summary>Pista 3 — a quién le toca normalizar el nombre</summary>

Hoy es `ArchiveService` quien limpia los espacios del nombre porque *sabe* que
el bucket los rechaza. Pregúntate: ¿de quién es ese conocimiento? Si mañana
llega un cuarto almacén con sus propias manías, ¿cuántos sitios hay que tocar?
</details>

---

## Reto extra

`OfficeWorkflow.capabilitiesReport()` enumera a mano cada clase concreta con
`instanceof`. Cada aparato nuevo obliga a volver a tocarlo: eso es también una
violación de Open/Closed, la de la clase anterior. Resuélvelo aprovechando el
rediseño de interfaces, sin añadir un campo `type: string` a los dispositivos.
