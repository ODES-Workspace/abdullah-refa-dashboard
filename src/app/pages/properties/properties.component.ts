import { Component, OnInit } from '@angular/core';
import { AgentPropertiesService } from '../../../services/agent-properties.service';
import { ToastService } from '../../../services/toast.service';
import { PropertiesService } from '../../../services/properties.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Add this import
import { TranslateModule } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';
import { AdminService } from '../../../services/admin.service';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    TranslateModule,
    CommonModule,
    ToastComponent,
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  propertyPermissions: string[] = [];

  get canReadProperties(): boolean {
    // Agents can always view, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always view
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.propertyPermissions.includes('property.read')
      );
    }
    return false; // Unknown role
  }

  get canUpdateProperties(): boolean {
    // Agents can always edit, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always edit
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.propertyPermissions.includes('property.update')
      );
    }
    return false; // Unknown role
  }

  get canDeleteProperties(): boolean {
    // Agents can always delete, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always delete
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.propertyPermissions.includes('property.delete')
      );
    }
    return false; // Unknown role
  }

  properties: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  Math = Math;
  loading = false;
  error: string | null = null;
  get currentLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }

  getLocalizedPropertyName(item: any): string {
    return this.currentLanguage === 'ar' ? item.title_ar : item.title;
  }

  constructor(
    private propertiesService: PropertiesService,
    private router: Router,
    public userRoleService: UserRoleService,
    private agentPropertiesService: AgentPropertiesService,
    private toastService: ToastService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    // Check user role first - only make admin API call if user is admin
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'admin') {
      // Get admin id from user_data in localStorage and fetch admin details
      try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData.id) {
            this.adminService.getAdminById(userData.id).subscribe({
              next: (adminRes) => {
                this.adminActive = adminRes.active;
                this.propertyPermissions = (adminRes.permissions || [])
                  .filter((p) => p.name.startsWith('property.'))
                  .map((p) => p.name);
                console.log('Admin active:', this.adminActive);
                console.log('Property permissions:', this.propertyPermissions);
              },
              error: (err) => {
                console.error('Error fetching admin details:', err);
              },
            });
          }
        }
      } catch (e) {
        console.error('Error parsing user_data from localStorage:', e);
      }
    } else {
      // User is not admin, set permissions to empty array
      this.propertyPermissions = [];
      this.adminActive = null;
    }

    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('access_token') || '';
    this.agentPropertiesService
      .getAgentProperties(
        token,
        this.searchTerm,
        this.currentPage,
        this.itemsPerPage
      )
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.properties = (response?.data || []).map((item: any) => ({
            id: item.id,
            title: item.name_en,
            title_ar: item.name_ar,
            description: item.description_en,
            description_ar: item.description_ar,
            cardImage:
              item.primary_image_url || '/assets/images/default-property.jpg',
            address: {
              street: item.district,
              city: item.city,
              region: item.region,
              country: item.country,
            },
            annual_rent: item.annual_rent,
            posted_date: item.created_at,
            property_details: {
              posted_date: item.created_at,
              bedrooms: item.bedrooms,
              bathrooms: item.bathrooms,
              area: item.area,
              furnishing_status: item.furnishing_status,
            },
            category: item.category,
            type: item.type,
            images: item.images,
            amenities: item.amenities,
          }));

          // Set pagination data from API response
          this.totalItems = response?.total || response?.data?.length || 0;
          this.totalPages =
            response?.last_page ||
            Math.ceil(this.totalItems / this.itemsPerPage);
          this.currentPage = response?.current_page || 1;

          this.loading = false;
        },
        error: (err: any) => {
          console.error('API Error:', err);
          this.error = 'Failed to load properties.';
          this.toastService.show(this.error);
          this.loading = false;
        },
      });
  }

  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadProperties();
  }

  viewProperty(id: number): void {
    const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    this.router.navigate([`/${basePath}/property`, id]);
  }

  editProperty(id: number): void {
    const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    this.router.navigate([`/${basePath}/property/edit`, id]);
  }

  deleteProperty(id: number): void {
    if (confirm('Are you sure you want to delete this property?')) {
      const token = localStorage.getItem('access_token') || '';
      this.agentPropertiesService.deleteAgentProperty(id, token).subscribe({
        next: () => {
          // Reload properties after deletion
          this.loadProperties();
        },
        error: (err: any) => {
          console.error('Error deleting property:', err);
        },
      });
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProperties();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProperties();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProperties();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < this.totalPages) {
        pages.push(i);
      }
    }

    return pages;
  }

  createProperty(): void {
    this.router.navigate(['/agent/create-property']);
  }
}
