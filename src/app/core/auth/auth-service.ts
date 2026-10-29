import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, PerfilUsuario, Permiso, Sesion } from './auth.model';

const CLAVE_SESION = 'autoandes.sesion';
const CLAVE_AVISO_OCULTO = 'autoandes.avisoOculto';

/** Fuente única de la sesión para las vistas, guards e interceptores. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly url = `${environment.apiUrl}/auth`;
  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private intervalo?: ReturnType<typeof setInterval>;

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);
  readonly segundosRestantes = signal(0);
  readonly porVencer = computed(
    () => this.autenticado() && this.segundosRestantes() > 0 && this.segundosRestantes() <= 120,
  );
  readonly avisoOculto = signal(false);

  constructor() {
    const sesion = this.sesionActual();
    if (sesion) {
      this.avisoOculto.set(sessionStorage.getItem(CLAVE_AVISO_OCULTO) === String(sesion.expiraEn));
      this.programarExpiracion(sesion);
    }
    this.destroyRef.onDestroy(() => this.detenerTemporizadores());
  }

  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      map((respuesta) => ({
        token: respuesta.token,
        expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
        username: respuesta.username,
        nombreCompleto: respuesta.nombreCompleto,
        roles: respuesta.roles,
        permisos: respuesta.permisos,
      })),
      tap((sesion) => this.iniciar(sesion)),
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.detenerTemporizadores();
    sessionStorage.removeItem(CLAVE_SESION);
    sessionStorage.removeItem(CLAVE_AVISO_OCULTO);
    this.sesionActual.set(null);
    this.segundosRestantes.set(0);
    this.avisoOculto.set(false);

    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    if (volverA && volverA !== '/login') queryParams['returnUrl'] = volverA;
    void this.router.navigate(['/login'], { queryParams });
  }

  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  tienePermiso(permiso: Permiso): boolean {
    return this.sesionActual()?.permisos.includes(permiso) ?? false;
  }

  obtenerPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.url}/me`);
  }

  ocultarAviso(): void {
    const sesion = this.sesionActual();
    if (!sesion) return;
    this.avisoOculto.set(true);
    sessionStorage.setItem(CLAVE_AVISO_OCULTO, String(sesion.expiraEn));
  }

  private iniciar(sesion: Sesion): void {
    sessionStorage.removeItem(CLAVE_AVISO_OCULTO);
    this.avisoOculto.set(false);
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionActual.set(sesion);
    this.programarExpiracion(sesion);
  }

  private programarExpiracion(sesion: Sesion): void {
    this.detenerTemporizadores();
    const restante = sesion.expiraEn - Date.now();
    this.segundosRestantes.set(Math.max(0, Math.ceil(restante / 1000)));
    this.temporizador = setTimeout(
      () => {
        if (this.sesionActual()) this.cerrarSesion('expirada', this.router.url);
      },
      Math.max(restante, 0),
    );
    this.intervalo = setInterval(() => {
      const segundos = Math.max(0, Math.ceil((sesion.expiraEn - Date.now()) / 1000));
      this.segundosRestantes.set(segundos);
      if (segundos === 0 && this.sesionActual()) this.cerrarSesion('expirada', this.router.url);
    }, 1000);
  }

  private detenerTemporizadores(): void {
    clearTimeout(this.temporizador);
    clearInterval(this.intervalo);
    this.temporizador = undefined;
    this.intervalo = undefined;
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion: Sesion = JSON.parse(texto);
      if (
        typeof sesion.token !== 'string' ||
        !sesion.token ||
        typeof sesion.username !== 'string' ||
        typeof sesion.nombreCompleto !== 'string' ||
        !Number.isFinite(sesion.expiraEn) ||
        Date.now() >= sesion.expiraEn ||
        !Array.isArray(sesion.roles) ||
        !sesion.roles.every((rol) => typeof rol === 'string') ||
        !Array.isArray(sesion.permisos) ||
        !sesion.permisos.every((permiso) => typeof permiso === 'string')
      ) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}
