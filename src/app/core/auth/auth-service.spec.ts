import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('guarda el token, los permisos y el vencimiento devueltos por el login', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const antes = Date.now();

    auth.login({ username: 'asesor', password: 'clave' }).subscribe();
    const peticion = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush({
      token: 'jwt-de-prueba', tipo: 'Bearer', expiraEnSegundos: 3600,
      username: 'asesor', nombreCompleto: 'Asesor de prueba',
      roles: ['ASESOR'], permisos: ['SERVICIO_LEER', 'ORDEN_LEER'],
    });

    expect(auth.token()).toBe('jwt-de-prueba');
    expect(auth.tienePermiso('ORDEN_LEER')).toBe(true);
    expect(auth.tienePermiso('SERVICIO_ESCRIBIR')).toBe(false);
    const guardada = JSON.parse(sessionStorage.getItem('autoandes.sesion')!);
    expect(guardada.expiraEn).toBeGreaterThanOrEqual(antes + 3_600_000);
    expect(guardada.permisos).toEqual(['SERVICIO_LEER', 'ORDEN_LEER']);
  });

  it('descarta una sesión vencida al recuperar el jefeamiento', () => {
    sessionStorage.setItem('autoandes.sesion', JSON.stringify({
      token: 'vencido', expiraEn: Date.now() - 1000,
      username: 'asesor', nombreCompleto: 'Prueba',
      roles: ['ASESOR'], permisos: ['ORDEN_LEER'],
    }));
    const auth = TestBed.inject(AuthService);
    expect(auth.autenticado()).toBe(false);
    expect(sessionStorage.getItem('autoandes.sesion')).toBeNull();
  });

  it('recupera una sesión vigente tras una recarga', () => {
    sessionStorage.setItem('autoandes.sesion', JSON.stringify({
      token: 'vigente', expiraEn: Date.now() + 60_000,
      username: 'jefe', nombreCompleto: 'Jefe de taller de prueba',
      roles: ['JEFE_TALLER'], permisos: ['SERVICIO_LEER', 'SERVICIO_ESCRIBIR'],
    }));
    const auth = TestBed.inject(AuthService);
    expect(auth.autenticado()).toBe(true);
    expect(auth.token()).toBe('vigente');
    expect(auth.tienePermiso('SERVICIO_ESCRIBIR')).toBe(true);
  });

  it('descarta datos de sesión dañados aunque no hayan vencido', () => {
    sessionStorage.setItem('autoandes.sesion', JSON.stringify({
      token: 42, expiraEn: Date.now() + 60_000,
      username: 'admin', nombreCompleto: 'Prueba', roles: ['ADMIN'], permisos: [],
    }));
    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect(sessionStorage.getItem('autoandes.sesion')).toBeNull();
  });

  it('avisa cuando restan dos minutos y detiene la cuenta al cerrar sesión', () => {
    vi.useFakeTimers();
    try {
      const auth = TestBed.inject(AuthService);
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const http = TestBed.inject(HttpTestingController);
      auth.login({ username: 'admin', password: 'clave' }).subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush({
        token: 'jwt-de-prueba', tipo: 'Bearer', expiraEnSegundos: 180,
        username: 'admin', nombreCompleto: 'Administradora',
        roles: ['ADMIN'], permisos: ['SERVICIO_LEER'],
      });

      expect(auth.segundosRestantes()).toBe(180);
      expect(auth.porVencer()).toBe(false);
      vi.advanceTimersByTime(60_000);
      expect(auth.segundosRestantes()).toBe(120);
      expect(auth.porVencer()).toBe(true);

      auth.ocultarAviso();
      expect(auth.avisoOculto()).toBe(true);
      auth.cerrarSesion();
      expect(auth.segundosRestantes()).toBe(0);
      expect(sessionStorage.getItem('autoandes.avisoOculto')).toBeNull();
      vi.advanceTimersByTime(60_000);
      expect(auth.segundosRestantes()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('consulta Mi cuenta en el endpoint protegido del backend', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    let nombre = '';
    auth.obtenerPerfil().subscribe(perfil => nombre = perfil.nombreCompleto);
    const peticion = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({
      id: 1, username: 'admin',
      nombreCompleto: 'Rosa Elena Mendoza Ticona',
      roles: ['ADMIN'], permisos: ['SERVICIO_LEER'],
      activo: true,
    });
    expect(nombre).toBe('Rosa Elena Mendoza Ticona');
  });
});
