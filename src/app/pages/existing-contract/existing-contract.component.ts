import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
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
  selector: 'app-existing-contract',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './existing-contract.component.html',
  styleUrl: './existing-contract.component.scss',
})
export class ExistingContractComponent implements OnInit {
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
    private contractsService: ContractsService,
    private propertyTypesService: PropertyTypesService,
    private translate: TranslateService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
    // Ensure loading state shows immediately
    this.isLoading = true;

    // Load property types for mapping, then load contracts
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (res: any) => {
        this.typesRaw = res?.data || [];
        this.rebuildTypeMap();
        this.loadPage(this.currentPage);
      },
      error: () => {
        this.typesRaw = [];
        this.typeIdToName = {};
        this.loadPage(this.currentPage);
      },
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

  private loadPage(page: number): void {
    this.isLoading = true;
    this.contractsService.getContracts(page).subscribe({
      next: (response) => {
        console.log('Contracts response:', response);
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
              tenantName: c.rent_request?.name || '-',
              tenantMobile: c.rent_request?.phone || '-',
              ownerName: '-',
              ownerMobile: '-',
              propertyTypeId: typeId,
              propertyType:
                (typeId && this.typeIdToName[typeId]) ||
                (typeId != null ? String(typeId) : '-') ||
                '-',
              location: c.rent_request?.property?.city || '-',
              startDate: c.start_date || '-',
              endOfContract: c.end_date || '-',
              status: c.status || '-',
            } as TableItem;
          })
          .reverse();

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
    }));
    this.filteredItems = [...this.allItems];
    this.paginatedItems = [...this.allItems];
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.table-actions');
    if (!dropdown && this.activeDropdown !== null) {
      this.closeDropdown();
    }
  }
}
