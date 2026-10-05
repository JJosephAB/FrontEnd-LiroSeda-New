import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the current authenticated user and site IDs', () => {
    let result: unknown;
    service.usuarioActual().subscribe(usuario => result = usuario);

    const request = http.expectOne('https://backendliroseda.noudat.com/api/usuarios/me');
    expect(request.request.method).toBe('GET');
    request.flush({
      idUsuario: 5,
      nombre: 'Admin',
      apellido: 'Lirio',
      correo: 'admin@lirio.com',
      idSede: 3,
    });

    expect(result).toEqual({
      idUsuario: 5,
      nombre: 'Admin',
      apellido: 'Lirio',
      correo: 'admin@lirio.com',
      idSede: 3,
    });
  });
});
