import { Component, type ReactNode } from 'react'
import { ErrorState } from '../../design-system'
import { AppError, isAppError, toAppError, toUserMessage } from '../../lib/errors'

export interface ApiErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
}

interface ApiErrorBoundaryState {
  error: AppError | null
  requestId: string | null
}

export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  state: ApiErrorBoundaryState = { error: null, requestId: null }

  static getDerivedStateFromError(error: unknown): ApiErrorBoundaryState {
    const appError = isAppError(error) ? error : toAppError(error)
    return { error: appError, requestId: appError.requestId }
  }

  private handleRetry = () => {
    this.setState({ error: null, requestId: null })
    this.props.onRetry?.()
  }

  render() {
    const { error, requestId } = this.state
    if (!error) return this.props.children
    return (
      <ErrorState
        title={error.title ?? 'Une erreur est survenue'}
        description={
          <>
            {toUserMessage(error)}
            {requestId ? ` — Référence : ${requestId}` : null}
          </>
        }
        onRetry={this.handleRetry}
      />
    )
  }
}