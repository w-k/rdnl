import React from 'react'

export const Card = ({ className = "", children, ...props }) => (
  <div className={`bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
)