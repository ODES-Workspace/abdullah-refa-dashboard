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
import {
  PropertyCategoriesService,
  PropertyCategory,
} from '../../../services/property-categories.service';
import {
  PropertyTypesService,
  PropertyType,
} from '../../../services/property-types.service';

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

  // Filter visibility
  showFilters: boolean = false;

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

  // Filter properties
  categories: PropertyCategory[] = [];
  types: PropertyType[] = [];
  filteredTypes: PropertyType[] = [];
  filters = {
    category_id: '',
    type_id: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    bathrooms: '',
    sort_by: 'created_at',
  };

  sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'annual_rent', label: 'Price' },
    { value: 'area', label: 'Area' },
    { value: 'bedrooms', label: 'Bedrooms' },
  ];
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
    private adminService: AdminService,
    private propertyCategoriesService: PropertyCategoriesService,
    private propertyTypesService: PropertyTypesService
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
    this.loadCategories();
    this.loadTypes();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('access_token') || '';

    // Build filter parameters
    const filterParams = {
      search: this.searchTerm,
      page: this.currentPage,
      per_page: this.itemsPerPage,
      category_id: this.filters.category_id || undefined,
      type_id: this.filters.type_id || undefined,
      min_price: this.filters.min_price || undefined,
      max_price: this.filters.max_price || undefined,
      bedrooms: this.filters.bedrooms || undefined,
      bathrooms: this.filters.bathrooms || undefined,
      sort_by: this.filters.sort_by,
    };

    this.agentPropertiesService
      .getAgentPropertiesWithFilters(token, filterParams)
      .subscribe({
        next: (response: any) => {
          console.log('Full API Response:', response);
          console.log('Response meta:', response?.meta);
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

          // Set pagination data from API response - check both direct and meta structure
          this.totalItems =
            response?.meta?.total?.[0] ||
            response?.total ||
            response?.data?.length ||
            0;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.currentPage =
            response?.meta?.current_page?.[0] || response?.current_page || 1;

          console.log('Total Items:', this.totalItems);
          console.log('Total Pages:', this.totalPages);
          console.log('Current Page:', this.currentPage);

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

  loadCategories(): void {
    this.propertyCategoriesService.getPropertyCategories().subscribe({
      next: (response) => {
        this.categories = response.data || [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      },
    });
  }

  loadTypes(): void {
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (response) => {
        this.types = response.data || [];
        this.filteredTypes = this.types;
      },
      error: (err) => {
        console.error('Error loading types:', err);
      },
    });
  }

  onCategoryChange(): void {
    if (this.filters.category_id) {
      this.filteredTypes = this.types.filter(
        (type) =>
          type.property_category_id === parseInt(this.filters.category_id)
      );
      this.filters.type_id = ''; // Reset type selection
    } else {
      this.filteredTypes = this.types;
    }
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  clearFilters(): void {
    this.filters = {
      category_id: '',
      type_id: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      sort_by: 'created_at',
    };
    this.filteredTypes = this.types;
    this.currentPage = 1;
    this.loadProperties();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getLocalizedCategoryName(category: PropertyCategory): string {
    return this.currentLanguage === 'ar' ? category.name_ar : category.name_en;
  }

  getLocalizedTypeName(type: PropertyType): string {
    return this.currentLanguage === 'ar' ? type.name_ar : type.name_en;
  }
}
