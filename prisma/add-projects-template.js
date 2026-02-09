const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * TEMPLATE FOR ADDING NEW PROJECTS
 * 
 * Instructions:
 * 1. Copy the project template below
 * 2. Fill in all required fields
 * 3. Add your projects to the `newProjects` array
 * 4. Run: node apps/backend/prisma/add-projects-template.js
 * 
 * Field Guide:
 * - name: Unique project name (required)
 * - type: 'open-source' | 'saas' | 'hybrid' (required)
 * - category: See CATEGORIES list below (required)
 * - description: Clear, concise description (required)
 * - url: Official website (optional but recommended)
 * - githubUrl: GitHub repository URL (optional, null for SaaS)
 * - logo: Single emoji or image URL (optional)
 * - tags: Comma-separated keywords (optional)
 * - yearCreated: Year the project started (optional)
 * - selfHostable: true/false - can it be self-hosted? (required)
 * - license: e.g., 'MIT', 'Apache-2.0', 'GPL-3.0', 'Proprietary' (optional)
 * - techStack: Comma-separated technologies (optional)
 * - alternativeTo: Comma-separated alternative products (optional)
 */

// ===== AVAILABLE CATEGORIES =====
const CATEGORIES = [
  'Databases & Data Storage',
  'Web Frameworks & Libraries',
  'Backend & API Frameworks',
  'DevOps & Infrastructure',
  'AI & Machine Learning',
  'Collaboration & Productivity',
  'Developer Tools',
  'Security & Authentication',
  'Content Management',
  'Communication & Messaging',
  'Design & Creative Tools',
  'Analytics & Monitoring',
  'E-commerce & Payments',
  'Mobile Development',
  'Testing & QA',
  'Cloud & Hosting',
  'Networking & Protocols',
  'Data Science & Analytics',
  'IoT & Embedded Systems',
  'Gaming & Graphics',
  'Audio & Video',
  'Blockchain & Web3',
  'Education & Learning',
  'Healthcare & Medical',
  'Finance & Accounting',
];

// ===== PROJECT TEMPLATE =====
const projectTemplate = {
  name: 'Example Project',
  type: 'open-source', // 'open-source' | 'saas' | 'hybrid'
  category: 'Developer Tools', // Pick from CATEGORIES above
  description: 'A clear, concise description of what this project does',
  url: 'https://example.com',
  githubUrl: 'https://github.com/example/example',
  logo: '🚀',
  tags: 'tag1,tag2,tag3',
  yearCreated: 2024,
  selfHostable: true,
  license: 'MIT',
  techStack: 'TypeScript,React,Node.js',
  alternativeTo: 'Alternative1,Alternative2,Alternative3'
};

// ===== ADD YOUR NEW PROJECTS HERE =====
const newProjects = [
  // Example 1: Open-source project
  {
    name: 'Example Open Source Tool',
    type: 'open-source',
    category: 'Developer Tools',
    description: 'An amazing open-source tool that does something useful',
    url: 'https://example.com',
    githubUrl: 'https://github.com/example/tool',
    logo: '🛠️',
    tags: 'tools,development,productivity',
    yearCreated: 2023,
    selfHostable: true,
    license: 'MIT',
    techStack: 'Go,TypeScript',
    alternativeTo: 'Tool1,Tool2'
  },
  
  // Example 2: SaaS product
  {
    name: 'Example SaaS Platform',
    type: 'saas',
    category: 'Collaboration & Productivity',
    description: 'A cloud-based platform for team collaboration',
    url: 'https://example-saas.com',
    githubUrl: null, // SaaS products typically don't have GitHub repos
    logo: '☁️',
    tags: 'saas,collaboration,cloud',
    yearCreated: 2022,
    selfHostable: false,
    license: 'Proprietary',
    techStack: 'React,Node.js,PostgreSQL',
    alternativeTo: 'Competitor1,Competitor2'
  },

  // Add more projects below...
  
];

// ===== VALIDATION HELPERS =====
function validateProject(project) {
  const errors = [];
  
  if (!project.name || project.name.trim() === '') {
    errors.push('name is required');
  }
  
  if (!['open-source', 'saas', 'hybrid'].includes(project.type)) {
    errors.push('type must be "open-source", "saas", or "hybrid"');
  }
  
  if (!CATEGORIES.includes(project.category)) {
    errors.push(`category "${project.category}" is not valid. Choose from: ${CATEGORIES.join(', ')}`);
  }
  
  if (!project.description || project.description.trim() === '') {
    errors.push('description is required');
  }
  
  if (typeof project.selfHostable !== 'boolean') {
    errors.push('selfHostable must be true or false');
  }
  
  return errors;
}

// ===== MAIN EXECUTION =====
async function main() {
  console.log('🚀 Adding new projects to database...\n');

  if (newProjects.length === 0) {
    console.log('⚠️  No projects to add. Please add projects to the newProjects array.');
    return;
  }

  // Validate all projects first
  let hasErrors = false;
  for (let i = 0; i < newProjects.length; i++) {
    const project = newProjects[i];
    const errors = validateProject(project);
    
    if (errors.length > 0) {
      console.error(`❌ Project ${i + 1} "${project.name}" has errors:`);
      errors.forEach(err => console.error(`   - ${err}`));
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Please fix validation errors before continuing.');
    process.exit(1);
  }

  // Check for duplicates
  console.log('🔍 Checking for duplicate project names...');
  const existingProjects = await prisma.project.findMany({
    select: { name: true }
  });
  const existingNames = new Set(existingProjects.map(p => p.name));
  
  const duplicates = newProjects.filter(p => existingNames.has(p.name));
  if (duplicates.length > 0) {
    console.error('❌ The following projects already exist:');
    duplicates.forEach(p => console.error(`   - ${p.name}`));
    console.error('\n💡 Tip: Use unique names or delete existing projects first.');
    process.exit(1);
  }

  // Insert projects
  console.log(`\n📦 Inserting ${newProjects.length} new project(s)...\n`);
  
  let successCount = 0;
  for (const project of newProjects) {
    try {
      await prisma.project.create({
        data: project,
      });
      console.log(`✅ Added: ${project.name} (${project.category})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to add ${project.name}:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully added ${successCount}/${newProjects.length} projects!`);
  
  // Show summary
  const totalProjects = await prisma.project.count();
  console.log(`📊 Total projects in database: ${totalProjects}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
