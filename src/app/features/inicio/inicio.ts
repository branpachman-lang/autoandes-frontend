import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth-service';
import { ServicioService } from '../../core/services/servicio-service';
import { VehiculoService } from '../../core/services/vehiculo-service';
import { OrdenService } from '../../core/services/orden-service';
import { mensajeError } from '../../core/utils/http-error';
import { SiPermiso } from '../../shared/directives/si-permiso';
@Component({selector:'app-inicio',imports:[RouterLink,SiPermiso],templateUrl:'./inicio.html',styleUrl:'./inicio.css'})
export class Inicio implements OnInit {
  protected readonly auth=inject(AuthService);
  private readonly servicios=inject(ServicioService);private readonly vehiculos=inject(VehiculoService);
  private readonly ordenes=inject(OrdenService);private readonly destroyRef=inject(DestroyRef);
  protected readonly resumen=signal<{servicios:number;vehiculos:number;ordenes:number}|null>(null);
  protected readonly error=signal<string|null>(null);
  ngOnInit():void {
    forkJoin({perfil:this.auth.obtenerPerfil(),servicios:this.servicios.listar(),vehiculos:this.vehiculos.listar(),ordenes:this.ordenes.listar()})
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next:r=>this.resumen.set({servicios:r.servicios.filter(s=>s.activo).length,vehiculos:r.vehiculos.length,ordenes:r.ordenes.filter(o=>o.estado==='REGISTRADA').length}),
        error:(e:HttpErrorResponse)=>this.error.set(mensajeError(e))
      });
  }
}
