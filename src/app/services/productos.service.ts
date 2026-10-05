import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ProductoListado } from '../models/producto-listado';
import { ApiService } from './api.service';

export interface ModeloApi {
  idModelo: number;
  descripcion: string;
}

export interface SedeApi {
  idSede: number;
  descripcion: string;
}

interface ProductoApi {
  idProducto: string;
  nombre: string;
  precio: number;
  estado: string;
  idModelo: number;
}

interface ProductoSedeApi {
  stock: number;
  idSede: number;
  idProducto: string;
}

export interface NuevoProducto {
  idProducto: string;
  nombre: string;
  precio: number;
  estado: string;
  idModelo: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly api = inject(ApiService);

  listar(idSede?: number, soloConStock = false): Observable<ProductoListado[]> {
    return forkJoin({
      productos: this.api.get<ProductoApi[]>('/productos'),
      modelos: this.api.get<ModeloApi[]>('/modelos'),
      stockPorSede: this.api.get<ProductoSedeApi[]>('/productos-sedes'),
    }).pipe(
      map(({ productos, modelos, stockPorSede }) => {
        const nombreModelo = new Map(
          modelos.map(modelo => [modelo.idModelo, modelo.descripcion]),
        );
        const stockProducto = new Map<string, number>();
        const registroSede = new Set<string>();

        for (const fila of stockPorSede) {
          if (idSede !== undefined && fila.idSede !== idSede) continue;
          registroSede.add(fila.idProducto);

          stockProducto.set(
            fila.idProducto,
            (stockProducto.get(fila.idProducto) ?? 0) + fila.stock,
          );
        }

        const listado = productos.map(producto => ({
          idproducto: producto.idProducto,
          nombre: producto.nombre,
          modelo:
            nombreModelo.get(producto.idModelo) ??
            `Modelo ${producto.idModelo}`,
          modeloId: producto.idModelo,
          estado: producto.estado,
          stock: stockProducto.get(producto.idProducto) ?? 0,
          tieneRegistroSede: registroSede.has(producto.idProducto),
          precio: Number(producto.precio),
        }));
        return soloConStock
          ? listado.filter(producto => producto.stock > 0)
          : listado;
      }),
    );
  }

  listarModelos(): Observable<ModeloApi[]> {
    return this.api.get<ModeloApi[]>('/modelos');
  }

  listarSedes(): Observable<SedeApi[]> {
    return this.api.get<SedeApi[]>('/sedes');
  }

  crear(producto: NuevoProducto): Observable<unknown> {
    return this.api.post('/productos', producto);
  }

  actualizar(producto: NuevoProducto): Observable<unknown> {
    return this.api.put(
      `/productos/${encodeURIComponent(producto.idProducto)}`,
      producto,
    );
  }

  eliminar(idProducto: string): Observable<void> {
    return this.api.delete<void>(`/productos/${encodeURIComponent(idProducto)}`);
  }

  crearStock(productoId: string, sedeId: number, stock: number): Observable<unknown> {
    return this.api.post('/productos-sedes', {
      idProducto: productoId,
      idSede: sedeId,
      stock,
    });
  }

  actualizarStock(productoId: string, sedeId: number, stock: number): Observable<unknown> {
    return this.api.put(
      `/productos-sedes/${encodeURIComponent(productoId)}/${sedeId}`,
      { idProducto: productoId, idSede: sedeId, stock },
    );
  }
}
