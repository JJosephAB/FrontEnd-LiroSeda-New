import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface UsuarioApi {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  idSede: number;
  telefono?: string | null;
  documento?: string | null;
  fechaCreacion?: string | null;
  idRol?: number | null;
  activo?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly api = inject(ApiService);

  usuarioActual(): Observable<UsuarioApi> {
    return this.api.get<UsuarioApi>('/usuarios/me');
  }
}
