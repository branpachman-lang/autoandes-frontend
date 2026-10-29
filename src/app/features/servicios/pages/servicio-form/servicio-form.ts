import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServicioService } from '../../../../core/services/servicio-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { FieldError } from '../../../../shared/components/field-error/field-error';
@Component({ selector:'app-servicio-form', imports:[ReactiveFormsModule,RouterLink,FieldError], templateUrl:'./servicio-form.html' })
export class ServicioForm implements OnInit {
  private readonly fb=inject(NonNullableFormBuilder);
  private readonly api=inject(ServicioService);
  private readonly router=inject(Router);
  private readonly avisos=inject(NotificacionService);
  private readonly destroyRef=inject(DestroyRef);
  readonly id=input<string>();
  protected readonly cargando=signal(false);
  protected readonly guardando=signal(false);
  protected readonly error=signal<string|null>(null);
  protected readonly errores=signal<Record<string,string>>({});
  protected readonly form=this.fb.group({
    codigo:['',[Validators.required,Validators.pattern(/^SRV-\d{3}$/)]],
    nombre:['',[Validators.required,Validators.minLength(3),Validators.maxLength(80)]],
    precio:[0,[Validators.required,Validators.min(0.01),Validators.max(99999999.99),Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    duracionMin:[30,[Validators.required,Validators.min(15),Validators.max(480),Validators.pattern(/^\d+$/)]], activo:[true]
  });
  ngOnInit(): void {
    if(!this.id()) return;
    this.cargando.set(true);
    this.api.obtener(Number(this.id())).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:s=>{ this.form.setValue({codigo:s.codigo,nombre:s.nombre,precio:s.precio,duracionMin:s.duracionMin,activo:s.activo}); this.cargando.set(false); },
      error:(e:HttpErrorResponse)=>{ this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
  guardar(): void {
    this.form.controls.nombre.setValue(this.form.controls.nombre.value.trim());
    if(this.form.invalid || this.guardando()) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true); this.error.set(null); this.errores.set({});
    const r=this.form.getRawValue(); const peticion=this.id() ? this.api.actualizar(Number(this.id()),r) : this.api.crear(r);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{ this.avisos.mostrar('Servicio guardado correctamente.'); void this.router.navigate(['/servicios']); },
      error:(e:HttpErrorResponse)=>{ this.guardando.set(false); this.error.set(mensajeError(e)); this.errores.set(erroresDeValidacion(e)); }
    });
  }
}
