import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { IngresoPorServicio } from '../../features/reportes/models/reporte.model';
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  ingresos(desde = '', hasta = '') {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<IngresoPorServicio[]>(
      `${environment.apiUrl}/reportes/ingresos-por-servicio`,
      { params },
    );
  }
}
