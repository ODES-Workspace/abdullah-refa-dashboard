import { Component } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  standalone: true,
})
export class SignupComponent {
  userType: 'agent' | 'individual' = 'agent';
  passwordType = 'password';

  constructor(public languageService: LanguageService) {}

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }
}
