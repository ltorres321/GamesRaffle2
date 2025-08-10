import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Replace with actual database integration
    console.log('Registration attempt:', {
      username: body.username,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      // Don't log sensitive data like passwords
    })
    
    // Mock successful registration response
    const mockUser = {
      id: Date.now().toString(),
      username: body.username,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      dateOfBirth: body.dateOfBirth,
      streetAddress: body.streetAddress,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      country: body.country,
      role: 'user',
      emailVerified: false,
      phoneVerified: false,
      isVerified: false,
      isActive: true,
      requiresVerification: true,
      taxVerificationStatus: 'not_required'
    }
    
    const mockTokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      sessionId: `mock_session_${Date.now()}`
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.' 
      },
      { status: 400 }
    )
  }
}