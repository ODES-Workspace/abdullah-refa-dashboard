import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CustomersService,
  Customer,
} from '../../../services/customers.service';
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
    return this.adminActive === 1;
  }

  allItems: TableItem[] = [];
  searchTerm = '';
  filteredItems: TableItem[] = [];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  isLoading = false;

  currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

  // Track sorting state
  currentSortColumn: keyof TableItem | null = null;
  isSortAscending = true;

  // View modal
  showViewModal = false;
  selectedUser: TableItem | null = null;

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get paginationEnd(): number {
    return Math.min(
      this.paginationStart + this.itemsPerPage,
      this.filteredItems.length
    );
  }

  constructor(
    private customersService: CustomersService,
    private translate: TranslateService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCustomers();

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
        this.applyCityNames();
      }
    });
  }

  private loadCustomers(): void {
    this.isLoading = true;
    this.customersService.getCustomers().subscribe({
      next: (customers: Customer[]) => {
        console.log('Customers API Response:', customers);

        // Map and assign data
        const items = this.mapCustomersToTableItems(customers);
        this.allItems = items;
        this.filteredItems = [...items];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.allItems = [];
        this.filteredItems = [];
        this.paginatedItems = [];
        this.isLoading = false;
      },
    });
  }

  private getCityName(customer: Customer): string {
    if (!customer.city) return '-';
    return this.currentLang === 'ar'
      ? customer.city.name_ar
      : customer.city.name_en;
  }

  private applyCityNames(): void {
    // Re-load to get fresh city names based on language
    this.loadCustomers();
  }

  private mapCustomersToTableItems(customers: Customer[]): TableItem[] {
    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      mobile: customer.phone_number || '-',
      email: customer.email,
      city: this.getCityName(customer),
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
    this.currentPage = 1;
    this.updatePagination();
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

    this.updatePagination();
  }

  updatePagination(): void {
    this.paginatedItems = this.filteredItems.slice(
      this.paginationStart,
      this.paginationEnd
    );
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
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
