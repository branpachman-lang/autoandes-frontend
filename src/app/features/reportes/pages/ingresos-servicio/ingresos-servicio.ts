import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ReporteService } from '../../../../core/services/reporte-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { IngresoPorServicio } from '../../models/reporte.model';
@Component({
  selector: 'app-ingresos-servicio',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './ingresos-servicio.html',
  styleUrl: './ingresos-servicio.css',
})
export class IngresosServicio implements OnInit {
  private readonly api = inject(ReporteService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private solicitud?: Subscription;
  protected readonly datos = signal<IngresoPorServicio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({ desde: [''], hasta: [''] });
  protected readonly total = computed(() => this.datos().reduce((s, r) => s + r.importeTotal, 0));
  protected readonly cantidad = computed(() =>
    this.datos().reduce((s, r) => s + r.cantidadTotal, 0),
  );
  ngOnInit(): void {
    this.cargar();
  }
  cargar(): void {
    this.solicitud?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    const f = this.form.getRawValue();
    this.solicitud = this.api
      .ingresos(f.desde, f.hasta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.datos.set(r);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }
  limpiar(): void {
    this.form.reset();
    this.cargar();
  }
}
