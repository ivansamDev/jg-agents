import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal<boolean>(false);
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('jg-theme')) as 'light' | 'dark' | null;
    const initial = saved ?? 'light';
    this.theme.set(initial);
    this.isDark.set(initial === 'dark');
    this.apply();

    effect(() => {
      const t = this.theme();
      this.isDark.set(t === 'dark');
      this.apply();
      if (typeof localStorage !== 'undefined') localStorage.setItem('jg-theme', t);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('theme-dark', this.theme() === 'dark');
    root.classList.toggle('theme-light', this.theme() === 'light');
  }
}
