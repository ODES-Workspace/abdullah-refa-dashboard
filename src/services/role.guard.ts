import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleService } from './user-role.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!userRoleService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is active
  if (!userRoleService.isUserActive()) {
    router.navigate(['/login']);
    return false;
  }

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

/**
 * Guard for admin-only routes
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!userRoleService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is active
  if (!userRoleService.isUserActive()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is admin
  if (!userRoleService.isAdmin()) {
    router.navigate(['/agent/dashboard']);
    return false;
  }

  return true;
};

/**
 * Guard for agent-only routes
 */
export const agentGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!userRoleService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is active
  if (!userRoleService.isUserActive()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is agent
  if (!userRoleService.isAgent()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};

/**
 * Guard to prevent authenticated users from accessing auth pages (login/signup)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  // If user is authenticated, redirect to appropriate dashboard
  if (userRoleService.isAuthenticated() && userRoleService.isUserActive()) {
    const currentRole = userRoleService.getCurrentRole();

    if (currentRole === 'admin') {
      router.navigate(['/admin/dashboard']);
    } else {
      router.navigate(['/agent/dashboard']);
    }
    return false;
  }

  return true;
};
