export interface ServicioRequest { codigo: string; nombre: string; precio: number; duracionMin: number; activo: boolean; }
export interface Servicio extends ServicioRequest { id: number; }
