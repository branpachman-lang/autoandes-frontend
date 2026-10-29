import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { OrdenForm } from './orden-form';
import { environment } from '../../../../../environments/environment';

describe('Registro de órdenes', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrdenForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function preparar() {
    const fixture = TestBed.createComponent(OrdenForm);
    fixture.detectChanges();
    http
      .expectOne(`${environment.apiUrl}/vehiculos`)
      .flush([
        {
          id: 1,
          placa: 'AAA-111',
          marca: 'Toyota',
          modelo: 'Yaris',
          anio: 2024,
          clienteId: 1,
          clienteNombre: 'Cliente de prueba',
        },
      ]);
    http.expectOne(`${environment.apiUrl}/servicios`).flush([
      {
        id: 1,
        codigo: 'SRV-001',
        nombre: 'Servicio activo',
        precio: 120,
        duracionMin: 45,
        activo: true,
      },
      {
        id: 8,
        codigo: 'SRV-008',
        nombre: 'Servicio inactivo',
        precio: 50,
        duracionMin: 30,
        activo: false,
      },
    ]);
    const componente = fixture.componentInstance as any;
    componente.form.patchValue({ vehiculoId: 1, kilometraje: 46000 });
    componente.detalles.at(0).setValue({ servicioId: 1, cantidad: 2 });
    fixture.detectChanges();
    return { fixture, componente };
  }
  it('muestra el total y envía solo identificadores, kilometraje y cantidades', () => {
    const { fixture, componente } = preparar();
    expect(componente.total()).toBe(240);
    expect(componente.disponibles().map((s: any) => s.id)).toEqual([1]);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    componente.guardar();
    const r = http.expectOne(`${environment.apiUrl}/ordenes`);
    expect(r.request.body).toEqual({
      vehiculoId: 1,
      kilometraje: 46000,
      detalles: [{ servicioId: 1, cantidad: 2 }],
    });
    r.flush({ id: 9, numero: 'OS-000009' });
    fixture.destroy();
  });
  it('conserva el detalle y muestra el mensaje del backend cuando recibe 409', () => {
    const { fixture, componente } = preparar();
    componente.guardar();
    http
      .expectOne(`${environment.apiUrl}/ordenes`)
      .flush(
        { mensaje: 'El último kilometraje registrado es 47000' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(componente.guardando()).toBe(false);
    expect(componente.detalles.getRawValue()).toEqual([{ servicioId: 1, cantidad: 2 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('47000');
    fixture.destroy();
  });
  it('rechaza servicios repetidos y cantidades fuera de rango antes de enviar', () => {
    const { fixture, componente } = preparar();
    componente.agregar();
    componente.detalles.at(1).setValue({ servicioId: 1, cantidad: 1 });
    expect(componente.repetidos()).toBe(true);
    componente.guardar();
    http.expectNone(`${environment.apiUrl}/ordenes`);
    componente.quitar(1);
    componente.detalles.at(0).controls.cantidad.setValue(6);
    componente.guardar();
    http.expectNone(`${environment.apiUrl}/ordenes`);
    fixture.destroy();
  });
});
