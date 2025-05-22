import { NgFor, NgIf } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserRoleService, UserRole } from '../../../services/user-role.service';

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

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private userRoleService: UserRoleService
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
  ];
  ngOnInit() {
    this.isOpen$ = this.sidebarService.isOpen$;
    this.userRole$ = this.userRoleService.userRole$;
    this.checkActiveMenuFromRoute(this.router.url);

    this.router.events
      .pipe(
        filter(
          (event: Event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.checkActiveMenuFromRoute(event.urlAfterRedirects);
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
    // Clear any stored auth data/tokens here if needed
    this.router.navigate(['/']);
    this.showLogoutModal = false;
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
