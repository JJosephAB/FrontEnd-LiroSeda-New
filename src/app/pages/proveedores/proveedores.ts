import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NuevoProveedor, ProveedorApi, ProveedoresService } from '../../services/proveedores.service';

@Component({
  imports: [FormsModule],
  selector: 'app-proveedores',
  styleUrl: './proveedores.css',
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  proveedores: ProveedorApi[] = [];
  busqueda = '';
  readonly errorCarga = signal('');
  readonly errorGuardado = signal('');
  readonly guardando = signal(false);
  readonly cargando = signal(false);

  get proveedoresFiltrados(): ProveedorApi[] {
    const texto = this.normalizar(this.busqueda.trim());

    return this.proveedores.filter(proveedor =>
      this.normalizar(
        `${proveedor.idProveedor} ${proveedor.nombre} ${proveedor.ruc ?? ''} ${proveedor.correo ?? ''}`,
      ).includes(texto),
    );
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
  }

  guardarProveedor(formulario: HTMLFormElement, dialog: HTMLDialogElement): void {
    this.errorGuardado.set('');
    if (!formulario.reportValidity()) return;
    const datos = new FormData(formulario);
    const proveedor: NuevoProveedor = {
      idProveedor: String(datos.get('idproveedor')).trim(),
      nombre: String(datos.get('nombre')).trim(),
      telefono: String(datos.get('telefono') ?? '').trim() || null,
      correo: String(datos.get('correo') ?? '').trim() || null,
      direccion: String(datos.get('direccion') ?? '').trim() || null,
      ruc: String(datos.get('ruc') ?? '').trim() || null,
    };

    this.guardando.set(true);
    this.proveedoresService.crear(proveedor).subscribe({
      next: () => {
        dialog.close();
        formulario.reset();
        this.cargarProveedores();
        this.guardando.set(false);
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorGuardado.set(this.mensajeError(error));
        this.guardando.set(false);
        this.changeDetector.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  private cargarProveedores(): void {
    this.cargando.set(true);
    this.proveedoresService.listar().subscribe({
      next: proveedores => {
        this.proveedores = proveedores;
        this.errorCarga.set('');
        this.cargando.set(false);
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.cargando.set(false);
        this.changeDetector.markForCheck();
      },
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el backend.';
      return `El backend respondió con error ${error.status}.`;
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
