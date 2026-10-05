import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ProveedorApi {
  idProveedor: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ruc: string | null;
}

export type NuevoProveedor = ProveedorApi;

@Injectable({
  providedIn: 'root',
})
export class ProveedoresService {
  private readonly api = inject(ApiService);

  listar(): Observable<ProveedorApi[]> {
    return this.api.get<ProveedorApi[]>('/proveedores');
  }

  crear(proveedor: NuevoProveedor): Observable<unknown> {
    return this.api.post('/proveedores', proveedor);
  }

}
