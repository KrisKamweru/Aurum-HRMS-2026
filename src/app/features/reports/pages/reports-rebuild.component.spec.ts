import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportsRebuildComponent } from './reports-rebuild.component';

describe('ReportsRebuildComponent', () => {
  let fixture: ComponentFixture<ReportsRebuildComponent>;
  let component: ReportsRebuildComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsRebuildComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the canonical report cards', () => {
    expect(component.reportCards.length).toBe(4);
    expect(component.reportCards.map((card) => card.route)).toEqual([
      '/reports/attendance',
      '/reports/payroll',
      '/reports/tax',
      '/reports/analytics'
    ]);
  });
});
