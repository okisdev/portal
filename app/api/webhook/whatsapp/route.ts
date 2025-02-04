import { appRouter } from '@/server/root';
import { createCallerFactory, createTRPCContext } from '@/server/trpc';
import ky from 'ky';
import { type NextRequest, NextResponse } from 'next/server';

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const META_GRAPH_API_TOKEN = process.env.META_GRAPH_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    // log incoming messages
    console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

    // Create tRPC caller
    const ctx = await createTRPCContext({
      headers: req.headers,
      // Since this is a webhook, we'll create an anonymous session
      session: null,
    });
    const caller = createCallerFactory(appRouter)(ctx);

    // Handle message status updates
    const status = body.entry?.[0]?.changes[0]?.value?.statuses?.[0];
    if (status) {
      await caller.external.handleWhatsAppMessageStatus({
        messageId: status.id,
        status: status.status,
        timestamp: Number(status.timestamp),
        recipientId: status.recipient_id,
        conversationId: status.conversation?.id,
        metadata: status,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // check if the webhook request contains a message
    const message = body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    // check if the incoming message contains text
    if (message?.type === 'text') {
      // Save the message as a contact activity
      await caller.external.receiveWhatsAppMessageToContactActivity({
        from: message.from,
        message: message.text.body,
        messageId: message.id,
        timestamp: Number(message.timestamp),
      });

      // Mark message as read
      await ky.post(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        headers: {
          Authorization: `Bearer ${META_GRAPH_API_TOKEN}`,
        },
        json: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: message.id,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // check the mode and token sent are correct
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      // respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully!');
      return new NextResponse(challenge, { status: 200 });
    }

    // respond with '403 Forbidden' if verify tokens do not match
    return new NextResponse(null, { status: 403 });
  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
