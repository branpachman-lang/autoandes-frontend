import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdenService } from '../../../../core/services/orden-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { Orden } from '../../models/orden.model';
@Component({selector:'app-orden-detalle',imports:[RouterLink,CurrencyPipe,DatePipe,ReactiveFormsModule,SiPermiso,FieldError],templateUrl:'./orden-detalle.html',styleUrl:'./orden-detalle.css'})
export class OrdenDetalle implements OnInit {
  private readonly api=inject(OrdenService); private readonly fb=inject(NonNullableFormBuilder);
  private readonly avisos=inject(NotificacionService); private readonly destroyRef=inject(DestroyRef);
  readonly id=input.required<string>();readonly nueva=input<string>();
  protected readonly orden=signal<Orden|null>(null);protected readonly cargando=signal(true);
  protected readonly error=signal<string|null>(null);protected readonly modal=signal(false);
  protected readonly anulando=signal(false);protected readonly errorAnulacion=signal<string|null>(null);
  protected readonly errores=signal<Record<string,string>>({});
  protected readonly form=this.fb.group({motivo:['',[Validators.required,Validators.minLength(10),Validators.maxLength(200)]]});
  ngOnInit():void {this.cargar();}
  cargar():void {
    this.cargando.set(true);this.error.set(null);
    this.api.obtener(Number(this.id())).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:o=>{this.orden.set(o);this.cargando.set(false);},error:(e:HttpErrorResponse)=>{this.error.set(mensajeError(e));this.cargando.set(false);}
    });
  }
  abrirAnulacion():void {this.form.reset();this.errorAnulacion.set(null);this.errores.set({});this.modal.set(true);}
  anular():void {
    this.form.controls.motivo.setValue(this.form.controls.motivo.value.trim());
    if(this.form.invalid || this.anulando()) {this.form.markAllAsTouched();return;}
    this.anulando.set(true);this.errorAnulacion.set(null);this.errores.set({});
    this.api.anular(Number(this.id()),this.form.controls.motivo.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:o=>{this.orden.set(o);this.anulando.set(false);this.modal.set(false);this.avisos.mostrar(`Orden ${o.numero} anulada.`);},
      error:(e:HttpErrorResponse)=>{this.anulando.set(false);this.errorAnulacion.set(mensajeError(e));this.errores.set(erroresDeValidacion(e));}
    });
  }
}
