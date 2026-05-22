import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../../services/language.service';
import { PasswordResetService } from '../../../services/password-reset.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
    ToastComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  showInvalidLinkAction = false;
  passwordType = 'password';
  confirmPasswordType = 'password';

  private token = '';
  private emailFromQuery = '';

  serverErrors: {
    password?: string;
    email?: string;
    token?: string;
  } = {};

  constructor(
    public languageService: LanguageService,
    private formBuilder: FormBuilder,
    private passwordResetService: PasswordResetService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.emailFromQuery = this.route.snapshot.queryParamMap.get('email') ?? '';

    if (!this.token || !this.emailFromQuery) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.resetForm = this.formBuilder.group(
      {
        email: [{ value: this.emailFromQuery, disabled: true }],
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirmation: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  passwordsMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmation = control.get('passwordConfirmation')?.value;
    if (password && confirmation && password !== confirmation) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  togglePasswordType(): void {
    this.passwordType =
      this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordType(): void {
    this.confirmPasswordType =
      this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.resetForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.serverErrors = {};
    this.showInvalidLinkAction = false;

    const password = this.resetForm.get('password')?.value;
    const passwordConfirmation =
      this.resetForm.get('passwordConfirmation')?.value;

    this.passwordResetService
      .resetPassword({
        email: this.emailFromQuery,
        password,
        password_confirmation: passwordConfirmation,
        token: this.token,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.show('PASSWORD_UPDATED_SUCCESS');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          if (error.status === 400) {
            this.toastService.show('INVALID_OR_EXPIRED_LINK');
            this.showInvalidLinkAction = true;
          } else if (error.status === 422) {
            const errors = error.error?.errors ?? {};
            this.serverErrors = {
              password: errors.password?.[0],
              email: errors.email?.[0],
              token: errors.token?.[0],
            };
          } else {
            this.toastService.show('GENERIC_ERROR_AR');
          }
        },
      });
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach((key) => {
      this.resetForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        if (fieldName === 'password') {
          return 'ERRORS.PASSWORD_REQUIRED';
        }
        if (fieldName === 'passwordConfirmation') {
          return 'ERRORS.PASSWORD_CONFIRMATION_REQUIRED';
        }
      }
      if (field.errors['minlength']) {
        return 'ERRORS.PASSWORD_MIN_LENGTH';
      }
    }

    if (
      fieldName === 'passwordConfirmation' &&
      this.resetForm.errors?.['passwordsMismatch'] &&
      (field?.touched || this.resetForm.get('password')?.touched)
    ) {
      return 'ERRORS.PASSWORDS_DO_NOT_MATCH';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    const hasMismatch =
      fieldName === 'passwordConfirmation' &&
      !!this.resetForm.errors?.['passwordsMismatch'] &&
      (field?.touched || this.resetForm.get('password')?.touched);

    return !!(
      (field && field.invalid && field.touched) ||
      hasMismatch ||
      this.getServerError(fieldName)
    );
  }

  getServerError(fieldName: string): string {
    if (fieldName === 'password') {
      return this.serverErrors.password ?? '';
    }
    if (fieldName === 'email') {
      return this.serverErrors.email ?? '';
    }
    if (fieldName === 'token') {
      return this.serverErrors.token ?? '';
    }
    return '';
  }
}
