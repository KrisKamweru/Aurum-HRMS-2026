import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAvatarComponent } from '../../../shared/components/ui-avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-buttons-demo',
  imports: [UiAvatarComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent],
  template: `
    <div class="space-y-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Buttons & Elements</h1>
        <p class="text-text-muted mt-1">Core interactive components in all variants and sizes.</p>
      </div>

      <!-- Button Variants -->
      <ui-card variant="glass" title="Button Variants" subtitle="All available button styles">
        <div class="flex flex-wrap gap-4 mt-4">
          <ui-button variant="primary">Primary</ui-button>
          <ui-button variant="secondary">Secondary</ui-button>
          <ui-button variant="danger">Danger</ui-button>
          <ui-button variant="ghost">Ghost</ui-button>
          <ui-button variant="outline">Outline</ui-button>
          <ui-button variant="gold">Gold</ui-button>
        </div>
      </ui-card>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <!-- Button Sizes -->
        <ui-card variant="glass" title="Sizes" subtitle="sm, md, lg">
          <div class="flex flex-wrap items-center gap-4 mt-4">
            <ui-button variant="primary" size="sm">Small</ui-button>
            <ui-button variant="primary" size="md">Medium</ui-button>
            <ui-button variant="primary" size="lg">Large</ui-button>
          </div>
          <div class="flex flex-wrap items-center gap-4 mt-4">
            <ui-button variant="secondary" size="sm">Small</ui-button>
            <ui-button variant="secondary" size="md">Medium</ui-button>
            <ui-button variant="secondary" size="lg">Large</ui-button>
          </div>
        </ui-card>

        <!-- With Icons -->
        <ui-card variant="glass" title="With Icons" subtitle="Leading icon via input">
          <div class="flex flex-wrap gap-4 mt-4">
            <ui-button variant="primary" icon="inbox">Inbox</ui-button>
            <ui-button variant="secondary" icon="check">Approve</ui-button>
            <ui-button variant="danger" icon="x-mark">Delete</ui-button>
            <ui-button variant="outline" icon="selector">Options</ui-button>
          </div>
        </ui-card>

        <!-- States -->
        <ui-card variant="glass" title="States" subtitle="Disabled and loading">
          <div class="flex flex-wrap gap-4 mt-4">
            <ui-button variant="primary" [disabled]="true">Disabled</ui-button>
            <ui-button variant="secondary" [disabled]="true">Disabled</ui-button>
            <ui-button variant="primary" [loading]="true">Loading...</ui-button>
            <ui-button variant="gold" [loading]="true">Saving</ui-button>
          </div>
        </ui-card>

        <!-- Full Width -->
        <ui-card variant="glass" title="Full Width" subtitle="Block-level buttons">
          <div class="flex flex-col gap-3 mt-4">
            <ui-button variant="primary" [fullWidth]="true" icon="check">Full Width Primary</ui-button>
            <ui-button variant="outline" [fullWidth]="true">Full Width Outline</ui-button>
          </div>
        </ui-card>
      </div>

      <!-- Badges -->
      <ui-card variant="glass" title="Badges" subtitle="Status indicators in all variants">
        <div class="flex flex-wrap gap-3 mt-4">
          <ui-badge variant="success">Success</ui-badge>
          <ui-badge variant="warning">Warning</ui-badge>
          <ui-badge variant="danger">Danger</ui-badge>
          <ui-badge variant="info">Info</ui-badge>
          <ui-badge variant="neutral">Neutral</ui-badge>
          <ui-badge variant="primary">Primary</ui-badge>
        </div>
        <div class="flex flex-wrap gap-3 mt-4">
          <ui-badge variant="success" size="sm">Small</ui-badge>
          <ui-badge variant="warning" size="sm">Small</ui-badge>
          <ui-badge variant="success" [rounded]="false">Square</ui-badge>
          <ui-badge variant="danger" [rounded]="false">Square</ui-badge>
        </div>
      </ui-card>

      <!-- Avatars -->
      <ui-card variant="glass" title="Avatars" subtitle="User representations in all sizes and states">
        <div class="flex flex-wrap items-end gap-4 mt-4">
          <ui-avatar name="Alice Brown" size="xs"></ui-avatar>
          <ui-avatar name="Bob Carter" size="sm"></ui-avatar>
          <ui-avatar name="Carol Davis" size="md"></ui-avatar>
          <ui-avatar name="Dan Evans" size="lg"></ui-avatar>
          <ui-avatar name="Eve Foster" size="xl"></ui-avatar>
        </div>
        <div class="flex flex-wrap items-end gap-4 mt-4">
          <ui-avatar name="Frank Green" status="online"></ui-avatar>
          <ui-avatar name="Grace Hill" status="busy"></ui-avatar>
          <ui-avatar name="Harry Ives" status="away"></ui-avatar>
          <ui-avatar name="Iris James" status="offline"></ui-avatar>
        </div>
      </ui-card>
    </div>
  `
})
export class ButtonsDemoComponent {}
