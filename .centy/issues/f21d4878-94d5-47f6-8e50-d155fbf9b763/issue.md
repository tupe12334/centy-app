# Upgrade markdown editor to Tiptap for issues and docs

## Overview

Replace plain `<textarea>` elements with Tiptap editor for a modern markdown editing experience.

## Current State

- Plain `<textarea>` with no markdown support
- No syntax highlighting or preview
- Files: `CreateDoc.tsx`, `DocDetail.tsx`, `CreateIssue.tsx`, `IssueDetail.tsx`

## Proposed Solution

**Library:** [Tiptap](https://tiptap.dev/) - headless, ProseMirror-based editor
**Mode:** Hybrid (WYSIWYG with raw markdown toggle)

## Features

- Rich text editing (bold, italic, links, headings)
- Code blocks with syntax highlighting
- Tables, lists, blockquotes
- Image embedding
- Raw markdown toggle mode
- Keyboard shortcuts

## Dependencies to Add

- @tiptap/react
- @tiptap/starter-kit
- @tiptap/extension-markdown (for import/export)
- Additional extensions as needed

## Files to Modify

- `src/pages/CreateDoc.tsx`
- `src/pages/DocDetail.tsx`
- `src/pages/CreateIssue.tsx`
- `src/pages/IssueDetail.tsx`
- `package.json` (add dependencies)

## New Components

- `src/components/MarkdownEditor.tsx` - Tiptap wrapper component
- `src/components/MarkdownEditor.css` - Editor styles

## Acceptance Criteria

- [ ] Tiptap editor replaces textareas in all 4 pages
- [ ] WYSIWYG editing for common markdown elements
- [ ] Raw markdown toggle mode
- [ ] Content saves as valid markdown
- [ ] Existing content displays correctly
