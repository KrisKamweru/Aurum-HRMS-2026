import { DEMO_ROUTES } from './demo.routes';

describe('DEMO_ROUTES', () => {
  it('defines the expected child demo routes', () => {
    const root = DEMO_ROUTES[0]!;
    const children = root.children ?? [];
    const childPaths = children.map((child) => child.path);

    expect(root.loadComponent).toBeTypeOf('function');
    expect(childPaths).toContain('');
    expect(childPaths).toContain('buttons');
    expect(childPaths).toContain('forms');
    expect(childPaths).toContain('tables');
    expect(childPaths).toContain('modals');
    expect(childPaths).toContain('date-picker');
  });

  it('redirects demo root to buttons', () => {
    const root = DEMO_ROUTES[0]!;
    const redirect = (root.children ?? []).find((child) => child.path === '');

    expect(redirect?.redirectTo).toBe('buttons');
    expect(redirect?.pathMatch).toBe('full');
  });
});
