import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserRoleService } from './user-role.service';
import { ProfileAgentService } from './profile-agent.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompleteGuard implements CanActivate {
  constructor(
    private userRoleService: UserRoleService,
    private profileAgentService: ProfileAgentService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const userRole = this.userRoleService.getCurrentRole();

    // Allow admins to access all routes
    if (userRole === 'admin') {
      return of(true);
    }

    // For agents, check if profile is complete
    if (userRole === 'agent') {
      return this.profileAgentService.getMyProfile().pipe(
        map((profile) => {
          const isComplete = this.isProfileComplete(profile);

          if (!isComplete) {
            // Redirect to profile page if incomplete
            this.router.navigate(['/agent/profile']);
            return false;
          }

          return true;
        }),
        catchError(() => {
          // If profile fetch fails, redirect to profile page
          this.router.navigate(['/agent/profile']);
          return of(false);
        })
      );
    }

    // For other roles or unauthenticated users, deny access
    this.router.navigate(['/login']);
    return of(false);
  }

  private isProfileComplete(profile: any): boolean {
    if (!profile || !profile.agent_profile) {
      return false;
    }

    const agentProfile = profile.agent_profile;

    // Check if essential profile fields are filled
    return !!(
      agentProfile.agency_name &&
      agentProfile.company_registration_id &&
      agentProfile.fal_license_number &&
      agentProfile.agency_address_line_1 &&
      agentProfile.city &&
      agentProfile.country &&
      agentProfile.account_number &&
      agentProfile.bank_name &&
      agentProfile.iban_number
    );
  }
}
