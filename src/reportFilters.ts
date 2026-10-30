import { filterEquipment, type Equipment } from './domain';
export type Period='all'|'today'|'week'|'month'|'custom';
export type ReportFilters={period:Period;month:string;from:string;to:string;query:string;location:string;status:string};
export const localDay=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function parseDay(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number);const date=new Date(y,m-1,d);return localDay(date)===value?date:null;}
export function reportDataset(items:Equipment[],filters:ReportFilters,now=new Date()) {
 let start:Date|null=null,end:Date|null=null,error='',periodLabel='Todo el historial';
 if(filters.period==='today'){start=new Date(now.getFullYear(),now.getMonth(),now.getDate());end=new Date(start);end.setDate(end.getDate()+1);periodLabel='Hoy';}
 if(filters.period==='week'){start=new Date(now.getFullYear(),now.getMonth(),now.getDate());start.setDate(start.getDate()-((start.getDay()+6)%7));end=new Date(start);end.setDate(end.getDate()+7);periodLabel=`Esta semana · desde ${localDay(start)}`;}
 if(filters.period==='month'){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month))error='Selecciona un mes válido.';else{const [y,m]=filters.month.split('-').map(Number);start=new Date(y,m-1,1);end=new Date(y,m,1);periodLabel=`Mes: ${filters.month}`;}}
 if(filters.period==='custom'){start=parseDay(filters.from);end=parseDay(filters.to);if(!start||!end)error='Selecciona una fecha inicial y final válidas.';else if(start>end)error='La fecha inicial no puede ser posterior a la fecha final.';else{periodLabel=`Del ${filters.from} al ${filters.to}`;end.setDate(end.getDate()+1);}}
 const filtered=error?[]:filterEquipment(items,filters.query.trim(),filters.status,filters.location).filter(e=>{const timestamp=new Date(e.created_at).getTime();return (!start||timestamp>=start.getTime())&&(!end||timestamp<end.getTime());});
 const label=[`Fecha de registro: ${periodLabel}`,filters.location?`Ubicación: ${filters.location}`:'Todas las ubicaciones',filters.status||'Todos los estados',filters.query.trim()?`Búsqueda: ${filters.query.trim()}`:''].filter(Boolean).join(' · ');
 return {items:filtered,error,label};
}
