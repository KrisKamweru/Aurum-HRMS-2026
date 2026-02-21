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
    expect(paths).toContain('auth/login');
  });

  it('keeps wildcard fallback to dashboard', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard?.redirectTo).toBe('dashboard');
  });
});
