import { Routes } from '@angular/router';
export const REPORTES_ROUTES:Routes=[
  {path:'',pathMatch:'full',redirectTo:'ingresos-por-servicio'},
  {path:'ingresos-por-servicio',loadComponent:()=>import('./pages/ingresos-servicio/ingresos-servicio').then(m=>m.IngresosServicio)}
];
