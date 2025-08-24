import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { MapComponent } from '../../ui/map/map.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, MapComponent],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss',
})
export class PropertyDetailsComponent implements OnInit {
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
    private translate: TranslateService
  ) {
    this.lang = this.translate.currentLang || this.translate.getDefaultLang();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getAgentPropertyDetails(+id).subscribe({
        next: (property) => {
          if (property && property.data) {
            this.property = property.data;
            console.log('Agent Property Details:', property.data);
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
