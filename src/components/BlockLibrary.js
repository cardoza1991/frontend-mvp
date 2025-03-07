import React from 'react';

function BlockLibrary({ onDragBlock }) {
  const blockTypes = [
    { type: 'stixLoader', label: 'STIX Data Loader' },
    { type: 'threatActor', label: 'Threat Actor' },
    { type: 'techniqueFilter', label: 'Technique Filter' },
    { type: 'aiGenerator', label: 'AI Plan Generator' },
    { type: 'commandBuilder', label: 'Command Builder' },
    { type: 'reportGenerator', label: 'Report Generator' },
  ];

  return (
    <div style={{ width: '200px', background: '#f0f0f0', padding: '10px' }}>
      <h3>Block Library</h3>
      {blockTypes.map((block) => (
        <div
          key={block.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('blockType', block.type);
            // Adjust position to ensure it's within the canvas
            const canvasOffsetX = 200; // Sidebar width
            const canvasOffsetY = 50;  // Offset from top (accounting for browser UI)
            const x = Math.max(0, e.clientX - canvasOffsetX); // Ensure x is not negative
            const y = Math.max(0, e.clientY - canvasOffsetY); // Ensure y is not negative
            onDragBlock(block.type, { x, y });
          }}
          style={{ padding: '10px', margin: '5px', background: '#fff', cursor: 'grab' }}
        >
          {block.label}
        </div>
      ))}
    </div>
  );
}

export default BlockLibrary;
