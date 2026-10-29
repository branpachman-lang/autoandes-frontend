import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { FiltroOrdenes, Orden, OrdenRequest } from '../../features/ordenes/models/orden.model';
@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ordenes`;
  listar(filtro?: Partial<FiltroOrdenes>) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filtro ?? {})) if (value) params = params.set(key, value);
    return this.http.get<Orden[]>(this.url, { params });
  }
  obtener(id: number) { return this.http.get<Orden>(`${this.url}/${id}`); }
  registrar(dto: OrdenRequest) { return this.http.post<Orden>(this.url, dto); }
  anular(id: number, motivo: string) { return this.http.patch<Orden>(`${this.url}/${id}/anular`, { motivo }); }
}
