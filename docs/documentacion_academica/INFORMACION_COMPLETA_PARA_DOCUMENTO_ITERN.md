# 1. Definición del Problema

Informe técnico de referencia para redacción posterior en Word. Fecha de recopilación: 30 de octubre de 2026. Proyecto inspeccionado: TechControl ITERN, carpeta local proporcionada por el equipo. Este informe no sustituye el documento académico definitivo ni atribuye autorías individuales.

**Clasificación de evidencia obligatoria:** COMPROBADA = observada en código, metadatos o lectura de esquema; DOCUMENTADA = informe o resultado previo disponible; PROPUESTA = justificación o ampliación sugerida; PENDIENTE = información institucional o verificación no disponible. Las referencias son relativas a la raíz del proyecto; las líneas corresponden a la versión inspeccionada y pueden variar si el código cambia. No se incluyen registros personales ni valores de credenciales.

## 1.1. Requisitos

### Requisitos funcionales

Las siguientes capacidades son COMPROBADAS en código; ello no significa que cada flujo visual haya sido probado en navegador. No se encontró una especificación original firmada de requisitos; la tabla reconstruye requisitos a partir de la implementación.

| Código | Nombre | Descripción | Módulo | Actor | Estado implementado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| RF-01 | Autenticación | Validar identificador local y contraseña; crear sesión de ocho horas. | Acceso | Ambos | UI y API | server/app.mjs:29-33; server/store.mjs:38-41 |
| RF-02 | Cerrar sesión | Eliminar sesión asociada y limpiar cookie. | Acceso | Ambos | UI y API | server/app.mjs:32; src/lib/api.ts:15 |
| RF-03 | Registrar equipo | Guardar ficha, asignar código secuencial e historial inicial. | Registro | Administrador | UI y API | server/store.mjs:61-75; src/App.tsx EquipmentForm |
| RF-04 | Consultar equipos | Recuperar inventario autenticado y ficha derivada de esa lista. | Inventario | Ambos | UI y API | server/app.mjs:37; src/App.tsx EquipmentList/Details |
| RF-05 | Buscar y filtrar | Buscar código, nombre, marca, modelo, serie e inventario; combinar estado y ubicación en Inventario. | Inventario | Ambos | UI | src/domain.ts:11 |
| RF-06 | Ordenar y paginar | Ordenar por código/nombre/fecha y mostrar ocho filas por página. | Inventario | Ambos | UI | src/App.tsx EquipmentList |
| RF-07 | Editar ficha | Modificar campos admitidos con control de versión. | Equipos | Administrador | UI y API | server/store.mjs:61-75 |
| RF-08 | Cambiar estado | Actualizar estado y observaciones; exigir motivo al cambiar estado. | Equipos | Ambos | UI y API | server/store.mjs:12,61-75 |
| RF-09 | Consultar historial | Mostrar estado previo/nuevo, motivo, fecha y actor. | Ficha | Ambos | UI y API | server/app.mjs:38; server/store.mjs:60 |
| RF-10 | Eliminar equipo | Eliminar equipo y su historial en cascada, comprobando versión. | Ficha | Administrador | UI y API | server/store.mjs:76; migración 001 |
| RF-11 | Consultar indicadores | Calcular total, funcionales, fallas, mantenimiento y capacidad. | Panel | Administrador en UI | UI | src/domain.ts:10; Dashboard |
| RF-12 | Exportar documentos | Filtrar por fecha de registro, texto y estado; generar PDF y XLSX con selección. | Reportes | Administrador en UI | UI | ReportControls.tsx; reportFilters.ts:6-15; lib/reports.ts; lib/excel.ts |
| RF-13 | Consultar y crear usuarios | Listar perfiles y crear cuentas técnicas desde interfaz. | Usuarios | Administrador | UI y API | server/app.mjs:42-43; Users.tsx |
| RF-14 | Cambiar rol | Asignar administrador/técnico con comprobación de versión, sin autoasignación y preservando último administrador. | Usuarios | Administrador | Solo API, no UI | server/app.mjs:44; server/store.mjs:43-57 |
| RF-15 | Cambiar contraseña | Validar actual, guardar hash nuevo y revocar sesiones anteriores. | Acceso | Ambos autenticados | API; componente sin ruta | server/app.mjs:36; Configuration.tsx |
| RF-16 | Respaldar | Crear SQLite íntegra sin sesiones ni vinculaciones y permitir descarga administrativa. | Respaldo | Administrador / arranque automático | API y servicio; sin pantalla activa | server/app.mjs:45-46; server/store.mjs:78; server/index.mjs:16 |
| RF-17 | Restaurar | Verificar copia, bloquear acceso concurrente, conservar base previa e invalidar sesiones. | Operación local | Operador del servidor | CLI | scripts/restore.mjs restoreBackup |
| RF-18 | Límite y unicidad | Máximo 30 equipos; códigos, series e inventarios únicos. | Datos | Servidor | SQL y API | migración 001:31-34; store.save |
| RF-19 | Preferencia visual | Alternar tema inmediato, guardar preferencia y usar sistema si falta. | Interfaz | Ambos | UI | public/theme-init.js; App.tsx preferredDark |
| RF-20 | Estado de conexión | Reintentar consulta, mostrar última consulta o no disponibilidad. | Panel | Autenticados | UI | App.tsx reload/Dashboard |

**Complemento de supervisión, COMPROBADA:** existen rutas de vinculación, tablas, señalización WSS y clase WebRTC. El arranque normal pasa lan=null y las rutas React actuales no montan las pantallas de supervisión. No se considera función disponible del sistema administrativo entregado. Fuentes: server/index.mjs:11-25; server/supervision*.mjs; src/supervision; App.tsx Routes.

### Requisitos no funcionales

| Código | Característica | Evidencia y alcance | Origen |
| --- | --- | --- | --- |
| RNF-01 | Operación local sin Internet | Recursos instalados/compilados, API relativa, servidor loopback, guardia de pruebas offline. No se desconectó físicamente Internet. | DOCUMENTADA README; COMPROBADA index.mjs, api.ts, offline-guard.mjs |
| RNF-02 | Persistencia | SQLite en disco, WAL y synchronous=FULL; no depende de localStorage para inventario. | COMPROBADA store.mjs:18-26 |
| RNF-03 | Integridad | Claves foráneas activadas por conexión, transacciones, CHECK, índices únicos y trigger de capacidad. | COMPROBADA migraciones y store.mjs |
| RNF-04 | Seguridad de acceso | scrypt con sal aleatoria, hash de token, cookie HttpOnly/SameSite, ocho horas, permisos en servidor. No implica cifrado de SQLite. | COMPROBADA store.mjs:14-15,38-41; app.mjs:13-36 |
| RNF-05 | Protección de peticiones | Host/origen, cabecera local, JSON 40 kB, límite de intentos, CSP y consultas parametrizadas. | COMPROBADA app.mjs:17-27,50 |
| RNF-06 | Concurrencia | BEGIN IMMEDIATE y comparación updated_at antes de editar/eliminar. | COMPROBADA store.mjs:26,61-76 |
| RNF-07 | Recuperación | Respaldo de inicio, copia verificable y restauración con conservación de base previa. | COMPROBADA index.mjs:16; restore.mjs |
| RNF-08 | Rendimiento acotado | Inventario máximo de 30, paginación local de ocho filas, carga dinámica PDF/Excel. No hay medición de latencia ni SLA. | COMPROBADA App.tsx y ReportControls.tsx |
| RNF-09 | Disponibilidad | Requiere servidor y computadora encendidos; reconsulta cada cinco segundos al estar visible. Sin alta disponibilidad. | COMPROBADA App.tsx reload/effect |
| RNF-10 | Usabilidad | Mensajes de error/éxito, confirmación de eliminación, estados vacíos, filtros y botones de proceso. | COMPROBADA App.tsx y componentes |
| RNF-11 | Accesibilidad | Etiquetas, aria-invalid, aria-label, role alert/status/dialog, foco visible y movimiento reducido; auditoría completa pendiente. | COMPROBADA App.tsx, styles.css |
| RNF-12 | Adaptabilidad | Media queries de 1500/1200/1000/900/640 px y tabla con scroll propio. No constituye prueba visual multiresolución. | COMPROBADA styles.css |
| RNF-13 | Compatibilidad | Node >=24; navegador moderno para React y color-mix. WebRTC requiere contexto seguro si se habilita en futuro. | COMPROBADA package.json; peer.ts |
| RNF-14 | Mantenibilidad | Dominio compartido, migraciones versionadas, cliente API centralizado, pruebas y lockfile. App.tsx agrupa múltiples vistas. | COMPROBADA estructura |
| RNF-15 | Temas | Preferencia local persistente y tokens semánticos; cálculo previo de contraste de pares base, sin certificación global. | COMPROBADA styles.css; DOCUMENTADA NUEVA_PALETA_Y_MEJORAS_REPORTES.md |

## 1.2. Análisis

**DOCUMENTADA:** README.md describe un sistema local para registrar/controlar hasta 30 computadoras del laboratorio. La finalidad verificable es centralizar fichas técnicas, consultar estados y conservar sus transiciones.

**COMPROBADA:** la aplicación beneficia a dos perfiles operativos: el administrador gestiona registros y accesos; el técnico consulta y modifica estado/observaciones. El operador local mantiene el proceso y sus respaldos. Este último es un papel de operación, no un tercer rol de autenticación.

**PROPUESTA de justificación:** un inventario manual puede dificultar localizar registros, evitar duplicados y seguir cambios. No existe evidencia de encuestas, pérdidas de equipos, fallas de control o tiempos institucionales medidos. Esos problemas no deben redactarse como hechos del instituto.

**Alcance comprobado:** una base local central en una computadora, fichas manuales, tres estados, historial de estados, exportaciones y cuentas locales. El límite no crea 30 computadoras automáticamente. No hay detección de hardware, mantenimiento independiente, sincronización distribuida ni acceso LAN normal.

**PENDIENTE:** situación inicial del laboratorio, procesos anteriores, necesidades levantadas, objetivos originales, criterios de éxito, beneficiarios cuantificados y actas del equipo. Deben consultarse en DATOS_PENDIENTES_DEL_EQUIPO.md.

# 2. Modelo

## 2.1. Casos de uso

**COMPROBADA:** los actores de aplicación son Administrador y Técnico; permisos comprobados en server/app.mjs:33-46 y store.save/remove/createUser/assignRole. Ambos heredan conceptualmente las operaciones comunes de un usuario autenticado. La exportación es una acción de navegador habilitada al administrador por React; no existe una autorización de endpoint de exportación porque tal endpoint no existe.

El diagrama UML se encuentra en [01_casos_de_uso.puml](diagramas/01_casos_de_uso.puml). Las fichas siguientes describen acciones, no solamente pantallas. Los datos de contraseña se mencionan como tipo de entrada, sin revelar valores.

### CU-01. Iniciar sesión

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Obtener acceso local |
| Actor principal | Administrador o Técnico |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sin sesión válida; servidor disponible |
| Entradas | Identificador y contraseña |
| Flujo principal | Login envía POST; Zod valida; store consulta usuario y comprueba scrypt; crea sesión; Express fija cookie; React solicita perfil. |
| Alternativas y errores | Credenciales incorrectas 401; demasiados intentos 429; servidor inaccesible. |
| Postcondición y resultado esperado | Perfil disponible y sesión persistente temporal. |
| Fuente | Login.tsx submit; app.mjs:31; store.mjs:38-40 |

### CU-02. Cerrar sesión

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Finalizar acceso |
| Actor principal | Ambos |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión existente |
| Entradas | Cookie |
| Flujo principal | POST logout; elimina hash de sesión; limpia cookie; React vacía perfil e inventario. |
| Alternativas y errores | Fallo de red muestra error; la sesión puede seguir vigente hasta revocación/expiración. |
| Postcondición y resultado esperado | La sesión utilizada deja de autorizar consultas. |
| Fuente | App.tsx topbar; app.mjs:32 |

### CU-03. Registrar computadora

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Incorporar una ficha real |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión administrativa; menos de 30 equipos |
| Entradas | Ficha EquipmentInput |
| Flujo principal | Formulario valida; POST; servidor revalida rol/esquema; transacción incrementa contador, inserta ficha e historial; UI recarga y abre detalle. |
| Alternativas y errores | 400 validación; 409 duplicado/capacidad; 401 sesión; 403 rol; rollback. |
| Postcondición y resultado esperado | Equipo con UUID, código y fechas, persistente. |
| Fuente | EquipmentForm; store.mjs:61-75 |

### CU-04. Consultar/buscar inventario

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Localizar computadora |
| Actor principal | Ambos |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión válida |
| Entradas | Texto, estado, ubicación, orden/página |
| Flujo principal | GET lista; cliente filtra, ordena y muestra ocho por página; ficha se busca en lista cargada. |
| Alternativas y errores | Lista vacía, sin coincidencias, red o sesión vencida. |
| Postcondición y resultado esperado | Información consultada sin escritura. |
| Fuente | EquipmentList/Details; domain.ts:11; app.mjs:37 |

### CU-05. Consultar historial

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Conocer cambios de estado |
| Actor principal | Ambos |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Equipo existente y sesión |
| Entradas | ID UUID del equipo |
| Flujo principal | GET historial; store verifica equipo; ordena por fecha y rowid descendentes; UI muestra transición, autor y motivo. |
| Alternativas y errores | 404 inexistente; UUID inválido 400; errores de red. |
| Postcondición y resultado esperado | Historial mostrado, sin cambios. |
| Fuente | Details; store.mjs:60 |

### CU-06. Editar ficha técnica

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Actualizar características reales |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Ficha existente consultada |
| Entradas | Campos completos y expected_updated_at |
| Flujo principal | Formulario conserva valores originales; PUT; compara versión; actualiza atómicamente; si cambió estado inserta historial. |
| Alternativas y errores | 409 edición concurrente; motivo ausente; duplicados o validación. |
| Postcondición y resultado esperado | Ficha actualizada; no hay auditoría general de campos técnicos. |
| Fuente | EquipmentForm; store.save |

### CU-07. Actualizar estado/observaciones

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Registrar estado actual |
| Actor principal | Ambos |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Equipo existente y versión vigente |
| Entradas | Estado admitido, observaciones, motivo si cambia |
| Flujo principal | Técnico envía solo dos campos; stateSchema estricto rechaza extras; transacción actualiza y registra cambio si corresponde. |
| Alternativas y errores | Motivo vacío 400; conflicto 409; equipo inexistente 404. |
| Postcondición y resultado esperado | Estado y transición persistentes; observación sola no crea historial. |
| Fuente | store.mjs:12,61-75 |

### CU-08. Eliminar equipo

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Retirar ficha del inventario |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Confirmación UI y versión vigente |
| Entradas | ID y expected_updated_at |
| Flujo principal | Modal advierte; DELETE; servidor valida rol y versión; elimina ficha; cascada elimina historial; UI recarga. |
| Alternativas y errores | Cancelar; 403 técnico; 409 conflicto; 404 inexistente. |
| Postcondición y resultado esperado | Plaza liberada; el historial del equipo también se pierde. |
| Fuente | Details; store.mjs:76; migración 001 |

### CU-09. Generar reporte

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Obtener listado/resumen |
| Actor principal | Administrador en UI |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Inventario cargado; selección válida no vacía |
| Entradas | Período, texto, estado y tipo PDF |
| Flujo principal | reportDataset filtra created_at; botón importa librería; PDF recibe selección/contexto o XLSX agrega Equipos/Resumen; descarga local. |
| Alternativas y errores | Rango inválido/vacío desactiva botones; error de generación. |
| Postcondición y resultado esperado | Archivo descargado; base sin escritura. |
| Fuente | ReportControls.tsx; reportFilters.ts; reports.ts; excel.ts |

### CU-10. Consultar/crear cuenta

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Administrar accesos técnicos |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión administrativa |
| Entradas | Nombre, identificador, contraseña |
| Flujo principal | GET lista; formulario envía POST con rol técnico; backend valida y calcula hash; inserta en transacción; UI recarga. |
| Alternativas y errores | Duplicado 409, validación 400, técnico 403. |
| Postcondición y resultado esperado | Cuenta persistente disponible para login. |
| Fuente | Users.tsx; app.mjs:42-43; store.createUser |

### CU-11. Asignar rol por API

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Cambiar permiso de otra cuenta |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión administrativa; no cambiar propio rol |
| Entradas | ID, role, expected_role |
| Flujo principal | PATCH; verifica actor y rol anterior; preserva al menos un administrador; actualiza y elimina sesiones del destinatario. |
| Alternativas y errores | Autoasignación 403; conflicto 409; último administrador; 404. |
| Postcondición y resultado esperado | Nuevo rol; sesiones previas revocadas. No hay control visual activo. |
| Fuente | app.mjs:44; store.assignRole |

### CU-12. Cambiar contraseña por API

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Renovar secreto de acceso |
| Actor principal | Ambos |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión y contraseña actual válida |
| Entradas | Contraseña actual y nueva |
| Flujo principal | POST; valida nueva longitud; comprueba actual; calcula hash; actualiza y elimina sesiones; API crea cookie nueva. |
| Alternativas y errores | Actual incorrecta 400; datos inválidos; fallo de red. |
| Postcondición y resultado esperado | Hash actualizado, sesiones anteriores invalidadas. Configuración no montada. |
| Fuente | app.mjs:36; store.changePassword; Configuration.tsx |

### CU-13. Crear/descargar respaldo

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Obtener copia recuperable |
| Actor principal | Administrador |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Sesión administrativa |
| Entradas | Solicitud y nombre de respaldo |
| Flujo principal | POST crea copia vía SQLite backup; elimina sesiones/códigos; integrity_check; renombra copia; GET descarga. |
| Alternativas y errores | Sin permisos 403; nombre inválido 400; inexistente 404; error de archivo. |
| Postcondición y resultado esperado | Archivo local íntegro; no se alteran fichas originales. |
| Fuente | app.mjs:45-46; store.createBackup |

### CU-14. Restaurar respaldo

| Campo | Especificación COMPROBADA |
| --- | --- |
| Objetivo | Recuperar datos |
| Actor principal | Operador local |
| Actores secundarios | Ningún otro actor externo requerido; API/SQLite son componentes internos. |
| Precondiciones | Servidor detenido; archivo válido |
| Entradas | Ruta del respaldo |
| Flujo principal | CLI valida integridad/esquema; adquiere lock; prepara copia sin sesiones; conserva base anterior; instala copia. |
| Alternativas y errores | Bloqueo activo, versión inválida, copia dañada o ruta incorrecta. |
| Postcondición y resultado esperado | Base restaurada y anterior conservada; requiere iniciar y autenticarse. |
| Fuente | scripts/restore.mjs |

## 2.2. Modelo del dominio

Diagrama: [02_dominio.mmd](diagramas/02_dominio.mmd). Clasificación COMPROBADA con representación conceptual.

| Concepto | Atributos conceptuales | Función y relación |
| --- | --- | --- |
| Equipo | Identificación, características, ubicación, estado y observaciones | Elemento inventariado; conserva cambios de estado. |
| Usuario | Identificador de acceso, nombre y rol | Realiza acciones autorizadas y aparece como responsable. |
| Estado | Funcional, Con fallas, En mantenimiento | Catálogo conceptual, implementado como enum/valores CHECK, sin tabla propia. |
| Cambio de estado | Estado previo/nuevo, momento, motivo, responsable | Evento de alta o transición. No equivale a mantenimiento. |
| Sesión de acceso | Identidad y vencimiento | Autorización temporal; una cuenta puede mantener varias. |
| Reporte | Selección y formato | Resultado derivado; no es entidad persistida ni clase real. |

La vinculación de pantalla constituye un subdominio complementario, no el inventario principal: relaciona equipo, código temporal, dispositivo vinculado y sesión consentida. Sus tablas se incluyen en el modelo físico aunque no esté habilitado el flujo de UI.

# 3. Diseño

## 3.1. Arquitectura

**COMPROBADA:** arquitectura cliente-servidor local con separación lógica de presentación, API y acceso a datos. El despliegue normal es de una computadora, no microservicios. Express sirve dist y JSON desde el mismo origen; React utiliza Router en el navegador; SQLite es embebido, sin servidor MySQL.

Diagrama: [03_arquitectura.mmd](diagramas/03_arquitectura.mmd).

Las consultas HTTP se autentican con cookie; Express resuelve el usuario mediante el hash del token en SQLite. El cliente no abre SQLite directamente. Los reportes se procesan en navegador con la lista recibida; el tema es la preferencia guardada en localStorage. Los registros viven en disco.

### Tecnologías y justificación técnica

Las versiones siguientes son COMPROBADAS en node_modules/*/package.json, no solo rangos solicitados. JavaScript es el lenguaje ESM de Node; SQLite se distribuye con node:sqlite y no figura como dependencia npm. No se atribuyen motivos originales de selección: las ventajas son PROPUESTAS técnicas para la redacción.
 
| Tecnología | Versión comprobada | Función / archivos | Justificación técnica PROPUESTA |
| --- | --- | --- | --- |
| react | 19.3.1 | UI funcional y estado, App.tsx/main.tsx | Composición reutilizable de vistas y actualizaciones declarativas |
| typescript | 5.9.3 | Tipos y comprobación de frontend, domain.ts/tsconfig.json | Contratos de datos verificables al compilar |
| react-router-dom | 7.18.5 | Rutas de cliente en App.tsx/main.tsx | Navegación consistente sin duplicar aplicación |
| vite | 7.3.7 | Desarrollo, proxy y compilación, vite.config.ts | Generación de activos locales y carga dinámica |
| tailwindcss | 4.3.3 | Integración Vite y @import en styles.css | Utilidades y tokens compatibles con CSS existente |
| express | 5.3.0 | HTTP, rutas, middleware y estáticos, server/app.mjs | API local y entrega de SPA en un solo origen |
| zod | 4.6.7 | Validación compartida, domain.ts/store.mjs/app.mjs | Comprobación de entradas más allá de tipos estáticos |
| jspdf | 3.0.4 | PDF local, lib/reports.ts | Exportación sin servicio externo |
| jspdf-autotable | 5.0.9 | Tablas y páginas PDF, reports.ts | Organización tabular automática |
| exceljs | 4.4.0 | Libro XLSX, lib/excel.ts | Tipos numéricos, hojas, filtros y encabezados |
| recharts | 3.10.1 | Gráficas reales, LaboratorySummary | Componentes de gráficos integrados a React |
| ws | 8.22.0 | Señalización complementaria, supervision.mjs | WebSocket local controlado por servidor |
| node-forge | 1.4.2 | Certificados complementarios, certificates.mjs | Preparación de TLS local cuando se autorice |
| vitest | 3.2.7 | Pruebas de dominio, domain.test.ts | Verificación automatizada de validación y reportes |
| Node.js / JavaScript ESM | v24.19.0; requisito >=24 | server/*.mjs y scripts | APIs nativas de HTTP, criptografía y SQLite |
| SQLite | Motor embebido; versión exacta no recopilada | node:sqlite y data/techcontrol.sqlite | Persistencia transaccional sin instalación de servidor independiente |

## 3.2. Diseño de componentes

Diagrama: [04_componentes.mmd](diagramas/04_componentes.mmd).

| Componente COMPROBADO | Responsabilidad / interfaz |
| --- | --- |
| App.tsx | Sesión, tema, inventario, recarga y enrutamiento; contiene Dashboard, EquipmentForm, EquipmentList, Details, Reports, LaboratorySummary. |
| PageHeading, Badge, Loading, Empty, Modal | Encabezados, estados, carga, vacíos y confirmación; funciones de App.tsx. |
| Login.tsx | Credenciales y configuración inicial cuando needs_setup lo permite. |
| Users.tsx | Lista y creación de cuentas, invoca api.users/createUser. |
| ReportControls.tsx | Mantiene filtros y selección; importa exportadores cuando se necesitan. |
| domain.ts | Contratos, catálogo y Zod; filtro y cálculo compartidos. |
| lib/api.ts | fetch relativo, cookie, errores y evento de sesión no autorizada. |
| server/app.mjs | Seguridad HTTP, autenticación, autorización, rutas y errores. |
| server/store.mjs | Objeto de persistencia, transacciones, cuentas, equipos e historial. |
| server/index.mjs | Ensambla servicios, lock, respaldo previo al servicio y cierre. |
| lock.mjs / restore.mjs | Exclusión de procesos y recuperación de datos. |
| supervision*.mjs / src/supervision | Código complementario presente, deshabilitado por defecto. |
| Configuration.tsx | UI existente sin importación/ruta en App; contiene cambio de contraseña y respaldo, por lo que no se presenta como pantalla accesible. |

## 3.3. Diseño de clases

Diagrama: [05_clases.mmd](diagramas/05_clases.mmd). **COMPROBADA:** AppError extiende Error en store.mjs:10; ScreenPeer es una clase real en peer.ts:3. No existen clases Dashboard, Equipo o Controlador como implementaciones orientadas a objetos.

EquipmentInput, Equipment, Profile, History, Status, LocalProfile, AuthState y HealthState son tipos TypeScript, no constructores en ejecución. Equipment es una intersección de EquipmentInput con identificador/código/fechas. Store se representa como abstracción UML del objeto devuelto por createStore, expresamente no una clase. Sus métodos reales se describen en el diagrama. React utiliza funciones y hooks.

## 3.4. Diseño de base de datos

### A. Entidades, relaciones y restricciones

**COMPROBADA por apertura readOnly y PRAGMA:** ocho tablas, user_version=2, integrity_check=ok y foreign_key_check sin filas de infracción en la lectura realizada. No se consultaron valores personales. Las migraciones 001 y 002 corresponden al esquema observado. No existe tabla de mantenimientos.

Diagrama completo: [06_entidad_relacion.mmd](diagramas/06_entidad_relacion.mmd). code_counter no tiene FK: es una tabla técnica singleton. Equipo-usuario no tiene FK directa; se relacionan mediante historial y sesiones complementarias.

### B. Diccionario de datos completo

Fuente COMPROBADA: PRAGMA table_info/foreign_key_list y sqlite_master, contrastados con migraciones. “Sin predeterminado SQL” significa que la aplicación debe proporcionarlo. SQLite no impone una longitud fija por declarar TEXT; se distinguen los CHECK de la validación Zod.

#### Tabla code_counter

Contador monotónico de código. Fuente: server/migrations/001_initial.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | INTEGER | Especial: rowid asignado | Sí | — | Sin predeterminado | INTEGER PRIMARY KEY; CHECK id=1 | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| value | INTEGER | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Último número usado por la secuencia de códigos. |
#### Tabla equipment

Fichas técnicas del inventario. Fuente: server/migrations/001_initial.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| code | TEXT | No | No | — | Sin predeterminado | UNIQUE | Código visible secuencial, prefijo PC- y mínimo tres dígitos. |
| name | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Nombre identificativo del equipo. |
| serial | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Serie técnica del equipo. |
| inventory | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Identificador de inventario institucional. |
| brand | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Marca. |
| model | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Modelo. |
| location | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Ubicación física. |
| processor | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Procesador registrado manualmente. |
| ram | INTEGER | No | No | — | Sin predeterminado | CHECK entero de afinidad INTEGER, 1–2048; Zod exige int | Memoria RAM expresada en GB enteros. |
| storage_type | TEXT | No | No | — | Sin predeterminado | CHECK SSD/HDD/NVMe/Híbrido | Tecnología de almacenamiento. |
| storage_gb | INTEGER | No | No | — | Sin predeterminado | CHECK 1–1000000; Zod exige int | Capacidad en GB enteros. |
| os | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Sistema operativo. |
| architecture | TEXT | No | No | — | Sin predeterminado | CHECK 64 bits/32 bits/ARM64 | Arquitectura declarada. |
| status | TEXT | No | No | — | Sin predeterminado | CHECK Funcional/Con fallas/En mantenimiento | Estado actual del equipo. |
| observations | TEXT | No | No | — | '' | CHECK longitud <=4000 | Observaciones libres. |
| created_at | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Fecha de creación ISO, generada por aplicación. |
| updated_at | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Versión temporal usada para conflictos de edición. |
#### Tabla sessions

Sesiones de autenticación. Fuente: server/migrations/001_initial.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| token_hash | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Hash SHA-256 de token aleatorio; no se reproduce su valor. |
| user_id | TEXT | No | No | users.id; CASCADE | Sin predeterminado | Sin longitud SQL explícita | Cuenta propietaria de la sesión. |
| expires_at | INTEGER | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Vencimiento en milisegundos Unix. |
#### Tabla status_history

Alta y transiciones de estado. Fuente: server/migrations/001_initial.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| equipment_id | TEXT | No | No | equipment.id; CASCADE | Sin predeterminado | Sin longitud SQL explícita | Referencia al equipo. |
| previous_status | TEXT | Sí según DDL | No | — | Sin predeterminado | CHECK Funcional/Con fallas/En mantenimiento | Estado anterior; NULL en alta inicial. |
| new_status | TEXT | No | No | — | Sin predeterminado | CHECK Funcional/Con fallas/En mantenimiento | Estado resultante. |
| changed_at | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Instante del cambio ISO. |
| actor_id | TEXT | Sí según DDL | No | users.id; SET NULL | Sin predeterminado | Sin longitud SQL explícita | Cuenta que efectuó el cambio. |
| actor_name | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Nombre conservado del responsable al producirse el evento. |
| reason | TEXT | No | No | — | Sin predeterminado | CHECK trim 1–2000 | Motivo del cambio. |
#### Tabla supervision_devices

Vinculación temporal a equipo, módulo complementario. Fuente: server/migrations/002_supervision.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| equipment_id | TEXT | No | No | equipment.id; CASCADE | Sin predeterminado | UNIQUE | Referencia al equipo. |
| token_hash | TEXT | No | No | — | Sin predeterminado | UNIQUE | Hash SHA-256 de token aleatorio; no se reproduce su valor. |
| expires_at | INTEGER | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Vencimiento en milisegundos Unix. |
#### Tabla supervision_pair_codes

Código temporal de una sola utilización. Fuente: server/migrations/002_supervision.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| code_hash | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Hash de código temporal de vinculación. |
| equipment_id | TEXT | No | No | equipment.id; CASCADE | Sin predeterminado | UNIQUE | Referencia al equipo. |
| expires_at | INTEGER | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Vencimiento en milisegundos Unix. |
#### Tabla supervision_sessions

Auditoría de sesiones de pantalla, módulo complementario. Fuente: server/migrations/002_supervision.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| equipment_id | TEXT | Sí según DDL | No | equipment.id; SET NULL | Sin predeterminado | Sin longitud SQL explícita | Referencia al equipo. |
| equipment_code | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Copia del código para auditoría de supervisión. |
| administrator_id | TEXT | Sí según DDL | No | users.id; SET NULL | Sin predeterminado | Sin longitud SQL explícita | Cuenta administradora asociada. |
| administrator_name | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Nombre conservado del administrador. |
| requested_at | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Momento de solicitud. |
| consented_at | TEXT | Sí según DDL | No | — | Sin predeterminado | Sin longitud SQL explícita | Momento del consentimiento; puede faltar. |
| ended_at | TEXT | Sí según DDL | No | — | Sin predeterminado | Sin longitud SQL explícita | Momento de cierre; puede faltar. |
| state | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Fase de supervisión gestionada por aplicación. |
| end_reason | TEXT | Sí según DDL | No | — | Sin predeterminado | Sin longitud SQL explícita | Motivo final; puede faltar. |
#### Tabla users

Cuentas locales. Fuente: server/migrations/001_initial.sql.

| Campo | Tipo | NULL en SQL | PK | FK / borrado | Predeterminado SQL | Restricción / longitud | Descripción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | TEXT | Sí según DDL | Sí | — | Sin predeterminado | Sin longitud SQL explícita; PK TEXT sin NOT NULL explícito | Identificador de la fila; UUID generado en aplicación salvo code_counter. |
| email | TEXT | No | No | — | Sin predeterminado | UNIQUE COLLATE NOCASE; Zod 3–254 y patrón de identificador | Identificador de acceso; el nombre histórico email no exige correo en backend. |
| full_name | TEXT | No | No | — | Sin predeterminado | CHECK trim: 1–160 caracteres | Nombre mostrado de la cuenta. |
| password_hash | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Representación scrypt; nunca se reproduce su valor. |
| role | TEXT | No | No | — | Sin predeterminado | CHECK administrador/tecnico | Permiso de acceso. |
| created_at | TEXT | No | No | — | Sin predeterminado | Sin longitud SQL explícita | Fecha de creación ISO, generada por aplicación. |

**Observación técnica COMPROBADA:** en tablas SQLite ordinarias, una PK TEXT sin NOT NULL explícito puede aceptar NULL; la aplicación genera UUID/hashes y no envía NULL. No debe documentarse que el DDL prohíbe NULL en todas las PK. Asimismo, las tablas no se declaran STRICT y CHECK numérico no sustituye la validación de enteros del backend. No se modifica este esquema.

### C. Funcionamiento de persistencia

Fuente COMPROBADA: store.mjs:18-26,61-79 y migraciones.

- DatabaseSync abre el archivo, activa foreign_keys por conexión y configura WAL, synchronous=FULL y busy_timeout de 5000 ms.
- El arranque lee user_version; versiones inferiores aplican migraciones dentro de transacciones y una versión mayor que 2 se rechaza. Esta recopilación no invocó createStore ni ejecutó migraciones.
- save utiliza BEGIN IMMEDIATE; las claves de INSERT/UPDATE provienen de equipmentSchema y los valores se enlazan como parámetros. El contador se incrementa dentro de la misma transacción.
- El trigger equipment_capacity rechaza inserciones al alcanzar 30. equipment_serial_unique e equipment_inventory_unique usan lower(trim(...)); la normalización de SQLite no equivale a una colación Unicode completa.
- El historial se inserta en la misma transacción de alta o cambio de estado. Editar solo datos técnicos u observaciones no deja un evento general de auditoría.
- Eliminar un equipo elimina su historial por CASCADE; borrar un usuario deja actor_id en NULL y conserva actor_name. Las vinculaciones de supervisión se eliminan con el equipo; las sesiones de pantalla conservan copias de código/nombre y ponen FK en NULL.
- El respaldo usa node:sqlite backup; sobre la copia se eliminan sesiones, dispositivos y códigos temporales, se comprueba integridad y se publica con nombre único. Los respaldos conservan hashes de cuentas: deben tratarse como archivos privados.
- La restauración es una herramienta local con servidor detenido, no un botón visible actual. Conserva la base anterior y elimina sesiones restauradas. No debe copiarse una base activa ignorando WAL.
- La base no se cifra por estos mecanismos. chmod en Windows no sustituye una política ACL institucional.

## 3.5. Flujos y comunicación

| Proceso | Diagrama | Responsabilidad y precisión |
| --- | --- | --- |
| Inicio de sesión | [07_inicio_sesion.mmd](diagramas/07_inicio_sesion.mmd) | Login → Express → store.login/scrypt → SQLite; cookie y hash de sesión. |
| Registro | [08_registro_equipo.mmd](diagramas/08_registro_equipo.mmd) | Validación cliente y servidor; contador, ficha e historial atómicos. |
| Inventario | [09_consulta_inventario.mmd](diagramas/09_consulta_inventario.mmd) | GET autenticado; búsqueda y paginación posteriores en cliente. |
| Estado | [10_actualizacion_estado.mmd](diagramas/10_actualizacion_estado.mmd) | Control de versión y motivo; historial solo si hay transición. |
| Reportes | [11_reportes.mmd](diagramas/11_reportes.mmd) | No hay endpoint PDF/XLSX; filtrado y generación en navegador. |
| Usuarios | [12_creacion_usuario.mmd](diagramas/12_creacion_usuario.mmd) | UI envía técnico; servidor exige administrador y valida entradas. |

Clasificación de los diagramas: COMPROBADA en funciones y rutas indicadas; su representación es una síntesis documental, no una nueva implementación.

### Contratos de API

| Método y ruta | Acceso | Entrada / salida importante |
| --- | --- | --- |
| GET /api/health | Público local | Literal app/storage/version; no realiza integrity_check. |
| GET /api/auth/session | Público local | Perfil o NULL y needs_setup. |
| POST /api/auth/setup | Local y sin cuentas | Cuenta inicial, condicionado a needsSetup; arranque normal crea cuenta predeterminada si falta. |
| POST /api/auth/login | Público con limitador | Identificador/contraseña → perfil y cookie. |
| POST /api/auth/logout | Local | Invalida cookie y sesión si existe. |
| POST /api/auth/password | Autenticado | Actual/nueva → sesión nueva. |
| GET /api/equipment | Autenticado | Lista completa; no paginación de servidor. |
| POST /api/equipment | Administrador por store | data/reason → equipo creado. |
| PUT /api/equipment/:id | Autenticado con límites de rol | data/reason/expected_updated_at. |
| DELETE /api/equipment/:id | Administrador por store | expected_updated_at → ok. |
| GET /api/equipment/:id/history | Autenticado | Lista de eventos. |
| GET/POST /api/users | Administrador | Lista o creación; la API admite role validado y la UI siempre envía técnico. |
| PATCH /api/users/:id/role | Administrador | role/expected_role; sin UI activa. |
| POST /api/backups | Administrador | Nombre y fecha de copia. |
| GET /api/backups/:name | Administrador | Descarga, nombre restringido por patrón. |

Fuentes: server/app.mjs:28-46. La supervisión agrega info/device/pair/unpair/pair-codes y upgrade WSS condicionado a enabled/TLS (supervision-routes.mjs y supervision.mjs); no se activaron.

## 3.6. Diseño de interfaz

| Vista | Ruta / origen | Comportamiento COMPROBADO |
| --- | --- | --- |
| Inicio de sesión | Login.tsx, cuando profile=NULL | Formulario local, carga, mensajes; alta inicial solo si needs_setup. |
| Panel | /panel | Indicadores reales, atención, capacidad y estado de consulta. Vacío no afirma funcionamiento si no hay equipos. |
| Registro | /equipos/nuevo | Tarjetas en dos columnas; RAM/capacidad inicialmente vacías; marca obligatorio; observaciones opcional. |
| Inventario | /equipos | Búsqueda, estado, ubicación, orden y ocho filas/página; acción de alta administrativa. |
| Ficha | /equipos/:id | Especificaciones, estados e historial; edición y PDF; eliminar solo administrador. |
| Edición | /equipos/:id/editar | Administrador edita ficha; técnico tiene datos técnicos deshabilitados y solo envía estado/observaciones. |
| Reportes | /reportes | Dos gráficos del inventario global; filtros controlan exportación, no recalculan esas gráficas. |
| Usuarios | /usuarios | Alta técnica y lista con etiquetas Administrador/Técnico. |

La barra superior es compartida, con búsqueda que dirige al inventario, control de tema, perfil y cierre. La búsqueda no consulta un endpoint distinto. La navegación y las rutas administrativas se condicionan al perfil. La información sensible no se reproduce en este informe.

**Paleta COMPROBADA, styles.css, bloque “Paleta institucional”:**

| Token | Claro | Oscuro |
| --- | --- | --- |
| --background | #F4F6F6 | #06141B |
| --sidebar | #11212D | #11212D |
| --surface | #FFFFFF | #253745 |
| --border | #CCD0CF | #4A5C6A |
| --text-primary | #06141B | #CCD0CF |
| --text-secondary | #4A5C6A | #9BA8AB |
| --accent | #253745 | #9BA8AB |

Se conservan tonos semánticos de éxito/advertencia/error. public/theme-init.js inicializa data-theme y App conserva la preferencia; la preferencia del sistema se usa cuando no hay selección. Los gráficos reciben colores de chartColors y propiedades de ejes/tooltips. Los documentos mantienen estilo claro independiente del tema.

**UX COMPROBADA:** validación por campo Zod en equipos, etiquetas, aria-invalid, ayudas y mensajes alert/status; modal de eliminación con foco; iconos Lucide y textos de estado; spinner; beforeunload para recarga/cierre con cambios; CSS responsive y reduced-motion. No hay certificación de accesibilidad ni prueba de todos los lectores de pantalla. El formulario Users depende de validación HTML y errores de servidor, no del mismo sistema por campo.

**Limitaciones encontradas:** inventoryActive usa una expresión que también coincide con /equipos/nuevo; por ello puede resaltarse Equipos además de Registro. La advertencia de cambios no bloquea enlaces internos. Reportes/Inventario conservan lista en memoria y el aviso detallado de última consulta está limitado al panel. Un error de carga de usuarios puede dejar una lista previa sin etiqueta de antigüedad. Estos hechos deben reflejarse como observaciones, sin corregirse en esta investigación.

Las capturas requeridas y el procedimiento seguro se detallan en GUIA_DE_EVIDENCIAS_Y_CAPTURAS.md. No se generaron capturas simuladas ni se reutilizaron imágenes históricas como prueba del tema actual.

# 4. Implementación

## 4.1. Plan de implementación

**COMPROBADA:** existe .git pero la rama local no tiene commits y git remote -v no muestra URL. No puede reconstruirse una cronología desde Git. Las fechas de archivos son evidencia de copia/modificación, no prueba de horas trabajadas o autoría.

**DOCUMENTADA:** docs contiene informes de recuperación de dependencias, integración, panel, inventario, reportes/usuarios, conexión y paleta. Su existencia apoya las actividades descritas, no fechas de inicio/fin por integrante.

| Actividad identificada | Área de responsabilidad sugerida, no atribución | Evidencia | Fecha / duración / responsable |
| --- | --- | --- | --- |
| Persistencia y migraciones SQLite | Backend | server/store.mjs, migrations | PENDIENTE equipo |
| API, sesiones y permisos | Backend | server/app.mjs | PENDIENTE equipo |
| Hardware | Backend/Hardware | No se halló agente de detección | PENDIENTE: precisar trabajo realizado |
| Recuperación de dependencias | Integración | docs/PRUEBAS_INTEGRACION.md | PENDIENTE registro original |
| Panel y navegación | Frontend/UX-UI | App.tsx; CAMBIOS_FRONTEND.md | PENDIENTE equipo |
| Registro e inventario | Frontend/UX-UI | MEJORAS_REGISTRO_INVENTARIO_UX.md | PENDIENTE equipo |
| Reportes y usuarios | Frontend/UX-UI | MEJORAS_REPORTES_USUARIOS_UX.md | PENDIENTE equipo |
| Tema institucional | Frontend/UX-UI | NUEVA_PALETA_Y_MEJORAS_REPORTES.md | PENDIENTE equipo |
| Pruebas y auditoría | Integración/pruebas | tests; AUDITORIA_FINAL | PENDIENTE equipo |
| Redacción Word | Documentación | Estructura suministrada por solicitante | PENDIENTE asignación |

Esta tabla es reconstrucción de actividades identificadas; no es el cronograma original. La planificación académica debe completarse con evidencias del equipo.

## 4.2. Código

### A. Repositorio

COMPROBADA: carpeta local con metadatos Git, sin commits ni remoto configurado. No existe URL verificable para citar. El nombre del paquete es techcontrol-itern y su versión declarada es 2.0.0; el pie visual conserva una versión textual distinta. La denominación académica oficial debe confirmarse con el equipo.

### B. Estructura

```text
raíz/
├── src/
│   ├── App.tsx, main.tsx, domain.ts, reportFilters.ts, styles.css
│   ├── components/ Login, Users, ReportControls, Configuration
│   ├── lib/ api, reports, excel
│   └── supervision/ código complementario de pantalla
├── server/
│   ├── app.mjs, index.mjs, store.mjs, lock.mjs
│   ├── certificates.mjs, supervision*.mjs
│   └── migrations/ 001_initial.sql, 002_supervision.sql
├── data/ base SQLite, WAL/SHM, backups/, tls/, lock
├── scripts/ start, restore, configure-lan, prueba WebRTC
├── tests/ integración, offline-guard y pruebas de medios
├── docs/ informes, archive/ y evidencias históricas
├── public/ assets/ y theme-init.js
├── dist/ compilación de producción
├── supabase/ directorio residual; no motor actual
├── package.json, pnpm-lock.yaml, tsconfig.json, vite.config.ts
└── lanzadores .bat, README.md, VERIFICACION.md
```

src representa presentación/dominio; server orquesta HTTP y persistencia; migrations define evolución; data conserva información privada; scripts facilita operación; tests verifica comportamiento; docs conserva análisis. node_modules y cachés no deben anexarse al documento. docs/archive/supabase-initial.sql es una referencia histórica, no el esquema activo.

### C. Instalación y operación

Procedimiento DOCUMENTADO en README y COMPROBADO por scripts; no fue ejecutado durante esta recopilación para evitar cambios.

1. Instalar Node >=24 y disponer de pnpm. Registrar versiones efectivas, no confundir rangos package.json con paquetes instalados.
2. En la raíz: `pnpm install --frozen-lockfile`. Requiere Internet si no hay caché y reconstruye dependencias, no debe ejecutarse durante una auditoría de solo lectura.
3. Compilar con `pnpm build`. Ejecuta tsc -b y vite build; genera dist.
4. Abrir `Iniciar TechControl.bat` o `pnpm start:open`; también `pnpm start` si no se requiere abrir navegador.
5. Acceder a `http://127.0.0.1:3000/`, salvo PORT configurado por el operador.
6. Comprobar mediante navegador o PowerShell: `Invoke-RestMethod http://127.0.0.1:3000/api/health`.
7. Cerrar con Ctrl+C en la consola propietaria; SIGINT/SIGTERM ejecutan cierre de servidores, SQLite y liberación de lock.

El lanzador reutiliza un servidor compatible si ya existe. El arranque normal puede aplicar migraciones pendientes, crear cuenta inicial y respaldar; no debe utilizarse como lectura inocua de una base. No se incluyen credenciales predeterminadas. El operador debe revisar la cuenta inicial antes de entrega.

Desarrollo: `pnpm dev:api` y `pnpm dev` en terminales diferentes; Vite en 5173 reenvía /api a 3000. preview solo sirve una vista estática y no sustituye Express.

### D. Fragmentos representativos

Los siguientes extractos COMPROBADOS son breves, no incluyen valores privados. La documentación debe explicar que las operaciones de guardado están protegidas adicionalmente por middleware/SQL.

| Fragmento | Archivo y función | Explicación |
| --- | --- | --- |
| `equipmentSchema.safeParse(form)` | App.tsx, EquipmentForm.submit | Produce errores por campo antes de enviar; no sustituye backend. |
| `const parsed=(user.role==='administrador'?equipmentSchema.strict():stateSchema).parse(raw)` | store.mjs save | Selecciona contrato por permiso; evita alterar ficha desde rol técnico. |
| `db.prepare('SELECT * FROM equipment ORDER BY updated_at DESC,code').all()` | store.mjs list | Consulta persistente usada por GET inventario. |
| `fetch(\`/api\${url}\`, { credentials:'same-origin', ... })` | lib/api.ts request, extracto abreviado | Centraliza HTTP local y cookie. |
| `const valid=await passwordMatches(password,hash)` | store.mjs login | Verifica scrypt; no compara texto plano almacenado. |
| `if(old&&data.status!==old.status&&!why) throw new AppError(400,...)` | store.mjs save, abreviado | Exige motivo antes de persistir transición. |
| `db.exec('BEGIN IMMEDIATE')` | store.mjs tx | Adquiere transacción de escritura con commit/rollback. |
| `const {exportExcel}=await import('../lib/excel')` | ReportControls download | Carga exportador solo al solicitarlo. |
| `const s=statistics(items)` | Dashboard/LaboratorySummary | Deriva indicadores desde registros recibidos. |
| `document.documentElement.dataset.theme=dark?'dark':'light'` | App.tsx effect | Actualiza variables del tema en ejecución. |

# 5. Conclusiones

**COMPROBADA:** hay integración real React → Express → SQLite; el inventario no es una maqueta de datos. Los cambios de estado se asocian a motivo y responsable y se guardan atómicamente. La generación de documentos se realiza en cliente y el sistema está configurado para operación loopback.

**DOCUMENTADA:** las últimas ejecuciones de compilación y pruebas de esta conversación completaron build y 45 pruebas (15 de dominio/reportes y 30 API/supervisión). docs/AUDITORIA_FINAL y docs/NUEVA_PALETA_Y_MEJORAS_REPORTES registran resultados previos. Esta investigación no volvió a compilar ni ejecutar escrituras: no se atribuye un resultado nuevo.

**COMPROBADA en esta recopilación:** esquema versión 2, integridad correcta y ausencia de infracciones FK reportadas; versiones de bibliotecas; rutas y permisos. Estas comprobaciones no miden eficacia institucional ni satisfacción.

**PENDIENTE:** revisión visual actual completa, prueba offline física y demostración del equipo. No se afirman mejoras porcentuales, ahorros de tiempo ni objetivos académicos alcanzados sin evaluación.

# 6. Problemas encontrados durante el proyecto y cómo los resolvieron

| Problema | Causa / consecuencia | Solución aplicada o situación actual | Archivos | Evidencia / resultado |
| --- | --- | --- | --- | --- |
| Dependencias ausentes pese a node_modules | Instalación incoherente impedía Vitest y tipos React | Reconstrucción reproducible con pnpm y lockfile | node_modules; lockfile conservado | DOCUMENTADA PRUEBAS_INTEGRACION; pruebas posteriores aprobadas |
| Mensaje de conexión | No había listener en 3000; peticiones rechazadas | Inicio normal y recuperación de lock obsoleto por servidor | scripts/start.mjs, index.mjs, lock.mjs | DOCUMENTADA CORRECCION_CONEXION_Y_UX |
| Datos previos sin estado de consulta | Inventario en memoria tras error | Estado de conexión/última consulta implementado en panel | App.tsx | COMPROBADA reload/Dashboard; alcance no global |
| RAM/capacidad precargadas | 8/256 podían registrarse sin confirmación | Alta inicia campos vacíos | App.tsx emptyForm | DOCUMENTADA MEJORAS_REGISTRO; COMPROBADA actual |
| Errores globales en registro | Difícil identificar campo | Errores por campo con Zod | EquipmentForm/styles.css | COMPROBADA |
| Doble selección menú | Coincidencia de prefijo /equipos | Se documentó corrección; expresión actual aún incluye nuevo | App.tsx inventoryActive | COMPROBADA: pendiente corrección futura |
| Tema inicial bloqueado | Script inline incompatible con CSP | Archivo local theme-init.js permitido por self | index.html, public/theme-init.js | COMPROBADA archivos; DOCUMENTADA paleta |
| Icono funcional parecía cuadrado | background verde sobre SVG | Selector específico transparente, trazo y fill:none | styles.css attention-card; Dashboard | COMPROBADA actual; revisión visual pendiente |
| Mensaje funcional sin equipos | Vacío no diferenciaba ausencia de registros | Condición items.length y texto sin afirmación de salud | Dashboard | COMPROBADA actual |
| Tamaño de Excel | Biblioteca grande en fragmento | Se conserva carga dinámica; advertencia persiste | ReportControls, excel.ts | DOCUMENTADA compilación; no defecto de persistencia |
| Cambio de contraseña anunciado al usuario | Ayuda de Users remite a sesión; Configuration no montada | No resuelto en esta recopilación; aclarar ayuda o exponer flujo con autorización | Users.tsx, Configuration.tsx, Routes | COMPROBADA |
| Salud de SQLite sobreinterpretada | health devuelve literals y UI lo describe como comprobado | Aclarar futuro alcance; usar integridad separada si se requiere | app.mjs:28; Dashboard | COMPROBADA; no corregido |

Los problemas no resueltos se distinguen de los incidentes documentados como solucionados. No se deducen dificultades organizativas de estos fallos técnicos.

# 7. Mejoras futuras

Todas las propuestas de esta tabla son PROPUESTAS; no se implementan durante la investigación.

| Situación actual | Propuesta | Beneficio esperado, no medido | Componentes requeridos | Complejidad estimada |
| --- | --- | --- | --- | --- |
| Sin tabla/rutas de mantenimiento | Módulo independiente por equipo | Registrar intervenciones de forma estructurada | Migración nueva, API, tipos, UI/pruebas | Media |
| Ficha manual | Agente de hardware autorizado | Reducir captura manual | Agente por SO, identidad segura, API y validación | Alta |
| Solo localhost | LAN administrada con TLS y controles | Acceso de varias estaciones | Arranque/configuración, certificados, firewall y pruebas | Alta |
| Supervisión con código/tablas pero sin rutas UI/arranque habilitados | Completar integración y consentimiento real | Observación autorizada de pantallas | WSS/WebRTC, permisos y validación en LAN real | Alta |
| Tres estados | Evaluar fuera de servicio si el alcance lo exige | Distinguir baja operacional | Migración nueva, dominio, UI y reportes | Media |
| API de rol sin control visible | Administración visual de roles con reglas existentes | Facilitar gestión autorizada | Cliente API, UI y pruebas de permisos | Media |
| Cambio de contraseña/respaldo sin pantalla activa | Recuperar acceso UI autorizado | Hacer accesibles operaciones ya existentes | Rutas y componentes con pruebas | Baja-media |
| Advertencia fragmento Excel | Medir y optimizar exportación si necesario | Reducir espera observable | Perfilado, evaluación de empaquetado | Media |
| Historial solo estado y cascada al borrar | Política de retención/auditoría general | Conservar trazabilidad más amplia | Requisitos, migraciones y eventos | Media-alta |
| Inconsistencias visuales comprobadas | Corregir selección menú, mensajes de salud y datos anteriores | Mejorar precisión de la UI | React y pruebas de navegación | Baja |

# 8. Anexos

## 8.1. Relación de entregables

- INFORMACION_COMPLETA_PARA_DOCUMENTO_ITERN.md: referencia organizada en los ocho capítulos.
- DATOS_PENDIENTES_DEL_EQUIPO.md: información no derivable del código.
- GUIA_DE_DIAGRAMAS.md: catálogo y exportación a imagen.
- GUIA_DE_EVIDENCIAS_Y_CAPTURAS.md: matriz de capturas, resultados y precauciones.
- diagramas/: un PlantUML de casos de uso y once Mermaid distintos (dominio, arquitectura, componentes, clases, ER y seis secuencias).

## 8.2. Matriz de trazabilidad

| Apartado académico | Fuente primaria COMPROBADA | Evidencia documental / pendiente |
| --- | --- | --- |
| 1 | domain.ts, store.mjs, app.mjs | README; requisitos originales pendientes |
| 2 | permisos app/store y tipos domain | Diagrama de casos y dominio |
| 3.1–3.3 | index/app/store, App.tsx y peer.ts | Diagramas de arquitectura/componentes/clases |
| 3.4 | PRAGMA y migraciones 001/002 | ER y diccionario de este informe |
| 3.5 | Login, EquipmentForm, API/store, ReportControls, Users | Seis secuencias |
| 3.6 | styles.css, theme-init, App y componentes | Capturas actuales pendientes |
| 4.1 | git sin commits/remoto, docs | Fechas/autores/horas pendientes |
| 4.2 | package/scripts/estructura | Comandos descritos, no ejecutados aquí |
| 5–6 | código y docs de auditoría/cambios | Resultados de demostración pendientes |
| 7 | ausencias en schema/API/Routes | Propuestas no realizadas |
| 8 | entregables y pruebas existentes | Capturas autorizadas a completar |

## 8.3. Limitaciones de la recopilación

El informe se basa en código y documentación local, sin investigación de campo ni acceso a actas. No se obtuvieron nuevas capturas porque el navegador local había sido deshabilitado en la sesión. Los diagramas son fuentes editables y no se declara validación de renderizado. No se ejecutó build, instalación, arranque ni migraciones; hacerlo generaría archivos o cambios fuera de la documentación. Las comprobaciones SQL fueron de solo lectura y no exportaron filas de usuarios ni sesiones.

Se prioriza el código actual sobre documentos anteriores cuando discrepan. El informe debe actualizarse si el equipo corrige las observaciones o aporta contexto institucional.

