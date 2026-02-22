import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-placeholder-page',
  template: ''
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((data) => (typeof data['title'] === 'string' ? data['title'] : 'Rebuild Placeholder'))),
    { initialValue: 'Rebuild Placeholder' }
  );

  readonly routePath = toSignal(
    this.route.data.pipe(
      map(() => (typeof this.route.snapshot.routeConfig?.path === 'string' ? this.route.snapshot.routeConfig.path : '/'))
    ),
    { initialValue: '/' }
  );
}


