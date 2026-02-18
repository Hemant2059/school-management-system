import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  /**
   * Send WhatsApp message to a Nepali phone number
   * Format: +977-98XXXXXXXX
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    // Standard Nepal phone format validation
    const nepalPhonePattern = /^\+977-98\d{8}$/;
    if (!nepalPhonePattern.test(to)) {
      console.error(
        `Invalid Nepal phone format: ${to}. Expected +977-98XXXXXXXX`,
      );
      return false;
    }

    try {
      await Promise.resolve(); // Simulate async work
      console.log(`💬 WhatsApp Message Sent to ${to}:`);
      console.log(`   Content: ${message}`);
      // In production, this would call WhatsApp Business API or Twilio
      // Example: await this.twilioClient.messages.create({ ... })
      return true;
    } catch (error) {
      console.error('WhatsApp delivery failed:', error);
      return false;
    }
  }
}
