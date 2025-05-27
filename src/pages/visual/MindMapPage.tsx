// src/pages/MindMapPage.tsx
import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

import {IBlock, IBlockParameter, IBlockRelation} from '@/entities/ConstructorEntities';
import { Loader, Title } from '@mantine/core';
import {bookDb} from "@/entities/bookDb";

interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  style?: React.CSSProperties;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export const MindMapPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const blocks = await bookDb.blocks.toArray();
        const relations = await bookDb.blocksRelations.toArray();
        const parameters = await bookDb.blockParameters.toArray(); // Добавляем загрузку параметров


        // Создаем связи из параметров
        const parameterRelations = parameters?.filter(p => p.relatedBlockUuid)
        .map((param: IBlockParameter) => ({
          id: `param-${param.uuid}`,
          source: param.blockUuid,
          target: param.relatedBlockUuid!,
          type: 'parameter' // Добавляем тип для стилизации
        }));

        // Объединяем связи
        const allEdges = [
          ...relations.map((rel: IBlockRelation) => ({
            id: rel.uuid,
            source: rel.sourceBlockUuid,
            target: rel.targetBlockUuid,
            type: 'relation'
          })),
          ...parameterRelations
        ];

        // Преобразование блоков в узлы
        const initialNodes: FlowNode[] = blocks?.map((block: IBlock) => ({
          id: block.uuid,
          position: {
            x: Math.random() * 500,
            y: Math.random() * 500
          },
          data: { label: block.title },
          style: {
            background: '#f0f0ff',
            border: '1px solid #228be6',
            borderRadius: '8px',
            padding: '10px',
          },
        }));


        setNodes(initialNodes);
        setEdges(allEdges);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const edgeTypes = {
    relation: {
      stroke: '#228be6',
      strokeWidth: 2,
    },
    parameter: {
      stroke: '#40c057',
      strokeWidth: 2,
      strokeDasharray: '5 5',
    },
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <Loader size="xl" />
        </div>
    );
  }

  return (
      <div className="h-screen w-full" style={{ height: '800px' }}>
        <Title order={2} p="md" className="bg-gray-100">
          MindMap блоков
        </Title>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-1 bg-[#228be6]"></div>
            <span>Связи между блоками</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-[#40c057] dash"></div>
            <span>Связи через параметры</span>
          </div>
        </div>
      </div>
  );
};
