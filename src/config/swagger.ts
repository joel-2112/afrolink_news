import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'News API',
      version: '1.0.0',
      description: `
A production-ready RESTful API where **Authors** publish content
and **Readers** consume it, backed by a real-time Analytics Engine
that processes engagement data into daily reports.
      `,
      contact: {
        name: 'Afrolink Systems',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],

    
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /auth/login',
        },
      },

      schemas: {
        
        BaseResponse: {
          type: 'object',
          properties: {
            Success: { type: 'boolean' },
            Message: { type: 'string' },
            Object: { nullable: true },
            Errors: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
          },
        },

        
        PaginatedResponse: {
          type: 'object',
          properties: {
            Success: { type: 'boolean' },
            Message: { type: 'string' },
            Object: {
              type: 'array',
              items: { type: 'object' },
            },
            PageNumber: { type: 'integer', example: 1 },
            PageSize: { type: 'integer', example: 10 },
            TotalSize: { type: 'integer', example: 100 },
            Errors: { nullable: true, example: null },
          },
        },

        
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['author', 'reader'],
            },
          },
        },

        
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
              description: 'Letters and spaces only',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'Secret@123',
              description:
                'Min 8 chars, one uppercase, one lowercase, one number, one special character',
            },
            role: {
              type: 'string',
              enum: ['author', 'reader'],
            },
          },
        },

        
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'Secret@123',
            },
          },
        },

        
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: {
              type: 'string',
              example: 'Breaking News: Something Happened',
            },
            content: {
              type: 'string',
              example: 'Full article content here...',
            },
            category: { type: 'string', example: 'Tech' },
            status: {
              type: 'string',
              enum: ['Draft', 'Published'],
            },
            authorId: { type: 'string', format: 'uuid' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },

        
        CreateArticleInput: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 150,
              example: 'Breaking News: Something Happened',
            },
            content: {
              type: 'string',
              minLength: 50,
              example: 'This is the full article content with at least fifty characters.',
            },
            category: {
              type: 'string',
              example: 'Tech',
              description: 'e.g. Politics, Tech, Sports, Health',
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Published'],
              default: 'Draft',
            },
          },
        },

        
        UpdateArticleInput: {
          type: 'object',
          description: 'At least one field required',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 150,
              example: 'Updated Title Here',
            },
            content: {
              type: 'string',
              minLength: 50,
              example: 'Updated content that is at least fifty characters long.',
            },
            category: { type: 'string', example: 'Sports' },
            status: {
              type: 'string',
              enum: ['Draft', 'Published'],
            },
          },
        },

        
        DashboardItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            category: { type: 'string' },
            status: { type: 'string', enum: ['Draft', 'Published'] },
            createdAt: { type: 'string', format: 'date-time' },
            totalViews: {
              type: 'integer',
              example: 1024,
              description: 'Summed from DailyAnalytics',
            },
          },
        },

        
        ErrorResponse: {
          type: 'object',
          properties: {
            Success: { type: 'boolean', example: false },
            Message: { type: 'string', example: 'Error message' },
            Object: { nullable: true, example: null },
            Errors: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
              example: ['Detailed error 1', 'Detailed error 2'],
            },
          },
        },
      },

      
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                Success: false,
                Message: 'Unauthorized',
                Object: null,
                Errors: ['No token provided'],
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient role permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                Success: false,
                Message: 'Forbidden',
                Object: null,
                Errors: null,
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                Success: false,
                Message: 'Article not found',
                Object: null,
                Errors: null,
              },
            },
          },
        },
        ValidationError: {
          description: 'Zod validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                Success: false,
                Message: 'Validation failed',
                Object: null,
                Errors: [
                  'Password must contain at least one uppercase letter',
                  'Name must contain only letters and spaces',
                ],
              },
            },
          },
        },
      },

      
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        sizeParam: {
          in: 'query',
          name: 'size',
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        articleIdParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Article UUID',
        },
      },
    },
  },

  
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);