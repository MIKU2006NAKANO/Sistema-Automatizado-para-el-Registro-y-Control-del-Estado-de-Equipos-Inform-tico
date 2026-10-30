import type { Equipment, EquipmentInput, History, Profile } from '../domain';
export type LocalProfile=Profile & {email:string};
export type AuthState={profile:LocalProfile|null;needs_setup:boolean};
export type HealthState={app:string;storage:string;version:number};
export async function request<T>(url:string,method='GET',body?:unknown):Promise<T> {
 const response=await fetch(`/api${url}`,{method,credentials:'same-origin',cache:'no-store',headers:{'X-TechControl':'local',...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)}).catch(()=>{throw new Error('No se puede conectar al servidor local. Inicia TechControl y vuelve a intentarlo.');});
 if(!response.ok){const error=await response.json().catch(()=>({message:'El servidor local no pudo procesar la solicitud.'}));if(response.status===401&&url!=='/auth/login')window.dispatchEvent(new Event('techcontrol:unauthorized'));throw new Error(error.message||'Error del servidor local.');}
 return response.json() as Promise<T>;
}
export const api={
 health:()=>request<HealthState>('/health'),
 session:()=>request<AuthState>('/auth/session'),
 login:(email:string,password:string)=>request<{profile:LocalProfile}>('/auth/login','POST',{email,password}),
 setup:(full_name:string,email:string,password:string)=>request<{profile:LocalProfile}>('/auth/setup','POST',{full_name,email,password,role:'administrador'}),
 logout:()=>request('/auth/logout','POST'),
 equipment:()=>request<Equipment[]>('/equipment'),
 save:(id:string|undefined,data:EquipmentInput|Pick<EquipmentInput,'status'|'observations'>,reason:string,expected?:string)=>request<Equipment>(id?`/equipment/${id}`:'/equipment',id?'PUT':'POST',{data,reason,expected_updated_at:expected||null}),
 remove:(id:string,expected:string)=>request(`/equipment/${id}`,'DELETE',{expected_updated_at:expected}),
 history:(id:string)=>request<History[]>(`/equipment/${id}/history`),
 users:()=>request<LocalProfile[]>('/users'),
 createUser:(full_name:string,username:string,password:string)=>request<LocalProfile>('/users','POST',{full_name,email:username,password,role:'tecnico'}),
 password:(current_password:string,password:string)=>request('/auth/password','POST',{current_password,password}),
 async backup(){const info=await request<{filename:string;created_at:string}>('/backups','POST');const response=await fetch(`/api/backups/${info.filename}`,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('El respaldo se guardó en data/backups, pero no pudo descargarse.');const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=info.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return info;}
};
