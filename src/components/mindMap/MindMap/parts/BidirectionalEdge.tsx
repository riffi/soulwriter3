import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow';

export const BidirectionalEdge: React.FC<EdgeProps> = ({
                                                           id,
                                                           sourceX,
                                                           sourceY,
                                                           targetX,
                                                           targetY,
                                                           sourcePosition,
                                                           targetPosition,
                                                           style = {},
                                                           data,
                                                           markerEnd,
                                                           markerStart
                                                       }) => {
    // Вычисляем смещение для параллельных линий
    const offset = 10;

    // Вычисляем вектор направления
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy)

    // Нормализованный перпендикулярный вектор
    const perpX = -dy / length * offset;
    const perpY = dx / length * offset;

    // Позиции для двух параллельных линий
    const line1Start = { x: sourceX, y: sourceY + perpY };
    const line1End = { x: targetX , y: targetY + perpY };
    const line2Start = { x: sourceX , y: sourceY - perpY };
    const line2End = { x: targetX , y: targetY - perpY };

    // Создаем пути для обеих линий
    const [path1] = getBezierPath({
        sourceX: line1Start.x,
        sourceY: line1Start.y,
        targetX: line1End.x,
        targetY: line1End.y,
        sourcePosition,
        targetPosition,
    });

    const [path2] = getBezierPath({
        sourceX: line2Start.x,
        sourceY: line2Start.y,
        targetX: line2End.x,
        targetY: line2End.y,
        sourcePosition,
        targetPosition,
    });

    // Позиция для лейбла (по центру между линиями)
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return (
        <>
            <defs>
                {/* Стрелка для прямого направления */}
                <marker
                    id={`bidirectional-arrow-forward-${id}`}
                    viewBox="-10 -10 20 20"
                    markerWidth={15}
                    markerHeight={15}
                    orient="auto"
                    refX={0}
                    refY={0}
                >
                    <path
                        d="M -6,-4 L 0,0 L -6,4"
                        fill="none"
                        stroke={style.stroke || '#b1b1b7'}
                        strokeWidth={1}
                    />
                </marker>

                {/* Стрелка для обратного направления (повернута на 180 градусов) */}
                <marker
                    id={`bidirectional-arrow-backward-${id}`}
                    viewBox="-10 -10 20 20"
                    markerWidth={15}
                    markerHeight={15}
                    orient="auto"
                    refX={0}
                    refY={0}
                >
                    <path
                        d="M 6,-4 L 0,0 L 6,4"
                        fill="none"
                        stroke={style.stroke || '#b1b1b7'}
                        strokeWidth={1}
                    />
                </marker>
            </defs>

            {/* Первая линия (прямое направление) */}
            <BaseEdge
                path={path1}
                style={{
                    ...style,
                    strokeWidth: 0.5,
                }}
                markerEnd={`url(#bidirectional-arrow-forward-${id})`}
            />

            {/* Вторая линия (обратное направление) */}
            <BaseEdge
                path={path2}
                style={{
                    ...style,
                    strokeWidth: 0.5,
                }}
                markerStart={`url(#bidirectional-arrow-backward-${id})`}
            />

            {/* Лейблы для обеих связей */}
            {(data?.forwardEdge?.label || data?.backwardEdge?.label) && (
                <EdgeLabelRenderer>
                    {/* Лейбл для прямой связи */}
                    {data?.forwardEdge?.label && (
                        <div
                            style={{
                                position: 'absolute',
                                transform: `translate(-50%, -50%) translate(${labelX + perpX * 1.5}px,${labelY + perpY * 1.5}px)`,
                                fontSize: 5,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                padding: '1px 4px',
                                borderRadius: 2,
                                color: '#555',
                                pointerEvents: 'all',
                            }}
                        >
                            {data.forwardEdge.label}
                        </div>
                    )}

                    {/* Лейбл для обратной связи */}
                    {data?.backwardEdge?.label && (
                        <div
                            style={{
                                position: 'absolute',
                                transform: `translate(-50%, -50%) translate(${labelX - perpX * 1.5}px,${labelY - perpY * 1.5}px)`,
                                fontSize: 5,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                padding: '1px 4px',
                                color: '#555',
                                pointerEvents: 'all',
                            }}
                        >
                            {data.backwardEdge.label}
                        </div>
                    )}
                </EdgeLabelRenderer>
            )}
        </>
    );
};
