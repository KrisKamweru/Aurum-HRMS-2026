import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard.component';
import { AuthService } from '../../core/auth/auth.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { EmployeeDashboardComponent } from './employee-dashboard.component';

// Mock child components
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: '<div>Admin Dashboard</div>'
})
class MockAdminDashboardComponent {}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  template: '<div>Employee Dashboard</div>'
})
class MockEmployeeDashboardComponent {}

describe('DashboardComponent', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(signal(false))
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .overrideComponent(Dashboard, {
      remove: { imports: [AdminDashboardComponent, EmployeeDashboardComponent] },
      add: { imports: [MockAdminDashboardComponent, MockEmployeeDashboardComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show employee dashboard by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Since hasRole returns signal(false) by default
    expect(compiled.querySelector('app-employee-dashboard')).toBeTruthy();
    expect(compiled.querySelector('app-admin-dashboard')).toBeFalsy();
  });

  it('should show admin dashboard when user has manage permissions', () => {
    // We need to re-create the component because the signal in the component is initialized in the property declaration
    // changing the spy return value after component creation won't affect the `canManage` property if it's already computed/assigned.
    // However, Dashboard.component.ts uses `canManage = this.authService.hasRole(...)`.
    // If hasRole returns a computed signal, it might be reactive.
    // But usually typically we need to set up the spy before component creation.

    // Let's destroy previous fixture and create new one with different spy behavior
    TestBed.resetTestingModule();

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(signal(true))
    };

    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .overrideComponent(Dashboard, {
      remove: { imports: [AdminDashboardComponent, EmployeeDashboardComponent] },
      add: { imports: [MockAdminDashboardComponent, MockEmployeeDashboardComponent] }
    });
    // .compileComponents() is implicit in CLI/Vitest usually, but explicit is safer?
    // Actually resetTestingModule clears everything.

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-admin-dashboard')).toBeTruthy();
    expect(compiled.querySelector('app-employee-dashboard')).toBeFalsy();
  });
});
