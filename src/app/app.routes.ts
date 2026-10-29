import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/guards/auth-guard';
import { permisoGuard } from './core/guards/permiso-guard';
import { MainLayout } from './layout/main-layout/main-layout';
export const routes:Routes=[
  {path:'login',title:'Iniciar sesión · AutoAndes',canActivate:[invitadoGuard],loadComponent:()=>import('./features/auth/pages/login/login').then(m=>m.Login)},
  {path:'',component:MainLayout,canActivate:[authGuard],canActivateChild:[authGuard],children:[
    {path:'',pathMatch:'full',redirectTo:'inicio'},
    {path:'inicio',title:'Inicio · AutoAndes',loadComponent:()=>import('./features/inicio/inicio').then(m=>m.Inicio)},
    {path:'servicios',title:'Servicios · AutoAndes',canActivate:[permisoGuard],data:{permiso:'SERVICIO_LEER'},loadChildren:()=>import('./features/servicios/servicios.routes').then(m=>m.SERVICIOS_ROUTES)},
    {path:'vehiculos',title:'Vehículos · AutoAndes',canActivate:[permisoGuard],data:{permiso:'VEHICULO_LEER'},loadChildren:()=>import('./features/vehiculos/vehiculos.routes').then(m=>m.VEHICULOS_ROUTES)},
    {path:'ordenes',title:'Órdenes · AutoAndes',canActivate:[permisoGuard],data:{permiso:'ORDEN_LEER'},loadChildren:()=>import('./features/ordenes/ordenes.routes').then(m=>m.ORDENES_ROUTES)},
    {path:'reportes',title:'Reportes · AutoAndes',canActivate:[permisoGuard],data:{permiso:'REPORTE_VER'},loadChildren:()=>import('./features/reportes/reportes.routes').then(m=>m.REPORTES_ROUTES)},
    {path:'acceso-denegado',title:'Acceso denegado · AutoAndes',loadComponent:()=>import('./shared/pages/acceso-denegado/acceso-denegado').then(m=>m.AccesoDenegado)}
  ]},
  {path:'**',title:'Página no encontrada · AutoAndes',loadComponent:()=>import('./shared/pages/no-encontrado/no-encontrado').then(m=>m.NoEncontrado)}
];
