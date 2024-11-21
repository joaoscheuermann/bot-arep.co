import { HttpsProxyAgent } from 'https-proxy-agent';
import { parse } from 'node-html-parser';

import * as arep from '@bot/arep';
import * as mail from '@bot/mail';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const URI = 'https://arep.co/3JHRg';

const DEFAULT_HEADERS = {
  'User-Agent': USER_AGENT,
  Referrer: URI,
};

function step<T>(step: string, callback: () => T) {
  console.log(step);
  return callback();
}

async function worker() {
  const httpsAgent = new HttpsProxyAgent(
    'http://brd-customer-hl_3b4988e1-zone-arep:dmsw1j32r4kj@brd.superproxy.io:22225'
  );

  const email = await step('Creating a random email', async () => {
    const response = await mail.createRandomEmail({ httpsAgent });

    console.log(response.address, response.password);

    return response;
  });

  const campaign = await step('Getting the campaign information', () => {
    const target = URI.split('/').pop();

    return arep.getCampaingInformation(target, {
      httpsAgent,
      headers: DEFAULT_HEADERS,
    });
  });

  const arepAuthCookie = await step(
    'Retrieving initial AREP auth cookie',
    async () => {
      const initialCampaingRegistration = await arep.createCampaingAccount(
        { campaignOid: campaign.data.campaign.oid },
        {
          httpsAgent,
          headers: DEFAULT_HEADERS,
        }
      );

      if (initialCampaingRegistration.status !== 201) {
        throw new Error(
          'Failed to register the campaing account and retrieve the token'
        );
      }

      const arepAuthToken = initialCampaingRegistration.headers['x-auth-token'];
      const arepAuthCookie = `_ar_fan_auth_token_=${arepAuthToken}`;

      return arepAuthCookie;
    }
  );

  await step('Creating a campaing account', async () => {
    const response = await arep.createCampaingAccount(
      { email: email.address },
      {
        httpsAgent,
        headers: {
          Cookie: arepAuthCookie,
          ...DEFAULT_HEADERS,
        },
      }
    );

    if (response.status !== 201) {
      throw new Error('Failed to create the campaing account');
    }
  });

  await step('Triggering email verification', async () => {
    const target = URI.split('/').pop();

    const response = await arep.triggetEmailVerification(
      {
        uri: `/${target}/register/`,
        registrationType: 'email',
        selectedVenue: '',
        cfMap: [],
      },
      {
        httpsAgent,
        headers: {
          Cookie: arepAuthCookie,
          ...DEFAULT_HEADERS,
        },
      }
    );

    if (response.status !== 202) {
      throw new Error('Failed to trigger email verification');
    }
  });

  await step('Verifying email', async () => {
    const message = await mail.pollMessage(
      (message) => {
        return (
          message.from.address.includes('alerts@') &&
          message.subject.includes('Confirm your email address')
        );
      },
      1000,
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${email.token}`,
        },
      }
    );

    if (!message.data.html) {
      throw new Error('Failed to retrieve the email content');
    }

    const body = parse(message.data.html[0]);
    const code = body.querySelector('span[class=title]').text;

    console.log(`Found code: ${code}`);

    const response = await arep.verifyEmail(
      {
        campaign: campaign.data.campaign.oid,
        email: email.address,
        code: code
      },
      {
        httpsAgent,
        headers: {
          Cookie: arepAuthCookie,
          ...DEFAULT_HEADERS,
        },
      }
    );

    if (response.status !== 201) {
      throw new Error('Failed to verify email');
    }
  });
}

async function farm() {
  for (;;) {
    console.log('===== Starting worker =====');
    await worker();
    console.log('===== Finished worker =====\n\n');
  }
}

farm()
  .then(() => {
    console.log('done');
  });
