const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  initialize() {
    try {
      if (config.sms.enabled && config.sms.twilio.accountSid && config.sms.twilio.authToken) {
        this.client = twilio(
          config.sms.twilio.accountSid,
          config.sms.twilio.authToken
        );
        logger.info('SMS service initialized successfully');
      } else {
        logger.info('SMS service disabled or missing credentials');
      }
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
    }
  }

  async sendVerificationSMS(phoneNumber, verificationCode, firstName = '') {
    if (!config.sms.enabled) {
      logger.info(`SMS disabled - would send verification code ${verificationCode} to ${phoneNumber}`);
      return { success: true, message: 'SMS service is disabled in development' };
    }

    if (!this.client) {
      logger.error('SMS service not initialized');
      return { success: false, error: 'SMS service not available' };
    }

    try {
      // Format phone number for Twilio (must include country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const message = this.getVerificationSMSMessage(verificationCode, firstName);
      
      const result = await this.client.messages.create({
        body: message,
        from: config.sms.twilio.phoneNumber,
        to: formattedPhone
      });

      logger.info(`Verification SMS sent successfully to ${formattedPhone}`, {
        messageSid: result.sid,
        status: result.status
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        message: 'Verification SMS sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send verification SMS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcomeSMS(phoneNumber, firstName = '') {
    if (!config.sms.enabled) {
      logger.info(`SMS disabled - would send welcome SMS to ${phoneNumber}`);
      return { success: true, message: 'SMS service is disabled in development' };
    }

    if (!this.client) {
      logger.error('SMS service not initialized');
      return { success: false, error: 'SMS service not available' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = this.getWelcomeSMSMessage(firstName);
      
      const result = await this.client.messages.create({
        body: message,
        from: config.sms.twilio.phoneNumber,
        to: formattedPhone
      });

      logger.info(`Welcome SMS sent successfully to ${formattedPhone}`, {
        messageSid: result.sid,
        status: result.status
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        message: 'Welcome SMS sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send welcome SMS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume US (+1)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    // Add the + prefix for international format
    return '+' + cleaned;
  }

  getVerificationSMSMessage(verificationCode, firstName) {
    const greeting = firstName ? `Hi ${firstName}! ` : 'Hi! ';
    return `${greeting}Your Games Raffle verification code is: ${verificationCode}. This code expires in 10 minutes. Welcome to Games Raffle!`;
  }

  getWelcomeSMSMessage(firstName) {
    const greeting = firstName ? `Welcome ${firstName}! ` : 'Welcome! ';
    return `${greeting}Your Games Raffle account is now verified! Start playing NFL fantasy games at https://red-hill-054635e0f.1.azurestaticapps.net. Good luck!`;
  }

  // Test SMS functionality
  async testSMS() {
    try {
      // Use a test phone number for testing
      const testPhone = config.sms.twilio.testPhone || '+15551234567';
      const result = await this.sendVerificationSMS(testPhone, '123456', 'Test User');
      return result;
    } catch (error) {
      logger.error('SMS test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Check account balance (useful for monitoring)
  async getAccountInfo() {
    if (!this.client) {
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      const account = await this.client.api.accounts(config.sms.twilio.accountSid).fetch();
      return {
        success: true,
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      };
    } catch (error) {
      logger.error('Failed to get Twilio account info:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SMSService();