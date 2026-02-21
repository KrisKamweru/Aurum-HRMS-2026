import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OrganizationRebuildDataService } from '../data/organization-rebuild.data.service';
import { RebuildOrgChartNode } from '../data/organization-rebuild.models';
import { OrganizationChartRebuildComponent } from './organization-chart-rebuild.component';

describe('OrganizationChartRebuildComponent', () => {
  let fixture: ComponentFixture<OrganizationChartRebuildComponent>;
  let component: OrganizationChartRebuildComponent;
  let chartNodes: RebuildOrgChartNode[];
  const getOrganizationChart = vi.fn<() => Promise<RebuildOrgChartNode[]>>();

  beforeEach(async () => {
    chartNodes = [
      {
        id: 'emp-1',
        firstName: 'Amina',
        lastName: 'Hassan',
        email: 'amina.hassan@aurum.dev',
        designationName: 'Head of HR',
        status: 'active',
        directReports: [
          {
            id: 'emp-2',
            firstName: 'James',
            lastName: 'Doe',
            email: 'james.doe@aurum.dev',
            designationName: 'HR Specialist',
            status: 'active',
            managerId: 'emp-1',
            directReports: []
          }
        ]
      }
    ];
    getOrganizationChart.mockReset();
    getOrganizationChart.mockImplementation(async () => chartNodes);

    await TestBed.configureTestingModule({
      imports: [OrganizationChartRebuildComponent],
      providers: [{ provide: OrganizationRebuildDataService, useValue: { getOrganizationChart } }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationChartRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads organization chart rows on init', () => {
    expect(getOrganizationChart).toHaveBeenCalledTimes(1);
    expect(component.rows().length).toBe(2);
    expect(component.rows()[0].name).toBe('Amina Hassan');
    expect(component.rows()[0].depth).toBe(0);
    expect(component.rows()[1].depth).toBe(1);
  });

  it('sets error state when data load fails', async () => {
    getOrganizationChart.mockRejectedValueOnce(new Error('Chart unavailable'));

    await component.refresh();

    expect(component.error()).toBe('Chart unavailable');
  });
});
