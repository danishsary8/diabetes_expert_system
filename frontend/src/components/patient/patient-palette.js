import { useEffect, useState } from 'react'

/*
 * Concrete colours for SVG / chart libraries that cannot read CSS variables
 * from presentation attributes. Mirrors the patient palette generated in
 * scripts/generate-palette.mjs.
 */
const LIGHT = {
  line: '#008568', // pine 600
  lineStrong: '#006c53', // pine 700
  inRange: '#3ea25b', // leaf 500
  above: '#db8200', // marigold 500
  below: '#e54b6b', // rose 500
  grid: '#edf2f0', // ink 100
  axis: '#98a5a0', // ink 400
  surface: '#ffffff',
}

const DARK = {
  line: '#56bfa1', // pine 400
  lineStrong: '#8bd8bf', // pine 300
  inRange: '#6abf7e', // leaf 400
  above: '#f7a53e', // marigold 400
  below: '#ff758c', // rose 400
  grid: '#253431', // night border
  axis: '#6b7873', // ink 500
  surface: '#0f1816', // night surface
}

function readIsDark() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/** Tracks the app's light / dark class on <html>. */
export function useIsDark() {
  const [isDark, setIsDark] = useState(readIsDark)
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setIsDark(readIsDark()))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export function useChartPalette() {
  return useIsDark() ? DARK : LIGHT
}
