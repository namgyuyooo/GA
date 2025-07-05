require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')

async function testGTMAuth() {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    console.log('Service Account Email:', serviceAccount.client_email)

    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/tagmanager.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    )

    console.log('JWT Token generated successfully')

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
    })

    const result = await response.json()
    console.log('OAuth Response:', response.status, result)

    if (result.access_token) {
      console.log('✅ Access token obtained successfully')

      // Test GTM API access
      const gtmResponse = await fetch(
        'https://tagmanager.googleapis.com/tagmanager/v2/accounts/6016627088/containers',
        {
          headers: { Authorization: `Bearer ${result.access_token}` },
        }
      )

      const gtmResult = await gtmResponse.json()
      console.log('GTM API Response:', gtmResponse.status, gtmResult)
    } else {
      console.log('❌ Failed to get access token')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testGTMAuth()
