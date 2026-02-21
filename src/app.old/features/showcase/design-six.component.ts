import { Component, signal, inject, ElementRef, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-showcase-six',
  standalone: true,
  template: `
    <div class="page" [class.loaded]="loaded()">

      <!-- ═══ NAV ═══ -->
      <nav class="nav">
        <div class="nav-inner">
          <div class="nav-brand"><span class="logo">A</span> Aurum</div>
          <div class="nav-links"><a>Platform</a><a>Solutions</a><a>Pricing</a></div>
          <a class="nav-cta">Get Started</a>
        </div>
      </nav>

      <!-- ═══ HERO ═══ -->
      <section class="hero">
        <div class="hero-glow"></div>
        <div class="hero-content anim" style="--d:0.2s">
          <span class="hero-tag">&#10022; The modern HR platform</span>
          <h1>Precision meets<br><span class="grad">elegance</span></h1>
          <p>Aurum unifies employee management, payroll, attendance, and recruitment into one meticulously crafted platform.</p>
          <div class="hero-actions">
            <a class="btn-fill">Start Free Trial</a>
            <a class="btn-glass">Book Demo</a>
          </div>
        </div>
      </section>

      <!-- ═══ METRICS STRIP ═══ -->
      <section class="strip anim" style="--d:0.8s">
        <div class="strip-inner">
          @for (m of metrics; track m.label) {
            <div class="strip-cell">
              <span class="sc-val">{{ m.value }}</span>
              <span class="sc-lbl">{{ m.label }}</span>
            </div>
          }
        </div>
      </section>

      <!-- ═══ DASHBOARD SECTION ═══ -->
      <section class="dashboard">
        <div class="dash-header reveal">
          <span class="sec-num">01</span>
          <h2>The Admin Dashboard</h2>
          <p>Complete workforce visibility — attendance, leave, payroll, and team health at a glance.</p>
        </div>

        <!-- Dashboard Frame -->
        <div class="dash-frame reveal">
          <div class="df-topbar">
            <span class="df-logo">A</span>
            <span class="df-title">Dashboard</span>
            <span class="df-spacer"></span>
            <span class="df-time">Feb 6, 2026 &middot; 09:14 AM</span>
            <span class="df-avatar">SK</span>
          </div>

          <!-- Stats row -->
          <div class="df-stats">
            @for (s of dashStats; track s.label) {
              <div class="df-stat" [class.hl]="s.highlight">
                <div class="dfs-lbl">{{ s.label }}</div>
                <div class="dfs-val">{{ s.value }}</div>
                <div class="dfs-sub">{{ s.sub }}</div>
              </div>
            }
          </div>

          <!-- Two columns -->
          <div class="df-cols">
            <!-- Employee table -->
            <div class="df-table-section">
              <div class="df-section-head">
                <span>Today's Attendance</span>
                <span class="live-badge">&#9679; Live</span>
              </div>
              <div class="df-thead">
                <span>Employee</span>
                <span>Department</span>
                <span>Status</span>
                <span class="r">Clock In</span>
              </div>
              @for (r of tableRows; track r.name) {
                <div class="df-trow">
                  <span class="df-td-name">
                    <span class="df-av" [style.background]="r.avatarBg">{{ r.initials }}</span>
                    {{ r.name }}
                  </span>
                  <span class="df-td">{{ r.dept }}</span>
                  <span class="df-td">
                    <span class="dot" [style.background]="r.statusColor"></span>
                    {{ r.status }}
                  </span>
                  <span class="df-td r">{{ r.clockIn }}</span>
                </div>
              }
            </div>

            <!-- Leave panel -->
            <div class="df-leave-section">
              <div class="df-section-head">
                <span>Pending Leave</span>
                <span class="count-badge">{{ leaveItems.length }}</span>
              </div>
              @for (l of leaveItems; track l.name) {
                <div class="df-leave-item">
                  <div class="dfl-row">
                    <span class="dfl-av" [style.background]="l.color">{{ l.initials }}</span>
                    <div class="dfl-info">
                      <span class="dfl-name">{{ l.name }}</span>
                      <span class="dfl-dates">{{ l.dates }}</span>
                    </div>
                  </div>
                  <div class="dfl-bottom">
                    <span class="dfl-type">{{ l.type }}</span>
                    <div class="dfl-actions">
                      <button class="dfl-approve">Approve</button>
                      <button class="dfl-deny">Deny</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ PAYROLL SECTION ═══ -->
      <section class="payroll">
        <div class="pay-inner">
          <div class="pay-text reveal">
            <span class="sec-num">02</span>
            <h2>Payroll,<br><span class="grad">demystified</span></h2>
            <p>Tax-compliant salary processing with multi-region support. PAYE, NSSF, NHIF, and Housing Levy — calculated automatically, every cycle.</p>
            <ul class="checks">
              <li>Multi-region statutory deductions</li>
              <li>Configurable salary components</li>
              <li>Automated payslip generation</li>
              <li>Employer contribution tracking</li>
            </ul>
          </div>
          <div class="pay-card reveal">
            <div class="pc-banner">SALARY SLIP</div>
            <div class="pc-meta">
              <span>January 2026</span>
              <span>Aurum Corp</span>
            </div>
            <div class="pc-emp">
              <span class="pc-avatar">JD</span>
              <div>
                <div class="pc-name">James Doe</div>
                <div class="pc-role">Senior Engineer &middot; EMP-0042</div>
              </div>
            </div>
            <div class="pc-grid">
              <div class="pc-col">
                <div class="pc-col-title">Earnings</div>
                <div class="pc-row"><span>Basic Salary</span><span>KES 180,000</span></div>
                <div class="pc-row"><span>Housing Allowance</span><span>KES 30,000</span></div>
                <div class="pc-row"><span>Transport</span><span>KES 15,000</span></div>
                <div class="pc-row total"><span>Gross Pay</span><span>KES 225,000</span></div>
              </div>
              <div class="pc-col">
                <div class="pc-col-title">Deductions</div>
                <div class="pc-row"><span>PAYE Tax</span><span>KES 42,630</span></div>
                <div class="pc-row"><span>NSSF</span><span>KES 2,160</span></div>
                <div class="pc-row"><span>NHIF</span><span>KES 1,700</span></div>
                <div class="pc-row"><span>Housing Levy</span><span>KES 3,375</span></div>
                <div class="pc-row total"><span>Net Pay</span><span>KES 175,135</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ MODULES ═══ -->
      <section class="modules">
        <div class="mod-header reveal">
          <span class="sec-num">03</span>
          <h2>Platform modules</h2>
        </div>
        <div class="mod-grid">
          @for (m of modules; track m.title) {
            <div class="mod-card reveal">
              <div class="mod-num">{{ m.num }}</div>
              <h3>{{ m.title }}</h3>
              <p>{{ m.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- ═══ CTA ═══ -->
      <section class="cta reveal">
        <div class="cta-glass">
          <h2>Ready to modernize your HR?</h2>
          <p>14-day free trial. No credit card. Setup in under 5 minutes.</p>
          <a class="btn-fill btn-lg">Start Free Trial</a>
        </div>
      </section>

      <!-- ═══ FOOTER ═══ -->
      <footer class="foot">
        <span class="foot-brand"><span class="logo sm">A</span> Aurum HRMS</span>
        <span>&copy; 2026 All rights reserved</span>
      </footer>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════
       DESIGN 6 — Glass + Swiss Hybrid
       Dark precision. Glass aesthetic with
       structured data tables & numbered sections
       ══════════════════════════════════════ */

    :host {
      display: block;
      --red: #861821;
      --red-dark: #6b1219;
      --red-glow: rgba(134,24,33,0.4);
      --ink: #0f0f0f;
      --text: #b8b8b8;
      --muted: #666;
      --glass: rgba(255,255,255,0.05);
      --glass-border: rgba(255,255,255,0.08);
      --glass-hover: rgba(255,255,255,0.08);
      --bg: #0b0b0b;
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .page { opacity: 0; transition: opacity .5s; }
    .page.loaded { opacity: 1; }
    .anim { opacity: 0; transform: translateY(20px); }
    .page.loaded .anim {
      opacity: 1; transform: none;
      transition: opacity .8s cubic-bezier(.23,1,.32,1) var(--d,0s),
                  transform .8s cubic-bezier(.23,1,.32,1) var(--d,0s);
    }
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
    .reveal.visible { opacity: 1; transform: none; }

    .grad {
      background: linear-gradient(135deg, #ff4d5a, var(--red), #c73040);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .sec-num { display: block; font-size: .65rem; font-weight: 600; color: var(--red); letter-spacing: .1em; margin-bottom: .75rem; }

    /* ═══ NAV ═══ */
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(11,11,11,.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 56px; }
    .nav-brand { display: flex; align-items: center; gap: .6rem; font-weight: 600; font-size: .9rem; color: #eee; }
    .logo { width: 30px; height: 30px; border-radius: 8px; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .75rem; }
    .logo.sm { width: 22px; height: 22px; border-radius: 6px; font-size: .6rem; }
    .nav-links { display: flex; gap: 1.75rem; }
    .nav-links a { font-size: .78rem; color: var(--muted); cursor: pointer; transition: color .2s; }
    .nav-links a:hover { color: white; }
    .nav-cta { padding: .4rem 1.1rem; border-radius: 8px; background: var(--red); color: white; font-size: .75rem; font-weight: 600; cursor: pointer; }

    /* ═══ HERO ═══ */
    .hero { padding: 9rem 2rem 4rem; text-align: center; position: relative; overflow: hidden; }
    .hero-glow { position: absolute; top: -25%; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, var(--red-glow), transparent 65%); filter: blur(80px); }
    .hero-content { max-width: 620px; margin: 0 auto; position: relative; z-index: 1; }
    .hero-tag { display: inline-block; padding: .35rem 1rem; border-radius: 100px; border: 1px solid var(--glass-border); background: var(--glass); font-size: .68rem; color: var(--muted); margin-bottom: 2rem; backdrop-filter: blur(8px); }
    .hero h1 { font-weight: 600; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.15; color: white; margin: 0 0 1.25rem; }
    .hero p { font-size: .95rem; line-height: 1.7; color: var(--muted); max-width: 460px; margin: 0 auto 2.5rem; }
    .hero-actions { display: flex; gap: .75rem; justify-content: center; }
    .btn-fill { padding: .75rem 1.8rem; border-radius: 10px; background: var(--red); color: white; font-weight: 600; font-size: .82rem; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px var(--red-glow); }
    .btn-fill:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--red-glow); }
    .btn-fill.btn-lg { padding: .9rem 2.4rem; font-size: .88rem; }
    .btn-glass { padding: .75rem 1.8rem; border-radius: 10px; background: var(--glass); border: 1px solid var(--glass-border); color: white; font-weight: 600; font-size: .82rem; cursor: pointer; backdrop-filter: blur(8px); }
    .btn-glass:hover { background: var(--glass-hover); }

    /* ═══ STRIP ═══ */
    .strip { padding: 0 2rem 4rem; }
    .strip-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--glass-border); border-radius: 14px; overflow: hidden; background: var(--glass); backdrop-filter: blur(12px); }
    .strip-cell { padding: 1.5rem; border-right: 1px solid var(--glass-border); text-align: center; }
    .strip-cell:last-child { border-right: none; }
    .sc-val { display: block; font-weight: 700; font-size: 1.5rem; color: white; }
    .sc-lbl { display: block; font-size: .6rem; color: var(--muted); margin-top: .2rem; letter-spacing: .05em; }

    /* ═══ DASHBOARD ═══ */
    .dashboard { padding: 3rem 2rem 5rem; }
    .dash-header { text-align: center; max-width: 500px; margin: 0 auto 3rem; }
    .dash-header h2 { font-weight: 600; font-size: 1.5rem; color: white; margin: 0 0 .5rem; }
    .dash-header p { font-size: .82rem; color: var(--muted); margin: 0; line-height: 1.6; }

    .dash-frame {
      max-width: 1000px; margin: 0 auto;
      background: var(--glass); backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 14px; overflow: hidden;
    }
    .df-topbar { display: flex; align-items: center; gap: .75rem; padding: .7rem 1.25rem; border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02); }
    .df-logo { width: 24px; height: 24px; border-radius: 6px; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .6rem; }
    .df-title { font-weight: 600; font-size: .78rem; color: white; }
    .df-spacer { flex: 1; }
    .df-time { font-size: .6rem; color: var(--muted); }
    .df-avatar { width: 26px; height: 26px; border-radius: 7px; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: .5rem; font-weight: 700; }

    /* Stats */
    .df-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--glass-border); }
    .df-stat { padding: 1.25rem; border-right: 1px solid var(--glass-border); }
    .df-stat:last-child { border-right: none; }
    .df-stat.hl { background: rgba(134,24,33,0.12); }
    .dfs-lbl { font-size: .55rem; font-weight: 500; color: var(--muted); letter-spacing: .05em; margin-bottom: .25rem; }
    .dfs-val { font-weight: 700; font-size: 1.25rem; color: white; }
    .df-stat.hl .dfs-val { color: #ff6b77; }
    .dfs-sub { font-size: .55rem; color: var(--muted); margin-top: .15rem; }

    /* Table + Leave */
    .df-cols { display: grid; grid-template-columns: 1fr 320px; }
    .df-table-section { border-right: 1px solid var(--glass-border); }
    .df-section-head { display: flex; justify-content: space-between; align-items: center; padding: .7rem 1.25rem; border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02); }
    .df-section-head span:first-child { font-size: .65rem; font-weight: 600; color: var(--muted); letter-spacing: .05em; text-transform: uppercase; }
    .live-badge { font-size: .5rem; color: #2dd4bf; letter-spacing: .06em; }
    .count-badge { font-size: .55rem; font-weight: 700; color: var(--red); background: rgba(134,24,33,0.15); padding: .15rem .5rem; border-radius: 100px; }

    .df-thead { display: grid; grid-template-columns: 1.6fr 1fr .8fr .7fr; padding: .5rem 1.25rem; border-bottom: 1px solid var(--glass-border); font-size: .5rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
    .df-trow { display: grid; grid-template-columns: 1.6fr 1fr .8fr .7fr; padding: .55rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: .72rem; align-items: center; transition: background .15s; }
    .df-trow:hover { background: rgba(134,24,33,0.06); }
    .df-trow:last-child { border-bottom: none; }
    .df-td-name { display: flex; align-items: center; gap: .5rem; font-weight: 600; color: white; }
    .df-av { width: 24px; height: 24px; border-radius: 6px; color: white; display: flex; align-items: center; justify-content: center; font-size: .48rem; font-weight: 700; }
    .df-td { color: var(--text); }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: .3rem; }
    .r { text-align: right; }

    /* Leave panel */
    .df-leave-item { padding: .75rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .df-leave-item:last-child { border-bottom: none; }
    .dfl-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .4rem; }
    .dfl-av { width: 24px; height: 24px; border-radius: 6px; color: white; display: flex; align-items: center; justify-content: center; font-size: .48rem; font-weight: 700; }
    .dfl-name { font-size: .72rem; font-weight: 600; color: white; }
    .dfl-dates { font-size: .6rem; color: var(--muted); }
    .dfl-info { display: flex; flex-direction: column; }
    .dfl-bottom { display: flex; justify-content: space-between; align-items: center; margin-left: calc(24px + .5rem); }
    .dfl-type { font-size: .55rem; color: var(--red); font-weight: 500; }
    .dfl-actions { display: flex; gap: .35rem; }
    .dfl-approve { padding: .2rem .55rem; border-radius: 6px; background: var(--red); color: white; border: none; font-size: .5rem; font-weight: 600; cursor: pointer; }
    .dfl-deny { padding: .2rem .55rem; border-radius: 6px; background: transparent; color: var(--muted); border: 1px solid var(--glass-border); font-size: .5rem; font-weight: 600; cursor: pointer; }

    /* ═══ PAYROLL ═══ */
    .payroll { padding: 5rem 2rem; }
    .pay-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .pay-text h2 { font-weight: 600; font-size: clamp(1.5rem, 3.5vw, 2.2rem); line-height: 1.2; color: white; margin: 0 0 1rem; }
    .pay-text > p { font-size: .88rem; color: var(--muted); line-height: 1.7; margin-bottom: 1.5rem; }
    .checks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; }
    .checks li { font-size: .78rem; color: var(--text); padding-left: 1.5rem; position: relative; }
    .checks li::before { content: '\\2713'; position: absolute; left: 0; color: var(--red); font-weight: 700; font-size: .7rem; }

    .pay-card { background: var(--glass); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 14px; overflow: hidden; }
    .pc-banner { background: var(--red); padding: .6rem 1.25rem; font-size: .6rem; font-weight: 700; letter-spacing: .2em; color: white; }
    .pc-meta { display: flex; justify-content: space-between; padding: .5rem 1.25rem; border-bottom: 1px solid var(--glass-border); font-size: .6rem; color: var(--muted); }
    .pc-emp { display: flex; align-items: center; gap: .75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--glass-border); }
    .pc-avatar { width: 34px; height: 34px; border-radius: 8px; background: rgba(134,24,33,0.25); color: #ff6b77; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .6rem; }
    .pc-name { font-weight: 600; font-size: .8rem; color: white; }
    .pc-role { font-size: .6rem; color: var(--muted); }
    .pc-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .pc-col { padding: 1rem 1.25rem; }
    .pc-col:first-child { border-right: 1px solid var(--glass-border); }
    .pc-col-title { font-size: .5rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: .5rem; }
    .pc-row { display: flex; justify-content: space-between; padding: .25rem 0; font-size: .7rem; color: var(--text); }
    .pc-row.total { font-weight: 700; color: white; border-top: 1px solid var(--glass-border); padding-top: .5rem; margin-top: .3rem; }

    /* ═══ MODULES ═══ */
    .modules { padding: 5rem 2rem; }
    .mod-header { max-width: 1000px; margin: 0 auto 3rem; }
    .mod-header h2 { font-weight: 600; font-size: 1.4rem; color: white; margin: 0; }
    .mod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; max-width: 1000px; margin: 0 auto; background: var(--glass-border); border-radius: 14px; overflow: hidden; }
    .mod-card { background: var(--glass); backdrop-filter: blur(8px); padding: 2rem; transition: all .2s; }
    .mod-card:hover { background: rgba(134,24,33,0.08); }
    .mod-num { font-size: .6rem; font-weight: 600; color: var(--red); margin-bottom: .75rem; }
    .mod-card h3 { font-weight: 600; font-size: .88rem; color: white; margin: 0 0 .4rem; }
    .mod-card p { font-size: .72rem; color: var(--muted); line-height: 1.6; margin: 0; }

    /* ═══ CTA ═══ */
    .cta { padding: 3rem 2rem 5rem; }
    .cta-glass { max-width: 700px; margin: 0 auto; text-align: center; padding: 4rem 3rem; border-radius: 20px; background: var(--glass); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); position: relative; overflow: hidden; }
    .cta-glass::before { content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, var(--red-glow), transparent 60%); filter: blur(60px); }
    .cta h2 { font-weight: 600; font-size: clamp(1.3rem, 3vw, 1.8rem); color: white; margin: 0 0 .75rem; position: relative; }
    .cta p { font-size: .82rem; color: var(--muted); margin-bottom: 2rem; position: relative; }

    /* ═══ FOOTER ═══ */
    .foot { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-top: 1px solid var(--glass-border); max-width: 1100px; margin: 0 auto; font-size: .68rem; color: var(--muted); }
    .foot-brand { display: flex; align-items: center; gap: .4rem; font-weight: 600; color: white; }

    @media (max-width: 900px) {
      .nav-links { display: none; }
      .strip-inner { grid-template-columns: repeat(2, 1fr); }
      .df-stats { grid-template-columns: repeat(2, 1fr); }
      .df-cols { grid-template-columns: 1fr; }
      .df-table-section { border-right: none; border-bottom: 1px solid var(--glass-border); }
      .pay-inner { grid-template-columns: 1fr; gap: 2rem; }
      .mod-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .hero h1 { font-size: 2rem; }
      .hero h1 br { display: none; }
      .df-thead, .df-trow { grid-template-columns: 1fr 1fr; }
      .df-thead span:nth-child(3), .df-thead span:nth-child(4), .df-trow span:nth-child(3), .df-trow span:nth-child(4) { display: none; }
      .foot { flex-direction: column; gap: .5rem; }
    }
  `]
})
export class ShowcaseSixComponent {
  private el = inject(ElementRef);
  loaded = signal(false);

  metrics = [
    { value: '10,000+', label: 'Employees Managed' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '150+', label: 'Organizations' },
    { value: '< 50ms', label: 'Sync Latency' },
  ];

  dashStats = [
    { label: 'Total Employees', value: '251', sub: '+12 this month', highlight: false },
    { label: 'Present Today', value: '87%', sub: '218 of 251', highlight: true },
    { label: 'Monthly Payroll', value: 'KES 12.4M', sub: '+3.2% MoM', highlight: false },
    { label: 'Pending Requests', value: '14', sub: '6 urgent', highlight: false },
  ];

  tableRows = [
    { name: 'Amina Hassan', initials: 'AH', avatarBg: '#861821', dept: 'Engineering', status: 'Present', statusColor: '#2dd4bf', clockIn: '08:02' },
    { name: 'Brian Ochieng', initials: 'BO', avatarBg: '#6b5b4f', dept: 'Marketing', status: 'Present', statusColor: '#2dd4bf', clockIn: '08:15' },
    { name: 'Lucy Wanjiku', initials: 'LW', avatarBg: '#2d6a4f', dept: 'Finance', status: 'Late', statusColor: '#f59e0b', clockIn: '09:32' },
    { name: 'David Kimani', initials: 'DK', avatarBg: '#7c3aed', dept: 'Engineering', status: 'Present', statusColor: '#2dd4bf', clockIn: '07:58' },
    { name: 'Sarah Mwende', initials: 'SM', avatarBg: '#861821', dept: 'HR', status: 'Present', statusColor: '#2dd4bf', clockIn: '08:10' },
  ];

  leaveItems = [
    { name: 'Amina Hassan', initials: 'AH', color: '#861821', dates: 'Feb 10–14', type: 'Annual Leave' },
    { name: 'Brian Ochieng', initials: 'BO', color: '#6b5b4f', dates: 'Feb 6', type: 'Sick Leave' },
    { name: 'Lucy Wanjiku', initials: 'LW', color: '#2d6a4f', dates: 'Feb 12–16', type: 'Annual Leave' },
  ];

  modules = [
    { num: '01', title: 'Employee Management', desc: 'Complete profiles — personal, banking, statutory, and documents.' },
    { num: '02', title: 'Time & Attendance', desc: 'Real-time clock in/out with team dashboards.' },
    { num: '03', title: 'Leave Management', desc: 'Automated policies, accrual engines, and approval workflows.' },
    { num: '04', title: 'Payroll Processing', desc: 'Tax-compliant computation with configurable structures.' },
    { num: '05', title: 'Recruitment (ATS)', desc: 'Job postings, candidate pipeline, and tracking.' },
    { num: '06', title: 'Training', desc: 'Course catalogs, enrollments, and completion tracking.' },
  ];

  constructor() {
    afterNextRender(() => {
      this.loaded.set(true);
      const obs = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
        { threshold: 0.08 }
      );
      this.el.nativeElement.querySelectorAll('.reveal').forEach((el: Element) => obs.observe(el));
    });
  }
}
