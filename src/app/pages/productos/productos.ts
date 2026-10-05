import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductoListado } from '../../models/producto-listado';
import { ModeloApi, ProductosService, SedeApi } from '../../services/productos.service';
import { UsuarioApi, UsuariosService } from '../../services/usuarios.service';

@Component({
  imports: [CurrencyPipe, FormsModule, ReactiveFormsModule],
  selector: 'app-productos',
  styleUrl: './productos.css',
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly productoForm = this.formBuilder.nonNullable.group({
    idproducto: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    modeloId: [0, [Validators.required, Validators.min(1)]],
    sedeId: [0, [Validators.required, Validators.min(1)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.max(2147483647), Validators.pattern(/^\d+$/)]],
    precio: [0, [Validators.required, Validators.min(0), Validators.max(99999999.99), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
  });

  productos: ProductoListado[] = [];
  modelos: ModeloApi[] = [];
  sedes: SedeApi[] = [];
  usuarioActual: UsuarioApi | null = null;
  sedeSeleccionada = '';
  busqueda = '';
  modeloSeleccionado = '';
  stockSeleccionado = '';
  errorCarga = signal('');
  errorGuardado = signal('');
  errorEliminacion = signal('');
  guardando = signal(false);
  eliminandoProductoId = signal<string | null>(null);
  editandoProductoId: string | null = null;

  get modelosDisponibles(): string[] {
    return [...new Set(this.productos.map(producto => producto.modelo))].sort();
  }

  get productosFiltrados(): ProductoListado[] {
    const texto = this.normalizar(this.busqueda.trim());

    return this.productos.filter(producto =>
      this.normalizar(`${producto.idproducto} ${producto.nombre}`).includes(texto) &&
      (!this.modeloSeleccionado || producto.modelo === this.modeloSeleccionado) &&
      (this.stockSeleccionado === '' ||
        (this.stockSeleccionado === 'disponible' && producto.stock > 50) ||
        (this.stockSeleccionado === 'bajo' && producto.stock > 0 && producto.stock <= 50) ||
        (this.stockSeleccionado === 'agotado' && producto.stock === 0)),
    );
  }

  get unidadesDisponibles(): number {
    return this.productos.reduce((total, producto) => total + producto.stock, 0);
  }

  get productosConStockBajo(): number {
    return this.productos.filter(producto => producto.stock > 0 && producto.stock <= 50).length;
  }

  abrirProducto(dialog: HTMLDialogElement): void {
    this.productoForm.reset({
      idproducto: '',
      nombre: '',
      modeloId: 0,
      sedeId: this.sedeSeleccionada
        ? Number(this.sedeSeleccionada)
        : this.usuarioActual?.idSede ?? 0,
      stock: 0,
      precio: 0,
    });
    this.errorGuardado.set('');
    this.editandoProductoId = null;
    this.productoForm.controls.sedeId.disable();
    dialog.showModal();
  }

  editarProducto(producto: ProductoListado, dialog: HTMLDialogElement): void {
    this.editandoProductoId = producto.idproducto;
    this.productoForm.reset({
      idproducto: producto.idproducto,
      nombre: producto.nombre,
      modeloId: producto.modeloId,
      sedeId: this.sedeSeleccionada
        ? Number(this.sedeSeleccionada)
        : this.usuarioActual?.idSede ?? 0,
      stock: producto.stock,
      precio: producto.precio,
    });
    this.productoForm.controls.sedeId.disable();
    this.errorGuardado.set('');
    dialog.showModal();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.modeloSeleccionado = '';
    this.stockSeleccionado = '';
  }

  eliminarProducto(producto: ProductoListado): void {
    if (!window.confirm(
      `¿Eliminar el producto "${producto.nombre}" (${producto.idproducto})? Si tiene existencias o está asociado a movimientos, el backend puede impedir la eliminación.`,
    )) return;

    this.errorEliminacion.set('');
    this.eliminandoProductoId.set(producto.idproducto);
    this.productosService.eliminar(producto.idproducto).subscribe({
      next: () => {
        this.productos = this.productos.filter(
          actual => actual.idproducto !== producto.idproducto,
        );
        this.eliminandoProductoId.set(null);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorEliminacion.set(this.mensajeError(error));
        this.eliminandoProductoId.set(null);
        this.changeDetector.markForCheck();
      },
    });
  }

  guardarProducto(dialog: HTMLDialogElement): void {
    this.errorGuardado.set('');
    this.productoForm.markAllAsTouched();
    if (this.productoForm.invalid) return;

    const value = this.productoForm.getRawValue();
    const producto = {
      idProducto: value.idproducto.trim(),
      nombre: value.nombre.trim(),
      precio: value.precio,
      estado: this.productos.find(
        actual => actual.idproducto === this.editandoProductoId,
      )?.estado ?? '1',
      idModelo: value.modeloId,
    };

    this.guardando.set(true);
    const solicitudProducto = this.editandoProductoId
      ? this.productosService.actualizar(producto)
      : this.productosService.crear(producto);

    solicitudProducto.subscribe({
      next: () => {
        const productoEnSede = this.productos.find(
          actual => actual.idproducto === producto.idProducto,
        );
        const guardarStock = productoEnSede?.tieneRegistroSede
          ? this.productosService.actualizarStock(
            producto.idProducto,
            value.sedeId,
            value.stock,
          )
          : this.productosService.crearStock(
            producto.idProducto,
            value.sedeId,
            value.stock,
          );

        guardarStock.subscribe({
          next: () => {
            dialog.close();
            this.editandoProductoId = null;
            this.cargarProductos(value.sedeId);
            this.guardando.set(false);
            this.changeDetector.markForCheck();
          },
          error: (error: unknown) => {
            this.errorGuardado.set(
              `Se guardó el producto, pero no se pudo guardar su stock en la sede. ${this.mensajeError(error)}`,
            );
            this.cargarProductos(value.sedeId);
            this.guardando.set(false);
            this.changeDetector.markForCheck();
          },
        });
      },
      error: (error: unknown) => {
        this.errorGuardado.set(this.mensajeError(error));
        this.guardando.set(false);
        this.changeDetector.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    this.productosService.listarModelos().subscribe({
      next: modelos => {
        this.modelos = modelos;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
    this.productosService.listarSedes().subscribe({
      next: sedes => {
        this.sedes = sedes;
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
        this.sedeSeleccionada = String(usuario.idSede);
        this.productoForm.controls.sedeId.setValue(usuario.idSede);
        this.cargarProductos(usuario.idSede);
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorCarga.set(this.mensajeError(error));
        this.changeDetector.markForCheck();
      },
    });
  }

  private cargarProductos(idSede: number): void {
    this.productosService.listar(idSede, true).subscribe({
      next: productos => {
        this.productos = productos;
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
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 409 || error.status === 500) {
        return 'No se pudo eliminar el producto. Puede estar relacionado con existencias o movimientos.';
      }
      return `El backend respondió con error ${error.status}.`;
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
