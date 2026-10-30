import { useCallback,useEffect,useRef,useState } from 'react';
import type { ScreenMessage } from './types';
export function useScreenSocket(kind:'admin'|'device',enabled:boolean,onMessage:(message:ScreenMessage)=>void,onDisconnect:()=>void){
 const socket=useRef<WebSocket|null>(null),messageHandler=useRef(onMessage),disconnectHandler=useRef(onDisconnect);
 messageHandler.current=onMessage;disconnectHandler.current=onDisconnect;
 const [connected,setConnected]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled)return;if(location.protocol!=='https:'){setError('Abre el acceso HTTPS del laboratorio para utilizar la supervisión.');return;}
  let disposed=false,retry:ReturnType<typeof setTimeout>|undefined,lastSeen=Date.now();
  const connect=()=>{if(disposed)return;const ws=new WebSocket(`wss://${location.host}/api/supervision/ws?kind=${kind}`);socket.current=ws;
   ws.onopen=()=>{lastSeen=Date.now();setConnected(true);setError('');};
   ws.onmessage=event=>{lastSeen=Date.now();try{messageHandler.current(JSON.parse(event.data));}catch{setError('Se recibió un mensaje inválido.');}};
   ws.onerror=()=>setError('No se pudo conectar por WSS. Comprueba el certificado y la red local.');
   ws.onclose=()=>{if(socket.current===ws)socket.current=null;disconnectHandler.current();if(!disposed){setConnected(false);setError('Conexión cerrada. Las transmisiones se han detenido.');retry=setTimeout(connect,3000);}};
  };connect();
  const heartbeat=setInterval(()=>{const ws=socket.current;if(ws?.readyState===WebSocket.OPEN){if(Date.now()-lastSeen>15000){disconnectHandler.current();ws.close();}else ws.send(JSON.stringify({type:'heartbeat'}));}},3000);
  return()=>{disposed=true;clearTimeout(retry);clearInterval(heartbeat);const ws=socket.current;socket.current=null;if(ws){ws.onclose=null;ws.close();}disconnectHandler.current();};
 },[kind,enabled]);
 const send=useCallback((message:unknown)=>{if(socket.current?.readyState!==WebSocket.OPEN)return false;socket.current.send(JSON.stringify(message));return true;},[]);
 return {send,connected,error};
}
