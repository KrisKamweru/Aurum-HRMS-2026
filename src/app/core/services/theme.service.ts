import { Injectable, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);

  // The user's preferred setting (persisted)
  readonly theme = signal<Theme>(this.getInitialTheme());

  // The actual applied theme (derived from system preference if 'system' is selected)
  readonly appliedTheme = signal<'light' | 'dark'>('light');

  constructor() {
    // Effect to apply the theme whenever it changes
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      localStorage.setItem('theme', currentTheme);
    });

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.theme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }

  toggleTheme() {
    const current = this.theme();
    if (current === 'system') {
      // If currently system, switch to the opposite of what system currently is
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(isDark ? 'light' : 'dark');
    } else {
      this.theme.set(current === 'light' ? 'dark' : 'light');
    }
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system';
  }

  private applyTheme(theme: Theme) {
    let isDark = false;

    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    this.appliedTheme.set(isDark ? 'dark' : 'light');

    if (isDark) {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
  }
}
