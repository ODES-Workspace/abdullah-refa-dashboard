import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  translate: TranslateService = inject(TranslateService);
  passwordType = 'password';

  constructor() {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
      this.translate.use(savedLang);
      this.setDirection(savedLang);
    } else {
      this.translate.use('en');
      this.setDirection('en');
    }
  }

  // Toggle language between English and Arabic
  toggleLanguage() {
    const currentLang = this.translate.currentLang;
    const newLang = currentLang === 'en' ? 'ar' : 'en';

    this.translate.use(newLang);
    localStorage.setItem('lang', newLang);
    this.setDirection(newLang); // update direction as well
  }

  togglePasswordType() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  // Set the page direction based on language
  private setDirection(lang: string) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
  }
}
