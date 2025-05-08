import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface ScheduleItem {
  dueDate: string;
  amount: number;
  balance: number;
  status: 'upcoming' | 'approved' | 'rejected';
}

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
  scheduleStatus: 'upcoming' | 'approved' | 'rejected';
  schedule?: ScheduleItem[];
}

type SortField = 'dueDate' | 'amount' | 'balance' | 'status';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-rental-application-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
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
      scheduleStatus: 'upcoming',
      schedule: [
        {
          dueDate: 'March 25',
          amount: 9091.66,
          balance: 50000.0,
          status: 'rejected',
        },
        {
          dueDate: 'April 25',
          amount: 9091.66,
          balance: 40908.34,
          status: 'approved',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
      ],
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
      scheduleStatus: 'approved',
      schedule: [
        {
          dueDate: 'March 25',
          amount: 9091.66,
          balance: 50000.0,
          status: 'approved',
        },
        {
          dueDate: 'April 25',
          amount: 9091.66,
          balance: 40908.34,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
        {
          dueDate: 'May 25',
          amount: 9091.66,
          balance: 31816.68,
          status: 'upcoming',
        },
      ],
    },
  ];
  application: RentalApplication | null = null;
  applicationId: number | null = null;
  activeTab: 'overview' | 'assessment' | 'schedule' = this.getStoredActiveTab();
  showReviseModal = false;
  editedSchedule: ScheduleItem[] = [];
  statusOptions: ('upcoming' | 'approved' | 'rejected')[] = [
    'upcoming',
    'approved',
    'rejected',
  ];
  currentSortField: SortField | null = null;
  currentSortDirection: SortDirection = 'asc';

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

  approveSchedule(): void {
    if (this.application) {
      this.application.scheduleStatus = 'approved';
      this.application.dateModified = new Date().toISOString().split('T')[0];
    }
  }

  rejectSchedule(): void {
    if (this.application) {
      this.application.scheduleStatus = 'rejected';
      this.application.dateModified = new Date().toISOString().split('T')[0];
    }
  }

  openReviseModal(): void {
    if (this.application?.schedule) {
      this.editedSchedule = JSON.parse(
        JSON.stringify(this.application.schedule)
      );
      this.showReviseModal = true;
    }
  }

  closeReviseModal(): void {
    this.showReviseModal = false;
    this.editedSchedule = [];
  }

  submitRevise(): void {
    if (this.application && this.editedSchedule) {
      this.application.schedule = this.editedSchedule;
      this.application.dateModified = new Date().toISOString().split('T')[0];
      this.closeReviseModal();
    }
  }

  updateScheduleItem(
    index: number,
    field: keyof ScheduleItem,
    value: string | number
  ): void {
    if (this.editedSchedule[index]) {
      (this.editedSchedule[index][field] as any) = value;
    }
  }

  sortSchedule(field: SortField): void {
    if (!this.application?.schedule) return;

    if (this.currentSortField === field) {
      this.currentSortDirection =
        this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortField = field;
      this.currentSortDirection = 'asc';
    }

    this.application.schedule.sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];

      // Handle date comparison
      if (field === 'dueDate') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (valueA < valueB) {
        return this.currentSortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.currentSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private getStoredActiveTab(): 'overview' | 'assessment' | 'schedule' {
    const storedTab = localStorage.getItem('rentalApplicationActiveTab');
    return (storedTab as 'overview' | 'assessment' | 'schedule') || 'overview';
  }

  setActiveTab(tab: 'overview' | 'assessment' | 'schedule'): void {
    this.activeTab = tab;
    localStorage.setItem('rentalApplicationActiveTab', tab);
  }
}
