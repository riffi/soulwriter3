import { FlowNode, FlowEdge } from "../types";

export const getClosestHandles = (sourceNode: FlowNode, targetNode: FlowNode) => {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let sourceHandle = 'right';
  let targetHandle = 'left';

  if (absDy > absDx) {
    sourceHandle = dy > 0 ? 'bottom' : 'top';
    targetHandle = dy > 0 ? 'top' : 'bottom';
  } else if (dx < 0) {
    sourceHandle = 'left';
    targetHandle = 'right';
  }

  return { sourceHandle, targetHandle };
};

// Функция для определения двухсторонних связей
export const processBidirectionalEdges = (edges: FlowEdge[]): FlowEdge[] => {
  const processedEdges: FlowEdge[] = [];
  const edgeMap = new Map<string, FlowEdge>();

  // Создаем карту всех связей
  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    edgeMap.set(key, edge);
  });

  const processedPairs = new Set<string>();

  edges.forEach(edge => {
    const forwardKey = `${edge.source}-${edge.target}`;
    const backwardKey = `${edge.target}-${edge.source}`;

    // Проверяем, не обработали ли мы уже эту пару
    if (processedPairs.has(forwardKey) || processedPairs.has(backwardKey)) {
      return;
    }

    const backwardEdge = edgeMap.get(backwardKey);

    if (backwardEdge) {
      // Найдена двухсторонняя связь
      const bidirectionalEdge: FlowEdge = {
        ...edge,
        id: `bidirectional-${edge.source}-${edge.target}`,
        type: 'bidirectional',
        data: {
          forwardEdge: edge,
          backwardEdge: backwardEdge
        }
      };

      processedEdges.push(bidirectionalEdge);
      processedPairs.add(forwardKey);
      processedPairs.add(backwardKey);
    } else {
      // Односторонняя связь
      processedEdges.push(edge);
      processedPairs.add(forwardKey);
    }
  });

  return processedEdges;
};

export const updateEdgeHandles = (edges: FlowEdge[], nodes: FlowNode[]) => {
  // Сначала обрабатываем двухсторонние связи
  const processedEdges = processBidirectionalEdges(edges);

  return processedEdges.map(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);

    if (!source || !target) return edge;

    const { sourceHandle, targetHandle } = getClosestHandles(source, target);
    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });
};
