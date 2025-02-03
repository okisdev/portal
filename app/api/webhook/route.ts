/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from 'axios';
import { type NextRequest, NextResponse } from 'next/server';

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    // log incoming messages
    console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

    // check if the webhook request contains a message
    const message = body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    // check if the incoming message contains text
    if (message?.type === 'text') {
      // extract the business number to send the reply from it
      const business_phone_number_id = body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      // send a reply message
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to: message.from,
          text: { body: `Echo: ${message.text.body}` },
          context: {
            message_id: message.id,
          },
        },
      });

      // mark incoming message as read
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
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
