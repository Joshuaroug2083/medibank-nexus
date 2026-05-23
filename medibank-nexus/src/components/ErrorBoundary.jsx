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
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

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
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⚠️</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1923', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '.85rem', color: '#4a6580', lineHeight: 1.7, marginBottom: 20 }}>
            An unexpected error occurred in this section. Your data is safe.
            Try refreshing the page or navigating back to the dashboard.
          </p>

          {import.meta.env.DEV && this.state.error && (
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
              {this.state.error.toString()}
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
