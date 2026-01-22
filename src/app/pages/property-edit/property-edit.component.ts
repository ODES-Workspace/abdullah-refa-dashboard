import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';
import { AmenitiesService, Amenity } from '../../../services/amenities.service';
import {
  PropertyCategoriesService,
  PropertyCategory,
} from '../../../services/property-categories.service';
import {
  PropertyTypesService,
  PropertyType,
} from '../../../services/property-types.service';
import { UserRoleService } from '../../../services/user-role.service';

declare const L: any;

@Component({
  selector: 'app-property-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './property-edit.component.html',
  styleUrl: './property-edit.component.scss',
})
export class PropertyEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  categories: PropertyCategory[] = [];
  propertyTypes: PropertyType[] = [];
  currentLang: 'en' | 'ar' = 'en';
  propertyAmenities: Amenity[] = [];
  distanceAmenities: Amenity[] = [];
  images: Array<{
    id?: number;
    url: string;
    thumbnail_url?: string;
    file?: File;
    isNew?: boolean;
  }> = [];
  pendingUploads: File[] = [];
  imagesToDelete: number[] = [];
  private map: any;
  private mapMarker: any;
  submitting: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private categoriesService: PropertyCategoriesService,
    private typesService: PropertyTypesService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private propertiesService: PropertiesService,
    private amenitiesService: AmenitiesService,
    private userRoleService: UserRoleService
  ) {
    this.form = this.fb.group({
      propertyCategory: [null],
      propertyType: [null],
      propertyName: [''],
      propertyNameAr: [''],
      propertySize: [''],
      availableFrom: [''],
      furnishment: [''],
      bedrooms: [''],
      bathrooms: [''],
      floorNumber: [''],
      totalFloors: [''],
      annualRent: [''],
      depositAmount: [''],
      description: [''],
      descriptionAr: [''],
      addressLine1: [''],
      buildingName: [''],
      province: [''],
      postalCode: [''],
      falLicenseId: [''],
      advertisingLicenseNo: [''],
      latitude: [''],
      longitude: [''],
    });

    this.currentLang = (this.translate.currentLang as 'en' | 'ar') || 'en';
    this.translate.onLangChange.subscribe((e) => {
      this.currentLang = (e.lang as 'en' | 'ar') || 'en';
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadAmenities();
    this.prefillFromProperty();
    this.form
      .get('propertyCategory')
      ?.valueChanges.subscribe((categoryId: unknown) => {
        this.form.get('propertyType')?.setValue(null);
        const numericCategoryId =
          typeof categoryId === 'string'
            ? Number(categoryId)
            : (categoryId as number | null);
        if (numericCategoryId) {
          this.loadTypesByCategoryId(numericCategoryId);
        } else {
          this.propertyTypes = [];
        }
      });
  }

  ngAfterViewInit(): void {
    // Initialize map after scripts are loaded with default coordinates
    setTimeout(() => {
      this.initMap(24.7136, 46.6753); // Riyadh default
    }, 0);
  }

  private loadCategories(): void {
    this.categoriesService.getPropertyCategories().subscribe((res) => {
      this.categories = res.data || [];
    });
  }

  private loadTypesByCategoryId(categoryId: number): void {
    this.typesService
      .getPropertyTypesByCategoryId(categoryId)
      .subscribe((types) => {
        this.propertyTypes = types || [];
      });
  }

  private loadAmenities(): void {
    this.amenitiesService.getPropertyAmenities().subscribe((amenities) => {
      this.propertyAmenities = amenities || [];
      // Create checkbox controls for features
      this.propertyAmenities.forEach((a) => {
        const controlName = `amenity_${a.id}`;
        if (!this.form.get(controlName)) {
          this.form.addControl(controlName, this.fb.control(false));
        }
      });
    });

    this.amenitiesService.getDistanceAmenities().subscribe((amenities) => {
      this.distanceAmenities = amenities || [];
      // Create text controls for distances
      this.distanceAmenities.forEach((a) => {
        const controlName = `distance_${a.id}`;
        if (!this.form.get(controlName)) {
          this.form.addControl(controlName, this.fb.control(''));
        }
      });
    });
  }

  private prefillFromProperty(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const propertyId = idParam ? Number(idParam) : null;
    if (!propertyId) {
      return;
    }
    this.propertiesService
      .getAgentPropertyDetails(propertyId)
      .subscribe(({ data }) => {
        // Patch basic fields
        // Normalize furnishment value to match select options
        const normalizedFurnish = this.normalizeFurnishment(
          (data.furnishing_status || '') as string
        );

        this.form.patchValue({
          propertyName: data.name_en || '',
          propertyNameAr: data.name_ar || '',
          description: data.description_en || '',
          descriptionAr: data.description_ar || '',
          propertySize: data.area ?? '',
          availableFrom: data.available_from || '',
          furnishment: normalizedFurnish || '',
          bedrooms: data.bedrooms ?? '',
          bathrooms: data.bathrooms ?? '',
          floorNumber: data.floor_number ?? '',
          totalFloors: data.total_floors ?? '',
          annualRent: data.annual_rent ?? '',
          depositAmount: data.insurance_amount ?? '',
          buildingName: data.building_number || '',
          addressLine1: data.district || '',
          province: data.region || '',
          postalCode: data.postal_code || '',
          falLicenseId: data.fal_number || '',
          advertisingLicenseNo: data.ad_number || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
        });

        // Update map position if coordinates exist
        if (data.latitude && data.longitude) {
          this.updateMapPosition(data.latitude, data.longitude);
        }

        // Images
        this.images = (data.images as any[]) || [];
        const categoryId = data.category?.id;
        if (categoryId) {
          this.form.get('propertyCategory')?.setValue(categoryId);
          const desiredTypeSlug = (data as any).type?.slug as
            | string
            | undefined;
          const desiredTypeId = (data as any).property_type_id as
            | number
            | undefined;
          const desiredTypeNameEn = (data as any).type?.name_en as
            | string
            | undefined;
          const desiredTypeNameAr = (data as any).type?.name_ar as
            | string
            | undefined;
          this.typesService
            .getPropertyTypesByCategoryId(categoryId)
            .subscribe((types) => {
              this.propertyTypes = types || [];
              let matched = undefined as PropertyType | undefined;
              if (desiredTypeSlug) {
                matched = this.propertyTypes.find(
                  (t) => t.slug === desiredTypeSlug
                );
              }
              if (!matched && typeof desiredTypeId === 'number') {
                matched = this.propertyTypes.find(
                  (t) => t.id === desiredTypeId
                );
              }
              if (!matched && (desiredTypeNameEn || desiredTypeNameAr)) {
                matched = this.propertyTypes.find(
                  (t) =>
                    (desiredTypeNameEn && t.name_en === desiredTypeNameEn) ||
                    (desiredTypeNameAr && t.name_ar === desiredTypeNameAr)
                );
              }
              if (matched) this.form.get('propertyType')?.setValue(matched.id);
            });
        }

        // Prefill amenities after we have controls
        const amenities = data.amenities || [];
        amenities.forEach((a: any) => {
          if (a.distance && a.distance !== '') {
            const distanceControl = this.form.get(`distance_${a.id}`);
            if (distanceControl) {
              distanceControl.setValue(a.distance);
            } else {
              this.form.addControl(
                `distance_${a.id}`,
                this.fb.control(a.distance)
              );
            }
          } else {
            const amenityControl = this.form.get(`amenity_${a.id}`);
            if (amenityControl) {
              amenityControl.setValue(true);
            } else {
              this.form.addControl(`amenity_${a.id}`, this.fb.control(true));
            }
          }
        });
      });
  }

  private normalizeFurnishment(value: string): string {
    const raw = (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-');

    if (!raw) return '';

    if (raw.includes('semi')) return 'semi_furnished';
    if (
      raw.includes('unfurnished') ||
      raw.includes('not-furnished') ||
      raw === 'none'
    ) {
      return 'unfurnished';
    }
    if (raw.includes('furnished')) return 'furnished';
    return raw;
  }

  private initMap(lat: number, lng: number): void {
    const container = document.getElementById('property-map');
    if (!container || typeof L === 'undefined') {
      return;
    }
    this.map = L.map('property-map').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.mapMarker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.mapMarker.on('dragend', () => {
      const pos = this.mapMarker.getLatLng();
      this.form.get('latitude')?.setValue(pos.lat);
      this.form.get('longitude')?.setValue(pos.lng);
    });

    this.map.on('click', (e: any) => {
      const { latlng } = e;
      if (this.mapMarker) {
        this.mapMarker.setLatLng(latlng);
      } else {
        this.mapMarker = L.marker(latlng, { draggable: true }).addTo(this.map);
      }
      this.form.get('latitude')?.setValue(latlng.lat);
      this.form.get('longitude')?.setValue(latlng.lng);
    });
  }

  private updateMapPosition(lat: number, lng: number): void {
    if (this.map && this.mapMarker) {
      this.map.setView([lat, lng], 14);
      this.mapMarker.setLatLng([lat, lng]);
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    // fallback placeholder image per preference
    target.src = 'assets/images/auth-img.png';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    this.pendingUploads.push(...files);
    // Show previews immediately
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.images.push({
          url: dataUrl,
          thumbnail_url: dataUrl,
          file,
          isNew: true,
        });
      };
      reader.readAsDataURL(file);
    });
    // reset input so selecting the same file again triggers change
    input.value = '';
  }

  removeImageAt(index: number): void {
    if (index < 0 || index >= this.images.length) return;

    const image = this.images[index];

    // If it's an existing image (has an ID), add it to deletion list
    if (image.id && !image.isNew) {
      this.imagesToDelete.push(image.id);
    }

    // If it's a new image (pending upload), remove it from pending uploads
    if (image.isNew && image.file) {
      const fileIndex = this.pendingUploads.indexOf(image.file);
      if (fileIndex > -1) {
        this.pendingUploads.splice(fileIndex, 1);
      }
    }

    // Remove from images array
    this.images.splice(index, 1);
  }

  // Primary image selection removed per request

  clearError(): void {
    this.errorMessage = '';
  }

  translateErrorMessage(message: string): string {
    // Try to get translation for the error message
    const translated = this.translate.instant(message);
    return translated !== message ? translated : message;
  }

  onSubmit(): void {
    // Clear previous error messages
    this.clearError();

    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });

      this.errorMessage =
        this.currentLang === 'ar'
          ? 'يرجى التحقق من إدخالك. بعض الحقول قد تكون غير صحيحة'
          : 'Please check your input. Some fields may be invalid';

      return;
    }

    if (this.submitting) {
      return; // Prevent double submission
    }

    this.submitting = true;
    const formValue = this.form.value;
    const propertyId = this.route.snapshot.params['id'];

    // Prepare amenities data
    const amenities: Array<{ id: number; distance?: string }> = [];

    // Add property features (checkboxes)
    this.propertyAmenities.forEach((amenity) => {
      const control = this.form.get(`amenity_${amenity.id}`);
      if (control?.value) {
        amenities.push({ id: amenity.id });
      }
    });

    // Add nearby features with distances
    this.distanceAmenities.forEach((amenity) => {
      const control = this.form.get(`distance_${amenity.id}`);
      if (control?.value && control.value.trim()) {
        amenities.push({ id: amenity.id, distance: control.value.trim() });
      }
    });

    // Prepare the property data for API
    // Compute images payload (new uploads only)
    const newImages = this.images
      .filter((img) => img.isNew && !!img.url && img.url.startsWith('data:'))
      .map((img) => img.url);

    // Handle name duplication: if one is empty, use the other
    let nameEn = formValue.propertyName?.trim() || '';
    let nameAr = formValue.propertyNameAr?.trim() || '';
    if (!nameEn && nameAr) {
      nameEn = nameAr;
    } else if (!nameAr && nameEn) {
      nameAr = nameEn;
    }

    const propertyData: any = {
      name_en: nameEn,
      name_ar: nameAr,
      description_en: formValue.description,
      description_ar: formValue.descriptionAr,
      property_category_id: formValue.propertyCategory,
      property_type_id: formValue.propertyType,
      area: parseFloat(formValue.propertySize) || 0,
      available_from: formValue.availableFrom,
      furnishing_status: formValue.furnishment,
      bedrooms: parseInt(formValue.bedrooms) || 0,
      bathrooms: parseInt(formValue.bathrooms) || 0,
      floor_number: parseInt(formValue.floorNumber) || 0,
      total_floors: parseInt(formValue.totalFloors) || 0,
      annual_rent: parseFloat(formValue.annualRent) || 0,
      insurance_amount: parseFloat(formValue.depositAmount) || 0,
      fal_number: formValue.falLicenseId,
      ad_number: formValue.advertisingLicenseNo,
      building_number: formValue.buildingName,
      country: 'Saudi Arabia', // Default value
      region: formValue.province,
      city: formValue.province, // Using province as city for now
      district: formValue.addressLine1,
      postal_code: formValue.postalCode,
      latitude: parseFloat(formValue.latitude) || 0,
      longitude: parseFloat(formValue.longitude) || 0,
      is_active: true,
      amenities: amenities,
    };

    if (newImages.length > 0) {
      propertyData.images = newImages;
    }

    if (this.imagesToDelete.length > 0) {
      propertyData.images_to_remove = this.imagesToDelete;
    }

    this.propertiesService
      .updateAgentProperty(propertyId, propertyData)
      .subscribe({
        next: (response) => {
          // Clear local image mutation state and refresh images from response if present
          this.pendingUploads = [];
          this.imagesToDelete = [];
          if ((response as any)?.data?.images) {
            this.images =
              ((response as any).data.images as any[]) || this.images;
          }
          this.submitting = false;
          this.showSuccessMessage();
        },
        error: (error) => {
          console.error('Error updating property:', error);
          this.submitting = false;

          // Handle different types of errors with localized messages
          let errorMessage = '';

          if (error.status === 422) {
            // Handle validation errors with specific field messages
            if (error.error && error.error.errors) {
              const fieldErrors = error.error.errors;
              const errorKeys = Object.keys(fieldErrors);

              if (errorKeys.length > 0) {
                // Get the first field error to display
                const firstField = errorKeys[0];
                const fieldErrorMessages = fieldErrors[firstField];

                if (fieldErrorMessages && fieldErrorMessages.length > 0) {
                  // Display the specific field error message (translated)
                  errorMessage = this.translateErrorMessage(fieldErrorMessages[0]);
                } else {
                  errorMessage =
                    this.currentLang === 'ar'
                      ? 'يرجى التحقق من إدخالك. بعض الحقول قد تكون غير صحيحة'
                      : 'Please check your input. Some fields may be invalid';
                }
              } else {
                errorMessage =
                  this.currentLang === 'ar'
                    ? 'يرجى التحقق من إدخالك. بعض الحقول قد تكون غير صحيحة'
                    : 'Please check your input. Some fields may be invalid';
              }
            } else if (error.error && error.error.message) {
              // Use the general error message from API (translated)
              errorMessage = this.translateErrorMessage(error.error.message);
            } else {
              errorMessage =
                this.currentLang === 'ar'
                  ? 'يرجى التحقق من إدخالك. بعض الحقول قد تكون غير صحيحة'
                  : 'Please check your input. Some fields may be invalid';
            }
          } else if (error.status === 401) {
            errorMessage =
              this.currentLang === 'ar'
                ? 'غير مصرح. يرجى تسجيل الدخول مرة أخرى'
                : 'Unauthorized. Please log in again';
          } else if (error.status === 403) {
            errorMessage =
              this.currentLang === 'ar'
                ? 'ليس لديك صلاحية لتحديث هذا العقار'
                : 'You do not have permission to update this property';
          } else if (error.status === 404) {
            errorMessage =
              this.currentLang === 'ar'
                ? 'العقار غير موجود'
                : 'Property not found';
          } else if (error.status >= 500) {
            errorMessage =
              this.currentLang === 'ar'
                ? 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً'
                : 'Server error. Please try again later';
          } else {
            errorMessage =
              this.currentLang === 'ar'
                ? 'خطأ في تحديث العقار. يرجى المحاولة مرة أخرى'
                : 'Error updating property. Please try again';
          }

          this.errorMessage = errorMessage;

          // Clear error message after 10 seconds
          setTimeout(() => this.clearError(), 10000);
        },
      });
  }

  // Legacy image update helpers removed; images are now sent within main update payload

  /**
   * Show success message and navigate back to properties page
   */
  private showSuccessMessage(): void {
    if (this.currentLang === 'ar') {
      alert('تم تحديث العقار والصور بنجاح!');
    } else {
      alert('Property and images updated successfully!');
    }

    // Navigate back to the properties page
    const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    this.router.navigate([`/${basePath}/properties`]);
  }
}
