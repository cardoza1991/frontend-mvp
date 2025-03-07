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
              value={block.data.configuration?.source || 'enterprise'}
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
              value={block.data.configuration?.actor || ''}
              onChange={(e) => updateConfig('actor', e.target.value)}
            >
              <option value="">Select Actor</option>
              {block.data.executionResult?.stixData?.actors ? (
                block.data.executionResult.stixData.actors.map(actor => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))
              ) : (
                <>
                  <option value="intrusion-set--f047c3ad-26ef-446a-b811-6354dfd05b43">APT29</option>
                  <option value="intrusion-set--2a158b0a-7ef8-46c5-a7f3-9e3dc78e0b35">APT28</option>
                  <option value="intrusion-set--3753cc21-2dae-4dfb-8481-d004e74502cc">FIN7</option>
                </>
              )}
            </select>
            
            {block.data.configuration?.actor && (
              <div className="property-info">
                <p>Selected: {block.data.configuration.actor}</p>
              </div>
            )}
          </div>
        );
        
      case 'techniqueFilter':
        return (
          <div>
            <h4>Filter Options</h4>
            <div className="property-checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={block.data.configuration?.filterByPlatform || false}
                  onChange={(e) => updateConfig('filterByPlatform', e.target.checked)}
                />
                Filter by Platform
              </label>
            </div>
            {block.data.configuration?.filterByPlatform && (
              <select
                value={block.data.configuration?.platform || 'windows'}
                onChange={(e) => updateConfig('platform', e.target.value)}
              >
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            )}
            
            {block.data.executionResult?.filteredTechniques && (
              <div className="property-info">
                <p>Filtered: {block.data.executionResult.filteredTechniques.length} techniques</p>
              </div>
            )}
          </div>
        );
      
      case 'aiGenerator':
        return (
          <div>
            <h4>AI Model Settings</h4>
            <div className="property-group">
              <label>Model</label>
              <select
                value={block.data.configuration?.model || 'ollama/llama3'}
                onChange={(e) => updateConfig('model', e.target.value)}
              >
                <option value="ollama/llama3">Ollama Llama3</option>
                <option value="ollama/llama2">Ollama Llama2</option>
                <option value="openai/gpt-4">OpenAI GPT-4</option>
              </select>
            </div>
            <div className="property-group">
              <label>Temperature</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={block.data.configuration?.temperature || 0.7}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
              />
              <span>{block.data.configuration?.temperature || 0.7}</span>
            </div>
            <div className="property-group">
              <label>Impact Goal</label>
              <select
                value={block.data.configuration?.impact || 'data exfiltration'}
                onChange={(e) => updateConfig('impact', e.target.value)}
              >
                <option value="data exfiltration">Data Exfiltration</option>
                <option value="credential theft">Credential Theft</option>
                <option value="system disruption">System Disruption</option>
                <option value="ransomware">Ransomware</option>
                <option value="persistence">Persistence</option>
              </select>
            </div>
          </div>
        );
        
      case 'commandBuilder':
        return (
          <div>
            <h4>Command Settings</h4>
            <div className="property-group">
              <label>Target Platform</label>
              <select
                value={block.data.configuration?.platform || 'windows'}
                onChange={(e) => updateConfig('platform', e.target.value)}
              >
                <option value="windows">Windows</option>
                <option value="linux">Linux</option>
                <option value="macos">macOS</option>
              </select>
            </div>
            
            {block.data.executionResult?.commands && (
              <div className="property-info">
                <p>Generated: {block.data.executionResult.commands.length} commands</p>
              </div>
            )}
          </div>
        );
        
      case 'reportGenerator':
        return (
          <div>
            <h4>Report Settings</h4>
            <div className="property-group">
              <label>Format</label>
              <select
                value={block.data.configuration?.format || 'markdown'}
                onChange={(e) => updateConfig('format', e.target.value)}
              >
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
            <div className="property-checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={block.data.configuration?.includeRemediation || false}
                  onChange={(e) => updateConfig('includeRemediation', e.target.checked)}
                />
                Include Remediation Steps
              </label>
            </div>
            
            {block.data.executionResult?.report && (
              <div className="property-info">
                <p>Report generated successfully</p>
                <button 
                  className="property-button"
                  onClick={() => {
                    const blob = new Blob([block.data.executionResult.report], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'attack-report.md';
                    a.click();
                  }}
                >
                  Download Report
                </button>
              </div>
            )}
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
    <div style={{ width: '300px', background: '#f0f0f0', padding: '10px', overflowY: 'auto', height: '100vh' }}>
      <h3>Properties</h3>
      <div className="property-group">
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
      
      {block.data.executionResult?.error && (
        <div className="execution-error">
          <h4>Execution Error</h4>
          <p>{block.data.executionResult.error}</p>
        </div>
      )}
    </div>
  );
}

export default PropertiesPanel;