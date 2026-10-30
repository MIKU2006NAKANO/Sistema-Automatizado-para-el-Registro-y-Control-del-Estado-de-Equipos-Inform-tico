import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { request as httpRequest } from 'node:http';
import { createStore } from '../server/store.mjs';
import { createApp } from '../server/app.mjs';
import { startServer } from '../server/index.mjs';
import { restoreBackup } from '../scripts/restore.mjs';
import { statistics } from '../src/domain.ts';

const directory=mkdtempSync(path.join(tmpdir(),'techcontrol-local-'));
const filename=path.join(directory,'techcontrol.sqlite');
let store,server,base,adminCookie='',techCookie='',equipment;
const password='Prueba-local-segura-2026';
const user={email:'admin@itern.local',full_name:'Administrador local',password,role:'administrador'};
const input=n=>({name:`Equipo ${n}`,serial:`SERIE-${n}`,inventory:`INV-${n}`,brand:'Dell',model:'Optiplex',location:'Laboratorio',processor:'Core i5',ram:8,storage_type:'SSD',storage_gb:256,os:'Windows 11',architecture:'64 bits',status:'Funcional',observations:''});
async function listen(){store=createStore(filename);server=await new Promise(resolve=>{const s=createApp(store).listen(0,'127.0.0.1',()=>resolve(s));});base=`http://127.0.0.1:${server.address().port}`;}
async function close(){await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();});store.close();}
async function call(route,{method='GET',body,cookie=adminCookie,headers={}}={}){const response=await fetch(base+route,{method,headers:{'X-TechControl':'local',...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});const type=response.headers.get('content-type')||'';const data=type.includes('application/json')?await response.json():await response.text();return {status:response.status,data,headers:response.headers};}
before(listen);
after(async()=>{await close();assert.equal(globalThis.techcontrolExternalAttempts?.length||0,0,'No debe haber intentos de conexión externa');rmSync(directory,{recursive:true,force:true});});
describe('API REST y SQLite sin acceso a servicios externos',()=>{
 it('arranca vacía, sirve React y sus recursos compilados solo desde localhost',async()=>{
  assert.deepEqual((await call('/api/health')).data,{app:'techcontrol-itern',storage:'sqlite',version:2});
  assert.equal((await call('/api/auth/session')).data.needs_setup,true);
  assert.equal((await call('/api/equipment',{cookie:''})).status,401);
  const page=await call('/equipos');assert.equal(page.status,200);assert.match(page.data,/TechControl ITERN/);assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
  const refs=[...page.data.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);assert.ok(refs.length>0);
  for(const ref of refs){assert.ok(ref.startsWith('/'),`Recurso remoto inesperado: ${ref}`);assert.equal((await fetch(base+ref)).status,200);}
  assert.equal((await call('/data/techcontrol.sqlite')).headers.get('content-type')?.includes('application/octet-stream'),false);
 });
 it('crea el primer administrador sin contraseña predeterminada y cierra la configuración inicial',async()=>{
  assert.equal((await call('/api/auth/setup',{method:'POST',body:{...user,password:'corta'},cookie:''})).status,400);
  const setup=await call('/api/auth/setup',{method:'POST',body:user,cookie:''});assert.equal(setup.status,201);adminCookie=setup.headers.get('set-cookie').split(';')[0];assert.match(setup.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.equal(setup.data.profile.role,'administrador');
  const stored=store.db.prepare('SELECT password_hash FROM users').get().password_hash;assert.ok(stored.startsWith('scrypt:'));assert.ok(!stored.includes(password));
  assert.equal((await call('/api/auth/setup',{method:'POST',body:{...user,email:'otro@itern.local'},cookie:''})).status,409);
  assert.equal((await call('/api/auth/session')).data.needs_setup,false);
 });
 it('bloquea origen ajeno, hosts ajenos, roles enviados y acceso a respaldos sin autenticación',async()=>{
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:input(1)},headers:{Origin:'https://externo.invalid'}})).status,403);
  const foreignHost=await new Promise((resolve,reject)=>{const req=httpRequest(base+'/api/health',{headers:{Host:'externo.invalid'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(foreignHost,403);
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:input(1)},headers:{'X-TechControl':''}})).status,403);
  assert.equal((await call('/api/backups',{method:'POST',cookie:''})).status,401);
  assert.equal((await call('/api/users',{method:'POST',body:{...user,email:'x@itern.local',extra:'ignorar'}})).status,400);
 });
 it('registra una computadora, genera código/historial y recalcula el dashboard',async()=>{
  const result=await call('/api/equipment',{method:'POST',body:{data:input(1)}});assert.equal(result.status,201);equipment=result.data;assert.equal(equipment.code,'PC-001');
  assert.equal((await call(`/api/equipment/${equipment.id}/history`)).data[0].reason,'Registro inicial del equipo');
  const stats=statistics((await call('/api/equipment')).data);assert.equal(stats.total,1);assert.equal(stats.functional,1);assert.equal(stats.percentage,100);
 });
 it('rechaza duplicados normalizados, entradas incompletas e inyección SQL',async()=>{
  for(const patch of [{serial:' serie-1 '},{inventory:' inv-1 '}])assert.equal((await call('/api/equipment',{method:'POST',body:{data:{...input(2),...patch}}})).status,409);
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:{...input(2),ram:0}}})).status,400);
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:{...input(2),code:'PC-001'}}})).status,400);
  const result=await call('/api/equipment',{method:'POST',body:{data:{...input(2),serial:"x'); DROP TABLE equipment; --"}}});assert.equal(result.status,201);assert.equal(store.list().length,2);
 });
 it('crea técnico local y aplica permisos en el servidor',async()=>{
  const result=await call('/api/users',{method:'POST',body:{...user,email:'tecnico@itern.local',full_name:'Técnico local',role:'tecnico'}});assert.equal(result.status,201);
  const login=await call('/api/auth/login',{method:'POST',body:{email:'tecnico@itern.local',password},cookie:''});assert.equal(login.status,200);techCookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:input(3)},cookie:techCookie})).status,403);
  assert.equal((await call(`/api/equipment/${equipment.id}`,{method:'DELETE',body:{expected_updated_at:equipment.updated_at},cookie:techCookie})).status,403);
  assert.equal((await call('/api/users',{method:'POST',body:{...user,email:'intruso@itern.local'},cookie:techCookie})).status,403);
  assert.equal((await call('/api/backups',{method:'POST',cookie:techCookie})).status,403);
  assert.equal((await call(`/api/equipment/${equipment.id}`,{method:'PUT',body:{data:{status:'Funcional',observations:'',brand:'Otra'},expected_updated_at:equipment.updated_at},cookie:techCookie})).status,400);
 });
 it('crea usuarios sin correo, permite su acceso y rechaza duplicados o espacios',async()=>{
  const account={full_name:'Usuario sin correo',email:'usuario_prueba',password,role:'tecnico'};
  const created=await call('/api/users',{method:'POST',body:account});assert.equal(created.status,201);assert.equal(created.data.email,'usuario_prueba');
  const login=await call('/api/auth/login',{method:'POST',body:{email:'usuario_prueba',password},cookie:''});assert.equal(login.status,200);assert.equal(login.data.profile.id,created.data.id);
  const duplicate=await call('/api/users',{method:'POST',body:{...account,email:'USUARIO_PRUEBA'}});assert.equal(duplicate.status,409);assert.match(duplicate.data.message,/usuario/);
  assert.equal((await call('/api/users',{method:'POST',body:{...account,email:'usuario con espacios'}})).status,400);
 });
 it('asigna roles solo con administrador, rechaza autoasignación y aplica los cambios a las sesiones',async()=>{
  const created=await call('/api/users',{method:'POST',body:{...user,email:'roles@itern.local',full_name:'Usuario de roles',role:'tecnico'}});assert.equal(created.status,201);
  const target=created.data,route=`/api/users/${target.id}/role`,body={role:'administrador',expected_role:'tecnico'};
  assert.equal((await call(route,{method:'PATCH',body,cookie:''})).status,401);
  assert.equal((await call(route,{method:'PATCH',body,cookie:techCookie})).status,403);
  const self=(await call('/api/auth/session')).data.profile;
  assert.equal((await call(`/api/users/${self.id}/role`,{method:'PATCH',body:{role:'tecnico',expected_role:'administrador'}})).status,403);
  assert.equal((await call(route,{method:'PATCH',body:{...body,role:'superadmin'}})).status,400);
  assert.equal((await call(route,{method:'PATCH',body:{...body,email:'otro@itern.local'}})).status,400);
  assert.equal((await call(route,{method:'PATCH',body:{...body,expected_role:'administrador'}})).status,409);
  const oldCookie=`techcontrol_session=${store.session(target)}`;
  const promoted=await call(route,{method:'PATCH',body});assert.equal(promoted.status,200);assert.equal(promoted.data.role,'administrador');
  assert.equal((await call('/api/users',{cookie:oldCookie})).status,401);
  const promotedCookie=`techcontrol_session=${store.session(promoted.data)}`;assert.equal((await call('/api/users',{cookie:promotedCookie})).status,200);
  const pendingUser=store.createUser({...user,email:'en-proceso@itern.local'},false,promoted.data);
  const pendingResult=assert.rejects(pendingUser,/Solo un administrador puede crear usuarios/);
  const demoted=await call(route,{method:'PATCH',body:{role:'tecnico',expected_role:'administrador'}});assert.equal(demoted.status,200);assert.equal(demoted.data.role,'tecnico');await pendingResult;
  assert.equal((await call('/api/users',{cookie:promotedCookie})).status,401);
  const demotedCookie=`techcontrol_session=${store.session(demoted.data)}`;assert.equal((await call('/api/users',{cookie:demotedCookie})).status,403);
 });
 it('exige motivo, cambia estado con autor y evita sobrescribir una versión antigua',async()=>{
  const route=`/api/equipment/${equipment.id}`,oldVersion=equipment.updated_at;
  const data={status:'Con fallas',observations:'No enciende'};
  assert.equal((await call(route,{method:'PUT',body:{data,expected_updated_at:oldVersion},cookie:techCookie})).status,400);assert.equal(store.get(equipment.id).status,'Funcional');
  const result=await call(route,{method:'PUT',body:{data,expected_updated_at:oldVersion,reason:'Falla de encendido'},cookie:techCookie});assert.equal(result.status,200);equipment=result.data;
  assert.equal((await call(route,{method:'PUT',body:{data,expected_updated_at:oldVersion,reason:'Otra prueba'},cookie:techCookie})).status,409);
  const history=(await call(route+'/history')).data;assert.equal(history.length,2);assert.equal(history[0].actor_name,'Técnico local');assert.equal(history[0].reason,'Falla de encendido');
  assert.equal(statistics((await call('/api/equipment')).data).faulty,1);
 });
 it('edita ficha y conserva registros, usuarios y sesión al reiniciar el servidor',async()=>{
  const result=await call(`/api/equipment/${equipment.id}`,{method:'PUT',body:{data:{...input(1),name:'Equipo editado',status:'Con fallas'},expected_updated_at:equipment.updated_at}});assert.equal(result.status,200);equipment=result.data;
  await close();await listen();assert.equal((await call('/api/auth/session')).data.profile.role,'administrador');
  assert.equal((await call('/api/equipment')).data.find(e=>e.id===equipment.id).name,'Equipo editado');
  assert.equal((await call(`/api/equipment/${equipment.id}/history`)).data.length,2);
  assert.equal((await call('/api/auth/session')).data.needs_setup,false);
  assert.equal((await call('/api/users')).data.find(u=>u.email==='roles@itern.local').role,'tecnico');
 });
 it('genera un respaldo íntegro, descargable y sin sesiones; permite abrirlo como SQLite',async()=>{
  const result=await call('/api/backups',{method:'POST'});assert.equal(result.status,201);const backupFile=path.join(directory,'backups',result.data.filename);assert.ok(existsSync(backupFile));
  const copy=new DatabaseSync(backupFile);assert.equal(copy.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(copy.prepare('SELECT count(*) AS n FROM equipment').get().n,2);assert.equal(copy.prepare('SELECT count(*) AS n FROM sessions').get().n,0);copy.close();
  const download=await fetch(base+'/api/backups/'+result.data.filename,{headers:{Cookie:adminCookie}});assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/attachment/);assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0,15).toString(),'SQLite format 3');
  assert.equal((await call('/api/backups/no-valido.sqlite')).status,400);
 });
 it('impone el máximo aun con peticiones simultáneas y libera una plaza al eliminar',async()=>{
  for(let n=3;n<=29;n++)assert.equal((await call('/api/equipment',{method:'POST',body:{data:input(n)}})).status,201);
  const simultaneous=await Promise.all([30,31].map(n=>call('/api/equipment',{method:'POST',body:{data:input(n)}})));assert.deepEqual(simultaneous.map(r=>r.status).sort(),[201,409]);
  assert.equal((await call('/api/equipment')).data.length,30);
  assert.equal((await call(`/api/equipment/${equipment.id}`,{method:'DELETE',body:{expected_updated_at:'antigua'}})).status,409);
  assert.equal((await call(`/api/equipment/${equipment.id}`,{method:'DELETE',body:{expected_updated_at:equipment.updated_at}})).status,200);
  assert.equal((await call(`/api/equipment/${equipment.id}/history`)).status,404);
  assert.equal((await call('/api/equipment',{method:'POST',body:{data:input(32)}})).status,201);
  const all=(await call('/api/equipment')).data;assert.equal(new Set(all.map(e=>e.code)).size,30);
 });
 it('actualiza contraseñas, invalida otras sesiones y permite cerrar/iniciar sesión sin Internet',async()=>{
  const result=await call('/api/auth/password',{method:'POST',body:{current_password:password,password:password+'-nueva'}});assert.equal(result.status,200);
  assert.equal((await call('/api/equipment')).status,401);
  const fresh=result.headers.get('set-cookie').split(';')[0];assert.equal((await call('/api/equipment',{cookie:fresh})).status,200);
  assert.equal((await call('/api/auth/logout',{method:'POST',cookie:fresh})).status,200);assert.equal((await call('/api/equipment',{cookie:fresh})).status,401);
  assert.equal((await call('/api/auth/login',{method:'POST',body:{email:user.email,password},cookie:''})).status,401);
  const login=await call('/api/auth/login',{method:'POST',body:{email:user.email,password:password+'-nueva'},cookie:''});assert.equal(login.status,200);adminCookie=login.headers.get('set-cookie').split(';')[0];
 });
 it('genera respaldo automático al iniciar sobre la base existente sin sobrescribirla',async()=>{
  await close();const beforeCount=readdirSync(path.join(directory,'backups')).length;
  const running=await startServer({port:0,dataDir:directory});assert.equal(running.store.list().length,30);assert.equal(readdirSync(path.join(directory,'backups')).length,beforeCount+1);
  await assert.rejects(startServer({port:0,dataDir:directory}),/base de datos está en uso/);
  assert.throws(()=>restoreBackup(path.join(directory,'backups',readdirSync(path.join(directory,'backups'))[0]),directory),/base de datos está en uso/);
  await running.close();await listen();
 });
 it('restaura un respaldo con servidor detenido y conserva la base anterior sin sesiones activas',async()=>{
  const snapshot=await store.createBackup();const item=store.list()[0];store.remove(store.userForToken(adminCookie.split('=')[1]),item.id,item.updated_at);assert.equal(store.list().length,29);await close();
  const restored=restoreBackup(path.join(directory,'backups',snapshot.filename),directory);assert.ok(existsSync(restored.previous));const previous=new DatabaseSync(restored.previous,{readOnly:true});assert.equal(previous.prepare('SELECT count(*) AS n FROM equipment').get().n,29);previous.close();
  await listen();assert.equal(store.list().length,30);assert.equal(store.db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);assert.equal((await call('/api/auth/session')).data.profile,null);
 });
 it('crea admin/admin123 al iniciar, conserva datos y no restablece credenciales en reinicios',async()=>{
  const dataDir=path.join(directory,'default-admin'),existing=createStore(path.join(dataDir,'techcontrol.sqlite'));
  const original=await existing.createUser({...user,email:'original@itern.local'},true);existing.save(original,null,input(1));existing.close();
  let running=await startServer({port:0,dataDir});
  try{
   const response=await fetch(`http://127.0.0.1:${running.server.address().port}/api/auth/login`,{method:'POST',headers:{'X-TechControl':'local','Content-Type':'application/json'},body:JSON.stringify({email:'admin',password:'admin123'})});assert.equal(response.status,200);const result=await response.json();assert.equal(result.profile.role,'administrador');assert.equal(result.profile.email,'admin');
   const hash=running.store.db.prepare("SELECT password_hash FROM users WHERE email='admin'").get().password_hash;assert.ok(hash.startsWith('scrypt:'));assert.ok(!hash.includes('admin123'));assert.equal(running.store.list().length,1);assert.equal(running.store.listUsers().length,2);
   await running.store.changePassword(result.profile,'admin123','Nueva-clave-local-2026');
  }finally{await running.close();}
  running=await startServer({port:0,dataDir});
  try{await assert.rejects(running.store.login('admin','admin123'),/incorrectos/);assert.equal((await running.store.login('admin','Nueva-clave-local-2026')).role,'administrador');assert.equal(running.store.listUsers().length,2);assert.equal(running.store.list().length,1);}finally{await running.close();}
 });
 it('no incluye CDN, fuentes remotas ni clientes Supabase en la aplicación local',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');assert.doesNotMatch(html,/https?:\/\/|cdn\./);assert.doesNotMatch(css,/@import\s+url|url\(\s*['"]?https?:/);
  assert.equal(JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).dependencies['@supabase/supabase-js'],undefined);
  assert.equal(globalThis.techcontrolExternalAttempts?.length||0,0);
 });
});
