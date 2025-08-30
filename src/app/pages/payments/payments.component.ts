import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';
import { ContractsService } from '../../../services/contracts.service';
import { PropertyTypesService } from '../../../services/property-types.service';

interface TableItem {
  id: number;
  tenantName: string;
  ownerName: string;
  propertyType: string;
  propertyTypeId?: number;
  tenantMobile: string;
  ownerMobile: string;
  location: string;
  startDate: string;
  endOfContract: string;
  status: string;
}
@Component({
  selector: 'app-payments',
  imports: [FormsModule, NgFor, NgIf, TranslateModule, ToastComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent implements OnInit {
  allItems: TableItem[] = [];

  searchTerm = '';
  filteredItems: TableItem[] = [...this.allItems];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  itemsPerPage = 10; // local UI control (unused when relying solely on server)
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

  // Server-side pagination metadata
  isLoading = false;
  apiTotal: number = 0;
  apiPerPage: number = 10;
  apiLastPage: number = 1;
  apiFrom: number | null = null;
  apiTo: number | null = null;

  get totalPages(): number {
    return this.apiLastPage || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    if (this.apiTotal <= 0 || this.apiPerPage <= 0) return 0;
    return (this.currentPage - 1) * this.apiPerPage;
  }

  get paginationEnd(): number {
    if (this.apiTotal <= 0 || this.apiPerPage <= 0) return 0;
    return Math.min(this.currentPage * this.apiPerPage, this.apiTotal);
  }

  constructor(
    private router: Router,
    private toastService: ToastService,
    private contractsService: ContractsService,
    private propertyTypesService: PropertyTypesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Load types first then load contracts
    this.loadTypes(() => this.loadPage(1));

    // React to language changes
    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.rebuildTypeMap();
        this.applyTypeNamesFromMap();
      }
    });
  }

  // Localization maps for property types
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';
  private typesRaw: any[] = [];
  private typeIdToName: { [id: number]: string } = {};

  private loadTypes(onComplete?: () => void): void {
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (res: any) => {
        this.typesRaw = res?.data || [];
        this.rebuildTypeMap();
        if (onComplete) onComplete();
      },
      error: () => {
        this.typesRaw = [];
        this.typeIdToName = {};
        if (onComplete) onComplete();
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

  private applyTypeNamesFromMap(): void {
    if (!this.allItems.length) return;
    this.allItems = this.allItems.map((it) => ({
      ...it,
      propertyType:
        (it.propertyTypeId && this.typeIdToName[it.propertyTypeId]) ||
        it.propertyType,
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
  }

  private loadPage(page: number): void {
    this.isLoading = true;
    this.contractsService.getContracts(page, undefined, 'pending').subscribe({
      next: (res) => {
        console.log('Payments contracts (pending):', res);
        this.apiTotal = res.total;
        this.apiPerPage = res.per_page;
        this.apiLastPage = res.last_page;
        this.apiFrom = res.from ?? null;
        this.apiTo = res.to ?? null;
        this.currentPage = res.current_page;

        const items = (res.data || []).map((c: any) => {
          const rr = c.rent_request || {};
          const prop = rr.property || {};
          return {
            id: c.id,
            tenantName: rr.name || '-',
            tenantMobile: rr.phone || '-',
            ownerName: '-',
            ownerMobile: '-',
            propertyTypeId: prop.property_type_id,
            propertyType:
              (prop.property_type_id &&
                this.typeIdToName[prop.property_type_id]) ||
              (prop.property_type_id != null
                ? String(prop.property_type_id)
                : '-') ||
              '-',
            location: prop.city || '-',
            startDate: c.start_date || '-',
            endOfContract: c.end_date || '-',
            status: c.status || '-',
          } as TableItem;
        });

        this.allItems = items;
        this.filteredItems = [...items];
        this.paginatedItems = [...items];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch pending contracts:', err);
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
    this.paginatedItems = this.filteredItems.slice(
      this.paginationStart,
      this.paginationEnd
    );
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
    this.toastService.show('requestApproved');
    this.closeDropdown();
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
      this.selectedItem.status = 'Rejected';
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
      }

      // Update filtered items as well
      this.onSearch(); // This will refresh the filtered items
      this.updatePagination();
      this.closeReviseModal();
    }
  }

  viewDetails(item: TableItem): void {
    this.selectedItem = item;
    this.showViewModal = true;
    this.closeDropdown();
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedItem = null;
  }
}
