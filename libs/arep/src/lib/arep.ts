import axios, { AxiosRequestConfig } from 'axios';
import {
  CampaingInformationResponse,
  CreateCampaingAccountResponse,
} from '../types';

export const getCampaingInformation = (
  uri: string,
  config: AxiosRequestConfig
) => {
  return axios.get<CampaingInformationResponse>(
    `https://arep.co/api/v1/cn/campaign-uri?$filter=uri=/${uri}`,
    config
  );
};

export const sendCampaingPageView = (
  data: { pageName: string; version: 2; campaignOid: string | number },
  config: AxiosRequestConfig
) => {
  return axios.post(
    `https://arep.co/api/v1/cn/campaign-page-view`,
    data,
    config
  );
};

export const createCampaingAccount = (
  data: { email: string } | { campaignOid: string | number },
  config: AxiosRequestConfig
) => {
  return axios.post<CreateCampaingAccountResponse>(
    `https://arep.co/api/v1/cn/campaign-account`,
    'campaignOid' in data
      ? data
      : {
          city: null,
          country: null,
          emailAddress: data.email,
          firstName: null,
          lastName: null,
          postcode: null,
          registrationType: 'email',
          state: null,
          streetAddress: null,
        },
    config
  );
};

export interface TriggerEmailVerificationPayload {
  uri: string;
  registrationType: 'email' | string;
  selectedVenue: string;
  cfMap: unknown[];
}

export interface TriggerEmailVerificationResponse {
  result: string;
  validationType: 'email-address' | string;
}

export const triggetEmailVerification = (
  data: TriggerEmailVerificationPayload,
  config?: AxiosRequestConfig
) => {
  return axios.post<TriggerEmailVerificationResponse>(
    `https://arep.co/api/v1/cn/campaign-fan`,
    data,
    config
  );
};

export const verifyEmail = (
  data: { campaign: string | number; email: string; code: string },
  config: AxiosRequestConfig
) => {
  return axios.post(`https://arep.co/api/v1/cn/fan-email-verify`, {
    campaignOid: data.campaign,
    emailAddress: data.email,
    shortCode: data.code,
  }, config);
};
