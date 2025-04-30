import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-property-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-edit.component.html',
  styleUrl: './property-edit.component.scss',
})
export class PropertyEditComponent implements OnInit {
  property: any = {};
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getPropertyById(+id).subscribe({
        next: (property) => {
          if (property) {
            const { color_tag, ...propertyWithoutColor } = property;
            this.property = propertyWithoutColor;
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

  onSubmit(): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const { color_tag, ...propertyWithoutColor } = this.property;

    this.propertiesService
      .updateProperty(this.property.id, propertyWithoutColor)
      .subscribe({
        next: (success) => {
          if (success) {
            this.successMessage = 'Property updated successfully!';
            setTimeout(() => {
              this.router.navigate(['/admin/properties']);
            }, 2000);
          } else {
            this.error = 'Failed to update property';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error updating property';
          this.isLoading = false;
          console.error(err);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/admin/properties']);
  }
}
