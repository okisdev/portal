import { Client } from '@larksuiteoapi/node-sdk';

if (!process.env.LARK_APP_ID || !process.env.LARK_APP_SECRET) {
  throw new Error('Lark credentials not found in environment variables');
}

const lark = new Client({
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  // appType:
});

interface SendLarkMessageParams {
  userEmail: string;
  title: string;
  content: string;
  metadata?: Record<string, string>;
}

export async function sendLarkMessage({ userEmail, title, content, metadata }: SendLarkMessageParams) {
  try {
    const larkUserId = await getLarkUserId(userEmail);

    if (!larkUserId) {
      throw new Error('Lark user ID not found');
    }

    const response = await lark.im.message.create({
      params: {
        receive_id_type: 'open_id',
      },
      data: {
        receive_id: larkUserId,
        msg_type: 'interactive',
        content: JSON.stringify({
          config: {
            wide_screen_mode: true,
          },
          elements: [
            {
              tag: 'div',
              text: {
                content,
                tag: 'lark_md',
              },
            },
            metadata && {
              tag: 'div',
              text: {
                content: `Additional Info: ${JSON.stringify(metadata)}`,
                tag: 'lark_md',
              },
            },
          ].filter(Boolean),
          header: {
            template: 'blue',
            title: {
              content: title,
              tag: 'plain_text',
            },
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error sending Lark message:', error);
    throw error;
  }
}

async function getLarkUserId(userEmail: string): Promise<string | null> {
  try {
    const response = await lark.contact.user.batchGetId({
      params: {
        user_id_type: 'open_id',
      },
      data: {
        emails: [userEmail],
      },
    });

    console.log(response);

    if (response?.data?.user_list?.[0]?.user_id) {
      return response.data.user_list[0].user_id;
    }

    return null;
  } catch (error) {
    console.error('Error getting Lark user ID:', error);
    return null;
  }
}
