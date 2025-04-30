import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {
  @Input() lat!: number;
  @Input() lng!: number;

  private map!: L.Map;
  private marker!: L.Marker;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([this.lat, this.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add default marker
    this.marker = L.marker([this.lat, this.lng]).addTo(this.map);
  }
}
