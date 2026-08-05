import { Component, signal } from '@angular/core';
import { withLoading, withTemporarySuccess } from 'rx-state-bridge';
import { fetchUser$ } from '../fake-api';

@Component({
  selector: 'app-with-temporary-success-demo',
  imports: [],
  templateUrl: './with-temporary-success-demo.html',
})
export class WithTemporarySuccessDemo {
  loading = signal(false);
  saved = signal(false);

  run(): void {
    fetchUser$(5, { latency: 500 })
      .pipe(withLoading(this.loading), withTemporarySuccess(this.saved, 2000))
      .subscribe();
  }
}
