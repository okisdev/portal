import ky from 'ky';

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const META_GRAPH_API_TOKEN = process.env.META_GRAPH_API_TOKEN;

export class WhatsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `WhatsAppError: ${message}`;
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !META_GRAPH_API_TOKEN) {
    throw new WhatsAppError('WhatsApp API configuration is missing');
  }

  try {
    const response = await ky.post(`https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      headers: {
        Authorization: `Bearer ${META_GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      json: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      },
    });

    return response.json();
  } catch (error) {
    throw new WhatsAppError(`Failed to send WhatsApp message: ${error}`);
  }
}
