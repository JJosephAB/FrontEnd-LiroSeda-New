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
  readonly enviando = signal(false);

  alternarClave(): void {
    this.mostrarClave.update(valor => !valor);
  }

  acceder(usuario: string, clave: string): void {
    this.errorLogin.set('');
    this.enviando.set(true);

    this.authService.iniciarSesion(usuario, clave).subscribe({
      next: () => {
        void this.router.navigateByUrl('/resumen', {
          replaceUrl: true,
        });
      },
      error: (error: unknown) => {
        this.errorLogin.set(
          error instanceof Error
            ? error.message
            : 'No se pudo iniciar sesión. Revisa tus credenciales.',
        );
        this.enviando.set(false);
      },
      complete: () => this.enviando.set(false),
    });
  }
}