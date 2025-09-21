import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import {
  AgentService,
  AgentLoginRequest,
} from '../../../services/agent.service';
import {
  AdminService,
  AdminLoginRequest,
} from '../../../services/admin.service';
import { UserRoleService } from '../../../services/user-role.service';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProfileAgentService } from '../../../services/profile-agent.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  passwordType = 'password';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  loginForm!: FormGroup;

  constructor(
    public languageService: LanguageService,
    private agentService: AgentService,
    private adminService: AdminService,
    private userRoleService: UserRoleService,
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false],
    });

    // Load saved credentials if they exist
    this.loadSavedCredentials();
  }

  /**
   * Load saved credentials from localStorage
   */
  loadSavedCredentials() {
    const savedEmail = localStorage.getItem('saved_email');
    const savedPassword = localStorage.getItem('saved_password');
    const rememberMe = localStorage.getItem('remember_me') === 'true';

    if (savedEmail && savedPassword && rememberMe) {
      this.loginForm.patchValue({
        email: savedEmail,
        password: savedPassword,
        remember: true,
      });
    }
  }

  /**
   * Save credentials to localStorage
   */
  saveCredentials() {
    const rememberMe = this.loginForm.get('remember')?.value;

    if (rememberMe) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      localStorage.setItem('saved_email', email);
      localStorage.setItem('saved_password', password);
      localStorage.setItem('remember_me', 'true');
    } else {
      // Clear saved credentials if remember me is unchecked
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
      localStorage.removeItem('remember_me');
    }
  }

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const loginData = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
    };

    // Try admin login first, then agent login if admin fails
    this.tryAdminLogin(loginData);
  }

  private tryAdminLogin(loginData: any) {
    const adminLoginData: AdminLoginRequest = {
      email: loginData.email,
      password: loginData.password,
    };

    this.adminService.loginAdmin(adminLoginData).subscribe({
      next: (response) => {
        console.log('Admin login response:', response);

        // Store token in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('token_type', response.token_type);
        localStorage.setItem('expires_in', response.expires_in.toString());

        // Fetch admin profile to get the actual admin ID and details
        this.fetchAdminProfile(loginData);
      },
      error: (error) => {
        // If admin login fails, try agent login
        this.tryAgentLogin(loginData);
      },
    });
  }

  private fetchAdminProfile(loginData: any) {
    this.adminService.getAdminProfile().subscribe({
      next: (profile) => {
        console.log('Admin profile response:', profile);

        this.isLoading = false;
        this.successMessage = `WELCOME_BACK`;

        // Store admin ID in localStorage
        localStorage.setItem('admin_id', profile.id.toString());

        // Create admin user object with actual profile data and store it
        const adminUser = {
          id: profile.id,
          type: profile.type || 'admin',
          name: profile.name,
          email: profile.email,
          active: profile.active,
          role: profile.role,
        };
        this.userRoleService.setUserData(adminUser);

        // Save credentials if remember me is checked
        this.saveCredentials();

        // Redirect to admin dashboard
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error fetching admin profile:', error);
        this.isLoading = false;

        // If profile fetch fails, we can still proceed with basic login
        // but we'll use a fallback approach
        this.handleAdminProfileError(loginData);
      },
    });
  }

  private handleAdminProfileError(loginData: any) {
    // Create a fallback admin user object with basic data
    const adminUser = {
      id: 0, // Will be updated when profile is fetched later
      type: 'admin',
      name: 'Admin',
      email: loginData.email,
      active: 1,
      role: 'admin',
    };
    this.userRoleService.setUserData(adminUser);

    // Save credentials if remember me is checked
    this.saveCredentials();

    // Show warning message but still redirect
    this.errorMessage =
      'Warning: Could not fetch full profile. Some features may be limited.';

    // Redirect to admin dashboard
    setTimeout(() => {
      this.router.navigate(['/admin/dashboard']);
    }, 2000);
  }

  private tryAgentLogin(loginData: any) {
    const agentLoginData: AgentLoginRequest = {
      email: loginData.email,
      password: loginData.password,
    };

    this.agentService.loginAgent(agentLoginData).subscribe({
      next: (response) => {
        console.log('Agent login response:', response);

        // Store token in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('token_type', response.token_type);
        localStorage.setItem('expires_in', response.expires_in.toString());

        // Fetch agent profile to get the actual agent ID and details
        this.fetchAgentProfile(loginData, response.user.type);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      },
    });
  }

  private fetchAgentProfile(loginData: any, userType: string) {
    const profileService = new ProfileAgentService(this.http);

    profileService.getMyProfile().subscribe({
      next: (profile) => {
        console.log('Agent profile response:', profile);

        this.isLoading = false;
        this.successMessage = `WELCOME_BACK`;

        // Store agent ID in localStorage
        localStorage.setItem('agent_id', profile.id.toString());

        // Create agent user object with actual profile data and store it
        const agentUser = {
          id: profile.id,
          type: profile.type || userType,
          name: profile.name,
          email: profile.email,
          active:
            typeof profile.active === 'boolean'
              ? profile.active
                ? 1
                : 0
              : profile.active,
          role: profile.role || 'agent',
        };
        this.userRoleService.setUserData(agentUser);

        // Trigger sidebar refresh to show agent information
        this.userRoleService.triggerSidebarRefresh();

        // Save credentials if remember me is checked
        this.saveCredentials();

        // Redirect based on user type and profile completeness
        setTimeout(() => {
          if (userType === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            // For agents, check if profile is complete
            if (this.isAgentProfileComplete(profile)) {
              this.router.navigate(['/agent/dashboard']);
            } else {
              this.router.navigate(['/agent/profile']);
            }
          }
        }, 1500);
      },
      error: (error) => {
        console.error('Error fetching agent profile:', error);
        this.isLoading = false;

        // If profile fetch fails, we can still proceed with basic login
        // but we'll use a fallback approach
        this.handleAgentProfileError(loginData, userType);
      },
    });
  }

  private handleAgentProfileError(loginData: any, userType: string) {
    // Create a fallback agent user object with basic data
    const agentUser = {
      id: 0, // Will be updated when profile is fetched later
      type: userType,
      name: 'Agent',
      email: loginData.email,
      active: 1,
      role: 'agent',
    };
    this.userRoleService.setUserData(agentUser);

    // Save credentials if remember me is checked
    this.saveCredentials();

    // Show warning message but still redirect
    this.errorMessage =
      'Warning: Could not fetch full profile. Some features may be limited.';

    // Redirect to appropriate location
    setTimeout(() => {
      if (userType === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        // If we can't fetch profile, redirect to profile page to be safe
        this.router.navigate(['/agent/profile']);
      }
    }, 2000);
  }

  markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `ERRORS.${fieldName.toUpperCase()}_REQUIRED`;
      }
      if (field.errors['email']) {
        return 'ERRORS.INVALID_EMAIL_FORMAT';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Check if agent profile is complete
  private isAgentProfileComplete(profile: any): boolean {
    if (!profile || !profile.agent_profile) {
      return false;
    }

    const agentProfile = profile.agent_profile;

    // Check if essential profile fields are filled
    return !!(
      agentProfile.agency_name &&
      agentProfile.company_registration_id &&
      agentProfile.fal_license_number &&
      agentProfile.agency_address_line_1 &&
      agentProfile.city &&
      agentProfile.country &&
      agentProfile.account_number &&
      agentProfile.bank_name &&
      agentProfile.iban_number
    );
  }
}
