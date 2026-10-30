import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { AppError } from './store.mjs';
import { publicSupervisionRoutes,privateSupervisionRoutes } from './supervision-routes.mjs';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const loginSchema=z.object({email:z.string().trim().min(1).max(254),password:z.string().min(1).max(128)}).strict();
const saveSchema=z.object({data:z.record(z.string(),z.unknown()),reason:z.string().max(2000).default(''),expected_updated_at:z.string().nullable().optional()}).strict();
const idSchema=z.uuid();
const tokenFrom=req=>{const value=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith('techcontrol_session='))?.slice('techcontrol_session='.length);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;};
const cookie=(token,req)=>`techcontrol_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token?8*60*60:0}${req.socket.encrypted?'; Secure':''}`;
export function createApp(store,{dist=path.join(projectRoot,'dist'),development=false,supervision=null,lanOrigin=''}={}) {
 const app=express();app.disable('x-powered-by');
 app.use((req,res,next)=>{let host;try{host=new URL(`http://${req.headers.host}`).hostname;}catch{return res.status(400).json({message:'Host inválido.'});}if(!['127.0.0.1','localhost','[::1]'].includes(host)&&!(req.socket.encrypted&&`https://${req.headers.host}`===lanOrigin))return res.status(403).json({message:'Solo se permite acceso local o al origen LAN configurado.'});
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});
  res.set('Permissions-Policy','camera=(), microphone=(), display-capture=(self)');
  if(req.path.startsWith('/api')){res.set('Cache-Control','no-store');if(!['GET','HEAD','OPTIONS'].includes(req.method)){const origin=req.headers.origin;const allowed=[`${req.socket.encrypted?'https':'http'}://${req.headers.host}`,...(development?['http://127.0.0.1:5173','http://localhost:5173']:[])];if(req.headers['x-techcontrol']!=='local'||(origin&&!allowed.includes(origin)))return res.status(403).json({message:'Solicitud de origen no permitido.'});}}
  next();
 });
 app.use(express.json({limit:'40kb'}));
 if(supervision)publicSupervisionRoutes(app,supervision,{lanOrigin});
 else app.get('/api/supervision/info',(_req,res)=>res.json({enabled:false,secure:false,lan_url:''}));
 const attempts=new Map();
 function authLimit(req,_res,next){const key=req.socket.remoteAddress||'local',now=Date.now();let bucket=attempts.get(key);if(!bucket||bucket.until<now){bucket={count:0,until:now+60_000};attempts.set(key,bucket);}bucket.count++;if(bucket.count>12)throw new AppError(429,'Demasiados intentos. Espera un minuto antes de volver a intentarlo.');next();}
 app.get('/api/health',(_req,res)=>res.json({app:'techcontrol-itern',storage:'sqlite',version:2}));
 app.get('/api/auth/session',(req,res)=>res.json({profile:store.userForToken(tokenFrom(req)),needs_setup:store.needsSetup()}));
 app.post('/api/auth/setup',authLimit,async(req,res)=>{if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))throw new AppError(403,'Crea el administrador inicial desde la computadora del servidor.');const user=await store.createUser(req.body,true);const token=store.session(user);res.setHeader('Set-Cookie',cookie(token,req));res.status(201).json({profile:user});});
 app.post('/api/auth/login',authLimit,async(req,res)=>{const input=loginSchema.parse(req.body);const user=await store.login(input.email,input.password);const old=tokenFrom(req);store.logout(old);supervision?.revalidate();res.setHeader('Set-Cookie',cookie(store.session(user),req));res.json({profile:user});});
 app.post('/api/auth/logout',(req,res)=>{store.logout(tokenFrom(req));supervision?.revalidate();res.setHeader('Set-Cookie',cookie('',req));res.json({ok:true});});
 app.use('/api',(req,_res,next)=>{req.user=store.userForToken(tokenFrom(req));if(!req.user)throw new AppError(401,'Inicia sesión para continuar.');next();});
 const administrator=(req,_res,next)=>{if(req.user.role!=='administrador')throw new AppError(403,'Esta función requiere permisos de administrador.');next();};
 if(supervision)privateSupervisionRoutes(app,supervision,administrator);
 app.post('/api/auth/password',async(req,res)=>{const input=z.object({current_password:z.string().min(1).max(128),password:z.string().min(12).max(128)}).strict().parse(req.body);await store.changePassword(req.user,input.current_password,input.password);supervision?.revalidate();res.setHeader('Set-Cookie',cookie(store.session(req.user),req));res.json({ok:true});});
 app.get('/api/equipment',(_req,res)=>res.json(store.list()));
 app.get('/api/equipment/:id/history',(req,res)=>res.json(store.history(idSchema.parse(req.params.id))));
 app.post('/api/equipment',(req,res)=>{const input=saveSchema.parse(req.body);res.status(201).json(store.save(req.user,null,input.data,input.reason));});
 app.put('/api/equipment/:id',(req,res)=>{const input=saveSchema.parse(req.body);res.json(store.save(req.user,idSchema.parse(req.params.id),input.data,input.reason,input.expected_updated_at));});
 app.delete('/api/equipment/:id',(req,res)=>{const input=z.object({expected_updated_at:z.string()}).strict().parse(req.body);store.remove(req.user,idSchema.parse(req.params.id),input.expected_updated_at);res.json({ok:true});});
 app.get('/api/users',administrator,(_req,res)=>res.json(store.listUsers()));
 app.post('/api/users',administrator,async(req,res)=>res.status(201).json(await store.createUser(req.body,false,req.user)));
 app.patch('/api/users/:id/role',administrator,(req,res)=>{const input=z.object({role:z.enum(['administrador','tecnico']),expected_role:z.enum(['administrador','tecnico'])}).strict().parse(req.body);const result=store.assignRole(req.user,idSchema.parse(req.params.id),input.role,input.expected_role);supervision?.revalidate();res.json(result);});
 app.post('/api/backups',administrator,async(_req,res)=>res.status(201).json(await store.createBackup()));
 app.get('/api/backups/:name',administrator,(req,res,next)=>{if(!/^techcontrol-[0-9TZ-]+-[a-f0-9]{8}\.sqlite$/.test(req.params.name))throw new AppError(400,'Nombre de respaldo inválido.');const target=path.join(path.dirname(store.filename),'backups',req.params.name);if(!existsSync(target))throw new AppError(404,'El respaldo no existe.');res.download(target,req.params.name,error=>{if(error)next(error);});});
 app.use('/api',(_req,res)=>res.status(404).json({message:'Ruta de API no encontrada.'}));
 app.use(express.static(dist,{index:false,dotfiles:'deny'}));
 app.get('/{*path}',(req,res)=>{if(req.path.startsWith('/assets/'))return res.status(404).send('Recurso no encontrado');if(!existsSync(path.join(dist,'index.html')))return res.status(503).send('Falta compilar la aplicación. Ejecuta npm run build durante la configuración inicial.');res.set('Cache-Control','no-cache');res.sendFile(path.join(dist,'index.html'));});
 app.use((error,_req,res,_next)=>{if(res.headersSent)return;let status=error.status||500,message=error.message;if(error instanceof z.ZodError){status=400;message=error.issues.map(i=>`${i.path.join('.')==='email'?'Usuario':i.path.join('.')}: ${i.message}`).join(' · ');}else if((message?.includes('UNIQUE constraint failed: equipment.')||message?.includes("UNIQUE constraint failed: index 'equipment_"))){status=409;message='Ya existe un equipo con esa serie o número de inventario.';}else if(message?.includes('UNIQUE constraint failed: users.')){status=409;message='Ya existe una cuenta con ese usuario.';}else if(message?.includes('CAPACITY')){status=409;message='Se alcanzó el límite de 30 computadoras.';}else if(message?.includes('SQLITE_BUSY')||message?.includes('database is locked')){status=503;message='La base de datos está ocupada. Inténtalo nuevamente.';}else if(status===500){console.error('Error interno:',error);message='No se pudo completar la operación local. Revisa la consola del servidor.';}res.status(status).json({message});});
 return app;
}
