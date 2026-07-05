import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MetricSample } from '../../../core/models/domain.models';

const STORAGE_KEY = 'jg_metrics';

const INITIAL_SAMPLES: MetricSample[] = [
  { id: 'm1', agentId: '1', value: 45.2, capturedAt: new Date(Date.now() - 3600000 * 5) },
  { id: 'm2', agentId: '1', value: 48.7, capturedAt: new Date(Date.now() - 3600000 * 4) },
  { id: 'm3', agentId: '1', value: 50.1, capturedAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'm4', agentId: '1', value: 52.3, capturedAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'm5', agentId: '1', value: 47.9, capturedAt: new Date(Date.now() - 3600000 * 1) },

  { id: 'm6', agentId: '2', value: 80.5, capturedAt: new Date(Date.now() - 3600000 * 5) },
  { id: 'm7', agentId: '2', value: 82.1, capturedAt: new Date(Date.now() - 3600000 * 4) },
  { id: 'm8', agentId: '2', value: 85.4, capturedAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'm9', agentId: '2', value: 89.0, capturedAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'm10', agentId: '2', value: 88.3, capturedAt: new Date(Date.now() - 3600000 * 1) },

  { id: 'm11', agentId: '3', value: 12.0, capturedAt: new Date(Date.now() - 3600000 * 4) },
  { id: 'm12', agentId: '3', value: 15.3, capturedAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'm13', agentId: '3', value: 14.1, capturedAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'm14', agentId: '3', value: 16.5, capturedAt: new Date(Date.now() - 3600000 * 1) },

  { id: 'm15', agentId: '4', value: 0.0, capturedAt: new Date(Date.now() - 3600000 * 5) },
  { id: 'm16', agentId: '4', value: 1.2, capturedAt: new Date(Date.now() - 3600000 * 4) },
  { id: 'm17', agentId: '4', value: 3.5, capturedAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'm18', agentId: '4', value: 7.8, capturedAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'm19', agentId: '4', value: 12.4, capturedAt: new Date(Date.now() - 3600000 * 1) }
];

@Injectable({ providedIn: 'root' })
export class MetricsStateService {
  readonly #samples = signal<MetricSample[]>([]);
  readonly #loading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #selectedAgentId = signal<string | null>(null);

  readonly samples = this.#samples.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly selectedAgentId = this.#selectedAgentId.asReadonly();

  private shouldFailNext = false;

  constructor() {
    this.load().subscribe();
  }

  // Computed signals
  readonly filteredSamples = computed(() => {
    const list = this.#samples();
    const agentId = this.#selectedAgentId();
    if (!agentId) return list;
    return list.filter(s => s.agentId === agentId);
  });

  readonly totalCount = computed(() => this.filteredSamples().length);

  readonly averageValue = computed(() => {
    const list = this.filteredSamples();
    if (!list.length) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly maxValue = computed(() => {
    const list = this.filteredSamples();
    if (!list.length) return 0;
    return Math.max(...list.map(s => s.value));
  });

  readonly minValue = computed(() => {
    const list = this.filteredSamples();
    if (!list.length) return 0;
    return Math.min(...list.map(s => s.value));
  });

  readonly latestSample = computed(() => {
    const list = this.filteredSamples();
    if (!list.length) return null;
    return [...list].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0];
  });

  readonly samplesByAgent = computed(() => {
    const list = this.#samples();
    const groups: Record<string, MetricSample[]> = {};
    list.forEach(s => {
      if (!groups[s.agentId]) {
        groups[s.agentId] = [];
      }
      groups[s.agentId].push(s);
    });
    return groups;
  });

  readonly averageByAgent = computed(() => {
    const groups = this.samplesByAgent();
    const averages: Record<string, number> = {};
    Object.keys(groups).forEach(agentId => {
      const group = groups[agentId];
      const sum = group.reduce((acc, curr) => acc + curr.value, 0);
      averages[agentId] = Math.round((sum / group.length) * 10) / 10;
    });
    return averages;
  });

  triggerNextCallToFail(): void {
    this.shouldFailNext = true;
  }

  selectAgent(agentId: string | null): void {
    this.#selectedAgentId.set(agentId);
  }

  load(): Observable<MetricSample[]> {
    this.#loading.set(true);
    this.#error.set(null);

    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      const err = new Error('Database connection failure: Metrics store is offline (HTTP 503)');
      this.#loading.set(false);
      this.#error.set(err.message);
      return throwError(() => err);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: MetricSample[];
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        list = parsed.map(s => ({
          ...s,
          capturedAt: new Date(s.capturedAt)
        }));
      } else {
        list = INITIAL_SAMPLES;
        this.saveToStorage(list);
      }

      return of(list).pipe(
        delay(600),
        tap({
          next: (loadedList) => {
            this.#samples.set(loadedList);
            this.#loading.set(false);
          },
          error: (err: any) => {
            this.#error.set(err.message || 'Error loading metrics');
            this.#loading.set(false);
          }
        })
      );
    } catch (err: any) {
      this.#error.set(err.message || 'Error loading metrics');
      this.#loading.set(false);
      return throwError(() => err);
    }
  }

  addSample(agentId: string, value: number): Observable<MetricSample> {
    this.#loading.set(true);
    this.#error.set(null);

    const newSample: MetricSample = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      agentId,
      value: Math.round(value * 10) / 10,
      capturedAt: new Date()
    };

    const updatedList = [...this.#samples(), newSample];
    this.#samples.set(updatedList);
    this.saveToStorage(updatedList);

    return of(newSample).pipe(
      delay(300),
      tap({
        next: () => {
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error adding metric sample');
          this.#loading.set(false);
        }
      })
    );
  }

  clearSamples(): Observable<void> {
    this.#loading.set(true);
    this.#error.set(null);

    this.#samples.set([]);
    this.saveToStorage([]);

    return of(undefined).pipe(
      delay(300),
      tap({
        next: () => {
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error clearing metrics');
          this.#loading.set(false);
        }
      })
    );
  }

  restoreDefaults(): Observable<MetricSample[]> {
    this.#loading.set(true);
    this.#error.set(null);

    this.#samples.set(INITIAL_SAMPLES);
    this.saveToStorage(INITIAL_SAMPLES);

    return of(INITIAL_SAMPLES).pipe(
      delay(400),
      tap({
        next: () => {
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error restoring default metrics');
          this.#loading.set(false);
        }
      })
    );
  }

  private saveToStorage(list: MetricSample[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage is not available to persist metrics', e);
    }
  }
}
