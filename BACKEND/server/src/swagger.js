/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Server error
 *
 * /auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *
 * /auth/logout:
 *   post:
 *     summary: Sign out current user
 *     tags:
 *       - Authentication
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: Signed out successfully
 *
 * /campaigns:
 *   get:
 *     summary: List all campaigns
 *     tags:
 *       - Campaigns
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, completed, cancelled, rejected]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 count:
 *                   type: integer
 *   post:
 *     summary: Create a new campaign
 *     tags:
 *       - Campaigns
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - targetAmount
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               ngoId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *
 * /campaigns/{id}:
 *   get:
 *     summary: Get campaign details
 *     tags:
 *       - Campaigns
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaign:
 *                   $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *   put:
 *     summary: Update campaign
 *     tags:
 *       - Campaigns
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Campaign updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Campaign not found
 *   delete:
 *     summary: Delete campaign
 *     tags:
 *       - Campaigns
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted
 *       403:
 *         description: Not authorized
 *
 * /donations:
 *   post:
 *     summary: Create a donation
 *     tags:
 *       - Donations
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               campaignId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, gcash, paymaya, bank_transfer]
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Donation created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *
 * /donations/my-donations:
 *   get:
 *     summary: Get user's donations
 *     tags:
 *       - Donations
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's donations
 *       401:
 *         description: Not authenticated
 *
 * /donations/campaign/{campaignId}/stats:
 *   get:
 *     summary: Get campaign donation statistics
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalDonations:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *
 * /ngos:
 *   post:
 *     summary: Create NGO profile
 *     tags:
 *       - NGOs
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - registrationNumber
 *             properties:
 *               name:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: NGO profile created
 *       401:
 *         description: Not authenticated
 *
 * /admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *
 * /admin/activity-logs:
 *   get:
 *     summary: Get activity logs (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity logs
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [donor, ngo_admin, admin, superadmin]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Campaign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         targetAmount:
 *           type: number
 *         currentAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, pending, active, completed, cancelled, rejected]
 *         ngoId:
 *           type: string
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *   securitySchemes:
 *     SessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: kb.sid
 */
