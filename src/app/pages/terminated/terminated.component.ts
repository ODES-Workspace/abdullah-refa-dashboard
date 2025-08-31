import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ContractsService } from '../../../services/contracts.service';
import { CitiesService, City } from '../../../services/cities.service';

interface TableItem {
  id: number;
  tenantName: string;
  ownerName: string;
  propertyType: string;
  tenantMobile: string;
  ownerMobile: string;
  location: string;
  cityId?: number;
  startDate: string;
  endOfContract: string;
  status: string;
}
@Component({
  selector: 'app-terminated',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './terminated.component.html',
  styleUrl: './terminated.component.scss',
})
export class TerminatedComponent implements OnInit {
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
  isLoading = true;

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

  // Cities data
  cities: City[] = [];
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

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
    private router: Router,
    private contractsService: ContractsService,
    private citiesService: CitiesService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
    this.isLoading = true;
    // Load cities first, then load contracts
    this.citiesService.getCities().subscribe({
      next: (citiesRes) => {
        this.cities = citiesRes || [];
        this.loadContracts();
      },
      error: () => {
        this.cities = [];
        this.loadContracts();
      },
    });
  }

  private loadContracts(): void {
    this.contractsService.getContracts(1, undefined, 'cancelled').subscribe({
      next: (res) => {
        const items = (res.data || []).map((c: any) => {
          const rr = c.rent_request || {};
          const prop = rr.property || {};
          return {
            id: c.id,
            tenantName: rr.name || '-',
            tenantMobile: rr.phone || '-',
            ownerName: '-',
            ownerMobile: '-',
            propertyType:
              prop.property_type_id != null
                ? String(prop.property_type_id)
                : '-',
            location: rr.city_id
              ? this.getCityName(rr.city_id)
              : prop.city || '-',
            cityId: rr.city_id,
            startDate: c.start_date || '-',
            endOfContract: c.end_date || '-',
            status: c.status || '-',
          } as TableItem;
        });
        this.allItems = items;
        this.filteredItems = [...items];
        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch cancelled contracts:', err);
        this.allItems = [];
        this.filteredItems = [];
        this.paginatedItems = [];
        this.isLoading = false;
      },
    });
  }

  private getCityName(cityId: number): string {
    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return '-';

    return this.currentLang === 'ar' ? city.name_ar : city.name_en;
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
    this.currentPage = page;
    this.updatePagination();
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
