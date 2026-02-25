import React from 'react'

export const Label = ({ className = "", children, ...props }) => (
  <label
    className={`text-[11px] font-medium uppercase tracking-wider leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
  </label>
)
