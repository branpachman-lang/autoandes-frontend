import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente-service';
import { VehiculoService } from '../../../../core/services/vehiculo-service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Cliente } from '../../../clientes/models/cliente.model';
import { Vehiculo } from '../../models/vehiculo.model';
@Component({
  selector: 'app-vehiculo-list',
  imports: [RouterLink, SiPermiso],
  templateUrl: './vehiculo-list.html',
})
export class VehiculoList implements OnInit {
  private readonly api = inject(VehiculoService);
  private readonly clientesApi = inject(ClienteService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly datos = signal<Vehiculo[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly clienteId = signal('');
  protected readonly pendiente = signal<Vehiculo | null>(null);
  protected readonly eliminando = signal(false);
  protected readonly filtrados = computed(() =>
    this.datos().filter((v) =>
      `${v.placa} ${v.marca} ${v.modelo} ${v.clienteNombre}`
        .toLocaleLowerCase()
        .includes(this.filtro().trim().toLocaleLowerCase()),
    ),
  );
  ngOnInit(): void {
    this.clientesApi
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.clientes.set(r),
        error: (e: HttpErrorResponse) => this.error.set(mensajeError(e)),
      });
    this.cargar();
  }
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api
      .listar(this.clienteId() ? Number(this.clienteId()) : undefined)
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
  filtrarCliente(valor: string): void {
    this.clienteId.set(valor);
    this.cargar();
  }
  eliminar(): void {
    const v = this.pendiente();
    if (!v || this.eliminando()) return;
    this.eliminando.set(true);
    this.api
      .eliminar(v.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendiente.set(null);
          this.eliminando.set(false);
          this.avisos.mostrar('Vehículo eliminado correctamente.');
          this.cargar();
        },
        error: (e: HttpErrorResponse) => {
          this.pendiente.set(null);
          this.eliminando.set(false);
          this.error.set(mensajeError(e));
        },
      });
  }
}
