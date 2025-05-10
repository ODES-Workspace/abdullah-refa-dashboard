import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface SubAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  status: 'active' | 'suspended';
  permissions: {
    properties: {
      show: boolean;
      view: boolean;
      delete: boolean;
      edit: boolean;
    };
    tenants: {
      show: boolean;
      view: boolean;
      delete: boolean;
      edit: boolean;
    };
    agenciesOwner: {
      show: boolean;
      view: boolean;
      delete: boolean;
      edit: boolean;
    };
    rentRequest: {
      show: boolean;
      view: boolean;
      delete: boolean;
      edit: boolean;
    };
    contracts: {
      show: boolean;
      view: boolean;
      delete: boolean;
      edit: boolean;
    };
  };
}

interface PermissionCategory {
  show: boolean;
  view: boolean;
  delete: boolean;
  edit: boolean;
}

@Component({
  selector: 'app-sub-admins-management',
  templateUrl: './sub-admins-management.component.html',
  styleUrls: ['./sub-admins-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
})
export class SubAdminsManagementComponent {
  subAdmins: SubAdmin[] = [
    {
      id: 1,
      firstName: 'Cody',
      lastName: 'Bayer',
      email: 'Hamill@gmail.com',
      status: 'active',
      permissions: {
        properties: {
          show: true,
          view: true,
          delete: true,
          edit: true,
        },
        tenants: {
          show: true,
          view: true,
          delete: false,
          edit: true,
        },
        agenciesOwner: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        rentRequest: {
          show: true,
          view: true,
          delete: true,
          edit: true,
        },
        contracts: {
          show: true,
          view: true,
          delete: true,
          edit: true,
        },
      },
    },
    {
      id: 2,
      firstName: 'Thomas',
      lastName: 'Hamill',
      email: 'sper80@gmail.com',
      status: 'suspended',
      permissions: {
        properties: {
          show: true,
          view: true,
          delete: false,
          edit: true,
        },
        tenants: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        agenciesOwner: {
          show: true,
          view: true,
          delete: true,
          edit: true,
        },
        rentRequest: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        contracts: {
          show: true,
          view: true,
          delete: true,
          edit: true,
        },
      },
    },
  ];

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showAddPermissionsModal = false;
  showEditPermissionsModal = false;
  selectedSubAdmin: SubAdmin = this.getEmptySubAdmin();
  searchQuery = '';

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  private getEmptySubAdmin(): SubAdmin {
    return {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      status: 'active',
      permissions: {
        properties: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        tenants: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        agenciesOwner: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        rentRequest: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
        contracts: {
          show: false,
          view: false,
          delete: false,
          edit: false,
        },
      },
    };
  }

  toggleModal(modal: string) {
    switch (modal) {
      case 'add':
        this.showAddModal = !this.showAddModal;
        if (this.showAddModal) {
          this.selectedSubAdmin = this.getEmptySubAdmin();
        }
        break;
      case 'edit':
        this.showEditModal = !this.showEditModal;
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
  }

  openDeleteModal(subAdmin: SubAdmin) {
    this.selectedSubAdmin = subAdmin;
    this.showDeleteModal = true;
  }

  saveSubAdmin() {
    if (this.showAddModal) {
      // Add new sub-admin
      const newSubAdmin = {
        ...this.selectedSubAdmin,
        id: this.subAdmins.length + 1,
      };
      this.subAdmins.push(newSubAdmin);
      this.showAddModal = false;
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
      Object.keys(this.selectedSubAdmin.permissions).forEach((key) => {
        const category = key as keyof typeof this.selectedSubAdmin.permissions;
        this.selectedSubAdmin.permissions[category] = {
          show: isChecked,
          view: isChecked,
          delete: isChecked,
          edit: isChecked,
        };
      });
    }
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
    if (this.showAddModal) {
      return !!(
        this.selectedSubAdmin.firstName &&
        this.selectedSubAdmin.lastName &&
        this.selectedSubAdmin.email &&
        this.selectedSubAdmin.password
      );
    }
    return !!(
      this.selectedSubAdmin.firstName &&
      this.selectedSubAdmin.lastName &&
      this.selectedSubAdmin.email
    );
  }

  toggleStatus(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.selectedSubAdmin.status = checkbox.checked ? 'active' : 'suspended';
  }

  hasAnyPermission(permissions: PermissionCategory): boolean {
    return (
      permissions.show ||
      permissions.view ||
      permissions.delete ||
      permissions.edit
    );
  }
}
