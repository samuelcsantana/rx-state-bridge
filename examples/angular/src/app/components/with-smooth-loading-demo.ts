import { Component, signal } from '@angular/core';
import { withSmoothLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fake-api';

@Component({
  selector: 'app-with-smooth-loading-demo',
  imports: [],
  templateUrl: './with-smooth-loading-demo.html',
})
export class WithSmoothLoadingDemo {
  fastLoading = signal(false);
  slowLoading = signal(false);

  runFast(): void {
    fetchUser$(2, { latency: 120 }).pipe(withSmoothLoading(this.fastLoading, 500)).subscribe();
  }

  runSlow(): void {
    fetchUser$(3, { latency: 1200 }).pipe(withSmoothLoading(this.slowLoading, 500)).subscribe();
  }
}
