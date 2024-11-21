import axios, { AxiosRequestConfig } from 'axios';

export interface MessageResponse {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  html?: string[],
  text?: string;
}

export interface MessagesResponse {
  'hydra:totalItems': number;
  'hydra:member': MessageResponse[];
}

export const getDomains = (config?: AxiosRequestConfig) => {
  return axios.get<{
    'hydra:totalItems': number;
    'hydra:member': { domain: string }[];
  }>(`https://api.mail.tm/domains`, config);
};

export const getRandomDomain = async (config?: AxiosRequestConfig) => {
  const domains = await getDomains(config);

  const randomIndex = Math.floor(
    Math.random() * domains.data['hydra:totalItems']
  );

  return domains.data['hydra:member'][randomIndex];
};

export const createAccount = async (
  data: { address: string; password: string },
  config?: AxiosRequestConfig
) => {
  return axios.post<{ id: string }>(
    `https://api.mail.tm/accounts`,
    data,
    config
  );
};

export const createToken = async (
  data: { address: string; password: string },
  config?: AxiosRequestConfig
) => {
  return axios.post<{ token: string }>(
    `https://api.mail.tm/token`,
    data,
    config
  );
};

export const createRandomEmail = async (config?: AxiosRequestConfig) => {
  const domains = await getDomains(config);
  const domain = domains.data['hydra:member'][0].domain;

  const address = `${Math.random().toString(36).substring(2, 11)}@${domain}`;
  const password = Math.random().toString(36).substring(2, 11);

  const account = await createAccount({ address, password }, config);
  const token = await createToken({ address, password }, config);

  return { address, password, id: account.data.id, token: token.data.token };
};

export const getMessages = async (config?: AxiosRequestConfig) => {
  return axios.get<MessagesResponse>(`https://api.mail.tm/messages`, config);
};

export const getMessage = async (id: string, config?: AxiosRequestConfig) => {
  return axios.get<MessageResponse>(`https://api.mail.tm/messages/${id}`, config);
};

// a method that recieves an callback function as argument and calls it with all the recieved messages
// when the callback returns true, the polling stops and the message is returned
export const pollMessage = async (
  callback: (message: MessageResponse) => boolean,
  delay: number,
  config?: AxiosRequestConfig
) => {
  while (true) {
    const messages = await getMessages(config);

    for (const message of messages.data['hydra:member']) {
      if (callback(message)) {
        return await getMessage(message.id, config);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
