import { Injectable, signal } from '@angular/core';
import { MetricSample } from '../../../core/models/domain.models';

@Injectable({ providedIn: 'root' })
export class MetricsStateService {
  readonly samples = signal<MetricSample[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
}
