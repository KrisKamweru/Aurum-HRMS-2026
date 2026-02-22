import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { TrainingRebuildStore } from '../data/training-rebuild.store';
import { TrainingMyLearningRebuildComponent } from './training-my-learning-rebuild.component';

describe('TrainingMyLearningRebuildComponent', () => {
  let fixture: ComponentFixture<TrainingMyLearningRebuildComponent>;
  let component: TrainingMyLearningRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<TrainingRebuildStore, 'myLearning' | 'myLearningLoading' | 'error' | 'loadMyLearning'>;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      myLearning: signal([
        {
          id: 'enr-1',
          courseId: 'course-1',
          courseTitle: 'Leadership Essentials',
          status: 'enrolled',
          progress: 20,
          enrollmentDate: '2026-02-21T00:00:00.000Z'
        }
      ]).asReadonly(),
      myLearningLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadMyLearning: vi.fn(async () => {})
    };

    await TestBed.configureTestingModule({
      imports: [TrainingMyLearningRebuildComponent],
      providers: [
        { provide: TrainingRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingMyLearningRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads learning enrollments on init', () => {
    expect(storeMock.loadMyLearning).toHaveBeenCalledTimes(1);
  });

  it('navigates to catalog when requested', () => {
    component.browseCatalog();
    expect(navigate).toHaveBeenCalledWith(['/training/catalog']);
  });

  it('maps enrollment statuses to badge variants', () => {
    expect(component.enrollmentStatusVariant('enrolled')).toBe('info');
    expect(component.enrollmentStatusVariant('completed')).toBe('success');
    expect(component.enrollmentStatusVariant('failed')).toBe('danger');
    expect(component.enrollmentStatusVariant('dropped')).toBe('neutral');
  });
});
