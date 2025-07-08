import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config/env-config.json')
const EXAMPLE_CONFIG_PATH = path.join(process.cwd(), 'config/env-config.example.json')

export async function GET() {
  try {
    console.log('📋 Loading environment configuration...')
    
    let configData
    try {
      // Try to load the actual config file first
      const configContent = await fs.readFile(CONFIG_PATH, 'utf-8')
      configData = JSON.parse(configContent)
      console.log('✅ Loaded actual config file')
    } catch (error) {
      // If actual config doesn't exist, fall back to example
      console.log('📝 Actual config not found, loading example config')
      const exampleContent = await fs.readFile(EXAMPLE_CONFIG_PATH, 'utf-8')
      configData = JSON.parse(exampleContent)
      console.log('✅ Loaded example config file')
    }
    
    return NextResponse.json(configData)
  } catch (error: any) {
    console.error('❌ Error loading configuration:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving environment configuration...')
    
    const config = await request.json()
    
    // Validate the configuration structure
    if (!config.categories || !config.name || !config.version) {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      )
    }
    
    // Add metadata
    const now = new Date().toISOString()
    const configWithMetadata = {
      ...config,
      metadata: {
        ...config.metadata,
        updated_at: now,
        created_at: config.metadata?.created_at || now
      }
    }
    
    // Save to file
    const configContent = JSON.stringify(configWithMetadata, null, 2)
    await fs.writeFile(CONFIG_PATH, configContent, 'utf-8')
    
    console.log('✅ Configuration saved successfully')
    
    // Apply environment variables to the current process
    await applyEnvironmentVariables(configWithMetadata)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved and applied successfully',
      timestamp: now
    })
  } catch (error: any) {
    console.error('❌ Error saving configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration', details: error.message },
      { status: 500 }
    )
  }
}

async function applyEnvironmentVariables(config: any) {
  console.log('🔄 Applying environment variables...')
  
  let envContent = ''
  const envComments: Record<string, string> = {
    database: '# Database (Supabase)',
    google_analytics: '# Google Analytics & Search Console',
    ai_gemini: '# Gemini API Configuration',
    authentication: '# Authentication',
    optional: '# Optional Settings'
  }
  
  // Generate .env file content
  Object.entries(config.categories).forEach(([categoryKey, category]: [string, any]) => {
    if (envComments[categoryKey]) {
      envContent += `\\n${envComments[categoryKey]}\\n`
    }
    
    Object.entries(category.variables).forEach(([varKey, variable]: [string, any]) => {
      if (variable.value) {
        envContent += `${varKey}=${variable.value}\\n`
      }
    })
  })
  
  // Write to .env file
  const envPath = path.join(process.cwd(), '.env')
  await fs.writeFile(envPath, envContent.trim(), 'utf-8')
  
  console.log('✅ Environment variables applied to .env file')
  
  // Note: In a production environment, you might want to restart the server
  // or use a more sophisticated approach to reload environment variables
  console.log('ℹ️  Note: Server restart may be required for changes to take effect')
}