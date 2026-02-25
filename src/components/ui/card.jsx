import React from 'react'

export const Card = ({ className = "", children, ...props }) => (
  <div className={`bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
)
