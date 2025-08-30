import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RentRequestsService } from '../../../services/rent-requests.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { UserRoleService } from '../../../services/user-role.service';
import { PropertyTypesService } from '../../../services/property-types.service';

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
  allItems: RentalApplication[] = [];
  application: RentalApplication | null = null;
  applicationId: number | null = null;
  rentRequest: any | null = null;
  propertyTypeLabel: string = '-';

  private typeIdToName: { [id: number]: string } = {};
  private typesRaw: any[] = [];
  private currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';
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

  // Derive employment status from available data
  get isEmployed(): boolean {
    const employerName: string | undefined = this.rentRequest?.employer_name;
    return !!(employerName && employerName.trim().length > 0);
  }

  constructor(
    private route: ActivatedRoute,
    public userRoleService: UserRoleService,
    private rentRequestsService: RentRequestsService,
    private propertyTypesService: PropertyTypesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Load property types for mapping
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (res: any) => {
        this.typesRaw = res?.data || [];
        this.rebuildTypeMap();
        this.updatePropertyTypeLabel();
      },
      error: () => {
        this.typesRaw = [];
        this.typeIdToName = {};
        this.updatePropertyTypeLabel();
      },
    });

    // React to language changes
    this.translate.onLangChange.subscribe((event) => {
      const newLang = event.lang === 'ar' ? 'ar' : 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.rebuildTypeMap();
        this.updatePropertyTypeLabel();
      }
    });

    // Load details
    this.route.params.subscribe((params) => {
      this.applicationId = +params['id'];
      this.loadApplicationDetails();
      if (this.applicationId) {
        this.rentRequestsService
          .getRentRequestById(this.applicationId)
          .subscribe({
            next: (res) => {
              console.log(res);
              this.rentRequest = res;
              this.updatePropertyTypeLabel();
              this.hydrateApplicationFromRentRequest();
            },
            error: (err) => {
              console.error('Failed to fetch rent request details:', err);
            },
          });
      }
    });
  }

  loadApplicationDetails(): void {
    this.application = null;
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

  private rebuildTypeMap(): void {
    this.typeIdToName = {};
    this.typesRaw.forEach((t: any) => {
      this.typeIdToName[t.id] =
        this.currentLang === 'ar' ? t.name_ar : t.name_en;
    });
  }

  private updatePropertyTypeLabel(): void {
    const typeId = this.rentRequest?.property?.property_type_id;
    this.propertyTypeLabel = typeId ? this.typeIdToName[typeId] || '-' : '-';
  }

  private hydrateApplicationFromRentRequest(): void {
    const rr = this.rentRequest;
    if (!rr) return;

    const numInstallments: number = Number(rr.number_of_installments) || 0;
    const installmentAmount: number = Number(rr.expected_monthly_cost) || 0;

    const createdAt: Date = rr.created_at
      ? new Date(rr.created_at)
      : new Date();
    const firstDueDate = new Date(createdAt);
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);

    const totalAmount: number = installmentAmount * numInstallments;
    let remainingBalance: number = totalAmount;

    const schedule: ScheduleItem[] = Array.from(
      { length: numInstallments },
      (_, index) => {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(firstDueDate.getMonth() + index);
        // Balance after this payment
        remainingBalance = Math.max(0, remainingBalance - installmentAmount);
        return {
          dueDate: dueDate.toISOString().split('T')[0],
          amount: installmentAmount,
          balance: remainingBalance,
          status: 'upcoming',
        } as ScheduleItem;
      }
    );

    // Build a minimal application model for the schedule tab
    this.application = {
      id: rr.id,
      propertyName: rr.property?.name_en || rr.property?.name_ar || '-',
      tenantName: rr.name || '-',
      ownerName: rr.property?.name || '-',
      city: rr.property?.city || '-',
      propertyCategory: rr.property?.property_category_id?.toString() || '-',
      propertyType: this.propertyTypeLabel || '-',
      dateAdded: rr.created_at ? rr.created_at.split('T')[0] : '-',
      dateModified: rr.updated_at ? rr.updated_at.split('T')[0] : '-',
      status: 'Pending',
      scheduleStatus: 'upcoming',
      schedule,
    } as RentalApplication;
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
