import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // GA4 Management API를 사용하여 사용자가 접근 가능한 계정 목록 조회
    const response = await fetch(
      'https://www.googleapis.com/analytics/v3/management/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Admin API error: ${errorText}`);
    }

    const data = await response.json();
    
    // 계정 목록을 가져왔으므로, 각 계정의 속성도 조회해야 함
    let allProperties = [];
    
    if (data.items && data.items.length > 0) {
      // 첫 번째 계정의 속성 목록 조회
      const firstAccount = data.items[0];
      const propertiesResponse = await fetch(
        `https://www.googleapis.com/analytics/v3/management/accounts/${firstAccount.id}/webproperties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        allProperties = propertiesData.items || [];
      }
    }
    
    return NextResponse.json({
      accounts: data.items || [],
      properties: allProperties,
      count: allProperties.length
    });

  } catch (error) {
    console.error('Properties API Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}