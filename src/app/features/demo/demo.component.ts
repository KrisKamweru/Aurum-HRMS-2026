import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Demo Sidebar -->
      <div class="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed inset-y-0">
        <div class="p-6 border-b border-gray-200">
          <h1 class="text-xl font-bold text-gray-900">UI Kit Demo</h1>
          <p class="text-sm text-gray-500 mt-1">Design System Reference</p>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <a routerLink="/demo/buttons" routerLinkActive="bg-rose-50 text-rose-700" class="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-rose-700 font-medium transition-colors">
            Buttons & Badges
          </a>
          <a routerLink="/demo/forms" routerLinkActive="bg-rose-50 text-rose-700" class="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-rose-700 font-medium transition-colors">
            Forms & Inputs
          </a>
          <a routerLink="/demo/tables" routerLinkActive="bg-rose-50 text-rose-700" class="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-rose-700 font-medium transition-colors">
            Data Tables
          </a>
          <a routerLink="/demo/modals" routerLinkActive="bg-rose-50 text-rose-700" class="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-rose-700 font-medium transition-colors">
            Modals & Feedback
          </a>
          <div class="pt-4 mt-4 border-t border-gray-200">
            <a routerLink="/dashboard" class="block px-4 py-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
              ← Back to App
            </a>
          </div>
        </nav>
      </div>

      <!-- Content -->
      <div class="flex-1 ml-64 p-8">
        <router-outlet />
      </div>
    </div>
  `
})
export class DemoComponent {}
