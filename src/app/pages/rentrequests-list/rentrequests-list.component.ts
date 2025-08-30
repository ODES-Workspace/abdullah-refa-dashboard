import { NgFor, NgIf, NgClass } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';
import { UserRoleService } from '../../../services/user-role.service';
import { RentRequestsService } from '../../../services/rent-requests.service';
import { PropertyCategoriesService } from '../../../services/property-categories.service';
import { PropertyTypesService } from '../../../services/property-types.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface TableItem {
  id: number;
  propertyName: string;
  propertyNameEn?: string;
  propertyNameAr?: string;
  tenantName: string;
  ownerName: string;
  city: string;
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
  selector: 'app-rentrequests-list',
  imports: [FormsModule, NgFor, NgIf, NgClass, TranslateModule, ToastComponent],
  templateUrl: './rentrequests-list.component.html',
  styleUrl: './rentrequests-list.component.scss',
})
export class RentrequestsListComponent implements OnInit {
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
  isLoading = false;

  // client-side getters removed; server-side versions are defined below

  constructor(
    private router: Router,
    private toastService: ToastService,
    public userRoleService: UserRoleService,
    private rentRequestsService: RentRequestsService,
    private propertyCategoriesService: PropertyCategoriesService,
    private propertyTypesService: PropertyTypesService,
    private translate: TranslateService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadReferenceData(() => {
      this.loadPage(this.currentPage);
    });

    // Update labels on language toggle without reload
    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.relocalizeLabels();
      }
    });
  }

  // Backend pagination metadata (public for template access)
  apiTotal: number = 0;
  apiPerPage: number = 10;
  apiLastPage: number = 1;
  apiFrom: number | null = null;
  apiTo: number | null = null;

  // Reference data maps
  private categoryIdToName: { [id: number]: string } = {};
  private typeIdToName: { [id: number]: string } = {};
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';
  private categoriesRaw: any[] = [];
  private typesRaw: any[] = [];

  private mapApiToTableItems(apiData: any[]): TableItem[] {
    return apiData.map((rr: any) => {
      const categoryId = rr.property?.property_category_id;
      const typeId = rr.property?.property_type_id;

      return {
        id: rr.id,
        propertyName:
          this.currentLang === 'ar'
            ? rr.property?.name_ar || rr.property?.name_en || '-'
            : rr.property?.name_en || rr.property?.name_ar || '-',
        propertyNameEn: rr.property?.name_en,
        propertyNameAr: rr.property?.name_ar,
        tenantName: rr.name || '-',
        ownerName: rr.property?.name || '-',
        city: rr.property?.city || '-',
        status: rr.status || '-',
        propertyCategoryId: categoryId,
        propertyTypeId: typeId,
        propertyCategory:
          (categoryId && this.categoryIdToName[categoryId]) ||
          categoryId?.toString() ||
          '-',
        propertyType:
          (typeId && this.typeIdToName[typeId]) || typeId?.toString() || '-',
        dateAdded: rr.created_at ? rr.created_at.split('T')[0] : '-',
        dateModified: rr.updated_at ? rr.updated_at.split('T')[0] : '-',
        rejectedReason: rr.status_description || '-',
      };
    });
  }

  private loadPage(page: number): void {
    this.isLoading = true;

    this.rentRequestsService.getRentRequests(page).subscribe({
      next: (response) => {
        this.apiTotal = response.total;
        this.apiPerPage = response.per_page;
        this.apiLastPage = response.last_page;
        this.apiFrom = response.from ?? null;
        this.apiTo = response.to ?? null;
        this.currentPage = response.current_page;

        // Keep API order as-is; do not reverse so S.ON ascends naturally
        const items = this.mapApiToTableItems(response.data || []);
        this.allItems = items;
        this.filteredItems = [...items];
        this.paginatedItems = [...items]; // server already paginated

        // If reference data wasn't loaded in time, try to load it now and reapply
        if (
          Object.keys(this.categoryIdToName).length === 0 ||
          Object.keys(this.typeIdToName).length === 0
        ) {
          this.loadReferenceData(() => {
            this.applyNamesFromMaps();
          });
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch rent requests:', error);
        // fallback to empty
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
    // Load categories and types separately to get better error information
    const categories$ = this.propertyCategoriesService
      .getPropertyCategories()
      .pipe(
        catchError((error) => {
          console.error('Categories service error for admin:', error);
          return of({ data: [] } as any);
        })
      );

    const types$ = this.propertyTypesService.getPropertyTypes().pipe(
      catchError((error) => {
        console.error('Types service error for admin:', error);
        return of({ data: [] } as any);
      })
    );

    forkJoin([categories$, types$]).subscribe({
      next: ([catRes, typeRes]) => {
        this.categoriesRaw = catRes?.data || [];
        this.typesRaw = typeRes?.data || [];

        this.rebuildLabelMaps();

        // If we already have items, apply names now
        if (this.allItems && this.allItems.length > 0) {
          this.applyNamesFromMaps();
        }

        if (onComplete) onComplete();
      },
      error: (error) => {
        console.error('Error loading reference data:', error);
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
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private rebuildLabelMaps(): void {
    this.categoryIdToName = {};
    this.categoriesRaw.forEach((c: any) => {
      const name =
        this.currentLang === 'ar' ? c.name_ar || c.name : c.name_en || c.name;
      this.categoryIdToName[c.id] = name || `Category ${c.id}`;
    });

    this.typeIdToName = {};
    this.typesRaw.forEach((t: any) => {
      const name =
        this.currentLang === 'ar' ? t.name_ar || t.name : t.name_en || t.name;
      this.typeIdToName[t.id] = name || `Type ${t.id}`;
    });
  }

  private relocalizeLabels(): void {
    this.rebuildLabelMaps();
    this.applyNamesFromMaps();
  }

  // Method to manually refresh reference data if needed
  refreshReferenceData(): void {
    this.loadReferenceData(() => {
      this.applyNamesFromMaps();
    });
  }

  // Override client-side pagination helpers to reflect server-side values
  get totalPages(): number {
    return this.apiLastPage || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    // zero-based for display calculation compatibility
    return this.apiFrom ? this.apiFrom - 1 : 0;
  }

  get paginationEnd(): number {
    return this.apiTo ?? this.paginatedItems.length;
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
      const valueA = (a as any)[key];
      const valueB = (b as any)[key];

      // Numeric compare for numeric fields like id
      if (key === 'id') {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return this.isSortAscending ? numA - numB : numB - numA;
      }

      const strA = (valueA ?? '').toString().toLowerCase();
      const strB = (valueB ?? '').toString().toLowerCase();
      if (strA < strB) return this.isSortAscending ? -1 : 1;
      if (strA > strB) return this.isSortAscending ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    // server already returns a single page; no slicing needed
    this.paginatedItems = [...this.filteredItems];
  }

  // client-side pagination navigation removed; server-side versions are defined above

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
    // Call API to approve and optimistically update UI on success
    this.isLoading = true;
    this.rentRequestsService.approveRentRequest(item.id).subscribe({
      next: () => {
        item.status = 'Approved';
        item.dateModified = new Date().toISOString().split('T')[0];
        this.toastService.show('requestApproved');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Approve request failed', err);
        this.toastService.show('requestApprovalFailed');
        this.isLoading = false;
      },
      complete: () => {
        this.closeDropdown();
      },
    });
  }

  openRejectModal(item: TableItem): void {
    this.selectedItem = item;
    this.showRejectModal = true;
    this.closeDropdown();
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
    this.selectedItem = null;
  }

  submitReject(): void {
    if (this.selectedItem) {
      const id = this.selectedItem.id;
      const reason = this.rejectReason;
      this.isLoading = true;
      this.rentRequestsService
        .rejectRentRequest(id, { reject_reason: reason })
        .subscribe({
          next: () => {
            this.selectedItem!.status = 'Rejected';
            this.selectedItem!.rejectedReason = reason;
            this.selectedItem!.dateModified = new Date()
              .toISOString()
              .split('T')[0];
            this.toastService.show(
              this.currentLang === 'ar'
                ? 'تم رفض الطلب بنجاح'
                : 'Request Rejected'
            );

            this.isLoading = false;
            this.closeRejectModal();
          },
          error: (err) => {
            console.error('Reject request failed', err);
            this.toastService.show(
              this.currentLang === 'ar'
                ? 'فشل رفض الطلب'
                : 'Request Rejection Failed'
            );
            this.isLoading = false;
          },
        });
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
      // Backend requires a full payload; load original details and merge minimal edits
      const id = this.editedItem.id;
      this.isLoading = true;
      this.rentRequestsService.getRentRequestById(id).subscribe({
        next: (rr) => {
          const payload: any = {
            property_id: rr.property_id,
            name: this.editedItem!.tenantName || rr.name,
            email: rr.email,
            phone: rr.phone,
            city_id: rr.city_id,
            date_of_birth: rr.date_of_birth,
            number_of_family_members: rr.number_of_family_members,
            national_id: rr.national_id,
            job_title: rr.job_title,
            employer_name: rr.employer_name,
            sector: rr.sector,
            subsector: rr.subsector,
            monthly_income: rr.monthly_income,
            expected_monthly_cost: rr.expected_monthly_cost,
            number_of_installments: rr.number_of_installments,
            // If API accepts these as optional, include when present
            ...(rr.additional_charges
              ? { additional_charges: rr.additional_charges }
              : {}),
            ...(rr.down_payment ? { down_payment: rr.down_payment } : {}),
            ...(typeof rr.has_debts === 'boolean'
              ? { has_debts: rr.has_debts }
              : {}),
            ...(rr.debts_monthly_amount
              ? { debts_monthly_amount: rr.debts_monthly_amount }
              : {}),
            ...(rr.debts_remaining_months
              ? { debts_remaining_months: rr.debts_remaining_months }
              : {}),
          };

          this.rentRequestsService.reviseRentRequest(id, payload).subscribe({
            next: () => {
              // Reload current page from server to ensure persistence reflects
              this.loadPage(this.currentPage);
              this.toastService.show('requestRevised');
              this.isLoading = false;
              this.closeReviseModal();
            },
            error: (err) => {
              console.error('Revise request failed', err);
              this.toastService.show('requestRevisionFailed');
              this.isLoading = false;
            },
          });
        },
        error: (err) => {
          console.error('Failed to load request before revise', err);
          this.toastService.show('requestRevisionFailed');
          this.isLoading = false;
        },
      });
    }
  }

  viewDetails(item: TableItem): void {
    const role = this.userRoleService.getCurrentRole();
    const baseRoute = role === 'admin' ? '/admin' : '/agent';
    this.router.navigate([`${baseRoute}/rental-application-details`, item.id]);
    this.closeDropdown();
  }
}
