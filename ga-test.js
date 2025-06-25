require('dotenv').config({ path: '.env.local' });
const { GoogleAuth } = require('google-auth-library');

async function testGA4Connection() {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const serviceAccountKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!propertyId || !serviceAccountKeyRaw) {
        console.error('🔴 GA4_PROPERTY_ID 또는 GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다.');
        console.error('🔴 .env.local 파일에 변수가 올바르게 설정되었는지 확인하세요.');
        return;
    }

    console.log(`- 테스트할 Property ID: ${propertyId}`);

    try {
        // 따옴표로 감싸진 경우, 파싱 전에 제거
        const cleanedServiceAccountKey = serviceAccountKeyRaw.startsWith("'") && serviceAccountKeyRaw.endsWith("'")
            ? serviceAccountKeyRaw.slice(1, -1)
            : serviceAccountKeyRaw;

        const serviceAccountKey = JSON.parse(cleanedServiceAccountKey);
        console.log(`- 서비스 계정 이메일: ${serviceAccountKey.client_email}`);

        const auth = new GoogleAuth({
            credentials: serviceAccountKey,
            scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        });

        const authClient = await auth.getClient();
        const accessToken = await authClient.getAccessToken();

        console.log('- 인증 토큰 발급 성공');

        const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
                    metrics: [{ name: 'activeUsers' }],
                }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            console.log('✅ 테스트 성공! API 응답:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.error(`🔴 테스트 실패 (HTTP ${response.status}):`);
            try {
                console.error(JSON.stringify(JSON.parse(errorText), null, 2));
            } catch {
                console.error(errorText);
            }
        }
    } catch (error) {
        console.error('🔴 스크립트 실행 중 오류 발생:');
        if (error instanceof SyntaxError) {
            console.error("GOOGLE_SERVICE_ACCOUNT_KEY의 JSON 형식이 잘못되었습니다. 키 값 전체를 작은따옴표(')로 감쌌는지 확인하세요.");
        }
        console.error(error.message);
    }
}

testGA4Connection(); 