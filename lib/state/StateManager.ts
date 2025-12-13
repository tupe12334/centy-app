import type { Config } from '@/gen/centy_pb'

export interface StateOption {
  value: string
  label: string
  color?: string
}

/**
 * StateManager - Single source of truth for issue state options.
 * Handles default states, custom states from config, colors, and formatting.
 */
export class StateManager {
  private static readonly DEFAULT_STATES = [
    'open',
    'in-progress',
    'closed',
  ] as const

  private static readonly DEFAULT_COLORS: Record<string, string> = {
    open: '#10b981',
    'in-progress': '#f59e0b',
    closed: '#6b7280',
  }

  private static readonly DEFAULT_STATE = 'open'

  private config: Config | null

  constructor(config: Config | null = null) {
    this.config = config
  }

  /**
   * Get the list of allowed states.
   * Returns config states if available, otherwise defaults.
   */
  getAllowedStates(): string[] {
    if (this.config?.allowedStates && this.config.allowedStates.length > 0) {
      return [...this.config.allowedStates]
    }
    return [...StateManager.DEFAULT_STATES]
  }

  /**
   * Get the default state for new issues.
   * Returns config defaultState if available, otherwise 'open'.
   */
  getDefaultState(): string {
    return this.config?.defaultState || StateManager.DEFAULT_STATE
  }

  /**
   * Get the color for a given state.
   * Returns config color if available, otherwise default color, or fallback.
   */
  getStateColor(state: string): string {
    const configColor = this.config?.stateColors?.[state]
    if (configColor) return configColor
    return StateManager.DEFAULT_COLORS[state] || '#888888'
  }

  /**
   * Get all state options formatted for dropdowns/selectors.
   */
  getStateOptions(): StateOption[] {
    const states = this.getAllowedStates()
    return states.map(state => ({
      value: state,
      label: this.formatStateLabel(state),
      color: this.getStateColor(state),
    }))
  }

  /**
   * Format a state value as a display label.
   * e.g., "in-progress" -> "In Progress"
   */
  formatStateLabel(state: string): string {
    return state
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Get the CSS class for a state.
   * Returns 'status-custom' if config has custom color, otherwise status-{state}.
   */
  getStateClass(state: string): string {
    if (this.config?.stateColors?.[state]) {
      return 'status-custom'
    }
    switch (state) {
      case 'open':
        return 'status-open'
      case 'in-progress':
        return 'status-in-progress'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  /**
   * Check if a state value is valid for this config.
   */
  isValidState(state: string): boolean {
    return this.getAllowedStates().includes(state)
  }

  /**
   * Get default colors (useful for StateListEditor).
   */
  static getDefaultColors(): Record<string, string> {
    return { ...StateManager.DEFAULT_COLORS }
  }

  /**
   * Get default states (useful for initialization).
   */
  static getDefaultStates(): readonly string[] {
    return StateManager.DEFAULT_STATES
  }
}
