import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-glassmorphism-demo',
  imports: [UiCardComponent, UiButtonComponent, UiBadgeComponent],
  template: `
    <div class="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Glassmorphism Elements</h1>
        <p class="text-slate-500 font-medium mt-1">Showcasing the frosted clarity design language components.</p>
      </div>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-200 ml-1">Card Variants</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ui-card variant="default" title="Default Interface">
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">The standard glass-surface with subtle noise and borders.</p>
          </ui-card>
          <ui-card variant="premium" title="Premium Surface">
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">Added drop shadows for elements that require more visual elevation.</p>
          </ui-card>
          <ui-card variant="glass" title="Interactive Glass">
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">Increases opacity and blur on hover, providing tactile feedback.</p>
          </ui-card>
          <ui-card variant="outlined" title="Outlined Container">
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">Transparent background with glass borders for grouping content.</p>
          </ui-card>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-200 ml-1">Action Buttons</h2>
        <ui-card variant="glass">
          <div class="flex flex-wrap gap-4 items-center">
            <ui-button variant="primary">Primary Action</ui-button>
            <ui-button variant="secondary">Secondary Glass</ui-button>
            <ui-button variant="outline">Outlined Style</ui-button>
            <ui-button variant="ghost">Ghost Button</ui-button>
            <ui-button variant="danger">Destructive</ui-button>
          </div>
          <div class="mt-8 flex flex-wrap gap-4 items-center pt-8 border-t border-black/5 dark:border-white/5">
            <ui-button variant="primary" icon="inbox">With Icon</ui-button>
            <ui-button variant="secondary" [loading]="true">Processing</ui-button>
            <ui-button variant="primary" [disabled]="true">Disabled State</ui-button>
          </div>
        </ui-card>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-200 ml-1">Status Badges</h2>
        <div class="flex gap-4">
          <ui-badge variant="neutral">Neutral State</ui-badge>
          <ui-badge variant="primary">Primary Focus</ui-badge>
          <ui-badge variant="success">Completed</ui-badge>
          <ui-badge variant="warning">Attention</ui-badge>
          <ui-badge variant="danger">Critical Error</ui-badge>
          <ui-badge variant="info">Information</ui-badge>
        </div>
      </section>
    </div>
  `
})
export class GlassmorphismDemoComponent {}
