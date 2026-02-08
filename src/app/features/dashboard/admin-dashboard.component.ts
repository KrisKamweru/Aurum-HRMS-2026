import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiGridComponent,
    UiGridTileComponent,
    UiDataTableComponent
  ],
  providers: [DatePipe, DecimalPipe],
  template: `
    <!-- Design Six: Unified Dash-Frame Pattern -->
    <div class="dash-frame">
      <!-- Top Bar -->
      <div class="df-topbar">
        <span class="df-logo">A</span>
        <span class="df-title">Dashboard</span>
        <span class="flex-1"></span>
        <span class="df-time">{{ today | date:'MMM d, yyyy' }} · {{ today | date:'hh:mm a' }}</span>
        <span class="df-avatar">{{ userInitials() }}</span>
      </div>

      <!-- Stats Row -->
      <div class="df-stats">
        <div class="df-stat hl">
          <div class="dfs-lbl">Total Employees</div>
          <div class="dfs-val">{{ stats()?.totalEmployees || 0 }}</div>
          <div class="dfs-sub">{{ stats()?.activeEmployees || 0 }} active</div>
        </div>
        <div class="df-stat">
          <div class="dfs-lbl">Present Today</div>
          <div class="dfs-val">{{ presentPercentage() }}%</div>
          <div class="dfs-sub">{{ stats()?.activeEmployees - (stats()?.onLeave || 0) }} of {{ stats()?.activeEmployees }}</div>
        </div>
        <div class="df-stat">
          <div class="dfs-lbl">Departments</div>
          <div class="dfs-val">{{ stats()?.departments || 0 }}</div>
          <div class="dfs-sub">Operational units</div>
        </div>
        <div class="df-stat">
          <div class="dfs-lbl">Pending Actions</div>
          <div class="dfs-val">{{ totalPending() }}</div>
          <div class="dfs-sub">{{ stats()?.pendingLeaveCount || 0 }} leave requests</div>
        </div>
      </div>

      <!-- Two Columns: Attendance + Leave Panel -->
      <ui-grid [columns]="'1fr 320px'" [gap]="'0px'">
        <!-- Attendance Table -->
        <ui-grid-tile title="Today's Activity" divider="right" [minHeight]="'400px'" [minHeightMobile]="'300px'">
          <span tile-actions class="live-badge">● Live</span>
          <div class="tile-body">
            <ui-data-table
              [data]="recentEmployees()"
              [columns]="activityColumns"
              [loading]="false"
              [cellTemplates]="{ name: activityName }"
              [actionsTemplate]="activityActions"
              headerVariant="neutral"
            >
              <ng-template #activityName let-row>
                <div class="flex items-center gap-2">
                  <span class="df-av" [style.background]="getAvatarColorFromId(row._id)">{{ getInitials(row.firstName, row.lastName) }}</span>
                  <span class="font-semibold text-stone-800 dark:text-stone-100">{{ row.firstName }} {{ row.lastName }}</span>
                </div>
              </ng-template>

              <ng-template #activityActions let-row>
                <a [routerLink]="['/employees', row._id]" class="text-xs text-burgundy-600 dark:text-burgundy-400 hover:underline">View</a>
              </ng-template>
            </ui-data-table>
          </div>
        </ui-grid-tile>

        <!-- Leave Panel -->
        <ui-grid-tile title="Pending Leave" [minHeight]="'400px'" [minHeightMobile]="'300px'">
          <span tile-actions class="count-badge">{{ dashboardData()?.pendingLeaves?.length || 0 }}</span>
          <div class="tile-body df-content-wrapper">
            @if (dashboardData()?.pendingLeaves && dashboardData()?.pendingLeaves.length > 0) {
              @for (req of dashboardData()?.pendingLeaves; track req._id) {
                <div class="df-leave-item">
                  <div class="dfl-row">
                    <span class="dfl-av" [style.background]="'#861821'">{{ getInitials(req.employeeName, '') }}</span>
                    <div class="dfl-info">
                      <span class="dfl-name">{{ req.employeeName }}</span>
                      <span class="dfl-dates">{{ req.startDate | date:'MMM d' }} – {{ req.endDate | date:'MMM d' }}</span>
                    </div>
                  </div>
                  <div class="dfl-bottom">
                    <span class="dfl-type">{{ req.type }}</span>
                    <div class="dfl-actions">
                      <a routerLink="/leave-requests" class="dfl-approve">Review</a>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="df-empty-state">
                <div class="df-empty-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p class="df-empty-text">No pending leave requests</p>
                <p class="df-empty-subtext">All requests have been processed</p>
              </div>
            }
          </div>
        </ui-grid-tile>
      </ui-grid>
    </div>

    <!-- Pending User Requests (Separate Card) -->
    @if (stats()?.pendingJoinRequestCount > 0) {
      <div class="dash-frame mt-6">
        <ui-grid-tile title="Pending User Requests" variant="compact">
          <span tile-actions class="count-badge">{{ stats()?.pendingJoinRequestCount }}</span>
          <div class="tile-body">
            @for (req of dashboardData()?.pendingJoinRequests; track req._id) {
              <div class="df-leave-item">
                <div class="dfl-row">
                  <span class="dfl-av" style="background: #2d6a4f;">{{ getInitials(req.requesterName, '') }}</span>
                  <div class="dfl-info">
                    <span class="dfl-name">{{ req.requesterName }}</span>
                    <span class="dfl-dates">{{ req.requesterEmail }}</span>
                  </div>
                </div>
                <div class="dfl-bottom">
                @if (req.note) {
                  <span class="dfl-type">"{{ req.note | slice:0:30 }}..."</span>
                }
                  <div class="dfl-actions">
                    <button class="dfl-deny" [disabled]="processingRequestId() === req._id" (click)="rejectRequest(req._id)">Deny</button>
                    <button class="dfl-approve" [disabled]="processingRequestId() === req._id" (click)="approveRequest(req._id)">Approve</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </ui-grid-tile>
      </div>
    }
  `,
  styles: [`
    /* Design Six Dashboard Styles */
    .dash-frame {
      background: rgba(255,255,255,0.8);
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
    :host-context(.dark) .dash-frame {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255,255,255,0.08);
      box-shadow: none;
    }

    .df-topbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 1.25rem;
      border-bottom: 1px solid #e7e5e4;
      background: var(--surface-header);
    }
    :host-context(.dark) .df-topbar {
      border-color: rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
    }

    .df-logo {
      width: 24px; height: 24px; border-radius: 6px;
      background: #861821; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem;
    }
    .df-title { font-weight: 600; font-size: 0.875rem; color: #1c1917; }
    :host-context(.dark) .df-title { color: white; }
    .df-time { font-size: 0.75rem; color: #57534e; }
    :host-context(.dark) .df-time { color: #a8a29e; }
    .df-avatar {
      width: 26px; height: 26px; border-radius: 7px;
      background: #861821; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }

    /* Stats */
    .df-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 1px solid #e7e5e4;
    }
    :host-context(.dark) .df-stats { border-color: rgba(255,255,255,0.08); }
    .df-stat {
      padding: 1.25rem;
      border-right: 1px solid #e7e5e4;
    }
    :host-context(.dark) .df-stat { border-color: rgba(255,255,255,0.08); }
    .df-stat:last-child { border-right: none; }
    .df-stat.hl {
      background: rgba(134,24,33,0.06);
      border-left: 4px solid #861821;
      padding-left: calc(1.25rem - 4px);
    }
    :host-context(.dark) .df-stat.hl {
      background: rgba(134,24,33,0.12);
      border-left-color: #ff6b77;
    }
    .dfs-lbl { font-size: 0.75rem; font-weight: 500; color: #57534e; letter-spacing: 0.05em; margin-bottom: 0.25rem; text-transform: uppercase; }
    :host-context(.dark) .dfs-lbl { color: #a8a29e; }
    .dfs-val { font-weight: 700; font-size: 1.25rem; color: #1c1917; }
    :host-context(.dark) .dfs-val { color: white; }
    .df-stat.hl .dfs-val { color: #861821; }
    :host-context(.dark) .df-stat.hl .dfs-val { color: #ff6b77; }
    .dfs-sub { font-size: 0.75rem; color: #78716c; margin-top: 0.15rem; }

    /* Content wrapper for consistent height */
    .df-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .live-badge { font-size: 0.75rem; color: #2dd4bf; letter-spacing: 0.06em; }
    .count-badge {
      font-size: 0.75rem; font-weight: 700; color: #861821;
      background: rgba(134,24,33,0.1); padding: 0.15rem 0.5rem; border-radius: 100px;
    }
    :host-context(.dark) .count-badge { background: rgba(134,24,33,0.15); color: #ff6b77; }

    .df-thead {
      display: grid; grid-template-columns: 1.6fr 1fr 0.8fr 0.7fr;
      padding: 0.5rem 1.25rem;
      border-bottom: 1px solid #f5f5f4;
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: #57534e;
    }
    :host-context(.dark) .df-thead { border-color: rgba(255,255,255,0.05); color: #a8a29e; }

    .df-trow {
      display: grid; grid-template-columns: 1.6fr 1fr 0.8fr 0.7fr;
      padding: 0.55rem 1.25rem;
      border-bottom: 1px solid #fafaf9;
      font-size: 0.875rem; align-items: center;
      transition: background 0.15s;
    }
    :host-context(.dark) .df-trow { border-color: rgba(255,255,255,0.03); }
    .df-trow:hover { background: rgba(134,24,33,0.03); }
    :host-context(.dark) .df-trow:hover { background: rgba(134,24,33,0.06); }
    .df-trow:last-child { border-bottom: none; }

    .df-td-name {
      display: flex; align-items: center; gap: 0.5rem;
      font-weight: 600; color: #1c1917;
    }
    :host-context(.dark) .df-td-name { color: white; }
    .df-av {
      width: 24px; height: 24px; border-radius: 6px; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .df-td { color: #57534e; }
    :host-context(.dark) .df-td { color: #d6d3d1; }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 0.3rem; }

    /* Leave panel */
    .df-leave-item { padding: 0.75rem 1.25rem; border-bottom: 1px solid #fafaf9; }
    :host-context(.dark) .df-leave-item { border-color: rgba(255,255,255,0.03); }
    .df-leave-item:last-child { border-bottom: none; }
    .dfl-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
    .dfl-av {
      width: 24px; height: 24px; border-radius: 6px; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .dfl-name { font-size: 0.875rem; font-weight: 600; color: #1c1917; }
    :host-context(.dark) .dfl-name { color: white; }
    .dfl-dates { font-size: 0.75rem; color: #57534e; }
    :host-context(.dark) .dfl-dates { color: #a8a29e; }
    .dfl-info { display: flex; flex-direction: column; }
    .dfl-bottom { display: flex; justify-content: space-between; align-items: center; margin-left: calc(24px + 0.5rem); }
    .dfl-type { font-size: 0.75rem; color: #861821; font-weight: 500; }
    :host-context(.dark) .dfl-type { color: #ff6b77; }
    .dfl-actions { display: flex; gap: 0.35rem; }
    .dfl-approve {
      padding: 0.2rem 0.55rem; border-radius: 6px;
      background: #861821; color: white; border: none;
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
    }
    .dfl-deny {
      padding: 0.2rem 0.55rem; border-radius: 6px;
      background: transparent; color: #57534e;
      border: 1px solid #e7e5e4; font-size: 0.75rem; font-weight: 600; cursor: pointer;
    }
    :host-context(.dark) .dfl-deny { border-color: rgba(255,255,255,0.08); color: #a8a29e; }

    /* Empty States */
    .df-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .df-empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f5f5f4;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: #78716c;
    }
    :host-context(.dark) .df-empty-icon {
      background: rgba(255,255,255,0.06);
      color: #a8a29e;
    }
    .df-empty-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: #57534e;
      margin-bottom: 0.25rem;
    }
    :host-context(.dark) .df-empty-text { color: #d6d3d1; }
    .df-empty-subtext {
      font-size: 0.75rem;
      color: #78716c;
    }
    :host-context(.dark) .df-empty-subtext { color: #a8a29e; }

    @media (max-width: 600px) {
      .df-stats { grid-template-columns: repeat(2, 1fr); }
      .df-thead, .df-trow { grid-template-columns: 1fr 1fr; }
      .df-thead span:nth-child(3), .df-thead span:nth-child(4),
      .df-trow span:nth-child(3), .df-trow span:nth-child(4) { display: none; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private authService = inject(AuthService);

  today = new Date();
  user = computed(() => this.authService.getUser()());

  dashboardData = signal<any>(null);
  stats = computed(() => this.dashboardData()?.stats);
  recentEmployees = computed(() => this.dashboardData()?.recentEmployees || []);
  activityColumns: TableColumn[] = [
    { key: 'name', header: 'Employee' },
    { key: 'departmentName', header: 'Department' },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      formatter: () => 'Active',
      badgeVariant: () => 'success'
    }
  ];
  processingRequestId = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);

  private unsubscribe: (() => void) | null = null;

  private avatarColors = ['#861821', '#6b5b4f', '#2d6a4f', '#7c3aed', '#0891b2', '#c2410c'];

  userInitials = computed(() => {
    const u = this.user();
    if (u?.firstName && u?.lastName) {
      return u.firstName[0] + u.lastName[0];
    }
    return 'U';
  });

  presentPercentage = computed(() => {
    const s = this.stats();
    if (!s?.activeEmployees) return 0;
    const present = s.activeEmployees - (s.onLeave || 0);
    return Math.round((present / s.activeEmployees) * 100);
  });

  totalPending = computed(() => {
    const s = this.stats();
    return (s?.pendingLeaveCount || 0) + (s?.pendingResignationCount || 0) + (s?.pendingJoinRequestCount || 0);
  });

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getAvatarColorFromId(id: string): string {
    if (!id) return this.avatarColors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash + id.charCodeAt(i)) % this.avatarColors.length;
    }
    return this.avatarColors[hash];
  }

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.dashboard.getStats, {}, (data) => {
      this.dashboardData.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async approveRequest(requestId: string) {
    this.processingRequestId.set(requestId);
    this.processingAction.set('approve');
    try {
      await this.convexService.getClient().mutation(api.onboarding.approveJoinRequest, {
        requestId: requestId as any,
        role: 'employee'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      this.processingRequestId.set(null);
      this.processingAction.set(null);
    }
  }

  async rejectRequest(requestId: string) {
    const reason = prompt('Rejection reason (optional):');
    this.processingRequestId.set(requestId);
    this.processingAction.set('reject');
    try {
      await this.convexService.getClient().mutation(api.onboarding.rejectJoinRequest, {
        requestId: requestId as any,
        reason: reason || undefined
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      this.processingRequestId.set(null);
      this.processingAction.set(null);
    }
  }
}
