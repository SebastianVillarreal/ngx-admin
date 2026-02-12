# AGENTS.md

## Convenciones del proyecto

### Tablas en vistas nuevas o modificadas
Cuando se implemente una tabla (listados, catálogos, reportes), debe incluir por defecto:

1. Búsqueda (`input` con filtro en cliente).
2. Ordenamiento por columnas relevantes (asc/desc).
3. Exportación a Excel del resultado visible (filtrado/ordenado).
4. Paginación (selector de tamaño + navegación y contador de rango).
5. Estado de carga.
6. Estado de error con acción de reintento.
7. Estado vacío cuando no haya resultados.

### Criterio de implementación recomendado

1. Mantener un arreglo fuente (`items`) y un arreglo derivado (`displayItems`).
2. Aplicar búsqueda y ordenamiento sobre `displayItems`.
3. Paginar sobre un arreglo de página (`paginatedItems`) derivado de `displayItems`.
4. Exportar a Excel usando `displayItems`, no el arreglo fuente.
5. Usar `trackBy` en `*ngFor` para filas.
