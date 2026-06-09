type InvitationMailArgs = {
  ownerName: string;
  ownerEmail: string;
  shopName: string;
  setupUrl: string;
};

function logTerminalInvitation({ ownerName, ownerEmail, shopName, setupUrl }: InvitationMailArgs) {
  console.log('');
  console.log('========== TENANT INVITATION ==========');
  console.log(`Shop       : ${shopName}`);
  console.log(`Owner      : ${ownerName}`);
  console.log(`Owner Email: ${ownerEmail}`);
  console.log(`Setup URL  : ${setupUrl}`);
  console.log('Action     : Share this URL with the tenant owner so they can create their password.');
  console.log('=======================================');
  console.log('');
}

function buildInvitationHtml({ ownerName, shopName, setupUrl }: InvitationMailArgs) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Your ${shopName} admin account is ready</h2>
      <p style="line-height: 1.6;">Hi ${ownerName},</p>
      <p style="line-height: 1.6;">
        A super admin created your shop in Bakery POS. Use the button below to create your password and sign in.
      </p>
      <p style="margin: 24px 0;">
        <a href="${setupUrl}" style="background: #ea580c; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
          Create your password
        </a>
      </p>
      <p style="line-height: 1.6;">If the button does not work, open this URL:</p>
      <p style="word-break: break-all; color: #9a3412;">${setupUrl}</p>
      <p style="line-height: 1.6;">This link expires in 24 hours.</p>
    </div>
  `;
}

export async function sendTenantInvitationEmail(args: InvitationMailArgs) {
  const apiKey = process.env.ZEPTOMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || 'Bakery POS';
  const apiUrl = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.com/v1.1/email';

  if (!apiKey || !from) {
    console.log('[tenant-invite] Email not sent because ZEPTOMAIL_API_KEY or EMAIL_FROM is missing.');
    logTerminalInvitation(args);
    return {
      delivered: false,
      provider: 'none',
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        address: from,
        name: fromName,
      },
      to: [
        {
          email_address: {
            address: args.ownerEmail,
            name: args.ownerName,
          },
        },
      ],
      subject: `Set up your ${args.shopName} Bakery POS account`,
      htmlbody: buildInvitationHtml(args),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[tenant-invite] ZeptoMail delivery failed: ${errorText}`);
    logTerminalInvitation(args);
    throw new Error(`Email delivery failed: ${errorText}`);
  }

  return {
    delivered: true,
    provider: 'zeptomail',
  };
}
