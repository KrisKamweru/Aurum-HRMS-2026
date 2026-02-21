import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { resource } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Convex
import { api } from '../../../../convex/_generated/api';
import { ConvexClientService } from '../../core/services/convex-client.service';

// UI Components
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiFormFieldComponent } from '../../shared/components/ui-form-field/ui-form-field.component';
import { ToastService } from '../../shared/services/toast.service';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiIconComponent,
    UiFormFieldComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Employee Profile</h1>
          <p class="text-[15px] text-stone-600 dark:text-stone-400 mt-2">Manage your personal information and account settings</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-white/8">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            (click)="setActiveTab('info')"
            [class.border-burgundy-700]="activeTab() === 'info'"
            [class.text-burgundy-700]="activeTab() === 'info'"
            [class.dark:text-burgundy-300]="activeTab() === 'info'"
            [class.dark:border-burgundy-300]="activeTab() === 'info'"
            [class.border-transparent]="activeTab() !== 'info'"
            [class.text-stone-500]="activeTab() !== 'info'"
            [class.dark:text-stone-400]="activeTab() !== 'info'"
            [class.hover:text-stone-700]="activeTab() !== 'info'"
            [class.dark:hover:text-stone-300]="activeTab() !== 'info'"
            [class.hover:border-stone-300]="activeTab() !== 'info'"
            [class.dark:hover:border-stone-600]="activeTab() !== 'info'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors"
          >
            <ui-icon name="user" class="w-4 h-4"></ui-icon>
            My Info
          </button>

          <button
            (click)="setActiveTab('settings')"
            [class.border-burgundy-700]="activeTab() === 'settings'"
            [class.text-burgundy-700]="activeTab() === 'settings'"
            [class.dark:text-burgundy-300]="activeTab() === 'settings'"
            [class.dark:border-burgundy-300]="activeTab() === 'settings'"
            [class.border-transparent]="activeTab() !== 'settings'"
            [class.text-stone-500]="activeTab() !== 'settings'"
            [class.dark:text-stone-400]="activeTab() !== 'settings'"
            [class.hover:text-stone-700]="activeTab() !== 'settings'"
            [class.dark:hover:text-stone-300]="activeTab() !== 'settings'"
            [class.hover:border-stone-300]="activeTab() !== 'settings'"
            [class.dark:hover:border-stone-600]="activeTab() !== 'settings'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors"
          >
            <ui-icon name="cog-6-tooth" class="w-4 h-4"></ui-icon>
            Settings
          </button>
        </nav>
      </div>

      <!-- Content Area -->
      @if (profileResource.isLoading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-700"></div>
        </div>
      } @else if (profileResource.error()) {
        <div class="flex flex-col items-center justify-center py-16">
          <svg class="w-32 h-32 mb-4" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background Blob -->
            <path d="M60 110C87.6142 110 110 87.6142 110 60C110 32.3858 87.6142 10 60 10C32.3858 10 10 32.3858 10 60C10 87.6142 32.3858 110 60 110Z" class="fill-red-50 dark:fill-red-900/30"/>

            <!-- Warning Triangle -->
            <path d="M60 35L85 80H35L60 35Z" stroke="#EF4444" stroke-width="2" stroke-linejoin="round" class="fill-white dark:fill-stone-800"/>

            <!-- Exclamation Mark -->
            <path d="M60 50V65" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="72" r="1.5" fill="#EF4444"/>

            <!-- Decorative Elements -->
            <path d="M90 30L95 25" class="stroke-red-200 dark:stroke-red-800" stroke-width="2" stroke-linecap="round"/>
            <path d="M25 30L30 35" class="stroke-red-200 dark:stroke-red-800" stroke-width="2" stroke-linecap="round"/>
            <circle cx="20" cy="60" r="2" class="fill-red-200 dark:fill-red-800"/>
            <circle cx="100" cy="60" r="3" class="fill-red-200 dark:fill-red-800"/>
          </svg>

          <h3 class="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Unable to Load Profile</h3>
          <p class="text-red-600 dark:text-red-400 text-center max-w-sm mb-4">
            We encountered an issue while retrieving your profile data. This might be a temporary connectivity problem.
          </p>
          <ui-button variant="outline" size="sm" (onClick)="profileResource.reload()" class="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            <ui-icon name="arrow-path" class="w-4 h-4 mr-2"></ui-icon>
            Try Again
          </ui-button>
        </div>
      } @else {
        @let profile = profileResource.value();

        @if (profile) {
          <!-- My Info Tab -->
          @if (activeTab() === 'info') {
            <div class="dash-frame">
              <ui-grid [columns]="'1fr 2fr'" [gap]="'0px'">
                <ui-grid-tile title="Profile" variant="compact" divider="right">
                  <div class="tile-body">
                    <div class="flex flex-col items-center text-center">
                      <div class="w-32 h-32 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-4 overflow-hidden border-4 border-white dark:border-stone-600 shadow-md">
                        @if (profile.user && profile.user.image) {
                          <img [src]="profile.user.image" alt="Profile" class="w-full h-full object-cover">
                        } @else {
                          <span class="text-4xl font-bold text-stone-300 dark:text-stone-200">
                            {{ getInitials(profile.firstName, profile.lastName) }}
                          </span>
                        }
                      </div>

                      <h2 class="text-xl font-bold text-stone-900 dark:text-stone-100">{{ profile.firstName }} {{ profile.lastName }}</h2>
                      <p class="text-stone-500 dark:text-stone-400">{{ profile.position || 'No Designation' }}</p>

                      <div class="mt-4 flex flex-wrap justify-center gap-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-burgundy-50 dark:bg-burgundy-700/12 text-burgundy-700 dark:text-burgundy-300">
                          {{ profile.department || 'No Department' }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                          {{ profile.location || 'Remote' }}
                        </span>
                      </div>

                      <div class="w-full mt-6 pt-6 border-t border-stone-100 dark:border-white/5 space-y-4">
                        <div class="flex justify-between items-center text-sm">
                          <span class="text-stone-500 dark:text-stone-400">Employee ID</span>
                          <span class="font-mono font-medium text-stone-900 dark:text-stone-100">{{ formatId(profile._id) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                          <span class="text-stone-500 dark:text-stone-400">Joined</span>
                          <span class="font-medium text-stone-900 dark:text-stone-100">{{ profile.startDate | date:'mediumDate' }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                          <span class="text-stone-500 dark:text-stone-400">Tenure</span>
                          <span class="font-medium text-stone-900 dark:text-stone-100">{{ profile.tenure }}</span>
                        </div>
                        @if (profile.managerName) {
                          <div class="flex justify-between items-center text-sm">
                            <span class="text-stone-500 dark:text-stone-400">Reports To</span>
                            <span class="font-medium text-stone-900 dark:text-stone-100">{{ profile.managerName }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </ui-grid-tile>

                <ui-grid-tile title="Personal Information" variant="compact">
                  <div tile-actions>
                    @if (!isEditing()) {
                      <ui-button variant="secondary" size="sm" (onClick)="toggleEdit()">
                        <ui-icon name="edit" class="w-4 h-4 mr-1"></ui-icon>
                        Edit
                      </ui-button>
                    }
                  </div>
                  <div class="tile-body">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Manage your personal contact details
                    </p>

                    @if (!isEditing()) {
                      <!-- View Mode -->
                      <div class="mt-6 space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Email Address</p>
                            <p class="mt-1 text-base text-stone-900 dark:text-stone-100">{{ profile.email }}</p>
                          </div>
                          <div>
                            <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Phone Number</p>
                            <p class="mt-1 text-base text-stone-900 dark:text-stone-100">{{ profile.phone || 'Not set' }}</p>
                          </div>
                          <div>
                            <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Date of Birth</p>
                            <p class="mt-1 text-base text-stone-900 dark:text-stone-100">{{ (profile.dob | date:'mediumDate') || 'Not set' }}</p>
                          </div>
                          <div>
                            <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Gender</p>
                            <p class="mt-1 text-base text-stone-900 dark:text-stone-100 capitalize">{{ profile.gender || 'Not set' }}</p>
                          </div>
                          <div class="md:col-span-2">
                            <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Address</p>
                            <p class="mt-1 text-base text-stone-900 dark:text-stone-100">{{ profile.address || 'Not set' }}</p>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <!-- Edit Mode -->
                      <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="mt-6 space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <!-- Read-only Email -->
                          <div class="md:col-span-2">
                             <ui-form-field label="Email Address" hint="Contact HR to change your email">
                               <input type="email" [value]="profile.email" disabled
                                 class="w-full px-4 py-2.5 rounded-lg text-sm
                                        bg-stone-50 border border-stone-200
                                        dark:bg-stone-800 dark:border-stone-700
                                        text-stone-500 dark:text-stone-400 cursor-not-allowed">
                             </ui-form-field>
                          </div>

                          <ui-form-field label="Phone Number" [control]="editForm.get('phone')">
                            <input type="tel" formControlName="phone"
                              class="w-full px-4 py-2.5 rounded-lg text-sm
                                     bg-white border border-stone-200
                                     dark:bg-white/5 dark:border-white/8 dark:text-white
                                     placeholder:text-stone-400 dark:placeholder:text-stone-500
                                     focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                                     transition-all">
                          </ui-form-field>

                          <ui-form-field label="Gender" [control]="editForm.get('gender')">
                            <select formControlName="gender"
                              class="w-full px-4 py-2.5 rounded-lg text-sm
                                     bg-white border border-stone-200
                                     dark:bg-white/5 dark:border-white/8 dark:text-white
                                     focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                                     transition-all appearance-none">
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                              <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                          </ui-form-field>

                          <ui-form-field label="Date of Birth" [control]="editForm.get('dob')">
                            <input type="date" formControlName="dob"
                              class="w-full px-4 py-2.5 rounded-lg text-sm
                                     bg-white border border-stone-200
                                     dark:bg-white/5 dark:border-white/8 dark:text-white
                                     focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                                     transition-all">
                          </ui-form-field>

                          <div class="md:col-span-2">
                            <ui-form-field label="Address" [control]="editForm.get('address')">
                              <textarea formControlName="address" rows="3"
                                class="w-full px-4 py-2.5 rounded-lg text-sm
                                       bg-white border border-stone-200
                                       dark:bg-white/5 dark:border-white/8 dark:text-white
                                       placeholder:text-stone-400 dark:placeholder:text-stone-500
                                       focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                                       transition-all"></textarea>
                            </ui-form-field>
                          </div>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-white/5">
                          <ui-button variant="ghost" (onClick)="cancelEdit()">Cancel</ui-button>
                          <ui-button type="submit" [loading]="isSaving()" [disabled]="editForm.invalid || isSaving()">
                            Save Changes
                          </ui-button>
                        </div>
                      </form>
                    }
                  </div>
                </ui-grid-tile>
              </ui-grid>
            </div>
          } @else {
            <!-- Settings Tab -->
            <div class="dash-frame">
              <ui-grid [columns]="'1fr'" [gap]="'0px'">
                <ui-grid-tile title="Account Settings" variant="compact">
                  <div class="tile-body">
                    <div class="py-16 flex flex-col items-center justify-center text-center">
                      <svg class="w-40 h-40 mb-6" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="settings-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#8b1e3f" stop-opacity="0.15"/>
                            <stop offset="100%" stop-color="#b8956b" stop-opacity="0.15"/>
                          </linearGradient>
                        </defs>

                        <!-- Background Gear -->
                        <circle cx="80" cy="80" r="60" class="stroke-stone-200 dark:stroke-stone-700" stroke-width="1" stroke-dasharray="8 8"/>

                        <!-- Main Gear -->
                        <path d="M80 50L84 40H76L80 50ZM110 80L120 76V84L110 80ZM80 110L76 120H84L80 110ZM50 80L40 84V76L50 80Z" class="fill-stone-300 dark:fill-stone-600"/>
                        <circle cx="80" cy="80" r="30" fill="url(#settings-grad)" class="stroke-stone-300 dark:stroke-stone-600" stroke-width="2"/>
                        <circle cx="80" cy="80" r="12" class="fill-white dark:fill-stone-800 stroke-[#8b1e3f]" stroke-width="2"/>

                        <!-- Floating Elements -->
                        <circle cx="110" cy="50" r="8" stroke="#b8956b" stroke-width="1.5" class="fill-white dark:fill-stone-800"/>
                        <path d="M107 50L113 50" stroke="#b8956b" stroke-width="1.5"/>
                        <path d="M110 47L110 53" stroke="#b8956b" stroke-width="1.5"/>

                        <rect x="40" y="100" width="16" height="12" rx="2" stroke="#8b1e3f" stroke-width="1.5" class="fill-white dark:fill-stone-800"/>
                        <path d="M48 100V98" stroke="#8b1e3f" stroke-width="1.5"/>
                      </svg>

                      <h3 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Settings Coming Soon</h3>
                      <p class="text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
                        We're crafting a new settings experience to give you more control over your profile, notifications, and security preferences.
                      </p>
                      <div class="mt-6 flex gap-2">
                        <span class="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-600">Notifications</span>
                        <span class="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-600">Security</span>
                        <span class="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-600">Appearance</span>
                      </div>
                    </div>
                  </div>
                </ui-grid-tile>
              </ui-grid>
            </div>
          }

        } @else {
          <div class="flex flex-col items-center justify-center py-20">
            <svg class="w-48 h-48 mb-6 opacity-90" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="profile-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8b1e3f"/>
                  <stop offset="100%" stop-color="#b8956b"/>
                </linearGradient>
              </defs>

              <!-- Background elements -->
              <circle cx="80" cy="80" r="70" class="stroke-stone-100 dark:stroke-stone-800" stroke-width="1"/>
              <circle cx="80" cy="80" r="55" class="stroke-stone-200 dark:stroke-stone-700" stroke-width="1" stroke-dasharray="4 4"/>

              <!-- File/Profile Document Shape -->
              <path d="M60 40H90L110 60V110C110 115.523 105.523 120 100 120H60C54.4772 120 50 115.523 50 110V50C50 44.4772 54.4772 40 60 40Z" class="fill-white dark:fill-stone-800 stroke-stone-300 dark:stroke-stone-600" stroke-width="1.5"/>
              <path d="M90 40V60H110" class="stroke-stone-300 dark:stroke-stone-600" stroke-width="1.5" stroke-linejoin="round"/>

              <!-- Lines on doc -->
              <rect x="62" y="55" width="20" height="20" rx="10" class="fill-stone-100 dark:fill-stone-700"/>
              <line x1="65" y1="85" x2="95" y2="85" class="stroke-stone-200 dark:stroke-stone-600" stroke-width="2" stroke-linecap="round"/>
              <line x1="65" y1="95" x2="90" y2="95" class="stroke-stone-200 dark:stroke-stone-600" stroke-width="2" stroke-linecap="round"/>

              <!-- Magnifying Glass Search -->
              <circle cx="105" cy="105" r="22" class="fill-white dark:fill-stone-800" stroke="url(#profile-gradient)" stroke-width="2.5"/>
              <path d="M120 120L135 135" stroke="url(#profile-gradient)" stroke-width="4" stroke-linecap="round"/>

              <!-- Question mark inside glass -->
              <path d="M105 110V109C105 107 107 105 108 104C109 103 109 101 107 100C105 99 103 101 103 101" stroke="#8b1e3f" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="105" cy="115" r="2" fill="#8b1e3f"/>
            </svg>

            <h2 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Profile Not Found</h2>
            <p class="text-stone-500 dark:text-stone-400 max-w-sm text-center mb-8">
              We couldn't locate the employee profile you're looking for. It may have been removed or you might not have permission to view it.
            </p>

            <ui-button variant="secondary" routerLink="/dashboard">
              <ui-icon name="home" class="w-4 h-4 mr-2"></ui-icon>
              Back to Dashboard
            </ui-button>
          </div>
        }
      }
    </div>
  `
})
export class ProfileComponent {
  private convex = inject(ConvexClientService);
  private fb = inject(FormBuilder);
  // Using dynamic import or assuming service availability - checking system-reminder content
  // "Use ToastService for notifications"
  // I need to import it properly. I'll assume it's in shared/services/toast.service.ts based on requirements
  // But previously I saw ui-toast.component.ts.
  // Let me double check if I can inject a ToastService.
  // The requirement said: "../../shared/services/toast.service" for ToastService
  // I will trust the requirement.
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  activeTab = signal<'info' | 'settings'>('info');
  isEditing = signal(false);
  isSaving = signal(false);

  // Form
  editForm = this.fb.group({
    phone: [''],
    address: [''],
    gender: [''],
    dob: ['']
  });

  // Resource
  profileResource = resource({
    loader: () => this.convex.getClient().query(api.employees.getMyProfile, {})
  });

  constructor() {
    // Sync tab from query param or route data if needed, but for now just simple logic
    // We could check URL to set initial tab
    effect(() => {
      // Just to populate form when entering edit mode
      if (this.isEditing()) {
        const profile = this.profileResource.value();
        if (profile) {
          this.editForm.patchValue({
            phone: profile.phone || '',
            address: profile.address || '',
            gender: profile.gender || '',
            dob: profile.dob || ''
          });
        }
      }
    });
  }

  ngOnInit() {
    // Handle /settings route alias - redirect to /profile?tab=settings
    if (this.router.url.includes('/settings')) {
      this.router.navigate(['/profile'], {
        queryParams: { tab: 'settings' },
        replaceUrl: true
      });
      return;
    }

    // Handle query params for tab state
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'settings') {
        this.activeTab.set('settings');
      } else if (params['tab'] === 'info') {
        this.activeTab.set('info');
      }
    });
  }

  setActiveTab(tab: 'info' | 'settings') {
    this.activeTab.set(tab);

    // Update URL to reflect tab state
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  toggleEdit() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editForm.reset();
  }

  async saveProfile() {
    if (this.editForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.editForm.value;

    try {
      await this.convex.getClient().mutation(api.employees.updateMyProfile, {
        phone: formValue.phone || undefined,
        address: formValue.address || undefined,
        gender: formValue.gender || undefined,
        dob: formValue.dob || undefined
      });

      this.toast.success('Profile updated successfully');
      this.isEditing.set(false);
      this.profileResource.reload(); // Refresh data
    } catch (error) {
      console.error('Failed to update profile:', error);
      this.toast.error('Failed to update profile. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  getInitials(first: string, last: string): string {
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  formatId(id: string): string {
    // Show last 6 chars of ID for display
    return id.slice(-6).toUpperCase();
  }
}







