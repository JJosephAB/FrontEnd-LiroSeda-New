import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('stores the JWT returned by the login endpoint', () => {
    let completed = false;
    service.iniciarSesion('admin@lirio.com', 'clave').subscribe(() => {
      completed = true;
    });

    const request = http.expectOne('https://backendliroseda.noudat.com/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: 'admin@lirio.com',
      clave: 'clave',
    });
    request.flush({ token: 'jwt-token', tipo: 'Bearer' });

    expect(completed).toBe(true);
    expect(service.estaAutenticado()).toBe(true);
    expect(sessionStorage.getItem('lirio-seda-token')).toBe('jwt-token');
  });
});
