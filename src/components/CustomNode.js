import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faUserSecret } from '@fortawesome/free-solid-svg-icons';

const iconMap = {
  database: faDatabase,
  'user-secret': faUserSecret,
};

function CustomNode({ data }) {
  const Icon = iconMap[data.icon] || faDatabase; // Fallback icon

  return (
    <div style={{ padding: '10px', background: data.color, borderRadius: '5px', width: '150px' }}>
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
        />
      ))}
      {data.outputs.map((output, index) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{ top: `${(index + 1) * 20}px`, background: '#555' }}
        />
      ))}
    </div>
  );
}

export default CustomNode;
