import { Permiso } from '../auth/auth.model';
export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
  permiso?: Permiso;
}
export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '⌂' },
  { etiqueta: 'Servicios', ruta: '/servicios', icono: '⚒', permiso: 'SERVICIO_LEER' },
  { etiqueta: 'Vehículos', ruta: '/vehiculos', icono: '▣', permiso: 'VEHICULO_LEER' },
  { etiqueta: 'Órdenes de servicio', ruta: '/ordenes', icono: '▤', permiso: 'ORDEN_LEER' },
  {
    etiqueta: 'Reportes',
    ruta: '/reportes/ingresos-por-servicio',
    icono: '▥',
    permiso: 'REPORTE_VER',
  },
];
