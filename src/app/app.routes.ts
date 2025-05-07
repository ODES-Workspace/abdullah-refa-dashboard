import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdmindashboardComponent } from './pages/admindashboard/admindashboard.component';
import { AdminlayoutComponent } from './ui/adminlayout/adminlayout.component';
import { AdminaprovalsComponent } from './pages/adminaprovals/adminaprovals.component';
import { PropertiesComponent } from './pages/properties/properties.component';
import { PropertyDetailsComponent } from './pages/property-details/property-details.component';
import { PropertyEditComponent } from './pages/property-edit/property-edit.component';
import { TenantsComponent } from './pages/tenants/tenants.component';
import { ListofrejectionsComponent } from './pages/listofrejections/listofrejections.component';
import { ListofAgencyOwnerComponent } from './pages/listof-agency-owner/listof-agency-owner.component';
import { RentrequestsListComponent } from './pages/rentrequests-list/rentrequests-list.component';
import { RentalApplicationDetailsComponent } from './pages/rental-application-details/rental-application-details.component';
import { ApprovedRentrequestsComponent } from './pages/approved-rentrequests/approved-rentrequests.component';
import { RejectedRentrequestsComponent } from './pages/rejected-rentrequests/rejected-rentrequests.component';
import { PaymentsComponent } from './pages/payments/payments.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminlayoutComponent,
    children: [
      { path: 'dashboard', component: AdmindashboardComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'property/:id', component: PropertyDetailsComponent },
      { path: 'property/edit/:id', component: PropertyEditComponent },
      {
        path: 'rental-application-details/:id',
        component: RentalApplicationDetailsComponent,
      },
      { path: 'tenants', component: TenantsComponent },
      // agencies owner Routes
      { path: 'agencies-owner-approvals', component: AdminaprovalsComponent },
      {
        path: 'list-of-angency-owner',
        component: ListofAgencyOwnerComponent,
      },
      {
        path: 'agencies-owner-rejections',
        component: ListofrejectionsComponent,
      },
      // rent requests routes
      {
        path: 'rentrequests',
        component: RentrequestsListComponent,
      },
      {
        path: 'approved-rentrequests',
        component: ApprovedRentrequestsComponent,
      },

      {
        path: 'rejected-rentrequests',
        component: RejectedRentrequestsComponent,
      },
      // contracts
      {
        path: 'payment',
        component: PaymentsComponent,
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', component: LoginComponent },
  { path: '**', redirectTo: 'admin/dashboard' },
];
