import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  imports: [],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar {
  private readonly router = inject(Router);

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
}