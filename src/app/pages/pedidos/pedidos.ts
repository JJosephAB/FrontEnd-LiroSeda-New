import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EstadoApi,
  MovimientosService,
  PedidoApi,
  PedidoNuevo,
} from '../../services/movimientos.service';
import { ProductoListado } from '../../models/producto-listado';
import { ProductosService } from '../../services/productos.service';
import { UsuarioApi, UsuariosService } from '../../services/usuarios.service';

interface DetallePedidoFormulario {
  idProducto: string;
  cantidad: number;
  idDetallePedido: number | null;
}

@Component({
  imports: [FormsModule],
  selector: 'app-pedidos',
  styleUrl: './pedidos.css',
  templateUrl: './pedidos.html',
})
export class Pedidos implements OnInit {
  private readonly movimientosService = inject(MovimientosService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  lineas = [1];
  pedidos: PedidoApi[] = [];
  productos: ProductoListado[] = [];
  estados: EstadoApi[] = [];
  usuarioActual: UsuarioApi | null = null;
  busqueda = '';
  estadoFiltro = '';
  readonly errorCarga = signal('');
  readonly errorGuardado = signal('');
  readonly guardando = signal(false);
  editandoPedido: PedidoApi | null = null;
  cabecera = { idPedido: '', fechaPedido: '', idEstado: 0 };
  detalleFormulario: Record<number, DetallePedidoFormulario> = {
    1: { idProducto: '', cantidad: 1, idDetallePedido: null },
  };
  private siguienteLinea = 2;

  get pedidosFiltrados(): PedidoApi[] {
    const texto = this.normalizar(this.busqueda.trim());
    return this.pedidos.filter(pedido =>
      this.normalizar(`${pedido.idPedido} ${pedido.idUsuario}`).includes(texto) &&
      (!this.estadoFiltro || String(pedido.idEstado) === this.estadoFiltro),
    );
  }

  get unidadesSolicitadas(): number {
    return this.pedidos.reduce(
      (total, pedido) => total + pedido.detalles.reduce((suma, detalle) => suma + detalle.cantidad, 0),
      0,
    );
  }

  unidadesPedido(pedido: PedidoApi): number {
    return pedido.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  nombreEstado(idEstado: number): string {
    return this.estados.find(estado => estado.idEstado === idEstado)?.descripcion ?? `Estado ${idEstado}`;
  }

  nombreProducto(idProducto: string): string {
    return this.productos.find(producto => producto.idproducto === idProducto)?.nombre ?? idProducto;
  }

  abrirPedido(dialog: HTMLDialogElement): void {
    this.editandoPedido = null;
    this.cabecera = { idPedido: '', fechaPedido: '', idEstado: 0 };
    this.lineas = [1];
    this.detalleFormulario = { 1: { idProducto: '', cantidad: 1, idDetallePedido: null } };
    this.siguienteLinea = 2;
    this.errorGuardado.set('');
    dialog.showModal();
  }

  editarPedido(pedido: PedidoApi, dialog: HTMLDialogElement): void {
    this.editandoPedido = pedido;
    this.cabecera = {
      idPedido: pedido.idPedido,
      fechaPedido: pedido.fechaPedido.slice(0, 10),
      idEstado: pedido.idEstado,
    };
    this.lineas = pedido.detalles.map((_, index) => index + 1);
    if (!this.lineas.length) this.lineas = [1];
    this.detalleFormulario = Object.fromEntries(
      pedido.detalles.map((detalle, index) => [index + 1, {
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        idDetallePedido: detalle.idDetallePedido,
      }]),
    );
    if (!pedido.detalles.length) {
      this.detalleFormulario = { 1: { idProducto: '', cantidad: 1, idDetallePedido: null } };
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
      [id]: { idProducto: '', cantidad: 1, idDetallePedido: null },
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

  registrarPedido(
    event: SubmitEvent,
    dialog: HTMLDialogElement,
    formulario: HTMLFormElement,
  ): void {
    event.preventDefault();
    this.errorGuardado.set('');
    if (!formulario.reportValidity()) return;
    const usuario = this.usuarioActual;
    if (!usuario) {
      this.errorGuardado.set('No se pudo cargar el usuario autenticado. Vuelve a cargar la página.');
      return;
    }
    const idPedido = this.cabecera.idPedido.trim();
    const pedido: PedidoNuevo = {
      idPedido,
      fechaPedido: this.cabecera.fechaPedido,
      fechaAprobacion: this.editandoPedido?.fechaAprobacion ?? null,
      idSedeUsuario: this.editandoPedido?.idSedeUsuario ?? usuario.idSede,
      idEstado: Number(this.cabecera.idEstado),
      idUsuario: this.editandoPedido?.idUsuario ?? usuario.idUsuario,
      detalles: this.lineas.map(linea => ({
        cantidad: Number(this.detalleFormulario[linea].cantidad),
        idPedido,
        idProducto: this.detalleFormulario[linea].idProducto,
        idDetallePedido: this.detalleFormulario[linea].idDetallePedido,
      })),
    };

    this.guardando.set(true);
    const solicitud = this.editandoPedido
      ? this.movimientosService.actualizarPedido(idPedido, pedido)
      : this.movimientosService.crearPedido(pedido);
    solicitud.subscribe({
      next: () => {
        dialog.close();
        this.cargarPedidos(usuario.idSede);
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
    this.movimientosService.listarEstados().subscribe({
      next: estados => {
        this.estados = estados;
        this.changeDetector.markForCheck();
      },
      error: error => this.errorCarga.set(this.mensajeError(error)),
    });
    this.usuariosService.usuarioActual().subscribe({
      next: usuario => {
        this.usuarioActual = usuario;
        this.changeDetector.markForCheck();
        this.cargarPedidos(usuario.idSede);
        this.productosService.listar(usuario.idSede).subscribe({
          next: productos => {
            this.productos = productos;
            this.changeDetector.markForCheck();
          },
          error: error => this.errorCarga.set(this.mensajeError(error)),
        });
      },
      error: error => this.errorCarga.set(this.mensajeError(error)),
    });
  }

  private cargarPedidos(idSede: number): void {
    this.movimientosService.listarPedidos(idSede).subscribe({
      next: pedidos => {
        this.pedidos = pedidos;
        this.errorCarga.set('');
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
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
