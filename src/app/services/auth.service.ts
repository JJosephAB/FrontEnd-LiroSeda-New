import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable, catchError, map, throwError } from 'rxjs';

interface LoginResponse {
  token: string;
  tipo: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly claveSesion = 'lirio-seda-token';

  private readonly tokenSesion = signal(
    sessionStorage.getItem(this.claveSesion),
  );

  readonly estaAutenticado = () => this.tokenSesion() !== null;

  iniciarSesion(correo: string, clave: string): Observable<void> {
    return this.api
      .post<LoginResponse>('/auth/login', {
        correo: correo.trim(),
        clave,
      })
      .pipe(
        map(respuesta => {
          if (!respuesta.token) {
            throw new Error('La respuesta de autenticación no contiene un token.');
          }

          sessionStorage.setItem(this.claveSesion, respuesta.token);
          this.tokenSesion.set(respuesta.token);
        }),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 0) {
            return throwError(
              () => new Error('No se pudo conectar con el servidor. Verifica que el backend esté activo.'),
            );
          }
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return throwError(
              () => new Error('Correo o contraseña incorrectos.'),
            );
          }
          return throwError(() => error);
        }),
      );
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.claveSesion);
    this.tokenSesion.set(null);
  }
}