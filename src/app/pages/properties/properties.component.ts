import { Component } from '@angular/core';
import { PropertiesService } from '../../../services/properties.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Add this import
import { TranslateModule } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule, CommonModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent {
  properties: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  Math = Math;

  constructor(
    private propertiesService: PropertiesService,
    private router: Router,
    public userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.propertiesService.getProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.totalItems = data.length;
        // Log the properties to console
        console.log(this.properties);
      },
      error: (err) => {
        console.error('Error loading properties:', err);
      },
    });
  }

  viewProperty(id: number): void {
    const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    this.router.navigate([`/${basePath}/property`, id]);
  }

  editProperty(id: number): void {
    const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    this.router.navigate([`/${basePath}/property/edit`, id]);
  }

  deleteProperty(id: number): void {
    if (confirm('Are you sure you want to delete this property?')) {
      this.propertiesService.deleteProperty(id).subscribe({
        next: (success) => {
          if (success) {
            // Update local properties array after deletion
            this.properties = this.properties.filter((p) => p.id !== id);
            this.totalItems = this.properties.length;
            // Adjust pagination if needed
            if (this.paginatedProperties.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
          }
        },
        error: (err) => {
          console.error('Error deleting property:', err);
        },
      });
    }
  }

  get filteredProperties(): any[] {
    return this.properties.filter(
      (property) =>
        property.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        property.id.toString().includes(this.searchTerm)
    );
  }

  get paginatedProperties(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProperties.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.filteredProperties.length) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  createProperty(): void {
    this.router.navigate(['/agent/create-property']);
  }
}
