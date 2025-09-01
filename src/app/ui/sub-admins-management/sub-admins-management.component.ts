import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  RolesService,
  Permission,
  CreateAdminRequest,
} from '../../../services/roles.service';

interface SubAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  status: 'active' | 'suspended';
  permissions: number[]; // Array of permission IDs
}

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-sub-admins-management',
  templateUrl: './sub-admins-management.component.html',
  styleUrls: ['./sub-admins-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
})
export class SubAdminsManagementComponent implements OnInit {
  subAdmins: SubAdmin[] = [
    {
      id: 1,
      firstName: 'Cody',
      lastName: 'Bayer',
      email: 'Hamill@gmail.com',
      status: 'active',
      permissions: [15, 16, 17, 18, 20, 21, 22, 23, 24], // Sample permission IDs
    },
    {
      id: 2,
      firstName: 'Thomas',
      lastName: 'Hamill',
      email: 'sper80@gmail.com',
      status: 'suspended',
      permissions: [15, 16, 17, 25, 26, 27, 28], // Sample permission IDs
    },
  ];

  availablePermissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showAddPermissionsModal = false;
  showEditPermissionsModal = false;
  selectedSubAdmin: SubAdmin = this.getEmptySubAdmin();
  searchQuery = '';
  isLoading = false;

  // Validation error properties
  validationMessage: string | null = null;
  validationErrors: { [key: string]: string[] } = {};

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private rolesService: RolesService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  private loadPermissions(): void {
    this.rolesService.getPermissions().subscribe({
      next: (permissions) => {
        console.log('Permissions API Response:', permissions);
        this.availablePermissions = permissions;
        this.groupPermissions();
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
      },
    });
  }

  private groupPermissions(): void {
    const groups: { [key: string]: Permission[] } = {};

    this.availablePermissions.forEach((permission) => {
      const [category] = permission.name.split('.');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    this.permissionGroups = Object.keys(groups).map((key) => ({
      name: key,
      permissions: groups[key],
    }));
  }

  private getEmptySubAdmin(): SubAdmin {
    return {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      status: 'active',
      permissions: [],
    };
  }

  toggleModal(modal: string) {
    switch (modal) {
      case 'add':
        this.showAddModal = !this.showAddModal;
        if (this.showAddModal) {
          this.selectedSubAdmin = this.getEmptySubAdmin();
          this.clearValidationErrors();
        }
        break;
      case 'edit':
        this.showEditModal = !this.showEditModal;
        if (this.showEditModal) {
          this.clearValidationErrors();
        }
        break;
      case 'delete':
        this.showDeleteModal = !this.showDeleteModal;
        break;
      case 'addPermissions':
        this.showAddPermissionsModal = !this.showAddPermissionsModal;
        break;
      case 'editPermissions':
        this.showEditPermissionsModal = !this.showEditPermissionsModal;
        break;
    }
  }

  openEditModal(subAdmin: SubAdmin) {
    this.selectedSubAdmin = { ...subAdmin };
    this.showEditModal = true;
    this.clearValidationErrors();
  }

  openDeleteModal(subAdmin: SubAdmin) {
    this.selectedSubAdmin = subAdmin;
    this.showDeleteModal = true;
  }

  saveSubAdmin() {
    if (this.showAddModal) {
      // Add new sub-admin using API
      this.createNewAdmin();
    } else if (this.showEditModal) {
      // Update existing sub-admin
      const index = this.subAdmins.findIndex(
        (sa) => sa.id === this.selectedSubAdmin.id
      );
      if (index !== -1) {
        this.subAdmins[index] = { ...this.selectedSubAdmin };
      }
      this.showEditModal = false;
    }
  }

  private createNewAdmin(): void {
    // Clear previous validation errors
    this.clearValidationErrors();
    this.isLoading = true;

    // Prepare admin data for API
    const adminData: CreateAdminRequest = {
      name: `${this.selectedSubAdmin.firstName} ${this.selectedSubAdmin.lastName}`,
      email: this.selectedSubAdmin.email,
      password: this.selectedSubAdmin.password || '',
      role: 'sub-admin', // You can make this configurable if needed
      active: this.selectedSubAdmin.status === 'active',
      permissions: this.selectedSubAdmin.permissions,
    };

    this.rolesService.createAdmin(adminData).subscribe({
      next: (response) => {
        console.log('Admin created successfully:', response);

        // Add to local array for immediate UI update
        const newSubAdmin = {
          ...this.selectedSubAdmin,
          id: Date.now(), // Temporary ID, should use ID from API response if available
        };
        this.subAdmins.push(newSubAdmin);

        // Close modal and reset form
        this.showAddModal = false;
        this.selectedSubAdmin = this.getEmptySubAdmin();
        this.isLoading = false;
        this.clearValidationErrors();

        // You can add success toast/notification here
        alert('Sub-admin created successfully!');
      },
      error: (error) => {
        console.error('Error creating admin:', error);
        this.isLoading = false;

        // Handle validation errors (422 status)
        if (error.status === 422) {
          // For 422 errors, we only show field-specific errors, no general message
          this.validationMessage = null;
          this.validationErrors = error.error?.errors || {};
        } else if (error.error?.errors) {
          // Handle case where error is HttpErrorResponse with validation errors
          this.validationMessage = null;
          this.validationErrors = error.error.errors;
        } else {
          // For other errors, show general error message
          this.validationMessage =
            error.message || 'An error occurred while creating the sub-admin.';
        }
      },
    });
  }

  deleteSubAdmin() {
    const index = this.subAdmins.findIndex(
      (sa) => sa.id === this.selectedSubAdmin.id
    );
    if (index !== -1) {
      this.subAdmins.splice(index, 1);
    }
    this.showDeleteModal = false;
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (this.showAddPermissionsModal || this.showEditPermissionsModal) {
      const isChecked = checkbox.checked;
      if (isChecked) {
        // Select all permissions
        this.selectedSubAdmin.permissions = this.availablePermissions.map(
          (p) => p.id
        );
      } else {
        // Deselect all permissions
        this.selectedSubAdmin.permissions = [];
      }
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedSubAdmin.permissions.includes(permissionId);
  }

  togglePermission(permissionId: number): void {
    const index = this.selectedSubAdmin.permissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedSubAdmin.permissions.splice(index, 1);
    } else {
      this.selectedSubAdmin.permissions.push(permissionId);
    }
  }

  isAllSelected(): boolean {
    return (
      this.availablePermissions.length > 0 &&
      this.selectedSubAdmin.permissions.length ===
        this.availablePermissions.length
    );
  }

  isIndeterminate(): boolean {
    return (
      this.selectedSubAdmin.permissions.length > 0 &&
      this.selectedSubAdmin.permissions.length <
        this.availablePermissions.length
    );
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.subAdmins.sort((a, b) => {
      let valueA = a[column as keyof SubAdmin];
      let valueB = b[column as keyof SubAdmin];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return 0;
    });
  }

  get filteredSubAdmins() {
    return this.subAdmins.filter(
      (subAdmin) =>
        subAdmin.firstName
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        subAdmin.lastName
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        subAdmin.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  isFormValid(): boolean {
    // Always return true to allow the save button to be clicked
    // Validation will be handled in the createNewAdmin method and displayed as errors
    return true;
  }

  toggleStatus(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.selectedSubAdmin.status = checkbox.checked ? 'active' : 'suspended';
  }

  hasAnyPermission(permissionIds: number[]): boolean {
    return permissionIds && permissionIds.length > 0;
  }

  getPermissionName(permissionId: number): string {
    const permission = this.availablePermissions.find(
      (p) => p.id === permissionId
    );
    return permission ? permission.name : '';
  }

  getPermissionsByGroup(groupName: string): Permission[] {
    const group = this.permissionGroups.find((g) => g.name === groupName);
    return group ? group.permissions : [];
  }

  formatPermissionName(permissionName: string): string {
    // Extract the action part from permission name (e.g., "user.create" -> "create")
    const parts = permissionName.split('.');
    if (parts.length > 1) {
      const action = parts[1];
      // Capitalize first letter and return formatted name
      return action.charAt(0).toUpperCase() + action.slice(1);
    }
    return permissionName;
  }

  formatGroupName(groupName: string): string {
    // Format group names for display
    const formatMap: { [key: string]: string } = {
      user: 'Users',
      property: 'Properties',
      tenant: 'Tenants',
      contract: 'Contracts',
      agent: 'Agents',
      rent_request: 'Rent Requests',
    };
    return (
      formatMap[groupName] ||
      groupName.charAt(0).toUpperCase() + groupName.slice(1)
    );
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors(): void {
    this.validationMessage = null;
    this.validationErrors = {};
  }

  /**
   * Check if a field has validation errors
   */
  hasFieldError(fieldName: string): boolean {
    return (
      this.validationErrors[fieldName] &&
      this.validationErrors[fieldName].length > 0
    );
  }

  /**
   * Get validation error messages for a field
   */
  getFieldErrors(fieldName: string): string[] {
    return this.validationErrors[fieldName] || [];
  }

  /**
   * Get validation error field names for template iteration
   */
  getValidationErrorFields(): string[] {
    return Object.keys(this.validationErrors);
  }
}
