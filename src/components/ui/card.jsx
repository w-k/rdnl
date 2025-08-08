import React from 'react'

export const Card = ({ className = "", children, ...props }) => (
  <div className={`bg-white border rounded-lg shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
)