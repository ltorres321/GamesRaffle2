'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Contest Lobby', href: '/contests' },
    { name: 'Quick Picks', href: '/quick-picks' },
    { name: 'My Contests', href: '/my-contests' },
    { name: 'Commissioner', href: '/commissioner' },
    { name: 'My Profile', href: '/profile' },
  ]

  return (
    <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">GR</span>
              </div>
              <span className="text-white font-bold text-xl">Games Raffle</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-primary-400 transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* User Account */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-gray-300 text-sm">
                  Welcome, <span className="text-gold-400 font-semibold">{user?.firstName || user?.username}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gold-400 font-semibold text-sm">$49</span>
                  <span className="text-gray-300 text-sm">Balance</span>
                  <button className="btn-gold text-sm px-4 py-2">
                    Deposit
                  </button>
                  <div className="flex items-center space-x-2">
                    <Link href="/profile" className="p-1 text-gray-400 hover:text-gold-400 transition-colors">
                      <UserCircleIcon className="h-8 w-8" />
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="nav-link">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-800 border-t border-dark-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-gray-300 hover:text-primary-400 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}