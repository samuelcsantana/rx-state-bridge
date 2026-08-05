import { Component } from '@angular/core';
import { WithLoadingDemo } from './components/with-loading-demo';
import { WithSmoothLoadingDemo } from './components/with-smooth-loading-demo';
import { CatchToStateDemo } from './components/catch-to-state-demo';
import { WithTemporarySuccessDemo } from './components/with-temporary-success-demo';
import { BindRequestStateDemo } from './components/bind-request-state-demo';
import { CombineLoadingDemo } from './components/combine-loading-demo';

@Component({
  selector: 'app-root',
  imports: [
    WithLoadingDemo,
    WithSmoothLoadingDemo,
    CatchToStateDemo,
    WithTemporarySuccessDemo,
    BindRequestStateDemo,
    CombineLoadingDemo,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
