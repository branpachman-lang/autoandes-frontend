import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
export const SERVICIOS_ROUTES:Routes=[
  {path:'',loadComponent:()=>import('./pages/servicio-list/servicio-list').then(m=>m.ServicioList)},
  {path:'nuevo',canActivate:[permisoGuard],data:{permiso:'SERVICIO_ESCRIBIR'},loadComponent:()=>import('./pages/servicio-form/servicio-form').then(m=>m.ServicioForm)},
  {path:':id/editar',canActivate:[permisoGuard],data:{permiso:'SERVICIO_ESCRIBIR'},loadComponent:()=>import('./pages/servicio-form/servicio-form').then(m=>m.ServicioForm)}
];
