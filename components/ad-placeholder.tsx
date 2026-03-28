'use client'

interface AdPlaceholderProps {
  format?: 'banner' | 'sidebar' | 'inline'
  className?: string
}

export function AdPlaceholder({ format = 'banner', className = '' }: AdPlaceholderProps) {
  const sizes = {
    banner: 'w-full h-[90px]',
    sidebar: 'w-[300px] h-[250px]',
    inline: 'w-full h-[250px]',
  }

  return (
    <div className={`${sizes[format]} bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center">
        <p className="text-xs text-gray-400 font-medium">Advertisement</p>
        <p className="text-[10px] text-gray-300 mt-0.5">Google AdSense</p>
      </div>
    </div>
  )
}
