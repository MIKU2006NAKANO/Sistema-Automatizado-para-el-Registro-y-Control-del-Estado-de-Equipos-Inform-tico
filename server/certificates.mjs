import forge from 'node-forge';
import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { mkdirSync,writeFileSync,existsSync } from 'node:fs';
import path from 'node:path';
export function generateCertificates(directory,hosts){
 if(!hosts.length||hosts.some(h=>!isIP(h)&&!(/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}$/.test(h))))throw new Error('Indica una dirección IP o nombre DNS local válido.');
 mkdirSync(directory,{recursive:true,mode:0o700});for(const name of ['ca.pem','ca.cer','ca-key.pem','server.pem','server-key.pem'])if(existsSync(path.join(directory,name)))throw new Error('Ya existen certificados en esa carpeta. Se conservaron sin sobrescribir.');
 const pki=forge.pki,caKeys=pki.rsa.generateKeyPair(2048),keys=pki.rsa.generateKeyPair(2048);
 const ca=pki.createCertificate();ca.publicKey=caKeys.publicKey;ca.serialNumber='01'+randomBytes(15).toString('hex');ca.validity.notBefore=new Date(Date.now()-60000);ca.validity.notAfter=new Date(Date.now()+5*365*86400000);ca.setSubject([{name:'commonName',value:'TechControl ITERN - Autoridad LAN '+randomBytes(4).toString('hex')}]);ca.setIssuer(ca.subject.attributes);ca.setExtensions([{name:'basicConstraints',cA:true,critical:true},{name:'keyUsage',keyCertSign:true,cRLSign:true,critical:true}]);ca.sign(caKeys.privateKey,forge.md.sha256.create());
 const leaf=pki.createCertificate();leaf.publicKey=keys.publicKey;leaf.serialNumber='02'+randomBytes(15).toString('hex');leaf.validity.notBefore=new Date(Date.now()-60000);leaf.validity.notAfter=new Date(Date.now()+365*86400000);leaf.setSubject([{name:'commonName',value:hosts[0]}]);leaf.setIssuer(ca.subject.attributes);leaf.setExtensions([{name:'basicConstraints',cA:false},{name:'keyUsage',digitalSignature:true,keyEncipherment:true,critical:true},{name:'extKeyUsage',serverAuth:true},{name:'subjectAltName',altNames:[...new Set([...hosts,'localhost','127.0.0.1'])].map(host=>isIP(host)?{type:7,ip:host}:{type:2,value:host})}]);leaf.sign(caKeys.privateKey,forge.md.sha256.create());
 for(const [name,content]of Object.entries({'ca.pem':pki.certificateToPem(ca),'ca-key.pem':pki.privateKeyToPem(caKeys.privateKey),'server.pem':pki.certificateToPem(leaf),'server-key.pem':pki.privateKeyToPem(keys.privateKey)}))writeFileSync(path.join(directory,name),content,{flag:'wx',mode:0o600});
 writeFileSync(path.join(directory,'ca.cer'),Buffer.from(forge.asn1.toDer(pki.certificateToAsn1(ca)).getBytes(),'binary'),{flag:'wx',mode:0o600});
 return {ca:path.join(directory,'ca.pem'),cert:path.join(directory,'server.pem'),key:path.join(directory,'server-key.pem')};
}
