# Guía de evidencias y capturas

## Estado de la evidencia

**COMPROBADA en esta recopilación:** fuentes, estructura, versiones instaladas, esquema SQLite leído en modo readOnly, integrity_check=ok y foreign_key_check sin infracciones. No se exportaron filas privadas.

**DOCUMENTADA, no reejecutada aquí:** build correcto y 45 pruebas aprobadas en los registros de auditorías y ejecuciones anteriores de la sesión. Las suites son src/domain.test.ts (15) y tests/local-api.test.mjs más tests/supervision.test.mjs (30). Las pruebas complementarias de supervisión no acreditan una función LAN habilitada en producción ni vídeo real de 30 equipos.

**PENDIENTE:** capturas actuales, inspección multiresolución, PDF/XLSX visualmente revisados y prueba offline física. El navegador local estaba deshabilitado en el entorno de trabajo; no se crearon imágenes simuladas.

## Matriz de evidencias

| Evidencia real requerida | Contenido que debe verse | Apartado académico | Estado |
| --- | --- | --- | --- |
| Inicio de sesión | Marca, campos vacíos y ayuda local | 3.6 y 8 | PENDIENTE |
| Panel | Indicadores del inventario autorizado y atención | 3.6, 5 y 8 | PENDIENTE |
| Registro | Identificación, características y campos obligatorios | 3.6 y 8 | PENDIENTE |
| Validación de formulario | Errores junto a campos sin datos sensibles | 1.1, 3.6 y 8 | PENDIENTE |
| Inventario | Código, estado, filtros y total real | 3.6 y 8 | PENDIENTE |
| Ficha | Características e historial autorizado | 3.5, 3.6 y 8 | PENDIENTE |
| Reportes | Período, búsqueda, estado y tipo; sin selector de ubicación | 3.6 y 8 | PENDIENTE |
| Usuarios | Roles y alta técnica; nombres/identificadores ocultos | 3.6 y 8 | PENDIENTE |
| Tema claro / oscuro | Mismo módulo en ambos temas | 3.6 y 8 | PENDIENTE |
| Vista móvil/tablet | Menú, formulario, tabla y botones accesibles | 3.6 y 8 | PENDIENTE |
| PDF exportado | Encabezado, filtros, tabla, pie, selección | 3.5 y 8 | PENDIENTE revisión visual |
| XLSX | Hojas Equipos y Resumen, filtros y datos seleccionados | 3.5 y 8 | PENDIENTE revisión visual |
| Build / tests | Salida final y código de salida con fecha | 4.2, 5 y 8 | DOCUMENTADA previa |
| Integridad SQLite | Solo resultado ok y versión, sin registros | 3.4 y 8 | COMPROBADA lectura actual |
| Diagramas | Fuentes de diagramas y su exportación revisada | 2 y 3 | Fuentes preparadas; render pendiente |
| Diccionario | Todas las columnas y restricciones del informe | 3.4 y 8 | COMPROBADA |

## Procedimiento manual seguro

1. El equipo de pruebas debe usar un entorno aislado autorizado para cualquier alta/edición; no introducir datos ficticios en la base real ni para llenar el inventario.
2. Para capturar producción, usar solo consultas autorizadas y ocultar nombres, identificadores, cookies, contraseñas y rutas privadas. No capturar DevTools de almacenamiento.
3. Obtener login con campos vacíos. Obtener capturas de panel/inventario con datos autorizados sin alegar que una imagen histórica representa la versión actual.
4. Revisar escritorio 1440 px, laptop 1024 px, tablet 768 px y móvil 390 px; son tamaños propuestos para ensayo, no dispositivos ya probados.
5. En cada tema comprobar foco de teclado, etiquetas, contraste aparente, tooltips, scroll exclusivo de tabla y disposición de filtros.
6. En Registro verificar menú activo; la investigación detecta coincidencia doble posible y no debe ocultarse en el informe.
7. Comprobar selección de Reportes antes de exportar; los gráficos superiores resumen todo el inventario, mientras los filtros se aplican a los archivos.
8. Para probar offline: el operador inicia normalmente, desconecta acceso a Internet, conserva loopback, consulta y exporta. Registrar resultado real; no declarar éxito solo por tener recursos locales.
9. Nombrar imágenes con módulo/tema/ancho y fecha. Guardarlas en una carpeta de evidencias autorizada, después de anonimizar. No distribuir la base ni respaldos como anexo público.
10. La nueva ejecución de pnpm build o pnpm test corresponde al operador autorizado: build escribe dist/tsbuildinfo y tests usa bases temporales. No se ejecutaron en esta recopilación limitada a lectura y documentación.

## Referencias a registros anteriores

- docs/AUDITORIA_FINAL_TECHCONTROL_ITERN.md.
- docs/PRUEBAS_INTEGRACION.md.
- docs/NUEVA_PALETA_Y_MEJORAS_REPORTES.md.
- tests/offline-guard.mjs y archivos de pruebas originales.

No se copian registros completos de prueba que contengan secretos de cuentas de ensayo. Para evidencia académica basta con mostrar número de pruebas, fecha, estado y descripción de cobertura sin contraseñas.

