import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
async function main(){
 if(Number(process.versions.node.split('.')[0])<24)throw new Error('Instala Node.js 24 o superior durante la configuración inicial.');
 if(!existsSync(path.join(root,'node_modules','express'))||!existsSync(path.join(root,'dist','index.html')))throw new Error('Falta la configuración inicial. Ejecuta Configurar TechControl.bat con Internet una sola vez.');
 const port=Number(process.env.PORT||3000);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Puerto inválido.');
 const url=`http://127.0.0.1:${port}/`;
 const open=()=>{const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];execFile(command,args,{windowsHide:true},error=>{if(error)console.log(`Abre manualmente ${url}`);});};
 const existing=await fetch(`${url}api/health`,{signal:AbortSignal.timeout(2000)}).then(r=>r.json()).catch(()=>null);
 if(existing?.app==='techcontrol-itern'&&existing?.storage==='sqlite'){console.log(`TechControl ya está ejecutándose: ${url}`);open();return;}
 const {startServer}=await import('../server/index.mjs');const running=await startServer({development:false});open();
 let stopping=false;const stop=()=>{if(stopping)return;stopping=true;void running.close().then(()=>process.exit(0));};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
main().catch(error=>{console.error(`\nNo se pudo iniciar TechControl: ${error.code==='EADDRINUSE'?'El puerto está ocupado por otra aplicación. Cambia PORT en .env.local.':error.message}`);process.exitCode=1;});
