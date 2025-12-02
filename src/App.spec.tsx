import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock the centyClient
vi.mock('./api/client.ts', () => ({
  centyClient: {
    init: vi.fn(),
    getReconciliationPlan: vi.fn(),
    executeReconciliation: vi.fn(),
    isInitialized: vi.fn(),
    listIssues: vi.fn(),
    getIssue: vi.fn(),
    createIssue: vi.fn(),
    updateIssue: vi.fn(),
    deleteIssue: vi.fn(),
  },
}))

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  it('should render the header', () => {
    renderWithRouter()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Centy')
  })

  it('should render the tagline', () => {
    renderWithRouter()
    expect(
      screen.getByText('Local-first issue and documentation tracker')
    ).toBeInTheDocument()
  })

  it('should render the InitProject component on home route', () => {
    renderWithRouter('/')
    expect(screen.getByText('Initialize Centy Project')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    renderWithRouter()
    expect(screen.getByRole('link', { name: 'Init' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Issues' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create Issue' })
    ).toBeInTheDocument()
  })
})
