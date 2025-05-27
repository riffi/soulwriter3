// src/pages/MindMapPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';

import {IBlock, IBlockParameter, IBlockRelation} from '@/entities/ConstructorEntities';
import { Loader, Title, Button, Group } from '@mantine/core';
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
  type?: string;
}

// Алгоритм Force-Directed Layout (упрощенная версия)
const forceDirectedLayout = (nodes: FlowNode[], edges: FlowEdge[], iterations = 100) => {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  const nodeArray = Array.from(nodeMap.values());

  // Параметры симуляции
  const repulsionForce = 1000;
  const attractionForce = 0.1;
  const damping = 0.9;

  for (let i = 0; i < iterations; i++) {
    const forces = new Map(nodeArray.map(n => [n.id, { x: 0, y: 0 }]));

    // Силы отталкивания между всеми узлами
    for (let j = 0; j < nodeArray.length; j++) {
      for (let k = j + 1; k < nodeArray.length; k++) {
        const node1 = nodeArray[j];
        const node2 = nodeArray[k];

        const dx = node2.position.x - node1.position.x;
        const dy = node2.position.y - node1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsionForce / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces.get(node1.id)!.x -= fx;
        forces.get(node1.id)!.y -= fy;
        forces.get(node2.id)!.x += fx;
        forces.get(node2.id)!.y += fy;
      }
    }

    // Силы притяжения между связанными узлами
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);

      if (source && target) {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = attractionForce * distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces.get(source.id)!.x += fx;
        forces.get(source.id)!.y += fy;
        forces.get(target.id)!.x -= fx;
        forces.get(target.id)!.y -= fy;
      }
    });

    // Применяем силы
    nodeArray.forEach(node => {
      const force = forces.get(node.id)!;
      node.position.x += force.x * damping;
      node.position.y += force.y * damping;
    });
  }

  return nodeArray;
};

// Иерархический layout (дерево)
const hierarchicalLayout = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, level: 0, children: [] as string[] }]));
  const visited = new Set<string>();
  const roots: string[] = [];

  // Найдем корневые узлы (без входящих связей)
  const hasIncoming = new Set<string>();
  edges.forEach(edge => {
    hasIncoming.add(edge.target);
    const sourceNode = nodeMap.get(edge.source);
    if (sourceNode) {
      (sourceNode as any).children.push(edge.target);
    }
  });

  nodes.forEach(node => {
    if (!hasIncoming.has(node.id)) {
      roots.push(node.id);
    }
  });

  // Если нет корней, возьмем первый узел
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0].id);
  }

  const levelWidth = new Map<number, number>();
  const levelNodes = new Map<number, string[]>();

  // BFS для определения уровней
  const queue: Array<{id: string, level: number}> = roots.map(id => ({id, level: 0}));

  while (queue.length > 0) {
    const {id, level} = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) continue;

    (node as any).level = level;

    if (!levelNodes.has(level)) {
      levelNodes.set(level, []);
    }
    levelNodes.get(level)!.push(id);

    // Добавляем детей в очередь
    (node as any).children.forEach((childId: string) => {
      if (!visited.has(childId)) {
        queue.push({id: childId, level: level + 1});
      }
    });
  }

  // Позиционируем узлы
  const levelHeight = 150;
  const nodeWidth = 200;

  levelNodes.forEach((nodeIds, level) => {
    const y = level * levelHeight;
    const totalWidth = nodeIds.length * nodeWidth;
    const startX = -totalWidth / 2;

    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position.x = startX + index * nodeWidth;
        node.position.y = y;
      }
    });
  });

  return Array.from(nodeMap.values());
};

// Круговая компоновка
const circularLayout = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const center = { x: 0, y: 0 };
  const radius = Math.max(200, nodes.length * 30);

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      }
    };
  });
};

// Сетевая компоновка (grid)
const gridLayout = (nodes: FlowNode[]) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const cellWidth = 250;
  const cellHeight = 150;

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      ...node,
      position: {
        x: col * cellWidth,
        y: row * cellHeight
      }
    };
  });
};

export const MindMapPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalNodes, setOriginalNodes] = useState<FlowNode[]>([]);
  const [originalEdges, setOriginalEdges] = useState<FlowEdge[]>([]);
  const { fitView } = useReactFlow(); // Получаем экземпляр напрямую

  const applyLayout = useCallback(
      (layoutType: string) => {
        let layoutNodes: FlowNode[];

        switch (layoutType) {
          case 'force':
            layoutNodes = forceDirectedLayout([...originalNodes], originalEdges);
            break;
          case 'hierarchical':
            layoutNodes = hierarchicalLayout([...originalNodes], originalEdges);
            break;
          case 'circular':
            layoutNodes = circularLayout([...originalNodes], originalEdges);
            break;
          case 'grid':
            layoutNodes = gridLayout([...originalNodes]);
            break;
          default:
            layoutNodes = [...originalNodes];
        }

        setNodes(layoutNodes);
      },
      [originalNodes, originalEdges, setNodes]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const blocks = await bookDb.blocks.toArray();
        const relations = await bookDb.blocksRelations.toArray();
        const parameters = await bookDb.blockParameters.toArray();

        // Создаем связи из параметров
        const parameterRelations = parameters?.filter(p => p.relatedBlockUuid)
        .map((param: IBlockParameter) => ({
          id: `param-${param.uuid}`,
          source: param.blockUuid,
          target: param.relatedBlockUuid!,
          type: 'parameter'
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

        // Преобразование блоков в узлы (начальные позиции будут перезаписаны)
        const initialNodes: FlowNode[] = blocks?.map((block: IBlock) => ({
          id: block.uuid,
          position: { x: 0, y: 0 }, // Временные координаты
          data: { label: block.title },
          style: {
            background: '#f0f0ff',
            border: '1px solid #228be6',
            borderRadius: '8px',
            padding: '10px',
          },
        }));

        // Применяем force-directed layout по умолчанию
        const layoutNodes = forceDirectedLayout(initialNodes, allEdges);

        setOriginalNodes(initialNodes);
        setOriginalEdges(allEdges);
        setNodes(layoutNodes);
        setEdges(allEdges);
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

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <Loader size="xl" />
        </div>
    );
  }

  return (
      <div className="h-screen w-full" style={{ height: '90dvh' }}>
        <div className="bg-gray-100 p-4">
          <Title order={2} mb="md">
            MindMap блоков
          </Title>

          <Group spacing="xs">
            <Button size="xs" onClick={() => applyLayout('force')}>
              Force-Directed
            </Button>
            <Button size="xs" onClick={() => applyLayout('hierarchical')}>
              Иерархический
            </Button>
            <Button size="xs" onClick={() => applyLayout('circular')}>
              Круговой
            </Button>
            <Button size="xs" onClick={() => applyLayout('grid')}>
              Сетка
            </Button>
          </Group>
        </div>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
            }}
        >
          <Background />
          <Controls />
        </ReactFlow>

      </div>
  );
};
