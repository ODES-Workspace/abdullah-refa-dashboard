import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UserRoleService } from '../../../services/user-role.service';
import { RentRequestsService } from '../../../services/rent-requests.service';
import { PropertyCategoriesService } from '../../../services/property-categories.service';
import { PropertyTypesService } from '../../../services/property-types.service';
import { CitiesService, City } from '../../../services/cities.service';
import { AdminService } from '../../../services/admin.service';
import { forkJoin } from 'rxjs';

interface TableItem {
  id: number;
  propertyName: string;
  propertyNameEn?: string;
  propertyNameAr?: string;
  tenantName: string;
  ownerName: string;
  city: string;
  cityId?: number;
  status: string;
  propertyCategory: string;
  propertyType: string;
  propertyCategoryId?: number;
  propertyTypeId?: number;
  dateAdded: string;
  dateModified: string;
  rejectedReason: string;
}

@Component({
  selector: 'app-rejected-rentrequests',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  standalone: true,
  templateUrl: './rejected-rentrequests.component.html',
  styleUrl: './rejected-rentrequests.component.scss',
})
export class RejectedRentrequestsComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  rentRequestPermissions: string[] = [];

  get canReadRentRequests(): boolean {
    // Agents can always view, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always view
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.rentRequestPermissions.includes('rent_request.read')
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
  isLoading = false;

  // Track sorting state
  currentSortColumn: keyof TableItem | null = null;
  isSortAscending = true;

  // Add new properties for reject modal
  showRejectModal = false;
  rejectReason = '';
  selectedItem: TableItem | null = null;

  // Add new property for viewing reject reason
  showViewRejectReasonModal = false;
  selectedRejectReason: string = '';

  // Add new properties for revise/edit modal
  showReviseModal = false;
  editedItem: TableItem | null = null;

  // server-side pagination metadata
  apiTotal: number = 0;
  apiPerPage: number = 10;
  apiLastPage: number = 1;
  apiFrom: number | null = null;
  apiTo: number | null = null;

  // reference data
  private categoryIdToName: { [id: number]: string } = {};
  private typeIdToName: { [id: number]: string } = {};
  private categoriesRaw: any[] = [];
  private typesRaw: any[] = [];
  private cities: City[] = [];
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

  constructor(
    private router: Router,
    public userRoleService: UserRoleService,
    private rentRequestsService: RentRequestsService,
    private propertyCategoriesService: PropertyCategoriesService,
    private propertyTypesService: PropertyTypesService,
    private citiesService: CitiesService,
    private adminService: AdminService,
    private translate: TranslateService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
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
                this.rentRequestPermissions = (adminRes.permissions || [])
                  .filter((p) => p.name.startsWith('rent_request.'))
                  .map((p) => p.name);
                console.log('Admin active:', this.adminActive);
                console.log(
                  'Rent request permissions:',
                  this.rentRequestPermissions
                );
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
      this.rentRequestPermissions = [];
      this.adminActive = null;
    }

    this.loadReferenceData(() => this.loadPage(this.currentPage));

    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.relocalizeLabels();
      }
    });
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.propertyName.toLowerCase().includes(searchTermLower) ||
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
    // server returns a single page
    this.paginatedItems = [...this.filteredItems];
  }

  // server-side pagination navigation
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.table-actions');
    if (!dropdown && this.activeDropdown !== null) {
      this.closeDropdown();
    }
  }

  // Add new methods for actions
  approveRequest(item: TableItem): void {
    item.status = 'Approved';
    item.dateModified = new Date().toISOString().split('T')[0];
    this.closeDropdown();
  }

  openRejectModal(item: TableItem): void {
    this.selectedItem = item;
    this.showRejectModal = true;
    this.closeDropdown();
  }

  // Add new method to view reject reason
  viewRejectReason(item: TableItem): void {
    this.selectedRejectReason = item.rejectedReason;
    this.showViewRejectReasonModal = true;
    this.closeDropdown();
  }

  closeViewRejectReasonModal(): void {
    this.showViewRejectReasonModal = false;
    this.selectedRejectReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
    this.selectedItem = null;
  }

  submitReject(): void {
    if (this.selectedItem) {
      this.selectedItem.status = 'Rejected';
      this.selectedItem.rejectedReason = this.rejectReason;
      this.selectedItem.dateModified = new Date().toISOString().split('T')[0];
      this.closeRejectModal();
    }
  }

  // Modified revise method to open the edit modal
  reviseRequest(item: TableItem): void {
    this.editedItem = { ...item }; // Create a copy to edit
    this.showReviseModal = true;
    this.closeDropdown();
  }

  // New methods for edit modal
  closeReviseModal(): void {
    this.showReviseModal = false;
    this.editedItem = null;
  }

  submitRevise(): void {
    if (this.editedItem) {
      // Find the original item and update it
      const originalItem = this.allItems.find(
        (item) => item.id === this.editedItem!.id
      );
      if (originalItem) {
        Object.assign(originalItem, this.editedItem);
        originalItem.status = 'Pending';
        originalItem.dateModified = new Date().toISOString().split('T')[0];
      }

      // Update filtered items as well
      this.onSearch(); // This will refresh the filtered items
      this.updatePagination();
      this.closeReviseModal();
    }
  }

  viewDetails(item: TableItem): void {
    this.router.navigate(['/admin/rental-application-details', item.id]);
    this.closeDropdown();
  }

  // map and data loading
  private mapApiToTableItems(apiData: any[]): TableItem[] {
    return apiData
      .filter((rr: any) => rr.status === 'rejected')
      .map((rr: any) => ({
        id: rr.id,
        propertyName:
          this.currentLang === 'ar'
            ? rr.property?.name_ar || rr.property?.name_en || '-'
            : rr.property?.name_en || rr.property?.name_ar || '-',
        propertyNameEn: rr.property?.name_en,
        propertyNameAr: rr.property?.name_ar,
        tenantName: rr.name || '-',
        ownerName: rr.property?.name || '-',
        city: rr.city_id
          ? this.getCityName(rr.city_id)
          : rr.property?.city || '-',
        cityId: rr.city_id,
        status: rr.status || '-',
        propertyCategoryId: rr.property?.property_category_id,
        propertyTypeId: rr.property?.property_type_id,
        propertyCategory:
          (rr.property?.property_category_id &&
            this.categoryIdToName[rr.property.property_category_id]) ||
          rr.property?.property_category_id?.toString() ||
          '-',
        propertyType:
          (rr.property?.property_type_id &&
            this.typeIdToName[rr.property.property_type_id]) ||
          rr.property?.property_type_id?.toString() ||
          '-',
        dateAdded: rr.created_at ? rr.created_at.split('T')[0] : '-',
        dateModified: rr.updated_at ? rr.updated_at.split('T')[0] : '-',
        rejectedReason: rr.status_description || '-',
      }));
  }

  private loadPage(page: number): void {
    this.isLoading = true;
    this.rentRequestsService
      .getRentRequests(page, undefined, 'rejected')
      .subscribe({
        next: (response) => {
          this.apiTotal = response.total;
          this.apiPerPage = response.per_page;
          this.apiLastPage = response.last_page;
          this.apiFrom = response.from ?? null;
          this.apiTo = response.to ?? null;
          this.currentPage = response.current_page;

          const items = this.mapApiToTableItems(response.data || []).reverse();
          this.allItems = items;
          this.filteredItems = [...items];
          this.paginatedItems = [...items];
          this.isLoading = false;
        },
        error: () => {
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
    const categories$ = this.propertyCategoriesService.getPropertyCategories();
    const types$ = this.propertyTypesService.getPropertyTypes();
    const cities$ = this.citiesService.getCities();

    forkJoin([categories$, types$, cities$]).subscribe({
      next: ([catRes, typeRes, citiesRes]) => {
        this.categoriesRaw = catRes?.data || [];
        this.typesRaw = typeRes?.data || [];
        this.cities = citiesRes || [];
        this.rebuildLabelMaps();

        if (this.allItems && this.allItems.length > 0) {
          this.applyNamesFromMaps();
        }

        if (onComplete) onComplete();
      },
      error: () => {
        if (onComplete) onComplete();
      },
    });
  }

  private applyNamesFromMaps(): void {
    this.allItems = this.allItems.map((it) => ({
      ...it,
      propertyCategory:
        (it.propertyCategoryId &&
          this.categoryIdToName[it.propertyCategoryId]) ||
        it.propertyCategory,
      propertyType:
        (it.propertyTypeId && this.typeIdToName[it.propertyTypeId]) ||
        it.propertyType,
      propertyName:
        this.currentLang === 'ar'
          ? it.propertyNameAr || it.propertyNameEn || it.propertyName
          : it.propertyNameEn || it.propertyNameAr || it.propertyName,
      city: it.cityId ? this.getCityName(it.cityId) : it.city,
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private rebuildLabelMaps(): void {
    this.categoryIdToName = {};
    this.categoriesRaw.forEach((c: any) => {
      this.categoryIdToName[c.id] =
        this.currentLang === 'ar' ? c.name_ar : c.name_en;
    });

    this.typeIdToName = {};
    this.typesRaw.forEach((t: any) => {
      this.typeIdToName[t.id] =
        this.currentLang === 'ar' ? t.name_ar : t.name_en;
    });
  }

  private relocalizeLabels(): void {
    this.rebuildLabelMaps();
    this.applyNamesFromMaps();
  }

  private getCityName(cityId: number): string {
    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return '-';

    return this.currentLang === 'ar' ? city.name_ar : city.name_en;
  }

  // server-side getter helpers
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
}
