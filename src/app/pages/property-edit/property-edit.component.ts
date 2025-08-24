import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-property-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './property-edit.component.html',
  styleUrl: './property-edit.component.scss',
})
export class PropertyEditComponent implements OnInit {
  ngOnInit(): void {}
}
