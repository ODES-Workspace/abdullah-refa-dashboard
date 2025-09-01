import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ToastComponent } from '../toast/toast.component';
import { TranslateService } from '@ngx-translate/core';
import {
  RolesService,
  Permission,
  CreateAdminRequest,
} from '../../../services/roles.service';
import {
  AdminsService,
  Admin,
  AdminPermission,
  UpdateAdminRequest,
} from '../../../services/admins.service';
import { ToastService } from '../../../services/toast.service';

interface SubAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  status: 'active' | 'suspended';
  role: 'admin' | 'sub-admin';
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
  imports: [CommonModule, FormsModule, TranslateModule, ToastComponent],
})
export class SubAdminsManagementComponent implements OnInit {
  // Make Math available in template
  Math = Math;

  subAdmins: SubAdmin[] = [
    {
      id: 1,
      firstName: 'Cody',
      lastName: 'Bayer',
      email: 'Hamill@gmail.com',
      status: 'active',
      role: 'sub-admin',
      permissions: [15, 16, 17, 18, 20, 21, 22, 23, 24], // Sample permission IDs
    },
    {
      id: 2,
      firstName: 'Thomas',
      lastName: 'Hamill',
      email: 'sper80@gmail.com',
      status: 'suspended',
      role: 'sub-admin',
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
  currentLang = 'en';

  // Validation error properties
  validationMessage: string | null = null;
  validationErrors: { [key: string]: string[] } = {};

  // Pagination properties
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Current user admin details
  currentUserRole: string | null = null;
  currentUserActive: number | null = null;
  canViewSubAdmins = false;

  constructor(
    private rolesService: RolesService,
    private adminsService: AdminsService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Initialize current language
    this.currentLang =
      this.translate.currentLang || this.translate.getDefaultLang();

    // Subscribe to language changes
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });

    this.loadPermissions();
    this.loadAdmins(1);
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

  private loadAdmins(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;

    // Add pagination parameters to the API call
    const params = new URLSearchParams();
    params.set('page', page.toString());

    this.adminsService.getAdmins(params).subscribe({
      next: (response) => {
        console.log('Admins API Response:', response);
        // Map API response to SubAdmin interface
        this.subAdmins = response.data.map((admin: Admin) => ({
          id: admin.id,
          firstName: admin.name.split(' ')[0] || admin.name,
          lastName: admin.name.split(' ').slice(1).join(' ') || '',
          email: admin.email,
          status: admin.active === 1 ? 'active' : 'suspended',
          role: (admin.role as 'admin' | 'sub-admin') || 'sub-admin',
          permissions: admin.permissions
            ? admin.permissions.map((p: AdminPermission) => p.id)
            : [],
        }));

        console.log('Mapped subAdmins:', this.subAdmins);
        console.log('First admin permissions:', this.subAdmins[0]?.permissions);

        // After loading admins, fetch details for the current user admin to console log
        this.loadCurrentUserAdminDetails();

        // Update pagination info
        this.totalItems = response.total || response.data.length;
        this.totalPages = response.last_page || 1;

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.isLoading = false;

        // Set pagination for hardcoded data as fallback
        this.totalItems = this.subAdmins.length;
        this.totalPages = 1;
      },
    });
  }

  private loadCurrentUserAdminDetails(): void {
    // Get admin id from user_data in localStorage and fetch admin details
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.id) {
          console.log('Current user ID from localStorage:', userData.id);

          // Fetch individual admin details by ID and console log the response
          this.adminsService.getAdminById(userData.id).subscribe({
            next: (adminDetail: Admin) => {
              console.log(`Admin Details for ID ${userData.id}:`, adminDetail);
              console.log('Full admin details response:', adminDetail);

              // Set current user details and determine if they can view sub-admins
              this.currentUserRole = adminDetail.role;
              this.currentUserActive = adminDetail.active;
              this.canViewSubAdmins =
                adminDetail.role === 'admin' && adminDetail.active === 1;

              console.log('Current user role:', this.currentUserRole);
              console.log(
                'Current user active status:',
                this.currentUserActive
              );
              console.log('Can view sub-admins:', this.canViewSubAdmins);
            },
            error: (error: any) => {
              console.error(
                `Error fetching admin details for ID ${userData.id}:`,
                error
              );
            },
          });
        } else {
          console.log('No user ID found in user_data');
        }
      } else {
        console.log('No user_data found in localStorage');
      }
    } catch (e) {
      console.error('Error parsing user_data from localStorage:', e);
    }
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
      password: '',
      status: 'active',
      role: 'sub-admin',
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
    // Create a deep copy to avoid modifying the original data
    this.selectedSubAdmin = {
      id: subAdmin.id,
      firstName: subAdmin.firstName,
      lastName: subAdmin.lastName,
      email: subAdmin.email,
      password: '', // Reset password for security
      status: subAdmin.status,
      role: subAdmin.role,
      permissions: subAdmin.permissions.map((p) => Number(p)), // Ensure permissions are numbers
    };

    console.log('Original permissions:', subAdmin.permissions);
    console.log('Selected permissions:', this.selectedSubAdmin.permissions);
    console.log('Available permissions:', this.availablePermissions);

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
      // Update existing sub-admin using API
      this.updateAdmin();
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
      role: this.selectedSubAdmin.role,
      active: this.selectedSubAdmin.status === 'active',
      permissions: this.selectedSubAdmin.permissions,
    };

    this.rolesService.createAdmin(adminData).subscribe({
      next: (response) => {
        console.log('Admin created successfully:', response);

        // Close modal and reset form
        this.showAddModal = false;
        this.selectedSubAdmin = this.getEmptySubAdmin();
        this.isLoading = false;
        this.clearValidationErrors();

        // Reload admins from API to get the updated list
        this.loadAdmins(1);

        // Show success toast
        if (this.currentLang === 'ar') {
          this.toastService.show('تم إنشاء المسؤول الفرعي بنجاح');
        } else {
          this.toastService.show('Admin created successfully!');
        }
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
            error.message ||
            (this.currentLang === 'ar'
              ? 'حدث خطأ أثناء إنشاء المسؤول الفرعي.'
              : 'An error occurred while creating the sub-admin.');
        }
      },
    });
  }

  private updateAdmin(): void {
    // Clear previous validation errors
    this.clearValidationErrors();
    this.isLoading = true;

    // Prepare admin data for API
    const adminData: UpdateAdminRequest = {
      name: `${this.selectedSubAdmin.firstName} ${this.selectedSubAdmin.lastName}`,
      email: this.selectedSubAdmin.email,
      role: this.selectedSubAdmin.role,
      active: this.selectedSubAdmin.status === 'active',
      permissions: this.selectedSubAdmin.permissions.map((p) => Number(p)), // Ensure permissions are numbers
      ...(this.selectedSubAdmin.password && {
        password: this.selectedSubAdmin.password,
      }), // Only include password if provided
    };

    // Try sending permissions as array first, if that fails, try individual fields
    const alternativeData: any = { ...adminData };

    // Keep the original permissions array
    alternativeData.permissions = this.selectedSubAdmin.permissions.map((p) =>
      Number(p)
    );

    // Also add individual fields as backup
    this.selectedSubAdmin.permissions.forEach((permissionId, index) => {
      alternativeData[`permissions.${index}`] = Number(permissionId);
    });

    console.log('Alternative data format:', alternativeData);
    console.log('Permissions in alternativeData:', alternativeData.permissions);
    console.log('Permissions type check:', {
      original: this.selectedSubAdmin.permissions,
      mapped: adminData.permissions,
      types: adminData.permissions.map((p) => typeof p),
    });

    this.adminsService
      .updateAdmin(this.selectedSubAdmin.id, alternativeData)
      .subscribe({
        next: (response) => {
          console.log('Admin updated successfully:', response);

          // Close modal and reset form
          this.showEditModal = false;
          this.selectedSubAdmin = this.getEmptySubAdmin();
          this.isLoading = false;
          this.clearValidationErrors();

          // Reload admins from API to get the updated list
          this.loadAdmins(1);

          // Show success toast
          if (this.currentLang === 'ar') {
            this.toastService.show('تم تحديث البيانات بنجاح');
          } else {
            this.toastService.show('Admin updated successfully!');
          }
        },
        error: (error) => {
          console.error('Error updating admin:', error);
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
              error.message ||
              (this.currentLang === 'ar'
                ? 'حدث خطأ أثناء تحديث المسؤول الفرعي.'
                : 'An error occurred while updating the sub-admin.');
          }
        },
      });
  }

  deleteSubAdmin() {
    if (!this.selectedSubAdmin.id) {
      console.error('No admin selected for deletion');
      return;
    }

    this.isLoading = true;

    this.adminsService.deleteAdmin(this.selectedSubAdmin.id).subscribe({
      next: (response) => {
        console.log('Admin deleted successfully:', response);

        // Close modal and reset form
        this.showDeleteModal = false;
        this.selectedSubAdmin = this.getEmptySubAdmin();
        this.isLoading = false;

        // Show success toast
        if (this.currentLang === 'ar') {
          this.toastService.show('تم حذف المسؤول بنجاح');
        } else {
          this.toastService.show('Admin deleted successfully!');
        }

        // Reload admins from API to get the updated list
        this.loadAdmins(1);
      },
      error: (error) => {
        console.error('Error deleting admin:', error);
        this.isLoading = false;

        // Show error toast
        if (this.currentLang === 'ar') {
          this.toastService.show('فشل في حذف المسؤول. يرجى المحاولة مرة أخرى.');
        } else {
          this.toastService.show('Failed to delete admin. Please try again.');
        }
      },
    });
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (this.showAddPermissionsModal || this.showEditPermissionsModal) {
      const isChecked = checkbox.checked;
      if (isChecked) {
        // Select all permissions
        this.selectedSubAdmin.permissions = this.availablePermissions.map((p) =>
          Number(p.id)
        );
      } else {
        // Deselect all permissions
        this.selectedSubAdmin.permissions = [];
      }
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedSubAdmin.permissions.some(
      (p) => Number(p) === permissionId
    );
  }

  togglePermission(permissionId: number): void {
    const index = this.selectedSubAdmin.permissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedSubAdmin.permissions.splice(index, 1);
    } else {
      this.selectedSubAdmin.permissions.push(Number(permissionId)); // Ensure it's a number
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

  getPermissionsByCategory(): { [key: string]: string[] } {
    const categories: { [key: string]: string[] } = {};

    this.selectedSubAdmin.permissions.forEach((permissionId) => {
      const permission = this.availablePermissions.find(
        (p) => p.id === permissionId
      );
      if (permission) {
        const [category] = permission.name.split('.');
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(permission.name);
      }
    });

    return categories;
  }

  formatCategoryName(categoryName: string): string {
    const formatMap: { [key: string]: string } = {
      user: 'Users',
      property: 'Properties',
      tenant: 'Tenants',
      contract: 'Contracts',
      agent: 'Agents',
      rent_request: 'Rent Requests',
    };
    return (
      formatMap[categoryName] ||
      categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    );
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

  // Pagination methods
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadAdmins(page);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedSubAdmins(): SubAdmin[] {
    // Since the API returns paginated data, we don't need to slice
    // The subAdmins array already contains only the current page's data
    return this.subAdmins;
  }
}
