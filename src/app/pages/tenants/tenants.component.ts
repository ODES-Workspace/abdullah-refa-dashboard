import { NgFor, NgIf, KeyValuePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  TenantsService,
  Tenant,
  TenantsResponse,
  UpdateTenantPayload,
} from '../../../services/tenants.service';
import { CitiesService, City } from '../../../services/cities.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';

interface TableItem {
  id: number;
  name: string;
  mobile: string;
  email: string;
  city: string;
  cityId?: number;
  DateAdded: string;
  monthly_installment?: number;
  property_name?: string;
}

@Component({
  selector: 'app-tenants',
  imports: [
    FormsModule,
    NgFor,
    NgIf,
    TranslateModule,
    ToastComponent,
    KeyValuePipe,
  ],
  standalone: true,
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent implements OnInit {
  allItems: TableItem[] = [];

  searchTerm = '';
  filteredItems: TableItem[] = [];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  showViewModal = false;
  showEditModal = false;
  selectedTenant: TableItem | null = null;
  isLoading = false;

  // Validation error properties
  validationErrors: { [key: string]: string[] } = {};
  validationMessage: string | null = null;

  // Server-side pagination metadata
  apiTotal: number = 0;
  apiPerPage: number = 10;
  apiLastPage: number = 1;
  apiFrom: number | null = null;
  apiTo: number | null = null;

  // Cities data
  cities: City[] = [];
  currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

  // Track sorting state
  currentSortColumn: keyof TableItem | null = null;
  isSortAscending = true;

  // Server-side pagination getters
  get totalPages(): number {
    return this.apiLastPage || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.apiFrom ? this.apiFrom - 1 : 0;
  }

  get paginationEnd(): number {
    return this.apiTo ?? this.paginatedItems.length;
  }

  // Helper for template to check if there are validation errors
  get hasValidationErrors(): boolean {
    const hasFieldErrors =
      this.validationErrors &&
      Object.keys(this.validationErrors || {}).length > 0;
    return !!this.validationMessage || hasFieldErrors;
  }

  // Method to normalize error messages (remove underscores)
  normalizeErrorMessage(message: string): string {
    if (!message) return '';
    return message.replace(/_/g, ' ');
  }

  constructor(
    private tenantsService: TenantsService,
    private citiesService: CitiesService,
    private translate: TranslateService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadReferenceData(() => this.loadPage(1));

    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.relocalizeLabels();
      }
    });
  }

  private loadPage(page: number): void {
    this.isLoading = true;
    this.tenantsService.getTenants(page, this.apiPerPage).subscribe({
      next: (response: TenantsResponse) => {
        console.log('Tenants API Response:', response);

        // Update pagination metadata
        this.apiTotal = response.total;
        this.apiPerPage = response.per_page;
        this.apiLastPage = response.last_page;
        this.apiFrom = response.from ?? null;
        this.apiTo = response.to ?? null;
        this.currentPage = response.current_page;

        // Map and assign data
        const items = this.mapTenantsToTableItems(response.data);
        this.allItems = items;
        this.filteredItems = [...items];
        this.paginatedItems = [...items]; // Server already paginated
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        // Reset to empty state on error
        this.allItems = [];
        this.filteredItems = [];
        this.paginatedItems = [];
        this.apiTotal = 0;
        this.apiLastPage = 1;
        this.apiFrom = null;
        this.apiTo = null;
        this.isLoading = false;
      },
    });
  }

  private loadReferenceData(onComplete?: () => void): void {
    const cities$ = this.citiesService.getCities();

    cities$.subscribe({
      next: (citiesRes) => {
        this.cities = citiesRes || [];

        if (this.allItems && this.allItems.length > 0) {
          this.applyCityNamesFromMaps();
        }

        if (onComplete) onComplete();
      },
      error: () => {
        if (onComplete) onComplete();
      },
    });
  }

  private getCityName(cityId: number): string {
    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return '-';

    return this.currentLang === 'ar' ? city.name_ar : city.name_en;
  }

  private relocalizeLabels(): void {
    this.applyCityNamesFromMaps();
  }

  private applyCityNamesFromMaps(): void {
    this.allItems = this.allItems.map((it) => ({
      ...it,
      city: it.cityId ? this.getCityName(it.cityId) : it.city,
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private mapTenantsToTableItems(tenants: Tenant[]): TableItem[] {
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      mobile: tenant.phone,
      email: tenant.email,
      city: tenant.city_id
        ? this.getCityName(tenant.city_id)
        : tenant.property?.city || 'N/A',
      cityId: tenant.city_id,
      DateAdded: new Date(tenant.created_at).toLocaleDateString('en-GB'),
      monthly_installment: tenant.monthly_installment,
      property_name: tenant.property?.name_en || 'N/A',
    }));
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTermLower) ||
        item.mobile.toLowerCase().includes(searchTermLower) ||
        item.email.toLowerCase().includes(searchTermLower)
    );
    // For client-side search on current page data
    this.paginatedItems = [...this.filteredItems];
  }

  sortBy(key: keyof TableItem): void {
    if (this.currentSortColumn === key) {
      this.isSortAscending = !this.isSortAscending;
    } else {
      this.currentSortColumn = key;
      this.isSortAscending = true;
    }

    // Sort current page data
    this.filteredItems.sort((a, b) => {
      const valueA = (a[key] ?? '').toString().toLowerCase();
      const valueB = (b[key] ?? '').toString().toLowerCase();

      if (valueA < valueB) {
        return this.isSortAscending ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.isSortAscending ? 1 : -1;
      }
      return 0;
    });

    this.paginatedItems = [...this.filteredItems];
  }

  updatePagination(): void {
    // No longer needed for server-side pagination
    // Data is already paginated by the server
  }

  // Server-side pagination navigation
  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPage(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadPage(page);
    }
  }

  openViewModal(tenant: TableItem): void {
    this.selectedTenant = { ...tenant };
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTenant = null;
  }

  openEditModal(tenant: TableItem): void {
    this.selectedTenant = { ...tenant };
    this.showEditModal = true;

    // Clear any previous validation errors
    this.validationErrors = {};
    this.validationMessage = null;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTenant = null;

    // Clear validation errors when closing modal
    this.validationErrors = {};
    this.validationMessage = null;
  }

  saveTenantChanges(): void {
    if (!this.selectedTenant) return;

    const selectedTenant = this.selectedTenant; // Create a non-null reference

    const payload: UpdateTenantPayload = {
      name: selectedTenant.name,
      email: selectedTenant.email,
      phone: selectedTenant.mobile,
      city_id: selectedTenant.cityId,
    };

    this.tenantsService.updateTenant(selectedTenant.id, payload).subscribe({
      next: (response) => {
        console.log('Update tenant API response:', response);

        // Update the item in local arrays
        const index = this.allItems.findIndex(
          (item) => item.id === selectedTenant.id
        );

        if (index !== -1) {
          // Check if response has tenant data, otherwise use selectedTenant data
          const updatedTenant = response.tenant || response;

          if (updatedTenant && typeof updatedTenant === 'object') {
            this.allItems[index] = {
              ...this.allItems[index],
              name: updatedTenant.name || selectedTenant.name,
              mobile: updatedTenant.phone || selectedTenant.mobile,
              email: updatedTenant.email || selectedTenant.email,
              city: updatedTenant.city_id
                ? this.getCityName(updatedTenant.city_id)
                : selectedTenant.cityId
                ? this.getCityName(selectedTenant.cityId)
                : selectedTenant.city,
              cityId: updatedTenant.city_id || selectedTenant.cityId,
            };
          } else {
            // Fallback: use selectedTenant data if response doesn't have tenant object
            this.allItems[index] = {
              ...this.allItems[index],
              name: selectedTenant.name,
              mobile: selectedTenant.mobile,
              email: selectedTenant.email,
              city: selectedTenant.cityId
                ? this.getCityName(selectedTenant.cityId)
                : selectedTenant.city,
              cityId: selectedTenant.cityId,
            };
          }

          // Update filtered items
          this.onSearch();
        }

        this.toastService.show('Tenant updated successfully!');
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating tenant:', error);
        if (error.status === 422) {
          // Handle validation errors - display them below the form
          this.validationMessage = error.error?.message || null;
          this.validationErrors = error.error?.errors || {};
        } else {
          // For non-validation errors, show toast
          this.toastService.show('Failed to update tenant. Please try again.');
        }
      },
    });
  }
}
