import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface TableItem {
  id: number;
  name: string;
  mobile: string;
  email: string;
  city: string;
  DateAdded: string;
}

@Component({
  selector: 'app-tenants',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  standalone: true,
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent {
  allItems: TableItem[] = [
    {
      id: 1,
      name: 'Ahmed bin Said',
      mobile: '+966558441496',
      email: 'vMq6W@example.com',
      city: 'Dammam',
      DateAdded: 'Cody Mayer',
    },
    {
      id: 2,
      name: 'Rashid Rashid',
      mobile: '+966558441495',
      email: 'vMq6W@example.com',
      city: 'Tabuk',
      DateAdded: 'Cody Cayer',
    },
    {
      id: 3,
      name: 'Nora Al Kaabi',
      mobile: '+966558441492',
      email: 'vMq6W@example.com',
      city: 'Al-Hofuf',
      DateAdded: 'Cody Kayer',
    },
  ];

  searchTerm = '';
  filteredItems: TableItem[] = [...this.allItems];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  showViewModal = false;
  showEditModal = false;
  selectedTenant: TableItem | null = null;

  // Track sorting state
  currentSortColumn: keyof TableItem | null = null;
  isSortAscending = true;

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

  constructor() {
    this.updatePagination();
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTermLower) ||
        item.mobile.toLowerCase().includes(searchTermLower)
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
      const valueA = a[key].toString().toLowerCase();
      const valueB = b[key].toString().toLowerCase();

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
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTenant = null;
  }

  saveTenantChanges(): void {
    if (this.selectedTenant) {
      const index = this.allItems.findIndex(
        (item) => item.id === this.selectedTenant?.id
      );

      if (index !== -1) {
        this.allItems[index] = { ...this.selectedTenant };

        this.filteredItems = this.allItems.filter((item) =>
          item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );

        this.updatePagination();
      }
    }
    this.closeEditModal();
  }
}
