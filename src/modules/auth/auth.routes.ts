import { Router } from 'express';
import { register, login } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration and authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *             example:
 *               Success: true
 *               Message: Account created successfully
 *               Object:
 *                 id: uuid-here
 *                 name: John Doe
 *                 email: john@example.com
 *                 role: author
 *               Errors: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               Success: false
 *               Message: Registration failed
 *               Object: null
 *               Errors: ["Email already in use"]
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *             example:
 *               Success: true
 *               Message: Login successful
 *               Object:
 *                 token: eyJhbGc...
 *                 user:
 *                   id: uuid-here
 *                   name: John Doe
 *                   email: john@example.com
 *                   role: author
 *               Errors: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               Success: false
 *               Message: Authentication failed
 *               Object: null
 *               Errors: ["Invalid credentials"]
 */
router.post('/login', validate(loginSchema), login);

export default router;