import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CustomersService,
  Customer,
  CustomersResponse,
} from '../../../services/customers.service';
import { CitiesService, City } from '../../../services/cities.service';
import { AdminService } from '../../../services/admin.service';

interface TableItem {
  id: number;
  name: string;
  mobile: string;
  email: string;
  city: string;
  cityId?: number;
  type: string;
  status: string;
  active: number;
  dateAdded: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  userPermissions: string[] = [];
  permissionsLoading = true;

  get canReadUsers(): boolean {
    // For now, allow all admins to read users
    // Can be updated later if specific permissions are needed
    return this.adminActive === 1;
  }

  allItems: TableItem[] = [];
  searchTerm = '';
  filteredItems: TableItem[] = [];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  isLoading = false;

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

  // View modal
  showViewModal = false;
  selectedUser: TableItem | null = null;

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

  constructor(
    private customersService: CustomersService,
    private citiesService: CitiesService,
    private translate: TranslateService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadReferenceData(() => this.loadPage(1));

    // Get admin id from user_data in localStorage and fetch admin details
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.id) {
          this.adminService.getAdminById(userData.id).subscribe({
            next: (adminRes) => {
              this.adminActive = adminRes.active;
              this.userPermissions = (adminRes.permissions || [])
                .filter((p: any) => p.name.startsWith('user.'))
                .map((p: any) => p.name);
              this.permissionsLoading = false;
            },
            error: (err) => {
              console.error('Error fetching admin details:', err);
              this.permissionsLoading = false;
            },
          });
        } else {
          this.permissionsLoading = false;
        }
      } else {
        this.permissionsLoading = false;
      }
    } catch (e) {
      console.error('Error parsing user_data from localStorage:', e);
      this.permissionsLoading = false;
    }

    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.applyCityNamesFromMaps();
      }
    });
  }

  private loadPage(page: number): void {
    this.isLoading = true;
    this.customersService.getCustomers(page, this.apiPerPage).subscribe({
      next: (response: CustomersResponse) => {
        console.log('Customers API Response:', response);

        // Update pagination metadata
        this.apiTotal = response.total;
        this.apiPerPage = response.per_page;
        this.apiLastPage = response.last_page;
        this.apiFrom = response.from ?? null;
        this.apiTo = response.to ?? null;
        this.currentPage = response.current_page;

        // Map and assign data
        const items = this.mapCustomersToTableItems(response.data);
        this.allItems = items;
        this.filteredItems = [...items];
        this.paginatedItems = [...items];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
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
    this.citiesService.getCities().subscribe({
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

  private applyCityNamesFromMaps(): void {
    this.allItems = this.allItems.map((it) => ({
      ...it,
      city: it.cityId ? this.getCityName(it.cityId) : it.city,
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private mapCustomersToTableItems(customers: Customer[]): TableItem[] {
    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      mobile: customer.phone_number || '-',
      email: customer.email,
      city: customer.city_id
        ? this.getCityName(customer.city_id)
        : customer.city?.name_en || '-',
      cityId: customer.city_id ?? undefined,
      type: customer.type || '-',
      status: customer.active === 1 ? 'Active' : 'Inactive',
      active: customer.active,
      dateAdded: this.formatDate(customer.created_at),
    }));
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB');
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTermLower) ||
        item.mobile.toLowerCase().includes(searchTermLower) ||
        item.email.toLowerCase().includes(searchTermLower)
    );
    this.paginatedItems = [...this.filteredItems];
  }

  sortBy(key: keyof TableItem): void {
    if (this.currentSortColumn === key) {
      this.isSortAscending = !this.isSortAscending;
    } else {
      this.currentSortColumn = key;
      this.isSortAscending = true;
    }

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

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      default:
        return '';
    }
  }

  openViewModal(user: TableItem): void {
    this.selectedUser = { ...user };
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedUser = null;
  }
}
