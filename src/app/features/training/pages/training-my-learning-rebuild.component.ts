import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeVariant, UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { TrainingEnrollmentStatus } from '../data/training-rebuild.models';
import { TrainingRebuildStore } from '../data/training-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-training-my-learning-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent],
  template: ''
})
export class TrainingMyLearningRebuildComponent implements OnInit {
  private readonly store = inject(TrainingRebuildStore);
  private readonly router = inject(Router);

  readonly myLearning = this.store.myLearning;
  readonly myLearningLoading = this.store.myLearningLoading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadMyLearning();
  }

  browseCatalog(): void {
    void this.router.navigate(['/training/catalog']);
  }

  enrollmentStatusVariant(status: TrainingEnrollmentStatus): BadgeVariant {
    if (status === 'completed') {
      return 'success';
    }
    if (status === 'failed') {
      return 'danger';
    }
    if (status === 'enrolled') {
      return 'info';
    }
    return 'neutral';
  }
}
