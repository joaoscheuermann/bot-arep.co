export interface CampaingInformationResponse {
  campaign: Campaign
  referrer: Referrer
  reCaptcha: boolean
  validateEmail: boolean
  clientAddress: string
}

export interface CreateCampaingAccountResponse {
  oid: number
}

export interface Campaign {
  name: string
  oid: number
}

export interface Referrer {
  firstName: string
  lastName: string
  urlType: string
  shortUrlOid: number
  channel: string
}
