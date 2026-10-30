import { z } from 'zod';
import { AppError } from './store.mjs';
import { cookieToken } from './supervision.mjs';
export function publicSupervisionRoutes(app,hub,{lanOrigin='' }={}){
 const attempts=new Map();
 app.get('/api/supervision/info',(req,res)=>res.json({enabled:hub.enabled,secure:!!req.socket.encrypted,lan_url:lanOrigin}));
 app.get('/api/supervision/device',(req,res)=>res.json({device:req.socket.encrypted?hub.data.device(cookieToken(req,'techcontrol_device')):null}));
 app.post('/api/supervision/pair',(req,res)=>{
  if(!hub.enabled||!req.socket.encrypted)throw new AppError(403,'La vinculación requiere HTTPS configurado.');const ip=req.socket.remoteAddress,now=Date.now(),bucket=attempts.get(ip);if(!bucket||bucket.until<now)attempts.set(ip,{count:1,until:now+60000});else if(++bucket.count>8)throw new AppError(429,'Espera un minuto antes de intentar otro código.');
  const {code}=z.object({code:z.string().trim().regex(/^[a-fA-F0-9-]{12,14}$/)}).strict().parse(req.body);const paired=hub.data.pair(code);hub.revalidate();res.setHeader('Set-Cookie',`techcontrol_device=${paired.token}; HttpOnly; Secure; SameSite=Strict; Path=/api/supervision; Max-Age=43200`);res.json({device:hub.data.device(paired.token)});
 });
 app.post('/api/supervision/unpair',(req,res)=>{hub.data.revoke(cookieToken(req,'techcontrol_device'));hub.revalidate();res.setHeader('Set-Cookie','techcontrol_device=; HttpOnly; Secure; SameSite=Strict; Path=/api/supervision; Max-Age=0');res.json({ok:true});});
}
export function privateSupervisionRoutes(app,hub,administrator){
 app.post('/api/supervision/pair-codes',administrator,(req,res)=>{if(!hub.enabled||!req.socket.encrypted)throw new AppError(403,'Abre Supervisión desde el acceso HTTPS.');const {equipment_id}=z.object({equipment_id:z.uuid()}).strict().parse(req.body);res.json(hub.data.pairCode(equipment_id));});
}
