import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { Resumen } from './pages/resumen/resumen';
import { Productos } from './pages/productos/productos';
import { Proveedores } from './pages/proveedores/proveedores';
import { Pedidos } from './pages/pedidos/pedidos';
import { Bajas } from './pages/bajas/bajas';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: Login,
        title: 'Iniciar sesión · LirioSeda',
    },
    {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'resumen',
        pathMatch: 'full',
      },
      {
        path: 'resumen',
        component: Resumen,
        title: 'Resumen · LirioSeda',
      },
      {
        path: 'productos',
        component: Productos,
        title: 'Productos · LirioSeda',
      },
      {
        path: 'proveedores',
        component: Proveedores,
        title: 'Proveedores · LirioSeda',
      },
      {
        path: 'pedidos',
        component: Pedidos,
        title: 'Pedidos · LirioSeda',
      },
      {
        path: 'bajas',
        component: Bajas,
        title: 'Bajas de inventario · LirioSeda',
      },
      
    ],
  },
  {
    path: '**',
    redirectTo: 'resumen',
  },
];
