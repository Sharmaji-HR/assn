const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: 'Production-grade backend for Finance Dashboard with JWT authentication, RBAC, and analytics.',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      },
      {
        url: 'https://api.finance-dashboard.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in Bearer format'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User UUID' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'decimal', example: 1500.50 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Summary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number' },
            totalExpenses: { type: 'number' },
            netBalance: { type: 'number' },
            categoryTotals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  total: { type: 'number' }
                }
              }
            },
            recentTransactions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Transaction' }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          security: [],
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 80 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8, maxLength: 72 }
                  },
                  required: ['name', 'email', 'password']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error' },
            '409': { description: 'Email already registered' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error' },
            '401': { description: 'Invalid credentials or inactive user' }
          }
        }
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users (ADMIN)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Admin only' }
          }
        },
        post: {
          tags: ['Users'],
          summary: 'Create new user (ADMIN)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] }
                  },
                  required: ['name', 'email', 'password']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error' },
            '409': { description: 'Email already exists' }
          }
        }
      },
      '/users/{id}': {
        patch: {
          tags: ['Users'],
          summary: 'Update user (self-update allowed, admin for role/status)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error or self-deactivation attempt' },
            '403': { description: 'Permission denied' },
            '404': { description: 'User not found' }
          }
        }
      },
      '/transactions': {
        get: {
          tags: ['Transactions'],
          summary: 'Get user transactions (VIEWER, ANALYST, ADMIN)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'dateFrom',
              in: 'query',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              name: 'dateTo',
              in: 'query',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['income', 'expense'] }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 }
            }
          ],
          responses: {
            '200': {
              description: 'List of transactions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Transaction' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              limit: { type: 'integer' },
                              offset: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Transactions'],
          summary: 'Create transaction (ADMIN)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', minimum: 0.01 },
                    type: { type: 'string', enum: ['income', 'expense'] },
                    category: { type: 'string', minLength: 2 },
                    date: { type: 'string', format: 'date-time' },
                    notes: { type: 'string', maxLength: 500 }
                  },
                  required: ['amount', 'type', 'category', 'date']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Transaction created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Transaction' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error' },
            '403': { description: 'Admin only' }
          }
        }
      },
      '/transactions/{id}': {
        put: {
          tags: ['Transactions'],
          summary: 'Update transaction (ADMIN)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', minimum: 0.01 },
                    type: { type: 'string', enum: ['income', 'expense'] },
                    category: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Transaction updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Transaction' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error or deleted transaction' },
            '403': { description: 'Admin only' },
            '404': { description: 'Transaction not found' }
          }
        },
        delete: {
          tags: ['Transactions'],
          summary: 'Soft-delete transaction (ADMIN)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Transaction deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Already deleted' },
            '403': { description: 'Admin only' },
            '404': { description: 'Transaction not found' }
          }
        }
      },
      '/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get financial summary (ANALYST, ADMIN)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Financial summary',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Summary' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Analyst or Admin only' }
          }
        }
      },
      '/dashboard/trends': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get monthly trends (ANALYST, ADMIN)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Monthly trends data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          monthly: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                month: { type: 'string' },
                                income: { type: 'number' },
                                expenses: { type: 'number' },
                                net: { type: 'number' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Analyst or Admin only' }
          }
        }
      },
      '/admin/bootstrap': {
        post: {
          tags: ['Admin Operations'],
          summary: 'Bootstrap admin account (manual trigger)',
          description: 'Manually trigger admin account creation. Normally runs automatically on server startup if BOOTSTRAP_ADMIN=true and environment variables set. Use this endpoint to create admin if automatic bootstrap is disabled or failed. Requires all three bootstrap env vars set: BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD.',
          security: [],
          responses: {
            '201': {
              description: 'Admin account created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Bootstrap admin account created.' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bootstrap misconfigured or validation failure',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    missingEnvVars: {
                      value: {
                        success: false,
                        message: 'BOOTSTRAP_ADMIN is enabled, but BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD are required.',
                        code: 'BOOTSTRAP_CONFIG_ERROR'
                      }
                    },
                    invalidPasswordLength: {
                      value: {
                        success: false,
                        message: 'Validation failed',
                        errors: [
                          {
                            path: 'password',
                            message: 'Bootstrap admin password must be at least 8 characters'
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            '409': {
              description: 'Admin already exists or email conflict',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    adminExists: {
                      value: {
                        success: false,
                        message: 'An admin account already exists.',
                        code: 'ADMIN_EXISTS'
                      }
                    },
                    emailConflict: {
                      value: {
                        success: false,
                        message: 'Bootstrap admin email already exists with a non-admin account. Resolve manually to prevent unsafe privilege changes.',
                        code: 'EMAIL_CONFLICT'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
