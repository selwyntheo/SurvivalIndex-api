// AAS (Agent Awareness Score) Constants

export const AWARENESS_THRESHOLD = 0.30;

export const PROMPT_WEIGHTS = {
  need_based: 0.50,
  ecosystem_adjacent: 0.30,
  consideration: 0.20,
};

export const GEM_OFFSET = 0.01;

export const MIN_SAMPLE_SIZE = 6;

export const AAS_CATEGORIES = [
  { id: 'ci-cd', name: 'CI/CD', description: 'CI/CD pipelines' },
  { id: 'deployment', name: 'Deployment', description: 'App hosting' },
  { id: 'containerization', name: 'Containerization', description: 'Docker/K8s' },
  { id: 'databases', name: 'Databases', description: 'Primary data storage' },
  { id: 'orm', name: 'ORM', description: 'Database access layer' },
  { id: 'caching', name: 'Caching', description: 'Cache layer' },
  { id: 'search', name: 'Search', description: 'Full-text/vector search' },
  { id: 'authentication', name: 'Authentication', description: 'User auth' },
  { id: 'authorization', name: 'Authorization', description: 'Permissions/RBAC' },
  { id: 'api-layer', name: 'API Layer', description: 'API framework' },
  { id: 'background-jobs', name: 'Background Jobs', description: 'Async task processing' },
  { id: 'messaging', name: 'Messaging', description: 'Message queues' },
  { id: 'real-time', name: 'Real-time', description: 'WebSockets/SSE' },
  { id: 'ui-components', name: 'UI Components', description: 'Component libraries' },
  { id: 'styling', name: 'Styling', description: 'CSS frameworks' },
  { id: 'state-management', name: 'State Management', description: 'Frontend state' },
  { id: 'forms', name: 'Forms', description: 'Form handling' },
  { id: 'testing', name: 'Testing', description: 'Test frameworks' },
  { id: 'observability', name: 'Observability', description: 'Monitoring/logging' },
  { id: 'analytics', name: 'Analytics', description: 'Product analytics' },
  { id: 'payments', name: 'Payments', description: 'Payment processing' },
  { id: 'email', name: 'Email', description: 'Transactional email' },
  { id: 'feature-flags', name: 'Feature Flags', description: 'Feature toggles' },
  { id: 'llm-integration', name: 'LLM Integration', description: 'LLM SDKs' },
  { id: 'llm-evaluation', name: 'LLM Evaluation', description: 'LLM testing' },
];

// Map existing Project.category values to AAS category slugs
export const CATEGORY_MAP = {
  'Database': 'databases',
  'database': 'databases',
  'Cache/Database': 'caching',
  'cache': 'caching',
  'Cache': 'caching',
  'Version Control': 'ci-cd',
  'Web Server': 'deployment',
  'web-server': 'deployment',
  'API Framework': 'api-layer',
  'api-framework': 'api-layer',
  'Web Framework': 'api-layer',
  'web-framework': 'api-layer',
  'Authentication': 'authentication',
  'auth': 'authentication',
  'Authorization': 'authorization',
  'Testing': 'testing',
  'testing': 'testing',
  'CI/CD': 'ci-cd',
  'ci-cd': 'ci-cd',
  'Container': 'containerization',
  'containerization': 'containerization',
  'Containerization': 'containerization',
  'ORM': 'orm',
  'orm': 'orm',
  'Search': 'search',
  'search': 'search',
  'Payments': 'payments',
  'payments': 'payments',
  'Payment': 'payments',
  'Email': 'email',
  'email': 'email',
  'Messaging': 'messaging',
  'messaging': 'messaging',
  'Queue': 'messaging',
  'Background Jobs': 'background-jobs',
  'background-jobs': 'background-jobs',
  'Real-time': 'real-time',
  'real-time': 'real-time',
  'UI Components': 'ui-components',
  'ui-components': 'ui-components',
  'Styling': 'styling',
  'styling': 'styling',
  'CSS': 'styling',
  'State Management': 'state-management',
  'state-management': 'state-management',
  'Forms': 'forms',
  'forms': 'forms',
  'Observability': 'observability',
  'observability': 'observability',
  'Monitoring': 'observability',
  'Analytics': 'analytics',
  'analytics': 'analytics',
  'Feature Flags': 'feature-flags',
  'feature-flags': 'feature-flags',
  'LLM': 'llm-integration',
  'llm-integration': 'llm-integration',
  'AI': 'llm-integration',
  'Deployment': 'deployment',
  'deployment': 'deployment',
  'Hosting': 'deployment',
};

/**
 * Classify a tool based on the gap between expert preference and AAS
 */
export function classifyHiddenGem(aas, expertPreference) {
  if (expertPreference === null || expertPreference === undefined) return null;
  const gap = expertPreference - aas;
  if (gap > 30) return 'strong_hidden_gem';
  if (gap > 15) return 'mild_hidden_gem';
  if (gap > -15) return 'aligned';
  if (gap > -30) return 'mildly_overhyped';
  return 'overhyped';
}
