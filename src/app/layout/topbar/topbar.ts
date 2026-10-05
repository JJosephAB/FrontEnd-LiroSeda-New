import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UsuarioApi, UsuariosService } from '../../services/usuarios.service';

@Component({
  imports: [],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly usuario = signal<UsuarioApi | null>(null);
  readonly errorPerfil = signal('');
  readonly cargandoPerfil = signal(true);

  readonly seccionActual = toSignal(
    this.router.events.pipe(
      filter(evento => evento instanceof NavigationEnd),
      startWith(null),
      map(() => this.obtenerSeccion()),
    ),
    { initialValue: 'Resumen' },
  );

  private obtenerSeccion(): string {
    let ruta = this.router.routerState.snapshot.root;

    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }

    return ruta.title?.split(' · ')[0] ?? 'Mi boutique';
  }

  get nombreCompleto(): string {
    const usuario = this.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : '';
  }

  get iniciales(): string {
    const usuario = this.usuario();
    if (!usuario) return 'LS';
    return `${usuario.nombre.trim().charAt(0)}${usuario.apellido.trim().charAt(0)}`.toLocaleUpperCase();
  }

  ngOnInit(): void {
    this.usuariosService.usuarioActual().subscribe({
      next: usuario => {
        this.usuario.set(usuario);
        this.errorPerfil.set('');
        this.cargandoPerfil.set(false);
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorPerfil.set('No se pudieron cargar los datos de tu cuenta.');
        this.cargandoPerfil.set(false);
        this.changeDetector.markForCheck();
      },
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}