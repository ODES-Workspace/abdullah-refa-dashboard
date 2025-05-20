import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UserRoleService } from '../../../services/user-role.service';

interface TableItem {
  id: number;
  propertyName: string;
  tenantName: string;
  ownerName: string;
  city: string;
  status: string;
  propertyCategory: string;
  propertyType: string;
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
export class RejectedRentrequestsComponent {
  allItems: TableItem[] = [
    {
      id: 1,
      propertyName: 'Property 1',
      tenantName: 'John Doe',
      ownerName: 'John Doe',
      city: 'Riyadh',
      status: 'Approved',
      propertyCategory: 'Apartment',
      propertyType: 'Apartment',
      dateAdded: '2023-07-31',
      dateModified: '2023-07-31',
      rejectedReason: 'Reason for rejection',
    },
    {
      id: 2,
      propertyName: 'Property 2',
      tenantName: 'John Doe',
      ownerName: 'John Doe',
      city: 'Riyadh',
      status: 'Approved',
      propertyCategory: 'Apartment',
      propertyType: 'Apartment',
      dateAdded: '2023-07-31',
      dateModified: '2023-07-31',
      rejectedReason: 'Reason for rejection',
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

  // Add new property for viewing reject reason
  showViewRejectReasonModal = false;
  selectedRejectReason: string = '';

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

  constructor(private router: Router, public userRoleService: UserRoleService) {
    this.updatePagination();
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
}
