import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { CoreHrRebuildDataService } from './core-hr-rebuild.data.service';

describe('CoreHrRebuildDataService', () => {
  let service: CoreHrRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        CoreHrRebuildDataService,
        {
          provide: ConvexClientService,
          useValue: {
            getHttpClient: () => ({
              query,
              mutation
            })
          }
        }
      ]
    });

    service = TestBed.inject(CoreHrRebuildDataService);
  });

  it('maps viewer, references, and records', async () => {
    query.mockResolvedValueOnce({ role: 'hr_manager', employeeId: 'emp-1' });
    query.mockResolvedValueOnce([
      {
        _id: 'emp-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@aurum.test',
        status: 'active',
        departmentId: 'dept-1',
        designationId: 'des-1',
        locationId: 'loc-1',
        department: 'Finance',
        position: 'Analyst',
        location: 'Nairobi'
      }
    ]);
    query.mockResolvedValueOnce([{ _id: 'dept-1', name: 'Finance' }]);
    query.mockResolvedValueOnce([{ _id: 'des-1', title: 'Analyst' }]);
    query.mockResolvedValueOnce([{ _id: 'loc-1', name: 'Nairobi HQ' }]);
    query.mockResolvedValueOnce([
      {
        _id: 'promotion-1',
        employeeId: 'emp-1',
        fromDesignationId: 'des-1',
        toDesignationId: 'des-2',
        promotionDate: '2026-02-01',
        salaryIncrement: 1000
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'res-1',
        employeeId: 'emp-1',
        noticeDate: '2026-02-01',
        lastWorkingDay: '2026-03-01',
        reason: 'Relocation',
        status: 'pending'
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'travel-1',
        employeeId: 'emp-1',
        destination: 'Mombasa',
        startDate: '2026-02-10',
        endDate: '2026-02-12',
        purpose: 'Client meeting',
        budget: 2000,
        status: 'approved'
      }
    ]);

    const viewer = await service.getViewerContext();
    const employees = await service.listEmployees();
    const departments = await service.listDepartments();
    const designations = await service.listDesignations();
    const locations = await service.listLocations();
    const promotions = await service.listPromotions();
    const resignations = await service.listResignations();
    const travel = await service.listTravelRequests();

    expect(viewer).toEqual({ role: 'hr_manager', employeeId: 'emp-1' });
    expect(employees[0]?.fullName).toBe('Jane Doe');
    expect(departments[0]?.label).toBe('Finance');
    expect(designations[0]?.label).toBe('Analyst');
    expect(locations[0]?.label).toBe('Nairobi HQ');
    expect(promotions[0]?.id).toBe('promotion-1');
    expect(resignations[0]?.status).toBe('pending');
    expect(travel[0]?.status).toBe('approved');
  });

  it('submits typed mutation payloads across core-hr operations', async () => {
    await service.createPromotion({
      employeeId: 'emp-1',
      fromDesignationId: 'des-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01',
      salaryIncrement: 1000,
      remarks: 'Top performer'
    });
    await service.createTransfer({
      employeeId: 'emp-1',
      fromDepartmentId: 'dept-1',
      toDepartmentId: 'dept-2',
      fromLocationId: 'loc-1',
      toLocationId: 'loc-2',
      transferDate: '2026-02-02',
      remarks: 'Business expansion'
    });
    await service.giveAward({
      employeeId: 'emp-1',
      title: 'Excellence',
      date: '2026-02-03',
      cashPrice: 500
    });
    await service.issueWarning({
      employeeId: 'emp-1',
      subject: 'Policy Breach',
      description: 'Repeated lateness',
      severity: 'medium',
      issueDate: '2026-02-04'
    });
    await service.submitResignation({
      employeeId: 'emp-1',
      noticeDate: '2026-02-05',
      lastWorkingDay: '2026-03-05',
      reason: 'Career change'
    });
    await service.updateResignationStatus('res-1', 'approved');
    await service.terminateEmployee({
      employeeId: 'emp-2',
      terminationDate: '2026-02-06',
      type: 'involuntary',
      reason: 'Gross misconduct',
      noticeGiven: false
    });
    await service.fileComplaint({
      complainantId: 'emp-3',
      accusedId: 'emp-4',
      subject: 'Harassment',
      description: 'Escalated to HR',
      date: '2026-02-07'
    });
    await service.createTravelRequest({
      employeeId: 'emp-1',
      destination: 'Kampala',
      startDate: '2026-02-08',
      endDate: '2026-02-09',
      purpose: 'Workshop',
      budget: 800
    });

    expect(mutation).toHaveBeenNthCalledWith(1, api.core_hr.createPromotion, {
      employeeId: 'emp-1',
      fromDesignationId: 'des-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01',
      salaryIncrement: 1000,
      remarks: 'Top performer'
    });
    expect(mutation).toHaveBeenNthCalledWith(6, api.core_hr.updateResignationStatus, {
      resignationId: 'res-1',
      status: 'approved'
    });
    expect(mutation).toHaveBeenNthCalledWith(9, api.core_hr.createTravelRequest, {
      employeeId: 'emp-1',
      destination: 'Kampala',
      startDate: '2026-02-08',
      endDate: '2026-02-09',
      purpose: 'Workshop',
      budget: 800
    });
  });
});
