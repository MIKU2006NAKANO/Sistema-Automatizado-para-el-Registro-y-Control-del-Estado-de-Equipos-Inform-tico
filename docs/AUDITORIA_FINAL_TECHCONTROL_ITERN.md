# Auditoría final — TechControl ITERN

Fecha de auditoría: 30 de octubre de 2026.  
Alcance: revisión técnica, diagnóstico y documentación; no se modificó código fuente, backend, SQLite ni datos reales.

## 1. Información general y tecnologías

TechControl ITERN es una aplicación web local para administrar hasta 30 equipos. La interfaz se construye con React 19, TypeScript, React Router 7, Vite y CSS local; el servidor es Express 5 sobre Node.js 24; la persistencia se realiza con SQLite mediante `node:sqlite`.

La aplicación compilada y la API se sirven en el mismo origen local. El cliente consume rutas relativas bajo `/api`, evitando una dependencia de URL externa.

## 2. Componentes auditados

| Componente | Estado | Evidencia / resultado |
| --- | --- | --- |
| Panel administrativo | APROBADO | Indicadores se calculan desde inventario obtenido por API; distingue conexión, información anterior y falta de información verificable. |
| Registro de equipos | APROBADO | Formulario usa el dominio compartido, validación Zod, mensajes por campo, duplicados y límite protegidos por servidor/SQLite. |
| Inventario y ficha | APROBADO | Búsqueda, filtros, orden, detalle, edición por permisos, historial y paginación están conectados a la API. |
| Navegación | APROBADO | Barra superior compartida; menú mantiene una única sección activa, con regla explícita para inventario, ficha y edición. |
| Reportes | APROBADO | Filtros de fecha/búsqueda/ubicación/estado, PDF y XLSX locales; acciones desactivadas sin selección real. |
| Usuarios | APROBADO | Consulta y alta de cuentas técnicas disponibles solo al administrador; roles mostrados sin crear controles no soportados. |
| Sesiones y permisos | APROBADO | Pruebas cubren sesión, cierre, contraseñas, administrador/técnico y rechazo de privilegios enviados por cliente. |
| API local | APROBADO | `GET /api/health` respondió `techcontrol-itern`, `sqlite`, versión 2. |
| SQLite real | APROBADO | Apertura de solo lectura: `integrity_check=ok`, versión 2; se encontraron 2 usuarios, 1 equipo y 1 historial. |
| Revisión visual multiresolución | NO VERIFICADO | El navegador local fue deshabilitado por la configuración de Work durante la auditoría. El CSS contiene reglas responsive, pero no se declara revisión visual completada. |

## 3. Integración frontend, backend y almacenamiento

- React utiliza `src/lib/api.ts` para llamadas del mismo origen, con credenciales de sesión y cabecera local de protección.
- Express expone las rutas de autenticación, inventario, historial, usuarios, respaldos y salud.
- La interfaz no asume autorización: las rutas del cliente ocultan módulos por rol y las pruebas confirman que el servidor rechaza operaciones no permitidas.
- Las escrituras de prueba se ejecutan en bases temporales. La base real se abrió solo para comprobar integridad y conteos.

## 4. Registro, inventario e historial

La suite final cubrió creación, código automático, historial inicial, validaciones de entradas incompletas, series/inventarios duplicados normalizados, conflictos de edición, permisos, eliminación y límite de 30 incluso con solicitudes simultáneas. También verifica que registros, usuarios y sesiones persistan tras reinicio en entornos temporales.

El formulario muestra requisitos y errores de campo; las operaciones de registro y edición conservan la validación del servidor. Las fichas presentan el historial disponible sin inventar mantenimientos.

## 5. Reportes

Las pruebas de dominio cubren filtros por hoy, semana, mes, rango inclusivo, texto, ubicación y estado; verifican que el filtrado no altere registros originales. También cubren generación de PDF, Excel y neutralización de fórmulas en CSV.

PDF y Excel se cargan mediante importación dinámica cuando se exportan. La compilación genera fragmentos independientes para `pdf` y `excel`, por lo que no son dependencias de la carga inicial de la aplicación.

## 6. Operación local y sin Internet

- La API local respondió en `http://127.0.0.1:3000`.
- La revisión de fuentes de ejecución no encontró CDN, Supabase ni recursos HTTP(S) externos requeridos por el frontend.
- La suite incluye una protección que impide conexiones externas y una prueba que confirma ausencia de CDN, fuentes remotas y cliente Supabase.
- No fue posible desconectar físicamente Internet desde este entorno; la evidencia disponible respalda el funcionamiento offline una vez instaladas las dependencias y compilado el proyecto.

Procedimiento manual recomendado: iniciar `Iniciar TechControl.bat`, desconectar Internet, abrir `http://127.0.0.1:3000`, iniciar sesión, consultar inventario y generar un PDF/XLSX con registros existentes.

## 7. Pruebas ejecutadas

| Comando / comprobación | Resultado |
| --- | --- |
| `pnpm build` | APROBADO. TypeScript y Vite finalizaron correctamente. |
| `pnpm test` | APROBADO. 15 pruebas de dominio + 30 de integración/API/supervisión = 45 aprobadas. |
| `/api/health` real | APROBADO. Aplicación, SQLite y versión confirmadas. |
| `PRAGMA integrity_check` real, solo lectura | APROBADO: `ok`. |

Vite muestra una advertencia no bloqueante por tamaño del fragmento dinámico de Excel (y recomienda evaluar code splitting). No se considera un defecto funcional: el archivo se carga solo durante exportación.

## 8. Observaciones y recomendaciones

1. **Revisión responsive manual pendiente.** No es una evidencia funcional negativa, pero antes de demostración conviene abrir el sistema en escritorio, aproximadamente 900 px, tableta y móvil; revisar barra lateral, tabla con scroll contenido, formulario, reportes y usuarios.
2. **Prueba offline física pendiente.** Ejecutar el procedimiento indicado arriba con Internet desconectado; la evidencia de código y pruebas está disponible, pero no reemplaza esa prueba en el equipo de entrega.
3. **Advertencia de tamaño de Excel.** Mantener importación dinámica actual. Optimizar más solo si se detecta una demora real durante la exportación.

No se identificaron errores funcionales bloqueantes durante esta auditoría.

## 9. Conclusión

Clasificación final: **APTO CON OBSERVACIONES**.

Las funciones esenciales se compilan, se prueban e integran correctamente con la API local y SQLite. La aplicación está preparada para demostración y entrega técnica, con la recomendación de realizar antes una revisión manual visual en dispositivos y una prueba física sin Internet, ambas no verificables desde el entorno actual.
