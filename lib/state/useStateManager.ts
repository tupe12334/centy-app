'use client'

import { useMemo } from 'react'
import { useConfig } from '@/hooks/useConfig'
import { StateManager } from './StateManager'

/**
 * React hook that provides a StateManager instance with current config.
 */
export function useStateManager(): StateManager {
  const { config } = useConfig()
  return useMemo(() => new StateManager(config), [config])
}
