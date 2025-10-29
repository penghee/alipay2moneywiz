import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../providers/Providers'
import Link from 'next/link';
import { Home, PlusCircle, BarChart2, Upload as UploadIcon } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '财务数据统计',
  description: '查看您的年度和月度财务统计',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    家庭财务
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center"
                  >
                    <Home className="h-5 w-5 mr-1" />
                    首页
                  </Link>
                  <Link 
                    href="/transaction/new" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
                  >
                    <PlusCircle className="h-5 w-5 mr-1" />
                    新增记录
                  </Link>
                  <Link 
                    href="/import" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center"
                  >
                    <UploadIcon className="h-5 w-5 mr-1" />
                    导入
                  </Link>
                </div>
              </div>
            </nav>
          </header>
          
          <main className="flex-grow">
            {children}
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