import { useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import { Loader, Title, Button, Group } from '@mantine/core';
import { bookDb } from '@/entities/bookDb';
import { hierarchicalLayout, circularLayout, gridLayout } from './layouts';
import { updateEdgeHandles } from './utils/layoutUtils';
import { FlowNode, FlowEdge } from './types';
import { CustomNode } from './parts/CustomNode';
import 'reactflow/dist/style.css';
import './react-flow-override.css'

const nodeTypes = { custom: CustomNode };

export const BlocksMindMap = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalNodes, setOriginalNodes] = useState<FlowNode[]>([]);
  const [originalEdges, setOriginalEdges] = useState<FlowEdge[]>([]);
  const [selectedLayout, setSelectedLayout] = useState('hierarchical');
  const { fitView } = useReactFlow();

  const applyLayout = useCallback((layoutType: string) => {
    let layoutNodes = [...originalNodes];
    setSelectedLayout(layoutType);
    switch(layoutType) {
      case 'hierarchical': layoutNodes = hierarchicalLayout(originalNodes, originalEdges); break;
      case 'circular': layoutNodes = circularLayout(originalNodes); break;
      case 'grid': layoutNodes = gridLayout(originalNodes); break;
    }

    setNodes(layoutNodes);
    setEdges(updateEdgeHandles(originalEdges, layoutNodes));
  }, [originalNodes, originalEdges, setNodes, setEdges]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const blocks = await bookDb.blocks.toArray();
        const relations = await bookDb.blocksRelations.toArray();
        const parameters = await bookDb.blockParameters.toArray();

        const parameterRelations = parameters
        .filter(p => p.relatedBlockUuid)
        .map(p => ({
          id: `param-${p.uuid}`,
          source: p.blockUuid,
          target: p.relatedBlockUuid!,
          labelStyle: {
            fontSize: '5px',
            fill: '#797979',
            padding: '2px 2px',
          },
        }));

        const allEdges = [
          ...relations.map(r => ({ id: r.uuid, source: r.sourceBlockUuid, target: r.targetBlockUuid})),
          ...parameterRelations
        ];

        const initialNodes = blocks.map(block => ({
          id: block.uuid,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            label: block.title,
            style: {
              background: '#4d97de',
              border: '1px solid #f0f0ff',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '10px',
              color: '#FFF',
            }
          }
        }));

        const layoutNodes = hierarchicalLayout(initialNodes, allEdges);
        setSelectedLayout('hierarchical');
        const updatedEdges = updateEdgeHandles(allEdges, layoutNodes);

        setOriginalNodes(initialNodes);
        setOriginalEdges(updatedEdges);
        setNodes(layoutNodes);
        setEdges(updatedEdges);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    fitView({ padding: 0.1, duration: 500 });
  }, [nodes, fitView]);

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => fitView({ padding: 0.1, duration: 500 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);

  if (isLoading) return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="xl" />
      </div>
  );

  return (
      <div style={{ height: '800px' }}>

        <Group spacing="xs">
          {['hierarchical', 'circular', 'grid'].map(layout => (
              <Button
                  key={layout}
                  size="xs"
                  variant={selectedLayout === layout ? 'light' : 'outline'}
                  onClick={() => applyLayout(layout)}>
                {{
                  hierarchical: 'Иерархический',
                  circular: 'Круговой',
                  grid: 'Сетка'
                }[layout]}
              </Button>
          ))}
        </Group>


        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            maxZoom={3}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={
              { padding: 0.2 }
            }
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
  );
};
