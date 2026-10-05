import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MotivoApi,
  MovimientosService,
  SalidaApi,
  SalidaNueva,
} from '../../services/movimientos.service';
import { ProductoListado } from '../../models/producto-listado';
import { ProductosService } from '../../services/productos.service';
import { UsuarioApi, UsuariosService } from '../../services/usuarios.service';

interface DetalleSalidaFormulario {
  idProducto: string;
  cantidad: number;
  idDetalleSalida: number | null;
}

@Component({
  imports: [FormsModule],
  selector: 'app-bajas',
  styleUrl: './bajas.css',
  templateUrl: './bajas.html',
})
export class Bajas implements OnInit {
  private readonly movimientosService = inject(MovimientosService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  lineas = [1];
  salidas: SalidaApi[] = [];
  productos: ProductoListado[] = [];
  motivos: MotivoApi[] = [];
  usuarioActual: UsuarioApi | null = null;
  detalleFormulario: Record<number, DetalleSalidaFormulario> = {
    1: { idProducto: '', cantidad: 1, idDetalleSalida: null },
  };
  cabecera = { idSalida: '', fechaSalida: '', idMotivo: 0 };
  busqueda = '';
  readonly errorCarga = signal('');
  readonly errorGuardado = signal('');
  readonly guardando = signal(false);
  editandoSalida: SalidaApi | null = null;
  private siguienteLinea = 2;

  get salidasFiltradas(): SalidaApi[] {
    const texto = this.normalizar(this.busqueda.trim());
    return this.salidas.filter(salida =>
      this.normalizar(`${salida.idSalida} ${salida.idUsuario} ${this.nombreMotivo(salida.idMotivo)}`).includes(texto),
    );
  }

  get unidadesRetiradas(): number {
    return this.salidas.reduce(
      (total, salida) => total + salida.detalles.reduce((suma, detalle) => suma + detalle.cantidad, 0),
      0,
    );
  }

  get unidadesFormulario(): number {
    return this.lineas.reduce(
      (total, linea) => total + (Number(this.detalleFormulario[linea]?.cantidad) || 0),
      0,
    );
  }

  unidadesSalida(salida: SalidaApi): number {
    return salida.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  nombreMotivo(idMotivo: number): string {
    return this.motivos.find(motivo => motivo.idMotivo === idMotivo)?.descripcion ?? `Motivo ${idMotivo}`;
  }

  nombreProducto(idProducto: string): string {
    return this.productos.find(producto => producto.idproducto === idProducto)?.nombre ?? idProducto;
  }

  abrirBaja(dialog: HTMLDialogElement): void {
    this.editandoSalida = null;
    this.cabecera = { idSalida: '', fechaSalida: '', idMotivo: 0 };
    this.lineas = [1];
    this.detalleFormulario = { 1: { idProducto: '', cantidad: 1, idDetalleSalida: null } };
    this.siguienteLinea = 2;
    this.errorGuardado.set('');
    dialog.showModal();
  }

  editarSalida(salida: SalidaApi, dialog: HTMLDialogElement): void {
    this.editandoSalida = salida;
    this.cabecera = {
      idSalida: salida.idSalida,
      fechaSalida: salida.fechaSalida.slice(0, 10),
      idMotivo: salida.idMotivo,
    };
    this.lineas = salida.detalles.map((_, index) => index + 1);
    if (!this.lineas.length) this.lineas = [1];
    this.detalleFormulario = Object.fromEntries(
      salida.detalles.map((detalle, index) => [index + 1, {
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        idDetalleSalida: detalle.idDetalleSalida,
      }]),
    );
    if (!salida.detalles.length) {
      this.detalleFormulario = { 1: { idProducto: '', cantidad: 1, idDetalleSalida: null } };
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
      [id]: { idProducto: '', cantidad: 1, idDetalleSalida: null },
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

  registrarBaja(
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

    const idSalida = this.cabecera.idSalida.trim();
    const salida: SalidaNueva = {
      idSalida,
      fechaSalida: this.cabecera.fechaSalida,
      idSedeUsuario: this.editandoSalida?.idSedeUsuario ?? usuario.idSede,
      idMotivo: Number(this.cabecera.idMotivo),
      idUsuario: this.editandoSalida?.idUsuario ?? usuario.idUsuario,
      detalles: this.lineas.map(linea => ({
        cantidad: Number(this.detalleFormulario[linea].cantidad),
        idProducto: this.detalleFormulario[linea].idProducto,
        idSalida,
        idDetalleSalida: this.detalleFormulario[linea].idDetalleSalida,
      })),
    };

    this.guardando.set(true);
    const solicitud = this.editandoSalida
      ? this.movimientosService.actualizarSalida(idSalida, salida)
      : this.movimientosService.crearSalida(salida);
    solicitud.subscribe({
      next: () => {
        dialog.close();
        this.cargarSalidas(usuario.idSede);
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
    this.movimientosService.listarMotivos().subscribe({
      next: motivos => {
        this.motivos = motivos;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
    this.usuariosService.usuarioActual().subscribe({
      next: usuario => {
        this.usuarioActual = usuario;
        this.changeDetector.markForCheck();
        this.cargarSalidas(usuario.idSede);
        this.cargarProductos(usuario.idSede);
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
  }

  private cargarProductos(idSede: number): void {
    this.productosService.listar(idSede).subscribe({
      next: productos => {
        this.productos = productos;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
  }

  private cargarSalidas(idSede: number): void {
    this.movimientosService.listarSalidas(idSede).subscribe({
      next: salidas => {
        this.salidas = salidas;
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
