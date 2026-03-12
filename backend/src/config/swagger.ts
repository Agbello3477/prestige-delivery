import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Prestige Delivery Logistics Engine API',
            version: '1.0.0',
            description: 'API documentation for the Prestige Delivery and Logistics Services platform',
            contact: {
                name: 'Prestige Dev Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:4000/api',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
