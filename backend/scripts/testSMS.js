#!/usr/bin/env node

/**
 * Test SMS Service - Debug Twilio Integration
 * Usage: node scripts/testSMS.js <phone_number>
 * Example: node scripts/testSMS.js 13059044860
 */

require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config();

const smsService = require('../src/services/smsService');

async function testSMS(phoneNumber) {
  if (!phoneNumber) {
    console.error('❌ Error: Phone number is required');
    console.log('Usage: node scripts/testSMS.js <phone_number>');
    console.log('Example: node scripts/testSMS.js 13059044860');
    process.exit(1);
  }

  try {
    console.log('📱 Testing SMS service...');
    console.log('📞 Phone number:', phoneNumber);
    
    // Check Twilio account info first
    console.log('\n🔍 Checking Twilio account...');
    const accountInfo = await smsService.getAccountInfo();
    if (accountInfo.success) {
      console.log('✅ Twilio Account Info:');
      console.log('  - Account SID:', accountInfo.accountSid);
      console.log('  - Status:', accountInfo.status);
      console.log('  - Type:', accountInfo.type);
    } else {
      console.log('❌ Twilio Account Error:', accountInfo.error);
    }

    // Format the phone number
    const formattedPhone = '+1' + phoneNumber.replace(/\D/g, '');
    console.log('📱 Formatted phone:', formattedPhone);

    // Test SMS sending
    console.log('\n📤 Sending test SMS...');
    const result = await smsService.sendVerificationSMS(phoneNumber, '123456', 'Test');
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log('  - Message SID:', result.messageSid);
      console.log('  - Status:', result.status);
      console.log('  - Message:', result.message);
    } else {
      console.log('❌ SMS failed to send:');
      console.log('  - Error:', result.error);
    }

    // Check environment variables
    console.log('\n🔧 Environment Check:');
    console.log('  - SMS_ENABLED:', process.env.SMS_ENABLED);
    console.log('  - TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '❌ Missing');
    console.log('  - TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '❌ Missing');
    console.log('  - TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Get phone number from command line arguments
const phoneNumber = process.argv[2];
testSMS(phoneNumber);