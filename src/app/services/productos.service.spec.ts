import { TestBed } from '@angular/core/testing';
import { ProductosService } from './productos.service';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

describe('ProductosService', () => {
  let service: ProductosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('combines products with model names and stock across sites', () => {
    let result: unknown;
    service.listar().subscribe(products => result = products);

    http.expectOne('http://10.20.10.9:8490/api/productos').flush([
      {
        idProducto: 'PR01',
        nombre: 'Polera Deportiva Hombre',
        precio: 89.9,
        estado: '1',
        idModelo: 1,
      },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/modelos').flush([
      { idModelo: 1, descripcion: 'Polera Deportiva' },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/productos-sedes').flush([
      { stock: 100, idSede: 1, idProducto: 'PR01' },
      { stock: 30, idSede: 2, idProducto: 'PR01' },
    ]);

    expect(result).toEqual([
      {
        idproducto: 'PR01',
        nombre: 'Polera Deportiva Hombre',
        modelo: 'Polera Deportiva',
        modeloId: 1,
        estado: '1',
        stock: 130,
        tieneRegistroSede: true,
        precio: 89.9,
      },
    ]);
  });

  it('limits calculated stock to the selected site', () => {
    let result: unknown;
    service.listar(2).subscribe(products => result = products);

    http.expectOne('http://10.20.10.9:8490/api/productos').flush([
      {
        idProducto: 'PR01',
        nombre: 'Polera Deportiva Hombre',
        precio: 89.9,
        estado: '1',
        idModelo: 1,
      },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/modelos').flush([
      { idModelo: 1, descripcion: 'Polera Deportiva' },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/productos-sedes').flush([
      { stock: 100, idSede: 1, idProducto: 'PR01' },
      { stock: 30, idSede: 2, idProducto: 'PR01' },
    ]);

    expect(result).toEqual([
      {
        idproducto: 'PR01',
        nombre: 'Polera Deportiva Hombre',
        modelo: 'Polera Deportiva',
        modeloId: 1,
        estado: '1',
        stock: 30,
        tieneRegistroSede: true,
        precio: 89.9,
      },
    ]);
  });

  it('returns only stocked products for the specified site when requested', () => {
    let result: unknown;
    service.listar(2, true).subscribe(products => result = products);

    http.expectOne('http://10.20.10.9:8490/api/productos').flush([
      {
        idProducto: 'PR01',
        nombre: 'Producto sin stock en sede 2',
        precio: 50,
        estado: '1',
        idModelo: 1,
      },
      {
        idProducto: 'PR02',
        nombre: 'Producto con stock en sede 2',
        precio: 60,
        estado: '1',
        idModelo: 1,
      },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/modelos').flush([
      { idModelo: 1, descripcion: 'Modelo' },
    ]);
    http.expectOne('http://10.20.10.9:8490/api/productos-sedes').flush([
      { stock: 20, idSede: 1, idProducto: 'PR01' },
      { stock: 0, idSede: 2, idProducto: 'PR01' },
      { stock: 10, idSede: 1, idProducto: 'PR02' },
      { stock: 5, idSede: 2, idProducto: 'PR02' },
    ]);

    expect((result as Array<{ idproducto: string; stock: number }>).map(product => [
      product.idproducto,
      product.stock,
    ])).toEqual([['PR02', 5]]);
  });

  it('deletes products using their encoded resource identifier', () => {
    service.eliminar('PR 01').subscribe();

    const request = http.expectOne('http://10.20.10.9:8490/api/productos/PR%2001');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
