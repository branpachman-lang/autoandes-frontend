import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
export const ORDENES_ROUTES:Routes=[
  {path:'',loadComponent:()=>import('./pages/orden-list/orden-list').then(m=>m.OrdenList)},
  {path:'nueva',canActivate:[permisoGuard],data:{permiso:'ORDEN_REGISTRAR'},loadComponent:()=>import('./pages/orden-form/orden-form').then(m=>m.OrdenForm)},
  {path:':id',loadComponent:()=>import('./pages/orden-detalle/orden-detalle').then(m=>m.OrdenDetalle)}
];
