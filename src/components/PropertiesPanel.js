import React from 'react';

function PropertiesPanel({ block, onChange }) {
  const blockType = block.data.blockType;

  const renderBlockSpecificProperties = () => {
    switch (blockType) {
      case 'stixLoader':
        return (
          <div>
            <h4>STIX Data Source</h4>
            <select
              value={block.data.configuration.source || 'enterprise'}
              onChange={(e) => updateConfig('source', e.target.value)}
            >
              <option value="enterprise">Enterprise ATT&CK</option>
              <option value="mobile">Mobile ATT&CK</option>
              <option value="ics">ICS ATT&CK</option>
            </select>
          </div>
        );

      case 'threatActor':
        return (
          <div>
            <h4>Threat Actor</h4>
            <select
              value={block.data.configuration.actor || ''}
              onChange={(e) => updateConfig('actor', e.target.value)}
            >
              <option value="">Select Actor</option>
              <option value="APT29">APT29</option>
              <option value="APT28">APT28</option>
              <option value="FIN7">FIN7</option>
              <option value="APT1">APT1</option>
            </select>
          </div>
        );

      case 'techniqueFilter':
        return (
          <div>
            <h4>Filter Options</h4>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={block.data.configuration.filterByPlatform || false}
                  onChange={(e) => updateConfig('filterByPlatform', e.target.checked)}
                />
                Filter by Platform
              </label>
            </div>
            {block.data.configuration.filterByPlatform && (
              <select
                value={block.data.configuration.platform || 'windows'}
                onChange={(e) => updateConfig('platform', e.target.value)}
              >
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            )}
          </div>
        );

      case 'aiGenerator':
        return (
          <div>
            <h4>AI Model Settings</h4>
            <div>
              <label>Model</label>
              <select
                value={block.data.configuration.model || 'ollama/llama3'}
                onChange={(e) => updateConfig('model', e.target.value)}
              >
                <option value="ollama/llama3">Ollama Llama3</option>
                <option value="ollama/llama2">Ollama Llama2</option>
                <option value="openai/gpt-4">OpenAI GPT-4</option>
              </select>
            </div>
            <div>
              <label>Temperature</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={block.data.configuration.temperature || 0.7}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
              />
              <span>{block.data.configuration.temperature || 0.7}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const updateConfig = (key, value) => {
    const updatedBlock = {
      ...block,
      data: {
        ...block.data,
        configuration: {
          ...block.data.configuration,
          [key]: value
        }
      }
    };
    onChange(updatedBlock);
  };

  return (
    <div style={{ width: '300px', background: '#f0f0f0', padding: '10px', overflowY: 'auto' }}>
      <h3>Properties</h3>
      <div>
        <label>Block Label</label>
        <input
          type="text"
          value={block.data.label}
          onChange={(e) => onChange({
            ...block,
            data: { ...block.data, label: e.target.value }
          })}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      </div>

      {renderBlockSpecificProperties()}

      <div style={{ marginTop: '20px' }}>
        <h4>Ports</h4>
        <div>
          <h5>Inputs</h5>
          <ul>
            {block.data.inputs.map(input => (
              <li key={input}>{input}</li>
            ))}
            {block.data.inputs.length === 0 && <li>None</li>}
          </ul>
        </div>
        <div>
          <h5>Outputs</h5>
          <ul>
            {block.data.outputs.map(output => (
              <li key={output}>{output}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PropertiesPanel;
