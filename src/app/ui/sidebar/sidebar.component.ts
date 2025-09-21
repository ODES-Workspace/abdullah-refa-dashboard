import { NgFor, NgIf } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserRoleService, UserRole } from '../../../services/user-role.service';
import { AgentService, AgentMeResponse } from '../../../services/agent.service';
import { AdminService, AdminProfile } from '../../../services/admin.service';

interface SubMenuItem {
  label: string;
  route: string;
}

interface MenuItem {
  name: string;
  label: string;
  route: string;
  submenu?: SubMenuItem[];
  icon: {
    active: string;
    inactive: string;
  };
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, TranslateModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  activeMenu: string | null = null;
  showLogoutModal: boolean = false;
  isOpen$!: Observable<boolean>;
  userRole$!: Observable<UserRole>;
  isLoading = false;
  agentProfileData: AgentMeResponse | null = null;
  adminProfileData: AdminProfile | null = null;

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private userRoleService: UserRoleService,
    private agentService: AgentService,
    private adminService: AdminService
  ) {}

  // Admin menu items
  menuItems: MenuItem[] = [
    {
      name: 'dashboard',
      label: 'sidebar.dashboard',
      route: '/admin/dashboard',
      icon: {
        active: '/assets/icons/dashboard-active.svg',
        inactive: '/assets/icons/dashboard-inactive.svg',
      },
    },
    {
      name: 'properties',
      label: 'sidebar.properties',
      route: '/admin/properties',
      icon: {
        active: '/assets/icons/properties-active.svg',
        inactive: '/assets/icons/properties-inactive.svg',
      },
    },
    {
      name: 'tenants',
      label: 'sidebar.tenants',
      route: '/admin/tenants',
      icon: {
        active: '/assets/icons/tenants-active.svg',
        inactive: '/assets/icons/tenants-inactive.svg',
      },
    },
    {
      name: 'agencies-owner',
      label: 'sidebar.agenciesOwner',
      route: '',
      submenu: [
        {
          label: 'sidebar.listOfApprovals',
          route: '/admin/agencies-owner-approvals',
        },
        {
          label: 'sidebar.ListofAgency/Owner',
          route: '/admin/list-of-angency-owner',
        },
        {
          label: 'sidebar.ListofRejections',
          route: '/admin/agencies-owner-rejections',
        },
      ],
      icon: {
        active: '/assets/icons/agenciesowner-active.svg',
        inactive: '/assets/icons/agenciesowner-inactive.svg',
      },
    },
    {
      name: 'rent-request',
      label: 'sidebar.rentrequest',
      route: '',
      submenu: [
        {
          label: 'sidebar.rentrequests',
          route: '/admin/rentrequests',
        },
        {
          label: 'sidebar.approved',
          route: '/admin/approved-rentrequests',
        },
        {
          label: 'sidebar.rejected',
          route: '/admin/rejected-rentrequests',
        },
      ],
      icon: {
        active: '/assets/icons/rent-active.svg',
        inactive: '/assets/icons/rent-inactive.svg',
      },
    },
    {
      name: 'contracts',
      label: 'sidebar.contracts',
      route: '',
      submenu: [
        {
          label: 'sidebar.payment',
          route: '/admin/payment',
        },
        {
          label: 'sidebar.renewal',
          route: '/admin/renewal',
        },
        {
          label: 'sidebar.terminated',
          route: '/admin/terminated',
        },
        {
          label: 'sidebar.existing-contracts',
          route: '/admin/existing-contract',
        },
      ],
      icon: {
        active: '/assets/icons/contracts-active.svg',
        inactive: '/assets/icons/contracts-inactive.svg',
      },
    },
    {
      name: 'settings',
      label: 'sidebar.settings',
      route: '/admin/settings',
      icon: {
        active: '/assets/icons/settings-active.svg',
        inactive: '/assets/icons/settings-inactive.svg',
      },
    },
  ];

  // Agent menu items
  agentMenuItems: MenuItem[] = [
    {
      name: 'dashboard',
      label: 'sidebar.dashboard',
      route: '/agent/dashboard',
      icon: {
        active: '/assets/icons/dashboard-active.svg',
        inactive: '/assets/icons/dashboard-inactive.svg',
      },
    },
    {
      name: 'properties',
      label: 'sidebar.properties',
      route: '/agent/properties',
      icon: {
        active: '/assets/icons/properties-active.svg',
        inactive: '/assets/icons/properties-inactive.svg',
      },
    },
    {
      name: 'rent-request',
      label: 'sidebar.rentrequest',
      route: '',
      submenu: [
        {
          label: 'sidebar.rentrequests',
          route: '/agent/rentrequests',
        },
        {
          label: 'sidebar.approved',
          route: '/agent/approved-rentrequests',
        },
        {
          label: 'sidebar.rejected',
          route: '/agent/rejected-rentrequests',
        },
      ],
      icon: {
        active: '/assets/icons/rent-active.svg',
        inactive: '/assets/icons/rent-inactive.svg',
      },
    },
    {
      name: 'contracts',
      label: 'sidebar.contracts',
      route: '/agent/existing-contract',

      icon: {
        active: '/assets/icons/contracts-active.svg',
        inactive: '/assets/icons/contracts-inactive.svg',
      },
    },
    {
      name: 'Profile',
      label: 'sidebar.profile',
      route: '/agent/profile',
      icon: {
        active: '/assets/icons/profile-active.svg',
        inactive: '/assets/icons/profile-inactive.svg',
      },
    },
  ];
  ngOnInit() {
    this.isOpen$ = this.sidebarService.isOpen$;
    this.userRole$ = this.userRoleService.userRole$;
    this.checkActiveMenuFromRoute(this.router.url);

    // Fetch agent profile data if user is an agent
    this.userRole$.subscribe((role) => {
      if (role === 'agent') {
        this.fetchAgentProfile();
      } else if (role === 'admin') {
        this.fetchAdminProfile();
      }
    });

    // Subscribe to user data updates
    this.userRoleService.userDataUpdated$.subscribe((updated) => {
      if (updated) {
        const currentRole = this.userRoleService.getCurrentRole();
        if (currentRole === 'agent') {
          this.fetchAgentProfile();
        } else if (currentRole === 'admin') {
          this.fetchAdminProfile();
        }
      }
    });

    // Subscribe to admin profile updates
    this.adminService.profileUpdated$.subscribe(() => {
      if (this.userRoleService.getCurrentRole() === 'admin') {
        this.fetchAdminProfile();
      }
    });

    // Subscribe to agent profile updates
    this.agentService.profileUpdated$.subscribe(() => {
      if (this.userRoleService.getCurrentRole() === 'agent') {
        this.fetchAgentProfile();
      }
    });

    this.router.events
      .pipe(
        filter(
          (event: Event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.checkActiveMenuFromRoute(event.urlAfterRedirects);

        // Refresh admin profile when navigating away from settings page
        if (
          this.userRoleService.getCurrentRole() === 'admin' &&
          event.urlAfterRedirects.includes('/admin/settings')
        ) {
          // Refresh admin profile after a short delay to allow for any updates
          setTimeout(() => {
            this.fetchAdminProfile();
          }, 500);
        }
      });
  }

  checkActiveMenuFromRoute(url: string) {
    for (const item of this.menuItems) {
      if (item.submenu) {
        const isChildActive = item.submenu.some(
          (subItem) => url === subItem.route
        );
        if (isChildActive) {
          this.activeMenu = item.name;
          return;
        }
      }
    }
  }

  toggleMenu(menuName: string) {
    if (this.activeMenu === menuName) {
      this.activeMenu = null;
    } else {
      this.activeMenu = menuName;
    }
  }

  navigateTo(item: any) {
    if (!item.submenu && item.route) {
      this.router.navigate([item.route]);
      this.activeMenu = null;
    } else {
      this.toggleMenu(item.name);
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  isChildRouteActive(item: any): boolean {
    if (!item.submenu) return false;
    return item.submenu.some((subItem: any) =>
      this.isActiveRoute(subItem.route)
    );
  }

  logout() {
    this.isLoading = true;

    this.agentService.logoutAgent().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error.message);
        this.isLoading = false;
        this.showLogoutModal = false;
        // Still redirect to login even if API fails
        this.router.navigate(['/login']);
      },
    });
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // Fetch agent profile data
  fetchAgentProfile() {
    this.agentService.getAgentProfile().subscribe({
      next: (response) => {
        this.agentProfileData = response;
      },
      error: (error) => {
        console.error('Error fetching agent profile:', error);
      },
    });
  }

  // Fetch admin profile data
  fetchAdminProfile() {
    this.adminService.getAdminProfile().subscribe({
      next: (response) => {
        this.adminProfileData = response;
      },
      error: (error) => {
        console.error('Error fetching admin profile:', error);
      },
    });
  }

  // Public method to refresh admin profile (can be called from other components)
  refreshAdminProfile() {
    if (this.userRoleService.getCurrentRole() === 'admin') {
      this.fetchAdminProfile();
    }
  }

  // Public method to refresh agent profile (can be called from other components)
  refreshAgentProfile() {
    if (this.userRoleService.getCurrentRole() === 'agent') {
      this.fetchAgentProfile();
    }
  }

  // Get user information for display
  getUserName(): string {
    if (this.userRoleService.getCurrentRole() === 'agent') {
      if (this.agentProfileData) {
        // Fallback to agent name if agency_name is empty or undefined
        const agencyName = this.agentProfileData.agent_profile?.agency_name;
        return agencyName && agencyName.trim()
          ? agencyName
          : this.agentProfileData.name;
      }
      // Fallback to user data from UserRoleService if profile data is not loaded yet
      const currentUser = this.userRoleService.getCurrentUser();
      return currentUser ? currentUser.name : '';
    } else if (this.userRoleService.getCurrentRole() === 'admin') {
      return this.adminProfileData ? this.adminProfileData.name : '';
    }
    return '';
  }

  getUserEmail(): string {
    if (this.userRoleService.getCurrentRole() === 'agent') {
      return this.agentProfileData ? this.agentProfileData.email : '';
    } else if (this.userRoleService.getCurrentRole() === 'admin') {
      return this.adminProfileData ? this.adminProfileData.email : '';
    }
    return '';
  }

  // Check if agent profile is complete
  isAgentProfileComplete(): boolean {
    if (this.userRoleService.getCurrentRole() !== 'agent' || !this.agentProfileData) {
      return false;
    }

    const profile = this.agentProfileData.agent_profile;
    if (!profile) {
      return false;
    }

    // Check if essential profile fields are filled
    return !!(
      profile.agency_name &&
      profile.company_registration_id &&
      profile.fal_license_number &&
      profile.agency_address_line_1 &&
      profile.city &&
      profile.country &&
      profile.account_number &&
      profile.bank_name &&
      profile.iban_number
    );
  }

  // Get appropriate menu items based on profile completeness
  getAgentMenuItems(): MenuItem[] {
    if (this.isAgentProfileComplete()) {
      return this.agentMenuItems;
    } else {
      // Return only the Profile menu item if profile is incomplete
      return this.agentMenuItems.filter(item => item.name === 'Profile');
    }
  }
}
