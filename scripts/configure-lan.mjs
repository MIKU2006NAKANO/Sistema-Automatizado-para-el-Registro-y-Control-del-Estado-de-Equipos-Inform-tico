import { generateCertificates } from '../server/certificates.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),hosts=process.argv.slice(2);
try{const files=generateCertificates(path.join(root,'data','tls'),hosts);console.log('Certificados creados. No se instalaron autoridades ni se cambió el firewall.');console.log(`Certificado público para confiar en cada computadora: ${files.ca}`);console.log('Añade a .env.local (elige IP fija/reserva DHCP):');console.log(`TECHCONTROL_LAN_ORIGIN=https://${hosts[0]}:3443\nTECHCONTROL_TLS_CERT=data/tls/server.pem\nTECHCONTROL_TLS_KEY=data/tls/server-key.pem`);console.log('Consulta docs/SUPERVISION.md antes de compartir pantallas. Nunca distribuyas archivos *key.pem.');}catch(e){console.error(e.message);process.exitCode=1;}
