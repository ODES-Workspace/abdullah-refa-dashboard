import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';

@Component({
  selector: 'app-adminlayout',
  imports: [RouterOutlet, SidebarComponent, DashboardHeaderComponent],
  templateUrl: './adminlayout.component.html',
  styleUrl: './adminlayout.component.scss',
})
export class AdminlayoutComponent {}
