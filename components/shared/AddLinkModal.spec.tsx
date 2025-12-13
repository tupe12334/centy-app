import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddLinkModal } from './AddLinkModal'
import {
  LinkTargetType,
  type Link as LinkType,
  type LinkTypeInfo,
} from '@/gen/centy_pb'

vi.mock('@/lib/grpc/client', () => ({
  centyClient: {
    getAvailableLinkTypes: vi.fn(),
    listIssues: vi.fn(),
    listDocs: vi.fn(),
    listPrs: vi.fn(),
    createLink: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('@/components/providers/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '@/lib/grpc/client'

const createMockLinkTypeInfo = (
  name: string,
  inverse: string,
  description = ''
): LinkTypeInfo =>
  ({
    name,
    inverse,
    description,
    $typeName: 'centy.LinkTypeInfo' as const,
    $unknown: undefined,
  }) as LinkTypeInfo

describe('AddLinkModal', () => {
  const mockOnClose = vi.fn()
  const mockOnLinkCreated = vi.fn()
  const defaultProps = {
    entityId: 'entity-123',
    entityType: 'issue' as const,
    existingLinks: [] as LinkType[],
    onClose: mockOnClose,
    onLinkCreated: mockOnLinkCreated,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProject.mockReturnValue({
      projectPath: '/test/project',
    })

    // Default mocks
    vi.mocked(centyClient.getAvailableLinkTypes).mockResolvedValue({
      linkTypes: [
        createMockLinkTypeInfo(
          'blocks',
          'blocked-by',
          'This issue blocks another'
        ),
        createMockLinkTypeInfo('related-to', 'related-to', 'Related items'),
      ],
      $typeName: 'centy.GetAvailableLinkTypesResponse',
      $unknown: undefined,
    })

    vi.mocked(centyClient.listIssues).mockResolvedValue({
      issues: [
        {
          id: 'issue-1',
          displayNumber: 1,
          issueNumber: 'issue-1',
          title: 'First Issue',
          description: 'First issue description',
          hasPlan: false,
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
        {
          id: 'issue-2',
          displayNumber: 2,
          issueNumber: 'issue-2',
          title: 'Second Issue',
          description: 'Second issue description',
          hasPlan: false,
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
      ],
      totalCount: 2,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    vi.mocked(centyClient.listDocs).mockResolvedValue({
      docs: [
        {
          slug: 'doc-1',
          title: 'First Doc',
          content: 'First doc content',
          $typeName: 'centy.Doc',
          $unknown: undefined,
        },
      ],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
      $unknown: undefined,
    })

    vi.mocked(centyClient.listPrs).mockResolvedValue({
      prs: [
        {
          id: 'pr-1',
          displayNumber: 100,
          title: 'First PR',
          description: 'First PR description',
          $typeName: 'centy.PullRequest',
          $unknown: undefined,
        },
      ],
      totalCount: 1,
      $typeName: 'centy.ListPrsResponse',
      $unknown: undefined,
    })
  })

  it('should render modal with header and close button', async () => {
    render(<AddLinkModal {...defaultProps} />)

    expect(screen.getByText('Add Link')).toBeInTheDocument()
    expect(screen.getByText('x')).toBeInTheDocument()
  })

  it('should load and display link types', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    // Check that link types are in the dropdown
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(2)
  })

  it('should show loading state while fetching link types', () => {
    vi.mocked(centyClient.getAvailableLinkTypes).mockImplementation(
      () => new Promise(() => {})
    )

    render(<AddLinkModal {...defaultProps} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display target type tabs', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Issues')).toBeInTheDocument()
      expect(screen.getByText('Docs')).toBeInTheDocument()
      expect(screen.getByText('PRs')).toBeInTheDocument()
    })
  })

  it('should switch to docs tab and load docs', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Docs')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Docs'))

    await waitFor(() => {
      expect(centyClient.listDocs).toHaveBeenCalled()
    })
  })

  it('should switch to PRs tab and load PRs', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('PRs')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('PRs'))

    await waitFor(() => {
      expect(centyClient.listPrs).toHaveBeenCalled()
    })
  })

  it('should filter search results based on search query', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
      expect(screen.getByText('#2 - Second Issue')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(
      'Search by title or number...'
    )
    fireEvent.change(searchInput, { target: { value: 'First' } })

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
      expect(screen.queryByText('#2 - Second Issue')).not.toBeInTheDocument()
    })
  })

  it('should exclude self from search results', async () => {
    vi.mocked(centyClient.listIssues).mockResolvedValue({
      issues: [
        {
          id: 'entity-123', // Same as entityId
          displayNumber: 1,
          issueNumber: 'entity-123',
          title: 'Self Issue',
          description: 'Self issue description',
          hasPlan: false,
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
        {
          id: 'other-issue',
          displayNumber: 2,
          issueNumber: 'other-issue',
          title: 'Other Issue',
          description: 'Other issue description',
          hasPlan: false,
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
      ],
      totalCount: 2,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('#1 - Self Issue')).not.toBeInTheDocument()
      expect(screen.getByText('#2 - Other Issue')).toBeInTheDocument()
    })
  })

  it('should select a target item when clicked', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('#1 - First Issue'))

    await waitFor(() => {
      // Should show preview
      expect(screen.getByText('This will create:')).toBeInTheDocument()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    render(<AddLinkModal {...defaultProps} />)

    fireEvent.click(screen.getByText('x'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', async () => {
    render(<AddLinkModal {...defaultProps} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when clicking outside modal', async () => {
    render(<AddLinkModal {...defaultProps} />)

    // Click on overlay
    const overlay = document.querySelector('.link-modal-overlay')
    if (overlay) {
      fireEvent.mouseDown(overlay)
    }

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when pressing Escape', async () => {
    render(<AddLinkModal {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should create link when clicking Create Link button', async () => {
    vi.mocked(centyClient.createLink).mockResolvedValue({
      success: true,
      error: '',
      $typeName: 'centy.CreateLinkResponse',
      $unknown: undefined,
    })

    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
    })

    // Select a target
    fireEvent.click(screen.getByText('#1 - First Issue'))

    // Click create
    const createButton = screen.getByText('Create Link')
    expect(createButton).not.toBeDisabled()
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(centyClient.createLink).toHaveBeenCalled()
      expect(mockOnLinkCreated).toHaveBeenCalled()
    })
  })

  it('should show error when link creation fails', async () => {
    vi.mocked(centyClient.createLink).mockResolvedValue({
      success: false,
      error: 'Link already exists',
      $typeName: 'centy.CreateLinkResponse',
      $unknown: undefined,
    })

    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('#1 - First Issue'))
    fireEvent.click(screen.getByText('Create Link'))

    await waitFor(() => {
      expect(screen.getByText('Link already exists')).toBeInTheDocument()
    })
  })

  it('should disable Create Link button when no target is selected', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      const createButton = screen.getByText('Create Link')
      expect(createButton).toBeDisabled()
    })
  })

  it('should show empty state when no search results', async () => {
    vi.mocked(centyClient.listIssues).mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })

  it('should show link preview with inverse link type', async () => {
    render(<AddLinkModal {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#1 - First Issue')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('#1 - First Issue'))

    await waitFor(() => {
      expect(screen.getByText('Inverse link:')).toBeInTheDocument()
    })
  })

  it('should exclude existing links from search results', async () => {
    const existingLinks: LinkType[] = [
      {
        targetId: 'issue-1',
        targetType: LinkTargetType.ISSUE,
        linkType: 'blocks',
        $typeName: 'centy.Link',
        $unknown: undefined,
      } as LinkType,
    ]

    render(<AddLinkModal {...defaultProps} existingLinks={existingLinks} />)

    await waitFor(() => {
      // issue-1 should be excluded because it already has a 'blocks' link
      expect(screen.queryByText('#1 - First Issue')).not.toBeInTheDocument()
      expect(screen.getByText('#2 - Second Issue')).toBeInTheDocument()
    })
  })
})
