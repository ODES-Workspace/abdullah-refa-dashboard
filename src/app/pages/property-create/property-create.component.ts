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
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './property-create.component.html',
  styleUrl: './property-create.component.scss',
})
export class PropertyCreateComponent implements OnInit, AfterViewInit {
  propertyForm: FormGroup;
  private map!: L.Map;
  private marker!: L.Marker;
  defaultLat = 24.7136; // Default latitude for Saudi Arabia
  defaultLng = 46.6753; // Default longitude for Saudi Arabia

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertiesService: PropertiesService
  ) {
    this.propertyForm = this.fb.group({
      propertyName: ['', Validators.required],
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
  }

  ngOnInit(): void {
    // Initialize any additional data needed
  }

  ngAfterViewInit(): void {
    this.initializeMap();
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

  onSubmit(): void {
    if (this.propertyForm.valid) {
      console.log(this.propertyForm.value);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/properties']);
  }

  onSaveDraft(): void {
    console.log('Saving as draft:', this.propertyForm.value);
  }
}
