import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { Settings } from './Settings'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    getConfig: vi.fn(),
    getManifest: vi.fn(),
    getDaemonInfo: vi.fn(),
    getProjectVersion: vi.fn(),
    updateVersion: vi.fn(),
    shutdown: vi.fn(),
    restart: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '../api/client.ts'

const createMockConfig = () => ({
  priorityLevels: 3,
  defaultState: 'open',
  allowedStates: ['open', 'in-progress', 'closed'],
  customFields: [],
  defaults: {},
  version: '0.1.0',
  $typeName: 'centy.Config' as const,
  $unknown: undefined,
})

const createMockManifest = () => ({
  schemaVersion: 1,
  centyVersion: '0.1.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-16T10:00:00Z',
  managedFiles: [
    {
      path: '.centy/config.toml',
      hash: 'abc123',
      version: '0.1.0',
      createdAt: '2024-01-15T10:00:00Z',
      fileType: 1,
      $typeName: 'centy.ManagedFile' as const,
      $unknown: undefined,
    },
  ],
  $typeName: 'centy.Manifest' as const,
  $unknown: undefined,
})

const createMockDaemonInfo = () => ({
  version: '0.1.0',
  availableVersions: ['0.1.0', '0.2.0'],
  $typeName: 'centy.DaemonInfo' as const,
  $unknown: undefined,
})

const createMockVersionInfo = (comparison = 'equal') => ({
  projectVersion: '0.1.0',
  daemonVersion: '0.1.0',
  comparison,
  degradedMode: false,
  $typeName: 'centy.ProjectVersionInfo' as const,
  $unknown: undefined,
})

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: vi.fn(),
    })

    // Default mock for daemon info
    vi.mocked(centyClient.getDaemonInfo).mockResolvedValue(
      createMockDaemonInfo()
    )
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )
  }

  it('should render the page header', () => {
    renderComponent()

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should show daemon info section', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Daemon Information')).toBeInTheDocument()
      expect(screen.getByText('0.1.0')).toBeInTheDocument()
    })
  })

  it('should show daemon control buttons', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
      expect(screen.getByText('Shutdown Daemon')).toBeInTheDocument()
    })
  })

  it('should show message when no project is selected', () => {
    renderComponent()

    expect(
      screen.getByText(
        'Select a project from the header to view project settings'
      )
    ).toBeInTheDocument()
  })

  it('should show error when project is not initialized', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: false,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    expect(
      screen.getByText('Centy is not initialized in this directory')
    ).toBeInTheDocument()
  })

  it('should load project data when initialized', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(createMockVersionInfo())

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Version Management')).toBeInTheDocument()
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Manifest')).toBeInTheDocument()
    })
  })

  it('should display config details', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(createMockVersionInfo())

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Priority Levels:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Default State:')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
    })
  })

  it('should display custom fields when present', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue({
      ...createMockConfig(),
      customFields: [
        {
          name: 'assignee',
          fieldType: 'string',
          required: true,
          defaultValue: 'unassigned',
          enumValues: [],
          $typeName: 'centy.CustomFieldDefinition' as const,
          $unknown: undefined,
        },
      ],
    })
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(createMockVersionInfo())

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Custom Fields:')).toBeInTheDocument()
      expect(screen.getByText(/assignee/)).toBeInTheDocument()
    })
  })

  it('should display manifest details', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(createMockVersionInfo())

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Schema Version')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Managed Files (1)')).toBeInTheDocument()
    })
  })

  it('should show update available status', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(
      createMockVersionInfo('project_behind')
    )

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Update available')).toBeInTheDocument()
    })
  })

  it('should show degraded mode warning', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue({
      ...createMockVersionInfo('project_ahead'),
      degradedMode: true,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/degraded mode/i)).toBeInTheDocument()
    })
  })

  it('should handle version update', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)
    const mockUpdateVersion = vi.mocked(centyClient.updateVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(
      createMockVersionInfo('project_behind')
    )
    mockUpdateVersion.mockResolvedValue({
      success: true,
      fromVersion: '0.1.0',
      toVersion: '0.2.0',
      migrationsApplied: ['migration1'],
      error: '',
      $typeName: 'centy.UpdateVersionResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText(/Update to version/)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Update to version/)
    fireEvent.change(select, { target: { value: '0.2.0' } })

    const updateBtn = screen.getByText('Update')
    fireEvent.click(updateBtn)

    await waitFor(() => {
      expect(mockUpdateVersion).toHaveBeenCalled()
      expect(
        screen.getByText(/Updated from 0.1.0 to 0.2.0/)
      ).toBeInTheDocument()
    })
  })

  it('should show error when update fails', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)
    const mockUpdateVersion = vi.mocked(centyClient.updateVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(
      createMockVersionInfo('project_behind')
    )
    mockUpdateVersion.mockResolvedValue({
      success: false,
      fromVersion: '',
      toVersion: '',
      migrationsApplied: [],
      error: 'Migration failed',
      $typeName: 'centy.UpdateVersionResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText(/Update to version/)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Update to version/)
    fireEvent.change(select, { target: { value: '0.2.0' } })

    fireEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(screen.getByText('Migration failed')).toBeInTheDocument()
    })
  })

  it('should show restart confirmation dialog', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restart Daemon'))

    expect(
      screen.getByText('Are you sure you want to restart the daemon?')
    ).toBeInTheDocument()
  })

  it('should cancel restart', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restart Daemon'))
    fireEvent.click(screen.getByText('Cancel'))

    expect(
      screen.queryByText('Are you sure you want to restart the daemon?')
    ).not.toBeInTheDocument()
  })

  it('should restart daemon', async () => {
    const mockRestart = vi.mocked(centyClient.restart)
    mockRestart.mockResolvedValue({
      success: true,
      message: 'Daemon restarting',
      $typeName: 'centy.RestartResponse',
      $unknown: undefined,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restart Daemon'))
    fireEvent.click(screen.getByText('Yes, Restart'))

    await waitFor(() => {
      expect(mockRestart).toHaveBeenCalled()
      expect(screen.getByText('Daemon restarting')).toBeInTheDocument()
    })
  })

  it('should show shutdown confirmation dialog', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Shutdown Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Shutdown Daemon'))

    expect(
      screen.getByText(/Are you sure you want to shutdown the daemon/)
    ).toBeInTheDocument()
  })

  it('should shutdown daemon', async () => {
    const mockShutdown = vi.mocked(centyClient.shutdown)
    mockShutdown.mockResolvedValue({
      success: true,
      message: 'Daemon shutting down',
      $typeName: 'centy.ShutdownResponse',
      $unknown: undefined,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Shutdown Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Shutdown Daemon'))
    fireEvent.click(screen.getByText('Yes, Shutdown'))

    await waitFor(() => {
      expect(mockShutdown).toHaveBeenCalled()
      expect(screen.getByText('Daemon shutting down')).toBeInTheDocument()
    })
  })

  it('should handle network error on project data fetch', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    mockGetConfig.mockRejectedValue(new Error('Connection refused'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument()
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    mockGetConfig.mockRejectedValue('string error')

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should handle restart failure', async () => {
    const mockRestart = vi.mocked(centyClient.restart)
    mockRestart.mockResolvedValue({
      success: false,
      message: '',
      $typeName: 'centy.RestartResponse',
      $unknown: undefined,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restart Daemon'))
    fireEvent.click(screen.getByText('Yes, Restart'))

    await waitFor(() => {
      expect(screen.getByText('Failed to restart daemon')).toBeInTheDocument()
    })
  })

  it('should handle shutdown failure', async () => {
    const mockShutdown = vi.mocked(centyClient.shutdown)
    mockShutdown.mockResolvedValue({
      success: false,
      message: '',
      $typeName: 'centy.ShutdownResponse',
      $unknown: undefined,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Shutdown Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Shutdown Daemon'))
    fireEvent.click(screen.getByText('Yes, Shutdown'))

    await waitFor(() => {
      expect(screen.getByText('Failed to shutdown daemon')).toBeInTheDocument()
    })
  })

  it('should handle restart network error', async () => {
    const mockRestart = vi.mocked(centyClient.restart)
    mockRestart.mockRejectedValue(new Error('Network error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restart Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restart Daemon'))
    fireEvent.click(screen.getByText('Yes, Restart'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle shutdown network error', async () => {
    const mockShutdown = vi.mocked(centyClient.shutdown)
    mockShutdown.mockRejectedValue(new Error('Network error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Shutdown Daemon')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Shutdown Daemon'))
    fireEvent.click(screen.getByText('Yes, Shutdown'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should check initialization when project path changes', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    const setIsInitialized = vi.fn()
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized,
    })

    renderComponent()

    await waitFor(
      () => {
        expect(mockIsInitialized).toHaveBeenCalled()
      },
      { timeout: 500 }
    )
  })

  it('should handle update network error', async () => {
    const mockGetConfig = vi.mocked(centyClient.getConfig)
    const mockGetManifest = vi.mocked(centyClient.getManifest)
    const mockGetProjectVersion = vi.mocked(centyClient.getProjectVersion)
    const mockUpdateVersion = vi.mocked(centyClient.updateVersion)

    mockGetConfig.mockResolvedValue(createMockConfig())
    mockGetManifest.mockResolvedValue(createMockManifest())
    mockGetProjectVersion.mockResolvedValue(
      createMockVersionInfo('project_behind')
    )
    mockUpdateVersion.mockRejectedValue(new Error('Network error'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText(/Update to version/)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Update to version/)
    fireEvent.change(select, { target: { value: '0.2.0' } })

    fireEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
