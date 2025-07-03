const SPREADSHEET_ID = '17k0Cl7qJbkowaLmtNRpjvdmqJ7His0127aalnzhIucg'
const SHEET_NAME = 'UTM_Campaigns'

interface UTMCampaign {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  term?: string | null
  content?: string | null
  url: string
  description?: string | null
  status?: string
  createdAt: string
}

// Google Sheets API configuration
export class GoogleSheetsService {
  private serviceAccountKey: any

  constructor() {
    try {
      this.serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')
    } catch (error) {
      console.error('Failed to parse service account key:', error)
    }
  }

  public async getAccessToken(): Promise<string> {
    const jwt = require('jsonwebtoken')
    
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        iss: this.serviceAccountKey.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      this.serviceAccountKey.private_key,
      { algorithm: 'RS256' }
    )

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
    })

    const data = await response.json()
    return data.access_token
  }

  async getCampaigns(): Promise<UTMCampaign[]> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:K`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()
      
      if (!data.values || data.values.length <= 1) {
        return []
      }

      // Skip header row and convert to campaign objects
      return data.values.slice(1).map((row: string[], index: number) => ({
        id: row[0] || String(index + 1),
        name: row[1] || '',
        source: row[2] || '',
        medium: row[3] || '',
        campaign: row[4] || '',
        term: row[5] || null,
        content: row[6] || null,
        url: row[7] || '',
        description: row[8] || null,
        status: row[9] || 'ACTIVE',
        createdAt: row[10] || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching campaigns from Google Sheets:', error)
      return []
    }
  }

  async addCampaign(campaign: Omit<UTMCampaign, 'id' | 'createdAt'>): Promise<UTMCampaign> {
    try {
      const accessToken = await this.getAccessToken()
      const campaigns = await this.getCampaigns()
      
      const newCampaign: UTMCampaign = {
        id: String(campaigns.length + 1),
        ...campaign,
        createdAt: new Date().toISOString()
      }

      const values = [[
        newCampaign.id,
        newCampaign.name,
        newCampaign.source,
        newCampaign.medium,
        newCampaign.campaign,
        newCampaign.term || '',
        newCampaign.content || '',
        newCampaign.url,
        newCampaign.description || '',
        newCampaign.status || 'ACTIVE',
        newCampaign.createdAt
      ]]

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:K:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values
          }),
        }
      )

      return newCampaign
    } catch (error) {
      console.error('Error adding campaign to Google Sheets:', error)
      throw error
    }
  }

  async updateCampaignStatus(id: string, status: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken()
      const campaigns = await this.getCampaigns()
      
      const campaignIndex = campaigns.findIndex(c => c.id === id)
      if (campaignIndex === -1) {
        throw new Error('Campaign not found')
      }

      // Update the status column (column J, index 9)
      const range = `${SHEET_NAME}!J${campaignIndex + 2}` // +2 because of header row and 0-based index
      
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[status]]
          }),
        }
      )
    } catch (error) {
      console.error('Error updating campaign status in Google Sheets:', error)
      throw error
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken()
      const campaigns = await this.getCampaigns()
      
      const campaignIndex = campaigns.findIndex(c => c.id === id)
      if (campaignIndex === -1) {
        throw new Error('Campaign not found')
      }

      // Delete the row (this is more complex in Google Sheets API)
      // For now, we'll just mark it as DELETED
      await this.updateCampaignStatus(id, 'DELETED')
    } catch (error) {
      console.error('Error deleting campaign from Google Sheets:', error)
      throw error
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()