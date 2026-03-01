import { Component, TemplateRef, ViewChild, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-step',
  template: '<ng-template #content><ng-content></ng-content></ng-template>'
})
export class UiStepComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();

  @ViewChild('content', { static: true }) contentTemplate!: TemplateRef<unknown>;
}



