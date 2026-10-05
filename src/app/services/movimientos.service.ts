import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface EstadoApi {
  idEstado: number;
  descripcion: string;
}

export interface DetalleEntradaApi {
  cantidad: number;
  precioUnitario: number;
  idEntrada: string;
  idProducto: string;
  idDetalleEntrada: number | null;
}

export interface EntradaApi {
  idEntrada: string;
  fechaEntrada: string;
  importeTotal: number;
  idSedeUsuario: number;
  idProveedor: string;
  idUsuario: number;
  detalles: DetalleEntradaApi[];
}

export interface EntradaNueva {
  idEntrada: string;
  fechaEntrada: string;
  idSedeUsuario: number;
  idProveedor: string;
  idUsuario: number;
  detalles: Array<Pick<DetalleEntradaApi,
    'cantidad' | 'precioUnitario' | 'idEntrada' | 'idProducto' | 'idDetalleEntrada'> & {
    }>;
}

export interface MotivoApi {
  idMotivo: number;
  descripcion: string;
}

export interface DetallePedidoApi {
  cantidad: number;
  idPedido: string;
  idProducto: string;
  idDetallePedido: number | null;
}

export interface PedidoApi {
  idPedido: string;
  fechaPedido: string;
  fechaAprobacion: string | null;
  idSedeUsuario: number;
  idEstado: number;
  idUsuario: number;
  detalles: DetallePedidoApi[];
}

export interface PedidoNuevo {
  idPedido: string;
  fechaPedido: string;
  fechaAprobacion?: string | null;
  idSedeUsuario: number;
  idEstado: number;
  idUsuario: number;
  detalles: Array<Pick<DetallePedidoApi, 'cantidad' | 'idPedido' | 'idProducto' | 'idDetallePedido'> & {
  }>;
}

export interface DetalleSalidaApi {
  cantidad: number;
  idProducto: string;
  idSalida: string;
  idDetalleSalida: number | null;
}

export interface SalidaApi {
  idSalida: string;
  fechaSalida: string;
  idSedeUsuario: number;
  idMotivo: number;
  idUsuario: number;
  detalles: DetalleSalidaApi[];
}

export interface SalidaNueva {
  idSalida: string;
  fechaSalida: string;
  idSedeUsuario: number;
  idMotivo: number;
  idUsuario: number;
  detalles: Array<Pick<DetalleSalidaApi, 'cantidad' | 'idProducto' | 'idSalida' | 'idDetalleSalida'> & {
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class MovimientosService {
  private readonly api = inject(ApiService);

  listarEstados(): Observable<EstadoApi[]> {
    return this.api.get<EstadoApi[]>('/estados');
  }

  listarMotivos(): Observable<MotivoApi[]> {
    return this.api.get<MotivoApi[]>('/motivos');
  }

  listarPedidos(idSede: number): Observable<PedidoApi[]> {
    return this.api.get<PedidoApi[]>('/pedidos').pipe(
      map(pedidos => pedidos.filter(pedido => pedido.idSedeUsuario === idSede)),
    );
  }

  crearPedido(pedido: PedidoNuevo): Observable<PedidoApi> {
    return this.api.post<PedidoApi>('/pedidos', pedido);
  }

  actualizarPedido(id: string, pedido: PedidoNuevo): Observable<PedidoApi> {
    return this.api.put<PedidoApi>(`/pedidos/${encodeURIComponent(id)}`, pedido);
  }

  listarSalidas(idSede: number): Observable<SalidaApi[]> {
    return this.api.get<SalidaApi[]>('/salidas').pipe(
      map(salidas => salidas.filter(salida => salida.idSedeUsuario === idSede)),
    );
  }

  crearSalida(salida: SalidaNueva): Observable<SalidaApi> {
    return this.api.post<SalidaApi>('/salidas', salida);
  }

  actualizarSalida(id: string, salida: SalidaNueva): Observable<SalidaApi> {
    return this.api.put<SalidaApi>(`/salidas/${encodeURIComponent(id)}`, salida);
  }

  listarEntradas(idSede: number): Observable<EntradaApi[]> {
    return this.api.get<EntradaApi[]>('/entradas').pipe(
      map(entradas => entradas.filter(entrada => entrada.idSedeUsuario === idSede)),
    );
  }

  crearEntrada(entrada: EntradaNueva): Observable<EntradaApi> {
    return this.api.post<EntradaApi>('/entradas', entrada);
  }

  actualizarEntrada(id: string, entrada: EntradaNueva): Observable<EntradaApi> {
    return this.api.put<EntradaApi>(`/entradas/${encodeURIComponent(id)}`, entrada);
  }
}
