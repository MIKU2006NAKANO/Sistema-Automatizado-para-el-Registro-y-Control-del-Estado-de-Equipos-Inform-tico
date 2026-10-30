# Cambios Frontend

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/App.tsx` | Nuevo panel administrativo, ruta `/panel`, navegación reorganizada y resumen de equipos que requieren atención. |
| `src/components/Users.tsx` | Carga y presentación de las cuentas existentes mediante `api.users()`, además del formulario de alta ya disponible. |
| `src/styles.css` | Estilos para panel, tarjetas de estado, lista de atención, gestión de usuarios y adaptación móvil. |
| `src/lib/api.ts` | Consulta tipada de salud local mediante `/api/health` para informar la disponibilidad real del sistema. |

## Comportamiento conservado

- API REST, autenticación, roles, restricciones de SQLite, historial, reportes, respaldos y supervisión permanecen sin cambios.
- No se añadieron datos de ejemplo ni nuevos estados de equipo.
- Administradores continúan siendo los únicos con navegación a registro, reportes y usuarios; el backend mantiene la autorización efectiva.
- El frontend sigue usando recursos y bibliotecas locales para operar sin Internet.

## Resultado visual

El administrador llega a un panel que prioriza la situación real del laboratorio. Desde allí puede registrar un equipo, abrir el inventario o ir a reportes. Los técnicos se mantienen dirigidos al inventario, de acuerdo con sus permisos.

La tarjeta operativa del panel también distingue API/SQLite disponibles, actualización en curso, última consulta disponible y ausencia de información verificable.
