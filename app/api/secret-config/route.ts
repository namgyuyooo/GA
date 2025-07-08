import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SECRET_CONFIG_PATH = path.join(process.cwd(), 'config/secret.json')
const SECRET_EXAMPLE_PATH = path.join(process.cwd(), 'config/secret.example.json')

export async function GET() {
  try {
    console.log('🔐 Loading secret configuration...')
    
    let secretData
    try {
      // Try to load the actual secret file first
      const secretContent = await fs.readFile(SECRET_CONFIG_PATH, 'utf-8')
      secretData = JSON.parse(secretContent)
      console.log('✅ Loaded actual secret file')
    } catch (error) {
      // If actual secret doesn't exist, fall back to example (with masked values)
      console.log('📝 Actual secret not found, loading example config')
      const exampleContent = await fs.readFile(SECRET_EXAMPLE_PATH, 'utf-8')
      secretData = JSON.parse(exampleContent)
      console.log('✅ Loaded example secret file')
    }
    
    // Always mask sensitive values in the response for security
    const maskedSecretData = maskSensitiveData(secretData)
    
    return NextResponse.json(maskedSecretData)
  } catch (error: any) {
    console.error('❌ Error loading secret configuration:', error)
    return NextResponse.json(
      { error: 'Failed to load secret configuration', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Saving secret configuration...')
    
    const incomingData = await request.json()
    let currentSecretConfig: any

    // Load current secret config
    try {
      const secretContent = await fs.readFile(SECRET_CONFIG_PATH, 'utf-8')
      currentSecretConfig = JSON.parse(secretContent)
    } catch (error) {
      // If secret.json doesn't exist, load from example as a base
      const exampleContent = await fs.readFile(SECRET_EXAMPLE_PATH, 'utf-8')
      currentSecretConfig = JSON.parse(exampleContent)
      console.warn('secret.json not found, using secret.example.json as base.')
    }

    let updatedSecretConfig = { ...currentSecretConfig }

    // Handle partial update for google_service_account
    if (incomingData.google_service_account) {
      updatedSecretConfig.secrets = updatedSecretConfig.secrets || {}
      updatedSecretConfig.secrets.google_service_account = incomingData.google_service_account
      console.log('Partial update: Google Service Account key received.')
    } else if (incomingData.secrets && incomingData.name && incomingData.version) {
      // Handle full secret config update
      updatedSecretConfig = incomingData
      console.log('Full secret config received.')
    } else {
      return NextResponse.json(
        { error: 'Invalid request body format. Expected full secret config or google_service_account object.' },
        { status: 400 }
      )
    }
    
    // Validate the updated secret configuration structure
    if (!updatedSecretConfig.secrets || !updatedSecretConfig.name || !updatedSecretConfig.version) {
      return NextResponse.json(
        { error: 'Invalid secret configuration format after update' },
        { status: 400 }
      )
    }
    
    // Validate required secret sections (only if full config is being saved)
    const requiredSections = ['google_service_account', 'ai_apis', 'authentication']
    for (const section of requiredSections) {
      if (!updatedSecretConfig.secrets[section]) {
        return NextResponse.json(
          { error: `Missing required secret section after update: ${section}` },
          { status: 400 }
        )
      }
    }
    
    // Add metadata
    const now = new Date().toISOString()
    updatedSecretConfig.metadata = {
      ...updatedSecretConfig.metadata,
      updated_at: now,
      created_at: updatedSecretConfig.metadata?.created_at || now
    }
    
    // Save to file
    const secretContent = JSON.stringify(updatedSecretConfig, null, 2)
    await fs.writeFile(SECRET_CONFIG_PATH, secretContent, 'utf-8')
    
    console.log('✅ Secret configuration saved successfully')
    
    // Apply environment variables from both secrets and non-sensitive config
    await applySecretEnvironmentVariables(updatedSecretConfig)
    
    return NextResponse.json({
      success: true,
      message: 'Secret configuration saved and applied successfully',
      timestamp: now
    })
  } catch (error: any) {
    console.error('❌ Error saving secret configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save secret configuration', details: error.message },
      { status: 500 }
    )
  }
}

function maskSensitiveData(secretData: any) {
  const masked = JSON.parse(JSON.stringify(secretData))
  
  // Mask secrets section
  if (masked.secrets) {
    // Database secrets
    if (masked.secrets.database?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      masked.secrets.database.NEXT_PUBLIC_SUPABASE_ANON_KEY = maskString(masked.secrets.database.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
    
    // Google Service Account
    if (masked.secrets.google_service_account) {
      if (masked.secrets.google_service_account.private_key) {
        masked.secrets.google_service_account.private_key = '-----BEGIN PRIVATE KEY-----\n[MASKED]\n-----END PRIVATE KEY-----\n'
      }
      if (masked.secrets.google_service_account.private_key_id) {
        masked.secrets.google_service_account.private_key_id = maskString(masked.secrets.google_service_account.private_key_id)
      }
      if (masked.secrets.google_service_account.client_id) {
        masked.secrets.google_service_account.client_id = maskString(masked.secrets.google_service_account.client_id)
      }
    }
    
    // AI API keys
    if (masked.secrets.ai_apis) {
      if (masked.secrets.ai_apis.GEMINI_API_KEY) {
        masked.secrets.ai_apis.GEMINI_API_KEY = maskString(masked.secrets.ai_apis.GEMINI_API_KEY)
      }
      if (masked.secrets.ai_apis.GEMINI_API_FREE_KEY) {
        masked.secrets.ai_apis.GEMINI_API_FREE_KEY = maskString(masked.secrets.ai_apis.GEMINI_API_FREE_KEY)
      }
    }
    
    // Authentication
    if (masked.secrets.authentication) {
      if (masked.secrets.authentication.JWT_SECRET) {
        masked.secrets.authentication.JWT_SECRET = maskString(masked.secrets.authentication.JWT_SECRET)
      }
      if (masked.secrets.authentication.SUPER_USER_PASSWORD) {
        masked.secrets.authentication.SUPER_USER_PASSWORD = maskString(masked.secrets.authentication.SUPER_USER_PASSWORD)
      }
    }
  }
  
  return masked
}

function maskString(str: string): string {
  if (!str) return str
  if (str.length <= 8) return '••••••••'
  return str.substring(0, 4) + '••••••••' + str.substring(str.length - 4)
}

async function applySecretEnvironmentVariables(secretConfig: any) {
  console.log('🔄 Applying secret environment variables...')
  
  let envContent = ''
  
  // Add database section
  envContent += '# Database (Supabase)\n'
  if (secretConfig.non_sensitive_config?.database?.NEXT_PUBLIC_SUPABASE_URL) {
    envContent += `NEXT_PUBLIC_SUPABASE_URL=${secretConfig.non_sensitive_config.database.NEXT_PUBLIC_SUPABASE_URL}\n`
  }
  if (secretConfig.secrets?.database?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    envContent += `NEXT_PUBLIC_SUPABASE_ANON_KEY=${secretConfig.secrets.database.NEXT_PUBLIC_SUPABASE_ANON_KEY}\n`
  }
  if (secretConfig.non_sensitive_config?.database?.DATABASE_URL) {
    envContent += `DATABASE_URL=${secretConfig.non_sensitive_config.database.DATABASE_URL}\n`
  }
  
  // Add Google Analytics & Search Console section
  envContent += '\n# Google Analytics & Search Console\n'
  if (secretConfig.non_sensitive_config?.google_analytics?.GA4_PROPERTY_ID) {
    envContent += `GA4_PROPERTY_ID=${secretConfig.non_sensitive_config.google_analytics.GA4_PROPERTY_ID}\n`
  }
  if (secretConfig.non_sensitive_config?.google_analytics?.GSC_SITE_URL) {
    envContent += `GSC_SITE_URL=${secretConfig.non_sensitive_config.google_analytics.GSC_SITE_URL}\n`
  }
  if (secretConfig.secrets?.google_service_account) {
    const gsa = secretConfig.secrets.google_service_account
    if (gsa.client_email) {
      envContent += `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=${gsa.client_email}\n`
    }
    if (gsa.private_key) {
      // For multi-line private key, ensure it's properly quoted and newlines are preserved
      // Replace all occurrences of \n with actual newlines, then wrap in double quotes
      const privateKeyContent = gsa.private_key.replace(/\\n/g, '\n')
      // Use template literal for multi-line string in .env, or ensure proper quoting
      // If it contains internal quotes, they need to be escaped.
      // A simple approach for multi-line is to use double quotes and escape internal double quotes.
      const escapedPrivateKey = privateKeyContent.replace(/"/g, '\"')
      envContent += `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="${escapedPrivateKey}"\n`
    }
  }
  
  // Add Gemini API section
  envContent += '\n# Gemini API Configuration\n'
  if (secretConfig.secrets?.ai_apis?.GEMINI_API_FREE_KEY) {
    envContent += `GEMINI_API_FREE_KEY=${secretConfig.secrets.ai_apis.GEMINI_API_FREE_KEY}\n`
  }
  if (secretConfig.non_sensitive_config?.google_analytics?.GEMINI_API_PROJECT_ID) {
    envContent += `GEMINI_API_PROJECT_ID=${secretConfig.non_sensitive_config.google_analytics.GEMINI_API_PROJECT_ID}\n`
  }
  if (secretConfig.secrets?.ai_apis?.GEMINI_API_KEY) {
    envContent += `GEMINI_API_KEY=${secretConfig.secrets.ai_apis.GEMINI_API_KEY}\n`
  }
  
  // Add Authentication section
  envContent += '\n# Authentication\n'
  if (secretConfig.secrets?.authentication?.JWT_SECRET) {
    envContent += `JWT_SECRET=${secretConfig.secrets.authentication.JWT_SECRET}\n`
  }
  if (secretConfig.non_sensitive_config?.user_info?.SUPER_USER_EMAIL) {
    envContent += `SUPER_USER_EMAIL=${secretConfig.non_sensitive_config.user_info.SUPER_USER_EMAIL}\n`
  }
  if (secretConfig.secrets?.authentication?.SUPER_USER_PASSWORD) {
    envContent += `SUPER_USER_PASSWORD=${secretConfig.secrets.authentication.SUPER_USER_PASSWORD}\n`
  }
  if (secretConfig.non_sensitive_config?.user_info?.SUPER_USER_NAME) {
    envContent += `SUPER_USER_NAME=${secretConfig.non_sensitive_config.user_info.SUPER_USER_NAME}\n`
  }
  
  // Write to .env file
  const envPath = path.join(process.cwd(), '.env')
  await fs.writeFile(envPath, envContent, 'utf-8')
  
  console.log('✅ Secret environment variables applied to .env file')
  console.log('ℹ️  Note: Server restart may be required for changes to take effect')
}