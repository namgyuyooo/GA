'use client'

import { useState } from 'react'

interface SourceMediumTagProps {
  source: string
  medium: string
  className?: string
  showDetails?: boolean
}

interface TagConfig {
  label: string
  color: string
  bgColor: string
  highlight?: string
}

interface TagConfigResult {
  source: TagConfig
  medium: TagConfig
}

const getTagConfig = (source: string, medium: string): TagConfigResult => {
  // 소스별 태그 설정
  const sourceConfigs: Record<string, TagConfig> = {
    'google': {
      label: 'Google',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      highlight: 'google'
    },
    'naver': {
      label: 'Naver',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      highlight: 'naver'
    },
    'daum': {
      label: 'Daum',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      highlight: 'daum'
    },
    'bing': {
      label: 'Bing',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      highlight: 'bing'
    },
    'facebook': {
      label: 'Facebook',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      highlight: 'facebook'
    },
    'instagram': {
      label: 'Instagram',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      highlight: 'instagram'
    },
    'twitter': {
      label: 'Twitter',
      color: 'text-blue-400',
      bgColor: 'bg-blue-50',
      highlight: 'twitter'
    },
    'linkedin': {
      label: 'LinkedIn',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      highlight: 'linkedin'
    }
  }

  // 미디엄별 태그 설정
  const mediumConfigs: Record<string, TagConfig> = {
    'organic': {
      label: 'Organic',
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    },
    'cpc': {
      label: 'Paid Search',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    },
    'referral': {
      label: 'Referral',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100'
    },
    'social': {
      label: 'Social',
      color: 'text-pink-700',
      bgColor: 'bg-pink-100'
    },
    'email': {
      label: 'Email',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100'
    },
    'direct': {
      label: 'Direct',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100'
    },
    'none': {
      label: 'Direct',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100'
    }
  }

  // 소스에서 도메인 추출
  const extractDomain = (source: string): string => {
    if (!source || source === '(not set)' || source === '(direct)') {
      return 'direct'
    }
    
    // URL에서 도메인 추출
    const domainMatch = source.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i)
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase()
      
      // 주요 도메인 매칭
      if (domain.includes('google')) return 'google'
      if (domain.includes('naver')) return 'naver'
      if (domain.includes('daum')) return 'daum'
      if (domain.includes('bing')) return 'bing'
      if (domain.includes('facebook')) return 'facebook'
      if (domain.includes('instagram')) return 'instagram'
      if (domain.includes('twitter')) return 'twitter'
      if (domain.includes('linkedin')) return 'linkedin'
      
      return domain
    }
    
    return source.toLowerCase()
  }

  const domain = extractDomain(source)
  const sourceConfig = sourceConfigs[domain] || {
    label: source === '(not set)' ? 'Unknown' : source,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  }

  const mediumConfig = mediumConfigs[medium] || {
    label: medium === '(not set)' ? 'Unknown' : medium,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  }

  return {
    source: sourceConfig,
    medium: mediumConfig
  }
}

export default function SourceMediumTag({ 
  source, 
  medium, 
  className = '',
  showDetails = false 
}: SourceMediumTagProps) {
  const [isHovered, setIsHovered] = useState(false)
  const config = getTagConfig(source, medium)

  const renderSourceTag = () => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.source.color} ${config.source.bgColor} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {config.source.highlight ? (
        <span className="font-semibold">{config.source.highlight}</span>
      ) : (
        config.source.label
      )}
    </span>
  )

  const renderMediumTag = () => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.medium.color} ${config.medium.bgColor} ml-1`}>
      {config.medium.label}
    </span>
  )

  if (showDetails) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-1">
          {renderSourceTag()}
          {renderMediumTag()}
        </div>
        {isHovered && source !== '(not set)' && source !== '(direct)' && (
          <div className="text-xs text-gray-500 mt-1">
            <span className="font-medium">도메인:</span> {source}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1">
      {renderSourceTag()}
      {renderMediumTag()}
    </div>
  )
} 