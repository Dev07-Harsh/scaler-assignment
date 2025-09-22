const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Booking System API',
      version: '1.0.0',
      description: 'A comprehensive API for movie booking system with authentication, cinema management, and show booking capabilities.',
      contact: {
        name: 'Movie Booking API Support',
        email: 'hs07518210@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Cinema: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Cinema ID'
            },
            name: {
              type: 'string',
              description: 'Cinema name'
            },
            city: {
              type: 'string',
              description: 'City where cinema is located'
            },
            screens: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Screen'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Screen: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Screen ID'
            },
            name: {
              type: 'string',
              description: 'Screen name/number'
            },
            cinemaId: {
              type: 'integer',
              description: 'Associated cinema ID'
            },
            cinema: {
              $ref: '#/components/schemas/Cinema'
            }
          }
        },
        Movie: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Movie ID'
            },
            title: {
              type: 'string',
              description: 'Movie title'
            },
            description: {
              type: 'string',
              description: 'Movie description'
            },
            durationMin: {
              type: 'integer',
              description: 'Movie duration in minutes'
            },
            posterUrl: {
              type: 'string',
              format: 'uri',
              description: 'Movie poster URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Show: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Show ID'
            },
            movieId: {
              type: 'integer',
              description: 'Associated movie ID'
            },
            screenId: {
              type: 'integer',
              description: 'Associated screen ID'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Show start time'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Ticket price'
            },
            movie: {
              $ref: '#/components/schemas/Movie'
            },
            screen: {
              $ref: '#/components/schemas/Screen'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};