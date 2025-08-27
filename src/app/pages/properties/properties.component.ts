import { Component } from '@angular/core';
import { AgentPropertiesService } from '../../../services/agent-properties.service';
import { ToastService } from '../../../services/toast.service';
import { PropertiesService } from '../../../services/properties.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Add this import
import { TranslateModule } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    TranslateModule,
    CommonModule,
    ToastComponent,
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent {
  properties: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  Math = Math;
  loading = false;
  error: string | null = null;
  get currentLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }

  getLocalizedPropertyName(item: any): string {
    return this.currentLanguage === 'ar' ? item.title_ar : item.title;
  }

  constructor(
    private propertiesService: PropertiesService,
    private router: Router,
    public userRoleService: UserRoleService,
    private agentPropertiesService: AgentPropertiesService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('token') || '';
    this.agentPropertiesService
      .getAgentProperties(
        token,
        this.searchTerm,
        this.currentPage,
        this.itemsPerPage
      )
      .subscribe({
        next: (response: any) => {
          console.log('API Response:', response);
          console.log('Search term:', this.searchTerm);
          console.log('Current page:', this.currentPage);
          console.log('Items per page:', this.itemsPerPage);

          this.properties = (response?.data || []).map((item: any) => ({
            id: item.id,
            title: item.name_en,
            title_ar: item.name_ar,
            description: item.description_en,
            description_ar: item.description_ar,
            cardImage:
              item.primary_image_url || '/assets/images/default-property.jpg',
            address: {
              street: item.district,
              city: item.city,
              region: item.region,
              country: item.country,
            },
            annual_rent: item.annual_rent,
            posted_date: item.created_at,
            property_details: {
              posted_date: item.created_at,
              bedrooms: item.bedrooms,
              bathrooms: item.bathrooms,
              area: item.area,
              furnishing_status: item.furnishing_status,
            },
            category: item.category,
            type: item.type,
            images: item.images,
            amenities: item.amenities,
          }));

          // Set pagination data from API response
          this.totalItems = response?.total || response?.data?.length || 0;
          this.totalPages =
            response?.last_page ||
            Math.ceil(this.totalItems / this.itemsPerPage);
          this.currentPage = response?.current_page || 1;

          console.log('Component state after update:');
          console.log('totalItems:', this.totalItems);
          console.log('totalPages:', this.totalPages);
          console.log('currentPage:', this.currentPage);
          console.log('properties length:', this.properties.length);

          this.loading = false;
        },
        error: (err: any) => {
          console.error('API Error:', err);
          this.error = 'Failed to load properties.';
          this.toastService.show(this.error);
          this.loading = false;
        },
      });
  }

  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadProperties();
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
      const token = localStorage.getItem('token') || '';
      this.agentPropertiesService.deleteAgentProperty(id, token).subscribe({
        next: () => {
          // Reload properties after deletion
          this.loadProperties();
        },
        error: (err: any) => {
          console.error('Error deleting property:', err);
        },
      });
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProperties();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProperties();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProperties();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < this.totalPages) {
        pages.push(i);
      }
    }

    return pages;
  }

  createProperty(): void {
    this.router.navigate(['/agent/create-property']);
  }
}
