'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiService from '@/services/api'

export default function VerifyPage() {
  const router = useRouter()
  const [emailCode, setEmailCode] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [userInfo, setUserInfo] = useState<any>(null)
  const [resendCooldown, setResendCooldown] = useState<Record<string, number>>({})

  useEffect(() => {
    // Get user info to show what needs verification
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchUserInfo()
  }, [])

  useEffect(() => {
    // Handle cooldown timers
    const intervals: NodeJS.Timeout[] = []
    
    Object.keys(resendCooldown).forEach(key => {
      if (resendCooldown[key] > 0) {
        const interval = setInterval(() => {
          setResendCooldown(prev => ({
            ...prev,
            [key]: Math.max(0, prev[key] - 1)
          }))
        }, 1000)
        intervals.push(interval)
      }
    })

    return () => intervals.forEach(clearInterval)
  }, [resendCooldown])

  const fetchUserInfo = async () => {
    try {
      const response = await apiService.getMe()
      if (response.success && response.data) {
        setUserInfo(response.data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const handleEmailVerification = async () => {
    if (!emailCode.trim()) {
      setErrors(prev => ({ ...prev, email: 'Please enter the verification code' }))
      return
    }

    setIsLoading(prev => ({ ...prev, email: true }))
    setErrors(prev => ({ ...prev, email: '' }))

    try {
      const response = await apiService.verifyEmail(emailCode)

      if (response.success) {
        setSuccess(prev => ({ ...prev, email: 'Email verified successfully!' }))
        setEmailCode('')
        await fetchUserInfo() // Refresh user info
      } else {
        setErrors(prev => ({ ...prev, email: response.message || 'Invalid verification code' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, email: 'Network error. Please try again.' }))
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handleSMSVerification = async () => {
    if (!smsCode.trim()) {
      setErrors(prev => ({ ...prev, sms: 'Please enter the verification code' }))
      return
    }

    setIsLoading(prev => ({ ...prev, sms: true }))
    setErrors(prev => ({ ...prev, sms: '' }))

    try {
      const response = await apiService.verifyPhone(smsCode)

      if (response.success) {
        setSuccess(prev => ({ ...prev, sms: 'Phone verified successfully!' }))
        setSmsCode('')
        await fetchUserInfo() // Refresh user info
        
        if (response.data?.fullyVerified) {
          // User is fully verified, redirect to home
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } else {
        setErrors(prev => ({ ...prev, sms: response.message || 'Invalid verification code' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, sms: 'Network error. Please try again.' }))
    } finally {
      setIsLoading(prev => ({ ...prev, sms: false }))
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(prev => ({ ...prev, resendEmail: true }))

    try {
      const response = await apiService.resendEmailVerification()

      if (response.success) {
        setSuccess(prev => ({ ...prev, resendEmail: 'Verification email sent!' }))
        setResendCooldown(prev => ({ ...prev, email: 60 })) // 60 second cooldown
      } else {
        setErrors(prev => ({ ...prev, resendEmail: response.message || 'Failed to send email' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, resendEmail: 'Network error. Please try again.' }))
    } finally {
      setIsLoading(prev => ({ ...prev, resendEmail: false }))
    }
  }

  const handleResendSMS = async () => {
    setIsLoading(prev => ({ ...prev, resendSMS: true }))

    try {
      const response = await apiService.resendSmsVerification()

      if (response.success) {
        setSuccess(prev => ({ ...prev, resendSMS: 'Verification code sent!' }))
        setResendCooldown(prev => ({ ...prev, sms: 60 })) // 60 second cooldown
      } else {
        setErrors(prev => ({ ...prev, resendSMS: response.message || 'Failed to send SMS' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, resendSMS: 'Network error. Please try again.' }))
    } finally {
      setIsLoading(prev => ({ ...prev, resendSMS: false }))
    }
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const emailVerified = userInfo.emailVerified || success.email
  const phoneVerified = userInfo.phoneVerified || success.sms
  const fullyVerified = emailVerified && phoneVerified

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Verify Your Account</h1>
            <p className="text-gray-600 mt-2">
              Complete verification to access all features
            </p>
          </div>

          {/* Full verification success */}
          {fullyVerified && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  Account fully verified! Redirecting to home page...
                </span>
              </div>
            </div>
          )}

          {/* Email Verification */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Email Verification</h3>
              {emailVerified ? (
                <span className="text-green-600 font-medium">✓ Verified</span>
              ) : (
                <span className="text-yellow-600 font-medium">⚠ Pending</span>
              )}
            </div>
            
            {!emailVerified && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  We sent a verification code to <strong>{userInfo.email}</strong>
                </p>
                
                <div>
                  <input
                    type="text"
                    placeholder="Enter email verification code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  {success.email && <p className="text-green-600 text-xs mt-1">{success.email}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleEmailVerification}
                    disabled={isLoading.email}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
                  >
                    {isLoading.email ? 'Verifying...' : 'Verify Email'}
                  </button>
                  
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading.resendEmail || resendCooldown.email > 0}
                    className="px-4 py-2 text-green-600 hover:text-green-500 text-sm disabled:opacity-50"
                  >
                    {resendCooldown.email > 0 
                      ? `Resend (${resendCooldown.email}s)`
                      : isLoading.resendEmail 
                      ? 'Sending...' 
                      : 'Resend'
                    }
                  </button>
                </div>
                
                {errors.resendEmail && <p className="text-red-600 text-xs">{errors.resendEmail}</p>}
                {success.resendEmail && <p className="text-green-600 text-xs">{success.resendEmail}</p>}
              </div>
            )}
          </div>

          {/* SMS Verification */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Phone Verification</h3>
              {phoneVerified ? (
                <span className="text-green-600 font-medium">✓ Verified</span>
              ) : (
                <span className="text-yellow-600 font-medium">⚠ Pending</span>
              )}
            </div>
            
            {!phoneVerified && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to <strong>{userInfo.phoneNumber}</strong>
                </p>
                
                <div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit SMS code"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  {errors.sms && <p className="text-red-600 text-xs mt-1">{errors.sms}</p>}
                  {success.sms && <p className="text-green-600 text-xs mt-1">{success.sms}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSMSVerification}
                    disabled={isLoading.sms}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
                  >
                    {isLoading.sms ? 'Verifying...' : 'Verify Phone'}
                  </button>
                  
                  <button
                    onClick={handleResendSMS}
                    disabled={isLoading.resendSMS || resendCooldown.sms > 0}
                    className="px-4 py-2 text-green-600 hover:text-green-500 text-sm disabled:opacity-50"
                  >
                    {resendCooldown.sms > 0 
                      ? `Resend (${resendCooldown.sms}s)`
                      : isLoading.resendSMS 
                      ? 'Sending...' 
                      : 'Resend'
                    }
                  </button>
                </div>
                
                {errors.resendSMS && <p className="text-red-600 text-xs">{errors.resendSMS}</p>}
                {success.resendSMS && <p className="text-green-600 text-xs">{success.resendSMS}</p>}
              </div>
            )}
          </div>

          {/* Feature limitations notice */}
          {!fullyVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Limited Access:</strong> You can browse contests but cannot make picks or deposits until verification is complete.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/"
              className="text-green-600 hover:text-green-500 font-medium"
            >
              Continue to Games Raffle
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}