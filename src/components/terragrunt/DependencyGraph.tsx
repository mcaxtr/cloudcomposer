import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';import 'reactflow/dist/style.css';
import Card from '../ui/Card';
import { Component, Service } from '../../types';

interface DependencyGraphProps {
  components: Component[];
  services: Service[];
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ components, services }) => {
  // Create nodes for components
  const initialNodes: Node[] = [
    ...components.map((component) => ({
      id: `component-${component.id}`,
      data: { label: component.name, type: 'component' },
      position: { x: 0, y: 0 }, // Positions will be calculated by layout
      type: 'default',
      style: {
        background: '#e0f2fe',
        border: '1px solid #7dd3fc',
        borderRadius: '8px',
        padding: '10px',
        width: 180,
      },
    })),
    ...services.map((service) => ({
      id: `service-${service.id}`,
      data: { label: service.name, type: 'service' },
      position: { x: 0, y: 0 }, // Positions will be calculated by layout
      type: 'default',
      style: {
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        borderRadius: '8px',
        padding: '10px',
        width: 180,
      },
    })),
  ];

  // Create edges for dependencies
  const initialEdges: Edge[] = [];

  // Add edges for service dependencies
  services.forEach((service) => {
    service.componentDependencies.forEach((componentId) => {
      initialEdges.push({
        id: `edge-${service.id}-${componentId}`,
        source: `service-${service.id}`,
        target: `component-${componentId}`,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: '#94a3b8' },
      });
    });
  });

  // Add edges for component dependencies (based on inputs/outputs)
  components.forEach((component) => {
    // This is a simplified example - in a real app, you'd need to analyze
    // the actual input/output relationships between components
    const inputKeys = Object.keys(component.inputs);
    
    components.forEach((otherComponent) => {
      if (component.id === otherComponent.id) return;
      
      const outputKeys = Object.keys(otherComponent.outputs);
      const hasConnection = inputKeys.some(input => 
        outputKeys.includes(input) || 
        input.includes(otherComponent.name)
      );
      
      if (hasConnection) {
        initialEdges.push({
          id: `edge-${component.id}-${otherComponent.id}`,
          source: `component-${component.id}`,
          target: `component-${otherComponent.id}`,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#94a3b8' },
        });
      }
    });
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Layout nodes in a force-directed manner (simplified)
  React.useEffect(() => {
    const nodePositions = calculateNodePositions(initialNodes, initialEdges);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        position: nodePositions[node.id] || { x: 0, y: 0 },
      }))
    );
  }, [components, services, setNodes]);

  // Simple force-directed layout calculation
  const calculateNodePositions = (nodes: Node[], edges: Edge[]) => {
    const positions: Record<string, { x: number, y: number }> = {};
    const componentNodes = nodes.filter(n => n.data.type === 'component');
    const serviceNodes = nodes.filter(n => n.data.type === 'service');
    
    // Position components in a grid
    componentNodes.forEach((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      positions[node.id] = {
        x: col * 250 + 100,
        y: row * 150 + 100,
      };
    });
    
    // Position services in a row above components
    serviceNodes.forEach((node, index) => {
      positions[node.id] = {
        x: index * 250 + 100,
        y: 400,
      };
    });
    
    return positions;
  };

  return (
    <Card title="Dependency Graph" className="h-full">
      <div style={{ height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </Card>
  );
};

export default DependencyGraph;
