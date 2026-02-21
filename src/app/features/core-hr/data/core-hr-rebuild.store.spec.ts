import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CoreHrRebuildDataService } from './core-hr-rebuild.data.service';
import { CoreHrRebuildStore } from './core-hr-rebuild.store';

describe('CoreHrRebuildStore', () => {
  let store: CoreHrRebuildStore;
  let dataService: {
    getViewerContext: ReturnType<typeof vi.fn>;
    listEmployees: ReturnType<typeof vi.fn>;
    listDepartments: ReturnType<typeof vi.fn>;
    listDesignations: ReturnType<typeof vi.fn>;
    listLocations: ReturnType<typeof vi.fn>;
    listPromotions: ReturnType<typeof vi.fn>;
    listTransfers: ReturnType<typeof vi.fn>;
    listAwards: ReturnType<typeof vi.fn>;
    listWarnings: ReturnType<typeof vi.fn>;
    listResignations: ReturnType<typeof vi.fn>;
    listTerminations: ReturnType<typeof vi.fn>;
    listComplaints: ReturnType<typeof vi.fn>;
    listTravelRequests: ReturnType<typeof vi.fn>;
    createPromotion: ReturnType<typeof vi.fn>;
    createTransfer: ReturnType<typeof vi.fn>;
    giveAward: ReturnType<typeof vi.fn>;
    issueWarning: ReturnType<typeof vi.fn>;
    submitResignation: ReturnType<typeof vi.fn>;
    updateResignationStatus: ReturnType<typeof vi.fn>;
    terminateEmployee: ReturnType<typeof vi.fn>;
    fileComplaint: ReturnType<typeof vi.fn>;
    createTravelRequest: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getViewerContext: vi.fn(async () => ({ role: 'hr_manager', employeeId: 'emp-1' })),
      listEmployees: vi.fn(async () => [
        {
          id: 'emp-1',
          fullName: 'Jane Doe',
          email: 'jane@aurum.test',
          status: 'active',
          departmentId: 'dept-1',
          designationId: 'des-1',
          locationId: 'loc-1'
        },
        {
          id: 'emp-2',
          fullName: 'Mark Stone',
          email: 'mark@aurum.test',
          status: 'active',
          departmentId: 'dept-2',
          designationId: 'des-2',
          locationId: 'loc-2'
        }
      ]),
      listDepartments: vi.fn(async () => [
        { id: 'dept-1', label: 'Finance' },
        { id: 'dept-2', label: 'Operations' }
      ]),
      listDesignations: vi.fn(async () => [
        { id: 'des-1', label: 'Analyst' },
        { id: 'des-2', label: 'Senior Analyst' }
      ]),
      listLocations: vi.fn(async () => [
        { id: 'loc-1', label: 'Nairobi HQ' },
        { id: 'loc-2', label: 'Mombasa Branch' }
      ]),
      listPromotions: vi.fn(async () => [
        {
          id: 'prom-1',
          employeeId: 'emp-1',
          fromDesignationId: 'des-1',
          toDesignationId: 'des-2',
          promotionDate: '2026-02-01',
          salaryIncrement: 1000,
          remarks: ''
        }
      ]),
      listTransfers: vi.fn(async () => []),
      listAwards: vi.fn(async () => []),
      listWarnings: vi.fn(async () => []),
      listResignations: vi.fn(async () => [
        {
          id: 'res-1',
          employeeId: 'emp-2',
          noticeDate: '2026-02-01',
          lastWorkingDay: '2026-03-01',
          reason: 'Relocation',
          status: 'pending'
        }
      ]),
      listTerminations: vi.fn(async () => []),
      listComplaints: vi.fn(async () => []),
      listTravelRequests: vi.fn(async () => []),
      createPromotion: vi.fn(async () => undefined),
      createTransfer: vi.fn(async () => undefined),
      giveAward: vi.fn(async () => undefined),
      issueWarning: vi.fn(async () => undefined),
      submitResignation: vi.fn(async () => undefined),
      updateResignationStatus: vi.fn(async () => undefined),
      terminateEmployee: vi.fn(async () => undefined),
      fileComplaint: vi.fn(async () => undefined),
      createTravelRequest: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: CoreHrRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(CoreHrRebuildStore);
  });

  it('loads core-hr overview and computes counters', async () => {
    await store.loadOverview();

    expect(store.canManage()).toBe(true);
    expect(store.recordCounts().promotions).toBe(1);
    expect(store.recordCounts().resignations).toBe(1);
    expect(store.pendingResignations()).toBe(1);
  });

  it('validates and submits promotions', async () => {
    await store.loadRecordType('promotions');

    const invalid = await store.submitRecord('promotions', {
      employeeId: 'emp-1',
      toDesignationId: 'des-1',
      promotionDate: '2026-02-01'
    });
    const valid = await store.submitRecord('promotions', {
      employeeId: 'emp-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01',
      salaryIncrement: 1200
    });

    expect(invalid).toBe(false);
    expect(valid).toBe(true);
    expect(dataService.createPromotion).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      fromDesignationId: 'des-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01',
      salaryIncrement: 1200,
      remarks: undefined
    });
  });

  it('validates travel date ranges before submit', async () => {
    await store.loadRecordType('travel');

    const invalid = await store.submitRecord('travel', {
      employeeId: 'emp-1',
      destination: 'Kampala',
      startDate: '2026-02-10',
      endDate: '2026-02-01',
      purpose: 'Workshop'
    });
    const valid = await store.submitRecord('travel', {
      employeeId: 'emp-1',
      destination: 'Kampala',
      startDate: '2026-02-10',
      endDate: '2026-02-12',
      purpose: 'Workshop',
      budget: '800'
    });

    expect(invalid).toBe(false);
    expect(valid).toBe(true);
    expect(dataService.createTravelRequest).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      destination: 'Kampala',
      startDate: '2026-02-10',
      endDate: '2026-02-12',
      purpose: 'Workshop',
      budget: 800
    });
  });

  it('reviews pending resignations', async () => {
    await store.loadRecordType('resignations');

    const success = await store.reviewResignation('res-1', 'approved');

    expect(success).toBe(true);
    expect(dataService.updateResignationStatus).toHaveBeenCalledWith('res-1', 'approved');
  });

  it('blocks resignation review for non-pending records', async () => {
    await store.loadRecordType('resignations');
    dataService.listResignations.mockResolvedValueOnce([
      {
        id: 'res-2',
        employeeId: 'emp-2',
        noticeDate: '2026-02-01',
        lastWorkingDay: '2026-03-01',
        reason: 'Relocation',
        status: 'approved'
      }
    ]);
    await store.loadRecordType('resignations');

    const success = await store.reviewResignation('res-2', 'rejected');

    expect(success).toBe(false);
    expect(store.error()).toContain('pending');
  });
});
