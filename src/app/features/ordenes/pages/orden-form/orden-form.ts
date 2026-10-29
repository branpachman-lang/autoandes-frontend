import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrdenService } from '../../../../core/services/orden-service';
import { ServicioService } from '../../../../core/services/servicio-service';
import { VehiculoService } from '../../../../core/services/vehiculo-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { Servicio } from '../../../servicios/models/servicio.model';
import { Vehiculo } from '../../../vehiculos/models/vehiculo.model';
import { OrdenRequest } from '../../models/orden.model';
interface LineaForm { servicioId:FormControl<number|null>; cantidad:FormControl<number>; }
@Component({selector:'app-orden-form',imports:[ReactiveFormsModule,RouterLink,CurrencyPipe,FieldError],templateUrl:'./orden-form.html',styleUrl:'./orden-form.css'})
export class OrdenForm implements OnInit {
  private readonly fb=inject(NonNullableFormBuilder); private readonly api=inject(OrdenService);
  private readonly serviciosApi=inject(ServicioService); private readonly vehiculosApi=inject(VehiculoService);
  private readonly router=inject(Router); private readonly avisos=inject(NotificacionService);
  private readonly destroyRef=inject(DestroyRef);
  protected readonly vehiculos=signal<Vehiculo[]>([]); protected readonly servicios=signal<Servicio[]>([]);
  protected readonly cargando=signal(true); protected readonly guardando=signal(false);
  protected readonly error=signal<string|null>(null); protected readonly errorCarga=signal<string|null>(null);
  protected readonly errores=signal<Record<string,string>>({});
  protected readonly form=this.fb.group({
    vehiculoId:this.fb.control<number|null>(null,Validators.required),
    kilometraje:this.fb.control<number|null>(null,[Validators.required,Validators.min(0),Validators.max(9999999),Validators.pattern(/^\d+$/)]),
    detalles:this.fb.array<FormGroup<LineaForm>>([],[Validators.minLength(1),Validators.maxLength(10),Validators.required])
  });
  private readonly valor=toSignal(this.form.valueChanges,{initialValue:this.form.value});
  protected readonly disponibles=computed(()=>this.servicios().filter(s=>s.activo));
  protected readonly lineas=computed(()=>(this.valor().detalles??[]).map(d=>{
    const s=this.servicios().find(s=>s.id===d.servicioId); const precio=s?.precio??0;
    return {precio,subtotal:Math.round(precio*(Number(d.cantidad)||0)*100)/100};
  }));
  protected readonly total=computed(()=>Math.round(this.lineas().reduce((s,d)=>s+d.subtotal,0)*100)/100);
  protected readonly repetidos=computed(()=>{
    const ids=(this.valor().detalles??[]).map(d=>d.servicioId).filter(id=>id!=null); return new Set(ids).size!==ids.length;
  });
  get detalles(){return this.form.controls.detalles;}
  ngOnInit():void {this.cargar();this.agregar();}
  cargar():void {
    this.cargando.set(true);this.errorCarga.set(null);
    forkJoin({vehiculos:this.vehiculosApi.listar(),servicios:this.serviciosApi.listar()}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:r=>{this.vehiculos.set(r.vehiculos);this.servicios.set(r.servicios);this.cargando.set(false);},
      error:(e:HttpErrorResponse)=>{this.errorCarga.set(mensajeError(e));this.cargando.set(false);}
    });
  }
  agregar():void {
    if(this.detalles.length>=10 || this.guardando())return;
    this.detalles.push(this.fb.group({servicioId:this.fb.control<number|null>(null,Validators.required),cantidad:this.fb.control(1,[Validators.required,Validators.min(1),Validators.max(5),Validators.pattern(/^\d+$/)])}));
  }
  quitar(i:number):void {if(!this.guardando())this.detalles.removeAt(i);}
  usado(id:number,indice:number):boolean {return this.detalles.controls.some((d,i)=>i!==indice&&d.controls.servicioId.value===id);}
  guardar():void {
    if(this.form.invalid || this.repetidos() || this.guardando()) {this.form.markAllAsTouched();return;}
    const r=this.form.getRawValue(); const dto:OrdenRequest={vehiculoId:Number(r.vehiculoId),kilometraje:Number(r.kilometraje),detalles:r.detalles.map(d=>({servicioId:Number(d.servicioId),cantidad:Number(d.cantidad)}))};
    this.guardando.set(true);this.error.set(null);this.errores.set({});
    this.api.registrar(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:o=>{this.avisos.mostrar(`Orden ${o.numero} registrada correctamente.`);void this.router.navigate(['/ordenes',o.id],{queryParams:{nueva:'1'}});},
      error:(e:HttpErrorResponse)=>{this.guardando.set(false);this.error.set(mensajeError(e));this.errores.set(erroresDeValidacion(e));}
    });
  }
}
