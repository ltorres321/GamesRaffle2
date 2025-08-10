const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Gmail SMTP configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.email.gmail.user, // your gmail address
          pass: config.email.gmail.appPassword // your gmail app password
        }
      });

      // Verify connection configuration
      if (config.email.enabled) {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendVerificationEmail(email, verificationCode, firstName = '') {
    if (!config.email.enabled) {
      logger.info(`Email disabled - would send verification code ${verificationCode} to ${email}`);
      return { success: true, message: 'Email service is disabled in development' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Games Raffle',
          address: config.email.gmail.user
        },
        to: email,
        subject: 'Verify Your Games Raffle Account',
        html: this.getVerificationEmailTemplate(verificationCode, firstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent successfully to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcomeEmail(email, firstName = '') {
    if (!config.email.enabled) {
      logger.info(`Email disabled - would send welcome email to ${email}`);
      return { success: true, message: 'Email service is disabled in development' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Games Raffle',
          address: config.email.gmail.user
        },
        to: email,
        subject: 'Welcome to Games Raffle!',
        html: this.getWelcomeEmailTemplate(firstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent successfully to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Welcome email sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getVerificationEmailTemplate(verificationCode, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Games Raffle Account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a5f1a, #2d8f2d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Games Raffle</h1>
            <p style="color: #fff; margin: 10px 0 0 0; font-size: 16px;">Your NFL Fantasy Experience</p>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a5f1a; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            ${firstName ? `<p>Hi ${firstName},</p>` : '<p>Hi there,</p>'}
            
            <p>Welcome to Games Raffle! To complete your account setup and start participating in our NFL fantasy games, please verify your email address.</p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #1a5f1a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${verificationCode}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">Enter this code on the verification page</p>
            </div>
            
            <p style="margin: 25px 0;">This code will expire in 10 minutes for your security.</p>
            
            <p>If you didn't create a Games Raffle account, you can safely ignore this email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 14px; color: #666; margin: 0;">
                Thanks,<br>
                The Games Raffle Team
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>Games Raffle - Your Premier NFL Fantasy Experience</p>
        </div>
    </body>
    </html>
    `;
  }

  getWelcomeEmailTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Games Raffle!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a5f1a, #2d8f2d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">🎉 Welcome to Games Raffle!</h1>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            ${firstName ? `<h2 style="color: #1a5f1a;">Welcome ${firstName}!</h2>` : '<h2 style="color: #1a5f1a;">Welcome!</h2>'}
            
            <p>Your account has been successfully verified! You're now ready to join the excitement of NFL fantasy games with Games Raffle.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1a5f1a; margin: 0 0 15px 0;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Browse active NFL contests</li>
                    <li>Join games and make your picks</li>
                    <li>Track your performance</li>
                    <li>Compete with other players</li>
                </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="https://red-hill-054635e0f.1.azurestaticapps.net" 
                   style="background: #1a5f1a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Start Playing Now
                </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 14px; color: #666; margin: 0;">
                Best of luck with your picks!<br>
                The Games Raffle Team
            </p>
        </div>
    </body>
    </html>
    `;
  }

  // Test email functionality
  async testEmail() {
    try {
      const result = await this.sendVerificationEmail(
        config.email.gmail.user,
        '123456',
        'Test User'
      );
      return result;
    } catch (error) {
      logger.error('Email test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();