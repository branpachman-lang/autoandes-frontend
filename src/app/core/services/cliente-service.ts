import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { Cliente } from '../../features/clientes/models/cliente.model';
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  listar() { return this.http.get<Cliente[]>(`${environment.apiUrl}/clientes`); }
}
