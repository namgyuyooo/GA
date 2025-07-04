import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CacheConfig {
  updateFrequency: number // 업데이트 주기 (초)
}

const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
  // GA4 데이터 캐시 설정
  'analytics-overview': { updateFrequency: 3600 }, // 1시간
  'analytics-users': { updateFrequency: 3600 },
  'analytics-sessions': { updateFrequency: 3600 },
  'analytics-pageviews': { updateFrequency: 3600 },
  'analytics-conversions': { updateFrequency: 1800 }, // 30분 (중요 데이터)
  'analytics-traffic': { updateFrequency: 3600 },

  // GSC 데이터 캐시 설정
  'search-query': { updateFrequency: 86400 }, // 24시간
  'search-page': { updateFrequency: 86400 },
  'search-country': { updateFrequency: 86400 },
  'search-device': { updateFrequency: 86400 },

  // GTM 데이터 캐시 설정
  'gtm-tags': { updateFrequency: 43200 }, // 12시간
  'gtm-triggers': { updateFrequency: 43200 },
  'gtm-variables': { updateFrequency: 43200 },
  'gtm-versions': { updateFrequency: 43200 },
}

export class CacheService {
  // GA4 데이터 캐시 관리
  static async getCachedAnalyticsData(
    propertyId: string,
    dataType: string,
    period: string,
    fetchFunction?: () => Promise<any>
  ): Promise<any> {
    const key = `analytics-${dataType}`
    const config = DEFAULT_CACHE_CONFIG[key]

    // 캐시된 데이터 조회
    const cached = await prisma.cachedAnalyticsData.findUnique({
      where: {
        propertyId_dataType_period: {
          propertyId,
          dataType,
          period,
        },
      },
    })

    // 캐시가 유효한 경우 반환
    if (cached && cached.expiresAt > new Date()) {
      return {
        data: cached.data,
        fromCache: true,
        lastUpdated: cached.lastUpdated,
      }
    }

    // 캐시가 없거나 만료된 경우 새로 가져오기
    if (fetchFunction) {
      try {
        const freshData = await fetchFunction()
        const expiresAt = new Date(Date.now() + (config?.updateFrequency || 3600) * 1000)

        // 캐시 업데이트 또는 생성
        await prisma.cachedAnalyticsData.upsert({
          where: {
            propertyId_dataType_period: {
              propertyId,
              dataType,
              period,
            },
          },
          update: {
            data: freshData,
            lastUpdated: new Date(),
            expiresAt,
            updateFrequency: config?.updateFrequency || 3600,
          },
          create: {
            propertyId,
            dataType,
            period,
            data: freshData,
            expiresAt,
            updateFrequency: config?.updateFrequency || 3600,
          },
        })

        return {
          data: freshData,
          fromCache: false,
          lastUpdated: new Date(),
        }
      } catch (error) {
        console.error(`Failed to fetch fresh data for ${key}:`, error)
        // 에러 시 기존 캐시라도 반환 (stale-while-revalidate)
        if (cached) {
          return {
            data: cached.data,
            fromCache: true,
            lastUpdated: cached.lastUpdated,
            stale: true,
          }
        }
        throw error
      }
    }

    return null
  }

  // GSC 데이터 캐시 관리
  static async getCachedSearchData(
    siteUrl: string,
    dataType: string,
    period: string,
    fetchFunction?: () => Promise<any>
  ): Promise<any> {
    const key = `search-${dataType}`
    const config = DEFAULT_CACHE_CONFIG[key]

    const cached = await prisma.cachedSearchData.findUnique({
      where: {
        siteUrl_dataType_period: {
          siteUrl,
          dataType,
          period,
        },
      },
    })

    if (cached && cached.expiresAt > new Date()) {
      return {
        data: cached.data,
        fromCache: true,
        lastUpdated: cached.lastUpdated,
      }
    }

    if (fetchFunction) {
      try {
        const freshData = await fetchFunction()
        const expiresAt = new Date(Date.now() + (config?.updateFrequency || 86400) * 1000)

        await prisma.cachedSearchData.upsert({
          where: {
            siteUrl_dataType_period: {
              siteUrl,
              dataType,
              period,
            },
          },
          update: {
            data: freshData,
            lastUpdated: new Date(),
            expiresAt,
            updateFrequency: config?.updateFrequency || 86400,
          },
          create: {
            siteUrl,
            dataType,
            period,
            data: freshData,
            expiresAt,
            updateFrequency: config?.updateFrequency || 86400,
          },
        })

        return {
          data: freshData,
          fromCache: false,
          lastUpdated: new Date(),
        }
      } catch (error) {
        console.error(`Failed to fetch fresh search data for ${key}:`, error)
        if (cached) {
          return {
            data: cached.data,
            fromCache: true,
            lastUpdated: cached.lastUpdated,
            stale: true,
          }
        }
        throw error
      }
    }

    return null
  }

  // GTM 데이터 캐시 관리
  static async getCachedGTMData(
    accountId: string,
    containerId: string,
    dataType: string,
    fetchFunction?: () => Promise<any>
  ): Promise<any> {
    const key = `gtm-${dataType}`
    const config = DEFAULT_CACHE_CONFIG[key]

    const cached = await prisma.cachedGTMData.findUnique({
      where: {
        accountId_containerId_dataType: {
          accountId,
          containerId,
          dataType,
        },
      },
    })

    if (cached && cached.expiresAt > new Date()) {
      return {
        data: cached.data,
        fromCache: true,
        lastUpdated: cached.lastUpdated,
      }
    }

    if (fetchFunction) {
      try {
        const freshData = await fetchFunction()
        const expiresAt = new Date(Date.now() + (config?.updateFrequency || 43200) * 1000)

        await prisma.cachedGTMData.upsert({
          where: {
            accountId_containerId_dataType: {
              accountId,
              containerId,
              dataType,
            },
          },
          update: {
            data: freshData,
            lastUpdated: new Date(),
            expiresAt,
            updateFrequency: config?.updateFrequency || 43200,
          },
          create: {
            accountId,
            containerId,
            dataType,
            data: freshData,
            expiresAt,
            updateFrequency: config?.updateFrequency || 43200,
          },
        })

        return {
          data: freshData,
          fromCache: false,
          lastUpdated: new Date(),
        }
      } catch (error) {
        console.error(`Failed to fetch fresh GTM data for ${key}:`, error)
        if (cached) {
          return {
            data: cached.data,
            fromCache: true,
            lastUpdated: cached.lastUpdated,
            stale: true,
          }
        }
        throw error
      }
    }

    return null
  }

  // 주간 변화율 데이터 계산 및 캐시
  static async calculateWeeklyTrends(propertyId: string, dataType: string): Promise<any> {
    try {
      // 지난 4주간 데이터 수집 (각 주는 7일씩)
      const weeks = []
      const today = new Date()

      for (let i = 0; i < 4; i++) {
        const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)

        const period = `${weekStart.toISOString().split('T')[0]}-${weekEnd.toISOString().split('T')[0]}`

        // 각 주의 데이터 가져오기 (캐시 사용)
        const weekData = await this.getCachedAnalyticsData(propertyId, dataType, period)

        weeks.push({
          weekNumber: i + 1,
          startDate: weekStart,
          endDate: weekEnd,
          data: weekData?.data || null,
        })
      }

      // 변화율 계산
      const changeRates = []
      for (let i = 0; i < 3; i++) {
        const currentWeek = weeks[i]
        const previousWeek = weeks[i + 1]

        if (currentWeek.data && previousWeek.data) {
          const changeRate = this.calculateChangeRate(currentWeek.data, previousWeek.data)
          changeRates.push({
            fromWeek: i + 2,
            toWeek: i + 1,
            changeRate,
          })
        }
      }

      // 결과 저장
      const trendData = {
        week1: weeks[0],
        week2: weeks[1],
        week3: weeks[2],
        week4: weeks[3],
        changeRates,
      }

      await prisma.weeklyTrendData.upsert({
        where: {
          propertyId_dataType: {
            propertyId,
            dataType,
          },
        },
        update: {
          ...trendData,
          calculatedAt: new Date(),
        },
        create: {
          propertyId,
          dataType,
          ...trendData,
        },
      })

      return trendData
    } catch (error) {
      console.error(`Failed to calculate weekly trends for ${dataType}:`, error)
      throw error
    }
  }

  // 변화율 계산 헬퍼 함수
  private static calculateChangeRate(currentData: any, previousData: any): any {
    // 데이터 구조에 따라 적절한 변화율 계산 로직 구현
    const metrics = ['sessions', 'users', 'pageViews', 'conversions', 'revenue']
    const changes: any = {}

    for (const metric of metrics) {
      const current = this.extractMetricValue(currentData, metric)
      const previous = this.extractMetricValue(previousData, metric)

      if (current !== null && previous !== null && previous !== 0) {
        changes[metric] = ((current - previous) / previous) * 100
      } else {
        changes[metric] = null
      }
    }

    return changes
  }

  // 메트릭 값 추출 헬퍼 함수
  private static extractMetricValue(data: any, metric: string): number | null {
    // GA4 API 응답 구조에 맞게 메트릭 값 추출
    try {
      if (data?.rows && Array.isArray(data.rows)) {
        // 총합 계산
        return data.rows.reduce((sum: number, row: any) => {
          const metricIndex = data.metricHeaders?.findIndex(
            (h: any) => h.name === metric || h.name.toLowerCase().includes(metric.toLowerCase())
          )
          if (metricIndex !== -1 && row.metricValues?.[metricIndex]) {
            return sum + parseFloat(row.metricValues[metricIndex].value || '0')
          }
          return sum
        }, 0)
      }
    } catch (error) {
      console.error(`Failed to extract metric ${metric}:`, error)
    }
    return null
  }

  // 만료된 캐시 정리
  static async cleanupExpiredCache(): Promise<void> {
    const now = new Date()

    try {
      await Promise.all([
        prisma.cachedAnalyticsData.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
        prisma.cachedSearchData.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
        prisma.cachedGTMData.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
      ])

      console.log('Expired cache cleaned up successfully')
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error)
    }
  }

  // 캐시 통계 조회
  static async getCacheStats(): Promise<any> {
    try {
      const [analyticsCount, searchCount, gtmCount] = await Promise.all([
        prisma.cachedAnalyticsData.count(),
        prisma.cachedSearchData.count(),
        prisma.cachedGTMData.count(),
      ])

      return {
        analytics: analyticsCount,
        search: searchCount,
        gtm: gtmCount,
        total: analyticsCount + searchCount + gtmCount,
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { analytics: 0, search: 0, gtm: 0, total: 0 }
    }
  }
}

// 캐시 정리를 위한 스케줄링 헬퍼
export const scheduleCacheCleanup = () => {
  // 매시간 만료된 캐시 정리
  setInterval(
    async () => {
      await CacheService.cleanupExpiredCache()
    },
    60 * 60 * 1000
  ) // 1시간
}
