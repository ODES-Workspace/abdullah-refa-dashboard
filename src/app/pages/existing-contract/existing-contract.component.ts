import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UserRoleService } from '../../../services/user-role.service';
import { ContractsService } from '../../../services/contracts.service';
import { PropertyTypesService } from '../../../services/property-types.service';
import { CitiesService, City } from '../../../services/cities.service';
import { AdminService } from '../../../services/admin.service';
import { forkJoin } from 'rxjs';

interface TableItem {
  id: number;
  rent_request_id: number;
  tenantName: string;
  ownerName: string;
  propertyType: string;
  propertyTypeId?: number;
  tenantMobile: string;
  ownerMobile: string;
  location: string;
  cityId?: number;
  startDate: string;
  endOfContract: string;
  annualRent: string;
  monthlyRentAmount: string;
  status: string;
}
@Component({
  selector: 'app-existing-contract',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './existing-contract.component.html',
  styleUrl: './existing-contract.component.scss',
})
export class ExistingContractComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  contractPermissions: string[] = [];

  get canReadContracts(): boolean {
    // Agents can always view, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always view
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.contractPermissions.includes('contract.read')
      );
    }
    return false; // Unknown role
  }

  allItems: TableItem[] = [];

  searchTerm = '';
  filteredItems: TableItem[] = [...this.allItems];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  showViewModal = false;
  showEditModal = false;
  selectedTenant: TableItem | null = null;
  activeDropdown: number | null = null;

  // Track sorting state
  currentSortColumn: keyof TableItem | null = null;
  isSortAscending = true;

  // Add new properties for reject modal
  showRejectModal = false;
  rejectReason = '';
  selectedItem: TableItem | null = null;

  // Add new properties for revise/edit modal
  showReviseModal = false;
  editedItem: TableItem | null = null;

  // Loading and server-side pagination metadata
  isLoading = false;
  apiTotal: number = 0;
  apiPerPage: number = 10;
  apiLastPage: number = 1;
  apiFrom: number | null = null;
  apiTo: number | null = null;

  // Property type localization
  private typeIdToName: { [id: number]: string } = {};
  private typesRaw: any[] = [];
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

  // Cities data
  cities: City[] = [];

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
    private router: Router,
    public userRoleService: UserRoleService,
    private contractsService: ContractsService,
    private propertyTypesService: PropertyTypesService,
    private citiesService: CitiesService,
    private adminService: AdminService,
    private translate: TranslateService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
    // Ensure loading state shows immediately
    this.isLoading = true;

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
                this.contractPermissions = (adminRes.permissions || [])
                  .filter((p) => p.name.startsWith('contract.'))
                  .map((p) => p.name);
                console.log('Admin active:', this.adminActive);
                console.log('Contract permissions:', this.contractPermissions);
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
      this.contractPermissions = [];
      this.adminActive = null;
    }

    // Load reference data and contracts
    this.loadReferenceData(() => {
      this.loadPage(this.currentPage);
    });

    // React to language changes
    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.rebuildTypeMap();
        this.applyNamesFromMap();
      }
    });
  }

  private loadReferenceData(onComplete?: () => void): void {
    const types$ = this.propertyTypesService.getPropertyTypes();
    const cities$ = this.citiesService.getCities();

    forkJoin([types$, cities$]).subscribe({
      next: ([typesRes, citiesRes]) => {
        this.typesRaw = typesRes?.data || [];
        this.cities = citiesRes || [];
        this.rebuildTypeMap();
        if (onComplete) {
          onComplete();
        }
      },
      error: () => {
        this.typesRaw = [];
        this.cities = [];
        this.typeIdToName = {};
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  private loadPage(page: number): void {
    this.isLoading = true;

    // If reference data is not loaded yet, load it first
    if (
      Object.keys(this.typeIdToName).length === 0 ||
      this.cities.length === 0
    ) {
      this.loadReferenceData(() => {
        this.fetchContracts(page);
      });
    } else {
      this.fetchContracts(page);
    }
  }

  private fetchContracts(page: number): void {
    // If admin, filter active contracts
    const isAdmin =
      (localStorage.getItem('user_data') &&
        JSON.parse(localStorage.getItem('user_data') as string)?.type ===
          'admin') ||
      false;
    const status = isAdmin ? 'active' : '';
    this.contractsService.getContracts(page, undefined, status).subscribe({
      next: (response) => {
        this.apiTotal = response.total;
        this.apiPerPage = response.per_page;
        this.apiLastPage = response.last_page;
        this.apiFrom = response.from ?? null;
        this.apiTo = response.to ?? null;
        this.currentPage = response.current_page;

        const items = (response.data || [])
          .map((c: any) => {
            const typeId = c.rent_request?.property?.property_type_id;
            return {
              id: c.id,
              rent_request_id: c.rent_request_id || c.rent_request?.id,
              tenantName: c.rent_request?.name || '-',
              tenantMobile: c.rent_request?.phone || '-',
              ownerName: '-',
              ownerMobile: '-',
              propertyTypeId: typeId,
              propertyType:
                (typeId && this.typeIdToName[typeId]) ||
                (typeId != null ? String(typeId) : '-') ||
                '-',
              location: c.rent_request?.city_id
                ? this.getCityName(c.rent_request.city_id)
                : c.rent_request?.property?.city || '-',
              cityId: c.rent_request?.city_id,
              startDate: this.formatDate(c.start_date),
              endOfContract: this.formatDate(c.end_date),
              annualRent: c.rent_request?.property?.annual_rent
                ? Math.round(c.rent_request.property.annual_rent).toString()
                : '-',
              monthlyRentAmount: c.rent_request?.monthly_installment
                ? Math.round(c.rent_request.monthly_installment).toString()
                : '-',
              status: c.status || '-',
            } as TableItem;
          })
          .sort((a, b) => b.id - a.id);

        this.allItems = items;
        this.filteredItems = [...items];
        this.paginatedItems = [...items];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch contracts:', error);
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

  private rebuildTypeMap(): void {
    this.typeIdToName = {};
    this.typesRaw.forEach((t: any) => {
      this.typeIdToName[t.id] =
        this.currentLang === 'ar' ? t.name_ar : t.name_en;
    });
  }

  private applyNamesFromMap(): void {
    if (!this.allItems.length) return;
    this.allItems = this.allItems.map((it) => ({
      ...it,
      propertyType:
        (it.propertyTypeId && this.typeIdToName[it.propertyTypeId]) ||
        it.propertyType,
      location: it.cityId ? this.getCityName(it.cityId) : it.location,
      // rentalValue doesn't need updating from map as it's already formatted
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private getCityName(cityId: number): string {
    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return '-';

    return this.currentLang === 'ar' ? city.name_ar : city.name_en;
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.tenantMobile.toLowerCase().includes(searchTermLower) ||
        item.tenantName.toLowerCase().includes(searchTermLower)
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
      const rawA = (a as any)[key] ?? '';
      const rawB = (b as any)[key] ?? '';
      const valueA = rawA.toString().toLowerCase();
      const valueB = rawB.toString().toLowerCase();

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
    // server already returns a single page
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

  toggleDropdown(itemId: number): void {
    this.activeDropdown = this.activeDropdown === itemId ? null : itemId;
  }

  closeDropdown(): void {
    this.activeDropdown = null;
  }

  viewRentalApplication(rentRequestId: number): void {
    this.router.navigate(['/admin/rental-application-details', rentRequestId]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.table-actions');
    if (!dropdown && this.activeDropdown !== null) {
      this.closeDropdown();
    }
  }
}
