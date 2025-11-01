"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Upload, List } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "流水",
      path: "/",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          ></path>
        </svg>
      ),
      activeBg: "bg-blue-600",
      inactiveBg: "hover:bg-blue-500/10",
      activeText: "text-white",
      inactiveText: "text-gray-300 hover:text-white",
    },
    {
      name: "资产",
      path: "/summary",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      ),
      activeBg: "bg-emerald-600",
      inactiveBg: "hover:bg-emerald-500/10",
      activeText: "text-white",
      inactiveText: "text-gray-300 hover:text-emerald-400",
    },
  ];

  const actionButtons = [
    {
      name: "新增记录",
      path: "/transaction/new",
      icon: <Plus className="h-4 w-4" />,
      variant: "primary" as const,
      bgColor: "bg-blue-600",
      hoverBgColor: "hover:bg-blue-700",
      textColor: "text-white",
      iconColor: "text-blue-100",
      shadow: "shadow-blue-500/20",
    },
    {
      name: "导入",
      path: "/import",
      icon: <Upload className="h-4 w-4" />,
      variant: "secondary" as const,
      bgColor: "bg-emerald-50",
      hoverBgColor: "hover:bg-emerald-100",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-500",
      shadow: "shadow-emerald-500/10",
    },
    {
      name: "分类管理",
      path: "/category-management",
      icon: <List className="h-4 w-4" />,
      variant: "secondary" as const,
      bgColor: "bg-purple-50",
      hoverBgColor: "hover:bg-purple-100",
      textColor: "text-purple-700",
      iconColor: "text-purple-500",
      shadow: "shadow-purple-500/10",
    },
  ];

  return (
    <div className="flex items-center space-x-3">
      {/* Main Navigation Links */}
      <div className="flex space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-700/50 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center px-3 md:px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive
                  ? `${item.activeBg} ${item.activeText} shadow-lg transform hover:scale-[1.02]`
                  : `${item.inactiveBg} ${item.inactiveText} hover:scale-[1.03]`
              }`}
            >
              <span
                className={`mr-2 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}
              >
                {item.icon}
              </span>
              <span className="relative hidden md:inline">
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/30 rounded-full"></span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-700 mx-1"></div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {actionButtons.map((button) => (
          <Link
            key={button.path}
            href={button.path}
            className={`group inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              button.bgColor
            } ${button.hoverBgColor} ${button.textColor} ${button.shadow}
              hover:shadow-md hover:scale-[1.02] active:scale-95`}
          >
            <span
              className={`mr-2 ${button.iconColor} transition-transform group-hover:scale-110`}
            >
              {button.icon}
            </span>
            <span className="font-medium hidden md:inline">{button.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
