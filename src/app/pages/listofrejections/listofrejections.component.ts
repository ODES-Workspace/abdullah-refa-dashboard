import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';
import { AgentsService, Agent } from '../../../services/agents.service';
import { ToastService } from '../../../services/toast.service';
import { AdminService } from '../../../services/admin.service';

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
  selector: 'app-listofrejections',
  imports: [FormsModule, NgFor, NgIf, TranslateModule],
  templateUrl: './listofrejections.component.html',
  styleUrl: './listofrejections.component.scss',
})
export class ListofrejectionsComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  agentPermissions: string[] = [];
  permissionsLoading = true; // Track permissions loading state

  get canReadAgents(): boolean {
    // Agents can always view, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always view
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 && this.agentPermissions.includes('agent.read')
      );
    }
    return false; // Unknown role
  }

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

  constructor(
    private agentsService: AgentsService,
    private toast: ToastService,
    public userRoleService: UserRoleService,
    private adminService: AdminService
  ) {
    this.updatePagination();
  }

  ngOnInit(): void {
    // Check user role first - only make admin API call if user is admin
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'admin') {
      // Get admin id from user_data in localStorage and fetch admin details
      try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData.id) {
            this.adminService.getAdminById(userData.id).subscribe({
              next: (adminRes) => {
                this.adminActive = adminRes.active;
                this.agentPermissions = (adminRes.permissions || [])
                  .filter((p) => p.name.startsWith('agent.'))
                  .map((p) => p.name);
                console.log('Admin active:', this.adminActive);
                console.log('Agent permissions:', this.agentPermissions);
                this.permissionsLoading = false; // Mark permissions as loaded
              },
              error: (err) => {
                console.error('Error fetching admin details:', err);
                this.permissionsLoading = false; // Mark permissions as loaded even on error
              },
            });
          }
        }
      } catch (e) {
        console.error('Error parsing user_data from localStorage:', e);
        this.permissionsLoading = false; // Mark permissions as loaded even on error
      }
    } else {
      // User is not admin, set permissions to empty array
      this.agentPermissions = [];
      this.adminActive = null;
      this.permissionsLoading = false; // Mark permissions as loaded for non-admin users
    }

    this.loadRejectedAgents();
  }

  loadRejectedAgents(): void {
    this.isLoading = true;
    this.agentsService.getAgents().subscribe({
      next: (res) => {
        console.log('Agents API Response:', res);
        // Filter to show only rejected agents (active = 0 and not admin)
        const rejectedAgents = res.filter(
          (agent) => agent.active === 0 && agent.role !== 'admin'
        );
        this.allItems = this.mapAgentsToTableItems(rejectedAgents);
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
      status: 'Rejected', // All agents here are rejected
      angency: agent.type === 'agent' ? 'Agency' : agent.type,
      DateAdded: this.formatDate(agent.created_at),
      DateModified: this.formatDate(agent.updated_at),
      active: agent.active,
      role: agent.role,
      type: agent.type,
    }));
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
}
