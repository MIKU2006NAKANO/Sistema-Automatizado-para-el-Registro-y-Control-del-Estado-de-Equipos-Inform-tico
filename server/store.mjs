import { DatabaseSync, backup } from 'node:sqlite';
import { randomBytes, randomUUID, scrypt as rawScrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFileSync, mkdirSync, chmodSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { equipmentSchema } from '../src/domain.ts';
import { z } from 'zod';

const scrypt = promisify(rawScrypt);
export class AppError extends Error { constructor(status, message) { super(message); this.status=status; } }
export const accountSchema=z.object({email:z.string().trim().min(3,'El usuario debe tener al menos 3 caracteres').max(254).regex(/^[a-zA-Z0-9._@+-]+$/,'El usuario no debe contener espacios ni caracteres especiales').toLowerCase(),full_name:z.string().trim().min(1).max(160),password:z.string().min(12,'La contraseña debe tener al menos 12 caracteres').max(128),role:z.enum(['administrador','tecnico'])}).strict();
const stateSchema=z.object({status:z.enum(['Funcional','Con fallas','En mantenimiento']),observations:z.string().trim().max(4000)}).strict();
export const digest=value=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password) { const salt=randomBytes(16).toString('hex'); const key=await scrypt(password,salt,64,{N:16384,r:8,p:1}); return `scrypt:${salt}:${key.toString('hex')}`; }
export async function passwordMatches(password,hash) { const [algorithm,salt,hex]=hash.split(':'); if(algorithm!=='scrypt'||!salt||!hex)return false; const key=await scrypt(password,salt,64,{N:16384,r:8,p:1}); const expected=Buffer.from(hex,'hex'); return expected.length===key.length&&timingSafeEqual(expected,key); }
const publicUser=u=>u?{id:u.id,full_name:u.full_name,role:u.role,email:u.email}:null;

export function createStore(filename) {
 const directory=path.dirname(filename); mkdirSync(directory,{recursive:true,mode:0o700});
 const db=new DatabaseSync(filename); db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
 const version=db.prepare('PRAGMA user_version').get().user_version;
 if(version>2){db.close();throw new Error('La base de datos fue creada por una versión más reciente de TechControl.');}
 if(version<1){db.exec('BEGIN IMMEDIATE');try{db.exec(readFileSync(new URL('./migrations/001_initial.sql',import.meta.url),'utf8'));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');db.close();throw e;}}
 if(version<2){db.exec('BEGIN IMMEDIATE');try{db.exec(readFileSync(new URL('./migrations/002_supervision.sql',import.meta.url),'utf8'));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');db.close();throw e;}}
 chmodSync(filename,0o600);
 const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const one=id=>db.prepare('SELECT * FROM equipment WHERE id=?').get(id);
 const now=()=>new Date().toISOString();
 const store={
  db, filename,
  needsSetup:()=>db.prepare('SELECT count(*) AS total FROM users').get().total===0,
  async ensureDefaultAdmin(){
   const existing=db.prepare("SELECT * FROM users WHERE email='admin' COLLATE NOCASE").get();if(existing)return publicUser(existing);
   const hash=await passwordHash('admin123');
   return tx(()=>{const current=db.prepare("SELECT * FROM users WHERE email='admin' COLLATE NOCASE").get();if(current)return publicUser(current);const id=randomUUID();db.prepare('INSERT INTO users(id,email,full_name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)').run(id,'admin','Administrador',hash,'administrador',now());return publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id));});
  },
  async createUser(raw,bootstrap=false,actor=null){const input=accountSchema.parse(raw);const hash=await passwordHash(input.password);return tx(()=>{if(!bootstrap&&db.prepare('SELECT role FROM users WHERE id=?').get(actor?.id??'')?.role!=='administrador')throw new AppError(403,'Solo un administrador puede crear usuarios.');if(bootstrap&&!store.needsSetup())throw new AppError(409,'La cuenta inicial ya fue creada. Inicia sesión.');const id=randomUUID();db.prepare('INSERT INTO users(id,email,full_name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)').run(id,input.email,input.full_name,hash,bootstrap?'administrador':input.role,now());return publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id));});},
  async login(email,password){const u=db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get(email.trim());const hash=u?.password_hash||'scrypt:00000000000000000000000000000000:'+ '00'.repeat(64);const valid=await passwordMatches(password,hash);if(!u||!valid)throw new AppError(401,'Correo o contraseña incorrectos.');return publicUser(u);},
  session(user){db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(digest(token),user.id,Date.now()+8*60*60*1000);return token;},
  userForToken(token){if(!token)return null;return publicUser(db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').get(digest(token),Date.now()));},
  logout(token){if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));},
  listUsers:()=>db.prepare('SELECT id,email,full_name,role FROM users ORDER BY full_name').all(),
  assignRole(actor,id,role,expectedRole){
   z.enum(['administrador','tecnico']).parse(role);
   return tx(()=>{
    if(db.prepare('SELECT role FROM users WHERE id=?').get(actor.id)?.role!=='administrador')throw new AppError(403,'Solo un administrador puede asignar roles.');
    if(id===actor.id)throw new AppError(403,'No puedes cambiar tu propio rol. Solicita el cambio a otro administrador.');
    const target=db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if(!target)throw new AppError(404,'El usuario no existe.');
    if(target.role!==expectedRole)throw new AppError(409,'El rol de este usuario cambió. Actualiza la lista antes de continuar.');
    if(target.role===role)return publicUser(target);
    if(target.role==='administrador'&&role==='tecnico'&&db.prepare("SELECT count(*) AS total FROM users WHERE role='administrador'").get().total<=1)throw new AppError(409,'Debe permanecer al menos un administrador.');
    db.prepare('UPDATE users SET role=? WHERE id=?').run(role,id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    return publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id));
   });
  },
  list:()=>db.prepare('SELECT * FROM equipment ORDER BY updated_at DESC,code').all(),
  get:one,
  history(id){if(!one(id))throw new AppError(404,'El equipo no existe.');return db.prepare('SELECT * FROM status_history WHERE equipment_id=? ORDER BY changed_at DESC,rowid DESC').all(id);},
  save(user,id,raw,reason='',expected=null){
   if(!id&&user.role!=='administrador')throw new AppError(403,'Solo un administrador puede registrar equipos.');
   const parsed=(user.role==='administrador'?equipmentSchema.strict():stateSchema).parse(raw);
   const why=z.string().trim().max(2000).parse(reason);
   return tx(()=>{const old=id?one(id):null;if(id&&!old)throw new AppError(404,'El equipo ya no existe.');if(old&&old.updated_at!==expected)throw new AppError(409,'Otro usuario modificó este equipo. Actualiza y vuelve a intentarlo.');
    const data=old?{...old,...parsed}:parsed;
    if(old&&data.status!==old.status&&!why)throw new AppError(400,'Indica el motivo del cambio de estado.');
    const timestamp=new Date(Math.max(Date.now(),old?Date.parse(old.updated_at)+1:0)).toISOString();
    const keys=Object.keys(equipmentSchema.shape), values=keys.map(key=>data[key]);
    if(!old){const sequence=db.prepare('UPDATE code_counter SET value=value+1 WHERE id=1 RETURNING value').get().value;id=randomUUID();db.prepare(`INSERT INTO equipment(id,code,${keys.join(',')},created_at,updated_at) VALUES(${Array(keys.length+4).fill('?').join(',')})`).run(id,`PC-${String(sequence).padStart(3,'0')}`,...values,timestamp,timestamp);}
    else db.prepare(`UPDATE equipment SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=? WHERE id=?`).run(...values,timestamp,id);
    if(!old||data.status!==old.status)db.prepare('INSERT INTO status_history(id,equipment_id,previous_status,new_status,changed_at,actor_id,actor_name,reason) VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),id,old?.status??null,data.status,timestamp,user.id,user.full_name,old?why:'Registro inicial del equipo');
    return one(id);
   });
  },
  remove(user,id,expected){if(user.role!=='administrador')throw new AppError(403,'Solo un administrador puede eliminar equipos.');return tx(()=>{const item=one(id);if(!item)throw new AppError(404,'El equipo no existe.');if(item.updated_at!==expected)throw new AppError(409,'El equipo cambió. Actualiza antes de eliminarlo.');db.prepare('DELETE FROM equipment WHERE id=?').run(id);});},
  async changePassword(user,current,password){z.string().min(12).max(128).parse(password);const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id);if(!await passwordMatches(current,row.password_hash))throw new AppError(400,'La contraseña actual no es correcta.');const hashed=await passwordHash(password);tx(()=>{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashed,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);});},
  async createBackup(){const dir=path.join(directory,'backups');mkdirSync(dir,{recursive:true,mode:0o700});const name=`techcontrol-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomBytes(4).toString('hex')}.sqlite`;const final=path.join(dir,name),temp=final+'.partial';try{await backup(db,temp);const copy=new DatabaseSync(temp);try{copy.exec('DELETE FROM sessions; DELETE FROM supervision_devices; DELETE FROM supervision_pair_codes;');if(copy.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('La comprobación del respaldo falló.');}finally{copy.close();}chmodSync(temp,0o600);renameSync(temp,final);return {filename:name,created_at:now()};}catch(e){rmSync(temp,{force:true});throw e;}},
  close(){db.close();}
 };
 return store;
}
