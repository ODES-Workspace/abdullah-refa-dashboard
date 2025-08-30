import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RentRequestsService,
  ReviseRentRequestPayload,
} from '../../../services/rent-requests.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { UserRoleService } from '../../../services/user-role.service';
import { PropertyTypesService } from '../../../services/property-types.service';
import { CitiesService, City } from '../../../services/cities.service';
import { ToastService } from '../../../services/toast.service';

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
  private cityIdToName: { [id: number]: string } = {};
  private citiesRaw: City[] = [];
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
  isEditingAssessment = false;
  reviseForm: ReviseRentRequestPayload | null = null;
  incomeDocFile: File | null = null;
  creditDocFile: File | null = null;

  // Derive employment status from available data
  get isEmployed(): boolean {
    const employerName: string | undefined = this.rentRequest?.job_title;
    return !!(employerName && employerName.trim().length > 0);
  }

  constructor(
    private route: ActivatedRoute,
    public userRoleService: UserRoleService,
    private rentRequestsService: RentRequestsService,
    private propertyTypesService: PropertyTypesService,
    private translate: TranslateService,
    private citiesService: CitiesService,
    private toast: ToastService
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
        this.rebuildCityMap();
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

    // Load cities for mapping city_id -> localized city name
    this.citiesService.getCities().subscribe({
      next: (cities) => {
        this.citiesRaw = cities || [];
        this.rebuildCityMap();
      },
      error: () => {
        this.citiesRaw = [];
        this.cityIdToName = {};
      },
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

  private rebuildCityMap(): void {
    this.cityIdToName = {};
    this.citiesRaw.forEach((c: City) => {
      this.cityIdToName[c.id] =
        this.currentLang === 'ar' ? c.name_ar : c.name_en;
    });
  }

  getCityNameById(cityId: number | string | null | undefined): string {
    if (cityId === null || cityId === undefined || cityId === '') return '-';
    const id = Number(cityId);
    if (Number.isNaN(id)) return '-';
    return this.cityIdToName[id] || '-';
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

  // ===================== Assessment Edit/Revise =====================
  startEditingAssessment(): void {
    const rr = this.rentRequest;
    if (!rr) return;

    const dob = rr.date_of_birth ? rr.date_of_birth.toString() : '';
    const jobStart = rr.job_start_date ? rr.job_start_date.toString() : '';

    this.reviseForm = {
      id: rr.id,
      created_by: rr.created_by ?? 0,
      property_id: rr.property_id ?? rr.property?.id ?? 0,
      name: rr.name ?? '',
      email: rr.email ?? '',
      phone: rr.phone ?? '',
      city_id: rr.city_id ?? rr.property?.city_id ?? 0,
      date_of_birth: dob ? dob.substring(0, 10) : '',
      nationality: rr.nationality ?? 0,
      number_of_family_members: rr.number_of_family_members ?? 0,
      national_id: rr.national_id ?? '',
      job_title: rr.job_title ?? '',
      job_start_date: jobStart ? jobStart.substring(0, 10) : '',
      employer_name: rr.employer_name ?? '',
      working_place: rr.working_place ?? '',
      sector: rr.sector ?? '',
      subsector: rr.subsector ?? '',
      proof_of_income_document: rr.proof_of_income_document ?? '',
      credit_score_document: rr.credit_score_document ?? '',
      has_debts: !!rr.has_debts,
      debts_monthly_amount: rr.debts_monthly_amount ?? null,
      debts_remaining_months: rr.debts_remaining_months ?? null,
      monthly_income: rr.monthly_income ?? '0',
      expected_monthly_cost: rr.expected_monthly_cost ?? '0',
      number_of_installments: rr.number_of_installments ?? 0,
      additional_charges: {
        agent_fees: rr.additional_charges?.agent_fees ?? 0,
        eijar_fees: rr.additional_charges?.eijar_fees ?? '0',
        processing_fees: rr.additional_charges?.processing_fees ?? '0',
      },
      down_payment: rr.down_payment ?? '0',
      status: rr.status ?? 'pending',
      status_description: rr.status_description ?? null,
      created_at: rr.created_at ?? new Date().toISOString(),
      updated_at: rr.updated_at ?? new Date().toISOString(),
      monthly_installment: rr.monthly_installment ?? undefined,
    } as ReviseRentRequestPayload;

    this.isEditingAssessment = true;
  }

  cancelEditingAssessment(): void {
    this.isEditingAssessment = false;
    this.reviseForm = null;
    this.incomeDocFile = null;
    this.creditDocFile = null;
  }

  saveAssessment(): void {
    if (!this.applicationId || !this.reviseForm) return;

    const toIsoOrEmpty = (d: string | null | undefined): string =>
      d ? new Date(d).toISOString() : '';

    const useFormData = !!(this.incomeDocFile || this.creditDocFile);
    let payload: ReviseRentRequestPayload | FormData;

    if (useFormData) {
      const fd = new FormData();
      fd.append('id', String(this.reviseForm.id));
      fd.append('created_by', String(this.reviseForm.created_by));
      fd.append('property_id', String(this.reviseForm.property_id));
      fd.append('name', this.reviseForm.name ?? '');
      fd.append('email', this.reviseForm.email ?? '');
      fd.append('phone', this.reviseForm.phone ?? '');
      fd.append('city_id', String(this.reviseForm.city_id ?? 0));
      fd.append('date_of_birth', toIsoOrEmpty(this.reviseForm.date_of_birth));
      fd.append('nationality', String(this.reviseForm.nationality ?? 0));
      fd.append(
        'number_of_family_members',
        String(this.reviseForm.number_of_family_members ?? 0)
      );
      fd.append('national_id', this.reviseForm.national_id ?? '');
      fd.append('job_title', this.reviseForm.job_title ?? '');
      fd.append('job_start_date', toIsoOrEmpty(this.reviseForm.job_start_date));
      fd.append('employer_name', this.reviseForm.employer_name ?? '');
      fd.append('sector', this.reviseForm.sector ?? '');
      fd.append('subsector', this.reviseForm.subsector ?? '');
      if (this.incomeDocFile) {
        fd.append('proof_of_income_document', this.incomeDocFile);
      }
      if (this.creditDocFile) {
        fd.append('credit_score_document', this.creditDocFile);
      }
      fd.append('has_debts', String(this.reviseForm.has_debts));
      if (this.reviseForm.debts_monthly_amount !== null) {
        fd.append(
          'debts_monthly_amount',
          String(this.reviseForm.debts_monthly_amount)
        );
      }
      if (this.reviseForm.debts_remaining_months !== null) {
        fd.append(
          'debts_remaining_months',
          String(this.reviseForm.debts_remaining_months)
        );
      }
      fd.append('monthly_income', String(this.reviseForm.monthly_income));
      fd.append(
        'expected_monthly_cost',
        String(this.reviseForm.expected_monthly_cost)
      );
      fd.append(
        'number_of_installments',
        String(this.reviseForm.number_of_installments)
      );
      fd.append(
        'additional_charges[agent_fees]',
        String(this.reviseForm.additional_charges.agent_fees)
      );
      fd.append(
        'additional_charges[eijar_fees]',
        String(this.reviseForm.additional_charges.eijar_fees)
      );
      fd.append(
        'additional_charges[processing_fees]',
        String(this.reviseForm.additional_charges.processing_fees)
      );
      fd.append('down_payment', String(this.reviseForm.down_payment));
      fd.append('status', this.reviseForm.status ?? 'pending');
      if (this.reviseForm.status_description !== null) {
        fd.append(
          'status_description',
          this.reviseForm.status_description ?? ''
        );
      }
      fd.append(
        'created_at',
        this.reviseForm.created_at
          ? new Date(this.reviseForm.created_at).toISOString()
          : new Date().toISOString()
      );
      fd.append('updated_at', new Date().toISOString());
      if (this.reviseForm.monthly_installment !== undefined) {
        fd.append(
          'monthly_installment',
          String(this.reviseForm.monthly_installment)
        );
      }
      payload = fd;
    } else {
      // Build JSON payload but omit document fields so backend doesn't require files
      const {
        proof_of_income_document: _omitIncomeDoc,
        credit_score_document: _omitCreditDoc,
        working_place: _omitWorkingPlace,
        ...rest
      } = this.reviseForm;
      payload = {
        ...rest,
        date_of_birth: toIsoOrEmpty(this.reviseForm.date_of_birth),
        job_start_date: toIsoOrEmpty(this.reviseForm.job_start_date),
        created_at: this.reviseForm.created_at
          ? new Date(this.reviseForm.created_at).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ReviseRentRequestPayload;
    }

    this.rentRequestsService
      .reviseRentRequest(this.applicationId, payload)
      .subscribe({
        next: (res) => {
          this.rentRequest = res || this.rentRequest;
          this.isEditingAssessment = false;
          this.reviseForm = null;
          this.incomeDocFile = null;
          this.creditDocFile = null;
          this.updatePropertyTypeLabel();
          this.toast.show('Updated successfully');
        },
        error: () => {
          this.toast.show('Failed to update');
        },
      });
  }

  onIncomeDocSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.incomeDocFile = input.files && input.files[0] ? input.files[0] : null;
  }

  onCreditDocSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.creditDocFile = input.files && input.files[0] ? input.files[0] : null;
  }

  // ======== Edit helpers: show existing doc links / selected file names ========
  get currentIncomeDocUrl(): string | null {
    const path = this.rentRequest?.proof_of_income_document;
    return path ? `/${path}` : null;
  }

  get currentCreditDocUrl(): string | null {
    const path = this.rentRequest?.credit_score_document;
    return path ? `/${path}` : null;
  }

  private basename(path: string | null | undefined): string | null {
    if (!path) return null;
    try {
      const normalized = path.replace(/\\/g, '/');
      const parts = normalized.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  }

  get currentIncomeDocName(): string | null {
    if (this.incomeDocFile) return this.incomeDocFile.name;
    return this.basename(this.rentRequest?.proof_of_income_document);
  }

  get currentCreditDocName(): string | null {
    if (this.creditDocFile) return this.creditDocFile.name;
    return this.basename(this.rentRequest?.credit_score_document);
  }
}
