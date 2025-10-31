"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: '首页', path: '/' },
    { name: '资产', path: '/assets-management' },
    { name: '汇总', path: '/summary' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">家庭财务</div>
        <div className="flex items-center space-x-4">
          <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`hover:text-blue-300 transition-colors ${
                  pathname === item.path ? 'text-blue-400 font-medium' : ''
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
          </ul>
          
          <div className="flex space-x-3 ml-6">
            <Link 
              href="/transaction/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              新增记录
            </Link>
            <Link 
              href="/import"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              导入
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
