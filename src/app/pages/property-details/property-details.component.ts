import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss',
})
export class PropertyDetailsComponent implements OnInit {
  property?: any = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getPropertyById(+id).subscribe({
        next: (property) => {
          if (property) {
            this.property = property;
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
