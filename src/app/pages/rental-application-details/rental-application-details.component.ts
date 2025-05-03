import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface RentalApplication {
  id: number;
  propertyName: string;
  tenantName: string;
  ownerName: string;
  city: string;
  propertyCategory: string;
  propertyType: string;
  dateAdded: string;
  dateModified: string;
  rejectedReason?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  monthlyRent?: number;
  leaseDuration?: string;
  additionalNotes?: string;
}

@Component({
  selector: 'app-rental-application-details',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './rental-application-details.component.html',
  styleUrl: './rental-application-details.component.scss',
})
export class RentalApplicationDetailsComponent implements OnInit {
  application: RentalApplication | null = null;
  applicationId: number | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.applicationId = +params['id'];
      this.loadApplicationDetails();
    });
  }

  loadApplicationDetails(): void {
    this.application = {
      id: this.applicationId!,
      propertyName: 'Property 1',
      tenantName: 'John Doe',
      ownerName: 'John Doe',
      city: 'Riyadh',
      propertyCategory: 'Apartment',
      propertyType: 'Apartment',
      dateAdded: '2023-07-31',
      dateModified: '2023-07-31',
    };
  }
}
