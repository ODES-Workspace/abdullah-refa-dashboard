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
    private router: Router
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
        this.isLoading = false;
        this.successMessage = `WELCOME_BACK`;

        // Store token in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('token_type', response.token_type);
        localStorage.setItem('expires_in', response.expires_in.toString());

        // Create admin user object and store it
        const adminUser = {
          id: 0,
          type: 'admin',
          name: 'Admin',
          email: loginData.email,
          active: 1,
          role: 'admin',
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
        // If admin login fails, try agent login
        this.tryAgentLogin(loginData);
      },
    });
  }

  private tryAgentLogin(loginData: any) {
    const agentLoginData: AgentLoginRequest = {
      email: loginData.email,
      password: loginData.password,
    };

    this.agentService.loginAgent(agentLoginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `WELCOME_BACK`;

        // Save credentials if remember me is checked
        this.saveCredentials();

        // Redirect to appropriate dashboard based on user type
        setTimeout(() => {
          if (response.user.type === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/agent/dashboard']);
          }
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      },
    });
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
}
