import { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'
import TurndownService from 'turndown'
import './MarkdownEditor.css'

const lowlight = createLowlight(common)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Custom rules for better markdown conversion
turndownService.addRule('codeBlock', {
  filter: ['pre'],
  replacement: function (content, node) {
    const codeNode = (node as HTMLElement).querySelector('code')
    const language = codeNode?.className?.match(/language-(\w+)/)?.[1] || ''
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`
  },
})

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html)
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  // Simple markdown to HTML conversion
  let html = markdown
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (before other transformations)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escapedCode = code.trim()
    return `<pre><code class="language-${lang || 'plaintext'}">${escapedCode}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')

  // Paragraphs (lines not already in tags)
  html = html
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<')) return block
      if (block.trim() === '') return ''
      return `<p>${block.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

  return html
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content...',
  minHeight = 200,
  className = '',
}: MarkdownEditorProps) {
  const [isRawMode, setIsRawMode] = useState(false)
  const [rawValue, setRawValue] = useState(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // Disable the default link extension since we're using a custom one
      }),
      Link.extend({
        name: 'customLink',
      }).configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: markdownToHtml(value),
    onUpdate: ({ editor }) => {
      if (!isRawMode) {
        const html = editor.getHTML()
        const markdown = htmlToMarkdown(html)
        setRawValue(markdown)
        onChange(markdown)
      }
    },
  })

  const handleRawChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setRawValue(newValue)
      onChange(newValue)
    },
    [onChange]
  )

  const toggleRawMode = useCallback(() => {
    if (isRawMode && editor) {
      // Switching from raw to WYSIWYG
      editor.commands.setContent(markdownToHtml(rawValue))
    } else if (!isRawMode && editor) {
      // Switching from WYSIWYG to raw
      const html = editor.getHTML()
      setRawValue(htmlToMarkdown(html))
    }
    setIsRawMode(!isRawMode)
  }, [isRawMode, editor, rawValue])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('customLink').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('customLink').unsetLink().run()
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('customLink')
      .setLink({ href: url })
      .run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`markdown-editor ${className}`}>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'active' : ''}
            title="Inline Code"
          >
            {'</>'}
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="Numbered List"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
            title="Blockquote"
          >
            "
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'active' : ''}
            title="Code Block"
          >
            {'{ }'}
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={setLink}
            className={editor.isActive('customLink') ? 'active' : ''}
            title="Add Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            —
          </button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={toggleRawMode}
            className={isRawMode ? 'active' : ''}
            title="Toggle Raw Markdown"
          >
            {isRawMode ? 'WYSIWYG' : 'MD'}
          </button>
        </div>
      </div>

      {isRawMode ? (
        <textarea
          className="editor-raw"
          value={rawValue}
          onChange={handleRawChange}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="editor-content"
          style={{ minHeight }}
        />
      )}
    </div>
  )
}
