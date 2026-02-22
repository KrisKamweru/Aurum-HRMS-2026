import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAvatarComponent } from '../../../shared/components/ui-avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-buttons-demo',
  imports: [UiAvatarComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">Demo</p>
        <h2 class="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Buttons, Badges & Avatars</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Visual and interaction primitives used across rebuilt workflow pages.
        </p>
      </header>

      <ui-grid columns="1fr" gap="1rem">
        <ui-card variant="glass" title="Buttons" subtitle="Variants, sizes, loading, and disabled states">
          <div class="space-y-5">
            <div class="flex flex-wrap gap-3">
              <ui-button>Primary</ui-button>
              <ui-button variant="secondary">Secondary</ui-button>
              <ui-button variant="outline">Outline</ui-button>
              <ui-button variant="ghost">Ghost</ui-button>
              <ui-button variant="danger">Danger</ui-button>
              <ui-button variant="gold">Gold</ui-button>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <ui-button size="sm">Small</ui-button>
              <ui-button size="md">Medium</ui-button>
              <ui-button size="lg">Large</ui-button>
              <ui-button [loading]="true">Loading</ui-button>
              <ui-button [disabled]="true">Disabled</ui-button>
            </div>
          </div>
        </ui-card>

        <ui-grid columns="repeat(auto-fit,minmax(280px,1fr))" gap="1rem">
          <ui-card variant="default" title="Badges" subtitle="Status and semantic tokens">
            <div class="flex flex-wrap gap-2">
              <ui-badge variant="primary">Primary</ui-badge>
              <ui-badge variant="success">Success</ui-badge>
              <ui-badge variant="warning">Warning</ui-badge>
              <ui-badge variant="danger">Danger</ui-badge>
              <ui-badge variant="info">Info</ui-badge>
              <ui-badge variant="neutral">Neutral</ui-badge>
              <ui-badge variant="primary" [rounded]="true">Pill Badge</ui-badge>
            </div>
          </ui-card>

          <ui-card variant="default" title="Avatars" subtitle="Name fallback + status indicators">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-3">
                <ui-avatar size="xs" name="Alex Doe"></ui-avatar>
                <ui-avatar size="sm" name="Alex Doe"></ui-avatar>
                <ui-avatar size="md" name="Alex Doe"></ui-avatar>
                <ui-avatar size="lg" name="Alex Doe"></ui-avatar>
                <ui-avatar size="xl" name="Alex Doe"></ui-avatar>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <ui-avatar size="md" name="Online User" status="online"></ui-avatar>
                <ui-avatar size="md" name="Busy User" status="busy"></ui-avatar>
                <ui-avatar size="md" name="Away User" status="away"></ui-avatar>
                <ui-avatar size="md" name="Offline User" status="offline"></ui-avatar>
              </div>
            </div>
          </ui-card>
        </ui-grid>

        <ui-card variant="outlined" padding="none">
          <ui-grid-tile title="Quick Usage Notes" variant="flat" minHeight="auto">
            <div class="space-y-2 p-5 text-sm text-stone-600 dark:text-stone-400">
              <p><span class="font-semibold text-stone-800 dark:text-stone-200">Buttons:</span> use ui-button variants instead of custom per-page styles.</p>
              <p><span class="font-semibold text-stone-800 dark:text-stone-200">Badges:</span> semantic variants map to consistent colors in light/dark modes.</p>
              <p><span class="font-semibold text-stone-800 dark:text-stone-200">Avatars:</span> initials fallback is built in; no manual string slicing needed.</p>
            </div>
          </ui-grid-tile>
        </ui-card>
      </ui-grid>
    </div>
  `
})
export class ButtonsDemoComponent {}
