import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import {
  PropertiesService,
  CreatePropertyRequest,
} from '../../../services/properties.service';
import {
  PropertyTypesService,
  PropertyType,
} from '../../../services/property-types.service';
import {
  PropertyCategoriesService,
  PropertyCategory,
} from '../../../services/property-categories.service';
import { AmenitiesService, Amenity } from '../../../services/amenities.service';
import { LanguageService } from '../../../services/language.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ToastComponent],
  templateUrl: './property-create.component.html',
  styleUrl: './property-create.component.scss',
})
export class PropertyCreateComponent implements OnInit, AfterViewInit {
  // ...existing code...
  imageUploadError: string | null = null;
  formatFieldName(field: string): string {
    // Replace underscores with spaces and capitalize each word
    return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  backendError: string | null = null;
  backendFieldErrors: { [key: string]: string[] } = {};
  propertyForm: FormGroup;
  private map!: L.Map;
  private marker!: L.Marker;
  defaultLat = 24.7136; // Default latitude for Saudi Arabia
  defaultLng = 46.6753; // Default longitude for Saudi Arabia
  uploadedFiles: File[] = [];

  // Dynamic data properties
  propertyCategories: PropertyCategory[] = [];
  propertyTypes: PropertyType[] = [];
  filteredPropertyTypes: PropertyType[] = [];
  propertyAmenities: Amenity[] = [];
  distanceAmenities: Amenity[] = [];
  isLoading = false;
  currentLanguage = 'en';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertiesService: PropertiesService,
    private propertyTypesService: PropertyTypesService,
    private propertyCategoriesService: PropertyCategoriesService,
    private amenitiesService: AmenitiesService,
    private languageService: LanguageService,
    private toastService: ToastService
  ) {
    this.propertyForm = this.fb.group({
      propertyName: ['', Validators.required],
      propertyNameAr: ['', Validators.required],
      propertyCategory: ['', Validators.required],
      propertyType: ['', Validators.required],
      propertySize: ['', [Validators.required, Validators.min(0)]],
      availableFrom: ['', Validators.required],
      furnishment: ['', Validators.required],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      floorNumber: ['', [Validators.required, Validators.min(0)]],
      totalFloors: ['', [Validators.required, Validators.min(0)]],
      annualRent: ['', [Validators.required, Validators.min(0)]],
      depositAmount: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      descriptionAr: ['', Validators.required],
      addressLine1: ['', Validators.required],
      buildingName: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      latitude: [this.defaultLat, Validators.required],
      longitude: [this.defaultLng, Validators.required],
      images: [''],
      parkingArea: [false],
      medicalService: [false],
      petFriendly: [false],
      liftFacility: [false],
      cctv: [false],
      busStop: [''],
      hospital: [''],
      shop: [''],
      park: [''],
      school: [''],
      bank: [''],
      falLicenseId: ['', Validators.required],
      advertisingLicenseNo: ['', Validators.required],
      declaration: [false, Validators.requiredTrue],
    });

    // Listen for category changes to filter property types
    this.propertyForm
      .get('propertyCategory')
      ?.valueChanges.subscribe((categoryId) => {
        this.onCategoryChange(categoryId);
      });
  }

  ngOnInit(): void {
    this.currentLanguage = this.languageService.translate.currentLang || 'en';

    // Listen for language changes
    this.languageService.translate.onLangChange.subscribe((event) => {
      this.currentLanguage = event.lang;
      // Update error message if present
      if (this.imageUploadError) {
        this.imageUploadError =
          this.currentLanguage === 'ar'
            ? 'يُسمح فقط برفع الصور بصيغة PNG أو JPG.'
            : 'Only PNG or JPG images are allowed.';
      }
    });

    this.loadPropertyData();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  /**
   * Load property categories, types, and amenities from API
   */
  private loadPropertyData(): void {
    this.isLoading = true;

    // Load all property types first, then categories
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (response) => {
        this.propertyTypes = response.data;

        // Now load categories after property types are loaded
        this.propertyCategoriesService.getPropertyCategories().subscribe({
          next: (categoryResponse) => {
            this.propertyCategories = categoryResponse.data;

            // Load amenities
            this.loadAmenities();

            this.isLoading = false;

            // Check if there's a pre-selected category and trigger change
            const selectedCategory =
              this.propertyForm.get('propertyCategory')?.value;
            if (selectedCategory) {
              this.onCategoryChange(selectedCategory);
            }
          },
          error: (error) => {
            console.error('Error loading property categories:', error);
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading property types:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Load amenities from API
   */
  private loadAmenities(): void {
    // Load all amenities first
    this.amenitiesService.getAmenities().subscribe({
      next: (response) => {
        // Filter property amenities (features that don't require distance)
        this.propertyAmenities = response.data.filter(
          (amenity) => amenity.requires_distance === 0
        );

        // Filter distance amenities (nearby facilities that require distance)
        this.distanceAmenities = response.data.filter(
          (amenity) => amenity.requires_distance === 1
        );

        // Add form controls for amenities
        this.addAmenityFormControls();
        this.addDistanceAmenityFormControls();
      },
      error: (error) => {
        console.error('Error loading amenities:', error);
      },
    });
  }

  /**
   * Add form controls for property amenities (checkboxes)
   */
  private addAmenityFormControls(): void {
    this.propertyAmenities.forEach((amenity) => {
      const controlName = `amenity_${amenity.id}`;
      if (!this.propertyForm.contains(controlName)) {
        this.propertyForm.addControl(controlName, this.fb.control(false));
      }
    });
  }

  /**
   * Add form controls for distance amenities (text inputs)
   */
  private addDistanceAmenityFormControls(): void {
    this.distanceAmenities.forEach((amenity) => {
      const controlName = `distance_${amenity.id}`;
      if (!this.propertyForm.contains(controlName)) {
        this.propertyForm.addControl(controlName, this.fb.control(''));
      }
    });
  }

  /**
   * Get amenity form control name
   * @param amenity - The amenity object
   * @returns Form control name for the amenity
   */
  getAmenityControlName(amenity: Amenity): string {
    return `amenity_${amenity.id}`;
  }

  /**
   * Get distance amenity form control name
   * @param amenity - The amenity object
   * @returns Form control name for the distance amenity
   */
  getDistanceAmenityControlName(amenity: Amenity): string {
    return `distance_${amenity.id}`;
  }

  /**
   * Get amenity icon source with fallback
   * @param iconName - The icon name from the API
   * @returns Icon source path
   */
  getAmenityIcon(iconName: string | null): string {
    if (!iconName) {
      // Return a default icon that exists in your assets
      return 'assets/icons/properties-icon.svg';
    }

    // Use the icon name directly from the API response
    return `assets/icons/${iconName}.svg`;
  }

  /**
   * Handle image loading errors
   * @param event - The error event
   */
  onImageError(event: any): void {
    // Fallback to a default icon if the specified icon fails to load
    event.target.src = 'assets/icons/properties-icon.svg';
  }

  /**
   * Handle category selection change
   * @param categoryId - Selected category ID
   */
  private onCategoryChange(categoryId: any): void {
    // Convert to number if it's a string
    const numericCategoryId =
      typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;

    if (numericCategoryId && !isNaN(numericCategoryId)) {
      // Filter property types by selected category
      this.filteredPropertyTypes = this.propertyTypes.filter(
        (type) => type.property_category_id === numericCategoryId
      );

      // Reset property type selection
      this.propertyForm.patchValue({ propertyType: '' });
    } else {
      this.filteredPropertyTypes = [];
      this.propertyForm.patchValue({ propertyType: '' });
    }
  }

  /**
   * Get category name by ID
   * @param categoryId - Category ID
   * @returns Category name or empty string
   */
  getCategoryName(categoryId: number): string {
    const category = this.propertyCategories.find(
      (cat) => cat.id === categoryId
    );
    return category ? category.name_en : '';
  }

  /**
   * Get property type name by ID
   * @param typeId - Property type ID
   * @returns Property type name or empty string
   */
  getPropertyTypeName(typeId: number): string {
    const type = this.propertyTypes.find((t) => t.id === typeId);
    return type ? type.name_en : '';
  }

  /**
   * Get localized category name
   * @param category - The category object
   * @returns Localized category name
   */
  getLocalizedCategoryName(category: PropertyCategory): string {
    return this.currentLanguage === 'ar' ? category.name_ar : category.name_en;
  }

  /**
   * Get localized property type name
   * @param type - The property type object
   * @returns Localized property type name
   */
  getLocalizedPropertyTypeName(type: PropertyType): string {
    return this.currentLanguage === 'ar' ? type.name_ar : type.name_en;
  }

  /**
   * Get localized amenity name
   * @param amenity - The amenity object
   * @returns Localized amenity name
   */
  getLocalizedAmenityName(amenity: Amenity): string {
    return this.currentLanguage === 'ar' ? amenity.name_ar : amenity.name_en;
  }

  private initializeMap(): void {
    // Configure marker icon
    const iconRetinaUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    // Initialize map
    this.map = L.map('property-map').setView(
      [this.defaultLat, this.defaultLng],
      12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add initial marker
    this.marker = L.marker([this.defaultLat, this.defaultLng]).addTo(this.map);

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.propertyForm.patchValue({
        latitude: lat,
        longitude: lng,
      });
    });
  }

  /**
   * Check if form is ready to submit
   */
  isFormReady(): boolean {
    return (
      this.propertyForm.valid &&
      !this.isLoading &&
      this.propertyCategories.length > 0
    );
  }

  /**
   * Get form submission data with proper IDs
   */
  async getFormData(): Promise<any> {
    const formValue = this.propertyForm.value;

    // Convert uploaded files to base64
    const base64Images = await this.convertFilesToBase64();

    // Extract amenities data
    const amenities = this.propertyAmenities
      .map((amenity) => ({
        id: amenity.id,
        value: formValue[`amenity_${amenity.id}`] || false,
      }))
      .filter((amenity) => amenity.value === true);

    // Extract distance amenities data
    const distanceAmenities = this.distanceAmenities
      .map((amenity) => ({
        id: amenity.id,
        distance: formValue[`distance_${amenity.id}`] || '',
      }))
      .filter((amenity) => amenity.distance && amenity.distance.trim() !== '');

    // Combine all amenities
    const allAmenities = [
      ...amenities.map((amenity) => ({ id: amenity.id })),
      ...distanceAmenities.map((amenity) => ({
        id: amenity.id,
        distance: amenity.distance,
      })),
    ];

    // Format data according to API requirements
    const apiData = {
      name_en: formValue.propertyName,
      name_ar: formValue.propertyNameAr,
      description_en: formValue.description,
      description_ar: formValue.descriptionAr,
      property_category_id: formValue.propertyCategory,
      property_type_id: formValue.propertyType,
      area: formValue.propertySize,
      available_from: formValue.availableFrom,
      furnishing_status: formValue.furnishment,
      bedrooms: formValue.bedrooms,
      bathrooms: formValue.bathrooms,
      floor_number: formValue.floorNumber,
      total_floors: formValue.totalFloors,
      deposit_amount: formValue.depositAmount,
      fal_number: formValue.falLicenseId,
      ad_number: formValue.advertisingLicenseNo,
      annual_rent: formValue.annualRent,
      building_number: formValue.buildingName,
      country: 'Saudi Arabia', // You might want to make this dynamic
      region: formValue.province,
      city: formValue.province, // You might want to add separate city field
      district: formValue.addressLine1,
      postal_code: formValue.postalCode,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      is_active: true,
      amenities: allAmenities,
      images: base64Images, // Include base64 images
      primary_image_index: base64Images.length > 0 ? 0 : 0, // Set primary image to first image if available
    };

    return apiData;
  }

  async onSubmit(): Promise<void> {
    this.backendError = null;
    this.backendFieldErrors = {};
    if (this.propertyForm.valid) {
      try {
        const formData = await this.getFormData();

        // Call the API service to create the property
        this.propertiesService.createProperty(formData).subscribe({
          next: (response) => {
            const successMsg =
              this.currentLanguage === 'ar'
                ? 'تم إنشاء العقار بنجاح'
                : 'Property created successfully';
            this.router.navigate(['/agent/properties']).then(() => {
              this.toastService.show(successMsg);
            });
          },
          error: (error) => {
            console.error('Error creating property:', error);
            this.backendError =
              error?.error?.message ||
              'Failed to create property. Please try again.';
            this.backendFieldErrors = error?.error?.errors || {};
            // this.toastService.showError('Failed to create property. Please try again.');
          },
        });
      } catch (error) {
        console.error('Error preparing form data:', error);
        this.backendError =
          'Failed to prepare property data. Please try again.';
        // this.toastService.showError('Failed to prepare property data. Please try again.');
      }
    } else {
      // Mark all controls as touched to show validation errors
      this.propertyForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/agent/properties']);
  }

  onSaveDraft(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageUploadError = null;
    if (input.files) {
      const newFiles = Array.from(input.files);
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
          validFiles.push(file);
        } else {
          this.imageUploadError =
            this.currentLanguage === 'ar'
              ? 'يُسمح فقط برفع الصور بصيغة PNG أو JPG.'
              : 'Only PNG or JPG images are allowed.';
        }
      }
      if (validFiles.length > 0) {
        this.uploadedFiles = [...this.uploadedFiles, ...validFiles];
        // Update form control value
        const formControl = this.propertyForm.get('images');
        if (formControl) {
          formControl.setValue(this.uploadedFiles);
        }
      }
    }
  }

  removeFile(file: File): void {
    this.uploadedFiles = this.uploadedFiles.filter((f) => f !== file);

    // Update form control value
    const formControl = this.propertyForm.get('images');
    if (formControl) {
      formControl.setValue(this.uploadedFiles);
    }
  }

  /**
   * Convert uploaded files to base64 strings
   * @returns Promise of base64 strings array
   */
  private async convertFilesToBase64(): Promise<string[]> {
    const base64Strings: string[] = [];

    for (const file of this.uploadedFiles) {
      try {
        const base64 = await this.fileToBase64(file);
        base64Strings.push(base64);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }

    return base64Strings;
  }

  /**
   * Convert a single file to base64
   * @param file - The file to convert
   * @returns Promise of base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Return the full data URL format that the API expects
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Add file size pipe
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
