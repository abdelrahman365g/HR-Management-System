import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language';
import { ThemeService, ThemePreference } from '../../../services/theme';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../../constants/languages.constant';

@Component({
  imports: [RouterOutlet, TranslatePipe],
  selector: 'app-auth-layout',
  styleUrl: './auth-layout.css',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  protected readonly languageService = inject(LanguageService);
  protected readonly themeService = inject(ThemeService);
  protected readonly languages = SUPPORTED_LANGUAGES;
  protected readonly menuOpen = signal(false);
  protected readonly themeMenuOpen = signal(false);

  protected readonly themeOptions: { value: ThemePreference; labelKey: string }[] = [
    { value: 'light', labelKey: 'userMenu.themeLight' },
    { value: 'dark', labelKey: 'userMenu.themeDark' },
    { value: 'system', labelKey: 'userMenu.themeSystem' },
  ];

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
    if (this.menuOpen()) this.themeMenuOpen.set(false);
  }

  toggleThemeMenu(): void {
    this.themeMenuOpen.set(!this.themeMenuOpen());
    if (this.themeMenuOpen()) this.menuOpen.set(false);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.themeMenuOpen.set(false);
  }

  chooseLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language.code);
    this.closeMenu();
  }

  chooseTheme(preference: ThemePreference): void {
    this.themeService.setTheme(preference);
    this.themeMenuOpen.set(false);
  }

  isCurrent(language: SupportedLanguage): boolean {
    return this.languageService.current() === language.code;
  }
}
