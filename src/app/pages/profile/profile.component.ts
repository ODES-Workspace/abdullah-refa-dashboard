import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileAgentComponent } from '../../ui/profile-agent/profile-agent.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, TranslateModule, ProfileAgentComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {}
