// src/services/stixService.js
const ENTERPRISE_ATTACK_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json';
const MOBILE_ATTACK_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/mobile-attack/mobile-attack.json';
const ICS_ATTACK_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/ics-attack/ics-attack.json';

let cachedData = null;

export async function fetchStixData(type = 'enterprise') {
  const url = type === 'enterprise' 
    ? ENTERPRISE_ATTACK_URL 
    : type === 'mobile' 
      ? MOBILE_ATTACK_URL 
      : ICS_ATTACK_URL;
  
  try {
    // Use cached data if available
    if (cachedData) return cachedData;
    
    console.log(`Fetching STIX data from ${url}...`);
    const response = await fetch(url);
    const data = await response.json();
    
    // Cache the data for future use
    cachedData = data;
    console.log(`STIX data loaded: ${data.objects.length} objects`);
    
    return data;
  } catch (error) {
    console.error('Error fetching STIX data:', error);
    throw error;
  }
}

export function getThreatActors(stixData) {
  const actors = stixData.objects.filter(obj => obj.type === 'intrusion-set');
  return actors.map(actor => ({
    id: actor.id,
    name: actor.name,
    description: actor.description
  }));
}

export function getTechniquesForActor(stixData, actorId) {
  // Find relationships where source_ref is the actor
  const relationships = stixData.objects.filter(
    obj => obj.type === 'relationship' && 
           obj.source_ref === actorId && 
           obj.relationship_type === 'uses'
  );
  
  // Get the technique IDs from the target_ref of these relationships
  const techniqueIds = relationships.map(rel => rel.target_ref);
  
  // Get the actual technique objects
  const techniques = stixData.objects.filter(
    obj => techniqueIds.includes(obj.id) && obj.type === 'attack-pattern'
  );
  
  return techniques.map(tech => ({
    id: tech.id,
    name: tech.name,
    description: tech.description,
    killChainPhases: tech.kill_chain_phases
  }));
}

export function getAllTechniques(stixData) {
  const techniques = stixData.objects.filter(obj => obj.type === 'attack-pattern');
  return techniques.map(tech => ({
    id: tech.id,
    name: tech.name,
    description: tech.description,
    killChainPhases: tech.kill_chain_phases
  }));
}

export function filterTechniquesByPlatform(techniques, platform) {
  return techniques.filter(tech => 
    tech.x_mitre_platforms && 
    tech.x_mitre_platforms.includes(platform.toLowerCase())
  );
}