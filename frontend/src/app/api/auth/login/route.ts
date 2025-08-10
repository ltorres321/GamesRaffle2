import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // TODO: Replace with actual authentication logic
    console.log('Login attempt:', { email })
    
    // Mock authentication - in real app, verify against database
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      )
    }
    
    // Mock successful login response
    const mockUser = {
      id: "mock_user_123",
      username: email.split('@')[0],
      email: email,
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+1234567890",
      dateOfBirth: "1990-01-01",
      streetAddress: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      country: "United States",
      role: 'user',
      emailVerified: true,
      phoneVerified: true,
      isVerified: true,
      isActive: true,
      requiresVerification: false,
      taxVerificationStatus: 'not_required' as const
    }
    
    const mockTokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      sessionId: `mock_session_${Date.now()}`
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Username or password is incorrect' 
      },
      { status: 401 }
    )
  }
}