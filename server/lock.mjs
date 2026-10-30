import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export function acquireDataLock(directory){
 mkdirSync(directory,{recursive:true,mode:0o700});const filename=path.join(directory,'server.lock');const token=randomUUID();
 for(let attempt=0;attempt<2;attempt++){
  try{const fd=openSync(filename,'wx',0o600);try{writeFileSync(fd,JSON.stringify({pid:process.pid,token}));}finally{closeSync(fd);}return()=>{try{if(JSON.parse(readFileSync(filename,'utf8')).token===token)unlinkSync(filename);}catch{/* A released lock needs no further action. */}};}
  catch(error){if(error.code!=='EEXIST')throw error;let lock;try{lock=JSON.parse(readFileSync(filename,'utf8'));}catch{throw new Error('El archivo data/server.lock no es válido. Revisa que el servidor esté detenido antes de retirarlo.');}
   if(!Number.isSafeInteger(lock.pid)||lock.pid<1)throw new Error('Bloqueo de datos inválido.');
   try{process.kill(lock.pid,0);}catch(e){if(e.code==='ESRCH'){try{unlinkSync(filename);}catch(e){if(e.code!=='ENOENT')throw e;}continue;}throw e;}
   throw new Error('La base de datos está en uso. Detén el servidor TechControl antes de iniciar otra instancia o restaurar.');
  }
 }
 throw new Error('No se pudo obtener acceso exclusivo a los datos.');
}
