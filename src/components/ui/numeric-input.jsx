import React, { useState, useEffect, useRef } from 'react'

export function NumericInput({ value, onChange, validate, className = '', onFocus, ...props }) {
  const [draft, setDraft] = useState(String(value))
  const committed = useRef(value)

  useEffect(() => {
    setDraft(String(value))
    committed.current = value
  }, [value])

  const commit = (raw) => {
    const trimmed = raw.trim()
    const n = Number(trimmed)
    const ok = trimmed !== '' && isFinite(n) && (validate ? validate(n) : true)
    if (ok) {
      committed.current = n
      onChange(n)
      setDraft(String(n))
    } else {
      setDraft(String(committed.current))
    }
  }

  const handleFocus = (e) => {
    const el = e.currentTarget
    setTimeout(() => el.select(), 0)
    onFocus?.(e)
  }

  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      value={draft}
      onFocus={handleFocus}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(e.target.value) }}
      {...props}
    />
  )
}
