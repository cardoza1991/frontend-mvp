import React from 'react';
import { Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faUserSecret, faFilter, faRobot, faTerminal, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const iconMap = {
  database: faDatabase,
  'user-secret': faUserSecret,
  filter: faFilter,
  robot: faRobot,
  terminal: faTerminal,
  'file-alt': faFileAlt,
};

function CustomNode({ data, id, isConnectable, selected }) {
  const Icon = iconMap[data.icon] || faDatabase;
  const isExecuting = data.isExecuting;
  const result = data.executionResult;

  return (
    <div
      style={{
        padding: '10px',
        background: data.color,
        borderRadius: '5px',
        width: '150px',
        border: selected ? '2px solid #000' : '1px solid #000',
        boxShadow: isExecuting ? '0 0 10px #4CAF50' : 'none'
      }}
      className={isExecuting ? 'executing' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <FontAwesomeIcon icon={Icon} style={{ marginRight: '5px' }} />
        <span>{data.label}</span>
      </div>

      {data.inputs.map((input, index) => (
        <Handle
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          style={{ top: `${(index + 1) * 20}px`, background: '#555' }}
          isConnectable={isConnectable}
        />
      ))}

      {data.outputs.map((output, index) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{ top: `${(index + 1) * 20}px`, background: '#555' }}
          isConnectable={isConnectable}
        />
      ))}

      {result && (
        <div style={{
          marginTop: '5px',
          fontSize: '10px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          padding: '2px',
          borderRadius: '3px'
        }}>
          {Object.keys(result).length > 0 && 'Execution complete ✓'}
        </div>
      )}
    </div>
  );
}

export default CustomNode;
