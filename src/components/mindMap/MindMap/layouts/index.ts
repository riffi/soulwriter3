import { FlowNode, FlowEdge } from "../types";

const LEVEL_HEIGHT = 50;
const NODE_WIDTH = 280;
const CIRCLE_RADIUS_MULTIPLIER = 5;
const GRID_CELL_WIDTH = 150;
const GRID_CELL_HEIGHT = 100;

export const hierarchicalLayout = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, level: 0, children: [] as string[] }]));
  const visited = new Set<string>();
  const roots: string[] = [];
  const hasIncoming = new Set<string>();

  edges.forEach(edge => {
    hasIncoming.add(edge.target);
    const sourceNode = nodeMap.get(edge.source);
    sourceNode?.children.push(edge.target);
  });

  nodes.forEach(node => !hasIncoming.has(node.id) && roots.push(node.id));
  if (!roots.length && nodes.length) roots.push(nodes[0].id);

  const levelNodes = new Map<number, string[]>();
  const queue = roots.map(id => ({ id, level: 0 }));

  while (queue.length) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) continue;

    node.level = level;
    levelNodes.set(level, [...(levelNodes.get(level) || []), id]);
    node.children.forEach(childId => !visited.has(childId) && queue.push({ id: childId, level: level + 1 }));
  }

  levelNodes.forEach((nodeIds, level) => {
    const totalWidth = nodeIds.length * NODE_WIDTH;
    const startX = -totalWidth / 2;

    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position.x = startX + index * NODE_WIDTH;
        node.position.y = level * LEVEL_HEIGHT;
      }
    });
  });

  return Array.from(nodeMap.values());
};

export const circularLayout = (nodes: FlowNode[]) => {
  const radius = Math.max(150, nodes.length * CIRCLE_RADIUS_MULTIPLIER);
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: radius * Math.cos((2 * Math.PI * index) / nodes.length),
      y: radius * Math.sin((2 * Math.PI * index) / nodes.length)
    }
  }));
};

export const doubleCircularLayout = (nodes: FlowNode[]) => {
  // Разделяем узлы по gravity
  const leftNodes = nodes.filter(node => node.gravity === 'left');
  const rightNodes = nodes.filter(node => node.gravity === 'right');
  const centerNodes = nodes.filter(node => node.gravity === 'center' || !node.gravity);

  const result: FlowNode[] = [];

  // Настройки для полуокружностей
  const semicircleRadius = Math.max(150, Math.max(leftNodes.length, rightNodes.length) * 10);
  const centerX = 0; // Общий центр для обеих полуокружностей

  // Размещаем левые узлы в левой полуокружности (110-250 градусов)
  leftNodes.forEach((node, index) => {
    // Распределяем по дуге от 110 до 250 градусов
    const startAngle = (110 * Math.PI) / 180; // 110° в радианах
    const endAngle = (250 * Math.PI) / 180;   // 250° в радианах
    const angle = startAngle + ((endAngle - startAngle) * index) / (leftNodes.length - 1 || 1);
    result.push({
      ...node,
      position: {
        x: centerX + semicircleRadius * Math.cos(angle),
        y: semicircleRadius * Math.sin(angle)
      }
    });
  });

  // Размещаем правые узлы в правой полуокружности (290-430 градусов)
  rightNodes.forEach((node, index) => {
    // Распределяем по дуге от 290 до 430 градусов
    const startAngle = (290 * Math.PI) / 180; // 290° в радианах
    const endAngle = (430 * Math.PI) / 180;   // 430° в радианах
    const angle = startAngle + ((endAngle - startAngle) * index) / (rightNodes.length - 1 || 1);
    result.push({
      ...node,
      position: {
        x: centerX + semicircleRadius * Math.cos(angle),
        y: semicircleRadius * Math.sin(angle)
      }
    });
  });

  // Размещаем центральные узлы по середине (вертикально)
  const centerSpacing = 80;
  const centerStartY = -(centerNodes.length - 1) * centerSpacing / 2;

  centerNodes.forEach((node, index) => {
    result.push({
      ...node,
      position: {
        x: centerX,
        y: centerStartY + index * centerSpacing
      }
    });
  });

  return result;
};

export const gridLayout = (nodes: FlowNode[]) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % cols) * GRID_CELL_WIDTH,
      y: Math.floor(index / cols) * GRID_CELL_HEIGHT
    }
  }));
};
