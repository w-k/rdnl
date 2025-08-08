import React, { useState } from 'react'

export const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  )
}

export const SelectTrigger = ({ className = "", children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-md shadow-md z-10">
          {React.Children.map(props.children, (child) =>
            React.cloneElement(child, { onValueChange, setIsOpen, value })
          )}
        </div>
      )}
    </>
  )
}

export const SelectValue = ({ placeholder, value }) => (
  <span>{value || placeholder}</span>
)

export const SelectContent = ({ children }) => children

export const SelectItem = ({ value: itemValue, children, onValueChange, setIsOpen }) => (
  <div
    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
    onClick={() => {
      onValueChange?.(itemValue)
      setIsOpen?.(false)
    }}
  >
    {children}
  </div>
)