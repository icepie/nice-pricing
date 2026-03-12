import { FC } from 'react'

interface ProviderIconProps {
  provider: string
  iconName?: string
  size?: number
  className?: string
}

declare const ProviderIcon: FC<ProviderIconProps>
export default ProviderIcon
