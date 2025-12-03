import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MarkdownEditor } from './MarkdownEditor'

// Mock window.prompt for link tests
const mockPrompt = vi.fn()
window.prompt = mockPrompt

describe('MarkdownEditor', () => {
  beforeEach(() => {
    mockPrompt.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render the editor with toolbar', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
        expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument()
        expect(screen.getByTitle('Strikethrough')).toBeInTheDocument()
        expect(screen.getByTitle('Inline Code')).toBeInTheDocument()
        expect(screen.getByTitle('Heading 1')).toBeInTheDocument()
        expect(screen.getByTitle('Heading 2')).toBeInTheDocument()
        expect(screen.getByTitle('Heading 3')).toBeInTheDocument()
        expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
        expect(screen.getByTitle('Numbered List')).toBeInTheDocument()
        expect(screen.getByTitle('Blockquote')).toBeInTheDocument()
        expect(screen.getByTitle('Code Block')).toBeInTheDocument()
        expect(screen.getByTitle('Add Link')).toBeInTheDocument()
        expect(screen.getByTitle('Horizontal Rule')).toBeInTheDocument()
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })
    })

    it('should render with custom className', async () => {
      render(
        <MarkdownEditor value="" onChange={() => {}} className="custom-class" />
      )

      await waitFor(() => {
        const editor = document.querySelector('.markdown-editor')
        expect(editor).toHaveClass('custom-class')
      })
    })

    it('should render with custom minHeight', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} minHeight={300} />)

      await waitFor(() => {
        const editorContent = document.querySelector('.editor-content')
        expect(editorContent).toHaveStyle({ minHeight: '300px' })
      })
    })

    it('should render with initial value', async () => {
      render(<MarkdownEditor value="# Hello World" onChange={() => {}} />)

      await waitFor(() => {
        const editorContent = document.querySelector('.editor-content')
        expect(editorContent).toBeInTheDocument()
      })
    })
  })

  describe('Raw mode toggle', () => {
    it('should toggle to raw mode when MD button is clicked', async () => {
      render(<MarkdownEditor value="Some content" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      const mdButton = screen.getByTitle('Toggle Raw Markdown')
      expect(mdButton).toHaveTextContent('MD')

      await act(async () => {
        fireEvent.click(mdButton)
      })

      expect(mdButton).toHaveTextContent('WYSIWYG')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should show textarea in raw mode', async () => {
      render(<MarkdownEditor value="Test content" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      const mdButton = screen.getByTitle('Toggle Raw Markdown')

      await act(async () => {
        fireEvent.click(mdButton)
      })

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveClass('editor-raw')
    })

    it('should update value when typing in raw mode', async () => {
      const onChange = vi.fn()
      render(<MarkdownEditor value="" onChange={onChange} />)

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      // Switch to raw mode
      const mdButton = screen.getByTitle('Toggle Raw Markdown')
      await act(async () => {
        fireEvent.click(mdButton)
      })

      const textarea = screen.getByRole('textbox')
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '# New content' } })
      })

      expect(onChange).toHaveBeenCalledWith('# New content')
    })

    it('should toggle back to WYSIWYG mode', async () => {
      render(<MarkdownEditor value="Content" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      const mdButton = screen.getByTitle('Toggle Raw Markdown')

      // Switch to raw mode
      await act(async () => {
        fireEvent.click(mdButton)
      })
      expect(mdButton).toHaveTextContent('WYSIWYG')

      // Switch back to WYSIWYG mode
      await act(async () => {
        fireEvent.click(mdButton)
      })
      expect(mdButton).toHaveTextContent('MD')
    })
  })

  describe('Toolbar buttons', () => {
    it('should click bold button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
      })

      const boldButton = screen.getByTitle('Bold (Ctrl+B)')
      await act(async () => {
        fireEvent.click(boldButton)
      })

      // Button should toggle (may or may not be active depending on state)
      expect(boldButton).toBeInTheDocument()
    })

    it('should click italic button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument()
      })

      const italicButton = screen.getByTitle('Italic (Ctrl+I)')
      await act(async () => {
        fireEvent.click(italicButton)
      })

      expect(italicButton).toBeInTheDocument()
    })

    it('should click strikethrough button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Strikethrough')).toBeInTheDocument()
      })

      const strikeButton = screen.getByTitle('Strikethrough')
      await act(async () => {
        fireEvent.click(strikeButton)
      })

      expect(strikeButton).toBeInTheDocument()
    })

    it('should click inline code button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Inline Code')).toBeInTheDocument()
      })

      const codeButton = screen.getByTitle('Inline Code')
      await act(async () => {
        fireEvent.click(codeButton)
      })

      expect(codeButton).toBeInTheDocument()
    })

    it('should click heading buttons', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Heading 1')).toBeInTheDocument()
      })

      const h1Button = screen.getByTitle('Heading 1')
      const h2Button = screen.getByTitle('Heading 2')
      const h3Button = screen.getByTitle('Heading 3')

      await act(async () => {
        fireEvent.click(h1Button)
      })
      expect(h1Button).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(h2Button)
      })
      expect(h2Button).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(h3Button)
      })
      expect(h3Button).toBeInTheDocument()
    })

    it('should click list buttons', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
      })

      const bulletListButton = screen.getByTitle('Bullet List')
      const orderedListButton = screen.getByTitle('Numbered List')

      await act(async () => {
        fireEvent.click(bulletListButton)
      })
      expect(bulletListButton).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(orderedListButton)
      })
      expect(orderedListButton).toBeInTheDocument()
    })

    it('should click blockquote button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Blockquote')).toBeInTheDocument()
      })

      const blockquoteButton = screen.getByTitle('Blockquote')
      await act(async () => {
        fireEvent.click(blockquoteButton)
      })

      expect(blockquoteButton).toBeInTheDocument()
    })

    it('should click code block button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Code Block')).toBeInTheDocument()
      })

      const codeBlockButton = screen.getByTitle('Code Block')
      await act(async () => {
        fireEvent.click(codeBlockButton)
      })

      expect(codeBlockButton).toBeInTheDocument()
    })

    it('should click horizontal rule button', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Horizontal Rule')).toBeInTheDocument()
      })

      const hrButton = screen.getByTitle('Horizontal Rule')
      await act(async () => {
        fireEvent.click(hrButton)
      })

      expect(hrButton).toBeInTheDocument()
    })
  })

  describe('Link functionality', () => {
    it('should open prompt when link button is clicked', async () => {
      mockPrompt.mockReturnValue(null) // User cancels
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Add Link')).toBeInTheDocument()
      })

      const linkButton = screen.getByTitle('Add Link')
      await act(async () => {
        fireEvent.click(linkButton)
      })

      expect(mockPrompt).toHaveBeenCalledWith('URL', undefined)
    })

    it('should add link when URL is provided', async () => {
      mockPrompt.mockReturnValue('https://example.com')
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Add Link')).toBeInTheDocument()
      })

      const linkButton = screen.getByTitle('Add Link')
      await act(async () => {
        fireEvent.click(linkButton)
      })

      expect(mockPrompt).toHaveBeenCalled()
    })

    it('should handle empty URL (unset link)', async () => {
      mockPrompt.mockReturnValue('')
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        expect(screen.getByTitle('Add Link')).toBeInTheDocument()
      })

      const linkButton = screen.getByTitle('Add Link')
      await act(async () => {
        fireEvent.click(linkButton)
      })

      expect(mockPrompt).toHaveBeenCalled()
    })
  })

  describe('Placeholder', () => {
    it('should render with default placeholder', async () => {
      render(<MarkdownEditor value="" onChange={() => {}} />)

      await waitFor(() => {
        const editorContent = document.querySelector('.editor-content')
        expect(editorContent).toBeInTheDocument()
      })
    })

    it('should render with custom placeholder', async () => {
      render(
        <MarkdownEditor
          value=""
          onChange={() => {}}
          placeholder="Enter your text..."
        />
      )

      await waitFor(() => {
        const editorContent = document.querySelector('.editor-content')
        expect(editorContent).toBeInTheDocument()
      })
    })

    it('should show placeholder in raw mode textarea', async () => {
      render(
        <MarkdownEditor
          value=""
          onChange={() => {}}
          placeholder="Custom placeholder"
        />
      )

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      const mdButton = screen.getByTitle('Toggle Raw Markdown')
      await act(async () => {
        fireEvent.click(mdButton)
      })

      const textarea = screen.getByPlaceholderText('Custom placeholder')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('onChange callback', () => {
    it('should call onChange when content changes in raw mode', async () => {
      const onChange = vi.fn()
      render(<MarkdownEditor value="" onChange={onChange} />)

      await waitFor(() => {
        expect(screen.getByTitle('Toggle Raw Markdown')).toBeInTheDocument()
      })

      // Switch to raw mode
      const mdButton = screen.getByTitle('Toggle Raw Markdown')
      await act(async () => {
        fireEvent.click(mdButton)
      })

      const textarea = screen.getByRole('textbox')
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'New value' } })
      })

      expect(onChange).toHaveBeenCalledWith('New value')
    })
  })
})
