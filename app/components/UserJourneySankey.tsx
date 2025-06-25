import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { Chart, registerables } from 'chart.js';
import { Chart as ChartJS } from 'react-chartjs-2';
import { useEffect } from 'react';

Chart.register(...registerables, SankeyController, Flow);

interface SankeyProps {
  data: {
    pageTransitions: { from: string; to: string; count: number }[];
  };
}

export default function UserJourneySankey({ data }: SankeyProps) {
  // Sankey 데이터 변환
  const sankeyData = {
    nodes: [],
    links: [],
  } as any;

  // 노드/링크 생성
  const nodeSet = new Set<string>();
  data.pageTransitions.forEach(({ from, to }) => {
    nodeSet.add(from);
    nodeSet.add(to);
  });
  sankeyData.nodes = Array.from(nodeSet).map((id) => ({ id }));

  sankeyData.links = data.pageTransitions.map(({ from, to, count }) => ({
    source: from,
    target: to,
    value: count,
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Mixpanel Flow 스타일 유저 플로우</h3>
      <ChartJS
        type="sankey"
        data={{
          datasets: [
            {
              label: 'User Journey Flow',
              data: sankeyData,
              colorFrom: () => 'blue',
              colorTo: () => 'gray',
              colorMode: 'gradient',
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const link = ctx.raw;
                  return `${link.source} → ${link.target}: ${link.value}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
} 