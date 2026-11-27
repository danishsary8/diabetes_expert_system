import { describe, expect, it } from 'vitest'
import { RANGE_PRESETS, getRangeSegment } from '@/components/patient/RangeRibbon'

const label = (preset, value) => getRangeSegment(RANGE_PRESETS[preset], value)?.label

describe('getRangeSegment — fasting glucose (mg/dL)', () => {
  it.each([
    [65, 'Low'],
    [70, 'Normal'],
    [99, 'Normal'],
    [100, 'Elevated'],
    [125, 'Elevated'],
    [126, 'High'],
    [400, 'High'],
  ])('%s → %s', (value, expected) => {
    expect(label('fastingGlucose', value)).toBe(expected)
  })
})

describe('getRangeSegment — HbA1c (%)', () => {
  it.each([
    [5.6, 'Normal'],
    [5.7, 'Prediabetes'],
    [6.4, 'Prediabetes'],
    [6.5, 'Diabetes range'],
  ])('%s → %s', (value, expected) => {
    expect(label('hba1c', value)).toBe(expected)
  })
})

describe('getRangeSegment — BMI and waist', () => {
  it('classifies BMI at the WHO cut-offs', () => {
    expect(label('bmi', 18.4)).toBe('Under')
    expect(label('bmi', 18.5)).toBe('Healthy')
    expect(label('bmi', 25)).toBe('Over')
    expect(label('bmi', 30)).toBe('Obese')
  })

  it('uses different waist cut-offs for men and women', () => {
    expect(label('waistMale', 90)).toBe('Lower risk')
    expect(label('waistFemale', 90)).toBe('High')
  })

  it('returns null when there is no reading', () => {
    expect(getRangeSegment(RANGE_PRESETS.bmi, null)).toBeNull()
    expect(getRangeSegment(RANGE_PRESETS.bmi, undefined)).toBeNull()
    expect(getRangeSegment(RANGE_PRESETS.bmi, Number.NaN)).toBeNull()
  })
})
