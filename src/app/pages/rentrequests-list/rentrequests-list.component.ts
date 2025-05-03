import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface TableItem {
  id: number;
  name: string;
  mobile: string;
  email: string;
  status: string;
  angency: string;
  DateAdded: string;
  DateModified: string;
}

@Component({
  selector: 'app-rentrequests-list',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './rentrequests-list.component.html',
  styleUrl: './rentrequests-list.component.scss',
})
export class RentrequestsListComponent {
  allItems: TableItem[] = [
    {
      id: 1,
      name: 'Ahmed bin Said',
      mobile: '+966558441496',
      email: 'Hamill@gmail.com',
      angency: 'Agency',
      status: 'Under Review',
      DateAdded: '09-02-2025',
      DateModified: '09-01-2025',
    },
    {
      id: 2,
      name: 'Ahmed bin Said',
      mobile: '+966558441496',
      email: 'Hamill@gmail.com',
      angency: 'Agency',
      status: 'Rejected',
      DateAdded: '09-01-2025',
      DateModified: '09-01-2025',
    },
    {
      id: 3,
      name: 'Ahmed bin Said',
      mobile: '+966558441496',
      email: 'Hamill@gmail.com',
      angency: 'Agency',
      status: 'Approved',
      DateAdded: '09-01-2025',
      DateModified: '09-01-2025',
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
  activeDropdown: number | null = null;

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

  toggleDropdown(itemId: number): void {
    this.activeDropdown = this.activeDropdown === itemId ? null : itemId;
  }

  closeDropdown(): void {
    this.activeDropdown = null;
  }

  handleAction(item: TableItem, action: string): void {
    switch (action) {
      case 'approve':
        item.status = 'Approved';
        break;
      case 'reject':
        item.status = 'Rejected';
        break;
      case 'delete':
        const index = this.allItems.findIndex((i) => i.id === item.id);
        if (index !== -1) {
          this.allItems.splice(index, 1);
          this.filteredItems = this.allItems;
          this.updatePagination();
        }
        break;
    }
    this.closeDropdown();
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'under review':
        return 'status-pending';
      default:
        return '';
    }
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
