import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css'; // Import default styles
import BlockLibrary from './components/BlockLibrary';
import PropertiesPanel from './components/PropertiesPanel';
import { createBlock } from './utils/blockFactory';
import CustomNode from './components/CustomNode';
import './App.css';

// Import STIX and AI services
import { 
  fetchStixData, 
  getThreatActors, 
  getAllTechniques, 
  getTechniquesForActor,
  filterTechniquesByPlatform
} from './services/stixService';

import { 
  generateAttackPlan, 
  generateCommands 
} from './services/aiService';

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
  const [executionProgress, setExecutionProgress] = useState({
    activeNodeId: null,
    completedNodes: 0,
    totalNodes: 0
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

  // Helper function to find input data from connected nodes
  const findInputData = (nodeId, inputType) => {
    // Find edges connecting to this node's input
    const incomingEdges = edges.filter(
      edge => edge.target === nodeId && edge.targetHandle === inputType
    );
    
    if (incomingEdges.length === 0) return null;
    
    // Get the source node of the first incoming edge
    const sourceNodeId = incomingEdges[0].source;
    const sourceNode = nodes.find(node => node.id === sourceNodeId);
    
    if (!sourceNode || !sourceNode.data.executionResult) return null;
    
    // Return the data from the source node's output
    return sourceNode.data.executionResult[incomingEdges[0].sourceHandle];
  };

  const executeWorkflow = useCallback(() => {
    setIsExecuting(true);
    
    // Get topologically sorted nodes (based on connections)
    const sortedNodes = topologicalSort(nodes, edges);
    
    setExecutionProgress({
      activeNodeId: null,
      completedNodes: 0,
      totalNodes: sortedNodes.length
    });
    
    // Execute nodes in sequence
    let currentNodeIndex = 0;
    
    const executeNextNode = async () => {
      if (currentNodeIndex >= sortedNodes.length) {
        setIsExecuting(false);
        return;
      }
      
      const currentNode = sortedNodes[currentNodeIndex];
      setExecutionProgress(prev => ({ 
        ...prev, 
        activeNodeId: currentNode.id
      }));
      
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
      
      setExecutionProgress(prev => ({
        ...prev,
        completedNodes: prev.completedNodes + 1,
        activeNodeId: null
      }));
      
      currentNodeIndex++;
      setTimeout(executeNextNode, 1000); // Delay for visual effect
    };
    
    executeNextNode();
  }, [nodes, edges, setNodes]);

  // Execute a node with real functionality
  const simulateNodeExecution = async (node) => {
    return new Promise(async (resolve) => {
      try {
        let result;
        
        switch (node.data.blockType) {
          case 'stixLoader':
            // Actually fetch the STIX data
            const stixType = node.data.configuration?.source || 'enterprise';
            const stixData = await fetchStixData(stixType);
            const actors = getThreatActors(stixData);
            const allTechniques = getAllTechniques(stixData);
            
            result = { 
              stixData: { 
                raw: stixData,
                actors,
                techniques: allTechniques
              } 
            };
            break;
            
          case 'threatActor':
            // Get the actor ID from configuration
            const actorId = node.data.configuration?.actor || '';
            // Get the input data from previous nodes
            const threatStixData = findInputData(node.id, 'stixData')?.raw;
            
            if (threatStixData && actorId) {
              const actorTechniques = getTechniquesForActor(threatStixData, actorId);
              result = { techniques: actorTechniques };
            } else {
              result = { techniques: [{ id: 'T1078', name: 'Valid Accounts' }] };
            }
            break;
            
          case 'techniqueFilter':
            // Get techniques from input
            const techniques = findInputData(node.id, 'techniques') || [];
            
            const platform = node.data.configuration?.platform || 'windows';
            const filterByPlatform = node.data.configuration?.filterByPlatform || false;
            
            let filteredTechniques = techniques;
            if (filterByPlatform) {
              filteredTechniques = filterTechniquesByPlatform(techniques, platform);
            }
            
            result = { filteredTechniques: filteredTechniques };
            break;
            
          case 'aiGenerator':
            // Get filtered techniques from input
            const aiTechniques = findInputData(node.id, 'filteredTechniques') || [];
            
            // Use actual AI generation
            const aiOptions = {
              model: node.data.configuration?.model || 'ollama/llama3',
              temperature: node.data.configuration?.temperature || 0.7,
              impact: node.data.configuration?.impact || 'data exfiltration'
            };
            
            const aiResult = await generateAttackPlan(aiTechniques, aiOptions);
            result = { plan: aiResult.plan };
            break;
            
          case 'commandBuilder':
            // Get the plan from the AI generator
            const plan = findInputData(node.id, 'plan') || '';
            
            // Generate actual commands
            const cmdPlatform = node.data.configuration?.platform || 'windows';
            const commandResult = await generateCommands(plan, { platform: cmdPlatform });
            
            result = { commands: commandResult.commands };
            break;
            
          case 'reportGenerator':
            // Get plan and commands from inputs
            const reportPlan = findInputData(node.id, 'plan') || '';
            const commands = findInputData(node.id, 'commands') || [];
            
            const reportContent = `# Attack Simulation Report

## Plan
${reportPlan}

## Commands
${Array.isArray(commands) ? commands.map(cmd => `\`\`\`bash\n${cmd}\n\`\`\``).join('\n\n') : '```bash\nNo commands available\n```'}
`;
            
            result = { report: reportContent };
            break;
            
          default:
            result = {};
        }
        
        resolve(result);
      } catch (error) {
        console.error(`Error executing node ${node.id}:`, error);
        resolve({ error: error.message });
      }
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
    setExecutionProgress({ activeNodeId: null, completedNodes: 0, totalNodes: 0 });
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
          
          {/* Add execution progress display */}
          {isExecuting && (
            <div className="execution-status">
              <h4>Execution Progress</h4>
              <p>Active: {executionProgress.activeNodeId ? `Node ${executionProgress.activeNodeId.split('-')[1]}` : 'None'}</p>
              <p>Progress: {executionProgress.completedNodes} / {executionProgress.totalNodes}</p>
            </div>
          )}
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