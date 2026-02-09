import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-payslip-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent
  ],
  template: `
    <div class="payslip-container">
      <!-- Header Actions (Hidden in Print) -->
      <div class="actions-bar print:hidden">
        <button
          (click)="goBack()"
          class="back-btn"
        >
          <ui-icon name="arrow-left" class="w-4 h-4 mr-2"></ui-icon>
          Back
        </button>

        @if (slip()) {
          <ui-button variant="outline" (onClick)="printSlip()">
            <ui-icon name="printer" class="w-4 h-4 mr-2"></ui-icon>
            Print / Download PDF
          </ui-button>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (loadError(); as err) {
        <div class="error-state">
          <div class="error-icon">!</div>
          <h3 class="error-title">Payslip Unavailable</h3>
          <p class="error-text">{{ err }}</p>
          <ui-button variant="outline" (onClick)="goBack()">Back to Dashboard</ui-button>
        </div>
      } @else if (slip(); as s) {
        <!-- Payslip Card - Design Six Pattern -->
        <div class="pay-card">
          <!-- Banner Header -->
          <div class="pc-banner">SALARY SLIP</div>

          <!-- Meta Row -->
          <div class="pc-meta">
            <span>{{ getMonthName(s.month) }} {{ s.year }}</span>
            <span>Aurum HRMS</span>
          </div>

          <!-- Employee Section -->
          <div class="pc-emp">
            <span class="pc-avatar">{{ getInitials(s.employeeName) }}</span>
            <div>
              <div class="pc-name">{{ s.employeeName }}</div>
              <div class="pc-role">{{ s.designation || 'Staff' }} &middot; {{ s.department || 'N/A' }}</div>
            </div>
          </div>

          <!-- Two Column Grid -->
          <div class="pc-grid">
            <!-- Earnings Column -->
            <div class="pc-col">
              <div class="pc-col-title">Earnings</div>
              @for (item of s.earnings; track item.name) {
                <div class="pc-row">
                  <span>{{ item.name }}</span>
                  <span>{{ item.amount | currency }}</span>
                </div>
              }
              @if (s.earnings.length === 0) {
                <div class="pc-row muted">
                  <span>No earnings</span>
                  <span>--</span>
                </div>
              }
              <div class="pc-row total">
                <span>Gross Pay</span>
                <span>{{ s.grossSalary | currency }}</span>
              </div>
            </div>

            <!-- Deductions Column -->
            <div class="pc-col">
              <div class="pc-col-title">Deductions</div>
              @for (item of s.deductions; track item.name) {
                <div class="pc-row">
                  <span>{{ item.name }}</span>
                  <span>{{ item.amount | currency }}</span>
                </div>
              }
              @if (s.deductions.length === 0) {
                <div class="pc-row muted">
                  <span>No deductions</span>
                  <span>--</span>
                </div>
              }
              <div class="pc-row total">
                <span>Net Pay</span>
                <span>{{ s.netSalary | currency }}</span>
              </div>
            </div>
          </div>

          <!-- Employer Contributions Section -->
          @if (s.employerContributions?.length) {
            <div class="pc-employer">
              <div class="pc-employer-header">
                <span class="pc-col-title">Employer Contributions</span>
                <span class="pc-employer-note">Paid by company, not deducted from salary</span>
              </div>
              <div class="pc-employer-grid">
                @for (item of s.employerContributions; track item.name) {
                  <div class="pc-row small">
                    <span>{{ item.name }}</span>
                    <span>{{ item.amount | currency }}</span>
                  </div>
                }
                <div class="pc-row small total">
                  <span>Total CTC</span>
                  <span>{{ (s.grossSalary + calculateTotalEmployerContributions(s)) | currency }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Footer -->
          <div class="pc-footer">
            <div class="pc-footer-note">
              <p>Payment Method: Bank Transfer</p>
              <p class="pc-footer-disclaimer">** This is a computer generated document and does not require a signature.</p>
            </div>
            <div class="pc-net-display">
              <p class="pc-net-label">Net Payable Amount</p>
              <p class="pc-net-value">{{ s.netSalary | currency }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --red: #861821;
      --text: #b8b8b8;
      --muted: #666;
      --glass: rgba(255,255,255,0.05);
      --glass-border: rgba(255,255,255,0.08);
    }

    .payslip-container {
      max-width: 52rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Actions Bar */
    .actions-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .back-btn {
      display: flex;
      align-items: center;
      color: var(--muted);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.5rem;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: white;
    }

    /* Payslip Card - Design Six Pattern */
    .pay-card {
      background: var(--glass);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 14px;
      overflow: hidden;
    }

    .pc-banner {
      background: var(--red);
      padding: 0.6rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: white;
    }

    .pc-meta {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1.25rem;
      border-bottom: 1px solid var(--glass-border);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .pc-emp {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .pc-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(134,24,33,0.25);
      color: #ff6b77;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .pc-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: white;
    }

    .pc-role {
      font-size: 0.75rem;
      color: var(--muted);
    }

    /* Two Column Grid */
    .pc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .pc-col {
      padding: 1rem 1.25rem;
    }

    .pc-col:first-child {
      border-right: 1px solid var(--glass-border);
    }

    .pc-col-title {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }

    .pc-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      font-size: 0.75rem;
      color: var(--text);
    }

    .pc-row.muted {
      font-style: italic;
      opacity: 0.5;
    }

    .pc-row.total {
      font-weight: 700;
      border-top: 1px solid var(--glass-border);
      padding-top: 0.5rem;
      margin-top: 0.3rem;
      color: white;
    }

    .pc-row.small {
      font-size: 0.75rem;
    }

    /* Employer Contributions Section */
    .pc-employer {
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-top: 1px solid var(--glass-border);
    }

    .pc-employer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pc-employer-note {
      font-size: 0.75rem;
      color: var(--muted);
      font-style: italic;
      font-weight: normal;
    }

    .pc-employer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    /* Footer */
    .pc-footer {
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-top: 1px solid var(--glass-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .pc-footer-note {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .pc-footer-note p {
      margin: 0;
      line-height: 1.6;
    }

    .pc-footer-disclaimer {
      font-style: italic;
    }

    .pc-net-display {
      text-align: right;
    }

    .pc-net-label {
      font-size: 0.75rem;
      color: var(--muted);
      margin: 0 0 0.25rem;
    }

    .pc-net-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 16rem;
    }

    .error-state {
      min-height: 16rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      text-align: center;
      padding: 1.5rem;
      background: var(--glass);
      border: 1px solid var(--glass-border);
      border-radius: 14px;
    }

    .error-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #ff6b77;
      background: rgba(134,24,33,0.22);
    }

    .error-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #f5f5f4;
    }

    .error-text {
      margin: 0;
      max-width: 28rem;
      font-size: 0.875rem;
      color: #a8a29e;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--glass-border);
      border-top-color: var(--red);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Print Styles */
    @media print {
      @page {
        margin: 0;
        size: A4;
      }

      :host {
        background: white;
      }

      .payslip-container {
        max-width: 100%;
      }

      .pay-card {
        background: white;
        border: 1px solid #ddd;
      }

      .pc-banner {
        background: #861821 !important;
        color: white !important;
      }

      .pc-name,
      .pc-row.total,
      .pc-net-value {
        color: black !important;
      }

      .pc-row {
        color: #333 !important;
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .pc-grid {
        grid-template-columns: 1fr;
      }

      .pc-col:first-child {
        border-right: none;
        border-bottom: 1px solid var(--glass-border);
      }

      .pc-employer-grid {
        grid-template-columns: 1fr;
      }

      .pc-footer {
        flex-direction: column;
        align-items: flex-start;
      }

      .pc-net-display {
        text-align: left;
        width: 100%;
      }
    }
  `]
})
export class PayslipViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  slipId = signal<Id<"salary_slips"> | null>(null);
  slip = signal<any>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        const id = params['id'] as Id<"salary_slips">;
        this.slipId.set(id);
        this.loadSlip(id);
      }
    });
  }

  loadSlip(id: Id<"salary_slips">) {
    const client = this.convex.getClient();
    this.loading.set(true);
    this.loadError.set(null);
    this.slip.set(null);

    // Perform an immediate auth check/read first.
    client.query(api.payroll.getPayslip, { slipId: id })
      .then((data) => {
        if (!data) {
          this.loadError.set('Payslip is unavailable. It may still be processing or you may not have access.');
          this.loading.set(false);
          return;
        }
        this.slip.set(data);
        this.loading.set(false);
      })
      .catch((err: any) => {
        const message = String(err?.message || '');
        if (message.toLowerCase().includes('unauthorized')) {
          this.toast.error('You do not have permission to access this payslip.');
          this.router.navigate(['/dashboard']);
          return;
        }
        this.loadError.set('Payslip is unavailable. It may still be processing or you may not have access.');
        this.loading.set(false);
      });

    // Keep subscription for live updates once initial access is validated.
    client.onUpdate(api.payroll.getPayslip, { slipId: id }, (data) => {
      if (!data) return;
      this.slip.set(data);
      this.loadError.set(null);
      this.loading.set(false);
    });
  }

  calculateTotalDeductions(slip: any): number {
    return slip.deductions.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  }

  calculateTotalEmployerContributions(slip: any): number {
    return slip.employerContributions?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
  }

  getMonthName(month: number): string {
    if (!month) return '';
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  goBack() {
    // If we have history state, go back, else go to payroll root
    // But since Angular router doesn't expose history length easily, let's just use logic
    // If the user came from run view, go back there.
    // For now, if we have a runId on the slip, we could go to it, but standard 'Back' is usually safer for UX flow if deep linked.
    // However, window.history.back() can exit the app if it's the first page.
    // Safe default:
    if (this.slip()?.runId) {
      this.router.navigate(['/payroll', this.slip().runId]);
    } else {
      // Avoid sending non-privileged users to a guarded payroll root.
      this.router.navigate(['/dashboard']);
    }
  }

  printSlip() {
    window.print();
  }
}
