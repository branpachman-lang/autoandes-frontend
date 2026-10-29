export type Permiso =
  | 'SERVICIO_LEER'
  | 'SERVICIO_ESCRIBIR'
  | 'VEHICULO_LEER'
  | 'VEHICULO_ESCRIBIR'
  | 'ORDEN_LEER'
  | 'ORDEN_REGISTRAR'
  | 'ORDEN_ANULAR'
  | 'REPORTE_VER';
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}
export interface Sesion {
  token: string;
  expiraEn: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}
export interface PerfilUsuario {
  id: number;
  username: string;
  nombreCompleto: string;
  activo: boolean;
  roles: string[];
  permisos: Permiso[];
}
