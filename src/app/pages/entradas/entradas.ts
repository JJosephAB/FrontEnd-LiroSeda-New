import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EntradaApi,
  EntradaNueva,
  MovimientosService,
} from '../../services/movimientos.service';
import { ProductoListado } from '../../models/producto-listado';
import { ProductosService } from '../../services/productos.service';
import { ProveedorApi, ProveedoresService } from '../../services/proveedores.service';
import { UsuarioApi, UsuariosService } from '../../services/usuarios.service';

interface DetalleEntradaFormulario {
  idProducto: string;
  cantidad: number;
  precioUnitario: number;
  idDetalleEntrada: number | null;
}

@Component({
  imports: [CurrencyPipe, FormsModule],
  selector: 'app-entradas',
  templateUrl: './entradas.html',
})
export class Entradas implements OnInit {
  private readonly movimientosService = inject(MovimientosService);
  private readonly productosService = inject(ProductosService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  entradas: EntradaApi[] = [];
  productos: ProductoListado[] = [];
  proveedores: ProveedorApi[] = [];
  usuarioActual: UsuarioApi | null = null;
  lineas = [1];
  detalleFormulario: Record<number, DetalleEntradaFormulario> = {
    1: { idProducto: '', cantidad: 1, precioUnitario: 0, idDetalleEntrada: null },
  };
  cabecera = { idEntrada: '', fechaEntrada: '', idProveedor: '' };
  busqueda = '';
  editandoEntrada: EntradaApi | null = null;
  readonly errorCarga = signal('');
  readonly errorGuardado = signal('');
  readonly guardando = signal(false);
  private siguienteLinea = 2;

  get entradasFiltradas(): EntradaApi[] {
    const texto = this.normalizar(this.busqueda.trim());
    return this.entradas.filter(entrada =>
      this.normalizar(`${entrada.idEntrada} ${entrada.idProveedor} ${entrada.idUsuario}`).includes(texto),
    );
  }

  get importeFormulario(): number {
    return this.lineas.reduce((total, linea) => {
      const detalle = this.detalleFormulario[linea];
      return total + Number(detalle?.cantidad || 0) * Number(detalle?.precioUnitario || 0);
    }, 0);
  }

  get importeAcumulado(): number {
    return this.entradas.reduce((total, entrada) => total + this.importeEntrada(entrada), 0);
  }

  nombreProveedor(idProveedor: string): string {
    return this.proveedores.find(proveedor => proveedor.idProveedor === idProveedor)?.nombre ?? idProveedor;
  }

  nombreProducto(idProducto: string): string {
    return this.productos.find(producto => producto.idproducto === idProducto)?.nombre ?? idProducto;
  }

  importeEntrada(entrada: EntradaApi): number {
    return entrada.importeTotal ?? entrada.detalles.reduce(
      (total, detalle) => total + detalle.cantidad * detalle.precioUnitario,
      0,
    );
  }

  abrirEntrada(dialog: HTMLDialogElement): void {
    this.editandoEntrada = null;
    this.cabecera = { idEntrada: '', fechaEntrada: '', idProveedor: '' };
    this.lineas = [1];
    this.detalleFormulario = {
      1: { idProducto: '', cantidad: 1, precioUnitario: 0, idDetalleEntrada: null },
    };
    this.siguienteLinea = 2;
    this.errorGuardado.set('');
    dialog.showModal();
  }

  editarEntrada(entrada: EntradaApi, dialog: HTMLDialogElement): void {
    this.editandoEntrada = entrada;
    this.cabecera = {
      idEntrada: entrada.idEntrada,
      fechaEntrada: entrada.fechaEntrada.slice(0, 10),
      idProveedor: entrada.idProveedor,
    };
    this.lineas = entrada.detalles.map((_, index) => index + 1);
    if (!this.lineas.length) this.lineas = [1];
    this.detalleFormulario = Object.fromEntries(
      entrada.detalles.map((detalle, index) => [index + 1, {
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        idDetalleEntrada: detalle.idDetalleEntrada,
      }]),
    );
    if (!entrada.detalles.length) {
      this.detalleFormulario = {
        1: { idProducto: '', cantidad: 1, precioUnitario: 0, idDetalleEntrada: null },
      };
    }
    this.siguienteLinea = this.lineas.length + 1;
    this.errorGuardado.set('');
    dialog.showModal();
  }

  agregarLinea(): void {
    const id = this.siguienteLinea++;
    this.lineas = [...this.lineas, id];
    this.detalleFormulario = {
      ...this.detalleFormulario,
      [id]: { idProducto: '', cantidad: 1, precioUnitario: 0, idDetalleEntrada: null },
    };
  }

  quitarLinea(id: number): void {
    if (this.lineas.length > 1) {
      this.lineas = this.lineas.filter(linea => linea !== id);
      const detalles = { ...this.detalleFormulario };
      delete detalles[id];
      this.detalleFormulario = detalles;
    }
  }

  guardarEntrada(event: SubmitEvent, dialog: HTMLDialogElement, formulario: HTMLFormElement): void {
    event.preventDefault();
    this.errorGuardado.set('');
    if (!formulario.reportValidity()) return;
    const usuario = this.usuarioActual;
    if (!usuario) {
      this.errorGuardado.set('No se pudo cargar el usuario autenticado. Vuelve a cargar la página.');
      return;
    }
    const idEntrada = this.cabecera.idEntrada.trim();
    const entrada: EntradaNueva = {
      idEntrada,
      fechaEntrada: this.cabecera.fechaEntrada,
      idSedeUsuario: this.editandoEntrada?.idSedeUsuario ?? usuario.idSede,
      idProveedor: this.cabecera.idProveedor,
      idUsuario: this.editandoEntrada?.idUsuario ?? usuario.idUsuario,
      detalles: this.lineas.map(linea => ({
        cantidad: Number(this.detalleFormulario[linea].cantidad),
        precioUnitario: Number(this.detalleFormulario[linea].precioUnitario),
        idEntrada,
        idProducto: this.detalleFormulario[linea].idProducto,
        idDetalleEntrada: this.detalleFormulario[linea].idDetalleEntrada,
      })),
    };

    this.guardando.set(true);
    const solicitud = this.editandoEntrada
      ? this.movimientosService.actualizarEntrada(idEntrada, entrada)
      : this.movimientosService.crearEntrada(entrada);
    solicitud.subscribe({
      next: () => {
        dialog.close();
        this.cargarEntradas(usuario.idSede);
        this.cargarProductos(usuario.idSede);
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
    this.proveedoresService.listar().subscribe({
      next: proveedores => {
        this.proveedores = proveedores;
        this.changeDetector.markForCheck();
      },
      error: error => this.mostrarErrorCarga(error),
    });
    this.usuariosService.usuarioActual().subscribe({
      next: usuario => {
        this.usuarioActual = usuario;
        this.changeDetector.markForCheck();
        this.cargarEntradas(usuario.idSede);
        this.cargarProductos(usuario.idSede);
      },
      error: error => this.mostrarErrorCarga(error),
    });
  }

  private cargarEntradas(idSede: number): void {
    this.movimientosService.listarEntradas(idSede).subscribe({
      next: entradas => {
        this.entradas = entradas;
        this.errorCarga.set('');
        this.changeDetector.markForCheck();
      },
      error: error => this.mostrarErrorCarga(error),
    });
  }

  private cargarProductos(idSede: number): void {
    this.productosService.listar(idSede).subscribe({
      next: productos => {
        this.productos = productos;
        this.changeDetector.markForCheck();
      },
      error: error => this.mostrarErrorCarga(error),
    });
  }

  private mostrarErrorCarga(error: unknown): void {
    this.errorCarga.set(this.mensajeError(error));
    this.changeDetector.markForCheck();
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el backend.';
      if (error.status === 403) return 'El backend no autorizó esta acción para tu usuario.';
      return `El backend respondió con error ${error.status}.`;
    }
    return error instanceof Error ? error.message : 'Ocurrió un error al procesar la solicitud.';
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
