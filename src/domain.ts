import { z } from 'zod';
export const statuses = ['Funcional', 'Con fallas', 'En mantenimiento'] as const;
export type Status = typeof statuses[number];
export type Profile = { id: string; full_name: string; role: 'administrador' | 'tecnico' };
const required = z.string().trim().min(1, 'Este campo es obligatorio').max(160, 'Máximo 160 caracteres');
export const equipmentSchema = z.object({ name: required, serial: required, inventory: required, brand: required, model: required, location: required, processor: required, ram: z.coerce.number().int().min(1).max(2048), storage_type: z.enum(['SSD', 'HDD', 'NVMe', 'Híbrido']), storage_gb: z.coerce.number().int().min(1).max(1000000), os: required, architecture: z.enum(['64 bits', '32 bits', 'ARM64']), status: z.enum(statuses), observations: z.string().trim().max(4000) });
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type Equipment = EquipmentInput & { id: string; code: string; created_at: string; updated_at: string };
export type History = { id: string; equipment_id: string; previous_status: Status | null; new_status: Status; changed_at: string; actor_name: string; reason: string };
export function statistics(items: Equipment[]) { return { total: items.length, functional: items.filter(i => i.status === 'Funcional').length, faulty: items.filter(i => i.status === 'Con fallas').length, maintenance: items.filter(i => i.status === 'En mantenimiento').length, available: Math.max(0, 30 - items.length), percentage: items.length ? Math.round(items.filter(i => i.status === 'Funcional').length / items.length * 100) : 0 }; }
export function filterEquipment(items: Equipment[], query: string, status: string, location: string) { const q = query.toLocaleLowerCase('es'); return items.filter(e => (!status || e.status === status) && (!location || e.location === location) && [e.code, e.name, e.brand, e.model, e.serial, e.inventory].some(v => v.toLocaleLowerCase('es').includes(q))); }
export const date = (value: string) => new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
