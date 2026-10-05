import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  EntradaApi,
  MovimientosService,
  PedidoApi,
  SalidaApi,
} from './movimientos.service';

describe('MovimientosService', () => {
  let service: MovimientosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MovimientosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts pedidos with the backend DTO fields and nested details', () => {
    const pedido = {
      idPedido: 'PD0004',
      fechaPedido: '2026-10-04',
      idSedeUsuario: 1,
      idEstado: 2,
      idUsuario: 1,
      detalles: [{
        cantidad: 3,
        idPedido: 'PD0004',
        idProducto: 'PR01',
        idDetallePedido: null,
      }],
    };

    service.crearPedido(pedido).subscribe();

    const request = http.expectOne('https://liroseda.noudat.com/api/pedidos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(pedido);
    request.flush(pedido);
  });

  it('posts salidas with their reason, site, user, and nested details', () => {
    const salida = {
      idSalida: 'S00004',
      fechaSalida: '2026-10-04',
      idSedeUsuario: 1,
      idMotivo: 2,
      idUsuario: 1,
      detalles: [{
        cantidad: 2,
        idProducto: 'PR01',
        idSalida: 'S00004',
        idDetalleSalida: null,
      }],
    };

    service.crearSalida(salida).subscribe();

    const request = http.expectOne('https://liroseda.noudat.com/api/salidas');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(salida);
    request.flush(salida);
  });

  it('updates pedidos and salidas at their resource URLs', () => {
    const pedido = {
      idPedido: 'PD0004',
      fechaPedido: '2026-10-04',
      idSedeUsuario: 1,
      idEstado: 2,
      idUsuario: 1,
      detalles: [{
        cantidad: 4,
        idPedido: 'PD0004',
        idProducto: 'PR01',
        idDetallePedido: 5,
      }],
    };
    const salida = {
      idSalida: 'S00004',
      fechaSalida: '2026-10-04',
      idSedeUsuario: 1,
      idMotivo: 2,
      idUsuario: 1,
      detalles: [{
        cantidad: 4,
        idProducto: 'PR01',
        idSalida: 'S00004',
        idDetalleSalida: 5,
      }],
    };

    service.actualizarPedido(pedido.idPedido, pedido).subscribe();
    const pedidoRequest = http.expectOne('https://liroseda.noudat.com/api/pedidos/PD0004');
    expect(pedidoRequest.request.method).toBe('PUT');
    expect(pedidoRequest.request.body).toEqual(pedido);
    pedidoRequest.flush(pedido);

    service.actualizarSalida(salida.idSalida, salida).subscribe();
    const salidaRequest = http.expectOne('https://liroseda.noudat.com/api/salidas/S00004');
    expect(salidaRequest.request.method).toBe('PUT');
    expect(salidaRequest.request.body).toEqual(salida);
    salidaRequest.flush(salida);
  });

  it('creates and updates entries with multiple nested details', () => {
    const entrada = {
      idEntrada: 'E00005',
      fechaEntrada: '2026-10-04',
      idSedeUsuario: 1,
      idProveedor: 'P001',
      idUsuario: 1,
      detalles: [
        {
          cantidad: 5,
          precioUnitario: 29.9,
          idEntrada: 'E00005',
          idProducto: 'PR01',
          idDetalleEntrada: null,
        },
        {
          cantidad: 2,
          precioUnitario: 49.9,
          idEntrada: 'E00005',
          idProducto: 'PR02',
          idDetalleEntrada: null,
        },
      ],
    };

    service.crearEntrada(entrada).subscribe();
    const createRequest = http.expectOne('https://liroseda.noudat.com/api/entradas');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(entrada);
    createRequest.flush({ ...entrada, importeTotal: 249.3 });

    service.actualizarEntrada(entrada.idEntrada, entrada).subscribe();
    const updateRequest = http.expectOne('https://liroseda.noudat.com/api/entradas/E00005');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(entrada);
    updateRequest.flush({ ...entrada, importeTotal: 249.3 });
  });

  it('returns only orders, entries, and exits assigned to the current site', () => {
    let pedidosResult: PedidoApi[] = [];
    let entradasResult: EntradaApi[] = [];
    let salidasResult: SalidaApi[] = [];

    service.listarPedidos(2).subscribe(result => pedidosResult = result);
    service.listarEntradas(2).subscribe(result => entradasResult = result);
    service.listarSalidas(2).subscribe(result => salidasResult = result);

    http.expectOne('https://liroseda.noudat.com/api/pedidos').flush([
      { idPedido: 'PD01', idSedeUsuario: 1, detalles: [] },
      { idPedido: 'PD02', idSedeUsuario: 2, detalles: [] },
    ]);
    http.expectOne('https://liroseda.noudat.com/api/entradas').flush([
      { idEntrada: 'E01', idSedeUsuario: 1, detalles: [] },
      { idEntrada: 'E02', idSedeUsuario: 2, detalles: [] },
    ]);
    http.expectOne('https://liroseda.noudat.com/api/salidas').flush([
      { idSalida: 'S01', idSedeUsuario: 1, detalles: [] },
      { idSalida: 'S02', idSedeUsuario: 2, detalles: [] },
    ]);

    expect(pedidosResult.map(row => row.idPedido)).toEqual(['PD02']);
    expect(entradasResult.map(row => row.idEntrada)).toEqual(['E02']);
    expect(salidasResult.map(row => row.idSalida)).toEqual(['S02']);
  });
});
