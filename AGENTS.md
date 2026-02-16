# AGENTS.md

## Convenciones del proyecto

### Tablas en vistas nuevas o modificadas
Cuando se implemente una tabla (listados, catalogos, reportes), debe incluir por defecto:

1. Busqueda (`input` con filtro en cliente).
2. Ordenamiento por columnas relevantes (asc/desc).
3. Exportacion a Excel del resultado visible (filtrado/ordenado).
4. Paginacion (selector de tamano + navegacion y contador de rango).
5. Estado de carga.
6. Estado de error con accion de reintento.
7. Estado vacio cuando no haya resultados.

### Estilo obligatorio para tablas
SIEMPRE usar el estilo de referencia de `src/app/pages/compras/proveedores/listas-precios.component.html`
y `src/app/pages/compras/proveedores/listas-precios.component.scss`.

Reglas visuales obligatorias:

1. Paginacion al final de la tabla (bloque inferior tipo `pagination`).
2. Boton `Exportar` en la parte superior derecha de la tabla (header de herramientas).
3. Campo de busqueda estetico en el header (patron `search-control` con icono).
4. Tabla con clases de estilo equivalentes al patron (`table-wrap`, `listas-table`).

### Criterio de implementacion recomendado

1. Mantener un arreglo fuente (`items`) y un arreglo derivado (`displayItems`).
2. Aplicar busqueda y ordenamiento sobre `displayItems`.
3. Paginar sobre un arreglo de pagina (`paginatedItems`) derivado de `displayItems`.
4. Exportar a Excel usando `displayItems`, no el arreglo fuente.
5. Usar `trackBy` en `*ngFor` para filas.
