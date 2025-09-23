import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { RelativeTimePipe } from '../../../services/relative-time.pipe';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import {
  NotificationsService,
  Notification,
} from '../../../services/notifications.service';
import {
  AgentPropertiesService,
  PropertiesResponse,
} from '../../../services/agent-properties.service';
import {
  RentRequestsService,
  RentRequestInvitationPayload,
} from '../../../services/rent-requests.service';
import { Property } from '../../../services/dashboard.service';
import { UserRoleService } from '../../../services/user-role.service';
import { ToastService } from '../../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [
    TranslateModule,
    NgFor,
    RelativeTimePipe,
    NgIf,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  headerText: string = '';
  showNotifications = false;
  isPropertyDetailsPage = false;
  isRentalApplicationDetailsPage = false;
  isCreatePropertyPage = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  currentPage = 1;
  isLoading = false;
  hasMoreNotifications = true;

  // Rent Request Invitation Properties
  agentProperties: Property[] = [];
  isLoadingProperties = false;
  selectedProperty: Property | null = null;
  selectedPropertyId = '';
  customerPhone = '';
  isInvitationModalOpen = false;
  isCreatingInvitation = false;
  invitationResult = '';
  lang = 'en';

  private subscriptions: Subscription[] = [];

  constructor(
    public languageService: LanguageService,
    private router: Router,
    private elementRef: ElementRef,
    private location: Location,
    private sidebarService: SidebarService,
    private notificationsService: NotificationsService,
    private agentPropertiesService: AgentPropertiesService,
    private rentRequestsService: RentRequestsService,
    private userRoleService: UserRoleService,
    private toastService: ToastService
  ) {
    this.router.events.subscribe(() => {
      this.setHeaderText();
      this.checkPropertyDetailsPage();
    });
  }

  ngOnInit() {
    this.loadNotifications();
    this.subscribeToNotifications();
    this.lang = this.languageService.translate.currentLang || 'en';

    // Subscribe to language changes
    const langSub = this.languageService.translate.onLangChange.subscribe(
      (event: any) => {
        this.lang = event.lang;
      }
    );
    this.subscriptions.push(langSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private subscribeToNotifications() {
    const notificationsSub = this.notificationsService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );

    const unreadCountSub = this.notificationsService.unreadCount$.subscribe(
      (count) => {
        this.unreadCount = count;
      }
    );

    this.subscriptions.push(notificationsSub, unreadCountSub);
  }

  private loadNotifications() {
    this.isLoading = true;
    this.notificationsService.getNotifications(this.currentPage).subscribe({
      next: (response) => {
        this.notifications = response.data;
        this.hasMoreNotifications = this.currentPage < response.last_page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      },
    });
  }

  loadMoreNotifications() {
    if (this.isLoading || !this.hasMoreNotifications) return;

    this.currentPage++;
    this.isLoading = true;

    this.notificationsService
      .loadMoreNotifications(this.currentPage - 1)
      .subscribe({
        next: (response) => {
          this.hasMoreNotifications = this.currentPage < response.last_page;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading more notifications:', error);
          this.currentPage--; // Revert page increment on error
          this.isLoading = false;
        },
      });
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      },
    });
  }

  markNotificationAsRead(notificationId: string) {
    this.notificationsService.markAsRead(notificationId).subscribe({
      next: () => {
        console.log('Notification marked as read');
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      },
    });
  }

  handleNotificationClick(notification: Notification) {
    // Mark as read first
    this.markNotificationAsRead(notification.id);

    // Navigate based on notification type
    if (notification.data.type === 'contract') {
      // Navigate to existing contracts page
      const roleSegment = this.router.url.includes('/admin/')
        ? 'admin'
        : 'agent';
      this.router.navigate([`/${roleSegment}/existing-contract`]);
    } else if (notification.data.type === 'rent_request') {
      // Navigate to rental application details page
      const roleSegment = this.router.url.includes('/admin/')
        ? 'admin'
        : 'agent';
      this.router.navigate([
        `/${roleSegment}/rental-application-details/${notification.data.id}`,
      ]);
    }

    // Close notifications dropdown
    this.showNotifications = false;
  }

  setHeaderText() {
    const url = this.router.url;

    if (url.includes('/admin/dashboard') || url.includes('/agent/dashboard')) {
      this.headerText = 'Overview';
    } else if (
      url.includes('/admin/properties') ||
      url.includes('/agent/properties')
    ) {
      this.headerText = 'Properties';
    } else if (
      /\/admin\/property\/edit\/\d+$/.test(url) ||
      /\/agent\/property\/edit\/\d+$/.test(url)
    ) {
      this.headerText = 'Edit Property Details';
    } else if (
      /\/admin\/property\/\d+$/.test(url) ||
      /\/agent\/property\/\d+$/.test(url)
    ) {
      this.headerText = 'Properties Details';
    } else if (/\/agent\/create-property$/.test(url)) {
      this.headerText = 'my peroperties/Add New Property';
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
      url.includes('/admin/rejected-rentrequests') ||
      url.includes('/agent/rentrequests') ||
      url.includes('/agent/approved-rentrequests') ||
      url.includes('/agent/rejected-rentrequests')
    ) {
      this.headerText = 'rentrequests';
    } else if (
      /\/admin\/rental-application-details\/\d+$/.test(url) ||
      /\/agent\/rental-application-details\/\d+$/.test(url)
    ) {
      this.headerText = 'Rent Requests/Rental Application Details';
    } else if (
      url.includes('/admin/payment') ||
      url.includes('/admin/renewal') ||
      url.includes('/admin/terminated') ||
      url.includes('/admin/existing-contract') ||
      url.includes('/agent/existing-contract')
    ) {
      this.headerText = 'Contract';
    } else if (/\/admin\/rental-application-details\/\d+$/.test(url)) {
      this.headerText = 'Rent Requests/Rental Application Details';
    } else if (url.includes('/admin/settings')) {
      this.headerText = 'settings';
    } else if (url.includes('/agent/profile')) {
      this.headerText = 'profile';
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

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showNotifications = false;
    }
  }

  checkPropertyDetailsPage() {
    const url = this.router.url;
    this.isPropertyDetailsPage =
      /\/admin\/property\/\d+$/.test(url) ||
      /\/agent\/property\/\d+$/.test(url);
    this.isRentalApplicationDetailsPage =
      /\/admin\/rental-application-details\/\d+$/.test(url) ||
      /\/agent\/rental-application-details\/\d+$/.test(url);
    this.isCreatePropertyPage = /\/agent\/create-property$/.test(url);
  }

  goBack() {
    this.location.back();
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // Rent Request Invitation Methods
  isAgent(): boolean {
    return !this.userRoleService.isAdmin();
  }

  openRentRequestModal() {
    console.log('Opening rent request modal...');
    console.log('User role:', this.userRoleService.getCurrentRole());
    console.log('Is agent:', this.isAgent());

    if (!this.isAgent()) {
      console.error('User is not an agent, cannot open modal');
      return;
    }

    this.isInvitationModalOpen = true;
    this.selectedProperty = null;
    this.selectedPropertyId = '';
    this.customerPhone = '';
    this.invitationResult = '';

    if (this.agentProperties.length === 0) {
      this.loadAgentProperties();
    }
  }

  onPropertySelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const propertyId = parseInt(target.value);

    if (propertyId) {
      const property = this.agentProperties.find((p) => p.id === propertyId);
      if (property) {
        this.selectedProperty = property;
        this.selectedPropertyId = target.value;
      }
    }
  }
  loadAgentProperties() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access_token found in localStorage');
      this.toastService.show(
        'Authentication token not found. Please login again.'
      );
      return;
    }

    console.log(
      'Loading agent properties with token:',
      token.substring(0, 20) + '...'
    );
    this.isLoadingProperties = true;

    this.agentPropertiesService.getAgentProperties(token, '', 1, 50).subscribe({
      next: (response: PropertiesResponse) => {
        console.log('Agent properties response:', response);
        this.agentProperties = response.data || [];
        this.isLoadingProperties = false;

        if (this.agentProperties.length === 0) {
          console.warn('No properties found for this agent');
          this.toastService.show(
            'No properties found. Please add some properties first.'
          );
        }
      },
      error: (error) => {
        console.error('Error loading agent properties:', error);
        this.isLoadingProperties = false;

        // More detailed error handling
        if (error.status === 401) {
          this.toastService.show('Authentication failed. Please login again.');
        } else if (error.status === 403) {
          this.toastService.show(
            'Access denied. You may not have permission to view properties.'
          );
        } else if (error.status === 404) {
          this.toastService.show('Properties endpoint not found.');
        } else if (error.status === 0) {
          this.toastService.show(
            'Network error. Please check your connection.'
          );
        } else {
          this.toastService.show(
            'Failed to load properties. Please try again.'
          );
        }
      },
    });
  }

  selectProperty(property: Property) {
    this.selectedProperty = property;
  }

  changeProperty() {
    this.selectedProperty = null;
    this.selectedPropertyId = '';
  }

  closeInvitationModal() {
    this.isInvitationModalOpen = false;
    this.selectedProperty = null;
    this.selectedPropertyId = '';
    this.customerPhone = '';
    this.invitationResult = '';
    this.isCreatingInvitation = false;
  }

  createRentRequestInvitation(): void {
    if (!this.customerPhone.trim() || !this.selectedProperty) {
      this.toastService.show('Please enter a valid phone number');
      return;
    }

    this.isCreatingInvitation = true;

    const payload: RentRequestInvitationPayload = {
      property_id: this.selectedProperty.id,
      customer_phone: this.customerPhone.trim(),
    };

    this.rentRequestsService.createRentRequestInvitation(payload).subscribe({
      next: (response) => {
        this.invitationResult = response.deeplink;
        this.isCreatingInvitation = false;
        this.toastService.show('Rent request invitation created successfully!');
      },
      error: (error) => {
        console.error('Error creating rent request invitation:', error);
        this.isCreatingInvitation = false;

        let errorMessage = 'Failed to create rent request invitation';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 422 && error.error?.errors) {
          const firstError = Object.values(error.error.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0] as string;
          }
        }

        this.toastService.show(errorMessage);
      },
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastService.show('Link copied to clipboard!');
      })
      .catch(() => {
        this.toastService.show('Failed to copy link');
      });
  }
}
