// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  translate: TranslateService = inject(TranslateService);

  constructor() {
    const savedLang = localStorage.getItem('lang');
    const lang = savedLang ? savedLang : 'en';
    this.setLanguage(lang);
  }

  toggleLanguage() {
    const currentLang = this.translate.currentLang;
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.setDirection(lang);
  }

  private setDirection(lang: string) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
  }
}
