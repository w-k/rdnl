import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export function ComboInput({ value, onChange, validate, options = [], className = '', ...props }) {
  const [draft, setDraft] = useState(String(value))
  const committed = useRef(value)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setDraft(String(value))
    committed.current = value
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
  }

  const handleSelect = (option) => {
    committed.current = option.value
    onChange(option.value)
    setDraft(String(option.value))
    setOpen(false)
  }

  const matchedOption = options.find(o => o.value === committed.current)

  return (
    <div ref={wrapperRef} className="relative">
      <div className={`flex items-center h-10 w-full rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
        <div className="relative flex-1 h-full min-w-0">
          <input
            className="w-full h-full bg-transparent px-3 py-2 outline-none placeholder:text-muted-foreground"
            value={focused ? draft : String(committed.current)}
            onFocus={(e) => {
              setFocused(true)
              setDraft(String(committed.current))
              handleFocus(e)
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              setFocused(false)
              commit(e.target.value)
            }}
            {...props}
          />
          {!focused && matchedOption && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-baseline gap-1.5">
              <span className="invisible">{committed.current}</span>
              <span className="text-neutral-400 text-xs">{matchedOption.label}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="px-2 h-full flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault()
            setOpen(prev => !prev)
          }}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-baseline gap-1.5 ${
                option.value === committed.current ? 'font-medium' : 'text-neutral-700 dark:text-neutral-300'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(option)
              }}
            >
              <span>{option.value}</span>
              <span className="text-neutral-400 text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
