import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  template: `
    <section class="acceso-denegado">
      <span class="codigo">403</span>
      <h2>Acceso denegado</h2>
      <p>Su usuario no tiene permiso para abrir esta página. Si lo necesita, solicítelo al administrador.</p>
      <a routerLink="/inicio">Volver al inicio</a>
    </section>
  `,
  styles: [`
    .acceso-denegado { max-width: 580px; margin: 40px auto; padding: 36px; border: 1px solid #dbe4f0;
      border-radius: 16px; background: #fff; box-shadow: 0 12px 30px #0f2e5c12; }
    .codigo { color: #b42318; font-size: 14px; font-weight: 800; letter-spacing: .12em; }
    h2 { margin: 8px 0 12px; }
    p { margin: 0 0 24px; color: #475569; line-height: 1.5; }
    a { display: inline-block; padding: 10px 16px; border-radius: 8px; background: #0f2e5c;
      color: #fff; text-decoration: none; }
  `],
})
export class AccesoDenegado {}
