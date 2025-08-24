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
    this.loading = true;
    this.error = null;
    // Replace with your actual token retrieval logic
    const token = localStorage.getItem('token') || '';
    this.agentPropertiesService.getAgentProperties(token).subscribe({
      next: (res: any) => {
        this.properties = (res?.data || []).map((item: any) => ({
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
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load properties.';
        this.toastService.show(this.error);
        this.loading = false;
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
      const token = localStorage.getItem('token') || '';
      this.agentPropertiesService.deleteAgentProperty(id, token).subscribe({
        next: () => {
          // Update local properties array after deletion
          this.properties = this.properties.filter((p) => p.id !== id);
          this.totalItems = this.properties.length;
          // Adjust pagination if needed
          if (this.paginatedProperties.length === 0 && this.currentPage > 1) {
            this.currentPage--;
          }
        },
        error: (err: any) => {
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
