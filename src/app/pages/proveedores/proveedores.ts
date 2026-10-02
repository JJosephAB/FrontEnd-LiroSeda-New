import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ProveedorListado {
  id: string;
  nombre: string;
  apellido: string;
  ruc: string;
  correo: string;
  telefono: string;
  direccion: string;
}

@Component({
  imports: [FormsModule],
  selector: 'app-proveedores',
  styleUrl: './proveedores.css',
  templateUrl: './proveedores.html',
})
export class Proveedores {
  proveedores: ProveedorListado[] = [];

  busqueda = '';

  get proveedoresFiltrados(): ProveedorListado[] {
    const texto = this.normalizar(this.busqueda.trim());

    return this.proveedores.filter(proveedor =>
      this.normalizar(
        `${proveedor.id} ${proveedor.nombre} ${proveedor.apellido}
         ${proveedor.ruc} ${proveedor.correo}`,
      ).includes(texto),
    );
    }

  limpiarBusqueda(): void {
    this.busqueda = '';
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
