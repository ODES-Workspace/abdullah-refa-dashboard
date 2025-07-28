import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import {
  AgentService,
  AgentRegistrationRequest,
} from '../../../services/agent.service';
import { TranslateModule } from '@ngx-translate/core';
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
  selector: 'app-signup',
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  standalone: true,
})
export class SignupComponent implements OnInit {
  userType: 'agent' | 'individual' = 'agent';
  passwordType = 'password';
  confirmPasswordType = 'password';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  registrationForm!: FormGroup;

  constructor(
    public languageService: LanguageService,
    private agentService: AgentService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registrationForm = this.formBuilder.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone_number: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword && confirmPassword.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordType() {
    this.confirmPasswordType =
      this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  onSubmit() {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registrationData: AgentRegistrationRequest = {
      name: this.registrationForm.get('name')?.value,
      email: this.registrationForm.get('email')?.value,
      phone_number: this.registrationForm.get('phone_number')?.value,
      password: this.registrationForm.get('password')?.value,
      password_confirmation: this.registrationForm.get('password_confirmation')
        ?.value,
    };

    this.agentService.registerAgent(registrationData).subscribe({
      next: (response) => {
        console.log(response);
        this.isLoading = false;
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      },
    });
  }

  markFormGroupTouched() {
    Object.keys(this.registrationForm.controls).forEach((key) => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `ERRORS.${fieldName.toUpperCase()}_REQUIRED`;
      }
      if (field.errors['email']) {
        return 'ERRORS.INVALID_EMAIL_FORMAT';
      }
      if (field.errors['minlength']) {
        return `ERRORS.${fieldName.toUpperCase()}_MIN_LENGTH`;
      }
      if (field.errors['maxlength']) {
        return `ERRORS.${fieldName.toUpperCase()}_MAX_LENGTH`;
      }
      if (field.errors['pattern']) {
        return 'ERRORS.INVALID_PHONE_NUMBER';
      }
      if (field.errors['passwordMismatch']) {
        return 'ERRORS.PASSWORDS_DO_NOT_MATCH';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
