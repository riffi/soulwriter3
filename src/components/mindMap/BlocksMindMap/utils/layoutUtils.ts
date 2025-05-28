import { FlowNode, FlowEdge } from "../types";
import {MarkerType} from "reactflow";

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

export const updateEdgeHandles = (edges: FlowEdge[], nodes: FlowNode[]) => {
  return edges.map(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);

    if (!source || !target) return edge;

    const { sourceHandle, targetHandle } = getClosestHandles(source, target);
    return { ...edge,
      sourceHandle,
      targetHandle,
    };
  });
};
