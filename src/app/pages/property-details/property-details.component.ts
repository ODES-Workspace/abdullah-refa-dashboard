import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';
import { AdminService } from '../../../services/admin.service';
import { MapComponent } from '../../ui/map/map.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, MapComponent],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss',
})
export class PropertyDetailsComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  propertyPermissions: string[] = [];

  get canReadProperties(): boolean {
    // Agents can always view, admins need permissions
    const userRole = this.userRoleService.getCurrentRole();
    if (userRole === 'agent') {
      return true; // Agents can always view
    }
    if (userRole === 'admin') {
      return (
        this.adminActive === 1 &&
        this.propertyPermissions.includes('property.read')
      );
    }
    return false; // Unknown role
  }

  lang: string = 'en';
  hasParking(): boolean {
    return (
      Array.isArray(this.property?.amenities) &&
      this.property.amenities.some((e: any) => e.name_en === 'Parking')
    );
  }
  property?: any = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private propertiesService: PropertiesService,
    private translate: TranslateService,
    public userRoleService: UserRoleService,
    private adminService: AdminService
  ) {
    this.lang = this.translate.currentLang || this.translate.getDefaultLang();
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
                this.propertyPermissions = (adminRes.permissions || [])
                  .filter((p) => p.name.startsWith('property.'))
                  .map((p) => p.name);
                console.log('Admin active:', this.adminActive);
                console.log('Property permissions:', this.propertyPermissions);
              },
              error: (err) => {
                console.error('Error fetching admin details:', err);
              },
            });
          }
        }
      } catch (e) {
        console.error('Error parsing user_data from localStorage:', e);
      }
    } else {
      // User is not admin, set permissions to empty array
      this.propertyPermissions = [];
      this.adminActive = null;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getAgentPropertyDetails(+id).subscribe({
        next: (property) => {
          if (property && property.data) {
            this.property = property.data;
          } else {
            this.error = 'Property not found';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error loading property details';
          this.isLoading = false;
          console.error(err);
        },
      });
    } else {
      this.error = 'Invalid property ID';
      this.isLoading = false;
    }
  }
}
