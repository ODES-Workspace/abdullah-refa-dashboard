import { Component, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { RelativeTimePipe } from '../../../services/relative-time.pipe';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [TranslateModule, NgFor, RelativeTimePipe, NgIf, CommonModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
})
export class DashboardHeaderComponent {
  headerText: string = '';
  showNotifications = false;
  isPropertyDetailsPage = false;
  isRentalApplicationDetailsPage = false;

  constructor(
    public languageService: LanguageService,
    private router: Router,
    private elementRef: ElementRef,
    private location: Location,
    private sidebarService: SidebarService
  ) {
    this.router.events.subscribe(() => {
      this.setHeaderText();
      this.checkPropertyDetailsPage();
    });
  }

  getPastTime(minutesAgo: number): string {
    const date = new Date(Date.now() - minutesAgo * 60 * 1000);
    return date.toISOString();
  }

  notifications = [
    {
      title: 'New Property Listed',
      description:
        'A new luxury apartment has been listed in Riyadh city center.',
      propertyId: 'RYD-2024-001',
      time: this.getPastTime(5), // 5 minutes ago
      read: false,
    },
    {
      title: 'New Property Listed',
      description:
        'A new luxury apartment has been listed in Riyadh city center.',
      propertyId: 'RYD-2024-002',
      time: this.getPastTime(60), // 1 hour ago
      read: true,
    },
    {
      title: 'New Property Listed',
      description:
        'A new luxury apartment has been listed in Riyadh city center.',
      propertyId: 'RYD-2024-003',
      time: this.getPastTime(1440), // 1 day ago
      read: true,
    },
    {
      title: 'New Property Listed',
      description: 'A user is interested in one of your properties.',
      propertyId: 'RYD-2024-004',
      time: this.getPastTime(10080), // 7 days ago
      read: true,
    },
  ];

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  setHeaderText() {
    const url = this.router.url;

    if (url.includes('/admin/dashboard')) {
      this.headerText = 'Overview';
    } else if (url.includes('/admin/properties')) {
      this.headerText = 'Properties';
    } else if (/\/admin\/property\/edit\/\d+$/.test(url)) {
      this.headerText = 'Edit Property Details';
    } else if (/\/admin\/property\/\d+$/.test(url)) {
      this.headerText = 'Properties Details';
    } else if (url.includes('/admin/tenants')) {
      this.headerText = 'list of tenants';
    } else if (
      url.includes('/admin/agencies-owner-approvals') ||
      url.includes('/admin/list-of-angency-owner') ||
      url.includes('/admin/agencies-owner-rejections')
    ) {
      this.headerText = 'Agency/Owner';
    } else if (
      url.includes('/admin/rentrequests') ||
      url.includes('/admin/approved-rentrequests') ||
      url.includes('/admin/rejected-rentrequests')
    ) {
      this.headerText = 'rentrequests';
    } else if (/\/admin\/rental-application-details\/\d+$/.test(url)) {
    } else if (
      url.includes('/admin/payment') ||
      url.includes('/admin/renewal') ||
      url.includes('/admin/terminated') ||
      url.includes('/admin/existing-contract')
    ) {
      this.headerText = 'Contract';
    } else if (/\/admin\/rental-application-details\/\d+$/.test(url)) {
      this.headerText = 'Rent Requests/Rental Application Details';
    } else if (url.includes('/admin/settings')) {
      this.headerText = 'settings';
    } else {
      this.headerText = 'Dashbaord';
    }
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showNotifications = false;
    }
  }

  checkPropertyDetailsPage() {
    const url = this.router.url;
    this.isPropertyDetailsPage = /\/admin\/property\/\d+$/.test(url);
    this.isRentalApplicationDetailsPage =
      /\/admin\/rental-application-details\/\d+$/.test(url);
  }

  goBack() {
    this.location.back();
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
