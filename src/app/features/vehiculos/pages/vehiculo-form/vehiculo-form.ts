import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { VehiculoService } from '../../../../core/services/vehiculo-service';
import { ClienteService } from '../../../../core/services/cliente-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { Cliente } from '../../../clientes/models/cliente.model';
import { VehiculoRequest } from '../../models/vehiculo.model';
@Component({
  selector: 'app-vehiculo-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './vehiculo-form.html',
})
export class VehiculoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(VehiculoService);
  private readonly clientesApi = inject(ClienteService);
  private readonly router = inject(Router);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = input<string>();
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{3}$/)]],
    marca: ['', [Validators.required, Validators.maxLength(40)]],
    modelo: ['', [Validators.required, Validators.maxLength(40)]],
    anio: [
      2026,
      [
        Validators.required,
        Validators.min(1990),
        Validators.max(2027),
        Validators.pattern(/^\d+$/),
      ],
    ],
    clienteId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  ngOnInit(): void {
    this.cargar();
  }
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      clientes: this.clientesApi.listar(),
      vehiculo: this.id() ? this.api.obtener(Number(this.id())) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ clientes, vehiculo: v }) => {
          this.clientes.set(clientes);
          if (v)
            this.form.setValue({
              placa: v.placa,
              marca: v.marca,
              modelo: v.modelo,
              anio: v.anio,
              clienteId: v.clienteId,
            });
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }
  guardar(): void {
    for (const key of ['placa', 'marca', 'modelo'] as const)
      this.form.controls[key].setValue(this.form.controls[key].value.trim());
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.errores.set({});
    const v = this.form.getRawValue();
    const dto: VehiculoRequest = { ...v, clienteId: Number(v.clienteId) };
    const peticion = this.id() ? this.api.actualizar(Number(this.id()), dto) : this.api.crear(dto);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.avisos.mostrar('Vehículo guardado correctamente.');
        void this.router.navigate(['/vehiculos']);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e));
        this.errores.set(erroresDeValidacion(e));
      },
    });
  }
}
