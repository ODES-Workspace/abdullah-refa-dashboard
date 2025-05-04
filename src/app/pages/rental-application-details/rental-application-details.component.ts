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
  status: 'Approved' | 'Pending' | 'Rejected';
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
  allItems: RentalApplication[] = [
    {
      id: 1,
      propertyName: 'Property 1',
      tenantName: 'John Doe',
      ownerName: 'John Doe',
      city: 'Riyadh',
      status: 'Approved',
      propertyCategory: 'Apartment',
      propertyType: 'Apartment',
      dateAdded: '2023-07-31',
      dateModified: '2023-07-31',
      rejectedReason: 'Reason for rejection',
    },
    {
      id: 2,
      propertyName: 'Property 2',
      tenantName: 'John Doe',
      ownerName: 'John Doe',
      city: 'Riyadh',
      status: 'Approved',
      propertyCategory: 'Apartment',
      propertyType: 'Apartment',
      dateAdded: '2023-07-31',
      dateModified: '2023-07-31',
      rejectedReason: 'Reason for rejection',
    },
  ];
  application: RentalApplication | null = null;
  applicationId: number | null = null;
  activeTab: 'overview' | 'assessment' | 'schedule' = 'overview';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.applicationId = +params['id'];
      this.loadApplicationDetails();
    });
  }

  loadApplicationDetails(): void {
    if (this.applicationId) {
      this.application =
        this.allItems.find((item) => item.id === this.applicationId) ?? null;
    }
  }
}
