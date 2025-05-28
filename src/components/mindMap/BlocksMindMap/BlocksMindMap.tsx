import { useEffect, useState } from 'react';
import { Loader } from '@mantine/core';
import { bookDb } from '@/entities/bookDb';
import { IBlockStructureKind } from "@/entities/ConstructorEntities";
import { MindMap } from './MindMap';
import { FlowNode, FlowEdge } from './types';

export const BlocksMindMap = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialNodes, setInitialNodes] = useState<FlowNode[]>([]);
  const [initialEdges, setInitialEdges] = useState<FlowEdge[]>([]);

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

        const edges = [
          ...relations.map(r => ({
            id: r.uuid,
            source: r.sourceBlockUuid,
            target: r.targetBlockUuid
          })),
          ...parameterRelations
        ];

        const nodes = blocks.map(block => ({
          id: block.uuid,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            label: block?.structureKind === IBlockStructureKind.multiple
                ? block.titleForms?.plural
                : block.title,
            icon: block.icon,
            uuid: block.uuid,
            style: {
              background: '#4d97de',
              border: '1px solid #f0f0ff',
              borderRadius: '8px',
              padding: '5px 5px',
              fontSize: '10px',
              color: '#FFF',
            }
          }
        }));

        setInitialNodes(nodes);
        setInitialEdges(edges);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <Loader size="xl" />
        </div>
    );
  }

  return <MindMap initialNodes={initialNodes} initialEdges={initialEdges} />;
};
