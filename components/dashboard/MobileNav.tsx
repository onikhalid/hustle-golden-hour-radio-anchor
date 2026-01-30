"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, UserPlus, List, Link2, Edit, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Winners",
    href: "/weekly-winners",
    icon: Trophy,
  },
  {
    name: "Agents",
    href: "/agent-records",
    icon: UserPlus,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: List,
  },
  {
    name: "Assign",
    href: "/assign-question",
    icon: Link2,
  },
  {
    name: "Update",
    href: "/update-question",
    icon: Edit,
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white transition hover:bg-white/10"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="fixed top-[73px] left-0 right-0 max-h-[calc(100vh-73px)] overflow-y-auto border-b border-white/10 bg-black/95 backdrop-blur-xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mounted && pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-purple-400" : "text-white/60"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Show only first 4 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = mounted && pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[70px] relative",
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6",
                  isActive ? "text-purple-400" : "text-white/60"
                )} />
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
