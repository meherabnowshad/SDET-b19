// OpenAPI 3 spec for the Blog Management REST API.
// Served at /api-docs (Swagger UI) and /api-docs.json (raw JSON).

const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'BlogSpace — Blog Management REST API',
        version: '1.0.0',
        description:
            'Express + MySQL Blog API. Use **Authorize** with `Bearer <JWT>` from `POST /api/auth/login`.',
    },
    servers: [{ url: 'http://localhost:5001', description: 'Local' }],
    tags: [
        { name: 'Auth', description: 'Register (OTP), login, password recovery' },
        { name: 'Users', description: 'Profile + admin user management' },
        { name: 'Blogs', description: 'Public reads, authenticated writes' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Validation failed.' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    firstname: { type: 'string', example: 'Admin' },
                    lastname: { type: 'string', example: 'One' },
                    email: { type: 'string', example: 'admin@example.com' },
                    role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
                    isActive: { type: 'boolean', example: true },
                    profileImage: { type: 'string', nullable: true, example: '/uploads/avatar-1.png' },
                },
            },
            Blog: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    blogTitle: { type: 'string', example: 'Hello Testing' },
                    blog: { type: 'string', example: 'Post content...' },
                    category: { type: 'string', example: 'Testing' },
                    userId: { type: 'integer', example: 1 },
                    author: { $ref: '#/components/schemas/User' },
                },
            },
        },
    },
    paths: {
        // ---------- Auth ----------
        '/api/auth/register/send-otp': {
            post: {
                tags: ['Auth'],
                summary: 'Step 1 — request 6-digit registration OTP',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['firstname', 'lastname', 'email', 'password'],
                                properties: {
                                    firstname: { type: 'string', maxLength: 50 },
                                    lastname: { type: 'string', maxLength: 50 },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 6 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'OTP sent (dev mode returns OTP in response).' },
                    400: { description: 'Validation error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Step 2 — verify OTP + create account',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['firstname', 'lastname', 'email', 'password', 'otp'],
                                properties: {
                                    firstname: { type: 'string' },
                                    lastname: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 6 },
                                    otp: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Account created.' },
                    400: { description: 'Invalid/expired OTP or validation error.' },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login, returns JWT',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 6 },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'JWT + user.' }, 401: { description: 'Bad credentials / deactivated.' } },
            },
        },
        '/api/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Request password-reset link',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: { email: { type: 'string', format: 'email' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Reset link sent (or logged in dev mode).' } },
            },
        },
        '/api/auth/reset-password/{token}': {
            patch: {
                tags: ['Auth'],
                summary: 'Set new password with reset token',
                parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: { password: { type: 'string', minLength: 6 } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Password updated.' }, 400: { description: 'Invalid/expired token.' } },
            },
        },
        // ---------- Users ----------
        '/api/users/profile': {
            get: {
                tags: ['Users'],
                summary: 'Get my profile',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'Current user.' }, 401: { description: 'Unauthorized.' } },
            },
        },
        '/api/users/profile/update': {
            put: {
                tags: ['Users'],
                summary: 'Update my profile',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                minProperties: 1,
                                properties: {
                                    firstname: { type: 'string', maxLength: 50 },
                                    lastname: { type: 'string', maxLength: 50 },
                                    email: { type: 'string', format: 'email' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Profile updated.' }, 401: { description: 'Unauthorized.' } },
            },
        },
        '/api/users/password': {
            patch: {
                tags: ['Users'],
                summary: 'Change my password',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: { password: { type: 'string', minLength: 6, description: 'New password.' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Password changed.' } },
            },
        },
        '/api/users/profile/image': {
            patch: {
                tags: ['Users'],
                summary: 'Upload avatar (multipart, field: image, ≤ 2 MB)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: { image: { type: 'string', format: 'binary' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Avatar updated.' } },
            },
        },
        '/api/users': {
            get: {
                tags: ['Users'],
                summary: 'List users (admin)',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'User list.' }, 403: { description: 'Admin only.' } },
            },
        },
        '/api/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user by id (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                responses: { 200: { description: 'User.' }, 404: { description: 'Not found.' } },
            },
        },
        '/api/users/{id}/status': {
            patch: {
                tags: ['Users'],
                summary: 'Activate/deactivate user (admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['isActive'],
                                properties: { isActive: { type: 'boolean' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Status updated.' } },
            },
        },
        // ---------- Blogs ----------
        '/api/blogs': {
            get: {
                tags: ['Blogs'],
                summary: 'List/search blogs (public)',
                parameters: [
                    { name: 'title', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Blog list.' } },
            },
        },
        '/api/blogs/create': {
            post: {
                tags: ['Blogs'],
                summary: 'Create blog (auth)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['blogTitle', 'blog', 'category'],
                                properties: {
                                    blogTitle: { type: 'string', maxLength: 255 },
                                    blog: { type: 'string' },
                                    category: { type: 'string', maxLength: 100 },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Blog created.' }, 401: { description: 'Unauthorized.' } },
            },
        },
        '/api/blogs/update/{id}': {
            put: {
                tags: ['Blogs'],
                summary: 'Update blog — own, or any if admin (auth)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                minProperties: 1,
                                properties: {
                                    blogTitle: { type: 'string', maxLength: 255 },
                                    blog: { type: 'string' },
                                    category: { type: 'string', maxLength: 100 },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Blog updated.' }, 403: { description: 'Not owner.' }, 404: { description: 'Not found.' } },
            },
        },
        '/api/blogs/delete/{id}': {
            delete: {
                tags: ['Blogs'],
                summary: 'Delete blog — own, or any if admin (auth)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                responses: { 200: { description: 'Blog deleted.' }, 403: { description: 'Not owner.' } },
            },
        },
        '/api/blogs/{id}': {
            get: {
                tags: ['Blogs'],
                summary: 'Get blog by id (public)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                responses: { 200: { description: 'Blog.' }, 404: { description: 'Not found.' } },
            },
            delete: {
                tags: ['Blogs'],
                summary: 'Delete blog by id — own, or any if admin (auth)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
                responses: { 200: { description: 'Blog deleted.' } },
            },
        },
    },
};

export default swaggerSpec;
