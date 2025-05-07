import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';

interface TableItem {
  id: number;
  tenantName: string;
  ownerName: string;
  propertyType: string;
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
export class PaymentsComponent {
  allItems: TableItem[] = [
    {
      id: 1,
      tenantName: 'Ahmed bin Said',
      tenantMobile: '+966558441496',
      ownerName: 'Hamill',
      ownerMobile: '+966558441496',
      propertyType: 'Apartment',
      location: 'Thaqif',
      startDate: '2023-01-01',
      endOfContract: '2023-12-31',
      status: 'Approved',
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

  // Add new properties for reject modal
  showRejectModal = false;
  rejectReason = '';
  selectedItem: TableItem | null = null;

  // Add new properties for revise/edit modal
  showReviseModal = false;
  editedItem: TableItem | null = null;

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

  constructor(private router: Router, private toastService: ToastService) {
    this.updatePagination();
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
