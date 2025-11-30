"use client";

import React from "react";
import { Sankey, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface SankeyNode {
  name: string;
  x?: number;
  y?: number;
  value?: number;
}

interface SankeyLink {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyChartProps {
  data?: {
    nodes: Array<{ name: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  };
}

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: SankeyNode & { value?: number }; // Combine SankeyNode with optional value
  containerWidth: number;
}

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  sourceRelativeY: number;
  targetRelativeY: number;
  linkWidth: number;
  index: number;
  payload?: Omit<SankeyLink, "source" | "target"> & {
    source: SankeyNode;
    target: SankeyNode;
    value?: number;
  };
  value?: number;
  key?: React.Key | null;
}

const CustomNode = (props: CustomNodeProps) => {
  const { x, y, width, height, index, payload, containerWidth } = props;
  const isOut = x > containerWidth / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[index % COLORS.length]}
        fillOpacity={0.8}
      />
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
      >
        {payload?.name}
      </text>
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 16}
        textAnchor={isOut ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
        fill="#999"
      >
        ¥{payload?.value?.toLocaleString()}
      </text>
    </g>
  );
};

const CustomLink = (props: CustomLinkProps) => {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
  } = props;
  const gradientId = `linkGradient${index}`;
  const color = COLORS[index % COLORS.length];

  return (
    <>
      <defs>
        <linearGradient id={gradientId}>
          <stop offset="20%" stopColor={color} stopOpacity={0.2} />
          <stop offset="80%" stopColor={color} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <path
        d={`M${sourceX},${sourceY + linkWidth / 2} 
           C${sourceControlX},${sourceY + linkWidth / 2} 
           ${targetControlX},${targetY + linkWidth / 2} 
           ${targetX},${targetY + linkWidth / 2}
           L${targetX},${targetY - linkWidth / 2} 
           C${targetControlX},${targetY - linkWidth / 2} 
           ${sourceControlX},${sourceY - linkWidth / 2} 
           ${sourceX},${sourceY - linkWidth / 2} Z`}
        fill={`url(#${gradientId})`}
        strokeWidth="0"
      />
    </>
  );
};

export const SankeyChart: React.FC<SankeyChartProps> = ({ data }) => {
  if (!data || !data.nodes || !data.links) {
    return <div>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={data}
        node={(nodeProps) => (
          <CustomNode {...nodeProps} containerWidth={1000} />
        )}
        link={(linkProps) => <CustomLink {...linkProps} />}
        nodePadding={20}
        margin={{ top: 20, right: 160, bottom: 20, left: 50 }}
      >
        <Tooltip
          formatter={(value: number, name: string) => [
            `¥${value.toLocaleString()}`,
            name,
          ]}
          labelFormatter={(label) => `项目: ${label}`}
        />
      </Sankey>
    </ResponsiveContainer>
  );
};

export default SankeyChart;
