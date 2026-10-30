# Pruebas de integración

Fecha de ejecución: 30 de octubre de 2026.

## Dependencias

Se reconstruyó `node_modules` con `pnpm install --frozen-lockfile`. Se confirmó Node.js `v24.19.0` y pnpm `11.25.0`. El lockfile no fue modificado.

## Automatizadas

| Comando | Resultado |
| --- | --- |
| `pnpm test` | Correcto: 15 pruebas Vitest de dominio y 30 pruebas de API/supervisión; 45 pruebas aprobadas en total. |
| `pnpm build` | Correcto: TypeScript y Vite completaron la compilación de producción. |

La suite verifica autenticación, permisos, inyección SQL, persistencia, historial, límite simultáneo de 30 equipos, respaldos/restauración, trabajo offline y señalización de supervisión. Usa bases temporales para escrituras de prueba, sin cambiar la base real.

## Manual en entorno aislado

Se arrancó una instancia temporal con `TECHCONTROL_DATA_DIR` fuera de `data/`, en el puerto 3100. Se verificó:

- `GET /api/health`: respuesta correcta con almacenamiento SQLite y versión 2.
- Inicio de sesión local en la base temporal.
- Renderizado del panel administrativo con datos reales de esa instancia vacía.
- Renderizado de la vista de usuarios y su listado.
- Distribución adaptable mediante vista móvil.

## Observaciones

Vite informa una advertencia por fragmentos de exportación PDF/Excel superiores a 500 kB tras minificación. La compilación termina correctamente; se puede evaluar carga diferida adicional si el rendimiento de inicio se vuelve un problema medible.

En la corrección posterior de conexión se comprobó adicionalmente la respuesta real de `/api/health` en el puerto 3000 y una instancia aislada en el puerto 3101: respondió con SQLite disponible y, al detenerla, rechazó la conexión como se esperaba. El servidor real permaneció disponible.
