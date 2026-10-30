# Instrucciones de ejecución local

## Requisitos

- Windows con Node.js 24 o superior.
- pnpm recomendado; el proyecto incluye `pnpm-lock.yaml`.

## Primera preparación

Desde la carpeta raíz del proyecto:

```powershell
pnpm install --frozen-lockfile
pnpm build
```

Esta preparación puede requerir Internet si las dependencias no están disponibles localmente. No borres `data/`, `data/techcontrol.sqlite` ni los respaldos.

## Uso diario sin Internet

Ejecuta `Iniciar TechControl.bat` o:

```powershell
pnpm start:open
```

Abre `http://127.0.0.1:3000/` y mantén la ventana del servidor abierta durante el uso. La aplicación y SQLite funcionan en la misma computadora, sin servicios externos.

Si aparece un error de conexión, primero confirma que la ventana del servidor sigue abierta y utiliza **Reintentar** dentro de la interfaz. El frontend consulta la API local en la misma dirección; no requiere Internet.

## Verificación técnica

```powershell
pnpm test
pnpm build
```

Las pruebas usan datos temporales y no deben modificar los registros de `data/techcontrol.sqlite`.

## Datos y seguridad

- El servidor solo se expone en `127.0.0.1`; no se habilitó LAN.
- Las credenciales y sesiones se gestionan localmente; no copie archivos de datos o respaldos a ubicaciones públicas.
- Antes de restaurar, detenga el servidor y siga el procedimiento documentado en `README.md`.
