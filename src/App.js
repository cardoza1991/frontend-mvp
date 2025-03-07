import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css'; // Import default styles
import BlockLibrary from './components/BlockLibrary';
import PropertiesPanel from './components/PropertiesPanel';
import { createBlock } from './utils/blockFactory';
import CustomNode from './components/CustomNode';
import './App.css';

// Define nodeTypes outside the component
const nodeTypes = {
  customNode: CustomNode,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    createBlock('stixLoader', { x: 100, y: 100 }), // Initial node for testing
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionState, setExecutionState] = useState({
    activeNodeId: null,
    results: {},
  });

  const onConnect = (params) => {
    console.log('Connecting:', params);
    const sourceNode = nodes.find((node) => node.id === params.source);
    const targetNode = nodes.find((node) => node.id === params.target);
    const sourceOutput = sourceNode?.data.outputs.find((output) => output === params.sourceHandle);
    const targetInput = targetNode?.data.inputs.find((input) => input === params.targetHandle);

    if (sourceOutput && targetInput && sourceOutput === targetInput) {
      console.log('Connection valid:', params);
      setEdges((eds) => addEdge(params, eds));
    } else {
      console.log('Connection invalid: incompatible types');
    }
  };

  const addNewBlock = (blockType, position) => {
    const newBlock = createBlock(blockType, position);
    console.log('Adding block:', newBlock);
    setNodes((nds) => [...nds, newBlock]);
  };

  const executeWorkflow = useCallback(() => {
    setIsExecuting(true);
    setExecutionState({ activeNodeId: null, results: {} });

    // Get topologically sorted nodes (based on connections)
    const sortedNodes = topologicalSort(nodes, edges);

    // Execute nodes in sequence
    let currentNodeIndex = 0;

    const executeNextNode = async () => {
      if (currentNodeIndex >= sortedNodes.length) {
        setIsExecuting(false);
        return;
      }

      const currentNode = sortedNodes[currentNodeIndex];
      setExecutionState(prev => ({ ...prev, activeNodeId: currentNode.id }));

      // Update node to show it's executing
      setNodes(nds =>
        nds.map(node =>
          node.id === currentNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  isExecuting: true
                }
              }
            : node
        )
      );

      // Simulate node execution
      const result = await simulateNodeExecution(currentNode);

      // Update execution state with results
      setExecutionState(prev => ({
        ...prev,
        results: { ...prev.results, [currentNode.id]: result }
      }));

      // Update node to show execution result
      setNodes(nds =>
        nds.map(node =>
          node.id === currentNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  isExecuting: false,
                  executionResult: result
                }
              }
            : node
        )
      );

      currentNodeIndex++;
      setTimeout(executeNextNode, 1000); // Delay for visual effect
    };

    executeNextNode();
  }, [nodes, edges, setNodes]);

  // Helper function to simulate node execution (for demonstration)
  const simulateNodeExecution = async (node) => {
    return new Promise(resolve => {
      // Simulate processing time
      setTimeout(() => {
        let result;

        switch (node.data.blockType) {
          case 'stixLoader':
            result = { stixData: { techniques: [{ id: 'T1078', name: 'Valid Accounts' }] } };
            break;
          case 'threatActor':
            result = { techniques: [{ id: 'T1078', name: 'Valid Accounts' }] };
            break;
          case 'techniqueFilter':
            result = { filteredTechniques: [{ id: 'T1078', name: 'Valid Accounts' }] };
            break;
          case 'aiGenerator':
            result = { plan: "1. Use stolen credentials to access the system\n2. Escalate privileges" };
            break;
          case 'commandBuilder':
            result = { commands: ["net use \\\\target\\C$ /user:domain\\username password", "powershell -exec bypass"] };
            break;
          case 'reportGenerator':
            result = { report: "# Attack Simulation Report\n\nThis report outlines..." };
            break;
          default:
            result = {};
        }

        resolve(result);
      }, 1500);
    });
  };

  // Helper function to sort nodes in execution order
  const topologicalSort = (nodes, edges) => {
    // Simple implementation that uses a breadth-first traversal
    // Find nodes with no incoming edges (root nodes)
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, incomingEdges: 0, outgoingNodes: [] }]));

    // Count incoming edges and build adjacency list
    edges.forEach(edge => {
      if (nodeMap.has(edge.target)) {
        nodeMap.get(edge.target).incomingEdges += 1;
      }
      if (nodeMap.has(edge.source)) {
        nodeMap.get(edge.source).outgoingNodes.push(edge.target);
      }
    });

    // Find nodes with no dependencies (no incoming edges)
    const queue = Array.from(nodeMap.values()).filter(node => node.incomingEdges === 0);
    const sortedNodes = [];

    // Process nodes in order
    while (queue.length > 0) {
      const current = queue.shift();
      sortedNodes.push(current);

      // Decrease incoming count for all dependent nodes
      current.outgoingNodes.forEach(targetId => {
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          targetNode.incomingEdges -= 1;
          if (targetNode.incomingEdges === 0) {
            queue.push(targetNode);
          }
        }
      });
    }

    // If we have unprocessed nodes, fall back to original order
    // (happens if there are cycles in the graph)
    if (sortedNodes.length < nodes.length) {
      return nodes;
    }

    return sortedNodes;
  };

  const saveWorkflow = () => {
    const workflow = {
      nodes,
      edges
    };

    const workflowJson = JSON.stringify(workflow);
    localStorage.setItem('savedWorkflow', workflowJson);

    // Create a download link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(workflowJson);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "workflow.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const loadWorkflow = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target.result);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
      } catch (error) {
        console.error('Error loading workflow:', error);
      }
    };
    reader.readAsText(file);
  };

  // Clear execution results from all nodes
  const resetExecution = () => {
    setExecutionState({ activeNodeId: null, results: {} });
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: false,
          executionResult: undefined
        }
      }))
    );
  };

  return (
    <div className="app">
      <div className="sidebar">
        <BlockLibrary onDragBlock={addNewBlock} />

        <div className="sidebar-controls">
          <h3>Workflow Controls</h3>
          <button
            onClick={executeWorkflow}
            disabled={isExecuting}
            className="control-button"
          >
            {isExecuting ? 'Executing...' : 'Run Workflow'}
          </button>

          <button
            onClick={resetExecution}
            className="control-button reset-button"
            disabled={isExecuting}
          >
            Reset Execution
          </button>

          <button
            onClick={saveWorkflow}
            className="control-button save-button"
          >
            Save Workflow
          </button>

          <div className="file-input-container">
            <input
              type="file"
              id="load-workflow"
              accept=".json"
              onChange={loadWorkflow}
              style={{ display: 'none' }}
            />
            <label htmlFor="load-workflow" className="control-button load-button">
              Load Workflow
            </label>
          </div>
        </div>
      </div>

      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => setSelectedBlock(node)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {selectedBlock && (
        <PropertiesPanel
          block={selectedBlock}
          onChange={(updatedBlock) => {
            setNodes((nds) =>
              nds.map((node) => node.id === updatedBlock.id ? updatedBlock : node)
            );
          }}
        />
      )}
    </div>
  );
}

export default App;
