import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests only: everything under test is pure, so no database or network is involved and
    // no setup file is needed. Anything that would need those belongs behind a fake at the seam.
    include: ['src/**/*.test.ts'],
  },
})
