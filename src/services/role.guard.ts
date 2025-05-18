import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleService } from './user-role.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  const currentRole = userRoleService.getCurrentRole();
  const url = state.url;

  // If user is admin, prevent access to agent routes
  if (currentRole === 'admin' && url.startsWith('/agent')) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  // If user is agent, prevent access to admin routes
  if (currentRole === 'agent' && url.startsWith('/admin')) {
    router.navigate(['/agent/dashboard']);
    return false;
  }

  return true;
};
