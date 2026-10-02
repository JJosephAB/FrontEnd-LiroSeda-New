import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ProductoListado } from '../models/producto-listado';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly productos: ProductoListado[] = [
    {
      id: 'PR01',
      nombre: 'Polera Deportiva Hombre',
      marca: 'Nike',
      lote: 'Deportivo',
      proveedor: 'Textiles Andinos',
      stock: 120,
      precio: 89.90,
    },
    {
      id: 'PR02',
      nombre: 'Polo Básico Algodón',
      marca: 'Zara',
      lote: 'Casual',
      proveedor: 'Moda Peruana',
      stock: 200,
      precio: 29.90,
    },
    {
      id: 'PR15',
      nombre: 'Falda Casual',
      marca: 'Zara',
      lote: 'Casual',
      proveedor: 'Minimal Style',
      stock: 40,
      precio: 69.90,
    },
  ];

  listar(): Observable<ProductoListado[]> {
    return of(this.productos);
  }
}