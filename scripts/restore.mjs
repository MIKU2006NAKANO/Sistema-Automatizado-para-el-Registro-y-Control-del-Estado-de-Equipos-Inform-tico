import { DatabaseSync } from 'node:sqlite';
import { existsSync, copyFileSync, renameSync, rmSync, chmodSync, constants, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { acquireDataLock } from '../server/lock.mjs';

// Run with the server stopped. Share the server lock to prevent concurrent restoration/startup.
const root=fileURLToPath(new URL('../',import.meta.url));
export function restoreBackup(source,dataDir=process.env.TECHCONTROL_DATA_DIR||path.join(root,'data')) {
 const src=path.resolve(source),dir=path.resolve(dataDir),target=path.join(dir,'techcontrol.sqlite');
 if(src===target)throw new Error('Elige un respaldo distinto de la base activa.');
 const candidate=new DatabaseSync(src,{readOnly:true});
 try{if(candidate.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Respaldo dañado.');if(![1,2].includes(candidate.prepare('PRAGMA user_version').get().user_version))throw new Error('Versión de respaldo incompatible.');for(const table of ['users','equipment','status_history','sessions','code_counter'])candidate.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get();}finally{candidate.close();}
 mkdirSync(dir,{recursive:true,mode:0o700});
 const suffix=`${new Date().toISOString().replace(/[:.]/g,'-')}-${randomBytes(4).toString('hex')}`;
 const staging=path.join(dir,`restore-${suffix}.partial`);let old;const release=acquireDataLock(dir);
 try{
  copyFileSync(src,staging,constants.COPYFILE_EXCL);const staged=new DatabaseSync(staging);try{staged.exec('DELETE FROM sessions;');if(staged.prepare('PRAGMA user_version').get().user_version===2)staged.exec('DELETE FROM supervision_devices; DELETE FROM supervision_pair_codes;');staged.exec('PRAGMA journal_mode=DELETE;');}finally{staged.close();}chmodSync(staging,0o600);
  if(existsSync(target)){
   const active=new DatabaseSync(target);
   try{active.exec('PRAGMA busy_timeout=0; PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=DELETE; BEGIN EXCLUSIVE;');active.exec('COMMIT');}finally{active.close();}
   // The operator must stop all server processes before restoration. Never overwrite the old file.
   old=path.join(dir,`antes-de-restaurar-${suffix}.sqlite`);renameSync(target,old);
  }
  try{renameSync(staging,target);}catch(e){if(old)renameSync(old,target);throw e;}
  return {filename:target,previous:old||null};
 }finally{rmSync(staging,{force:true});release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(!process.argv[2])throw new Error('Uso: node --env-file-if-exists=.env.local scripts/restore.mjs "ruta/al/respaldo.sqlite". Detén el servidor primero.');const result=restoreBackup(process.argv[2]);console.log(`Restaurada: ${result.filename}`);if(result.previous)console.log(`Base anterior conservada: ${result.previous}`);}catch(e){console.error(`No se restauró: ${e.message}`);process.exitCode=1;}
}
