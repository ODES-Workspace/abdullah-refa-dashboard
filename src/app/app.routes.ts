import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardLayout } from './ui/dashboardlayout/dashboard-layout.component';
import { SignupComponent } from './pages/signup/signup.component';
import { roleGuard } from '../services/role.guard';

export const routes: Routes = [
  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [roleGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admindashboard/admindashboard.component').then(
            (m) => m.AdmindashboardComponent
          ),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./pages/properties/properties.component').then(
            (m) => m.PropertiesComponent
          ),
      },
      {
        path: 'property/:id',
        loadComponent: () =>
          import('./pages/property-details/property-details.component').then(
            (m) => m.PropertyDetailsComponent
          ),
      },
      {
        path: 'create-property',
        loadComponent: () =>
          import('./pages/property-create/property-create.component').then(
            (m) => m.PropertyCreateComponent
          ),
      },
      {
        path: 'property/edit/:id',
        loadComponent: () =>
          import('./pages/property-edit/property-edit.component').then(
            (m) => m.PropertyEditComponent
          ),
      },
      {
        path: 'rental-application-details/:id',
        loadComponent: () =>
          import(
            './pages/rental-application-details/rental-application-details.component'
          ).then((m) => m.RentalApplicationDetailsComponent),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./pages/tenants/tenants.component').then(
            (m) => m.TenantsComponent
          ),
      },
      {
        path: 'agencies-owner-approvals',
        loadComponent: () =>
          import('./pages/adminaprovals/adminaprovals.component').then(
            (m) => m.AdminaprovalsComponent
          ),
      },
      {
        path: 'list-of-angency-owner',
        loadComponent: () =>
          import(
            './pages/listof-agency-owner/listof-agency-owner.component'
          ).then((m) => m.ListofAgencyOwnerComponent),
      },
      {
        path: 'agencies-owner-rejections',
        loadComponent: () =>
          import('./pages/listofrejections/listofrejections.component').then(
            (m) => m.ListofrejectionsComponent
          ),
      },
      {
        path: 'rentrequests',
        loadComponent: () =>
          import('./pages/rentrequests-list/rentrequests-list.component').then(
            (m) => m.RentrequestsListComponent
          ),
      },
      {
        path: 'approved-rentrequests',
        loadComponent: () =>
          import(
            './pages/approved-rentrequests/approved-rentrequests.component'
          ).then((m) => m.ApprovedRentrequestsComponent),
      },
      {
        path: 'rejected-rentrequests',
        loadComponent: () =>
          import(
            './pages/rejected-rentrequests/rejected-rentrequests.component'
          ).then((m) => m.RejectedRentrequestsComponent),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./pages/payments/payments.component').then(
            (m) => m.PaymentsComponent
          ),
      },
      {
        path: 'renewal',
        loadComponent: () =>
          import('./pages/renewal/renewal.component').then(
            (m) => m.RenewalComponent
          ),
      },
      {
        path: 'terminated',
        loadComponent: () =>
          import('./pages/terminated/terminated.component').then(
            (m) => m.TerminatedComponent
          ),
      },
      {
        path: 'existing-contract',
        loadComponent: () =>
          import('./pages/existing-contract/existing-contract.component').then(
            (m) => m.ExistingContractComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'agent',
    component: DashboardLayout,
    canActivate: [roleGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/agentdashboard/agentdashboard.component').then(
            (m) => m.AgentdashboardComponent
          ),
      },
      {
        path: 'rental-application-details/:id',
        loadComponent: () =>
          import(
            './pages/rental-application-details/rental-application-details.component'
          ).then((m) => m.RentalApplicationDetailsComponent),
      },
      {
        path: 'rentrequests',
        loadComponent: () =>
          import('./pages/rentrequests-list/rentrequests-list.component').then(
            (m) => m.RentrequestsListComponent
          ),
      },
      {
        path: 'approved-rentrequests',
        loadComponent: () =>
          import(
            './pages/approved-rentrequests/approved-rentrequests.component'
          ).then((m) => m.ApprovedRentrequestsComponent),
      },
      {
        path: 'rejected-rentrequests',
        loadComponent: () =>
          import(
            './pages/rejected-rentrequests/rejected-rentrequests.component'
          ).then((m) => m.RejectedRentrequestsComponent),
      },
      {
        path: 'existing-contract',
        loadComponent: () =>
          import('./pages/existing-contract/existing-contract.component').then(
            (m) => m.ExistingContractComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: '**', redirectTo: '/login' },
];
