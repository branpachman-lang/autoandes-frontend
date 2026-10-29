import { Injectable, signal } from '@angular/core';

export interface Notificacion {
  texto: string;
  tipo: 'exito' | 'error';
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  readonly actual = signal<Notificacion | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  mostrar(texto: string, tipo: Notificacion['tipo'] = 'exito'): void {
    clearTimeout(this.temporizador);
    this.actual.set({ texto, tipo });
    this.temporizador = setTimeout(() => this.actual.set(null), 3000);
  }

  cerrar(): void {
    clearTimeout(this.temporizador);
    this.actual.set(null);
  }
}
