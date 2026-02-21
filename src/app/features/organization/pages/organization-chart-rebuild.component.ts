import { Component, OnInit, inject, signal } from '@angular/core';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { OrganizationRebuildDataService } from '../data/organization-rebuild.data.service';
import { RebuildOrgChartNode } from '../data/organization-rebuild.models';

interface OrgChartRow {
  id: string;
  name: string;
  email: string;
  designationName: string;
  status: string;
  depth: number;
  directReportsCount: number;
}

@Component({
  selector: 'app-organization-chart-rebuild',
  standalone: true,
  imports: [OrganizationPageStateComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-6xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Organization Chart</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Live hierarchy from Convex employee relationships. Indentation reflects reporting depth.
          </p>
        </header>

        <app-organization-page-state
          [error]="error()"
          [isLoading]="isLoading()"
          [hasData]="rows().length > 0"
          loadingLabel="Loading organization chart..."
          emptyTitle="No chart data available"
          emptyMessage="No reporting relationships were found for this organization."
        />

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">
              Use this view to validate manager chains before approvals and role handoffs.
            </p>
            <button
              type="button"
              class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
              [disabled]="isLoading()"
              (click)="refresh()"
            >
              Refresh
            </button>
          </div>
        </section>

        @if (rows().length > 0) {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="bg-stone-50 dark:bg-white/[0.03]">
                <tr>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Employee</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Email</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Designation</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Reports</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr class="border-t border-stone-100 dark:border-white/[0.03]">
                    <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">
                      <span [style.padding-left.px]="row.depth * 20">{{ row.name }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ row.email }}</td>
                    <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ row.designationName }}</td>
                    <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ row.directReportsCount }}</td>
                    <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ row.status }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
        }
      </div>
    </main>
  `
})
export class OrganizationChartRebuildComponent implements OnInit {
  private readonly data = inject(OrganizationRebuildDataService);

  readonly rows = signal<OrgChartRow[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const roots = await this.data.getOrganizationChart();
      this.rows.set(this.flatten(roots));
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load organization chart.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private flatten(nodes: RebuildOrgChartNode[], depth = 0): OrgChartRow[] {
    const rows: OrgChartRow[] = [];
    for (const node of nodes) {
      rows.push({
        id: node.id,
        name: `${node.firstName} ${node.lastName}`.trim(),
        email: node.email,
        designationName: node.designationName,
        status: node.status,
        depth,
        directReportsCount: node.directReports.length
      });
      rows.push(...this.flatten(node.directReports, depth + 1));
    }
    return rows;
  }
}
