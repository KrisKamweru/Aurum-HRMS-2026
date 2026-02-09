import { Component, computed, inject, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { resource } from '@angular/core';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiFormFieldComponent } from '../../shared/components/ui-form-field/ui-form-field.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-org-browser-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiModalComponent,
    UiButtonComponent,
    UiFormFieldComponent,
    UiIconComponent,
    UiBadgeComponent
  ],
  template: `
    <ui-modal
      [(isOpen)]="isOpen"
      title="Join an Organization"
      size="lg"
      [hasFooter]="false"
    >
      <div class="space-y-6">
        <!-- Search -->
        <ui-form-field label="Search Organizations">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Search by name..."
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-white/8 bg-white dark:bg-white/5 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            />
            <div class="absolute left-3 top-2.5 text-stone-400">
              <ui-icon name="magnifying-glass" class="w-5 h-5"></ui-icon>
            </div>
          </div>
        </ui-form-field>

        <!-- Orgs List -->
        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          @if (organizationsResource.isLoading()) {
            <div class="flex justify-center py-8 text-stone-500">
              <ui-icon name="arrow-path" class="w-6 h-6 animate-spin"></ui-icon>
            </div>
          } @else if (organizationsResource.error()) {
            <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-center text-sm">
              Failed to load organizations
            </div>
          } @else {
            @let orgs = filteredOrgs();

            @if (orgs.length === 0) {
              <div class="text-center py-8 text-stone-500 dark:text-stone-400">
                <p>No organizations found matching "{{ searchTerm() }}"</p>
              </div>
            }

            @for (org of orgs; track org._id) {
              <div class="p-4 rounded-xl border border-stone-200 dark:border-white/8 hover:border-[#8b1e3f]/30 dark:hover:border-[#8b1e3f]/40 hover:bg-[#fdf2f4]/30 dark:hover:bg-[#3f1320]/30 transition-all group">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-stone-900 dark:text-stone-100">{{ org.name }}</h4>
                      @if (isDomainMatch(org.domain)) {
                        <ui-badge variant="success" size="sm" [rounded]="true">Recommended</ui-badge>
                      }
                    </div>
                    @if (org.domain) {
                      <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Domain: {{ org.domain }}</p>
                    }
                  </div>

                  <ui-button
                    [variant]="selectedOrgId() === org._id ? 'secondary' : 'primary'"
                    size="sm"
                    (onClick)="selectOrg(org)"
                  >
                    {{ selectedOrgId() === org._id ? 'Selected' : 'Select' }}
                  </ui-button>
                </div>

                <!-- Request Form (shown when selected) -->
                @if (selectedOrgId() === org._id) {
                  <div class="mt-4 pt-4 border-t border-stone-100 dark:border-white/8 animate-fade-in">
                    <ui-form-field label="Note (Optional)" hint="Introduce yourself to the admin">
                      <textarea
                        [(ngModel)]="requestNote"
                        rows="2"
                        class="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/8 bg-white dark:bg-white/5 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all resize-none text-sm"
                        placeholder="I'm a new employee in the Engineering department..."
                      ></textarea>
                    </ui-form-field>

                    <div class="mt-3 flex justify-end gap-2">
                      <ui-button variant="ghost" size="sm" (onClick)="selectedOrgId.set(null)">Cancel</ui-button>
                      <ui-button
                        variant="primary"
                        size="sm"
                        [loading]="submitting()"
                        (onClick)="submitRequest(org._id)"
                      >
                        Send Request
                      </ui-button>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </ui-modal>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class OrgBrowserDialogComponent {
  isOpen = model(false);
  requestSent = output<void>();

  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);

  searchTerm = signal('');
  selectedOrgId = signal<string | null>(null);
  requestNote = signal('');
  submitting = signal(false);

  // Load organizations
  organizationsResource = resource({
    loader: () => this.convex.getClient().query(api.onboarding.listOrganizations, {})
  });

  filteredOrgs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const orgs = this.organizationsResource.value() || [];

    if (!term) return orgs;

    return orgs.filter(org =>
      org.name.toLowerCase().includes(term) ||
      org.domain?.toLowerCase().includes(term)
    );
  });

  currentUser = this.authService.getUser();

  isDomainMatch(orgDomain?: string): boolean {
    if (!orgDomain) return false;
    const email = this.currentUser()?.email;
    if (!email) return false;
    return email.endsWith(`@${orgDomain}`);
  }

  selectOrg(org: any) {
    if (this.selectedOrgId() === org._id) {
      this.selectedOrgId.set(null);
    } else {
      this.selectedOrgId.set(org._id);
      this.requestNote.set('');
    }
  }

  async submitRequest(orgId: string) {
    this.submitting.set(true);
    try {
      await this.convex.getClient().mutation(api.onboarding.createJoinRequest, {
        orgId: orgId as any,
        note: this.requestNote() || undefined
      });

      this.isOpen.set(false);
      this.selectedOrgId.set(null);
      this.requestNote.set('');
      this.requestSent.emit();
      // Ideally show a toast here
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    } finally {
      this.submitting.set(false);
    }
  }
}
