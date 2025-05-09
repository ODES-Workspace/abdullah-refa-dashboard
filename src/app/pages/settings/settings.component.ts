import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileSettingsComponent } from '../../ui/profile-settings/profile-settings.component';
import { TranslateModule } from '@ngx-translate/core';
import { ManagementComponent } from '../../ui/management/management.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ProfileSettingsComponent,
    TranslateModule,
    ManagementComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  activeTab: string = 'profile';

  ngOnInit() {
    // Get the active tab from localStorage on component initialization
    const savedTab = localStorage.getItem('settingsActiveTab');
    if (savedTab) {
      this.activeTab = savedTab;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Save the active tab to localStorage
    localStorage.setItem('settingsActiveTab', tab);
  }
}
