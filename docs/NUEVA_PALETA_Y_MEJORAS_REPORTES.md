# Nueva paleta institucional y mejoras de Reportes

## Implementación

Se reutilizó el mecanismo existente `data-theme` y la clave `techcontrol-theme` de localStorage. El cambio se aplica inmediatamente desde el botón existente. Sin preferencia guardada, se utiliza la preferencia del sistema operativo. El archivo local `public/theme-init.js` aplica el tema antes de renderizar React y es compatible con la política `script-src 'self'` del servidor.

| Función | Claro | Oscuro |
| --- | --- | --- |
| Fondo `--background` | #F4F6F6 | #06141B |
| Menú `--sidebar` | #11212D | #11212D |
| Tarjetas `--surface` | #FFFFFF | #253745 |
| Bordes `--border` | #CCD0CF | #4A5C6A |
| Texto principal `--text-primary` | #06141B | #CCD0CF |
| Texto secundario `--text-secondary` | #4A5C6A | #9BA8AB |
| Acción principal `--accent` | #253745 | #9BA8AB |

Se añadieron variantes semánticas para hover, superficie secundaria, foco, campos, texto de botones y estados. Las variables antiguas `--bg`, `--text`, `--muted`, `--line` y `--blue` apuntan a los nuevos valores para conservar compatibilidad. Formularios, tablas, modales, tarjetas, navegación, usuarios y reportes comparten los tokens.

Los colores de éxito, fallo, advertencia y mantenimiento se conservan como colores semánticos complementarios, con variantes por tema. Las gráficas adaptan sectores, barras, ejes, líneas y tooltips al tema; no se modifican datos ni cálculos.

## Centro de reportes

Se retiró exclusivamente el selector de ubicación. La distribución principal contiene búsqueda, estado y tipo de reporte; se conserva período, PDF y Excel. El valor de ubicación permanece vacío en los filtros de esta pantalla. Se mantiene la lógica compartida de filtrado, la ubicación en fichas y exportaciones, y la gráfica de distribución por ubicación.

PDF y Excel mantienen su presentación fija clara para impresión y sus importaciones dinámicas.

## Archivos

- `src/App.tsx`: preferencia inicial y gráficas según tema.
- `src/styles.css`: variables y aplicación de la paleta, filtros responsive.
- `src/components/ReportControls.tsx`: retirada del selector de ubicación.
- `index.html` y `public/theme-init.js`: inicialización temprana del tema.
- Este documento.

## Verificaciones y límites

`pnpm build` terminó correctamente y `pnpm test` aprobó 45 pruebas (15 de dominio/exportaciones y 30 de integración). Se conserva la advertencia no bloqueante de tamaño del fragmento dinámico Excel.

Contraste calculado sobre colores base: texto principal claro/blanco 18.69:1; secundario claro/blanco 6.93:1; principal oscuro/tarjeta 7.88:1; secundario oscuro/tarjeta 5.02:1; botón claro 12.27:1; botón oscuro 7.64:1. Estos pares superan 4.5:1; no equivalen a una certificación de accesibilidad de todas las pantallas.

La revisión visual automatizada no está completada: el acceso de navegador local se encontraba deshabilitado. Para la comprobación manual: alternar temas en los cinco módulos, recargar para confirmar persistencia, revisar Reportes a 1440, 1024, 768 y 390 px, y comprobar tooltips, ejes y filtros. Exportar PDF/Excel para confirmar su presentación clara independiente del tema.

No se modificaron backend, migraciones, autenticación, permisos ni registros reales. Todos los recursos añadidos son locales. Las pruebas de escritura de la suite usan bases temporales.
