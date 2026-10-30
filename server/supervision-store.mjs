import { randomBytes,randomUUID } from 'node:crypto';
import { digest,AppError } from './store.mjs';
export function supervisionStore(store){
 const db=store.db;
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 return {
  pairCode(equipmentId){if(!store.get(equipmentId))throw new AppError(404,'El equipo no existe.');const code=randomBytes(6).toString('hex').toUpperCase(),expires=Date.now()+300000;db.prepare('DELETE FROM supervision_pair_codes WHERE equipment_id=? OR expires_at<=?').run(equipmentId,Date.now());db.prepare('INSERT INTO supervision_pair_codes VALUES(?,?,?)').run(digest(code),equipmentId,expires);return {code:code.match(/.{4}/g).join('-'),expires_at:expires};},
  pair(code){return transaction(()=>{const entry=db.prepare('SELECT * FROM supervision_pair_codes WHERE code_hash=? AND expires_at>?').get(digest(code.replaceAll('-','').toUpperCase()),Date.now());if(!entry)throw new AppError(400,'Código inválido o vencido. Solicita uno nuevo al administrador.');const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM supervision_devices WHERE equipment_id=?').run(entry.equipment_id);db.prepare('INSERT INTO supervision_devices VALUES(?,?,?,?)').run(randomUUID(),entry.equipment_id,digest(token),Date.now()+12*60*60*1000);db.prepare('DELETE FROM supervision_pair_codes WHERE equipment_id=?').run(entry.equipment_id);return {token,equipment_id:entry.equipment_id};});},
  device(token){if(!token)return null;return db.prepare('SELECT d.id,d.equipment_id,d.expires_at,e.code,e.name FROM supervision_devices d JOIN equipment e ON e.id=d.equipment_id WHERE token_hash=? AND expires_at>?').get(digest(token),Date.now())||null;},
  revoke(token){if(token)db.prepare('DELETE FROM supervision_devices WHERE token_hash=?').run(digest(token));},
  begin(equipment,user){const id=randomUUID();db.prepare('INSERT INTO supervision_sessions(id,equipment_id,equipment_code,administrator_id,administrator_name,requested_at,state) VALUES(?,?,?,?,?,?,?)').run(id,equipment.id,equipment.code,user.id,user.full_name,new Date().toISOString(),'requested');return id;},
  consent(id){db.prepare("UPDATE supervision_sessions SET state='accepted',consented_at=? WHERE id=? AND ended_at IS NULL").run(new Date().toISOString(),id);},
  sharing(id){db.prepare("UPDATE supervision_sessions SET state='sharing' WHERE id=? AND ended_at IS NULL").run(id);},
  end(id,reason){db.prepare("UPDATE supervision_sessions SET state='ended',ended_at=?,end_reason=? WHERE id=? AND ended_at IS NULL").run(new Date().toISOString(),reason,id);},
  interrupt(){db.prepare("UPDATE supervision_sessions SET state='ended',ended_at=?,end_reason='server_restart' WHERE ended_at IS NULL").run(new Date().toISOString());},
 };
}
