// TODO: Uncomment when @sentry/nextjs is installed
// import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry error tracking
 * TODO: Add Sentry DSN after creating project
 */
export function initSentry() {
  // TODO: Implement when Sentry is installed
  console.log('Sentry initialization skipped - package not installed');
  
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.init({
  //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //     environment: process.env.NODE_ENV,
      
  //     // Performance Monitoring
  //     tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
  //     // Session Replay
  //     replaysSessionSampleRate: 0.1,
  //     replaysOnErrorSampleRate: 1.0,
      
  //     // Integrations
  //     integrations: [
  //       Sentry.replayIntegration({
  //         maskAllText: false,
  //         blockAllMedia: false,
  //       }),
  //     ],
      
  //     // Filter out known errors
  //     beforeSend(event, hint) {
  //       // Filter out non-critical errors
  //       if (event.exception) {
  //         const error = hint.originalException;
          
  //         // Ignore network errors that might be from ad blockers
  //         if (error?.message?.includes('Failed to fetch')) {
  //           return null;
  //         }
          
  //         // Ignore ResizeObserver errors
  //         if (error?.message?.includes('ResizeObserver')) {
  //           return null;
  //         }
  //       }
        
  //       return event;
  //     },
  //   });
  // }
}

/**
 * Custom error boundary error handler
 */
export function logErrorToSentry(error: Error, errorInfo: React.ErrorInfo) {
  // TODO: Implement when Sentry is installed
  console.error('Error boundary caught:', error, errorInfo);
  
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.withScope((scope) => {
  //     scope.setContext('errorInfo', errorInfo);
  //     Sentry.captureException(error);
  //   });
  // } else {
  //   console.error('Error boundary caught:', error, errorInfo);
  // }
}