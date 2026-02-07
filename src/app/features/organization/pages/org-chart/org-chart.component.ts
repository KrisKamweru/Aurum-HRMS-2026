import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { api } from '../../../../../../convex/_generated/api';
import { OrgNodeComponent } from './org-node.component';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, OrgNodeComponent, UiCardComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Chain of Command</h1>
          <p class="mt-3 text-stone-500 dark:text-stone-400">Visual hierarchy of the organization structure.</p>
        </div>
        <div class="text-sm text-stone-500 dark:text-stone-400 italic">
          Tip: Scroll horizontally to view large teams
        </div>
      </div>

      <ui-card class="overflow-hidden min-h-[600px] bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl flex items-center justify-center p-8">
        @if (loading()) {
          <div class="flex flex-col items-center gap-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-700"></div>
            <p class="text-stone-500">Loading hierarchy...</p>
          </div>
        } @else if (data().length === 0) {
          <div class="text-center text-stone-500">
            <p>No organizational data found.</p>
          </div>
        } @else {
          <div class="overflow-auto w-full h-full flex justify-center pb-12">
            <div class="flex gap-16">
              @for (rootNode of data(); track rootNode._id) {
                <app-org-node [node]="rootNode"></app-org-node>
              }
            </div>
          </div>
        }
      </ui-card>
    </div>
  `
})
export class OrgChartComponent {
  private convex = inject(ConvexClientService);

  loading = signal(true);
  data = signal<any[]>([]);

  constructor() {
    this.loadData();
  }

  async loadData() {
    try {
      const result = await this.convex.getClient().query(api.employees.getOrgChart, {});
      this.data.set(result);
    } catch (error) {
      console.error('Failed to load org chart:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
