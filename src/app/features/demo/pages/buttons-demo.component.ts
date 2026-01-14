import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiAvatarComponent } from '../../../shared/components/ui-avatar/ui-avatar.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-buttons-demo',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiBadgeComponent, UiAvatarComponent, UiCardComponent],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Buttons</h2>
        <ui-card>
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Variants</h3>
              <div class="flex flex-wrap gap-4">
                <ui-button variant="primary">Primary</ui-button>
                <ui-button variant="secondary">Secondary</ui-button>
                <ui-button variant="outline">Outline</ui-button>
                <ui-button variant="ghost">Ghost</ui-button>
                <ui-button variant="danger">Danger</ui-button>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Sizes</h3>
              <div class="flex flex-wrap items-center gap-4">
                <ui-button size="sm">Small</ui-button>
                <ui-button size="md">Medium</ui-button>
                <ui-button size="lg">Large</ui-button>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">States</h3>
              <div class="flex flex-wrap gap-4">
                <ui-button [disabled]="true">Disabled</ui-button>
                <ui-button [loading]="true">Loading</ui-button>
              </div>
            </div>
          </div>
        </ui-card>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Badges</h2>
        <ui-card>
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Variants</h3>
              <div class="flex flex-wrap gap-4">
                <ui-badge variant="success">Success</ui-badge>
                <ui-badge variant="warning">Warning</ui-badge>
                <ui-badge variant="danger">Danger</ui-badge>
                <ui-badge variant="info">Info</ui-badge>
                <ui-badge variant="neutral">Neutral</ui-badge>
                <ui-badge variant="primary">Primary</ui-badge>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Shapes</h3>
              <div class="flex flex-wrap gap-4">
                <ui-badge variant="primary">Rounded (Default)</ui-badge>
                <ui-badge variant="primary" [rounded]="true">Pill</ui-badge>
              </div>
            </div>
          </div>
        </ui-card>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Avatars</h2>
        <ui-card>
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Sizes</h3>
              <div class="flex items-center gap-4">
                <ui-avatar size="xs" name="Alex Doe"></ui-avatar>
                <ui-avatar size="sm" name="Alex Doe"></ui-avatar>
                <ui-avatar size="md" name="Alex Doe"></ui-avatar>
                <ui-avatar size="lg" name="Alex Doe"></ui-avatar>
                <ui-avatar size="xl" name="Alex Doe"></ui-avatar>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Status</h3>
              <div class="flex items-center gap-4">
                <ui-avatar size="md" name="Online User" status="online"></ui-avatar>
                <ui-avatar size="md" name="Offline User" status="offline"></ui-avatar>
                <ui-avatar size="md" name="Busy User" status="busy"></ui-avatar>
                <ui-avatar size="md" name="Away User" status="away"></ui-avatar>
              </div>
            </div>
          </div>
        </ui-card>
      </div>
    </div>
  `
})
export class ButtonsDemoComponent {}
