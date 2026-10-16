export interface CaseStudy {
  number: string;
  category: string;
  title: string;
  challenge: string;
  solution: string;
  outcome: string;
  technologies: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    number: '01',
    category: 'BACKEND & DEVOPS',
    title: 'Legacy Monolith Modernization & Cloud Migration',
    challenge: 'A business-critical PHP application suffered from high latency, database lockups under traffic spikes, and fragile manual releases.',
    solution: 'Audited and refactored core bottlenecks into structured service layers, optimized database indexes, containerized the application, and orchestrated a zero-downtime AWS migration.',
    outcome: 'Cut average response latency by 45%, eliminated deployment downtime, and established predictable server costs.',
    technologies: ['PHP', 'Laravel', 'MySQL', 'AWS', 'Docker']
  },
  {
    number: '02',
    category: 'FULL-STACK PRODUCT',
    title: 'High-Throughput SaaS Dashboard & API Architecture',
    challenge: 'A growing SaaS required an intuitive web interface and an asynchronous API capable of crunching customer analytics without UI lag.',
    solution: 'Built a responsive React & Next.js frontend coupled with a high-performance Python (FastAPI) backend, with asynchronous task processing and role-based permissions.',
    outcome: 'Delivered from initial architectural scoping to production launch in 8 weeks with complete API documentation.',
    technologies: ['React', 'Next.js', 'FastAPI', 'Python', 'Redis']
  },
  {
    number: '03',
    category: 'BUSINESS SYSTEMS',
    title: 'ERPNext Workflow Automation & System Integration',
    challenge: 'Fragmented sales, inventory, and supplier communication required constant manual data re-entry across disconnected tools.',
    solution: 'Customized ERPNext business logic, automated multi-stage order approval workflows, and created resilient REST API integrations with third-party suppliers.',
    outcome: 'Eliminated 15+ hours of weekly manual data entry and reduced order turnaround time from 24 hours to instant synchronization.',
    technologies: ['ERPNext', 'Python', 'MariaDB', 'REST APIs']
  },
  {
    number: '04',
    category: 'CLOUD INFRASTRUCTURE',
    title: 'VPS Infrastructure Hardening & CI/CD Automation',
    challenge: 'Production deployments relied on error-prone manual FTP/SSH uploads with no staging environment or verified disaster recovery.',
    solution: 'Designed an automated GitHub Actions CI/CD pipeline, configured hardened Linux environments with Nginx reverse proxying, and implemented automated encrypted offsite backups.',
    outcome: 'Reduced deployment times from 45 minutes to 3 minutes, giving the team confidence to release updates multiple times a week.',
    technologies: ['AWS', 'DigitalOcean', 'Linux', 'Nginx', 'CI/CD']
  }
];
