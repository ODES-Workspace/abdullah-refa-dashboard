import { NgFor, NgIf } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  activeMenu: string | null = null;

  constructor(private router: Router) {}

  menuItems = [
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
        { label: 'sidebar.listOfApprovals', route: '/admin/approvals' },
        { label: 'sidebar.ListofAgency/Owner', route: '/admin/agency-owner' },
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
  ];

  ngOnInit() {
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
}
