import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-adminlayout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './adminlayout.component.html',
  styleUrl: './adminlayout.component.scss',
})
export class AdminlayoutComponent {}
