import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Post, PostSchema } from '../../modules/posts/schemas/post.schema.js';

// Load .env variables if not already set in environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore error if already loaded
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://admin:password123@localhost:27017/blog-nest?authSource=admin';

const seedPostsData: Array<Pick<Post, 'title' | 'content' | 'authorName'>> = [
  {
    title: 'Mastering NestJS Architecture: From Modules to Microservices',
    content: `NestJS provides an out-of-the-box application architecture which allows developers and teams to create highly testable, scalable, loosely coupled, and easily maintainable applications.

In this deep dive, we explore:
- Modular boundaries and dependency injection patterns.
- Custom dynamic modules with \`forRoot\` and \`registerAsync\`.
- Clean error propagation using exception filters.
- Transitioning monolithic domains into high-performance microservices using gRPC and NATS.`,
    authorName: 'Alex Rivera',
  },
  {
    title: 'Demystifying MongoDB Indexing and Performance Tuning',
    content: `A slow database query can ruin an otherwise pristine web application. Without thoughtful indexes, MongoDB must perform full collection scans, examining every document in memory.

Key principles covered in this guide:
1. Single field vs compound indexes.
2. The Equality, Sort, Range (ESR) rule for compound index creation.
3. Analyzing query plans using \`explain('executionStats')\`.
4. Partial and TTL indexes to optimize storage and lifecycle management.`,
    authorName: 'Sarah Chen',
  },
  {
    title: 'Building Scalable REST APIs with Clean Architecture in TypeScript',
    content: `Clean Architecture emphasizes the separation of concerns, decoupling domain entities and business rules from web frameworks, UI, and database libraries.

We explore how to organize your TypeScript codebase into Domain, Application, Infrastructure, and Interface layers, making your software resilient to technological shifts.`,
    authorName: 'Marcus Johnson',
  },
  {
    title: 'Modern Authentication: Passwords, OTP, and JWT Device Sessions',
    content: `Security is not a checkbox; it is a continuously maintained standard. In modern distributed systems, stateless JWTs must often balance flexibility with immediate revocation.

Topics covered:
- Password hashing with bcrypt and adaptive work factors.
- Multi-factor authentication via cryptographically secure one-time passwords (OTP).
- Device fingerprinting and session revocation strategies that invalidate compromised tokens on the fly.`,
    authorName: 'Elena Rostova',
  },
  {
    title: 'Effective Docker Workflows for Local Fullstack Development',
    content: `Docker Compose bridges the gap between disparate services in development and identical container configurations in production.

Learn how to configure lightweight multi-stage Dockerfiles, orchestrate MongoDB with Mongo Express, configure hot reloading without performance overhead, and isolate environments across teams.`,
    authorName: 'David Kim',
  },
  {
    title: 'TypeScript 5.x Deep Dive: Decorators, Metadata, and Type Safety',
    content: `TypeScript's official Stage 3 decorator support brings standard-compliant metaprogramming to the frontend and backend alike.

We compare experimental legacy decorators with the TC39 standard, investigate \`reflect-metadata\` internals, and build custom validation decorators with \`class-validator\`.`,
    authorName: 'Alex Rivera',
  },
  {
    title: 'Why Microservices Aren’t Always the Answer: A Pragmatic Monolith Guide',
    content: `Microservices solve organizational scalability, not software complexity. For most startups and mid-sized applications, a well-structured modular monolith delivers significantly higher velocity, easier debugging, and lower infrastructure costs.

This post outlines criteria for deciding when to split a service and when to double down on modular monoliths.`,
    authorName: 'Michael Scott',
  },
  {
    title: 'Asynchronous Event-Driven Architectures with RabbitMQ and Kafka',
    content: `Decoupling heavy background processing from critical HTTP request-response cycles is fundamental to maintaining sub-100ms API response times.

Explore publish-subscribe topologies, message durability guarantees, dead-letter exchanges, and consumer backpressure strategies.`,
    authorName: 'Sarah Chen',
  },
  {
    title: 'Data Validation and Pipeline Filtering with NestJS Custom Pipes',
    content: `Input validation is your application's first line of defense. NestJS pipes allow transformation and validation before route handlers execute.

Discover how to create custom asynchronous pipes, verify database entity existence before controller logic runs, and compose pipes for reusable DTO sanitization.`,
    authorName: 'Marcus Johnson',
  },
  {
    title: 'The Future of Web APIs: GraphQL, gRPC, or Pragmatic REST?',
    content: `With gRPC dominating backend-to-backend communication, GraphQL serving complex frontend data graphs, and REST remaining the lingua franca of public APIs, how do you choose?

A comparative breakdown analyzing payload overhead, latency benchmarks, caching semantics, and developer ergonomics.`,
    authorName: 'Elena Rostova',
  },
  {
    title: 'Securing Node.js Applications: OWASP Top 10 Best Practices',
    content: `From prototype pollution and NoSQL injection to cross-site scripting (XSS) and broken authorization controls, Node.js applications require proactive hardening.

Review practical defenses including Helmet headers, rate limiting with Redis token buckets, parameterized queries, and dependency auditing with automated CI scans.`,
    authorName: 'David Kim',
  },
  {
    title: 'Zero-Downtime Deployments with Docker, Traefik, and Health Checks',
    content: `Rolling updates without dropping active WebSocket connections or HTTP requests require careful synchronization between orchestration and health probes.

Step-by-step setup of rolling updates, graceful shutdown hooks in NestJS with \`enableShutdownHooks\`, and dynamic routing via reverse proxies.`,
    authorName: 'Sarah Chen',
  },
];

async function seed() {
  const isClean = process.argv.includes('--clean') || process.argv.includes('-c');

  console.log(`\nConnecting to MongoDB: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}...`);

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully.\n');

  const PostModel = mongoose.model<Post>('Post', PostSchema);

  if (isClean) {
    const deleted = await PostModel.deleteMany({});
    console.log(`[Clean Mode] Removed ${deleted.deletedCount} existing post(s).`);
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const postData of seedPostsData) {
    const existing = await PostModel.findOne({ title: postData.title });
    if (existing) {
      console.log(`- Skipped: "${postData.title}" (already exists)`);
      skippedCount++;
    } else {
      await PostModel.create(postData);
      console.log(`+ Created: "${postData.title}" by ${postData.authorName}`);
      insertedCount++;
    }
  }

  const totalCount = await PostModel.countDocuments();

  console.log('\n========================================');
  console.log(` Seeding Summary:`);
  console.log(`   - New posts created: ${insertedCount}`);
  console.log(`   - Skipped (duplicates): ${skippedCount}`);
  console.log(`   - Total posts in DB: ${totalCount}`);
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Database connection closed.');
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('\nSeeding failed with error:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore
  }
  process.exit(1);
});
