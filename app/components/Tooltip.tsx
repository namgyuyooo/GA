'use client'

import { useState } from 'react'
import { InformationCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface TooltipProps {
  content: string | React.ReactNode
  title?: string
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  type?: 'info' | 'help' | 'calculation' | 'datasource'
  maxWidth?: string
}

export default function Tooltip({
  content,
  title,
  children,
  position = 'top',
  size = 'md',
  type = 'info',
  maxWidth = 'max-w-xs',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs p-2'
      case 'md':
        return 'text-sm p-3'
      case 'lg':
        return 'text-base p-4'
      default:
        return 'text-sm p-3'
    }
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'help':
        return <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      case 'calculation':
        return <InformationCircleIcon className="h-4 w-4 text-blue-400 hover:text-blue-600" />
      case 'datasource':
        return <InformationCircleIcon className="h-4 w-4 text-green-400 hover:text-green-600" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'help':
        return 'bg-gray-900 border-gray-700'
      case 'calculation':
        return 'bg-blue-900 border-blue-700'
      case 'datasource':
        return 'bg-green-900 border-green-700'
      default:
        return 'bg-gray-900 border-gray-700'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || getTypeIcon()}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <div
            className={`${maxWidth} ${getSizeClasses()} ${getTypeColor()} text-white rounded-lg shadow-lg border transition-opacity duration-200`}
          >
            {title && (
              <div className="font-semibold mb-1 text-white border-b border-gray-600 pb-1">
                {title}
              </div>
            )}
            <div className="text-gray-100">
              {typeof content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                content
              )}
            </div>
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()} ${
              type === 'calculation'
                ? 'border-blue-900'
                : type === 'datasource'
                  ? 'border-green-900'
                  : 'border-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  )
}

// 특정 타입별 프리셋 컴포넌트들
export function HelpTooltip({ content, title, children }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip content={content} title={title} type="help" maxWidth="max-w-sm">
      {children}
    </Tooltip>
  )
}

export function CalculationTooltip({ content, title, children }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip content={content} title={title} type="calculation" maxWidth="max-w-md">
      {children}
    </Tooltip>
  )
}

export function DataSourceTooltip({ content, title, children }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip content={content} title={title} type="datasource" maxWidth="max-w-lg">
      {children}
    </Tooltip>
  )
}
