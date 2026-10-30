# Corrección de conexión local y UX

## Causa identificada

El mensaje “No se puede conectar al servidor local” no era un error de Vite, React, SQLite ni de la ruta de API. Al revisar el equipo no había ningún proceso escuchando en `127.0.0.1:3000`; por ello el navegador no podía resolver las solicitudes relativas `/api/*`.

La configuración es coherente:

- Express escucha en `127.0.0.1` y puerto 3000 por defecto.
- Vite usa un proxy a ese mismo origen solo durante desarrollo.
- La aplicación compilada y la API se sirven juntas en producción, por lo que el cliente usa `/api` sin una URL remota.
- `.env.local` no define un puerto alternativo.

Había un archivo `data/server.lock` de un proceso que ya no existía. No se eliminó manualmente: el inicio de TechControl lo verificó, recuperó de forma segura y generó un respaldo de arranque antes de abrir la base.

## Procedimiento correcto

1. Ejecuta `Iniciar TechControl.bat` desde la carpeta del proyecto.
2. Conserva abierta la ventana del servidor.
3. Abre `http://127.0.0.1:3000/`.
4. Si la aplicación muestra un error, usa **Reintentar** tras confirmar que la ventana del servidor continúa abierta.

Si el puerto 3000 está ocupado por otra aplicación, define un `PORT` válido en `.env.local` y reinicia. No cambies el puerto sin actualizar la dirección que abres en el navegador.

## Mejoras implementadas

- Se añadió `api.health()` para comprobar la ruta local `/api/health`.
- La carga del inventario comprueba conjuntamente equipos y estado del servidor.
- El panel distingue carga, conexión correcta, información desactualizada y falta total de información.
- Los datos de una consulta anterior se etiquetan explícitamente como “última consulta disponible”; no se presentan como actuales.
- El botón **Reintentar** vuelve a consultar la API.
- La tarjeta operativa informa “API disponible · SQLite local comprobado” únicamente tras una respuesta correcta de salud.
- La tarjeta de capacidad incluye una barra con el valor real de equipos registrados respecto al límite de 30.
- El estado vacío de atención se mantiene compacto y los equipos no funcionales enlazan a su ficha existente.

## Verificaciones

- API real: `/api/health` devolvió `techcontrol-itern`, almacenamiento `sqlite` y versión `2`.
- La sesión no autenticada respondió correctamente y confirmó que la configuración inicial ya está completada.
- `pnpm build`: correcto.
- `pnpm test`: 45 pruebas aprobadas.

No se modificaron rutas de backend, esquema SQLite, migraciones, autenticación, permisos ni datos registrados.
