import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { UiStepperComponent } from '../../../shared/components/ui-stepper/ui-stepper.component';
import { OrganizationSetupRebuildStore } from '../data/organization-setup-rebuild.store';
import { CreateOrganizationRebuildComponent } from './create-organization-rebuild.component';

describe('CreateOrganizationRebuildComponent', () => {
  let fixture: ComponentFixture<CreateOrganizationRebuildComponent>;
  let component: CreateOrganizationRebuildComponent;
  let storeMock: Pick<OrganizationSetupRebuildStore, 'isSaving' | 'error' | 'createOrganization' | 'clearError'>;
  let authMock: Pick<AuthSessionService, 'user' | 'refreshUser'>;
  let router: Router;

  beforeEach(async () => {
    storeMock = {
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      createOrganization: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    authMock = {
      user: signal({ id: 'u-1', name: 'Ada Lovelace', role: 'pending', email: 'ada@aurum.dev' }).asReadonly(),
      refreshUser: vi.fn(async () => {})
    };

    await TestBed.configureTestingModule({
      imports: [CreateOrganizationRebuildComponent],
      providers: [
        provideRouter([]),
        { provide: OrganizationSetupRebuildStore, useValue: storeMock },
        { provide: AuthSessionService, useValue: authMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CreateOrganizationRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('prefills admin and domain from session user', () => {
    expect(component.wizardForm.controls.adminEmployee.controls.firstName.value).toBe('Ada');
    expect(component.wizardForm.controls.adminEmployee.controls.lastName.value).toBe('Lovelace');
    expect(component.wizardForm.controls.organization.controls.domain.value).toBe('aurum.dev');
    expect(component.authEmail()).toBe('ada@aurum.dev');
  });

  it('manages repeaters and preserves a minimum row', () => {
    component.addDepartment();
    component.addDesignation();

    expect(component.departmentsArray.length).toBe(2);
    expect(component.designationsArray.length).toBe(2);

    component.removeDepartment(0);
    component.removeDepartment(0);
    component.removeDesignation(0);
    component.removeDesignation(0);

    expect(component.departmentsArray.length).toBe(1);
    expect(component.designationsArray.length).toBe(1);
  });

  it('does not advance when current step is invalid', () => {
    const stepperStub = { next: vi.fn(), previous: vi.fn() } as unknown as UiStepperComponent;
    (component as unknown as { stepper?: UiStepperComponent }).stepper = stepperStub;

    component.nextStep();

    expect((stepperStub.next as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    expect(component.wizardForm.controls.organization.controls.name.touched).toBe(true);
  });

  it('submits valid wizard payload and redirects on success', async () => {
    component.wizardForm.controls.organization.setValue({ name: 'Aurum', domain: 'aurum.dev' });
    component.departmentsArray.at(0).setValue({ name: 'Engineering', code: 'ENG', description: '' });
    component.designationsArray.at(0).setValue({ title: 'Engineer', code: 'EN1', level: 1, description: '' });
    component.wizardForm.controls.adminEmployee.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      departmentIndex: 0,
      designationIndex: 0
    });
    component.onStepChange(3);

    await component.submit();

    expect(storeMock.clearError).toHaveBeenCalledTimes(1);
    expect(storeMock.createOrganization).toHaveBeenCalledWith({
      organization: { name: 'Aurum', domain: 'aurum.dev' },
      departments: [{ name: 'Engineering', code: 'ENG', description: undefined }],
      designations: [{ title: 'Engineer', code: 'EN1', level: 1, description: undefined }],
      adminEmployee: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: undefined,
        departmentIndex: 0,
        designationIndex: 0
      }
    });
    expect(authMock.refreshUser).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('stops redirect when create fails', async () => {
    (storeMock.createOrganization as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    component.wizardForm.controls.organization.setValue({ name: 'Aurum', domain: '' });
    component.departmentsArray.at(0).setValue({ name: 'Engineering', code: 'ENG', description: '' });
    component.designationsArray.at(0).setValue({ title: 'Engineer', code: 'EN1', level: null, description: '' });
    component.wizardForm.controls.adminEmployee.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      departmentIndex: null,
      designationIndex: null
    });
    component.onStepChange(3);

    await component.submit();

    expect(authMock.refreshUser).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
