import { afterEach, describe, expect, it } from 'vitest'
import { NODE_THEMES, getNodeTheme } from '@/components/assessment/assessment-themes'

function setAudience(audience) {
  globalThis.document = { documentElement: { dataset: audience ? { audience } : {} } }
}

describe('getNodeTheme', () => {
  afterEach(() => {
    delete globalThis.document
  })

  it('keeps the original colours for staff', () => {
    setAudience(undefined)
    expect(getNodeTheme({ id: 'subject' }).bg).toBe(NODE_THEMES.subject.bg)
  })

  it('re-tunes royal-blue sections to pine for patients', () => {
    setAudience('patient')
    const theme = getNodeTheme({ id: 'subject' })
    expect(theme.bg).not.toBe(NODE_THEMES.subject.bg)
    expect(theme.toggleActive).toBe(NODE_THEMES.subject.toggleActive)
  })

  it('leaves non-blue sections unchanged for patients', () => {
    setAudience('patient')
    expect(getNodeTheme({ id: 'symptom_hunger' }).bg).toBe(NODE_THEMES.symptom_hunger.bg)
  })

  it('falls back to the default theme without a node', () => {
    setAudience(undefined)
    expect(getNodeTheme(null).bg).toBeTruthy()
  })
})
