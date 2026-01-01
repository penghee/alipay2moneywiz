"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Navigation from "../components/Navigation";
import DateTreeNav from "../components/DateTreeNav";

export default function WithSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    // Set initial value
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation - Always visible */}
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left side */}
            <div className="flex-shrink-0">
              <span className="text-xl font-bold">家庭财务</span>
            </div>

            <div className="flex items-center">
              {/* Desktop Navigation - Right side */}
              <div className="md:flex md:items-center md:space-x-2 ml-4">
                <Navigation />
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden ml-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">打开主菜单</span>
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out bg-white border-r border-gray-200 flex flex-col`}
        >
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="px-4 space-y-1">
              <DateTreeNav />
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
