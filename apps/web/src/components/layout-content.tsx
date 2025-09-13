'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { BottomNavigation } from './bottom-navigation'

interface LayoutContentProps {
  children: ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  
  // Страницы где не показываем навигацию
  const hideBottomNavPages = ['/', '/add-transaction']
  const showBottomNav = !hideBottomNavPages.includes(pathname)

  return (
    <>
      {children}
      {showBottomNav && <BottomNavigation />}
    </>
  )
}