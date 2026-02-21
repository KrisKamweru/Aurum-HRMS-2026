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
});
