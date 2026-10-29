import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { Servicio, ServicioRequest } from '../../features/servicios/models/servicio.model';
@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/servicios`;
  listar() { return this.http.get<Servicio[]>(this.url); }
  obtener(id: number) { return this.http.get<Servicio>(`${this.url}/${id}`); }
  crear(dto: ServicioRequest) { return this.http.post<Servicio>(this.url, dto); }
  actualizar(id: number, dto: ServicioRequest) { return this.http.put<Servicio>(`${this.url}/${id}`, dto); }
  eliminar(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
  cambiarEstado(id: number, activo: boolean) { return this.http.patch<Servicio>(`${this.url}/${id}/estado`, { activo }); }
}
