import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('should render the heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Vite + React'
    )
  })

  it('should render initial count as 0', () => {
    render(<App />)
    expect(screen.getByRole('button')).toHaveTextContent('count is 0')
  })

  it('should increment count when button is clicked', () => {
    render(<App />)
    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(button).toHaveTextContent('count is 1')

    fireEvent.click(button)
    expect(button).toHaveTextContent('count is 2')
  })

  it('should render Vite and React logos', () => {
    render(<App />)
    expect(screen.getByAltText('Vite logo')).toBeInTheDocument()
    expect(screen.getByAltText('React logo')).toBeInTheDocument()
  })

  it('should render links to documentation', () => {
    render(<App />)
    expect(
      screen.getByText('Click on the Vite and React logos to learn more')
    ).toBeInTheDocument()
  })
})
