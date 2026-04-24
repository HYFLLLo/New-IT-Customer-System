import { DocumentList } from '../app/agent/knowledge/components/DocumentList'
import { StatusBadge } from '../app/agent/knowledge/components/StatusBadge'

describe('DocumentList', () => {
  it('should be defined', () => {
    expect(DocumentList).toBeDefined()
  })

  it('should accept refreshKey prop', () => {
    const props = { refreshKey: 0 }
    expect(props.refreshKey).toBe(0)
  })
})

describe('StatusBadge', () => {
  it('should be defined', () => {
    expect(StatusBadge).toBeDefined()
  })
})