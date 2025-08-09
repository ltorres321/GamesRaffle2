'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RegistrationData {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phoneNumber: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) stepErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) stepErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) stepErrors.email = 'Email is required'
    if (!formData.email.includes('@')) stepErrors.email = 'Valid email is required'
    if (!formData.username.trim()) stepErrors.username = 'Username is required'
    if (formData.username.length < 3) stepErrors.username = 'Username must be at least 3 characters'
    if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'Date of birth is required'
    
    // Age validation (21+)
    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
    
    if (actualAge < 21) stepErrors.dateOfBirth = 'You must be at least 21 years old'

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {}
    
    if (!formData.phoneNumber.trim()) stepErrors.phoneNumber = 'Phone number is required'
    if (!formData.streetAddress.trim()) stepErrors.streetAddress = 'Street address is required'
    if (!formData.city.trim()) stepErrors.city = 'City is required'
    if (!formData.state.trim()) stepErrors.state = 'State is required'
    if (!formData.zipCode.trim()) stepErrors.zipCode = 'ZIP code is required'
    
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const validateStep3 = () => {
    const stepErrors: Record<string, string> = {}
    
    if (!formData.password) stepErrors.password = 'Password is required'
    if (formData.password.length < 8) stepErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep3()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
        localStorage.setItem('sessionId', data.data.tokens.sessionId)
        
        // Redirect to verification page
        router.push('/auth/verify')
      } else {
        setErrors({ general: data.message || 'Registration failed' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .force-visible-input {
          color: #000000 !important;
          background-color: #ffffff !important;
          -webkit-text-fill-color: #000000 !important;
          opacity: 1 !important;
        }
        .force-visible-input:focus {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }
        .force-visible-input::selection {
          background-color: #3b82f6 !important;
          color: #ffffff !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Join Games Raffle</h1>
            <p className="text-gray-600 mt-2">Step {step} of 3</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name(as on license)*
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name (as on license) *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.username && <p className="text-red-600 text-xs mt-1">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 bg-white ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors.dateOfBirth && <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>}
                  <p className="text-xs text-gray-500 mt-1">You must be at least 21 years old</p>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 font-medium"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Contact & Address Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact & Address</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className={`force-visible-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>}
                  <p className="text-xs text-gray-500 mt-1">Required for SMS verification</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className={`force-visible-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                      errors.streetAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.streetAddress && <p className="text-red-600 text-xs mt-1">{errors.streetAddress}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`force-visible-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`force-visible-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a state</option>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                    </select>
                    {errors.state && <p className="text-red-600 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`force-visible-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                        errors.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.zipCode && <p className="text-red-600 text-xs mt-1">{errors.zipCode}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="force-visible-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <option value="United States">United States</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Password</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> You'll need to verify your email and phone number to access all features including making picks and deposits.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-green-600 hover:text-green-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}