import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuariosService } from '../../services/usuarios.service';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  const perfil = {
    idUsuario: 7,
    nombre: 'Alexandra',
    apellido: 'Vilchez Peña',
    correo: 'avilchez@lirio.com',
    telefono: '987654321',
    documento: '12345678',
    idRol: 1,
    idSede: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [{
        provide: UsuariosService,
        useValue: { usuarioActual: () => of(perfil) },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the authenticated user profile details', () => {
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;

    expect(rendered.textContent).toContain('Alexandra Vilchez Peña');
    expect(rendered.textContent).toContain('avilchez@lirio.com');
    expect(rendered.textContent).toContain('987654321');
    expect(rendered.textContent).toContain('12345678');
    expect(rendered.textContent).toContain('Rol 1');
  });
});
