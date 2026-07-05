import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { MetricsStateService } from '../services/metrics-state.service';
import { AgentsStateService } from '../../agents/services/agents-state.service';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe],
  template: `
    <div class="metrics-container">
      <div class="header-row">
        <div>
          <h1>System Metrics Dashboard</h1>
          <p class="subtitle font-medium">Real-time performance metrics and diagnostics</p>
        </div>
        
        <div class="header-actions">
          <!-- Agent Filter Dropdown -->
          <div class="filter-wrapper">
            <label for="agent-filter" class="sr-only">Filter by Agent</label>
            <select 
              id="agent-filter"
              class="select-control" 
              [value]="stateService.selectedAgentId() || ''"
              (change)="onAgentFilterChange($any($event).target.value)"
            >
              <option value="">All Agents</option>
              <option *ngFor="let agent of agents()" [value]="agent.id">{{ agent.name }}</option>
            </select>
          </div>

          <!-- Quick Custom Sample Generator Form -->
          <div class="sample-form-inline">
            <select class="select-control compact-select" #newSampleAgent>
              <option *ngFor="let agent of agents()" [value]="agent.id">{{ agent.name }}</option>
            </select>
            <input 
              type="number" 
              placeholder="Val (0-100)" 
              class="compact-input" 
              #newSampleValue 
              min="0" 
              max="100" 
              value="65"
            />
            <button 
              class="btn btn-success" 
              (click)="onAddCustomSample(newSampleAgent.value, newSampleValue.value)"
              title="Add a custom metric sample for the selected agent"
            >
              Add
            </button>
          </div>

          <button 
            class="btn btn-warning-outline" 
            [class.active]="simulatedErrorConfigured()"
            (click)="onSimulateError()" 
            title="Simulate service failure on next reload"
          >
            ⚠️ Sim Error
          </button>

          <button 
            class="btn btn-danger-outline" 
            (click)="onClearMetrics()"
            title="Clear all metrics data"
          >
            🗑️ Clear
          </button>

          <button 
            class="btn btn-success" 
            (click)="onGenerateSample()"
            title="Generate random metric sample"
          >
            ⚡ Quick Gen
          </button>

          <button 
            class="btn btn-primary" 
            (click)="onRefresh()"
            title="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="stateService.loading()" class="loading-overlay">
        <div class="skeleton-grid">
          <div class="skeleton-card" *ngFor="let item of [1, 2, 3, 4]">
            <div class="skeleton-label"></div>
            <div class="skeleton-value"></div>
            <div class="skeleton-sub"></div>
          </div>
        </div>
        <div class="skeleton-charts">
          <div class="skeleton-chart-card"></div>
          <div class="skeleton-chart-card"></div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="stateService.error() && !stateService.loading()" class="error-panel">
        <div class="error-content">
          <svg class="error-icon" viewBox="0 0 24 24" width="64" height="64">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h2>Metrics Loading Failed</h2>
          <p class="error-msg">{{ stateService.error() }}</p>
          <button class="btn btn-primary btn-lg" (click)="onRefresh()">Retry Connection</button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!stateService.loading() && !stateService.error() && stateService.totalCount() === 0" class="empty-panel">
        <div class="empty-content">
          <svg class="empty-icon" viewBox="0 0 24 24" width="64" height="64">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
          </svg>
          <h2>No Performance Data Recorded</h2>
          <p class="empty-msg">There are currently no telemetry samples in the active workspace. Generate random samples or reload default seed data to start monitoring system workloads.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" (click)="onGenerateSample()">Generate Quick Sample</button>
            <button class="btn btn-secondary" (click)="onRestoreDefaultData()">Reload Seed Data</button>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!stateService.loading() && !stateService.error() && stateService.totalCount() > 0" class="dashboard-content">
        
        <!-- Stats Cards Grid -->
        <div class="stats-grid">
          <!-- Card 1: Avg Value -->
          <div class="stat-card">
            <div class="card-inner">
              <span class="stat-label">Average Performance</span>
              <h2 class="stat-value">{{ stateService.averageValue() }}%</h2>
              <span class="stat-desc">Target threshold: &lt; 85%</span>
            </div>
            <div class="card-indicator bg-indigo"></div>
          </div>

          <!-- Card 2: Max Value -->
          <div class="stat-card">
            <div class="card-inner">
              <span class="stat-label">Peak Metric Value</span>
              <h2 class="stat-value">{{ stateService.maxValue() }}%</h2>
              <span class="stat-desc">Highest workload spike</span>
            </div>
            <div class="card-indicator bg-pink"></div>
          </div>

          <!-- Card 3: Min Value -->
          <div class="stat-card">
            <div class="card-inner">
              <span class="stat-label">Minimum Workload</span>
              <h2 class="stat-value">{{ stateService.minValue() }}%</h2>
              <span class="stat-desc">Idling baseline workload</span>
            </div>
            <div class="card-indicator bg-teal"></div>
          </div>

          <!-- Card 4: Total Samples -->
          <div class="stat-card">
            <div class="card-inner">
              <span class="stat-label">Recorded Telemetry</span>
              <h2 class="stat-value">{{ stateService.totalCount() }}</h2>
              <span class="stat-desc">Aggregated data points</span>
            </div>
            <div class="card-indicator bg-amber"></div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Trend Area Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Workload Telemetry History</h3>
              <span class="chart-badge">Live Trend (Last 10)</span>
            </div>
            
            <div class="chart-body">
              <!-- Dynamic Line Chart Graphic using inline SVG -->
              <svg viewBox="0 0 500 130" class="svg-line-chart">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                
                <!-- Grid Lines -->
                <line x1="0" y1="30" x2="500" y2="30" class="grid-line" />
                <line x1="0" y1="65" x2="500" y2="65" class="grid-line" />
                <line x1="0" y1="100" x2="500" y2="100" class="grid-line" />
                
                <!-- Area & Line Paths based on loaded samples -->
                <path *ngIf="chartPoints().length > 0" [attr.d]="svgAreaPath()" fill="url(#chartGrad)" />
                <path *ngIf="chartPoints().length > 0" [attr.d]="svgLinePath()" fill="none" stroke="#4f46e5" stroke-width="3" />
                
                <!-- Points -->
                <circle 
                  *ngFor="let point of chartPoints()" 
                  [attr.cx]="point.cx" 
                  [attr.cy]="point.cy" 
                  r="4" 
                  class="chart-point-dot"
                  [attr.title]="point.value + '%'"
                />
              </svg>

              <!-- Timeline bottom labels -->
              <div class="chart-timeline">
                <span>Older telemetry</span>
                <span>Latest: {{ stateService.latestSample() ? (stateService.latestSample()!.capturedAt | date:'mediumTime') : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Agent Breakdown Bar Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Agent Performance Breakdown</h3>
              <span class="chart-badge">Mean Workloads</span>
            </div>
            
            <div class="chart-body breakdown-body">
              <div class="breakdown-list">
                <div class="breakdown-item" *ngFor="let entry of breakdownEntries()">
                  <div class="item-meta">
                    <span class="agent-name">{{ entry.name }}</span>
                    <span class="agent-val">{{ entry.value }}%</span>
                  </div>
                  <div class="bar-container">
                    <div 
                      class="bar-fill" 
                      [style.width.%]="entry.value"
                      [ngClass]="'state-' + entry.state"
                    ></div>
                  </div>
                </div>
                <div *ngIf="breakdownEntries().length === 0" class="no-breakdown">
                  No individual agents with telemetry found.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Telemetry Samples Table -->
        <div class="recent-table-card">
          <div class="table-header">
            <h3>Recent Telemetry Readings</h3>
            <span class="readings-badge">{{ stateService.filteredSamples().length }} total readings</span>
          </div>
          <div class="table-wrapper">
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Telemetry ID</th>
                  <th>Agent Owner</th>
                  <th>Value</th>
                  <th>Captured Timestamp</th>
                  <th>Status Warning</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of recentSamples()">
                  <td><code>{{ s.id }}</code></td>
                  <td>
                    <div class="agent-cell">
                      <span class="agent-indicator" [ngClass]="'state-' + getAgentState(s.agentId)"></span>
                      {{ getAgentName(s.agentId) }}
                    </div>
                  </td>
                  <td><span class="font-mono font-bold">{{ s.value }}%</span></td>
                  <td>{{ s.capturedAt | date:'medium' }}</td>
                  <td>
                    <span 
                      class="badge" 
                      [ngClass]="s.value > 85 ? 'badge-danger' : s.value > 50 ? 'badge-warning' : 'badge-success'"
                    >
                      {{ s.value > 85 ? 'CRITICAL' : s.value > 50 ? 'WARNING' : 'HEALTHY' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class MetricsDashboardComponent implements OnInit {
  readonly stateService = inject(MetricsStateService);
  readonly agentsService = inject(AgentsStateService);

  readonly simulatedErrorConfigured = signal(false);

  // Expose agents for filters
  readonly agents = this.agentsService.agents;

  ngOnInit(): void {
    // Load agents and metrics on initialization
    this.agentsService.load().subscribe();
    this.stateService.load().subscribe();
  }

  getAgentName(agentId: string): string {
    const agent = this.agents().find(a => a.id === agentId);
    return agent ? agent.name : `Agent ${agentId}`;
  }

  getAgentState(agentId: string): string {
    const agent = this.agents().find(a => a.id === agentId);
    return agent ? agent.state : 'idle';
  }

  onAgentFilterChange(val: string): void {
    this.stateService.selectAgent(val ? val : null);
  }

  onSimulateError(): void {
    this.stateService.triggerNextCallToFail();
    this.simulatedErrorConfigured.set(true);
  }

  onClearMetrics(): void {
    this.stateService.clearSamples().subscribe();
  }

  onGenerateSample(): void {
    const agents = this.agents();
    if (agents.length === 0) return;
    
    // Pick a random agent
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    // Generate a random workload value between 10 and 98
    const randomVal = Math.round((Math.random() * 88 + 10) * 10) / 10;
    
    this.stateService.addSample(randomAgent.id, randomVal).subscribe();
  }

  onAddCustomSample(agentId: string, valueStr: string): void {
    const value = parseFloat(valueStr);
    if (!agentId || isNaN(value) || value < 0 || value > 100) {
      alert('Please select an agent and enter a valid value between 0 and 100.');
      return;
    }
    this.stateService.addSample(agentId, value).subscribe();
  }

  onRestoreDefaultData(): void {
    this.stateService.restoreDefaults().subscribe();
  }

  onRefresh(): void {
    this.simulatedErrorConfigured.set(false);
    this.stateService.load().subscribe();
  }

  // Computed signals for SVG graph
  readonly chartPoints = computed(() => {
    const samples = this.stateService.filteredSamples();
    if (!samples || samples.length === 0) return [];
    
    // Sort chronological: oldest to newest
    const sorted = [...samples].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
    
    // Limit to last 10 samples to fit graph beautifully
    const displaySamples = sorted.slice(-10);
    const count = displaySamples.length;
    
    const width = 440;
    const height = 80;
    const paddingLeft = 30;
    const paddingTop = 20;
    
    return displaySamples.map((s, index) => {
      const cx = paddingLeft + (count > 1 ? (index / (count - 1)) * width : width / 2);
      const val = Math.min(Math.max(s.value, 0), 100);
      const cy = (paddingTop + height) - (val / 100) * height;
      return { cx, cy, value: s.value };
    });
  });

  readonly svgLinePath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].cx} ${points[0].cy} L ${points[0].cx} ${points[0].cy}`;
    }
    
    return points.reduce((path, p, index) => {
      return path + (index === 0 ? `M ${p.cx} ${p.cy}` : ` L ${p.cx} ${p.cy}`);
    }, '');
  });

  readonly svgAreaPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    
    const linePath = this.svgLinePath();
    const first = points[0];
    const last = points[points.length - 1];
    
    const bottomY = 100; // paddingTop (20) + height (80)
    return `${linePath} L ${last.cx} ${bottomY} L ${first.cx} ${bottomY} Z`;
  });

  readonly breakdownEntries = computed(() => {
    const averages = this.stateService.averageByAgent();
    return Object.keys(averages).map(agentId => {
      const agent = this.agents().find(a => a.id === agentId);
      return {
        id: agentId,
        name: agent ? agent.name : `Agent ${agentId}`,
        value: averages[agentId],
        state: agent ? agent.state : 'idle'
      };
    });
  });

  readonly recentSamples = computed(() => {
    const list = this.stateService.filteredSamples();
    // Return latest 5 samples
    return [...list].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime()).slice(0, 5);
  });
}
