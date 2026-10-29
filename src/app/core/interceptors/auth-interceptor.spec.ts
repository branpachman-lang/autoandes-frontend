import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import { authInterceptor } from './auth-interceptor';
import { errorInterceptor } from './error-interceptor';
import { HttpClient } from '@angular/common/http';

describe('Interceptores de seguridad', () => {
  const cerrarSesion = vi.fn();
  beforeEach(() => {
    cerrarSesion.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: () => 'jwt-de-prueba', cerrarSesion } },
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('envía Bearer solo hacia la API', () => {
    const http = TestBed.inject(HttpClient);
    const peticiones = TestBed.inject(HttpTestingController);
    http.get(`${environment.apiUrl}/servicios`).subscribe();
    http.get('https://otro-ejemplo.test/recurso').subscribe();
    const api = peticiones.expectOne(`${environment.apiUrl}/servicios`);
    const externa = peticiones.expectOne('https://otro-ejemplo.test/recurso');
    expect(api.request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');
    expect(externa.request.headers.has('Authorization')).toBe(false);
    api.flush([]);
    externa.flush({});
  });

  it('cierra la sesión con 401 de la API, pero no con 403 ni con 401 del login', () => {
    const http = TestBed.inject(HttpClient);
    const peticiones = TestBed.inject(HttpTestingController);
    http.get(`${environment.apiUrl}/servicios`).subscribe({ error: () => {} });
    peticiones.expectOne(`${environment.apiUrl}/servicios`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(cerrarSesion).not.toHaveBeenCalled();

    http.get('https://otro-ejemplo.test/recurso').subscribe({ error: () => {} });
    peticiones.expectOne('https://otro-ejemplo.test/recurso').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(cerrarSesion).not.toHaveBeenCalled();

    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => {} });
    const login = peticiones.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(cerrarSesion).not.toHaveBeenCalled();

    http.get(`${environment.apiUrl}/servicios`).subscribe({ error: () => {} });
    peticiones.expectOne(`${environment.apiUrl}/servicios`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(cerrarSesion).toHaveBeenCalledOnce();
  });
});
