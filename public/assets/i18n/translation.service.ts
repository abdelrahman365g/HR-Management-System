import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  translate = inject(TranslateService);
  
  detectLanguage() {
    const lang = localStorage.getItem('lang') || 'en';
    this.translate.use(lang);
  }

  switchLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
