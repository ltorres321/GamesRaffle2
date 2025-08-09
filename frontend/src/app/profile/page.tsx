'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user)) {
      router.push('/auth/login')
    }
  }, [mounted, isAuthenticated, user, router])

  // Show nothing during SSR or while checking authentication
  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Successfully logged out')
      router.push('/')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const tabs = [
    { id: 'account', name: 'Account Info', icon: UserCircleIcon },
    { id: 'verification', name: 'Verification', icon: ShieldCheckIcon },
    { id: 'tax', name: 'Tax Info', icon: BanknotesIcon },
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Profile</h1>
          <p className="text-gray-400">Manage your account information and verification status</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-dark-700 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Account Info Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                  <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white">{user.firstName || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                  <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white">{user.lastName || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                  <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                    <span className="text-white">{user.username}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                  <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white">
                      {user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-white">{user.email}</span>
                    </div>
                    {user.emailVerified ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                  <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-white">{user.phoneNumber || 'Not provided'}</span>
                    </div>
                    {user.phoneVerified ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Address</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div className="text-white">
                    {user.streetAddress && user.city && user.state ? (
                      <>
                        <div>{user.streetAddress}</div>
                        <div>{user.city}, {user.state} {user.zipCode}</div>
                        <div>{user.country}</div>
                      </>
                    ) : (
                      <span>Address not provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Account Verification Status</h2>
              
              {/* Email Verification */}
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-white">Email Verification</h3>
                    <p className="text-sm text-gray-400">Verify your email address to secure your account</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user.emailVerified ? (
                    <>
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                      <span className="text-green-400 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Pending</span>
                      <Link href="/auth/verify" className="btn-primary px-4 py-1 text-sm">
                        Verify
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Phone Verification */}
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-white">Phone Verification</h3>
                    <p className="text-sm text-gray-400">Verify your phone number for account security</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user.phoneVerified ? (
                    <>
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                      <span className="text-green-400 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Pending</span>
                      <Link href="/auth/verify" className="btn-primary px-4 py-1 text-sm">
                        Verify
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Overall Status */}
              <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
                {user.emailVerified && user.phoneVerified ? (
                  <div className="text-center text-green-400">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Account Fully Verified</h3>
                    <p>You can now participate in contests and make picks!</p>
                  </div>
                ) : (
                  <div className="text-center text-yellow-400">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Verification Required</h3>
                    <p className="mb-4">Complete verification to participate in contests.</p>
                    <Link href="/auth/verify" className="btn-primary px-6 py-2">
                      Complete Verification
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tax Info Tab */}
        {activeTab === 'tax' && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Tax Information</h2>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <IdentificationIcon className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-400 mb-2">When is tax information required?</h3>
                    <p className="text-gray-300 text-sm">
                      Tax information including Social Security Number and identity verification 
                      is only required if you win a contest. This information is used for tax 
                      reporting purposes as required by law for prizes over $600.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* SSN Status */}
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-white">Social Security Number</h3>
                      <p className="text-sm text-gray-400">Required for tax reporting on winnings</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {user.taxVerificationStatus === 'verified' ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        <span className="text-green-400 font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400 font-medium">Not Required</span>
                      </>
                    )}
                  </div>
                </div>

                {/* License Verification Status */}
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IdentificationIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-white">Identity Verification</h3>
                      <p className="text-sm text-gray-400">Driver's license or passport verification</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-medium">Not Required</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 text-center">
                  <strong>Privacy Note:</strong> Your tax information is encrypted and securely stored. 
                  It is only used for tax reporting purposes and is never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="mt-8 pt-8 border-t border-dark-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Account Actions</h3>
              <p className="text-sm text-gray-400">Manage your account settings</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}