import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, useReactFlow, Node, Edge } from 'reactflow';
import { Button, Group } from '@mantine/core';
import { hierarchicalLayout, circularLayout, gridLayout } from './layouts';
import { updateEdgeHandles } from './utils/layoutUtils';
import { FlowNode, FlowEdge } from './types';
import { CustomNode } from './parts/CustomNode';
import 'reactflow/dist/style.css';
import './react-flow-override.css'
const nodeTypes = { custom: CustomNode };

interface MindMapProps {
    initialNodes: FlowNode[];
    initialEdges: FlowEdge[];
    defaultLayout?: 'hierarchical' | 'circular' | 'grid';
}



export const MindMap = ({ initialNodes, initialEdges, defaultLayout}: MindMapProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
    const [originalNodes, setOriginalNodes] = useState<FlowNode[]>(initialNodes);
    const [originalEdges, setOriginalEdges] = useState<FlowEdge[]>(initialEdges);
    const [selectedLayout, setSelectedLayout] = useState<'hierarchical' | 'circular' | 'grid'>(defaultLayout ?? 'hierarchical');
    const { fitView } = useReactFlow();

    useEffect(() => {
        setOriginalNodes(initialNodes);
        setOriginalEdges(initialEdges);
    }, [initialNodes, initialEdges]);

    const applyLayout = useCallback((layoutType: 'hierarchical' | 'circular' | 'grid') => {
        let layoutNodes = [...originalNodes];
        setSelectedLayout(layoutType);

        switch(layoutType) {
            case 'hierarchical':
                layoutNodes = hierarchicalLayout(originalNodes, originalEdges);
                break;
            case 'circular':
                layoutNodes = circularLayout(originalNodes);
                break;
            case 'grid':
                layoutNodes = gridLayout(originalNodes);
                break;
        }

        setNodes(layoutNodes);
        setEdges(updateEdgeHandles(originalEdges, layoutNodes));
    }, [originalNodes, originalEdges, setNodes, setEdges]);

    useEffect(() => {
        if (originalNodes.length > 0) {
            applyLayout(selectedLayout);
        }
    }, [originalNodes, originalEdges, selectedLayout, applyLayout]);

    useEffect(() => {
        fitView({ padding: 0.1, duration: 500 });
    }, [nodes, fitView]);

    useEffect(() => {
        const handleResize = () => fitView({ padding: 0.1, duration: 500 });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fitView]);

    return (
        <div style={{ height: '800px' }}>
            <Group spacing="xs">
                {['hierarchical', 'circular', 'grid'].map(layout => (
                    <Button
                        key={layout}
                        size="xs"
                        variant={selectedLayout === layout ? 'light' : 'outline'}
                        onClick={() => applyLayout(layout)}
                    >
                        {{
                            hierarchical: 'Иерархическая',
                            circular: 'Круговая',
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
                fitViewOptions={{ padding: 0.2 }}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
};
