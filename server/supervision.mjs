import { WebSocketServer,WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { supervisionStore } from './supervision-store.mjs';
import { AppError } from './store.mjs';
export const cookieToken=(req,name)=>{const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;};
const id=z.uuid(),empty=z.object({type:z.enum(['heartbeat','end-all'])}).strict();
const messageSchema=z.union([empty,z.object({type:z.literal('request'),equipment_id:id}).strict(),z.object({type:z.enum(['accept','decline','end','capture-error','connected']),session_id:id}).strict(),z.object({type:z.literal('signal'),session_id:id,sdp:z.object({type:z.enum(['offer','answer']),sdp:z.string().min(1).max(64000)}).strict().optional(),candidate:z.object({candidate:z.string().max(4000),sdpMid:z.string().nullable().optional(),sdpMLineIndex:z.number().int().min(0).max(4).nullable().optional(),usernameFragment:z.string().nullable().optional()}).strict().optional()}).strict()]);
const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));};
export function createSupervision(store,{enabled=false,lanOrigin='',requestTimeout=60000,captureTimeout=120000,tickMs=5000}={}){
 const data=supervisionStore(store),clients=new Set(),sessions=new Map(),devices=new Map();data.interrupt();
 const wss=new WebSocketServer({noServer:true,maxPayload:70000,perMessageDeflate:false});
 function valid(client){const account=client.kind==='admin'?store.userForToken(client.token):data.device(client.token);return account&&(client.kind!=='admin'||account.role==='administrador')?account:null;}
 function rows(client){return store.list().map(e=>{const socket=devices.get(e.id),session=[...sessions.values()].find(s=>s.equipment.id===e.id);return {id:e.id,code:e.code,name:e.name,connected:!!socket,sharing:session?.phase==='sharing',phase:session?.phase||'idle',session_id:session?.id||null,owned:session?.admin===client};});}
 function broadcast(){for(const c of clients)if(c.kind==='admin')send(c.ws,{type:'snapshot',equipment:rows(c)});}
 function finish(session,reason){if(!session||!sessions.has(session.id))return;sessions.delete(session.id);data.end(session.id,reason);const event={type:'ended',session_id:session.id,reason};send(session.admin.ws,event);send(session.device.ws,event);broadcast();}
 function disconnect(c){if(!clients.delete(c))return;if(c.kind==='device'&&devices.get(c.identity.equipment_id)===c)devices.delete(c.identity.equipment_id);for(const s of [...sessions.values()])if(s.admin===c||s.device===c)finish(s,c.kind==='device'?'device_disconnected':'administrator_disconnected');broadcast();}
 function revalidate(){for(const c of [...clients])if(!valid(c)){disconnect(c);c.ws.close(4001,'Permiso o sesión vencidos');}}
 function handle(c,raw){if(!valid(c))throw new AppError(401,'Sesión vencida.');const now=Date.now();if(now-c.window>10000){c.window=now;c.count=0;}if(++c.count>(c.kind==='admin'?1200:160))throw new AppError(429,'Demasiados mensajes.');c.lastSeen=now;const m=messageSchema.parse(JSON.parse(raw.toString()));
  if(m.type==='heartbeat'){send(c.ws,{type:'heartbeat'});return;}
  if(m.type==='end-all'){if(c.kind!=='admin')throw new AppError(403,'No autorizado.');for(const s of [...sessions.values()])finish(s,'administrator_ended');return;}
  if(m.type==='request'){
   if(c.kind!=='admin')throw new AppError(403,'Solo un administrador puede solicitar pantallas.');const equipment=store.get(m.equipment_id),device=devices.get(m.equipment_id);if(!equipment||!device)throw new AppError(409,'El equipo está desconectado.');if([...sessions.values()].some(s=>s.equipment.id===equipment.id))throw new AppError(409,'Este equipo ya tiene una solicitud o sesión activa.');if(sessions.size>=30)throw new AppError(409,'Se alcanzó el máximo de 30 sesiones.');const identity=valid(c);const session={id:data.begin(equipment,identity),equipment,admin:c,device,phase:'requested',deadline:now+requestTimeout};sessions.set(session.id,session);send(device.ws,{type:'request',session_id:session.id,administrator:identity.full_name,code:equipment.code,expires_at:session.deadline});broadcast();return;
  }
  const s=sessions.get(m.session_id);if(!s)throw new AppError(409,'La sesión ya terminó.');const participant=s.admin===c||s.device===c;
  if(m.type==='end'){if(!participant&&c.kind!=='admin')throw new AppError(403,'No autorizado.');finish(s,c.kind==='device'?'user_stopped':'administrator_ended');return;}
  if(!participant)throw new AppError(403,'No perteneces a esta sesión.');
  if(m.type==='connected'){if(c!==s.admin||s.phase!=='sharing')throw new AppError(403,'Conexión no permitida.');if(!s.connected){s.connected=true;s.deadline=now+2*60*60*1000;}return;}
  if(m.type==='accept'){if(c!==s.device||s.phase!=='requested')throw new AppError(403,'Consentimiento no permitido.');s.phase='accepted';s.deadline=now+captureTimeout;data.consent(s.id);broadcast();return;}
  if(m.type==='decline'||m.type==='capture-error'){if(c!==s.device)throw new AppError(403,'No autorizado.');finish(s,m.type==='decline'?'user_declined':'capture_failed');return;}
  if(m.type==='signal'){
   if(!['accepted','sharing'].includes(s.phase))throw new AppError(403,'La compartición aún no fue autorizada.');if(!!m.sdp===!!m.candidate)throw new AppError(400,'Señal inválida.');
   if(m.sdp){const offer=c===s.device;if(m.sdp.type!==(offer?'offer':'answer')||/m=(audio|application)\s/.test(m.sdp.sdp)||!m.sdp.sdp.includes('m=video ')||(m.sdp.sdp.match(/^m=/gm)||[]).length!==1||!m.sdp.sdp.includes(offer?'a=sendonly':'a=recvonly'))throw new AppError(400,'Solo se admite vídeo de pantalla unidireccional.');if(offer){if(s.phase!=='accepted')throw new AppError(409,'Oferta duplicada.');s.phase='sharing';s.deadline=now+30000;data.sharing(s.id);}else if(s.phase!=='sharing')throw new AppError(409,'Primero debe recibirse una oferta autorizada.');}
   send((c===s.device?s.admin:s.device).ws,{type:'signal',session_id:s.id,equipment_id:s.equipment.id,...(m.sdp?{sdp:m.sdp}:{candidate:m.candidate})});return;
  }
 }
 wss.on('connection',(ws,req,identity)=>{const client={ws,...identity,connection_id:randomUUID(),lastSeen:Date.now(),window:Date.now(),count:0};clients.add(client);if(client.kind==='device'){const previous=devices.get(client.identity.equipment_id);if(previous){disconnect(previous);previous.ws.close(4000,'Cliente reemplazado');}devices.set(client.identity.equipment_id,client);}send(ws,{type:'hello',kind:client.kind,connection_id:client.connection_id});broadcast();ws.on('pong',()=>{client.lastSeen=Date.now();});ws.on('message',raw=>{try{handle(client,raw);}catch(e){send(ws,{type:'error',message:e instanceof AppError?e.message:'Mensaje de supervisión inválido.'});if(e.status===401||e.status===429){disconnect(client);ws.close(4001,'Conexión no autorizada');}}});ws.on('close',()=>disconnect(client));ws.on('error',()=>disconnect(client));});
 const timer=setInterval(()=>{revalidate();const now=Date.now();for(const s of [...sessions.values()])if(s.deadline<now)finish(s,'timeout');for(const c of [...clients]){if(now-c.lastSeen>20000){disconnect(c);c.ws.terminate();}else c.ws.ping();}broadcast();},tickMs);timer.unref();
 return {
  enabled,data,revalidate,
  attach(server){server.on('upgrade',(req,socket,head)=>{let url;try{url=new URL(req.url,'https://'+req.headers.host);}catch{socket.destroy();return;}const origin=`https://${req.headers.host}`;if(url.pathname!=='/api/supervision/ws'||!req.socket.encrypted||req.headers.origin!==origin||!(['127.0.0.1','localhost','[::1]'].includes(url.hostname)||origin===lanOrigin)||!enabled){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
   const kind=url.searchParams.get('kind');const token=cookieToken(req,kind==='admin'?'techcontrol_session':'techcontrol_device');const identity=kind==='admin'?store.userForToken(token):kind==='device'?data.device(token):null;
   if(!identity||(kind==='admin'&&identity.role!=='administrador')||clients.size>=64){socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');return;}
   wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req,{kind,token,identity}));
  });},
  close(){clearInterval(timer);for(const s of [...sessions.values()])finish(s,'server_shutdown');for(const c of clients)c.ws.terminate();clients.clear();devices.clear();wss.close();},
  connected:()=>devices.size,
 };
}
