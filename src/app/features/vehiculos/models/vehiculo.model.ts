export interface VehiculoRequest { placa: string; marca: string; modelo: string; anio: number; clienteId: number; }
export interface Vehiculo extends VehiculoRequest { id: number; clienteNombre: string; }
