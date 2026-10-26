
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const autorizado = await auth.isAdmin();

    if (autorizado) {
      return true;
    }
  } catch (error) {
    console.error(
      'Error verificando permisos:',
      error
    );
  }

  return router.createUrlTree(['/admin/login']);
};
