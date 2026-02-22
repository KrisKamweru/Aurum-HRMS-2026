import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-chart-rebuild',
  imports: [OrganizationPageStateComponent],
  template: ''
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


