import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../providers/Providers'
import Navigation from '../components/Navigation';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '家庭财务管理',
  description: '管理您的家庭资产和财务',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Providers>
          <Navigation />
          
          <main className="flex-grow p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          <footer className="bg-white border-t border-gray-200 mt-8">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} 家庭财务. 保留所有权利。
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}