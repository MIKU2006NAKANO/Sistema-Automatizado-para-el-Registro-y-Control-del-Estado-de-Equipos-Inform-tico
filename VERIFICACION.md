# Verificación de TechControl ITERN local · 30 de octubre de 2026

## Resultado final ejecutado

- `pnpm install`: instalación correcta de Express y eliminación de las dependencias Supabase/PGlite del proyecto.
- `npm run build`: correcto, código de salida 0. TypeScript y Vite generaron la aplicación de producción.
- `npm test`: **43 pruebas aprobadas**: 15 de dominio/reportes, 15 de integración HTTP/SQLite y 13 de supervisión HTTPS/WSS. Ejecución final sin fallos.
- `Iniciar TechControl.bat`: ejecutado realmente. Arrancó Express, abrió la dirección local y permaneció en ejecución.
- `http://127.0.0.1:3000/api/health`: HTTP 200, almacenamiento `sqlite`, versión 2.
- Base real `data/techcontrol.sqlite`: integridad `ok`, cero equipos y cero usuarios al finalizar la revisión. El primer administrador lo crea el usuario desde el navegador.

## Pruebas automatizadas

Las pruebas se ejecutaron con `tests/offline-guard.mjs`, que rechaza accesos de fetch, HTTP(S), sockets y consultas DNS a destinos distintos de loopback. No se detectaron intentos de conexión externa. Las bases y cuentas de prueba fueron temporales.

1. Ficha válida, campos obligatorios, RAM inválida y estados no permitidos.
2. Estadísticas vacías y recálculo tras cambios de estado.
3. Búsqueda combinada con estado y ubicación.
4. CSV con escape de comillas, datos reales de prueba y neutralización de fórmulas.
5. PDF generado en memoria: cabecera PDF, nombre TechControl y contenido de código/serie.
6. Arranque de Express, respuesta de salud, fallback React y recursos compilados servidos desde localhost.
7. Creación inicial del administrador, contraseña mínima, hash scrypt, cookie protegida y cierre del alta inicial.
8. Rechazo de Host/origen ajenos, solicitudes sin cabecera de protección y respaldos sin sesión.
9. Registro de equipo con PC-001, historial inicial y actualización de estadísticas.
10. Duplicados de serie/inventario normalizados, validación de entradas y texto de inyección tratado como dato.
11. Creación de técnico e imposición de permisos en el servidor: sin altas, eliminación, cambios de ficha, usuarios ni respaldos.
12. Motivo obligatorio, transacción revertida si falta, cambio de estado con autor y rechazo de versión antigua.
13. Edición y reapertura real del archivo SQLite con nuevas conexiones después de detener/reiniciar el servidor: conserva equipo, historial, usuarios y sesión.
14. Respaldo consistente, integridad SQLite, descarga y exclusión de sesiones.
15. Capacidad 30 con solicitudes simultáneas para la última plaza, códigos únicos y liberación de plaza al eliminar.
16. Cambio de contraseña, invalidación de sesiones, cierre de sesión y acceso con la nueva contraseña.
17. Respaldo automático de inicio y rechazo de dos servidores/restauración sobre una base en uso.
18. Restauración con servidor detenido, conservación de la base anterior y sesiones cerradas.
19. Ausencia de CDN/fuentes remotas en HTML/CSS y ausencia del cliente Supabase en las dependencias.

Varios de estos escenarios se agrupan dentro de una misma prueba automatizada; el total reportado por los ejecutores es 30.

## Verificación real en navegador

Se utilizó una instancia temporal en `127.0.0.1:3001` con una base aislada. Nunca se añadieron cuentas ni equipos de prueba a la base real del puerto 3000.

- Inicio de sesión con cuenta temporal: correcto.
- Registro desde el formulario completo: generó PC-001 y abrió su ficha.
- Cambio a Con fallas con motivo: guardó y mostró ambos eventos en el historial.
- Dashboard: mostró un equipo total, uno con fallas y cero funcionales.
- Ficha PDF: el navegador descargó el archivo correctamente.
- Modo oscuro: activación y persistencia después de recargar comprobadas.
- Vista móvil 390 × 844: se revisó el dashboard y el menú lateral, navegación a Equipos y filtro Funcional sin resultados.
- Se detectó y corrigió un desbordamiento causado por un texto accesible de tabla fuera de su contenedor. Solo se añadió `position: relative` al contenedor; colores, tipografía, menú, tarjetas y estructura visual se conservaron. Después de corregirlo, la anchura del documento y la del viewport coincidieron: 375 px de contenido en un viewport de 390 px con barra de desplazamiento.
- La instancia temporal se cerró. Se dejó abierta la instancia real del puerto 3000 en Crea tu administrador, sin credenciales predeterminadas.

Evidencias locales: `docs/verification/dashboard-local.png` (datos temporales), `movil-local.png` (filtro móvil) y `primer-inicio-local.png` (base real vacía).

## Límites de la verificación

- No se apagó físicamente el Wi-Fi ni se desconectó el cable de la computadora. El funcionamiento se verificó bloqueando las conexiones externas de los procesos de pruebas, revisando recursos locales y sirviendo la aplicación en localhost.
- No se reinició Windows; sí se cerró el servidor, se cerró SQLite y se reabrió el mismo archivo mediante un nuevo servidor y nuevas conexiones.
- No se ejecutó todo el archivo Configurar TechControl.bat como un único flujo. Se ejecutaron la instalación y la compilación que contiene, y se probó el archivo Iniciar TechControl.bat.
- No se probó cada pantalla en todas las resoluciones o navegadores. Se revisaron primer inicio, login, formulario, ficha, historial, dashboard y filtros, con las comprobaciones móvil/escritorio descritas.
- La descarga CSV se comprueba por su contenido automatizado; en esta revisión de navegador se descargó la ficha PDF.
- Vite avisa de dos comentarios de anotación de Zod que elimina durante la compilación. No son errores y la compilación termina con código 0.

## Estado de entrega

Express sirve `dist` y `/api` en localhost. SQLite es la única base de datos activa. La migración PostgreSQL anterior se conserva solo como referencia histórica en `docs/archive`, sin ejecutarse ni requerir servicios externos. La preferencia de tema se conserva en localStorage y los registros importantes residen en SQLite.

## Actualización: usuarios y roles

Se añadió un apartado independiente en /usuarios para administradores. La prueba de roles comprueba ascenso y descenso de permisos, rechazo a técnicos y usuarios sin sesión, prohibición de cambiar el rol propio, validación estricta, conflicto por rol antiguo, revocación de sesiones y persistencia tras reiniciar. También verifica que un administrador degradado durante una creación de cuenta pendiente ya no pueda completar esa operación. Compilación TypeScript/Vite correcta. No se modificaron los roles de las cuentas reales durante las pruebas.

## Actualización: panel de filtros y PDF/Excel

Se sustituyeron las tarjetas de descargas por un panel con período, fechas, búsqueda, ubicación, estado y contenido PDF. Se añadieron ocho pruebas: límites de hoy, semana desde lunes, meses bisiestos, rango inclusivo y validación, combinación de filtros, contexto PDF, lectura de un Excel real con campos numéricos y texto sin fórmulas, y Excel vacío. Resultado: 30 pruebas aprobadas con conexiones externas bloqueadas.

Se comprobaron en una instancia temporal la descarga de PDF y Excel desde el navegador y el bloqueo de ambos botones ante un rango personalizado incompleto. El archivo Excel descargado se reabrió y confirmó las hojas Equipos/Resumen y un registro temporal; el PDF descargado tiene cabecera válida. No se modificaron los registros reales. Evidencia: docs/verification/reportes-filtros.png.

ExcelJS queda empaquetado localmente y se carga solo al pulsar Excel. Vite avisa que ese paquete diferido supera 500 kB; la compilación termina correctamente.

## Supervisión de Laboratorio: comprobación ejecutada

- Compilación TypeScript/Vite correcta y 43 pruebas aprobadas sin conexiones externas desde los procesos de pruebas.
- HTTPS/WSS real con CA local de prueba validada: permisos, códigos temporales de un solo uso, prohibición de señalizar antes de consentir, rechazo de audio, aislamiento entre participantes, vencimiento, detención, desconexión y revocación. Treinta clientes WSS y solicitudes simultáneas: todos cerraron al finalizar la sesión. Esto no es una medición de treinta vídeos.
- Migración 001 → 002 probada sin perder equipo, cuenta ni hash de contraseña. Respaldos excluyen tokens de dispositivos y códigos.
- WebRTC nativo verificado en navegador con vídeo sintético aislado de canvas: emisor y receptor connected, DTLS connected, 407 frames decodificados y 2.257.361 bytes recibidos en una observación. Detener dejó ambos pares closed y las pistas ended.
- La misma clase ScreenPeer usada por producción también se probó con ese vídeo sintético: ambos extremos connected, DTLS connected, 77 frames y 228.554 bytes recibidos en una observación; detener cerró conexiones y pistas. Estas pruebas no son capturas de escritorios reales y nunca se muestran como equipos supervisados. Evidencias: docs/verification/webrtc-medios-prueba.png y screenpeer-medios-prueba.png.
- Revisión de interfaz sobre una base temporal: acceso administrativo al módulo, cuadrícula con un equipo real de prueba, estados sin comprobar y controles desactivados sin HTTPS. No se generaron miniaturas de vídeo ficticias.
- El servidor real se activó en HTTP loopback:3000 y HTTPS LAN 192.168.31.213:3443. Se comprobó HTTP 200 por la IP LAN con TLSv1.3 y authorized=true, pasando explícitamente la CA pública local al cliente Node, sin omitir validación TLS. Eso confirma acceso desde el propio servidor, no desde otra computadora.
- Antes de migrar la base real se creó data/backups/antes-supervision-087e7212-1dff-41f8-9788-7835cc24ff50.sqlite. Después: SQLite versión 2, integrity_check=ok, un equipo y un usuario. Las huellas SHA-256 de todos los campos de equipos y usuarios coinciden exactamente con las previas. No se cambiaron contraseñas ni roles reales.

Pendiente en la LAN real: confiar la CA pública en cada navegador/equipo, permitir la conectividad privada necesaria y probar getDisplayMedia mediante aceptación humana y el selector nativo. No se automatizó ni eludió el selector de permisos. No se instaló la CA en el sistema ni se alteró el firewall. No se verificaron pantallas de dos computadoras físicas ni el rendimiento de treinta transmisiones reales. Ver docs/SUPERVISION.md para pasos, privacidad y límites de recursos.

Limpieza de la revisión visual: el servidor temporal de interfaz se detuvo y las pestañas se cerraron. La revisión automática bloqueó tanto el borrado recursivo como la retirada explícita de sus cuatro archivos, con el motivo genérico “blocked by policy”. La carpeta temporal C:\Users\MIKU\AppData\Local\Temp\techcontrol-supervision-ui-SjSgIa quedó pendiente de limpieza manual. No corresponde a la base real ni a los certificados del servidor.

## Retirada de Supervisión y simplificación de Usuarios

Por solicitud del usuario se retiraron las rutas y entradas de menú de Supervisión y Compartir pantalla. El arranque normal vuelve a escuchar solo en localhost:3000; el origen LAN ya no se habilita desde el entorno y se retiraron esas variables locales. Se conserva la base SQLite existente y su historial. Usuarios muestra únicamente el formulario de nombre, correo y contraseña, sin tabla de asignación ni selector de roles. Las cuentas nuevas mantienen permisos básicos y los controles internos de autorización siguen activos. Compilación correcta y 43 pruebas existentes aprobadas. Las pruebas de señalización restantes validan código conservado como referencia, no una función habilitada en la interfaz.

## Configuración retirada y administrador predeterminado

Se retiraron del menú y de las rutas la pestaña Configuración. Al iniciar se crea, únicamente si falta, la cuenta admin con contraseña inicial admin123 y permisos administrativos. La contraseña se almacena como hash scrypt. El login admite usuario o correo; las cuentas anteriores se conservan. Se añadió una prueba de inicio de sesión HTTP real con la cuenta predeterminada, conservación de equipos/usuarios y no restablecimiento de contraseña al reiniciar. Compilación correcta y 44 pruebas aprobadas.

## Creación de usuarios sin correo

El formulario Usuarios ahora solicita Usuario (texto) en lugar de Correo electrónico. El servidor admite nombres de usuario, mantiene la unicidad sin distinguir mayúsculas y conserva los identificadores anteriores. Se verificaron alta sin correo, inicio de sesión con ese nombre, rechazo de duplicados y espacios. Compilación correcta y 45 pruebas aprobadas.
