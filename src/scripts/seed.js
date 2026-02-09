import { PrismaClient } from '@prisma/client';
import authService from '../services/authService.js';

const prisma = new PrismaClient();

const sampleProjects = [
  { id: 1, name: 'PostgreSQL', type: 'open-source', category: 'Database', description: 'Advanced open source relational database', url: 'https://postgresql.org', githubUrl: 'https://github.com/postgres/postgres', logo: '🐘', tags: ['sql', 'acid', 'enterprise'], yearCreated: 1996 },
  { id: 2, name: 'Git', type: 'open-source', category: 'Version Control', description: 'Distributed version control system', url: 'https://git-scm.com', githubUrl: 'https://github.com/git/git', logo: '📦', tags: ['vcs', 'distributed', 'essential'], yearCreated: 2005 },
  { id: 3, name: 'Redis', type: 'open-source', category: 'Cache/Database', description: 'In-memory data structure store', url: 'https://redis.io', githubUrl: 'https://github.com/redis/redis', logo: '⚡', tags: ['cache', 'fast', 'versatile'], yearCreated: 2009 },
  { id: 4, name: 'Stripe', type: 'saas', category: 'Payments', description: 'Payment processing platform', url: 'https://stripe.com', githubUrl: null, logo: '💳', tags: ['payments', 'api-first', 'documentation'], yearCreated: 2010 },
  { id: 5, name: 'Nginx', type: 'open-source', category: 'Web Server', description: 'High-performance HTTP server and reverse proxy', url: 'https://nginx.org', githubUrl: 'https://github.com/nginx/nginx', logo: '🌐', tags: ['web-server', 'reverse-proxy', 'stable'], yearCreated: 2004 },
  { id: 6, name: 'SQLite', type: 'open-source', category: 'Database', description: 'Self-contained serverless SQL database', url: 'https://sqlite.org', githubUrl: null, logo: '🗄️', tags: ['embedded', 'zero-config', 'reliable'], yearCreated: 2000 },
  { id: 7, name: 'MySQL', type: 'open-source', category: 'Database', description: 'Popular open-source relational database', url: 'https://mysql.com', githubUrl: 'https://github.com/mysql/mysql-server', logo: '🐬', tags: ['sql', 'relational', 'web-scale'], yearCreated: 1995 },
  { id: 8, name: 'MongoDB', type: 'open-source', category: 'Database', description: 'Document-oriented NoSQL database', url: 'https://mongodb.com', githubUrl: 'https://github.com/mongodb/mongo', logo: '🍃', tags: ['nosql', 'document', 'flexible-schema'], yearCreated: 2009 },
  { id: 9, name: 'PlanetScale', type: 'saas', category: 'Database', description: 'Serverless MySQL platform with branching', url: 'https://planetscale.com', githubUrl: null, logo: '🪐', tags: ['mysql', 'serverless', 'branching'], yearCreated: 2018 },
  { id: 10, name: 'Supabase', type: 'saas', category: 'Database', description: 'Open source Firebase alternative', url: 'https://supabase.com', githubUrl: 'https://github.com/supabase/supabase', logo: '⚡', tags: ['postgres', 'realtime', 'auth'], yearCreated: 2020 },
  { id: 11, name: 'GitHub', type: 'saas', category: 'Version Control', description: 'Web-based Git repository hosting', url: 'https://github.com', githubUrl: null, logo: '🐙', tags: ['git-hosting', 'collaboration', 'ci-cd'], yearCreated: 2008 },
  { id: 12, name: 'GitLab', type: 'saas', category: 'Version Control', description: 'Complete DevOps platform', url: 'https://gitlab.com', githubUrl: null, logo: '🦊', tags: ['devops', 'ci-cd', 'self-hosted'], yearCreated: 2011 },
  { id: 13, name: 'Elasticsearch', type: 'open-source', category: 'Search', description: 'Distributed search and analytics engine', url: 'https://elastic.co', githubUrl: 'https://github.com/elastic/elasticsearch', logo: '🔍', tags: ['search', 'analytics', 'logging'], yearCreated: 2010 },
  { id: 14, name: 'Algolia', type: 'saas', category: 'Search', description: 'Hosted search API', url: 'https://algolia.com', githubUrl: null, logo: '🔎', tags: ['search-api', 'instant', 'typo-tolerant'], yearCreated: 2012 },
  { id: 15, name: 'Meilisearch', type: 'open-source', category: 'Search', description: 'Lightning-fast search engine', url: 'https://meilisearch.com', githubUrl: 'https://github.com/meilisearch/meilisearch', logo: '🔦', tags: ['rust', 'instant-search', 'simple'], yearCreated: 2018 },
  { id: 16, name: 'Apache Kafka', type: 'open-source', category: 'Message Queue', description: 'Distributed event streaming platform', url: 'https://kafka.apache.org', githubUrl: 'https://github.com/apache/kafka', logo: '📨', tags: ['streaming', 'distributed', 'high-throughput'], yearCreated: 2011 },
  { id: 17, name: 'RabbitMQ', type: 'open-source', category: 'Message Queue', description: 'Open source message broker', url: 'https://rabbitmq.com', githubUrl: 'https://github.com/rabbitmq/rabbitmq-server', logo: '🐰', tags: ['amqp', 'reliable', 'flexible-routing'], yearCreated: 2007 },
  { id: 18, name: 'Kubernetes', type: 'open-source', category: 'Container Orchestration', description: 'Production-grade container orchestration', url: 'https://kubernetes.io', githubUrl: 'https://github.com/kubernetes/kubernetes', logo: '☸️', tags: ['containers', 'orchestration', 'cloud-native'], yearCreated: 2014 },
  { id: 19, name: 'Docker', type: 'open-source', category: 'Container Orchestration', description: 'Platform for containerized applications', url: 'https://docker.com', githubUrl: 'https://github.com/docker/docker-ce', logo: '🐳', tags: ['containers', 'virtualization', 'devops'], yearCreated: 2013 },
  { id: 20, name: 'Auth0', type: 'saas', category: 'Authentication', description: 'Identity platform for developers', url: 'https://auth0.com', githubUrl: null, logo: '🔐', tags: ['identity', 'sso', 'oauth'], yearCreated: 2013 },
  { id: 21, name: 'Keycloak', type: 'open-source', category: 'Authentication', description: 'Open source identity management', url: 'https://keycloak.org', githubUrl: 'https://github.com/keycloak/keycloak', logo: '🔑', tags: ['iam', 'sso', 'ldap'], yearCreated: 2014 },
  { id: 22, name: 'Clerk', type: 'saas', category: 'Authentication', description: 'Complete user management', url: 'https://clerk.com', githubUrl: null, logo: '👤', tags: ['auth', 'user-management', 'react'], yearCreated: 2020 },
  { id: 23, name: 'Prometheus', type: 'open-source', category: 'Monitoring', description: 'Monitoring system and time series database', url: 'https://prometheus.io', githubUrl: 'https://github.com/prometheus/prometheus', logo: '🔥', tags: ['metrics', 'alerting', 'time-series'], yearCreated: 2012 },
  { id: 24, name: 'Grafana', type: 'open-source', category: 'Monitoring', description: 'Analytics and monitoring solution', url: 'https://grafana.com', githubUrl: 'https://github.com/grafana/grafana', logo: '📊', tags: ['dashboards', 'visualization', 'observability'], yearCreated: 2014 },
  { id: 25, name: 'Datadog', type: 'saas', category: 'Monitoring', description: 'Cloud monitoring platform', url: 'https://datadoghq.com', githubUrl: null, logo: '🐕', tags: ['apm', 'logs', 'infrastructure'], yearCreated: 2010 },
  { id: 26, name: 'Caddy', type: 'open-source', category: 'Web Server', description: 'Web server with automatic HTTPS', url: 'https://caddyserver.com', githubUrl: 'https://github.com/caddyserver/caddy', logo: '🔒', tags: ['automatic-https', 'simple', 'go'], yearCreated: 2015 },
  { id: 27, name: 'Cloudflare', type: 'saas', category: 'Web Server', description: 'Global cloud platform', url: 'https://cloudflare.com', githubUrl: null, logo: '☁️', tags: ['cdn', 'ddos', 'workers'], yearCreated: 2009 },
  { id: 28, name: 'SendGrid', type: 'saas', category: 'Email', description: 'Cloud-based email delivery', url: 'https://sendgrid.com', githubUrl: null, logo: '📧', tags: ['transactional', 'marketing', 'api'], yearCreated: 2009 },
  { id: 29, name: 'Postmark', type: 'saas', category: 'Email', description: 'Transactional email service', url: 'https://postmarkapp.com', githubUrl: null, logo: '📮', tags: ['transactional', 'reliable', 'simple'], yearCreated: 2010 },
  { id: 30, name: 'GitHub Actions', type: 'saas', category: 'CI/CD', description: 'Automate workflows in GitHub', url: 'https://github.com/features/actions', githubUrl: null, logo: '⚙️', tags: ['workflow', 'yaml', 'integrated'], yearCreated: 2019 },
  { id: 31, name: 'Jenkins', type: 'open-source', category: 'CI/CD', description: 'Open source automation server', url: 'https://jenkins.io', githubUrl: 'https://github.com/jenkinsci/jenkins', logo: '🎩', tags: ['automation', 'pipelines', 'plugins'], yearCreated: 2011 },
  { id: 32, name: 'Valkey', type: 'open-source', category: 'Cache/Database', description: 'Open source Redis fork by Linux Foundation', url: 'https://valkey.io', githubUrl: 'https://github.com/valkey-io/valkey', logo: '🔑', tags: ['redis-fork', 'linux-foundation', 'cache'], yearCreated: 2024 },
  { id: 33, name: 'Memcached', type: 'open-source', category: 'Cache/Database', description: 'Distributed memory caching system', url: 'https://memcached.org', githubUrl: 'https://github.com/memcached/memcached', logo: '🧠', tags: ['cache', 'simple', 'distributed'], yearCreated: 2003 }
];

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.userRating.deleteMany();
    await prisma.aIRating.deleteMany();
    await prisma.project.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@survivalindex.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    
    const adminUser = await authService.createUser({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      name: adminName
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    console.log('   📝 Login credentials:');
    console.log(`      Email: ${adminEmail}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`      Password: ${adminPassword}`);
    } else {
      console.log('      Password: [hidden in production]');
    }
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('   ⚠️  WARNING: Using default credentials! Set ADMIN_EMAIL and ADMIN_PASSWORD in production!\n');
    } else {
      console.log('   ✅ Using custom admin credentials from environment variables\n');
    }

    // Seed projects
    console.log('📦 Seeding projects...');
    let created = 0;

    for (const projectData of sampleProjects) {
      await prisma.project.create({
        data: {
          name: projectData.name,
          type: projectData.type,
          category: projectData.category,
          description: projectData.description,
          url: projectData.url,
          githubUrl: projectData.githubUrl,
          logo: projectData.logo,
          tags: projectData.tags.join(','),
          yearCreated: projectData.yearCreated
        }
      });
      created++;
      process.stdout.write(`\r   Created ${created}/${sampleProjects.length} projects`);
    }
    console.log('\n✅ Projects seeded successfully\n');

    // Display summary
    const totalProjects = await prisma.project.count();
    console.log('📊 Seeding Summary:');
    console.log(`   Total Projects: ${totalProjects}`);
    console.log(`   - Open Source: ${sampleProjects.filter(p => p.type === 'open-source').length}`);
    console.log(`   - SaaS: ${sampleProjects.filter(p => p.type === 'saas').length}`);
    console.log('\n✨ Database seeding complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the backend: npm run dev:backend');
    console.log('   2. Login as admin: POST /api/auth/login');
    console.log('      Body: {"email": "admin@SurvivalIndex.org", "password": "admin123"}');
    console.log('   3. Trigger AI evaluations: POST /api/ai-judge/evaluate/:projectId (Admin only)');
    console.log('   4. View projects: GET /api/projects\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
