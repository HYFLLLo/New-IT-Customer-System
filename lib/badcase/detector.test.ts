// Mock prisma before importing detector
jest.mock('@/lib/prisma', () => ({
  prisma: {
    badcase: {
      create: jest.fn()
    }
  }
}))

import { determinePriority } from './detector'

describe('determinePriority', () => {
  test('user_feedback should return high priority', () => {
    expect(determinePriority('user_feedback', 0.8)).toBe('high')
  })

  test('confidence < 0.2 should return high priority', () => {
    expect(determinePriority('evaluation_failed', 0.1)).toBe('high')
  })

  test('confidence 0.2-0.4 should return medium priority', () => {
    expect(determinePriority('evaluation_failed', 0.3)).toBe('medium')
  })

  test('confidence >= 0.4 should return low priority', () => {
    expect(determinePriority('low_confidence', 0.6)).toBe('low')
  })
})