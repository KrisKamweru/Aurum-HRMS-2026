import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { ToastService } from '../../shared/services/toast.service';
import { AttendanceTrustService } from '../../core/services/attendance-trust.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UiIconComponent, UiBadgeComponent, UiGridComponent, UiGridTileComponent],
  providers: [DatePipe],
  template: `
    <div class="emp-dash">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (!data()?.hasEmployeeProfile) {
        <!-- No Employee Profile State -->
        <div class="no-profile-card">
          <div class="no-profile-content">
            <div class="no-profile-icon">?</div>
            <h3 class="no-profile-title">Profile Not Found</h3>
            <p class="no-profile-text">
              Your user account is not linked to an employee profile yet. This usually means your profile is being set up by HR or requires verification.
            </p>
            <button class="no-profile-btn">Contact Support</button>
          </div>
        </div>
      } @else {
        <!-- Main Dashboard Frame -->
        <div class="dash-frame">
          <!-- Header with Welcome -->
          <div class="dash-topbar">
            <div class="topbar-welcome">
              <div class="topbar-greeting">Welcome back, {{ data()?.employee?.firstName }}!</div>
              <div class="topbar-meta">
                <span>{{ data()?.employee?.designationName || 'Employee' }}</span>
                <span class="meta-dot">•</span>
                <span>{{ data()?.employee?.departmentName || 'General' }}</span>
                <span class="meta-dot">•</span>
                <span class="meta-tenure">{{ data()?.employee?.tenure }}</span>
              </div>
            </div>
            <div class="topbar-actions">
              <div class="topbar-date">
                <div class="date-day">{{ today | date:'EEEE' }}</div>
                <div class="date-full">{{ today | date:'longDate' }}</div>
              </div>
              <button class="btn-primary" routerLink="/leave-requests">Request Leave</button>
            </div>
          </div>

          <!-- Leave Balance Section -->
          <div class="section-block">
            <ui-grid-tile title="Leave Balance" variant="compact">
              <div class="section-body">
                <div class="balance-grid">
                  <!-- Vacation -->
                  <div class="balance-card vacation">
                    <div class="balance-header">
                      <span class="balance-label">Vacation</span>
                      <span class="balance-badge sky">{{ data()?.leaveBalance?.vacation?.remaining }} days left</span>
                    </div>
                    <div class="balance-value">
                      <span class="value-num">{{ data()?.leaveBalance?.vacation?.remaining }}</span>
                      <span class="value-total">/ {{ data()?.leaveBalance?.vacation?.entitled }}</span>
                    </div>
                    <div class="balance-progress">
                      <div class="progress-fill sky" [style.width.%]="getPercentage(data()?.leaveBalance?.vacation?.remaining, data()?.leaveBalance?.vacation?.entitled)"></div>
                    </div>
                  </div>

                  <!-- Sick Leave -->
                  <div class="balance-card sick">
                    <div class="balance-header">
                      <span class="balance-label">Sick Leave</span>
                      <span class="balance-badge emerald">{{ data()?.leaveBalance?.sick?.remaining }} days left</span>
                    </div>
                    <div class="balance-value">
                      <span class="value-num">{{ data()?.leaveBalance?.sick?.remaining }}</span>
                      <span class="value-total">/ {{ data()?.leaveBalance?.sick?.entitled }}</span>
                    </div>
                    <div class="balance-progress">
                      <div class="progress-fill emerald" [style.width.%]="getPercentage(data()?.leaveBalance?.sick?.remaining, data()?.leaveBalance?.sick?.entitled)"></div>
                    </div>
                  </div>

                  <!-- Personal Leave -->
                  <div class="balance-card personal">
                    <div class="balance-header">
                      <span class="balance-label">Personal</span>
                      <span class="balance-badge amber">{{ data()?.leaveBalance?.personal?.remaining }} days left</span>
                    </div>
                    <div class="balance-value">
                      <span class="value-num">{{ data()?.leaveBalance?.personal?.remaining }}</span>
                      <span class="value-total">/ {{ data()?.leaveBalance?.personal?.entitled }}</span>
                    </div>
                    <div class="balance-progress">
                      <div class="progress-fill amber" [style.width.%]="getPercentage(data()?.leaveBalance?.personal?.remaining, data()?.leaveBalance?.personal?.entitled)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </ui-grid-tile>
          </div>

          <!-- Two Column Layout -->
          <div class="dash-cols">
            <!-- Left: Recent Requests -->
            <div class="dash-col-main">
              <ui-grid-tile title="Recent Requests" variant="compact">
                <a tile-actions routerLink="/leave-requests" class="view-all-link">View All</a>

                <div class="dash-col-body">
                  <!-- Next Upcoming Leave Highlight -->
                  @if (data()?.upcomingLeave?.length > 0) {
                    @let nextLeave = data()?.upcomingLeave[0];
                    <div class="upcoming-leave-card">
                      <div class="upcoming-icon">📅</div>
                      <div class="upcoming-content">
                        <div class="upcoming-label">Upcoming Leave</div>
                        <div class="upcoming-dates">
                          {{ nextLeave.startDate | date:'mediumDate' }} - {{ nextLeave.endDate | date:'mediumDate' }}
                        </div>
                        <div class="upcoming-info">
                          {{ nextLeave.type | titlecase }} • {{ nextLeave.days }} days
                        </div>
                      </div>
                    </div>
                  }

                  <div class="requests-list">
                    @if (data()?.recentRequests?.length === 0) {
                      <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <div class="empty-title">No recent leave requests</div>
                        <div class="empty-text">Your leave history will appear here</div>
                        <button routerLink="/leave-requests" class="empty-action">Make a request</button>
                      </div>
                    } @else {
                      @for (req of data()?.recentRequests; track req._id) {
                        <div class="request-row">
                          <div class="request-main">
                            <div class="request-icon" [ngClass]="getIconBgClass(req.status)">
                              <ui-icon [name]="getIconName(req.status)" class="icon-sm"></ui-icon>
                            </div>
                            <div class="request-info">
                              <div class="request-type">{{ req.type }} Leave</div>
                              <div class="request-dates">
                                {{ req.startDate | date:'MMM d' }} - {{ req.endDate | date:'MMM d' }} • {{ req.days }} days
                              </div>
                            </div>
                          </div>
                          <ui-badge [variant]="getBadgeVariant(req.status)">
                            {{ req.status | titlecase }}
                          </ui-badge>
                        </div>
                      }
                    }
                  </div>
                </div>
              </ui-grid-tile>
            </div>

            <!-- Right: Sidebar Widgets -->
            <div class="dash-col-side">
              <ui-grid [columns]="'1fr'" [gap]="'0px'">
                <!-- Time Clock Widget -->
                <ui-grid-tile title="Time Clock" variant="compact" divider="bottom">
                  <a tile-actions routerLink="/attendance" class="widget-link">View History</a>
                  <div class="tile-body clock-widget">
                    <!-- Current Time -->
                    <div class="clock-time">
                      <div class="clock-display">{{ currentTime() | date:'HH:mm:ss' }}</div>
                      <div class="clock-date">{{ currentTime() | date:'EEEE, MMM d' }}</div>
                    </div>

                    <!-- Clock Status -->
                    @if (attendanceStatus()) {
                      <div class="clock-status">
                        <div class="status-row">
                          <span class="status-label">Clocked In</span>
                          <span class="status-value">{{ formatTime(attendanceStatus()!.clockIn) }}</span>
                        </div>
                        @if (attendanceStatus()!.clockOut) {
                          <div class="status-row">
                            <span class="status-label">Clocked Out</span>
                            <span class="status-value">{{ formatTime(attendanceStatus()!.clockOut) }}</span>
                          </div>
                          <div class="status-row">
                            <span class="status-label">Work Time</span>
                            <span class="status-value success">{{ formatDuration(attendanceStatus()!.workMinutes) }}</span>
                          </div>
                        } @else {
                          <div class="status-row">
                            <span class="status-label">Status</span>
                            <span class="status-badge" [ngClass]="attendanceStatus()!.status">
                              {{ attendanceStatus()!.status }}
                            </span>
                          </div>
                        }
                      </div>

                      @if (!attendanceStatus()!.clockOut) {
                        <button
                          (click)="clockOut()"
                          [disabled]="isClockingOut()"
                          class="clock-btn out"
                        >
                          @if (isClockingOut()) {
                            <div class="btn-spinner"></div>
                            Clocking Out...
                          } @else {
                            Clock Out
                          }
                        </button>
                      } @else {
                        <div class="clock-complete">You've completed today's shift</div>
                      }
                    } @else {
                      <!-- Not Clocked In -->
                      <div class="clock-empty">
                        <div class="clock-empty-icon">🕐</div>
                        <div class="clock-empty-text">Not clocked in yet</div>
                      </div>
                      <button
                        (click)="clockIn()"
                        [disabled]="isClockingIn()"
                        class="clock-btn in"
                      >
                        @if (isClockingIn()) {
                          <div class="btn-spinner"></div>
                          Clocking In...
                        } @else {
                          Clock In
                        }
                      </button>
                    }
                  </div>
                </ui-grid-tile>

                <!-- Team Pulse Widget -->
                <ui-grid-tile title="Team Pulse" variant="compact" divider="bottom">
                  <div class="tile-body">
                    <div class="team-pulse-content">
                      @if (data()?.teammatesOnLeave > 0) {
                        <div class="pulse-value">{{ data()?.teammatesOnLeave }}</div>
                        <div class="pulse-label">Teammates on leave today</div>
                      } @else {
                        <div class="pulse-all-present">
                          <div class="pulse-check">✓</div>
                          <div class="pulse-text">All teammates present</div>
                        </div>
                      }
                    </div>
                  </div>
                </ui-grid-tile>

                <!-- Quick Actions Widget -->
                <ui-grid-tile title="Quick Actions" variant="compact" divider="bottom">
                  <div class="tile-body">
                    <div class="quick-actions">
                      <button routerLink="/profile" class="quick-action">
                        <span class="quick-action-text">View My Profile</span>
                        <span class="quick-action-arrow">→</span>
                      </button>

                      @if (data()?.latestPayslip) {
                        <button [routerLink]="['/payroll/slip', data()?.latestPayslip._id]" class="quick-action payslip">
                          <div class="quick-action-main">
                            <div class="quick-action-icon">💰</div>
                            <div>
                              <div class="quick-action-title">Latest Payslip</div>
                              <div class="quick-action-subtitle">{{ getMonthName(data()?.latestPayslip.month) }} {{ data()?.latestPayslip.year }}</div>
                            </div>
                          </div>
                          <span class="quick-action-arrow">→</span>
                        </button>
                      } @else {
                        <button class="quick-action disabled">
                          <span class="quick-action-text">View Payslip</span>
                          <span class="quick-action-lock">🔒</span>
                        </button>
                      }
                    </div>
                  </div>
                </ui-grid-tile>

                <!-- Recognition Widget -->
                @if (data()?.recentAwards?.length > 0) {
                  <ui-grid-tile
                    title="Recent Awards"
                    variant="compact"
                    [divider]="data()?.recentWarnings?.length > 0 ? 'bottom' : 'none'"
                  >
                    <div class="tile-body awards-widget">
                      <div class="awards-list">
                        @for (award of data()?.recentAwards; track award._id) {
                          <div class="award-item">
                            <div class="award-icon">⭐</div>
                            <div>
                              <div class="award-title">{{ award.title }}</div>
                              <div class="award-date">{{ award.date | date:'mediumDate' }}</div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </ui-grid-tile>
                }

                <!-- Warnings Widget -->
                @if (data()?.recentWarnings?.length > 0) {
                  <ui-grid-tile title="Recent Alerts" variant="compact">
                    <div class="tile-body warnings-widget">
                      <div class="warnings-list">
                        @for (warning of data()?.recentWarnings; track warning._id) {
                          <div class="warning-item">
                            <div class="warning-header">
                              <span class="warning-subject">{{ warning.subject }}</span>
                              <span class="warning-severity">{{ warning.severity }}</span>
                            </div>
                            <div class="warning-desc">{{ warning.description }}</div>
                            <div class="warning-date">{{ warning.issueDate | date:'mediumDate' }}</div>
                          </div>
                        }
                      </div>
                    </div>
                  </ui-grid-tile>
                }
              </ui-grid>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════
       EMPLOYEE DASHBOARD - DESIGN SIX
       Glass aesthetic with structured layout
       ══════════════════════════════════════ */

    :host {
      display: block;
      --burgundy: #8b1e3f;
      --gold: #b8956b;
    }

    /* Loading & Empty States */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 0;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid rgba(139, 30, 63, 0.1);
      border-top-color: var(--burgundy);
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* No Profile State */
    .no-profile-card {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      padding: 2rem 1.5rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }

    :host-context(.dark) .no-profile-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: none;
    }

    .no-profile-content {
      text-align: center;
      padding: 3rem 0;
    }

    .no-profile-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: rgba(139, 30, 63, 0.1);
      border: 2px solid rgba(139, 30, 63, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--burgundy);
    }

    :host-context(.dark) .no-profile-icon {
      background: rgba(139, 30, 63, 0.2);
      border-color: rgba(139, 30, 63, 0.3);
    }

    .no-profile-title {
      font-weight: 600;
      font-size: 1.25rem;
      color: #1c1917;
      margin: 0 0 0.75rem;
    }

    :host-context(.dark) .no-profile-title {
      color: white;
    }

    .no-profile-text {
      font-size: 0.875rem;
      color: #78716c;
      max-width: 28rem;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    :host-context(.dark) .no-profile-text {
      color: #a8a29e;
    }

    .no-profile-btn {
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      border: 1px solid #d6d3d1;
      background: transparent;
      font-size: 0.813rem;
      font-weight: 500;
      color: #57534e;
      cursor: pointer;
      transition: all 0.2s;
    }

    .no-profile-btn:hover {
      border-color: var(--burgundy);
      color: var(--burgundy);
    }

    :host-context(.dark) .no-profile-btn {
      border-color: rgba(255, 255, 255, 0.08);
      color: #a8a29e;
    }

    :host-context(.dark) .no-profile-btn:hover {
      border-color: var(--burgundy);
      color: #ff6b77;
    }

    /* Main Dashboard Frame */
    .dash-frame {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }

    :host-context(.dark) .dash-frame {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: none;
    }

    /* Top Bar */
    .dash-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e7e5e4;
      background: rgba(255, 255, 255, 0.5);
    }

    :host-context(.dark) .dash-topbar {
      border-color: rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
    }

    .topbar-welcome {
      flex: 1;
    }

    .topbar-greeting {
      font-weight: 600;
      font-size: 1.125rem;
      color: #1c1917;
      margin-bottom: 0.25rem;
    }

    :host-context(.dark) .topbar-greeting {
      color: white;
    }

    .topbar-meta {
      font-size: 0.75rem;
      color: #78716c;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    :host-context(.dark) .topbar-meta {
      color: #a8a29e;
    }

    .meta-dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #d6d3d1;
    }

    :host-context(.dark) .meta-dot {
      background: #57534e;
    }

    .meta-tenure {
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: #a8a29e;
    }

    :host-context(.dark) .meta-tenure {
      color: #78716c;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .topbar-date {
      text-align: right;
    }

    .date-day {
      font-size: 0.813rem;
      font-weight: 600;
      color: #1c1917;
    }

    :host-context(.dark) .date-day {
      color: white;
    }

    .date-full {
      font-size: 0.688rem;
      color: #78716c;
    }

    :host-context(.dark) .date-full {
      color: #a8a29e;
    }

    .btn-primary {
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      background: var(--burgundy);
      color: white;
      border: none;
      font-size: 0.813rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary:hover {
      background: #6b1219;
      transform: translateY(-1px);
    }

    /* Section Blocks */
    .section-block {
      padding: 0;
      border-bottom: 1px solid #e7e5e4;
    }

    :host-context(.dark) .section-block {
      border-color: rgba(255, 255, 255, 0.08);
    }

    .section-body {
      padding: 1.5rem;
    }

    .view-all-link {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--burgundy);
      text-transform: none;
      letter-spacing: 0;
      cursor: pointer;
      transition: color 0.2s;
      text-decoration: none;
    }

    .view-all-link:hover {
      color: #6b1219;
    }

    :host-context(.dark) .view-all-link {
      color: #fda4af;
    }

    :host-context(.dark) .view-all-link:hover {
      color: #fecdd3;
    }

    /* Balance Grid */
    .balance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .balance-card {
      padding: 1.25rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid #e7e5e4;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    :host-context(.dark) .balance-card {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
      box-shadow: none;
    }

    .balance-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
    }

    .balance-card.vacation::before { background: #0ea5e9; }
    .balance-card.sick::before { background: #10b981; }
    .balance-card.personal::before { background: #f59e0b; }

    .balance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .balance-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #78716c;
    }

    :host-context(.dark) .balance-label {
      color: #a8a29e;
    }

    .balance-badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 100px;
    }

    .balance-badge.sky {
      background: rgba(14, 165, 233, 0.1);
      color: #0369a1;
    }

    :host-context(.dark) .balance-badge.sky {
      background: rgba(14, 165, 233, 0.2);
      color: #7dd3fc;
    }

    .balance-badge.emerald {
      background: rgba(16, 185, 129, 0.1);
      color: #047857;
    }

    :host-context(.dark) .balance-badge.emerald {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
    }

    .balance-badge.amber {
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
    }

    :host-context(.dark) .balance-badge.amber {
      background: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    .balance-value {
      display: flex;
      align-items: flex-end;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .value-num {
      font-weight: 700;
      font-size: 1.5rem;
      color: #1c1917;
    }

    :host-context(.dark) .value-num {
      color: white;
    }

    .value-total {
      font-size: 0.875rem;
      color: #78716c;
      padding-bottom: 0.25rem;
    }

    :host-context(.dark) .value-total {
      color: #a8a29e;
    }

    .balance-progress {
      width: 100%;
      height: 6px;
      background: #f5f5f4;
      border-radius: 100px;
      overflow: hidden;
    }

    :host-context(.dark) .balance-progress {
      background: rgba(255, 255, 255, 0.08);
    }

    .progress-fill {
      height: 100%;
      border-radius: 100px;
      transition: width 0.3s ease;
    }

    .progress-fill.sky { background: #0ea5e9; }
    .progress-fill.emerald { background: #10b981; }
    .progress-fill.amber { background: #f59e0b; }

    /* Two Column Layout */
    .dash-cols {
      display: grid;
      grid-template-columns: 1fr 22rem;
    }

    .dash-col-main {
      padding: 0;
      border-right: 1px solid #e7e5e4;
    }

    :host-context(.dark) .dash-col-main {
      border-color: rgba(255, 255, 255, 0.08);
    }

    .dash-col-side {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dash-col-body {
      padding: 1.5rem;
    }

    /* Upcoming Leave Card */
    .upcoming-leave-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(20, 184, 166, 0.08));
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
    }

    :host-context(.dark) .upcoming-leave-card {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.12));
      border-color: rgba(16, 185, 129, 0.25);
    }

    .upcoming-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.15);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .upcoming-content {
      flex: 1;
    }

    .upcoming-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #047857;
      margin-bottom: 0.25rem;
    }

    :host-context(.dark) .upcoming-label {
      color: #6ee7b7;
    }

    .upcoming-dates {
      font-weight: 600;
      font-size: 0.938rem;
      color: #1c1917;
      margin-bottom: 0.125rem;
    }

    :host-context(.dark) .upcoming-dates {
      color: white;
    }

    .upcoming-info {
      font-size: 0.75rem;
      color: #78716c;
    }

    :host-context(.dark) .upcoming-info {
      color: #a8a29e;
    }

    /* Requests List */
    .requests-list {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid #e7e5e4;
      border-radius: 10px;
      overflow: hidden;
      min-height: 200px;
    }

    :host-context(.dark) .requests-list {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      min-height: 200px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-title {
      font-weight: 500;
      font-size: 0.875rem;
      color: #78716c;
      margin-bottom: 0.25rem;
    }

    :host-context(.dark) .empty-title {
      color: #a8a29e;
    }

    .empty-text {
      font-size: 0.75rem;
      color: #a8a29e;
      margin-bottom: 1rem;
    }

    :host-context(.dark) .empty-text {
      color: #78716c;
    }

    .empty-action {
      padding: 0.375rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--burgundy);
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .empty-action:hover {
      opacity: 0.7;
      text-decoration: underline;
    }

    :host-context(.dark) .empty-action {
      color: #fda4af;
    }

    :host-context(.dark) .empty-action:hover {
      color: #fecdd3;
      opacity: 1;
    }

    .request-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      transition: background 0.15s;
    }

    .request-row:last-child {
      border-bottom: none;
    }

    .request-row:hover {
      background: rgba(139, 30, 63, 0.04);
    }

    :host-context(.dark) .request-row {
      border-color: rgba(255, 255, 255, 0.03);
    }

    :host-context(.dark) .request-row:hover {
      background: rgba(139, 30, 63, 0.08);
    }

    .request-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .request-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-sm {
      width: 16px;
      height: 16px;
    }

    .request-info {
      display: flex;
      flex-direction: column;
    }

    .request-type {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1c1917;
      text-transform: capitalize;
    }

    :host-context(.dark) .request-type {
      color: white;
    }

    .request-dates {
      font-size: 0.688rem;
      color: #78716c;
    }

    :host-context(.dark) .request-dates {
      color: #a8a29e;
    }

    /* Widget Cards */
    .widget-card {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid #e7e5e4;
      border-radius: 10px;
      padding: 1.25rem;
    }

    :host-context(.dark) .widget-card {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .clock-widget {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255, 255, 255, 0.6));
    }

    :host-context(.dark) .clock-widget {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(255, 255, 255, 0.03));
    }

    .widget-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #57534e;
      margin-bottom: 1rem;
    }

    :host-context(.dark) .widget-head {
      color: #a8a29e;
    }

    .widget-link {
      font-size: 0.688rem;
      font-weight: 500;
      color: #6366f1;
      text-transform: none;
      letter-spacing: 0;
      cursor: pointer;
      transition: color 0.2s;
      text-decoration: none;
    }

    .widget-link:hover {
      color: #4f46e5;
    }

    /* Clock Display */
    .clock-time {
      text-align: center;
      margin-bottom: 1rem;
    }

    .clock-display {
      font-weight: 700;
      font-size: 1.875rem;
      color: #1c1917;
      font-variant-numeric: tabular-nums;
      margin-bottom: 0.25rem;
    }

    :host-context(.dark) .clock-display {
      color: white;
    }

    .clock-date {
      font-size: 0.688rem;
      color: #78716c;
    }

    :host-context(.dark) .clock-date {
      color: #a8a29e;
    }

    .clock-status {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    :host-context(.dark) .clock-status {
      background: rgba(0, 0, 0, 0.2);
      border-color: rgba(99, 102, 241, 0.2);
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .status-row:last-child {
      margin-bottom: 0;
    }

    .status-label {
      font-size: 0.688rem;
      font-weight: 500;
      color: #78716c;
    }

    :host-context(.dark) .status-label {
      color: #a8a29e;
    }

    .status-value {
      font-size: 0.813rem;
      font-weight: 600;
      color: #6366f1;
    }

    .status-value.success {
      color: #10b981;
    }

    :host-context(.dark) .status-value {
      color: #a5b4fc;
    }

    :host-context(.dark) .status-value.success {
      color: #6ee7b7;
    }

    .status-badge {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
      border-radius: 100px;
    }

    .status-badge.present {
      background: rgba(16, 185, 129, 0.1);
      color: #047857;
    }

    :host-context(.dark) .status-badge.present {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
    }

    .status-badge.late {
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
    }

    :host-context(.dark) .status-badge.late {
      background: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    /* Clock Buttons */
    .clock-btn {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: none;
      font-weight: 600;
      font-size: 0.813rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .clock-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .clock-btn.in {
      background: linear-gradient(135deg, #10b981, #14b8a6);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .clock-btn.in:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
    }

    .clock-btn.out {
      background: linear-gradient(135deg, #f43f5e, #ef4444);
      color: white;
      box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2);
    }

    .clock-btn.out:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(244, 63, 94, 0.3);
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      animation: spin 0.6s linear infinite;
    }

    .clock-complete {
      text-align: center;
      font-size: 0.813rem;
      color: #78716c;
      padding: 0.5rem 0;
    }

    :host-context(.dark) .clock-complete {
      color: #a8a29e;
    }

    .clock-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 0;
      margin-bottom: 1rem;
    }

    .clock-empty-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .clock-empty-text {
      font-size: 0.813rem;
      color: #78716c;
    }

    :host-context(.dark) .clock-empty-text {
      color: #a8a29e;
    }

    /* Team Pulse */
    .team-pulse-content {
      background: rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      padding: 1rem;
    }

    :host-context(.dark) .team-pulse-content {
      background: rgba(0, 0, 0, 0.2);
    }

    .pulse-value {
      font-weight: 700;
      font-size: 1.5rem;
      color: #1c1917;
      margin-bottom: 0.25rem;
    }

    :host-context(.dark) .pulse-value {
      color: white;
    }

    .pulse-label {
      font-size: 0.75rem;
      color: #78716c;
    }

    :host-context(.dark) .pulse-label {
      color: #a8a29e;
    }

    .pulse-all-present {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0;
    }

    .pulse-check {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .pulse-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: #1c1917;
    }

    :host-context(.dark) .pulse-text {
      color: white;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-action {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .quick-action:hover:not(.disabled) {
      border-color: var(--burgundy);
      background: rgba(139, 30, 63, 0.03);
    }

    :host-context(.dark) .quick-action {
      border-color: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark) .quick-action:hover:not(.disabled) {
      border-color: var(--burgundy);
      background: rgba(139, 30, 63, 0.06);
    }

    .quick-action.payslip:hover {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.03);
    }

    .quick-action.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .quick-action-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: #1c1917;
    }

    :host-context(.dark) .quick-action-text {
      color: white;
    }

    .quick-action.disabled .quick-action-text {
      color: #78716c;
    }

    .quick-action-arrow {
      font-size: 0.875rem;
      color: #a8a29e;
      transition: transform 0.2s;
    }

    .quick-action:hover:not(.disabled) .quick-action-arrow {
      transform: translateX(2px);
    }

    .quick-action-lock {
      font-size: 0.75rem;
    }

    .quick-action-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .quick-action-icon {
      font-size: 1.25rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 6px;
    }

    .quick-action-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1c1917;
    }

    :host-context(.dark) .quick-action-title {
      color: white;
    }

    .quick-action-subtitle {
      font-size: 0.688rem;
      color: #78716c;
    }

    :host-context(.dark) .quick-action-subtitle {
      color: #a8a29e;
    }

    /* Awards Widget */
    .awards-widget {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(255, 255, 255, 0.6));
    }

    :host-context(.dark) .awards-widget {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(255, 255, 255, 0.03));
    }

    .awards-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .award-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .award-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .award-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1c1917;
    }

    :host-context(.dark) .award-title {
      color: white;
    }

    .award-date {
      font-size: 0.688rem;
      color: #78716c;
    }

    :host-context(.dark) .award-date {
      color: #a8a29e;
    }

    /* Warnings Widget */
    .warnings-widget {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(255, 255, 255, 0.6));
    }

    :host-context(.dark) .warnings-widget {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(255, 255, 255, 0.03));
    }

    .warnings-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .warning-item {
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
    }

    :host-context(.dark) .warning-item {
      background: rgba(0, 0, 0, 0.2);
      border-color: rgba(239, 68, 68, 0.25);
    }

    .warning-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .warning-subject {
      font-size: 0.75rem;
      font-weight: 600;
      color: #991b1b;
    }

    :host-context(.dark) .warning-subject {
      color: #fca5a5;
    }

    .warning-severity {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.15);
      color: #991b1b;
    }

    :host-context(.dark) .warning-severity {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .warning-desc {
      font-size: 0.688rem;
      color: #7f1d1d;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    :host-context(.dark) .warning-desc {
      color: #fca5a5;
    }

    .warning-date {
      font-size: 0.625rem;
      color: #b91c1c;
      text-align: right;
    }

    :host-context(.dark) .warning-date {
      color: #f87171;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .dash-cols {
        grid-template-columns: 1fr;
      }

      .dash-col-main {
        border-right: none;
        border-bottom: 1px solid #e7e5e4;
      }

      :host-context(.dark) .dash-col-main {
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    @media (max-width: 768px) {
      .balance-grid {
        grid-template-columns: 1fr;
      }

      .topbar-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .topbar-date {
        text-align: left;
      }

      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 640px) {
      .dash-topbar {
        flex-direction: column;
        align-items: flex-start;
      }

      .dash-frame {
        border-radius: 10px;
      }

      .section-body,
      .dash-col-body,
      .dash-col-side {
        padding: 1rem;
      }
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private trustService = inject(AttendanceTrustService);

  today = new Date();
  isLoading = signal(true);
  data = signal<any>(null);
  attendanceStatus = signal<any>(null);
  isClockingIn = signal(false);
  isClockingOut = signal(false);
  currentTime = signal(new Date());

  private unsubscribe: (() => void) | null = null;
  private attendanceUnsubscribe: (() => void) | null = null;
  private clockInterval: any = null;

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.dashboard.getEmployeeStats, {}, (result) => {
      this.data.set(result);
      this.isLoading.set(false);
    });

    // Subscribe to attendance status
    this.attendanceUnsubscribe = client.onUpdate(api.attendance.getTodayStatus, {}, (result) => {
      this.attendanceStatus.set(result);
    });

    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.attendanceUnsubscribe) {
      this.attendanceUnsubscribe();
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private async executeClockMutation(type: 'clockIn' | 'clockOut', reasonCode: string) {
    const client = this.convexService.getClient();
    const mutationRef = type === 'clockIn' ? api.attendance.clockIn : api.attendance.clockOut;
    const successMessage = type === 'clockIn' ? 'Clocked in successfully!' : 'Clocked out successfully!';
    const failureMessage = type === 'clockIn' ? 'Failed to clock in' : 'Failed to clock out';

    try {
      const trustSignals = await this.trustService.getTrustSignals(reasonCode);
      await client.mutation(mutationRef, { trustSignals } as any);
      this.toastService.success(successMessage);
      return;
    } catch (error: any) {
      const message = String(error?.message || '');
      if (message.includes('ATTENDANCE_REASON_REQUIRED')) {
        const reason = window.prompt('This punch was flagged. Provide a short reason to continue:');
        if (!reason || reason.trim().length === 0) {
          this.toastService.warning('Punch was not submitted because no reason was provided');
          return;
        }
        const trustSignals = await this.trustService.getTrustSignals(reasonCode, reason.trim());
        await client.mutation(mutationRef, { trustSignals } as any);
        this.toastService.success(successMessage);
        return;
      }
      if (message.includes('ATTENDANCE_PUNCH_HELD')) {
        this.toastService.warning('Punch is held for supervisor review');
        return;
      }
      this.toastService.error(error?.message || failureMessage);
    }
  }

  async clockIn() {
    this.isClockingIn.set(true);
    try {
      await this.executeClockMutation('clockIn', 'clock_in_widget');
    } finally {
      this.isClockingIn.set(false);
    }
  }

  async clockOut() {
    this.isClockingOut.set(true);
    try {
      await this.executeClockMutation('clockOut', 'clock_out_widget');
    } finally {
      this.isClockingOut.set(false);
    }
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getPercentage(remaining: number, entitled: number): number {
    if (!entitled) return 0;
    return (remaining / entitled) * 100;
  }

  getBadgeVariant(status: string): any {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'cancelled': return 'neutral';
      default: return 'neutral';
    }
  }

  getIconName(status: string): string {
    switch (status) {
      case 'approved': return 'check';
      case 'pending': return 'information-circle'; // Fallback for clock
      case 'rejected': return 'x-mark';
      case 'cancelled': return 'trash'; // Fallback for minus
      default: return 'information-circle';
    }
  }

  getIconBgClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      case 'pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'rejected': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'cancelled': return 'bg-stone-50 dark:bg-stone-700/50 text-stone-600 dark:text-stone-400';
      default: return 'bg-stone-50 dark:bg-stone-700/50 text-stone-600 dark:text-stone-400';
    }
  }

  getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }
}

