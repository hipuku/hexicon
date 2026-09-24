// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import App from './App'

/* Every view, reached through the navigation a visitor uses and checked with
   axe. The engine tests cover the maths; this covers the page. */
const VIEWS = ['About', 'Name a colour', 'Map a palette', 'Compare two colours']

afterEach(cleanup)

describe('App', () => {
  it.each(VIEWS)('%s has no axe violations', async (label) => {
    const { container } = render(<App />)
    await userEvent.click(screen.getByRole('button', { name: label }))
    expect((await axe(container)).violations).toEqual([])
  })
})
