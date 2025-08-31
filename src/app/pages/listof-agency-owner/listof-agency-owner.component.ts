import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AgentsService, Agent } from '../../../services/agents.service';

interface TableItem {
  id: number;
  name: string;
  mobile: string;
  email: string;
  status: string;
  angency: string;
  DateAdded: string;
  DateModified: string;
  active: number;
  role: string | null;
  type: string;
}
@Component({
  selector: 'app-listof-agency-owner',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './listof-agency-owner.component.html',
  styleUrl: './listof-agency-owner.component.scss',
})
export class ListofAgencyOwnerComponent implements OnInit {
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

  constructor(private agentsService: AgentsService) {
    this.updatePagination();
  }

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;
    this.agentsService.getAgents().subscribe({
      next: (res) => {
        console.log('Agents API Response:', res);
        this.allItems = this.mapAgentsToTableItems(res);
        this.filteredItems = [...this.allItems];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading agents:', err);
        this.isLoading = false;
      },
    });
  }

  private mapAgentsToTableItems(agents: Agent[]): TableItem[] {
    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      mobile: agent.phone_number,
      email: agent.email,
      status: this.getAgentStatus(agent),
      angency: agent.type === 'agent' ? 'Agency' : agent.type,
      DateAdded: this.formatDate(agent.created_at),
      DateModified: this.formatDate(agent.updated_at),
      active: agent.active,
      role: agent.role,
      type: agent.type,
    }));
  }

  private getAgentStatus(agent: Agent): string {
    if (agent.active === 1) {
      return 'Approved';
    } else if (agent.role === 'admin') {
      return 'Approved';
    } else {
      return 'Under Review';
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  onSearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredItems = this.allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTermLower) ||
        item.mobile.toLowerCase().includes(searchTermLower) ||
        item.email.toLowerCase().includes(searchTermLower)
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

  toggleDropdown(itemId: number): void {
    this.activeDropdown = this.activeDropdown === itemId ? null : itemId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if the click is outside the dropdown
    if (!target.closest('.table-actions')) {
      this.activeDropdown = null;
    }
  }

  handleAction(item: TableItem, action: string): void {
    console.log(`Action: ${action} on item:`, item);

    switch (action) {
      case 'approve':
        this.approveItem(item);
        break;
      case 'reject':
        this.rejectItem(item);
        break;
      case 'delete':
        this.deleteItem(item);
        break;
      default:
        console.log('Unknown action:', action);
    }

    // Close dropdown after action
    this.activeDropdown = null;
  }

  private approveItem(item: TableItem): void {
    console.log('Approving item:', item);
    // Update item status
    item.status = 'Approved';
    item.active = 1;
    item.DateModified = new Date().toLocaleDateString('en-GB');
    // Here you would typically call an API to approve the agent
    // this.agentsService.approveAgent(item.id).subscribe(...)
  }

  private rejectItem(item: TableItem): void {
    console.log('Rejecting item:', item);
    // Update item status
    item.status = 'Rejected';
    item.active = 0;
    item.DateModified = new Date().toLocaleDateString('en-GB');
    // Here you would typically call an API to reject the agent
    // this.agentsService.rejectAgent(item.id).subscribe(...)
  }

  private deleteItem(item: TableItem): void {
    console.log('Deleting item:', item);
    // Remove item from arrays
    const index = this.allItems.findIndex((i) => i.id === item.id);
    if (index > -1) {
      this.allItems.splice(index, 1);
      this.onSearch(); // Refresh filtered items and pagination
    }
    // Here you would typically call an API to delete the agent
    // this.agentsService.deleteAgent(item.id).subscribe(...)
  }
}
