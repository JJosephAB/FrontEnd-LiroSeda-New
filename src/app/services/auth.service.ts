import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly claveSesion = 'lirio-demo-sesion';

  private readonly sesionActiva = signal(
    sessionStorage.getItem(this.claveSesion) === 'activa',
  );

  readonly estaAutenticado = this.sesionActiva.asReadonly();

  iniciarSesion(usuario: string, clave: string): boolean {
    const credencialesValidas =
      usuario.trim() === 'admin' && clave === 'admin';

    if (!credencialesValidas) {
      return false;
    }

    sessionStorage.setItem(this.claveSesion, 'activa');
    this.sesionActiva.set(true);

    return true;
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.claveSesion);
    this.sesionActiva.set(false);
  }
}