# Diagramas ICONIX en Enterprise Architect

Scripts JScript que crean en **Enterprise Architect** los diagramas ICONIX de Bandada U a partir de la
documentación Mermaid de `docs/`. Están pensados para quien trabaja en **Windows** con EA: no necesitas
Node, Mermaid ni nada más, solo los archivos de `scripts/`.

> **Estado de la verificación.** Los scripts se generaron y probaron en macOS contra una simulación
> de la API de EA (`probar-scripts.mjs`): confirma sintaxis ES3, que no hay errores de lógica y que
> los conteos de paquetes, elementos y conectores coinciden. **No se ejecutaron en un EA real.** La
> primera persona que los corra en Windows debe revisar el resultado y avisar de lo que falle
> (ver «Limitaciones»).

## Qué genera cada script

| Script | Diagramas | Contenido |
|---|---|---|
| `01-casos-de-uso-y-dominio.js` | 2 | Diagrama general de casos de uso (8 actores, 24 UC en 7 paquetes) y modelo de dominio |
| `02-modelo-estatico.js` | 8 | Clases de diseño de cada servicio (identidad, social, media, eventos, billetera, entradas, notificaciones, insights) |
| `03-robustez.js` | 27 | Diagramas de robustez de los 24 UC (UC-12 tiene 4: curso básico y alternos) con elementos Boundary, Control y Entity |
| `04-secuencia.js` | 54 | Diagramas de secuencia de los 24 UC |
| `05-arquitectura-y-despliegue.js` | 4 | Vista de contenedores, mapa de contextos DDD, despliegue local (Docker Compose) y despliegue en la nube (AWS, Azure y GCP con Tailscale) |

Cada script crea **un paquete raíz propio** (por ejemplo «Bandada U - 03 Robustez») bajo el primer
modelo del proyecto, con un subpaquete por UC o servicio. Si ese paquete ya existe, el script se
detiene sin tocar nada: bórralo antes de volver a ejecutarlo.

## Cómo ejecutarlos (EA 15 o superior, Windows)

1. Abre un proyecto en EA. **Usa una copia o un proyecto de prueba**, porque los scripts crean miles de
   elementos (el de secuencia, unos 1700 conectores).
2. Menú **View > Scripting** (o `Ctrl+Alt+8`).
3. Clic derecho en **Normal Scripts > New Script**, elige lenguaje **JScript** y ponle un nombre.
4. Borra el contenido de ejemplo, pega el archivo `.js` completo y pulsa **Run** (el triángulo verde).
5. Mira la pestaña **Script** de *System Output*: muestra el avance (`3/27 ...`) y un resumen final.
6. Repite con los otros scripts. En el *Project Browser* aparecen los paquetes y los diagramas.

Tardan entre unos segundos y un par de minutos cada uno. No cierres EA mientras corren.

## Cómo se mapea Mermaid a EA

| Mermaid | EA |
|---|---|
| Actor `(["…"])` fuera de subgrafo / `actor` | Elemento **Actor** |
| UC dentro de `subgraph` | Elemento **UseCase** en un subpaquete con el nombre del subgrafo |
| `«boundary» …`, `«control» …`, `«entity» …` | Elementos **Boundary**, **Control**, **Entity** en un diagrama **Analysis** |
| `participant X as Y` | Elemento **Object** (línea de vida) |
| `A->>B: texto` / `A-->>B: texto` | Conector **Sequence** con `SequenceNo` correlativo. Los retornos llevan el prefijo `(retorno)` |
| `alt`/`opt`/`loop`/`par` | Se antepone `[alt …]`, `[loop …]` al texto del mensaje (no se crean fragmentos) |
| Subgrafo en arquitectura / despliegue | Elemento **Boundary** (contenedores) o **Node** (despliegue), con los componentes dibujados dentro |
| Nodo `["…"]`, `[("…")]`, `{{"…"}}` en arquitectura | **Component** (estereotipo `datastore` para bases y `message broker` para RabbitMQ), con las líneas extra del rótulo en *Notes* |
| `class X { … }`, `<<AggregateRoot>>` | **Class** con atributos, operaciones y estereotipo |
| `namespace Y { … }` | Subpaquete `Y` |
| `<\|--`, `*--`, `o--`, `-->`, `..>`, `..\|>` | Generalization, Association con diamante (compuesta o compartida), Association dirigida, Dependency y Realization |

## Limitaciones conocidas

- **No se importan** las notas (`Note over …`), los fragmentos combinados reales de secuencia, los
  diagramas de estados (`stateDiagram-v2`), el Gantt ni los demás `flowchart` de `docs/03-arquitectura` (solo se importan los cuatro de arquitectura y despliegue). Los diagramas de estados de la SAGA están en
  `docs/03-arquitectura/saga-inscripcion-evento.md`.
- Las relaciones entre casos de uso (`include`/`extend` de la sección «Relaciones entre casos de uso» del
  catálogo) no están en el Mermaid original, así que no se crean.
- **Disposición:** robustez usa columnas fijas (actores, boundary, control, entity); casos de uso y clases
  intentan el autoacomodo de EA (`LayoutDiagramEx`) y, si falla, quedan en rejilla. En arquitectura y despliegue la
  disposición es una rejilla anidada calculada por el generador. En los
  diagramas de secuencia el orden de los mensajes sale de `SequenceNo`; **si EA los dibuja
  desordenados, reordénalos con el menú del diagrama (`Sequence > Auto Number` o a mano) y avisa** para
  ajustar el script.
- Los conectores de un diagrama aparecen al abrirlo; si faltara alguno, usa clic derecho en el diagrama >
  **Show Relations** (o `Ctrl+Alt+R`).

## Regenerar los scripts (quien tenga Node 20+)

Los `.js` de `scripts/` están versionados y **no se editan a mano**. Si cambia algún Mermaid de `docs/`:

```bash
node entregable/ea/generar-scripts-ea.mjs   # reescribe entregable/ea/scripts/*.js
node entregable/ea/probar-scripts.mjs       # valida sintaxis y conteos con la simulación de EA
```

`runtime.js` es la lógica común (se antepone a los datos de cada script).
