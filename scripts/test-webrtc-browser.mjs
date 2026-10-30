import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../tests/webrtc-browser.html',import.meta.url));
const server=createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);});server.listen(3002,'127.0.0.1',()=>console.log('Prueba aislada de medios: http://127.0.0.1:3002/'));process.on('SIGINT',()=>server.close(()=>process.exit(0)));
