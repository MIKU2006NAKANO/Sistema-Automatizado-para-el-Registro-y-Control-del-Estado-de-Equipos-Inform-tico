# Mejoras de Registro e Inventario UX/UI

## Componentes analizados

| Área | Archivo principal | Responsabilidad |
| --- | --- | --- |
| Aplicación, navegación, registro e inventario | `src/App.tsx` | Rutas, menú lateral, barra superior, formulario, filtros y tabla |
| Dominio compartido | `src/domain.ts` | Campos admitidos, validación Zod, filtros y cálculos |
| Comunicación | `src/lib/api.ts` | Cliente de la API REST local |
| Estilos | `src/styles.css` | Diseño institucional, estados y adaptación responsive |

Los componentes reutilizables conservados incluyen `PageHeading`, `Loading`, `Empty`, `Badge`, `EquipmentTable` y los controles de navegación superiores.

## Problemas identificados

1. El enlace de Inventario quedaba activo también al abrir `/equipos/nuevo`, ya que la coincidencia de `NavLink` era parcial.
2. Los campos de RAM y capacidad de almacenamiento comenzaban con `8` y `256`, lo que podía registrar información no confirmada.
3. La validación del formulario se presentaba principalmente como un mensaje global, sin señalar el campo correspondiente.
4. Inventario no recibía el permiso de administrador para presentar una acción de alta contextual.
5. La paginación aparecía aun cuando había una sola página.

## Mejoras implementadas

### Navegación

- La navegación lateral ahora usa rutas exactas para panel, registro, reportes y usuarios.
- Inventario se marca activo para listado, ficha y edición de un equipo; Registro se marca activo exclusivamente en `/equipos/nuevo`.
- Todas las pantallas conservan la barra superior común y su miga contextual.

### Registro de equipos

- RAM y capacidad de almacenamiento comienzan vacías en nuevos registros; no se modifican equipos existentes.
- Los campos obligatorios se indican con `*` y Observaciones queda marcada como opcional.
- Se añadieron ayudas breves para serie, inventario, ubicación y unidades técnicas.
- La validación Zod existente se muestra junto al campo que requiere corrección, además de un resumen accesible.
- Los campos inválidos comunican `aria-invalid` y mantienen foco/uso por teclado.
- Se agregó advertencia nativa de navegador para cambios sin guardar al intentar cerrar o recargar la página.
- El procesamiento, éxito, error de servidor y rechazo de duplicados conservan los datos ingresados; el éxito continúa hacia la ficha del equipo guardado.

### Inventario

- Solo el administrador ve el botón **Registrar equipo** y la acción de primer registro.
- La búsqueda declara los criterios reales: código, nombre, marca, modelo, serie e inventario.
- Se conservaron filtros por estado, ubicación y ordenamiento existentes.
- Las acciones de detalle mantienen etiquetas accesibles.
- La paginación se oculta cuando no hace falta; el resumen conserva total y capacidad real de 30 equipos.
- Los estados vacíos diferencian entre inventario vacío y búsqueda sin coincidencias.

## Archivos modificados

- `src/App.tsx`
- `src/styles.css`
- `docs/MEJORAS_REGISTRO_INVENTARIO_UX.md`

No se modificaron `server/store.mjs`, migraciones, esquema SQLite, autenticación, permisos, historial ni API REST.

## Verificación

- `pnpm build`: correcto, sin errores TypeScript.
- `pnpm test`: correcto, 45 pruebas aprobadas.
- La suite ejecuta las escrituras en bases temporales y comprueba: alta, duplicados, validación, roles de administrador/técnico, límite de 30, historial, persistencia y funcionamiento local.

La revisión visual automatizada adicional no estuvo disponible porque el navegador local fue deshabilitado por la configuración de Work durante esta etapa. La compilación y las pruebas de integración finalizaron correctamente; se recomienda una revisión manual breve del menú activo y del formulario en navegador antes de la demostración final.

## Pendientes

- La advertencia nativa protege recarga/cierre con cambios pendientes; una confirmación propia al cambiar de ruta podría añadirse si se vuelve necesaria, evitando duplicar confirmaciones.
- Vite mantiene una advertencia no bloqueante sobre el tamaño de los paquetes PDF/Excel.
