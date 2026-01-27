'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
} from '@floating-ui/react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

export function OrgSwitcher() {
  const {
    selectedOrgSlug,
    setSelectedOrgSlug,
    hasExplicitSelection,
    organizations,
    loading,
    refreshOrganizations,
  } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    if (isOpen) {
      refreshOrganizations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.org-switcher-container')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const getCurrentLabel = () => {
    if (!hasExplicitSelection) return 'Select Org'
    if (selectedOrgSlug === null) return 'All Orgs'
    if (selectedOrgSlug === '') return 'Ungrouped'
    const org = organizations.find(o => o.slug === selectedOrgSlug)
    return org?.name || selectedOrgSlug
  }

  const handleSelect = (slug: string | null) => {
    setSelectedOrgSlug(slug)
    setIsOpen(false)
  }

  return (
    <div className="org-switcher-container">
      <button
        ref={refs.setReference}
        className="org-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Filter by organization"
      >
        <span className="org-icon">🏢</span>
        <span className="org-label">{getCurrentLabel()}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="org-switcher-dropdown"
        >
          <div className="org-switcher-header">
            <h3>Filter by Organization</h3>
            <button
              className="refresh-btn"
              onClick={() => refreshOrganizations()}
              disabled={loading}
              title="Refresh organizations"
            >
              ↻
            </button>
          </div>

          <ul className="org-options" role="listbox">
            <li
              role="option"
              aria-selected={selectedOrgSlug === null}
              className={`org-option ${selectedOrgSlug === null ? 'selected' : ''}`}
              onClick={() => handleSelect(null)}
            >
              <span className="org-option-name">All Organizations</span>
            </li>
            <li
              role="option"
              aria-selected={selectedOrgSlug === ''}
              className={`org-option ${selectedOrgSlug === '' ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span className="org-option-name">Ungrouped Projects</span>
            </li>

            {organizations.length > 0 && <li className="org-divider" />}

            {loading && organizations.length === 0 ? (
              <li className="org-loading">Loading...</li>
            ) : (
              organizations.map(org => (
                <li
                  key={org.slug}
                  role="option"
                  aria-selected={selectedOrgSlug === org.slug}
                  className={`org-option ${selectedOrgSlug === org.slug ? 'selected' : ''}`}
                  onClick={() => handleSelect(org.slug)}
                >
                  <span className="org-option-name">{org.name}</span>
                  <span className="org-project-count">{org.projectCount}</span>
                </li>
              ))
            )}
          </ul>

          <div className="org-switcher-footer">
            <Link
              href="/organizations"
              className="manage-orgs-link"
              onClick={() => setIsOpen(false)}
            >
              Manage Organizations
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
