import { routes } from './app.routes';

describe('app routes', () => {
  it('keeps key legacy paths mapped in rebuild shell', () => {
    const paths = routes.map((route) => route.path);
    expect(paths).toContain('dashboard');
    expect(paths).toContain('employees/:id');
    expect(paths).toContain('payroll/slip/:id');
    expect(paths).toContain('reports/tax');
    expect(paths).toContain('organization/departments');
    expect(paths).toContain('organization/designations');
    expect(paths).toContain('organization/locations');
    expect(paths).toContain('organization/user-linking');
    expect(paths).toContain('organization/chart');
    expect(paths).toContain('organization/settings');
    expect(paths).toContain('leave-requests');
    expect(paths).toContain('attendance');
    expect(paths).toContain('attendance/team');
    expect(paths).toContain('core-hr');
    expect(paths).toContain('core-hr/promotions');
    expect(paths).toContain('core-hr/transfers');
    expect(paths).toContain('core-hr/awards');
    expect(paths).toContain('core-hr/warnings');
    expect(paths).toContain('core-hr/resignations');
    expect(paths).toContain('core-hr/terminations');
    expect(paths).toContain('core-hr/complaints');
    expect(paths).toContain('core-hr/travel');
    expect(paths).toContain('auth/login');
  });

  it('keeps wildcard fallback to dashboard', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard?.redirectTo).toBe('dashboard');
  });

  it('maps employee routes to rebuilt components with guard contracts', () => {
    const employeeList = routes.find((route) => route.path === 'employees');
    const employeeDetail = routes.find((route) => route.path === 'employees/:id');

    expect(employeeList?.data?.['title']).toBe('Employees');
    expect(employeeDetail?.data?.['title']).toBe('Employee Detail');
    expect(employeeList?.canActivate?.length).toBeGreaterThan(0);
    expect(employeeDetail?.canActivate?.length).toBeGreaterThan(0);
    expect(employeeList?.loadComponent).toBeTypeOf('function');
    expect(employeeDetail?.loadComponent).toBeTypeOf('function');
  });

  it('maps leave requests route to rebuilt component with auth guard contract', () => {
    const leaveRequests = routes.find((route) => route.path === 'leave-requests');

    expect(leaveRequests?.data?.['title']).toBe('Leave Requests');
    expect(leaveRequests?.canActivate?.length).toBeGreaterThan(0);
    expect(leaveRequests?.loadComponent).toBeTypeOf('function');
  });

  it('maps attendance routes to rebuilt components with guard contracts', () => {
    const attendance = routes.find((route) => route.path === 'attendance');
    const attendanceTeam = routes.find((route) => route.path === 'attendance/team');

    expect(attendance?.data?.['title']).toBe('Attendance');
    expect(attendanceTeam?.data?.['title']).toBe('Team Attendance');
    expect(attendance?.canActivate?.length).toBeGreaterThan(0);
    expect(attendanceTeam?.canActivate?.length).toBeGreaterThan(0);
    expect(attendance?.loadComponent).toBeTypeOf('function');
    expect(attendanceTeam?.loadComponent).toBeTypeOf('function');
  });

  it('maps payroll routes to rebuilt components with guard contracts', () => {
    const payroll = routes.find((route) => route.path === 'payroll');
    const payrollRun = routes.find((route) => route.path === 'payroll/:id');
    const payslip = routes.find((route) => route.path === 'payroll/slip/:id');

    expect(payroll?.data?.['title']).toBe('Payroll');
    expect(payrollRun?.data?.['title']).toBe('Payroll Run');
    expect(payslip?.data?.['title']).toBe('Payslip View');
    expect(payroll?.canActivate?.length).toBeGreaterThan(0);
    expect(payrollRun?.canActivate?.length).toBeGreaterThan(0);
    expect(payslip?.canActivate?.length).toBeGreaterThan(0);
    expect(payroll?.loadComponent).toBeTypeOf('function');
    expect(payrollRun?.loadComponent).toBeTypeOf('function');
    expect(payslip?.loadComponent).toBeTypeOf('function');
  });

  it('maps core-hr routes to rebuilt components with route data contracts', () => {
    const coreHr = routes.find((route) => route.path === 'core-hr');
    const promotions = routes.find((route) => route.path === 'core-hr/promotions');
    const transfers = routes.find((route) => route.path === 'core-hr/transfers');
    const awards = routes.find((route) => route.path === 'core-hr/awards');
    const warnings = routes.find((route) => route.path === 'core-hr/warnings');
    const resignations = routes.find((route) => route.path === 'core-hr/resignations');
    const terminations = routes.find((route) => route.path === 'core-hr/terminations');
    const complaints = routes.find((route) => route.path === 'core-hr/complaints');
    const travel = routes.find((route) => route.path === 'core-hr/travel');

    expect(coreHr?.data?.['title']).toBe('Core HR');
    expect(promotions?.data?.['recordType']).toBe('promotions');
    expect(transfers?.data?.['recordType']).toBe('transfers');
    expect(awards?.data?.['recordType']).toBe('awards');
    expect(warnings?.data?.['recordType']).toBe('warnings');
    expect(resignations?.data?.['recordType']).toBe('resignations');
    expect(terminations?.data?.['recordType']).toBe('terminations');
    expect(complaints?.data?.['recordType']).toBe('complaints');
    expect(travel?.data?.['recordType']).toBe('travel');
    expect(coreHr?.canActivate?.length).toBeGreaterThan(0);
    expect(promotions?.loadComponent).toBeTypeOf('function');
    expect(travel?.loadComponent).toBeTypeOf('function');
  });

  it('maps recruitment routes to rebuilt components with guard contracts', () => {
    const recruitment = routes.find((route) => route.path === 'recruitment');
    const jobs = routes.find((route) => route.path === 'recruitment/jobs');
    const newJob = routes.find((route) => route.path === 'recruitment/jobs/new');
    const detail = routes.find((route) => route.path === 'recruitment/jobs/:id');
    const edit = routes.find((route) => route.path === 'recruitment/jobs/:id/edit');
    const board = routes.find((route) => route.path === 'recruitment/board');

    expect(recruitment?.data?.['title']).toBe('Recruitment');
    expect(jobs?.data?.['title']).toBe('Recruitment Jobs');
    expect(newJob?.data?.['title']).toBe('Create Job');
    expect(detail?.data?.['title']).toBe('Job Detail');
    expect(edit?.data?.['title']).toBe('Edit Job');
    expect(board?.data?.['title']).toBe('Candidate Board');
    expect(recruitment?.canActivate?.length).toBeGreaterThan(0);
    expect(jobs?.loadComponent).toBeTypeOf('function');
    expect(newJob?.loadComponent).toBeTypeOf('function');
    expect(detail?.loadComponent).toBeTypeOf('function');
    expect(board?.loadComponent).toBeTypeOf('function');
  });
});
