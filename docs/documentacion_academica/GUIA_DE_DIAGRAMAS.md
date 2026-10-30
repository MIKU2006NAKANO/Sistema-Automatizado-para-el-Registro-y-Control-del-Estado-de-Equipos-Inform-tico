# Guía de diagramas

Los diagramas fueron preparados a partir de la implementación local. Se entregan como fuentes editables; no son capturas ni imágenes generadas del sistema. Las relaciones representan código actual, con notas explícitas para funciones complementarias o no accesibles.

| Archivo | Representación | Apartado | Precisión |
| --- | --- | --- | --- |
| [01_casos_de_uso.puml](diagramas/01_casos_de_uso.puml) | Casos de uso UML | 2.1 | Síntesis COMPROBADA; revisar junto al informe |
| [02_dominio.mmd](diagramas/02_dominio.mmd) | Dominio conceptual | 2.2 | Síntesis COMPROBADA; revisar junto al informe |
| [03_arquitectura.mmd](diagramas/03_arquitectura.mmd) | Arquitectura local | 3.1 | Síntesis COMPROBADA; revisar junto al informe |
| [04_componentes.mmd](diagramas/04_componentes.mmd) | Componentes y dependencias | 3.2 | Síntesis COMPROBADA; revisar junto al informe |
| [05_clases.mmd](diagramas/05_clases.mmd) | Tipos/clases reales y objeto Store | 3.3 | Store es abstracción de factory; tipos no son clases ejecutables |
| [06_entidad_relacion.mmd](diagramas/06_entidad_relacion.mmd) | ER físico completo | 3.4 | Incluye tablas complementarias aunque supervisión esté deshabilitada |
| [07_inicio_sesion.mmd](diagramas/07_inicio_sesion.mmd) | Secuencia de inicio de sesión | 3.5 | Síntesis COMPROBADA; revisar junto al informe |
| [08_registro_equipo.mmd](diagramas/08_registro_equipo.mmd) | Secuencia de registro | 3.5 | Síntesis COMPROBADA; revisar junto al informe |
| [09_consulta_inventario.mmd](diagramas/09_consulta_inventario.mmd) | Secuencia de consulta | 3.5 | Síntesis COMPROBADA; revisar junto al informe |
| [10_actualizacion_estado.mmd](diagramas/10_actualizacion_estado.mmd) | Secuencia de estado | 3.5 | Síntesis COMPROBADA; revisar junto al informe |
| [11_reportes.mmd](diagramas/11_reportes.mmd) | Secuencia de reportes | 3.5 | Síntesis COMPROBADA; revisar junto al informe |
| [12_creacion_usuario.mmd](diagramas/12_creacion_usuario.mmd) | Secuencia de usuarios | 3.5 | Síntesis COMPROBADA; revisar junto al informe |

## Conversión a imágenes para Word

Procedimiento PROPUESTO para el integrante de documentación; no se instalaron herramientas ni se publicó código en servicios externos.

1. Abrir los .mmd con una extensión Mermaid local o un renderizador Mermaid CLI instalado por el operador.
2. Con Mermaid CLI disponible: `mmdc -i 03_arquitectura.mmd -o 03_arquitectura.svg -b white`. Repetir individualmente con los otros .mmd; también puede generarse PNG.
3. Para el .puml, usar un renderizador PlantUML local. Con Java y el JAR disponibles: `java -jar plantuml.jar -tsvg 01_casos_de_uso.puml`.
4. Revisar visualmente textos, flechas, cardinalidades y cortes antes de insertar; estas fuentes no se renderizaron durante la recopilación.
5. Insertar SVG en Word cuando la versión lo admita; en caso contrario exportar PNG con suficiente resolución. Mantener fondo claro para impresión.
6. Añadir pie con nombre, apartado y fuente: “Elaboración a partir de [archivos del proyecto]”. No atribuir autor individual sin confirmación.
7. No insertar código o datos privados en renderizadores públicos. Los diagramas entregados contienen estructura, no filas ni credenciales.

## Diferencias conceptuales

- Casos de uso: actores y acciones; no arquitectura ni lista de pantallas.
- Dominio: conceptos del negocio; Reporte es resultado derivado, Estado es catálogo.
- Clases: AppError y ScreenPeer reales; tipos TypeScript y Store se distinguen con estereotipos.
- ER: ocho tablas con columnas y FK, incluyendo code_counter aislada. Se debe consultar el diccionario para restricciones y NULL.
- Componentes: módulos de código y comunicación; no convierte funciones React en clases.
- Secuencias: orden de mensajes para los seis procesos solicitados. Las alternativas reflejan errores y límites del backend.

El actor Usuario autenticado en casos de uso es una generalización UML de los dos roles existentes, no un tercer rol SQL. Restauración se documenta como operación CLI del operador local en las fichas del informe, fuera del límite de la UI web.

