import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ServicioService } from '../../../../core/services/servicio-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Servicio } from '../../models/servicio.model';
@Component({
  selector: 'app-servicio-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso],
  templateUrl: './servicio-list.html',
})
export class ServicioList implements OnInit {
  private readonly api = inject(ServicioService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly datos = signal<Servicio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly estado = signal('todos');
  protected readonly pendiente = signal<{
    servicio: Servicio;
    accion: 'eliminar' | 'estado';
  } | null>(null);
  protected readonly guardando = signal(false);
  protected readonly filtrados = computed(() =>
    this.datos().filter(
      (s) =>
        `${s.codigo} ${s.nombre}`
          .toLocaleLowerCase()
          .includes(this.filtro().trim().toLocaleLowerCase()) &&
        (this.estado() === 'todos' || s.activo === (this.estado() === 'activos')),
    ),
  );
  ngOnInit(): void {
    this.cargar();
  }
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api
      .listar()
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
  confirmar(): void {
    const p = this.pendiente();
    if (!p || this.guardando()) return;
    this.guardando.set(true);
    const peticion: Observable<unknown> =
      p.accion === 'eliminar'
        ? this.api.eliminar(p.servicio.id)
        : this.api.cambiarEstado(p.servicio.id, !p.servicio.activo);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pendiente.set(null);
        this.guardando.set(false);
        this.avisos.mostrar('Servicio actualizado correctamente.');
        this.cargar();
      },
      error: (e: HttpErrorResponse) => {
        this.pendiente.set(null);
        this.guardando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
