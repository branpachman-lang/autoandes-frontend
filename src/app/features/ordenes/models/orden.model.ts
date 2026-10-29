export type EstadoOrden = 'REGISTRADA' | 'ANULADA';
export interface DetalleOrdenRequest {
  servicioId: number;
  cantidad: number;
}
export interface OrdenRequest {
  vehiculoId: number;
  kilometraje: number;
  detalles: DetalleOrdenRequest[];
}
export interface DetalleOrden extends DetalleOrdenRequest {
  id: number;
  codigo: string;
  servicio: string;
  precioUnitario: number;
  subtotal: number;
}
export interface Orden {
  id: number;
  numero: string;
  fecha: string;
  vehiculoId: number;
  placa: string;
  clienteNombre: string;
  kilometraje: number;
  estado: EstadoOrden;
  total: number;
  usuarioRegistro: string;
  motivoAnulacion: string | null;
  detalles: DetalleOrden[];
}
export interface FiltroOrdenes {
  placa: string;
  estado: EstadoOrden | '';
  desde: string;
  hasta: string;
}
