
import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { ProductDetail } from './pages/product-detail/product-detail';
import { About } from './pages/about/about';
import { Admin } from './pages/admin/admin';
import { AdminLogin } from './pages/admin-login/admin-login';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'nosotras',
    component: About
  },
  {
    path: 'producto/:slug',
    component: ProductDetail
  },
  {
    path: 'admin/login',
    component: AdminLogin
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
