import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiToastComponent } from '../../shared/components/ui-toast/ui-toast.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, UiIconComponent, UiToastComponent],
  template: `
    <div class="min-h-screen flex">
      <!-- Global Toast Container -->
      <ui-toast></ui-toast>

      <!-- Left Panel - Branding -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <!-- Background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#722038] via-[#8b1e3f] to-[#4a0d1f]"></div>

        <!-- Decorative elements -->
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

        <!-- Geometric pattern overlay -->
        <div class="absolute inset-0 opacity-5">
          <div class="absolute top-[20%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div class="absolute top-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          <div class="absolute top-[60%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div class="absolute top-[80%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <!-- Logo -->
          <div class="mb-10 animate-fade-in-down">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
              <span class="relative text-[#4a0d1f] font-bold text-5xl">A</span>
            </div>
          </div>

          <!-- Tagline -->
          <h1 class="text-5xl font-bold text-white mb-4 text-center animate-fade-in-up">
            Aurum <span class="text-amber-300">HRMS</span>
          </h1>
          <p class="text-white/70 text-xl text-center max-w-md animate-fade-in-up stagger-1">
            Elevate your human resource management with precision and elegance
          </p>

          <!-- Decorative divider -->
          <div class="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-10 animate-fade-in-up stagger-2"></div>

          <!-- Feature highlights -->
          <div class="space-y-5 animate-fade-in-up stagger-3">
            <div class="flex items-center gap-4 text-white/80 hover:text-white transition-colors group">
              <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ui-icon name="users" class="w-6 h-6 text-amber-300"></ui-icon>
              </div>
              <span class="text-lg">Streamlined Employee Management</span>
            </div>
            <div class="flex items-center gap-4 text-white/80 hover:text-white transition-colors group">
              <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ui-icon name="chart-bar" class="w-6 h-6 text-amber-300"></ui-icon>
              </div>
              <span class="text-lg">Insightful Analytics & Reports</span>
            </div>
            <div class="flex items-center gap-4 text-white/80 hover:text-white transition-colors group">
              <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ui-icon name="lock-closed" class="w-6 h-6 text-amber-300"></ui-icon>
              </div>
              <span class="text-lg">Enterprise-Grade Security</span>
            </div>
          </div>
        </div>

        <!-- Bottom decorative text -->
        <div class="absolute bottom-8 left-0 right-0 text-center">
          <p class="text-white/30 text-sm tracking-widest uppercase">Where excellence meets innovation</p>
        </div>
      </div>

      <!-- Right Panel - Form -->
      <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-b from-stone-50 to-stone-100">
        <!-- Mobile logo -->
        <div class="lg:hidden flex justify-center mb-10">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b1e3f] to-[#722038] flex items-center justify-center shadow-lg shadow-[#8b1e3f]/20">
              <span class="text-amber-300 font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-stone-900">
                Aurum <span class="text-[#8b1e3f]">HRMS</span>
              </h1>
              <p class="text-sm text-stone-500">Human Resource Management</p>
            </div>
          </div>
        </div>

        <div class="mx-auto w-full max-w-sm lg:max-w-md">
          <!-- Card with subtle top accent -->
          <div class="relative bg-white rounded-2xl shadow-xl shadow-stone-200/60 p-8 sm:p-10 border border-stone-100 animate-scale-in overflow-hidden">
            <!-- Top accent bar -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b1e3f] via-[#a82349] to-[#8b1e3f]"></div>
            <router-outlet />
          </div>

          <!-- Footer -->
          <div class="mt-10 text-center">
            <div class="flex items-center justify-center gap-2 text-stone-400 text-sm mb-2">
              <div class="w-8 h-px bg-gradient-to-r from-transparent to-stone-300"></div>
              <span class="text-stone-500">Crafted with precision</span>
              <div class="w-8 h-px bg-gradient-to-l from-transparent to-stone-300"></div>
            </div>
            <p class="text-stone-400 text-xs">
              &copy; 2026 Aurum HRMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .stagger-1 { animation-delay: 100ms; }
    .stagger-2 { animation-delay: 200ms; }
    .stagger-3 { animation-delay: 300ms; }

    .animate-fade-in-down {
      animation: fadeInDown 0.7s ease-out forwards;
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.7s ease-out forwards;
      opacity: 0;
    }

    .animate-scale-in {
      animation: scaleIn 0.5s ease-out forwards;
    }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class AuthLayoutComponent {}
