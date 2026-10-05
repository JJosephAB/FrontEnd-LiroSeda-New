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
  readonly errorEliminacion = signal('');
  readonly eliminandoProveedorId = signal<string | null>(null);
  proveedorEditando: ProveedorApi | null = null;

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

  abrirNuevoProveedor(formulario: HTMLFormElement, dialog: HTMLDialogElement): void {
    this.proveedorEditando = null;
    this.errorGuardado.set('');
    formulario.reset();
    dialog.showModal();
  }

  editarProveedor(
    proveedor: ProveedorApi,
    formulario: HTMLFormElement,
    dialog: HTMLDialogElement,
  ): void {
    this.proveedorEditando = proveedor;
    this.errorGuardado.set('');
    formulario.reset();
    for (const [campo, valor] of Object.entries({
      idproveedor: proveedor.idProveedor,
      nombre: proveedor.nombre,
      ruc: proveedor.ruc ?? '',
      correo: proveedor.correo ?? '',
      telefono: proveedor.telefono ?? '',
      direccion: proveedor.direccion ?? '',
    })) {
      const input = formulario.elements.namedItem(campo);
      if (input instanceof HTMLInputElement) input.value = valor;
    }
    dialog.showModal();
  }

  eliminarProveedor(proveedor: ProveedorApi): void {
    if (!window.confirm(
      `¿Eliminar al proveedor "${proveedor.nombre}" (${proveedor.idProveedor})? Si tiene entradas asociadas, el backend puede impedir la eliminación.`,
    )) return;

    this.errorEliminacion.set('');
    this.eliminandoProveedorId.set(proveedor.idProveedor);
    this.proveedoresService.eliminar(proveedor.idProveedor).subscribe({
      next: () => {
        this.proveedores = this.proveedores.filter(
          actual => actual.idProveedor !== proveedor.idProveedor,
        );
        this.eliminandoProveedorId.set(null);
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorEliminacion.set(this.mensajeError(error));
        this.eliminandoProveedorId.set(null);
        this.changeDetector.markForCheck();
      },
    });
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
    const solicitud = this.proveedorEditando
      ? this.proveedoresService.actualizar(proveedor)
      : this.proveedoresService.crear(proveedor);
    solicitud.subscribe({
      next: () => {
        dialog.close();
        formulario.reset();
        this.proveedorEditando = null;
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
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 409 || error.status === 500) {
        return 'No se pudo guardar el proveedor. Comprueba sus datos y que no existan registros relacionados.';
      }
      return `El backend respondió con error ${error.status}.`;
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
