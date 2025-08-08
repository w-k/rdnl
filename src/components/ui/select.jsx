import React, { useState, useRef, useEffect } from 'react'

export const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={selectRef} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, onValueChange, isOpen, setIsOpen })
      )}
    </div>
  )
}

export const SelectTrigger = ({ className = "", children, isOpen, setIsOpen, value, ...props }) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen?.(!isOpen)}
      {...props}
    >
      <span className="flex-1 text-left">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { value })
        )}
      </span>
      <svg 
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export const SelectValue = ({ placeholder, value }) => (
  <span className={value ? "text-gray-900" : "text-gray-500"}>
    {value || placeholder}
  </span>
)

export const SelectContent = ({ children, isOpen, value, onValueChange, setIsOpen }) => {
  if (!isOpen) return null
  
  return (
    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange, setIsOpen, selectedValue: value })
      )}
    </div>
  )
}

export const SelectItem = ({ value: itemValue, children, onValueChange, setIsOpen, selectedValue }) => (
  <div
    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
      selectedValue === itemValue ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
    }`}
    onClick={() => {
      onValueChange?.(itemValue)
      setIsOpen?.(false)
    }}
  >
    {children}
  </div>
)