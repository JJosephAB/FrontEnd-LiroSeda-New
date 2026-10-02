import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mostrarClave = signal(false);
  readonly errorLogin = signal('');

  alternarClave(): void {
    this.mostrarClave.update(valor => !valor);
  }

  acceder(usuario: string, clave: string): void {
    this.errorLogin.set('');

    const accesoValido = this.authService.iniciarSesion(
      usuario,
      clave,
    );

    if (!accesoValido) {
      this.errorLogin.set('Usuario o contraseña incorrectos.');
      return;
    }

    void this.router.navigateByUrl('/resumen', {
      replaceUrl: true,
    });
  }
}