import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../../services/language.service';
import { PasswordResetService } from '../../../services/password-reset.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
    ToastComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotForm!: FormGroup;
  isLoading = false;
  cooldownSeconds = 0;
  emailServerError = '';

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    public languageService: LanguageService,
    private formBuilder: FormBuilder,
    private passwordResetService: PasswordResetService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnDestroy(): void {
    this.clearCooldown();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  onSubmit(): void {
    if (this.forgotForm.invalid || this.isLoading || this.cooldownSeconds > 0) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.emailServerError = '';

    const email = this.forgotForm.get('email')?.value;

    this.passwordResetService.requestPasswordEmail(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        const message = response.message || 'PASSWORD_RESET_LINK_SENT';
        this.toastService.show(message);
        this.startCooldown(60);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 422) {
          this.emailServerError = error.error?.errors?.email?.[0] ?? '';
        } else {
          this.toastService.show('GENERIC_ERROR_AR');
        }
      },
    });
  }

  private startCooldown(seconds: number): void {
    this.clearCooldown();
    this.cooldownSeconds = seconds;
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        this.clearCooldown();
      }
    }, 1000);
  }

  private clearCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
    if (this.cooldownSeconds < 0) {
      this.cooldownSeconds = 0;
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.forgotForm.controls).forEach((key) => {
      this.forgotForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.forgotForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return 'ERRORS.EMAIL_REQUIRED';
      }
      if (field.errors['email']) {
        return 'ERRORS.INVALID_EMAIL_FORMAT';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  get isSubmitDisabled(): boolean {
    return (
      this.isLoading ||
      this.cooldownSeconds > 0 ||
      this.forgotForm.invalid
    );
  }
}
