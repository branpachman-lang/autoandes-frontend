import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrdenService } from '../../../../core/services/orden-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { EstadoOrden, Orden } from '../../models/orden.model';
@Component({selector:'app-orden-list',imports:[RouterLink,ReactiveFormsModule,CurrencyPipe,DatePipe,SiPermiso],templateUrl:'./orden-list.html'})
export class OrdenList implements OnInit {
  private readonly api=inject(OrdenService); private readonly fb=inject(NonNullableFormBuilder);
  private readonly destroyRef=inject(DestroyRef); private solicitud?:Subscription;
  protected readonly datos=signal<Orden[]>([]); protected readonly cargando=signal(true);
  protected readonly error=signal<string|null>(null);
  protected readonly form=this.fb.group({placa:[''],estado:this.fb.control<EstadoOrden|''>(''),desde:[''],hasta:['']});
  ngOnInit():void {this.cargar();}
  cargar():void {
    this.solicitud?.unsubscribe();this.cargando.set(true);this.error.set(null);
    this.solicitud=this.api.listar(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:r=>{this.datos.set(r);this.cargando.set(false);},error:(e:HttpErrorResponse)=>{this.error.set(mensajeError(e));this.cargando.set(false);}
    });
  }
  limpiar():void {this.form.reset();this.cargar();}
}
