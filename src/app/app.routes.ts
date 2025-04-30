import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdmindashboardComponent } from './pages/admindashboard/admindashboard.component';
import { AdminlayoutComponent } from './ui/adminlayout/adminlayout.component';
import { AdminaprovalsComponent } from './pages/adminaprovals/adminaprovals.component';
import { PropertiesComponent } from './pages/properties/properties.component';
import { PropertyDetailsComponent } from './pages/property-details/property-details.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminlayoutComponent,
    children: [
      { path: 'dashboard', component: AdmindashboardComponent },
      { path: 'approvals', component: AdminaprovalsComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'property/:id', component: PropertyDetailsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', component: LoginComponent },
  { path: '**', redirectTo: 'admin/dashboard' },
];
