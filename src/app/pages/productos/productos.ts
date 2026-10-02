import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductoListado } from '../../models/producto-listado';
import { ProductosService } from '../../services/productos.service';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  imports: [CurrencyPipe, FormsModule, ReactiveFormsModule],
  selector: 'app-productos',
  styleUrl: './productos.css',
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly formBuilder = inject(FormBuilder);

  readonly productoForm = this.formBuilder.nonNullable.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.maxLength(120),
        Validators.pattern(/\S/),
      ],
    ],
    marca: ['', Validators.required],
    lote: ['', Validators.required],
    proveedor: ['', Validators.required],
    stock: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    ],
    precio: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(99999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    });

  productos: ProductoListado[] = [];

  busqueda = '';
  marcaSeleccionada = '';
  loteSeleccionado = '';
  stockSeleccionado = '';

  abrirProducto(dialog: HTMLDialogElement): void {
  this.productoForm.reset();
  dialog.showModal();
  }
  
  get proveedores(): string[] {
  return [...new Set(
    this.productos.map(producto => producto.proveedor),
  )].sort();
  }
  get marcas(): string[] {
    return [...new Set(this.productos.map(producto => producto.marca))]
      .sort();
  }

  get lotes(): string[] {
    return [...new Set(this.productos.map(producto => producto.lote))]
      .sort();
  }

  get productosFiltrados(): ProductoListado[] {
    const texto = this.normalizar(this.busqueda.trim());

    return this.productos.filter(producto => {
      const coincideBusqueda = this.normalizar(
        `${producto.id} ${producto.nombre}`,
      ).includes(texto);

      const coincideMarca =
        !this.marcaSeleccionada ||
        producto.marca === this.marcaSeleccionada;

      const coincideLote =
        !this.loteSeleccionado ||
        producto.lote === this.loteSeleccionado;

      const coincideStock =
        this.stockSeleccionado === '' ||
        (this.stockSeleccionado === 'disponible' && producto.stock > 50) ||
        (this.stockSeleccionado === 'bajo' &&
          producto.stock > 0 &&
          producto.stock <= 50) ||
        (this.stockSeleccionado === 'agotado' && producto.stock === 0);

      return coincideBusqueda &&
        coincideMarca &&
        coincideLote &&
        coincideStock;
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.marcaSeleccionada = '';
    this.loteSeleccionado = '';
    this.stockSeleccionado = '';
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  ngOnInit(): void {
    this.productosService.listar().subscribe(productos => {
      this.productos = productos;
    });
  }

  get unidadesDisponibles(): number {
    return this.productos.reduce(
      (total, producto) => total + producto.stock,
      0,
    );
  }

  get productosConStockBajo(): number {
    return this.productos.filter(
      producto => producto.stock > 0 && producto.stock <= 50,
    ).length;
  }
}