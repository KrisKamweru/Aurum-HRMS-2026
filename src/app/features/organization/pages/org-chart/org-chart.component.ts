import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { api } from '../../../../../../convex/_generated/api';
import { OrgNodeComponent } from './org-node.component';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, OrgNodeComponent, UiGridComponent, UiGridTileComponent],
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

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Organization Chart" variant="compact">
            <div class="tile-body min-h-[600px] flex items-center justify-center">
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
                <div class="org-chart-container">
                  <div class="flex gap-16">
                    @for (rootNode of data(); track rootNode._id) {
                      <app-org-node [node]="rootNode"></app-org-node>
                    }
                  </div>
                </div>
              }
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>
  `,
  styles: [`
    .org-chart-container {
      max-width: 100%;
      overflow-x: auto;
      overflow-y: visible;
      padding-bottom: 1rem;
      -webkit-overflow-scrolling: touch;
    }

    .org-chart-container::-webkit-scrollbar {
      height: 8px;
    }

    .org-chart-container::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 4px;
    }

    .org-chart-container::-webkit-scrollbar-thumb {
      background: #d6d3d1;
      border-radius: 4px;
    }

    .org-chart-container::-webkit-scrollbar-thumb:hover {
      background: #a8a29e;
    }

    :host-context(.dark) .org-chart-container::-webkit-scrollbar-thumb {
      background: #57534e;
    }

    :host-context(.dark) .org-chart-container::-webkit-scrollbar-thumb:hover {
      background: #78716c;
    }
  `]
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
