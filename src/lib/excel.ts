import ExcelJS from 'exceljs';
import { date, statistics, type Equipment } from '../domain';
export function createExcel(items:Equipment[],context='Todo el historial') {
 const workbook=new ExcelJS.Workbook();workbook.creator='TechControl ITERN';workbook.created=new Date();
 const sheet=workbook.addWorksheet('Equipos');
 sheet.columns=[{width:13},{width:25},{width:24},{width:22},{width:18},{width:22},{width:26},{width:28},{width:14},{width:21},{width:19},{width:24},{width:18},{width:23},{width:55},{width:26},{width:26}];
 sheet.mergeCells('A1:Q1');sheet.getCell('A1').value='TechControl ITERN · Listado de computadoras';sheet.getCell('A1').font={bold:true,size:16,color:{argb:'FF1C3E6E'}};
 sheet.mergeCells('A2:Q2');sheet.getCell('A2').value=`Generado: ${date(workbook.created.toISOString())}`;
 sheet.mergeCells('A3:Q3');sheet.getCell('A3').value=context;sheet.getCell('A3').alignment={wrapText:true};sheet.getRow(3).height=34;
 sheet.getRow(5).values=['Código','Nombre','Serie','Inventario','Marca','Modelo','Ubicación','Procesador','RAM (GB)','Tipo almacenamiento','Capacidad (GB)','Sistema operativo','Arquitectura','Estado','Observaciones','Fecha de registro','Última actualización'];
 for(const e of items)sheet.addRow([e.code,e.name,e.serial,e.inventory,e.brand,e.model,e.location,e.processor,e.ram,e.storage_type,e.storage_gb,e.os,e.architecture,e.status,e.observations,date(e.created_at),date(e.updated_at)]);
 sheet.getRow(5).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(5).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1E4073'}};sheet.getRow(5).height=26;
 sheet.views=[{state:'frozen',ySplit:5}];sheet.autoFilter={from:'A5',to:`Q${Math.max(5,items.length+5)}`};
 const s=statistics(items),summary=workbook.addWorksheet('Resumen');summary.columns=[{width:38},{width:30}];summary.addRows([['TechControl ITERN','Resumen estadístico'],['Generado',date(workbook.created.toISOString())],['Filtros',context],[],['Indicador','Valor'],['Equipos seleccionados',s.total],['Funcionales',s.functional],['Con fallas',s.faulty],['En mantenimiento',s.maintenance],['Porcentaje funcional',`${s.percentage}%`],['Total del laboratorio (capacidad)',30]]);summary.getRow(1).font={bold:true,size:14};summary.getRow(5).font={bold:true};summary.getCell('B3').alignment={wrapText:true};summary.getRow(3).height=70;
 return workbook;
}
export async function exportExcel(items:Equipment[],context:string){const buffer=await createExcel(items,context).xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([new Uint8Array(buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download=`techcontrol-equipos-${new Date().toISOString().slice(0,10)}.xlsx`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
