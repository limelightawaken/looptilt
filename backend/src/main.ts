import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // IMPORTANT: Disable default body parser for Better Auth
  });
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );

  // Enable JSON body parsing for all routes EXCEPT Better Auth routes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.url.startsWith('/api/auth/')) {
      return express.json()(req, res, next);
    }
    next();
  });

  // Enable URL-encoded body parsing for non-auth routes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.url.startsWith('/api/auth/')) {
      return express.urlencoded({ extended: true })(req, res, next);
    }
    next();
  });

  // Global API prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS with credentials support
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('LoopTilt API')
    .setDescription(
      'LoopTilt API — newsletter personalization for Kit: archive ingestion, newsletter fingerprint, segments, and voice-preserving ghostwriter drafts.',
    )
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints (Better Auth)')
    .addTag('newsletters', 'Newsletter workspaces and archive management')
    .addTag('fingerprints', 'Structured content understanding from archive')
    .addTag('ghostwriter', 'Voice-preserving drafts and modular content blocks')
    .addTag('esp', 'ESP (Kit) connection and data-source mode')
    .addTag('simulator', 'Local signal simulator (development only)')
    .addTag('signals', 'Inbound Kit webhook ingestion')
    .addTag('readers', 'Per-subscriber reader fingerprints and insights')
    .addTag('segments', 'Default and AI-built segments')
    .addTag('loop', 'Re-segmentation recompute orchestration')
    .addTag('sends', 'Per-segment variant generation and delivery')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add Better Auth endpoints to Swagger documentation
  const authPaths = {
    '/api/auth/sign-up/email': {
      post: {
        tags: ['auth'],
        summary: 'Sign up with email and password',
        description: 'Create a new user account with email and password credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid input or email already exists' },
        },
      },
    },
    '/api/auth/sign-in/email': {
      post: {
        tags: ['auth'],
        summary: 'Sign in with email and password',
        description: 'Authenticate user with email and password credentials. Sets session cookie on success.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sign in successful, session cookie set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                    session: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['auth'],
        summary: 'Sign out',
        description: 'Sign out the current user and invalidate their session',
        responses: {
          '200': { description: 'Sign out successful' },
        },
      },
    },
    '/api/auth/get-session': {
      get: {
        tags: ['auth'],
        summary: 'Get current session',
        description: 'Get the current authenticated user session',
        responses: {
          '200': {
            description: 'Current session returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        emailVerified: { type: 'boolean' },
                        image: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                    session: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'No active session' },
        },
      },
    },
    '/api/auth/forget-password': {
      post: {
        tags: ['auth'],
        summary: 'Forgot password',
        description: 'Request a password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  redirectTo: { type: 'string', example: '/reset-password' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reset email sent if account exists' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['auth'],
        summary: 'Reset password',
        description: 'Reset password using the token from email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string', description: 'Reset token from email' },
                  newPassword: { type: 'string', minLength: 8, example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successful' },
          '400': { description: 'Invalid or expired token' },
        },
      },
    },
    '/api/auth/verify-email': {
      get: {
        tags: ['auth'],
        summary: 'Verify email',
        description: 'Verify email address using the token from verification email',
        parameters: [
          {
            name: 'token',
            in: 'query' as const,
            required: true,
            schema: { type: 'string' },
            description: 'Email verification token',
          },
        ],
        responses: {
          '200': { description: 'Email verified successfully' },
          '400': { description: 'Invalid or expired token' },
        },
      },
    },
  };

  // Merge auth paths with generated paths
  document.paths = { ...authPaths, ...document.paths } as typeof document.paths;

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🔐 Better Auth endpoints: http://localhost:${port}/${apiPrefix}/auth/*`);
}

bootstrap();
