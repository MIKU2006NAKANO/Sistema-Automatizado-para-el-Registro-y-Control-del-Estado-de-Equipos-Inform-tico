import { createStore } from './store.mjs';
import { createApp } from './app.mjs';
import path from 'node:path';
import { existsSync,readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { fileURLToPath } from 'node:url';
import { acquireDataLock } from './lock.mjs';
import { createSupervision } from './supervision.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export async function startServer({port=Number(process.env.PORT||3000),dataDir=process.env.TECHCONTROL_DATA_DIR||path.join(root,'data'),development=process.env.NODE_ENV==='development'||process.argv.includes('--dev'),lan=null}={}) {
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error('PORT debe ser un puerto válido.');
 const filename=path.join(path.resolve(dataDir),'techcontrol.sqlite');const release=acquireDataLock(path.dirname(filename));const existed=existsSync(filename);let store;
 try{store=createStore(filename);await store.ensureDefaultAdmin();}catch(e){store?.close();release();throw e;}
 // An existing database is snapshotted before accepting any mutations. No files are overwritten.
 if(existed){try{const snapshot=await store.createBackup();console.log(`Respaldo de inicio: ${snapshot.filename}`);}catch(e){store.close();release();throw new Error(`No se pudo respaldar la base de datos; no se iniciaron operaciones: ${e.message}`);}}
 let server,tlsServer,supervision;
 try{
  let origin='',tlsOptions;
  if(lan){const parsed=new URL(lan.origin);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash||!lan.cert||!lan.key)throw new Error('Configura un origen HTTPS y sus archivos TLS válidos.');origin=parsed.origin;tlsOptions={cert:readFileSync(path.resolve(root,lan.cert)),key:readFileSync(path.resolve(root,lan.key)),minVersion:'TLSv1.2'};}
  supervision=createSupervision(store,{enabled:!!lan,lanOrigin:origin});
  const app=createApp(store,{development,supervision,lanOrigin:origin});
  server=await new Promise((resolve,reject)=>{const listener=app.listen(port,'127.0.0.1',()=>resolve(listener));listener.once('error',reject);});
  if(lan){tlsServer=createHttpsServer(tlsOptions,app);supervision.attach(tlsServer);await new Promise((resolve,reject)=>{tlsServer.once('error',reject);tlsServer.listen(Number(new URL(origin).port||443),lan.host||'0.0.0.0',resolve);});console.log(`Supervisión LAN (HTTPS/WSS): ${origin}/supervision`);console.log(`Cliente de pantalla: ${origin}/compartir`);}
 }catch(e){supervision?.close();if(server)server.close();if(tlsServer)tlsServer.close();store.close();release();throw e;}
 console.log(`TechControl ITERN: http://127.0.0.1:${server.address().port}/`);console.log(`SQLite: ${filename}`);console.log('Funciona sin Internet. Mantén esta ventana abierta.');
 const close=async()=>{supervision.close();await Promise.all([server,tlsServer].filter(Boolean).map(s=>new Promise(resolve=>{s.close(resolve);s.closeIdleConnections();})));store.close();release();};
 return {server,tlsServer,store,supervision,close};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const running=await startServer();let stopping=false;const stop=()=>{if(stopping)return;stopping=true;void running.close().then(()=>process.exit(0));};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
