import { normalizePhoneNumber } from '@/utils/number';
import axios from 'axios';

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const META_GRAPH_API_TOKEN = process.env.META_GRAPH_API_TOKEN;

export class WhatsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !META_GRAPH_API_TOKEN) {
    throw new WhatsAppError('WhatsApp API configuration is missing');
  }

  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${META_GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizePhoneNumber(to),
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorMessage = typeof error.response.data === 'object' && 'error' in error.response.data ? error.response.data.error.message : 'Failed to send WhatsApp message';
      throw new WhatsAppError(errorMessage);
    }
    throw new WhatsAppError('Failed to send WhatsApp message');
  }
}
