import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MetricsStateService } from './metrics-state.service';
import { MetricSample } from '../../../core/models/domain.models';

describe('MetricsStateService', () => {
  let service: MetricsStateService;
  const STORAGE_KEY = 'jg_metrics';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should be created and load initial seed data', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    expect(service).toBeTruthy();
    expect(service.loading()).toBeTrue();

    tick(600); // Complete initial load
    expect(service.loading()).toBeFalse();
    expect(service.samples().length).toBe(19); // 19 initial samples in seed data
    expect(service.error()).toBeNull();
  }));

  it('should load metrics from localStorage if available', fakeAsync(() => {
    const mockSamples: MetricSample[] = [
      { id: 'm_spec1', agentId: '2', value: 99.5, capturedAt: new Date() }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSamples));

    service = TestBed.inject(MetricsStateService);
    tick(600);

    expect(service.samples().length).toBe(1);
    expect(service.samples()[0].value).toBe(99.5);
    expect(service.samples()[0].agentId).toBe('2');
  }));

  it('should calculate computed signals correctly', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    // All samples stats (unfiltered)
    expect(service.totalCount()).toBe(19);
    expect(service.maxValue()).toBe(89.0);
    expect(service.minValue()).toBe(0.0);
    expect(service.averageValue()).toBeGreaterThan(0);
  }));

  it('should filter by selected agent ID and recalculate stats', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    // Select Agent Beta (ID 2), which has values: 80.5, 82.1, 85.4, 89.0, 88.3
    service.selectAgent('2');
    
    expect(service.selectedAgentId()).toBe('2');
    expect(service.totalCount()).toBe(5);
    expect(service.minValue()).toBe(80.5);
    expect(service.maxValue()).toBe(89.0);
    // Average: (80.5 + 82.1 + 85.4 + 89.0 + 88.3) / 5 = 425.3 / 5 = 85.06 -> rounded 85.1
    expect(service.averageValue()).toBe(85.1);

    // Reset filter
    service.selectAgent(null);
    expect(service.totalCount()).toBe(19);
  }));

  it('should add a new sample', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    const initialCount = service.samples().length;
    let addedSample: MetricSample | undefined;

    service.addSample('1', 55.5).subscribe(sample => {
      addedSample = sample;
    });

    expect(service.loading()).toBeTrue();
    tick(300); // Complete addSample delay

    expect(service.loading()).toBeFalse();
    expect(addedSample).toBeDefined();
    expect(addedSample?.value).toBe(55.5);
    expect(service.samples().length).toBe(initialCount + 1);

    // Check storage persistence
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('55.5');
  }));

  it('should clear samples', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    expect(service.samples().length).toBe(19);

    service.clearSamples().subscribe();
    tick(300); // Complete clearSamples delay

    expect(service.samples().length).toBe(0);
    expect(service.totalCount()).toBe(0);
    expect(service.averageValue()).toBe(0);

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe('[]');
  }));

  it('should restore default samples', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    service.clearSamples().subscribe();
    tick(300);
    expect(service.samples().length).toBe(0);

    service.restoreDefaults().subscribe();
    tick(400); // Complete restoreDefaults delay
    expect(service.samples().length).toBe(19);
  }));

  it('should handle load error when triggerNextCallToFail is set', fakeAsync(() => {
    service = TestBed.inject(MetricsStateService);
    tick(600); // Initial load

    // Trigger failure for next load
    service.triggerNextCallToFail();

    let errorOccurred = false;
    service.load().subscribe({
      error: () => {
        errorOccurred = true;
      }
    });

    // No tick needed because error is thrown synchronously before delay in triggerNextCallToFail branch
    expect(errorOccurred).toBeTrue();
    expect(service.error()).toContain('offline');
    expect(service.loading()).toBeFalse();
  }));
});
