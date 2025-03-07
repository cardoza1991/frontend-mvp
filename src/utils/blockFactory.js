let idCounter = 0;

export const BlockTypes = {
  STIX_LOADER: 'stixLoader',
  THREAT_ACTOR: 'threatActor',
  TECHNIQUE_FILTER: 'techniqueFilter',
  AI_GENERATOR: 'aiGenerator',
  COMMAND_BUILDER: 'commandBuilder',
  REPORT_GENERATOR: 'reportGenerator'
};

const blockConfigs = {
  [BlockTypes.STIX_LOADER]: {
    label: 'STIX Data Loader',
    color: '#619ED6',
    inputs: [],
    outputs: ['stixData'],
    icon: 'database'
  },
  [BlockTypes.THREAT_ACTOR]: {
    label: 'Threat Actor',
    color: '#E5989B',
    inputs: ['stixData'],
    outputs: ['techniques'],
    icon: 'user-secret'
  },
  [BlockTypes.TECHNIQUE_FILTER]: {
    label: 'Technique Filter',
    color: '#B5EAD7',
    inputs: ['techniques'],
    outputs: ['filteredTechniques'],
    icon: 'filter'
  },
  [BlockTypes.AI_GENERATOR]: {
    label: 'AI Plan Generator',
    color: '#FFD166',
    inputs: ['filteredTechniques'],
    outputs: ['plan'],
    icon: 'robot'
  },
  [BlockTypes.COMMAND_BUILDER]: {
    label: 'Command Builder',
    color: '#C7CEEA',
    inputs: ['plan'],
    outputs: ['commands'],
    icon: 'terminal'
  },
  [BlockTypes.REPORT_GENERATOR]: {
    label: 'Report Generator',
    color: '#F8C8DC',
    inputs: ['commands', 'plan'],
    outputs: ['report'],
    icon: 'file-alt'
  }
};

export function createBlock(type, position) {
  const id = `block-${idCounter++}`;
  const config = blockConfigs[type];

  if (!config) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id,
    type: 'customNode',
    position,
    data: {
      label: config.label,
      blockType: type,
      color: config.color,
      inputs: config.inputs,
      outputs: config.outputs,
      icon: config.icon,
      configuration: {}
    }
  };
}
