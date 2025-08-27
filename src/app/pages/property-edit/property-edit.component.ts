import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
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
    is_primary?: boolean;
    file?: File;
    isNew?: boolean;
  }> = [];
  pendingUploads: File[] = [];
  imagesToDelete: number[] = [];
  private map: any;
  private mapMarker: any;

  constructor(
    private fb: FormBuilder,
    private categoriesService: PropertyCategoriesService,
    private typesService: PropertyTypesService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private propertiesService: PropertiesService,
    private amenitiesService: AmenitiesService
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
        console.log(data);
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

    if (raw.includes('semi')) return 'semi-furnished';
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
          is_primary: false,
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
    const img = this.images[index];
    if (!img) return;
    if (img.id) {
      this.imagesToDelete.push(img.id);
    }
    if (img.file) {
      // remove matching file from pendingUploads
      this.pendingUploads = this.pendingUploads.filter((f) => f !== img.file);
    }
    this.images.splice(index, 1);
  }
}
