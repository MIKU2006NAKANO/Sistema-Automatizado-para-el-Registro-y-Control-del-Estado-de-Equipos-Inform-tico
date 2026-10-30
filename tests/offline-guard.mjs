// Fail immediately if a test or the server tries to contact a non-loopback host.
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { syncBuiltinESMExports } from 'node:module';
globalThis.techcontrolExternalAttempts=[];
const local=host=>['localhost','127.0.0.1','::1','[::1]'].includes(host);
function assertLocal(host){if(!local(host)){globalThis.techcontrolExternalAttempts.push(host);throw new Error(`OFFLINE: acceso externo bloqueado: ${host}`);}}
const originalFetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);assertLocal(url.hostname);return originalFetch(input,options);};
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){let options=args[0];if(Array.isArray(options))options=options[0];if(typeof options==='object'&&options&&!options.path)assertLocal(options.host||'localhost');else if(typeof options==='number')assertLocal(typeof args[1]==='string'?args[1]:'localhost');return connect.apply(this,args);};
for(const protocol of [http,https])for(const name of ['request','get']){const original=protocol[name];protocol[name]=function(input,...args){const host=typeof input==='string'||input instanceof URL?new URL(input).hostname:input.hostname||input.host||'localhost';assertLocal(host);return original.call(this,input,...args);};}
const lookup=dns.lookup;dns.lookup=function(host,...args){assertLocal(host);return lookup.call(this,host,...args);};
syncBuiltinESMExports();
