import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { authGuard, invitadoGuard } from './auth-guard';
import { permisoGuard } from './permiso-guard';

describe('Guards de seguridad', () => {
  const auth = {
    autenticado: vi.fn(),
    tienePermiso: vi.fn(),
  };

  beforeEach(() => {
    auth.autenticado.mockReset();
    auth.tienePermiso.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  it('recuerda la página solicitada al enviar a un invitado al login', () => {
    auth.autenticado.mockReturnValue(false);
    const router = TestBed.inject(Router);
    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/ordenes' } as RouterStateSnapshot));
    expect(router.serializeUrl(resultado as ReturnType<Router['createUrlTree']>))
      .toBe('/login?returnUrl=%2Fordenes');
  });

  it('redirige al inicio a quien ya inició sesión y abre el login como invitado', () => {
    const router = TestBed.inject(Router);
    auth.autenticado.mockReturnValue(true);
    const resultado = TestBed.runInInjectionContext(() =>
      invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(router.serializeUrl(resultado as ReturnType<Router['createUrlTree']>)).toBe('/inicio');

    auth.autenticado.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() =>
      invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot))).toBe(true);
  });

  it('niega una ruta si falta el permiso declarado', () => {
    const router = TestBed.inject(Router);
    auth.tienePermiso.mockReturnValue(false);
    const ruta = { data: { permiso: 'SERVICIO_ESCRIBIR' } } as unknown as ActivatedRouteSnapshot;
    const resultado = TestBed.runInInjectionContext(() =>
      permisoGuard(ruta, {} as RouterStateSnapshot));
    expect(router.serializeUrl(resultado as ReturnType<Router['createUrlTree']>))
      .toBe('/acceso-denegado');
  });
});
