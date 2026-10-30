# TechControl ITERN · Versión local

Sistema para registrar y controlar el estado de hasta 30 computadoras del ITERNathon. Conserva el diseño React, TypeScript y Tailwind existente. Express sirve la aplicación compilada y una API REST en localhost. SQLite guarda equipos, usuarios, sesiones e historial de manera persistente.

## Configuración inicial (una sola vez, con Internet)

1. Instala **Node.js 24 o superior** para Windows.
2. Abre `Configurar TechControl.bat`. Instala dependencias con pnpm si está disponible, o npm, y ejecuta `npm run build`.
3. Al terminar, ya puedes desconectar Internet.

Alternativa desde una terminal en la carpeta del proyecto:

```powershell
pnpm install --frozen-lockfile
npm run build
```

Con una instalación de npm funcional, también puedes utilizar `npm install`. No se necesitan cuentas, claves ni servicios externos. En este equipo npm falló al instalar por un problema de su módulo interno Arborist; la instalación con pnpm se ejecutó correctamente. Los comandos npm para compilar y arrancar sí funcionan.

## Uso cotidiano sin Internet

Haz doble clic en **Iniciar TechControl.bat**. Abre el navegador en:

**http://127.0.0.1:3000/**

Mantén abierta la ventana del servidor mientras utilizas la aplicación. Cierra con Ctrl+C para detenerlo de forma ordenada. También puedes iniciar sin abrir automáticamente el navegador:

```powershell
npm start
```

Al iniciar se crea una cuenta predeterminada local: **usuario `admin` y contraseña `admin123`**. Puedes iniciar sesión con ese usuario o con el correo de una cuenta existente. La contraseña se guarda como hash scrypt; la cuenta se crea solo si no existe y no se restablece al reiniciar. No se borran cuentas anteriores ni se crean equipos ficticios.

Desde **Usuarios**, disponible solo para administradores, se crean cuentas con nombre completo, usuario y contraseña, sin selector ni asignación de roles. Las nuevas cuentas conservan los permisos básicos existentes. La pestaña Configuración fue retirada. Los respaldos automáticos de inicio se conservan. Los técnicos pueden consultar equipos y actualizar su estado y observaciones; no pueden registrar, eliminar, editar datos técnicos, crear usuarios ni generar respaldos.

Si abres el lanzador otra vez y este servidor ya está activo, reutiliza la dirección existente. El lanzador no instala dependencias ni compila en el uso diario. Tras cambiar código, vuelve a compilar antes de usar la versión de producción.

## Datos y persistencia

Por defecto:

```text
data/
  techcontrol.sqlite       Base de datos principal
  techcontrol.sqlite-wal   Archivo de transacciones, si está activo
  techcontrol.sqlite-shm   Archivo de coordinación, si está activo
  server.lock              Bloqueo para evitar dos servidores/restauraciones
  backups/                 Respaldos completos y verificados
```

No borres `data`. El inicio crea el esquema únicamente si falta su versión; nunca borra, vacía ni reinserta equipos. El límite de 30, los códigos únicos y el historial se protegen en transacciones SQLite. Serie e inventario tienen índices únicos, ignorando espacios exteriores y diferencias de mayúsculas ASCII. La secuencia de códigos no retrocede al eliminar equipos; puede haber saltos y son normales.

Las actualizaciones comprueban la fecha de la versión consultada para no sobrescribir cambios de otra sesión. El dashboard recarga inmediatamente después de guardar y consulta la API local cada cinco segundos mientras la página está visible para detectar cambios de otras ventanas.

El tema es la única preferencia de la aplicación que se guarda en localStorage. Los registros importantes viven en SQLite. Las sesiones se guardan en la base y duran ocho horas; cerrar y volver a abrir el navegador no borra los equipos.

## Respaldos y restauración

- La API administrativa `POST /api/backups` permite crear una copia en `data/backups` y ofrece descargarla. Usa la API de respaldo de SQLite, no una copia insegura del archivo activo. Verifica su integridad antes de publicarla y utiliza un nombre único.
- Al arrancar sobre una base existente, el servidor genera automáticamente otro respaldo antes de admitir operaciones. Si falla, el arranque se cancela para no operar sin esa protección.
- Los respaldos contienen fichas, historial, usuarios y hashes de contraseñas. Se excluyen todas las sesiones. Guarda copias en otra unidad y restringe su acceso con los permisos de Windows. Revisa periódicamente el espacio disponible; no se eliminan respaldos automáticamente.

Para restaurar, **detén el servidor primero** y ejecuta:

```powershell
node --env-file-if-exists=.env.local scripts/restore.mjs "C:\ruta\al\respaldo.sqlite"
```

La herramienta verifica el respaldo, comparte el bloqueo de datos con el servidor y rechaza restaurar mientras se está utilizando la aplicación. Conserva la base anterior con nombre `antes-de-restaurar-...sqlite`, instala la copia y elimina las sesiones restauradas. Después inicia otra vez y utiliza las contraseñas que existían cuando se generó el respaldo. No basta con mover archivos mientras el servidor sigue abierto.

Si Windows o el proceso se cierran inesperadamente, SQLite recupera sus transacciones al abrir. Un bloqueo de un proceso que ya no existe se retira automáticamente. No elimines manualmente un bloqueo de un servidor activo.

## Funcionamiento offline

React, iconos Lucide, Recharts, Tailwind, bibliotecas PDF/CSV y estilos se instalan y compilan localmente. Se utiliza la tipografía de sistema ya definida; no se descargan fuentes. No se usa CDN, Supabase, autenticación en la nube ni APIs remotas para operar. La política de contenido de Express limita las conexiones del navegador al mismo origen.

Todas las pantallas requieren que el servidor local esté ejecutándose. Esto es una aplicación en localhost, no una página que se abre directamente como `file://`. Los datos pertenecen a esta computadora; no se sincronizan automáticamente con otras computadoras. La interfaz responsive se conserva y el servidor funciona exclusivamente en localhost. El apartado Supervisión y su cliente de pantalla fueron retirados; el acceso HTTPS de la LAN está desactivado.

El panel de Reportes permite filtrar por fecha de registro (todo el historial, hoy, semana desde el lunes, mes específico o rango inclusivo), búsqueda, ubicación y estado. Los botones PDF y Excel exportan únicamente los equipos seleccionados. El PDF permite elegir listado o resumen estadístico; la ficha individual sigue disponible desde los detalles del equipo. El archivo Excel es .xlsx real e incluye las hojas Equipos y Resumen, los filtros aplicados y la fecha de generación. Todo se genera en el navegador sin Internet.

## Seguridad

- Contraseñas con scrypt y sal aleatoria; nunca se guardan en texto plano.
- Cookies HttpOnly y SameSite=Strict; tokens aleatorios almacenados solo como hashes, expiración de ocho horas y cierre de sesión local.
- Cambiar contraseña invalida las otras sesiones de esa cuenta.
- Permisos verificados en el backend; el rol no depende de lo enviado por un técnico en el navegador.
- Validación Zod, consultas parametrizadas, transacciones `BEGIN IMMEDIATE`, claves foráneas y restricciones SQL.
- Límite de intentos de autenticación, validación de Host y origen, cabecera de protección contra solicitudes cruzadas y límite de tamaño JSON.
- Archivos de datos y respaldos fuera de la carpeta pública. Solo `dist` se sirve como contenido web.
- Acceso HTTP en `127.0.0.1`; el acceso LAN de supervisión está desactivado. La cuenta de Windows que puede leer la base tiene acceso físico a los datos; protégela con su contraseña y permisos. SQLite no está cifrado.

No hay recuperación por correo en la versión local. Conserva de forma segura la contraseña del administrador o una segunda cuenta administrativa autorizada.

## Opciones locales

No es obligatorio crear `.env.local`. Si necesitas cambiar el puerto o la carpeta de datos, copia `.env.example` a `.env.local`:

```dotenv
PORT=3000
# TECHCONTROL_DATA_DIR=C:\TechControlDatos
```

Reinicia el servidor después de cambiarlo. Usa una ruta absoluta para mover los datos. Una carpeta diferente abre una base diferente; no migra automáticamente registros. Nunca publiques `.env.local`, `data` ni los respaldos.

## Desarrollo

En dos terminales, sin necesidad de Internet una vez instaladas las dependencias:

```powershell
npm run dev:api
```

```powershell
npm run dev
```

Vite sirve en `http://127.0.0.1:5173` y reenvía `/api` a Express en el puerto 3000. En producción usa el lanzador o `npm start`: un solo servidor Express sirve tanto React compilado como la API en el puerto 3000. `npm run preview` es únicamente la vista previa estática de Vite y no sustituye el servidor de producción.

## Verificaciones

```powershell
npm run build
npm test
```

Las pruebas usan bases temporales y no crean ni eliminan registros de `data/techcontrol.sqlite`. El comando de pruebas incluye una protección que bloquea conexiones externas y permite únicamente loopback. Comprueba API, persistencia tras reinicio, permisos, conflictos, historial, límite de 30 con peticiones simultáneas, respaldos y restauración. También verifica cálculos, filtros, validaciones y PDF/CSV.

Consulta `VERIFICACION.md` para los resultados ejecutados y los límites de la comprobación. No es necesario desactivar Wi-Fi para arrancar; el registro se puede comprobar sin Wi-Fi; la supervisión necesita mantener la LAN conectada, aunque Internet esté desconectado.

## Organización

- `src/App.tsx`: pantallas existentes, navegación y operaciones.
- `src/components`: acceso local y configuración de usuarios/respaldos.
- `src/domain.ts`: tipos, validación y cálculos compartidos entre cliente y servidor.
- `src/lib/api.ts`: cliente de API REST, siempre en el mismo origen.
- `src/lib/reports.ts`: generación PDF/CSV sin servicios externos.
- `src/styles.css`: diseño original conservado; ajuste mínimo de contención para evitar desbordamiento de tablas en móvil.
- `server`: Express, autenticación, SQLite, bloqueo y migraciones locales.
- `scripts`: inicio con navegador y restauración segura.
- `tests`: integración real de SQLite/HTTP y protección de red para las pruebas.
- `docs/archive/supabase-initial.sql`: referencia histórica; no se ejecuta ni se necesita.

Esta versión se ejecuta localmente; las configuraciones anteriores de Vercel/Netlify se retiraron. Referencias de implementación: [SQLite y backup en Node.js](https://nodejs.org/docs/latest-v24.x/api/sqlite.html) y [archivos estáticos de Express](https://expressjs.com/en/5x/starter/static-files/).

