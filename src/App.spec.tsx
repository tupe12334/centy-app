import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { ProjectProvider } from './context/ProjectContext'

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
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </MemoryRouter>
  )
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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
    expect(screen.getByRole('link', { name: 'Issues' })).toBeInTheDocument()
  })
})
