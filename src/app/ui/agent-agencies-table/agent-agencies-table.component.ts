import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface TableItem {
  id: number;
  action: string;
  user: string;
}

@Component({
  selector: 'app-agent-agencies-table',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './agent-agencies-table.component.html',
  styleUrl: './agent-agencies-table.component.scss',
})
export class TableComponent {
  allItems: TableItem[] = [
    { id: 1, action: 'Agent agencies-owner', user: 'Ahmed bin Said' },
    { id: 2, action: 'Agent agencies-owner', user: 'Rashid Rashid' },
    { id: 3, action: 'Agent agencies-owner', user: 'Nora Al Kaabi' },
  ];

  searchTerm = '';
  filteredItems: TableItem[] = [...this.allItems];
  paginatedItems: TableItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;

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
    this.filteredItems = this.allItems.filter((item) =>
      item.user.toLowerCase().includes(this.searchTerm.toLowerCase())
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
}
