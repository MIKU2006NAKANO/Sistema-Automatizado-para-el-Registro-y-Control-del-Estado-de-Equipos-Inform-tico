> Referencia histórica: el módulo de Supervisión fue retirado a petición del usuario. No está disponible en la interfaz ni se habilita el servidor LAN al iniciar. Esta guía no describe una función activa.

# Supervisión de Laboratorio · TechControl ITERN

El módulo permite solicitar y observar pantallas que cada usuario acepte compartir. El registro de equipos, cuentas y datos anteriores se conserva. No se crean equipos ni vídeos ficticios en producción.

## Preparación del servidor en la LAN

El servicio HTTP anterior continúa disponible únicamente en `http://127.0.0.1:3000`. La supervisión utiliza un segundo servicio **HTTPS/WSS** en el puerto 3443. No se permite vincular clientes ni abrir WebSockets de supervisión sobre HTTP.

1. Reserva una dirección IP para la computadora del servidor en DHCP, o configura una IP fija apropiada para tu red.
2. Durante la configuración inicial instala las dependencias (`pnpm install --frozen-lockfile`) y compila (`npm run build`). En el uso diario no se descarga nada.
3. Genera certificados locales, sin Internet:

```powershell
npm run configure:lan -- 192.168.31.213
```

Puedes incluir otros nombres/IP que pertenezcan a este mismo servidor después del primero. No se sobrescriben certificados existentes. Para renovarlos, conserva una copia de la carpeta TLS y genera la nueva autoridad en una carpeta vacía mediante la función documentada en `server/certificates.mjs`; después distribuye el nuevo certificado público y actualiza las rutas. La aplicación no instala autoridades de confianza ni cambia el firewall automáticamente.

4. En `.env.local` configura:

```dotenv
PORT=3000
TECHCONTROL_LAN_ORIGIN=https://192.168.31.213:3443
TECHCONTROL_TLS_CERT=data/tls/server.pem
TECHCONTROL_TLS_KEY=data/tls/server-key.pem
```

El origen debe ser el único nombre o IP canónico que utilizarán los clientes. La IP debe coincidir con el certificado. El servicio HTTPS escucha en las interfaces LAN; solo admite ese origen y los nombres de loopback. No configures redirección de puertos del router hacia Internet.

5. Detén el servidor anterior y arranca con `Iniciar TechControl.bat` o `npm start`. El registro sigue disponible en HTTP local; abre **Supervisión** desde HTTPS. El lanzador conserva la URL local del sistema de registro y el módulo ofrece el enlace hacia el origen seguro.

En esta computadora se preparó `.env.local` con la IP Wi-Fi detectada **192.168.31.213** y se generó un certificado que también contempla **192.168.137.1**. Si cambias de red o IP, ajusta el origen y utiliza un certificado con los nombres/IP correctos. No se ha establecido una reserva DHCP por ti.

## Confiar el certificado en cada computadora

Antes de usar pantalla compartida, el navegador debe confiar en la autoridad local de este servidor. Copia **únicamente `data/tls/ca.cer`** (público) a cada computadora por una vía de confianza, por ejemplo una memoria USB. `ca.pem` es la misma autoridad en formato PEM, útil para herramientas de diagnóstico.

En Windows, revisa el certificado y utiliza su asistente de instalación para **Usuario actual → Entidades de certificación raíz de confianza**. Chrome/Edge/Brave suelen utilizar el almacén de Windows. Si Firefox utiliza su propio almacén, importa la autoridad en sus ajustes de certificados. Esta instalación debe realizarla una persona autorizada y no se hace automáticamente desde TechControl.

Verifica que el archivo corresponda a la autoridad del servidor. Para los certificados generados en esta entrega:

- Nombre: `TechControl ITERN - Autoridad LAN 19fb3ee7`.
- SHA-256: `BE:8E:7B:70:F4:48:AA:96:2B:C5:CE:E7:5B:A0:00:5F:74:B4:8E:D9:1E:56:C4:2B:44:0C:49:E0:FA:29:DF:49`.

Después de confiarla, el navegador debe abrir el sitio **sin advertencias de certificado**. No ignores ni desactives la validación de HTTPS. La hoja de servidor vence en un año y la autoridad en cinco; planifica su renovación. Nunca distribuyas `server-key.pem` ni `ca-key.pem`.

## Configuración de la red

- Todos los equipos deben alcanzar la dirección HTTPS del servidor en TCP 3443.
- Si Windows solicita autorización de red para Node.js, configura el acceso al puerto solo en el perfil privado y para la subred local, con la persona que administra el laboratorio.
- Los navegadores deben poder establecer conexiones WebRTC directas entre clientes LAN y el administrador. Revisa el firewall del navegador, la resolución/multicast mDNS y que el punto de acceso no tenga aislamiento de clientes.
- No se configura STUN/TURN externo. Si la red bloquea conexiones directas o separa los equipos en VLAN sin rutas apropiadas, la transmisión puede fallar. No se presenta una captura ficticia: la tarjeta muestra el error o permanece conectando hasta finalizar.
- El certificado y WSS no corrigen un bloqueo de UDP/mDNS entre navegadores. No desactives globalmente el firewall para resolverlo; ajusta las reglas con el administrador de la LAN.

## Usar el módulo

### Administrador

1. Abre `https://192.168.31.213:3443/supervision` e inicia sesión con tu cuenta de administrador existente.
2. La cuadrícula muestra **solo las computadoras realmente registradas**, hasta 30. Una computadora sin cliente abierto aparece desconectada; si aún no hay conexión WSS del visor, se indica que el estado no está comprobado.
3. Pulsa **Vincular** en el equipo correcto. Comparte su código temporal con el usuario de esa computadora. Caduca en cinco minutos y sirve una sola vez.
4. Cuando la computadora se conecte, pulsa **Solicitar**. La tarjeta indica que espera una aceptación; todavía no existe captura.
5. Solo después de la aceptación y la selección del navegador se negocia el vídeo. La marca **En vivo** requiere que WebRTC esté conectado y haya una pista remota.
6. Puedes observar varias pantallas y usar **Ampliar**. Se reutiliza la misma transmisión; no se inicia una nueva captura.
7. **Finalizar** detiene la sesión de una computadora; **Finalizar todas** termina las solicitudes y sesiones activas, también las de otros administradores autorizados. Cerrar el visor termina las sesiones de ese visor.

### Usuario de cada computadora

1. Abre `https://192.168.31.213:3443/compartir` en un navegador de escritorio compatible. No necesitas una cuenta administrativa.
2. Introduce el código temporal y comprueba el código y nombre del equipo mostrado. **Vincular no inicia ni autoriza una captura**. La vinculación dura hasta doce horas y se puede retirar con Desvincular.
3. Mantén la pestaña abierta y visible para recibir solicitudes. La solicitud muestra quién desea observar, el equipo y las implicaciones de compartir.
4. Puedes **Rechazar**. Para aceptar pulsa **Aceptar y elegir pantalla**: el navegador abre su selector nativo. Decide qué pantalla, ventana o pestaña quieres compartir. No existe permiso persistente ni aprobación automática para solicitudes futuras.
5. Mientras compartes se muestra un indicador persistente, la identidad del administrador y **Detener ahora**. También está disponible el control nativo del navegador para dejar de compartir.
6. **Detener ahora** detiene las pistas de captura local inmediatamente y después comunica la finalización. Cerrar la pestaña o usar el botón nativo también finaliza la captura.

No se solicita cámara, micrófono, audio, teclado, portapapeles ni control remoto. El navegador puede mostrar advertencias propias sobre compartir pantalla: revísalas antes de aceptar. Si eliges una pantalla completa, cualquier información visible en ella puede ser vista por el administrador; cierra datos privados primero.

## Desconexiones y caducidades

- Una solicitud sin aceptación vence a los 60 segundos.
- Tras aceptar hay un máximo de 120 segundos para elegir pantalla y enviar la oferta.
- La negociación de vídeo tiene 30 segundos antes de caducar.
- Una conexión establecida termina como máximo a las dos horas. Se exige una nueva solicitud y un nuevo consentimiento para continuar.
- El cliente comprueba WSS cada tres segundos y detiene su captura si deja de recibir mensajes durante quince segundos. El servidor revisa conexiones/credenciales cada cinco segundos y termina conexiones sin respuesta durante veinte segundos. Una pérdida abrupta de red puede tardar ese intervalo en reflejarse; el botón local Detener no depende de la red.
- Si el usuario ya está dentro del selector nativo y se cancela la solicitud desde el servidor, el navegador puede mantener abierto ese selector. Si luego concede permiso, el código detecta que la solicitud ya terminó y detiene inmediatamente las pistas, sin enviarlas.
- Al perder el vídeo, la aplicación no inicia automáticamente otra captura. Reconectar WSS permite recibir una nueva solicitud, no reutiliza el consentimiento anterior.

## Arquitectura y privacidad

- Express gestiona acceso, vinculación, códigos y roles. El WebSocket WSS verifica cookie, rol y origen durante el handshake y vuelve a comprobar las credenciales en las operaciones y revisiones periódicas.
- Cada dispositivo queda limitado a un único equipo y no puede acceder a datos administrativos. Una computadora solo puede tener una solicitud/transmisión activa, con un visor propietario. Otros administradores pueden ver su estado o finalizarla, pero no reciben su vídeo.
- WebRTC usa únicamente candidatos directos (`iceServers: []`) y DTLS/SRTP del navegador. El servidor no recibe ni retransmite el vídeo.
- La señalización solo admite vídeo unidireccional: se rechazan secciones SDP de audio y canales de datos.
- SQLite conserva códigos de equipo, identidad del administrador, solicitud, aceptación, finalización y motivo. No se almacenan SDP, candidatos ICE, imágenes, audio, vídeo ni pulsaciones.
- Los códigos y tokens se guardan como hashes. La cookie del dispositivo es Secure, HttpOnly y SameSite=Strict. Las sesiones se cierran al revocar credenciales o cambiar roles.
- Los respaldos excluyen sesiones de acceso, dispositivos vinculados y códigos de vinculación. El registro mínimo de consentimiento sí forma parte del respaldo. La restauración admite las versiones anteriores de SQLite y exige volver a vincular clientes.
- La migración `002_supervision.sql` solo agrega tablas e índices. No sustituye ni borra equipos, usuarios, contraseñas ni historial de estados.
- Al reiniciar se finalizan las sesiones pendientes del registro de consentimiento. Nunca se reanuda una captura sin otra aceptación.

La aplicación no implementa grabaciones ni capturas de pantalla. Como en cualquier visualización, un observador autorizado podría utilizar herramientas del sistema operativo ajenas a la aplicación; no se afirma que el navegador pueda impedirlas.

## Rendimiento y límites

Cada emisor solicita hasta 1280×720 a unos 8 fps y limita el envío aproximadamente a 700 kbit/s. El navegador puede ajustar la calidad según el contenido y la red. Con 30 transmisiones, el presupuesto nominal de vídeo sería aproximadamente **21 Mbit/s**, más protocolos y retransmisiones. Es una estimación de configuración, no una medición de treinta computadoras.

La computadora del administrador decodifica hasta treinta vídeos y puede necesitar aceleración de hardware. Ampliar una pantalla añade una segunda vista del mismo flujo, sin duplicar su envío. Empieza con 4–6 transmisiones y aumenta gradualmente mientras revisas CPU, memoria, latencia y la red. Una LAN cableada suele ofrecer condiciones más estables que Wi-Fi compartido. No se garantiza rendimiento de 30 transmisiones sin medir el hardware y la LAN reales.

## Comprobaciones ejecutables

```powershell
npm run build
npm test
npm run test:supervision
```

Las pruebas de WSS utilizan certificados temporales con una CA de prueba validada por los clientes TLS; no se desactiva la validación de certificados. Se comprueban permisos, consentimiento, rechazo previo a consentir, mensajes entre participantes correctos, desconexiones, caducidades, revocación, exclusión de credenciales en respaldos y conservación de la versión anterior. También se prueban treinta clientes WSS y solicitudes concurrentes: **no equivale a treinta vídeos reales**.

Pruebas manuales de medios disponibles solo en el entorno de desarrollo:

- `node scripts/test-webrtc-browser.mjs`: abre la prueba aislada en el puerto 3002; usa vídeo de canvas claramente identificado como sintético.
- `npm run dev -- --port 5174` y `http://127.0.0.1:5174/tests/webrtc-peer.html`: verifica la clase ScreenPeer real con ese vídeo sintético. Ninguna de estas páginas se incluye en `dist` ni aparece como una computadora supervisada.

Antes de una demostración con personas:

1. Confía la CA en el servidor y en dos computadoras del laboratorio; comprueba HTTPS sin advertencias.
2. Vincula cada computadora con su código correcto.
3. Solicita una pantalla y rechaza: no debe verse vídeo.
4. Solicita otra vez, acepta y elige una pantalla en el selector nativo.
5. Verifica la imagen real, el indicador, la ampliación y las dos formas locales de detener.
6. Prueba finalizar desde el administrador y cerrar/desconectar cada extremo.
7. Verifica que volver a conectar no comparta automáticamente.
8. Aumenta gradualmente las transmisiones y documenta el uso de recursos del equipo real.

Las pruebas en máquinas separadas, el selector getDisplayMedia sobre la LAN y las mediciones de treinta vídeos requieren esa configuración y autorización de los usuarios. Consulta `VERIFICACION.md` para distinguir lo ejecutado de lo pendiente.
