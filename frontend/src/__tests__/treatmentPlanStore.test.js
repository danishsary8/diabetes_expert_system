import { beforeEach, describe, expect, it } from 'vitest'
import { getTreatmentPlanForUser, saveTreatmentPlans } from '@/lib/treatmentPlanStore'

function installLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

const plan = (id, patientName) => ({ id, patientId: `P-${id}`, patientName, protocolName: 'Plan' })

describe('getTreatmentPlanForUser', () => {
  beforeEach(() => {
    installLocalStorage()
    saveTreatmentPlans([plan('a', 'Sokha Chan'), plan('b', 'Dara Kim'), plan('c', 'Vanna Lim')])
  })

  it("returns the patient's own plan, ignoring case and spaces", () => {
    expect(getTreatmentPlanForUser('  dara KIM ')?.id).toBe('b')
  })

  it('returns null instead of someone else’s plan when the patient has none', () => {
    expect(getTreatmentPlanForUser('Bopha Srey')).toBeNull()
  })

  it('returns null for a missing or empty name', () => {
    expect(getTreatmentPlanForUser('')).toBeNull()
    expect(getTreatmentPlanForUser(undefined)).toBeNull()
  })

  it('does not match on a partial name', () => {
    expect(getTreatmentPlanForUser('Dara')).toBeNull()
  })
})
