import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
export const VEHICULOS_ROUTES:Routes=[
  {path:'',loadComponent:()=>import('./pages/vehiculo-list/vehiculo-list').then(m=>m.VehiculoList)},
  {path:'nuevo',canActivate:[permisoGuard],data:{permiso:'VEHICULO_ESCRIBIR'},loadComponent:()=>import('./pages/vehiculo-form/vehiculo-form').then(m=>m.VehiculoForm)},
  {path:':id/editar',canActivate:[permisoGuard],data:{permiso:'VEHICULO_ESCRIBIR'},loadComponent:()=>import('./pages/vehiculo-form/vehiculo-form').then(m=>m.VehiculoForm)}
];
