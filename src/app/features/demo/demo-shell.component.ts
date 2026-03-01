import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demo-shell',
  imports: [RouterOutlet, UiNavItemComponent],
  template: `
    <div 
      class="flex h-screen w-full font-body text-slate-800 dark:text-slate-200 overflow-hidden relative"
      style="background-color: var(--color-bg-canvas); background-image: linear-gradient(to bottom right, var(--color-bg-canvas), var(--color-bg-canvas-end));"
    >
      <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-400/10 dark:bg-primary-900/20 blur-[100px]"></div>
        <div class="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-amber-400/10 dark:bg-amber-900/20 blur-[100px]"></div>
        <div class="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 dark:bg-emerald-900/20 blur-[120px]"></div>
        <div class="absolute inset-0 bg-noise opacity-30 mix-blend-overlay"></div>
      </div>

      <nav class="w-64 shrink-0 border-r border-white/40 dark:border-white/10 glass-surface flex flex-col z-10 p-4 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div class="mb-8 px-4 py-3 flex flex-col">
          <h2 class="text-2xl font-display font-medium text-slate-900 dark:text-white flex items-center gap-3">
            <svg class="h-8 w-8 text-primary-800 dark:text-primary-400 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Aurum Elements
          </h2>
          <p class="text-[10px] text-slate-400 font-semibold tracking-widest mt-2 uppercase ml-11">Frosted Clarity</p>
        </div>
        <div class="flex-1 space-y-1 overflow-y-auto scrollbar-custom pr-2">
          <ui-nav-item label="HRMS Dashboard" icon="inbox" route="/demo/dashboard"></ui-nav-item>
          <ui-nav-item label="Forms & Inputs" icon="selector" route="/demo/forms"></ui-nav-item>
          <ui-nav-item label="Data Tables" icon="information-circle" route="/demo/tables"></ui-nav-item>
          <ui-nav-item label="Glassmorphism" icon="check" route="/demo/glassmorphism"></ui-nav-item>
        </div>
        <div class="mt-auto px-4 py-4 pt-6 text-xs text-slate-400 border-t border-black/5 dark:border-white/5 text-center flex flex-col items-center gap-5">
          <div class="flex items-center gap-3 font-semibold text-slate-500 text-sm">
            <span [class.text-slate-900]="!isDarkMode()" class="transition-colors">Light</span>
            <button 
              (click)="toggleDarkMode()"
              class="relative inline-flex h-8 w-16 items-center rounded-full bg-slate-300 dark:bg-slate-700 transition-colors focus:ring-2 focus:ring-primary-500/30 outline-none shadow-inner"
            >
              <span class="sr-only">Toggle Dark Mode</span>
              <span 
                class="inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out"
                [class.translate-x-9]="isDarkMode()" 
                [class.translate-x-1]="!isDarkMode()"
              >
                @if (isDarkMode()) {
                  <span class="h-1.5 w-1.5 rounded-full bg-slate-400 absolute top-1.5 right-1.5 shadow-[2px_3px_0_-0.5px_rgba(148,163,184,1)]"></span>
                }
              </span>
            </button>
            <span [class.text-white]="isDarkMode()" class="transition-colors">Dark</span>
          </div>
          <div>Aurum HRMS Design System Version 2.0</div>
        </div>
      </nav>

      <main class="flex-1 h-screen overflow-y-auto scrollbar-custom z-10 relative">
        <div class="p-8 pb-32 max-w-[1400px] mx-auto min-h-full">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class DemoShellComponent {
  readonly isDarkMode = signal(this.checkInitialDarkMode());

  constructor() {
    this.applyTheme();
  }

  toggleDarkMode(): void {
    this.isDarkMode.update(v => !v);
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
  }

  private checkInitialDarkMode(): boolean {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') === 'dark';
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}
