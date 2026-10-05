import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink,RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly menuItems = [
    {
      label: 'Resumen',
      icon: 'assets/icons/resumen.svg',
      route: '/resumen',
    },
    {
      label: 'Productos',
      icon: 'assets/icons/productos.svg',
      route: '/productos',
    },
    {
      label: 'Proveedores',
      icon: 'assets/icons/proveedores.svg',
      route: '/proveedores',
    },
    {
      label: 'Pedidos',
      icon: 'assets/icons/pedidos.svg',
      route: '/pedidos',
    },
    {
      label: 'Entradas',
      icon: 'assets/icons/inventario.svg',
      route: '/entradas',
    },
    {
      label: 'Bajas de inventario',
      icon: 'assets/icons/inventario.svg',
      route: '/bajas',
    },
  ];
}
