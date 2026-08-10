import { Component } from 'react';

/**
 * React Error Boundary — catches render/lifecycle crashes.
 * Wraps the whole app shell so a broken page never takes down the entire UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <AppShell />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidMount() {
    window.addEventListener('online', this.handleConnectionChange);
    window.addEventListener('offline', this.handleConnectionChange);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
  }

  handleConnectionChange = () => {
    this.setState({ isOnline: navigator.onLine });
  };

  render() {
    const { hasError, error, isOnline } = this.state;
    if (!hasError) return this.props.children;

    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '100vh',
        padding:        24,
        background:     '#f0f5fa',
        fontFamily:     'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          background:   'white',
          borderRadius: 16,
          padding:      '36px 40px',
          maxWidth:     460,
          width:        '100%',
          boxShadow:    '0 4px 32px rgba(10,40,80,.10)',
          textAlign:    'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>
            {!isOnline ? '🌐' : '⚠️'}
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1923', marginBottom: 8 }}>
            {!isOnline ? 'Connection Lost' : 'Something went wrong'}
          </h2>
          <p style={{ fontSize: '.85rem', color: '#4a6580', lineHeight: 1.7, marginBottom: 20 }}>
            {!isOnline
              ? 'You are currently offline. MediBank Nexus requires an active internet connection. Please check your connection and try again.'
              : 'An unexpected error occurred in this section. Your data is safe. Try refreshing the page or navigating back to the dashboard.'}
          </p>

          {!isOnline && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fee2e2',
              color: '#ef4444',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: 20
            }}>
              <span style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
              Offline Mode
            </div>
          )}

          {isOnline && import.meta.env.DEV && error && (
            <pre style={{
              background:   '#f8fafc',
              border:       '1px solid #e2e8f0',
              borderRadius: 8,
              padding:      12,
              fontSize:     '.72rem',
              color:        '#c0392b',
              textAlign:    'left',
              overflow:     'auto',
              maxHeight:    160,
              marginBottom: 20,
            }}>
              {error.toString()}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding:      '9px 20px',
                borderRadius: 8,
                border:       '1px solid #0a6ebd',
                background:   '#0a6ebd',
                color:        'white',
                fontWeight:   700,
                fontSize:     '.85rem',
                cursor:       'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding:      '9px 20px',
                borderRadius: 8,
                border:       '1px solid #e2e8f0',
                background:   'white',
                color:        '#4a6580',
                fontWeight:   600,
                fontSize:     '.85rem',
                cursor:       'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
