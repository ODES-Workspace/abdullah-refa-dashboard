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

  const currentRole = userRoleService.getCurrentRole();
  const url = state.url;

  // If user is agent, prevent access to admin routes (regardless of active status)
  if (currentRole === 'agent' && url.startsWith('/admin')) {
    // Redirect to the last agent page or fallback to /agent/profile
    const lastAgentUrl =
      localStorage.getItem('last_agent_url') || '/agent/profile';
    router.navigate([lastAgentUrl]);
    return false;
  }

  // Check if user is active
  // Allow inactive agents to access any agent route, but let route-specific guards handle redirects
  // Note: For agents, active status should be checked by ProfileCompleteGuard using API data
  if (!userRoleService.isUserActive() && currentRole !== 'agent') {
    // For all non-agent cases, redirect to login
    router.navigate(['/login']);
    return false;
  }

  // If user is admin, prevent access to agent routes
  if (currentRole === 'admin' && url.startsWith('/agent')) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  // Store last visited agent page for agent users
  if (currentRole === 'agent' && url.startsWith('/agent')) {
    localStorage.setItem('last_agent_url', url);
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
 * Note: Active status is now checked by ProfileCompleteGuard using API data
 */
export const agentGuard: CanActivateFn = (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!userRoleService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is agent (don't check active status here - let ProfileCompleteGuard handle it)
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

  // If user is authenticated, always redirect to dashboard (never allow login/signup)
  if (userRoleService.isAuthenticated()) {
    const user = userRoleService.getCurrentUser();
    if (user && user.type === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/agent/dashboard';
    }
    return false;
  }

  return true;
};
