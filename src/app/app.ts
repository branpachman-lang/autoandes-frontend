import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionService } from './core/services/notificacion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />
    @if (notificacion.actual(); as aviso) {
      <div class="notificacion" [class.notificacion-error]="aviso.tipo === 'error'"
        [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'" [attr.aria-live]="aviso.tipo === 'error' ? 'assertive' : 'polite'">
        <span class="notificacion-icono" aria-hidden="true">{{ aviso.tipo === 'exito' ? '✓' : '!' }}</span>
        <span>{{ aviso.texto }}</span>
        <button type="button" aria-label="Cerrar mensaje" (click)="notificacion.cerrar()">×</button>
      </div>
    }`,
})
export class App {
  protected readonly notificacion = inject(NotificacionService);
}
