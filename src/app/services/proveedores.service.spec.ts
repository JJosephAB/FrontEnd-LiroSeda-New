import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProveedoresService } from './proveedores.service';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProveedoresService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deletes suppliers using their encoded resource identifier', () => {
    service.eliminar('P 001').subscribe();

    const request = http.expectOne('http://10.20.10.9:8490/api/proveedores/P%20001');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('updates suppliers using their resource identifier', () => {
    const proveedor = {
      idProveedor: 'P001',
      nombre: 'Textiles Andinos',
      telefono: '987650001',
      correo: 'contacto@andinos.com',
      direccion: 'Av. Garcilaso 101',
      ruc: 'RUC001',
    };

    service.actualizar(proveedor).subscribe();

    const request = http.expectOne('http://10.20.10.9:8490/api/proveedores/P001');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(proveedor);
    request.flush(proveedor);
  });
});
