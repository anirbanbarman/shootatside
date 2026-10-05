const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHmac } = require('crypto');
const { promisify } = require('util');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shootatside';
const scrypt = promisify(scryptCallback);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShootAtSide API',
      version: '1.0.0',
      description: 'API documentation for the ShootAtSide photography studio backend',
    },
    servers: [{ url: 'http://localhost:4000' }],
  },
  apis: ['server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const editorApplicationSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    whatsapp: String,
    email: { type: String, required: true },
    address: String,
    phonePe: String,
    aadharFileName: String,
    aadharDataUrl: String,
    selfieFileName: String,
    selfieDataUrl: String,
    editingRoles: [String],
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, output) => {
        output.id = String(output._id);
        delete output.password;
        return output;
      },
    },
  }
);

const teamRegistrationSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    whatsapp: String,
    email: { type: String, required: true },
    address: String,
    aadharFileName: String,
    aadharDataUrl: String,
    selfieFileName: String,
    selfieDataUrl: String,
    phonePe: String,
    preferredRoles: [String],
    username: String,
    password: String,
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, output) => {
        output.id = String(output._id);
        delete output.password;
        return output;
      },
    },
  }
);

const projectSchema = new mongoose.Schema(
  {
    client: {
      id: String,
      name: String,
      email: String,
      phone: String,
    },
    eventType: String,
    eventDate: String,
    venue: String,
    budget: String,
    requirements: String,
    requestAcceptedAt: Date,
    clientContactDetails: Object,
    contract: Object,
    initialQuote: Object,
    clientResponse: Object,
    negotiation: Object,
    negotiationResponse: Object,
    payment: Object,
    teamAssignment: Object,
    eventTeam: [Object],
    teamBrief: Object,
    eventTracker: Object,
    editingWorkflow: Object,
    teamInterest: [Object],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, output) => {
        output.id = String(output._id);
        return output;
      },
    },
  }
);

const EditorApplication = mongoose.model('EditorApplication', editorApplicationSchema);
const TeamRegistration = mongoose.model('TeamRegistration', teamRegistrationSchema);
const Project = mongoose.model('Project', projectSchema);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: function passwordRequired() { return this.role !== 'client'; } },
    phone: String,
    editingRoles: [String],
    role: {
      type: String,
      enum: ['admin', 'client', 'team', 'editor'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, output) => {
        output.id = String(output._id);
        delete output.password;
        return output;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.startsWith('scrypt$')) return false;
  const [, salt, expectedHex] = storedHash.split('$');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function createAuthToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured to issue login tokens.');
  const payload = Buffer.from(JSON.stringify({
    sub: user.email.toLowerCase(),
    phone: user.phone || '',
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function requireAuth(req, res, next) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  const secret = process.env.JWT_SECRET;
  if (!secret || !payload || !signature) return res.status(401).json({ ok: false, message: 'Sign in to access projects.' });

  const expected = createHmac('sha256', secret).update(payload).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return res.status(401).json({ ok: false, message: 'Your session is invalid. Please sign in again.' });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!user.sub || !user.role || user.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ ok: false, message: 'Your session has expired. Please sign in again.' });
    }
    req.auth = user;
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Your session is invalid. Please sign in again.' });
  }
}

function projectAccessFilter(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'client') {
    return {
      $expr: {
        $eq: [
          { $toLower: { $trim: { input: { $ifNull: ['$client.email', ''] } } } },
          user.sub,
        ],
      },
    };
  }
  if (user.role === 'team') {
    return {
      'payment.status': 'PAID',
      $or: [
        { 'clientResponse.type': 'ACCEPTED' },
        { 'negotiationResponse.type': 'ACCEPTED' },
      ],
    };
  }
  if (user.role === 'editor') return { 'editingWorkflow.assignedEditorEmail': user.sub };
  return null;
}

async function authorizeProjectAccess(req, res, next) {
  const user = req.auth;
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ ok: false, message: 'Project not found' });
  if (user.role === 'admin') return next();

  try {
    if (user.role === 'team' && req.method === 'POST' && req.path === '/team-interest') {
      const exists = await Project.exists({ _id: req.params.id });
      return exists
        ? next()
        : res.status(404).json({ ok: false, message: 'Project not found' });
    }

    const filter = projectAccessFilter(user);
    if (!filter) return res.status(403).json({ ok: false, message: 'This account cannot access projects.' });
    const project = await Project.findOne({ _id: req.params.id, ...filter }).select('_id');
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });

    if (user.role === 'client') {
      const allowedClientActions = [
        '/contract-details', '/contract-sign', '/accept-quote', '/reject-quote',
        '/accept-negotiation', '/reject-negotiation', '/pay-advance',
      ];
      if (req.method !== 'GET' && !allowedClientActions.includes(req.path)) {
        return res.status(403).json({ ok: false, message: 'Clients cannot perform this project action.' });
      }
    } else if (req.method !== 'GET') {
      return res.status(403).json({ ok: false, message: 'Only admins can perform this project action.' });
    }

    return next();
  } catch (error) {
    console.error('Project access check failed:', error.message);
    return res.status(500).json({ ok: false, message: 'Unable to verify project access.' });
  }
}

function normalizePhone(phone) {
  return String(phone ?? '').replace(/\D/g, '');
}

function isValidEventDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hasUploadSignature(bytes, mimeType) {
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (mimeType === 'application/pdf') return bytes.toString('ascii', 0, 5) === '%PDF-';
  return false;
}

const seedDefaultUsers = async () => {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const defaults = [
    { name: 'Admin Team', email: 'admin@ani.photography.com', password: adminPassword || 'admin123', role: 'admin', phone: '+91 8906349763' },
  ];

  for (const user of defaults) {
    const email = user.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await User.create({ ...user, email, password: await hashPassword(user.password) });
    } else if (user.role === 'admin' && adminPassword && !(await verifyPassword(adminPassword, existingUser.password))) {
      existingUser.password = await hashPassword(adminPassword);
      await existingUser.save();
    } else if (!existingUser.password.startsWith('scrypt$')) {
      existingUser.password = await hashPassword(existingUser.password);
      await existingUser.save();
    }
  }
};

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Backend is running
 */
app.get('/api/health', async (req, res) => {
  try {
    await connectMongo();
    return res.status(200).json({
      ok: true,
      api: 'running',
      database: 'connected',
      message: 'ShootAtSide backend and database are ready',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      ok: false,
      api: 'running',
      database: 'disconnected',
      message: 'Backend is running, but MongoDB is unavailable. Check MONGODB_URI and MongoDB network access.',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path.startsWith('/api-docs')) return next();

  try {
    await connectMongo();
    return next();
  } catch (error) {
    return res.status(503).json({
      ok: false,
      message: 'Database is unavailable. Check the MONGODB_URI deployment environment variable and MongoDB network access.',
    });
  }
});

app.use('/api/projects/:id', requireAuth, authorizeProjectAccess);

/**
 * @openapi
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */

function sendAuthResponse(res, role, payload) {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      ok: false,
      message: 'Authentication is not configured. Add JWT_SECRET in Vercel Project Settings → Environment Variables, then redeploy.',
    });
  }

  return res.json({
    ok: true,
    role,
    token: createAuthToken({ ...payload, role }),
    user: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      role,
    },
  });
}

app.post('/api/auth/admin/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ email, role: 'admin' });

  if (user && await verifyPassword(password, user.password)) {
    return sendAuthResponse(res, 'admin', {
      name: user.name,
      email: user.email,
      role: 'admin',
      phone: user.phone,
    });
  }

  return res.status(401).json({ ok: false, message: 'Invalid admin credentials' });
});

/**
 * @openapi
 * /api/auth/client/login:
 *   post:
 *     summary: Client login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone]
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful client login
 *       401:
 *         description: Invalid client credentials
 */
app.post('/api/auth/client/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const phone = normalizePhone(req.body?.phone);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || phone.length > 15) {
    return res.status(400).json({ ok: false, message: 'Enter a valid email address and a phone number containing 7–15 digits.' });
  }

  const [emailUser, clients] = await Promise.all([
    User.findOne({ email }).select('name email phone role'),
    User.find({ phone: { $exists: true, $ne: '' } }).select('name email phone role'),
  ]);
  const phoneMatches = clients.filter((client) => normalizePhone(client.phone) === phone);
  let user;

  if (emailUser) {
    if (emailUser.role !== 'client') {
      return res.status(409).json({ ok: false, message: 'This email is already used by another account type.' });
    }
    if (normalizePhone(emailUser.phone) !== phone) {
      return res.status(401).json({ ok: false, message: 'This email is registered, but the phone number does not match.' });
    }
    user = emailUser;
  } else {
    if (phoneMatches.length) {
      return res.status(409).json({ ok: false, message: 'This phone number is already registered. Sign in with its registered email or contact the studio.' });
    }
    user = await User.create({
      name: email.split('@')[0],
      email,
      phone,
      role: 'client',
    });
  }

  if (phoneMatches.length > 1) {
    return res.status(409).json({ ok: false, message: 'This phone number is linked to multiple client accounts. Please contact the studio.' });
  }

  return sendAuthResponse(res, 'client', {
    name: user.name,
    email: user.email,
    role: 'client',
    phone: user.phone,
  });
});

/**
 * @openapi
 * /api/auth/team/login:
 *   post:
 *     summary: Team login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful team login
 *       401:
 *         description: Invalid team credentials
 */

app.post('/api/auth/team/login', async (req, res) => {
  const username = String(req.body?.username ?? req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ role: 'team', $or: [{ username }, { email: username.toLowerCase() }] });

  if (user && await verifyPassword(password, user.password)) {
    return sendAuthResponse(res, 'team', {
      name: user.name,
      email: user.email,
      role: 'team',
      phone: user.phone,
    });
  }

  return res.status(401).json({ ok: false, message: 'Invalid team credentials' });
});

/**
 * @openapi
 * /api/auth/editor/login:
 *   post:
 *     summary: Editor login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful editor login
 *       401:
 *         description: Invalid editor credentials
 */

app.post('/api/auth/editor/login', async (req, res) => {
  const username = String(req.body?.username ?? req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ role: 'editor', $or: [{ username }, { email: username.toLowerCase() }] });

  if (user && await verifyPassword(password, user.password)) {
    return sendAuthResponse(res, 'editor', {
      name: user.name,
      email: user.email,
      role: 'editor',
      phone: user.phone,
    });
  }

  return res.status(401).json({ ok: false, message: 'Invalid editor credentials' });
});

/**
 * @openapi
 * /api/editor/applications:
 *   get:
 *     summary: Get all editor applications
 *     tags: [Editor]
 *     responses:
 *       200:
 *         description: Editor applications list
 */
app.get('/api/editor/applications', async (req, res) => {
  try {
    const applications = await EditorApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/editor/applications:
 *   post:
 *     summary: Submit an editor application
 *     tags: [Editor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Application created
 */
app.post('/api/editor/applications', async (req, res) => {
  try {
    const payload = req.body;
    const application = await EditorApplication.create({
      ...payload,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    res.status(201).json({ ok: true, application });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/editor/applications/{id}/approve:
 *   patch:
 *     summary: Approve an editor application
 *     tags: [Editor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application approved
 */
app.patch('/api/editor/applications/:id/approve', async (req, res) => {
  try {
    const application = await EditorApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ ok: false, message: 'Application not found' });
    }

    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '').trim();
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Username and password are required to approve an editor.' });
    }

    const conflictingUser = await User.findOne({ $or: [{ email: application.email.toLowerCase() }, { username }] });
    if (conflictingUser) {
      return res.status(409).json({ ok: false, message: 'An account already exists with this email or username.' });
    }

    await User.create({
      name: application.name,
      email: application.email.toLowerCase(),
      username,
      password: await hashPassword(password),
      phone: application.mobile,
      role: 'editor',
      editingRoles: application.editingRoles,
    });
    application.status = 'APPROVED';
    await application.save();

    res.json({ ok: true, application: application.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/editor/applications/{id}/reject:
 *   patch:
 *     summary: Reject an editor application
 *     tags: [Editor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application rejected
 */
app.patch('/api/editor/applications/:id/reject', async (req, res) => {
  try {
    const application = await EditorApplication.findByIdAndUpdate(req.params.id, { status: 'REJECTED' }, { new: true });

    if (!application) {
      return res.status(404).json({ ok: false, message: 'Application not found' });
    }

    res.json({ ok: true, application });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations:
 *   get:
 *     summary: Get all team registrations
 *     tags: [Team]
 *     responses:
 *       200:
 *         description: Team registrations list
 */
app.get('/api/team/registrations', async (req, res) => {
  try {
    const registrations = await TeamRegistration.find().sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations:
 *   post:
 *     summary: Submit a team registration
 *     tags: [Team]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Registration created
 */
app.post('/api/team/registrations', async (req, res) => {
  try {
    const payload = req.body;
    const requiredFields = ['name', 'mobile', 'whatsapp', 'email', 'address', 'phonePe', 'aadharFileName', 'aadharDataUrl', 'selfieFileName', 'selfieDataUrl'];
    if (requiredFields.some((field) => !String(payload?.[field] ?? '').trim()) || !Array.isArray(payload?.preferredRoles) || payload.preferredRoles.length === 0) {
      return res.status(400).json({ ok: false, message: 'Complete all registration fields, upload both files, and choose at least one role.' });
    }

    const aadharDataUrl = String(payload.aadharDataUrl);
    const selfieDataUrl = String(payload.selfieDataUrl);
    const validAadhar = /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(aadharDataUrl);
    const validSelfie = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(selfieDataUrl);
    if (!validAadhar || !validSelfie) {
      return res.status(400).json({ ok: false, message: 'Upload a PNG, JPEG, WebP, or PDF ID and a PNG, JPEG, or WebP selfie.' });
    }
    const aadharBytes = Buffer.from(validAadhar[3], 'base64');
    const selfieBytes = Buffer.from(validSelfie[2], 'base64');
    if (aadharBytes.length === 0 || selfieBytes.length === 0) {
      return res.status(400).json({ ok: false, message: 'ID document and selfie files cannot be empty.' });
    }
    if (aadharBytes.length > 2 * 1024 * 1024 || selfieBytes.length > 2 * 1024 * 1024) {
      return res.status(400).json({ ok: false, message: 'Each upload must be 2 MB or smaller.' });
    }
    if (!hasUploadSignature(aadharBytes, validAadhar[1].toLowerCase()) || !hasUploadSignature(selfieBytes, `image/${validSelfie[1].toLowerCase()}`)) {
      return res.status(400).json({ ok: false, message: 'The selected file contents do not match the supported ID or selfie format.' });
    }

    const duplicate = await TeamRegistration.findOne({ email: String(payload.email).trim().toLowerCase(), status: { $ne: 'REJECTED' } });
    if (duplicate) return res.status(409).json({ ok: false, message: 'A team registration already exists for this email.' });

    const registration = await TeamRegistration.create({
      name: String(payload.name).trim(),
      mobile: String(payload.mobile).trim(),
      whatsapp: String(payload.whatsapp).trim(),
      email: String(payload.email).trim().toLowerCase(),
      address: String(payload.address).trim(),
      phonePe: String(payload.phonePe).trim(),
      aadharFileName: String(payload.aadharFileName).trim(),
      aadharDataUrl,
      selfieFileName: String(payload.selfieFileName).trim(),
      selfieDataUrl,
      preferredRoles: payload.preferredRoles.map((role) => String(role)),
      status: 'PENDING',
      submittedAt: new Date(),
    });

    res.status(201).json({ ok: true, registration });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations/{id}/uploads:
 *   patch:
 *     summary: Add or replace Base64 ID and selfie uploads for a team registration
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aadharFileName: { type: string }
 *               aadharDataUrl: { type: string }
 *               selfieFileName: { type: string }
 *               selfieDataUrl: { type: string }
 *     responses:
 *       200: { description: Registration uploads updated }
 *       400: { description: Invalid upload }
 *       404: { description: Registration not found }
 */
app.patch('/api/team/registrations/:id/uploads', async (req, res) => {
  try {
    const registration = await TeamRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ ok: false, message: 'Registration not found' });

    const uploadPairs = [
      ['aadharDataUrl', 'aadharFileName', /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/i, 3],
      ['selfieDataUrl', 'selfieFileName', /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i, 2],
    ];
    let hasUpload = false;

    for (const [dataField, nameField, pattern, base64Group] of uploadPairs) {
      if (req.body?.[dataField] === undefined) continue;
      hasUpload = true;
      const dataUrl = String(req.body[dataField]);
      const fileName = String(req.body?.[nameField] ?? '').trim();
      const match = dataUrl.match(pattern);
      if (!match || !fileName) return res.status(400).json({ ok: false, message: `A valid ${nameField === 'aadharFileName' ? 'ID' : 'selfie'} file is required.` });
      const bytes = Buffer.from(match[base64Group], 'base64');
      if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) {
        return res.status(400).json({ ok: false, message: 'Each uploaded file must be 2 MB or smaller.' });
      }
      const declaredMime = String(match[0].slice(5, match[0].indexOf(';')).toLowerCase());
      if (!hasUploadSignature(bytes, declaredMime)) {
        return res.status(400).json({ ok: false, message: 'The selected file contents do not match the supported upload format.' });
      }
      registration.set(dataField, dataUrl);
      registration.set(nameField, fileName);
    }

    if (!hasUpload) return res.status(400).json({ ok: false, message: 'Select at least one image to upload.' });
    await registration.save();
    res.json({ ok: true, registration: registration.toJSON() });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations/{id}/approve:
 *   patch:
 *     summary: Approve a team registration
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration approved
 */
app.patch('/api/team/registrations/:id/approve', async (req, res) => {
  try {
    const registration = await TeamRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ ok: false, message: 'Registration not found' });
    }

    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '').trim();
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Username and password are required to approve a team member.' });
    }

    const email = registration.email.toLowerCase();
    const existingTeamUser = await User.findOne({ email, role: 'team' });
    const conflictingUser = await User.findOne({ username });
    if (conflictingUser && String(conflictingUser._id) !== String(existingTeamUser?._id)) {
      return res.status(409).json({ ok: false, message: 'An account already exists with this email or username.' });
    }

    if (existingTeamUser) {
      existingTeamUser.name = registration.name;
      existingTeamUser.username = username;
      existingTeamUser.password = await hashPassword(password);
      existingTeamUser.phone = registration.mobile;
      await existingTeamUser.save();
    } else {
      const emailUser = await User.findOne({ email });
      if (emailUser) return res.status(409).json({ ok: false, message: 'An account already exists with this email.' });
      await User.create({
        name: registration.name,
        email,
        username,
        password: await hashPassword(password),
        phone: registration.mobile,
        role: 'team',
      });
    }
    registration.username = username;
    registration.password = undefined;
    registration.status = 'ACCEPTED';
    await registration.save();

    res.json({ ok: true, registration: registration.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations/{id}/credentials:
 *   patch:
 *     summary: Update credentials for an accepted team registration
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Credentials updated }
 *       404: { description: Registration or account not found }
 */
app.patch('/api/team/registrations/:id/credentials', async (req, res) => {
  try {
    const registration = await TeamRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ ok: false, message: 'Registration not found' });
    if (registration.status !== 'ACCEPTED') {
      return res.status(400).json({ ok: false, message: 'Approve the registration before updating its credentials.' });
    }

    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '').trim();
    if (!username || !password) return res.status(400).json({ ok: false, message: 'Username and new password are required.' });

    const user = await User.findOne({ email: registration.email.toLowerCase(), role: 'team' });
    if (!user) return res.status(404).json({ ok: false, message: 'Team login account not found.' });
    const conflictingUser = await User.findOne({ username });
    if (conflictingUser && String(conflictingUser._id) !== String(user._id)) {
      return res.status(409).json({ ok: false, message: 'That username is already assigned to another account.' });
    }

    user.username = username;
    user.password = await hashPassword(password);
    await user.save();
    registration.username = username;
    await registration.save();
    res.json({ ok: true, registration: registration.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/team/registrations/{id}/reject:
 *   patch:
 *     summary: Reject a team registration
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration rejected
 */
app.patch('/api/team/registrations/:id/reject', async (req, res) => {
  try {
    const registration = await TeamRegistration.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ ok: false, message: 'Registration not found' });
    }

    res.json({ ok: true, registration });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Projects list
 */
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const accessFilter = projectAccessFilter(req.auth);
    if (!accessFilter) return res.status(403).json({ ok: false, message: 'This account cannot access projects.' });
    const projects = await Project.find(accessFilter).sort({ createdAt: -1 });
    res.json(projects.map((project) => project.toJSON()));
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a new project request
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Project created successfully
 */
app.post('/api/projects', async (req, res) => {
  try {
    const { client, eventType, eventDate, venue, budget, requirements } = req.body || {};

    const email = String(client?.email ?? '').trim().toLowerCase();
    const phone = String(client?.phone ?? '').trim();
    const normalizedPhone = normalizePhone(phone);
    if (!client || !eventType || !String(client.name ?? '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || normalizedPhone.length < 7 || normalizedPhone.length > 15 || !isValidEventDate(eventDate)) {
      return res.status(400).json({ ok: false, message: 'Valid client name, email, phone, event type, and event date are required.' });
    }

    const existingClient = await User.findOne({ email });
    if (existingClient && (existingClient.role !== 'client' || normalizePhone(existingClient.phone) !== normalizedPhone)) {
      return res.status(409).json({ ok: false, message: 'This email is already registered with different account details. Contact the studio before submitting another request.' });
    }
    const phoneOwners = await User.find({ phone: { $exists: true, $ne: '' } }).select('email phone');
    if (phoneOwners.some((owner) => normalizePhone(owner.phone) === normalizedPhone && owner.email !== email)) {
      return res.status(409).json({ ok: false, message: 'This phone number is already registered to another account.' });
    }
    if (!existingClient) {
      await User.create({
        name: String(client.name).trim(),
        email,
        phone,
        role: 'client',
      });
    }

    const project = await Project.create({
      client: { ...client, email, phone },
      eventType,
      eventDate,
      venue,
      budget: String(budget ?? '').trim(),
      requirements,
      teamInterest: [],
      eventTeam: [],
    });

    res.status(201).json({ ok: true, project: project.toJSON(), projectId: String(project._id) });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project object
 */
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const accessFilter = projectAccessFilter(req.auth);
    if (!accessFilter) return res.status(403).json({ ok: false, message: 'This account cannot access projects.' });
    const project = await Project.findOne({ _id: req.params.id, ...accessFilter });

    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    res.json(project.toJSON());
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/quote:
 *   patch:
 *     summary: Send a quote for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote sent
 */
app.patch('/api/projects/:id/quote', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    const amount = Number(req.body?.amount);
    const advancePercent = Number(req.body?.advancePercent ?? 30);
    const comment = String(req.body?.comment ?? '').trim();
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(advancePercent) || advancePercent < 0 || advancePercent > 100 || !comment) {
      return res.status(400).json({ ok: false, message: 'A positive quote amount, a comment, and an advance percentage from 0 to 100 are required.' });
    }

    project.initialQuote = {
      amount,
      comment,
      sentAt: new Date().toISOString(),
      advancePercent,
    };
    project.payment = {
      advancePercent,
      amount: Math.round((amount * advancePercent) / 100),
      status: 'PENDING',
    };
    project.clientResponse = undefined;
    project.negotiation = undefined;
    project.negotiationResponse = undefined;
    project.contract = undefined;

    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/negotiation:
 *   patch:
 *     summary: Send a negotiation offer for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negotiation sent
 */
app.patch('/api/projects/:id/negotiation', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.negotiation = {
      amount: req.body.amount,
      comment: req.body.comment || '',
      sentAt: new Date().toISOString(),
      advancePercent: req.body.advancePercent,
    };
    project.negotiationResponse = undefined;
    project.contract = undefined;

    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/accept-request:
 *   patch:
 *     summary: Accept a client project request and enable the contract form
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request accepted
 *       404:
 *         description: Project not found
 */
app.patch('/api/projects/:id/accept-request', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });

    project.requestAcceptedAt = project.requestAcceptedAt || new Date();
    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/contract-details:
 *   patch:
 *     summary: Submit client contract contact details
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, email, preferredContact, bestTimeToContact]
 *             properties:
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *               preferredContact: { type: string, enum: [PHONE, EMAIL, WHATSAPP] }
 *               bestTimeToContact: { type: string }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Contract details saved
 *       400:
 *         description: Request has not been accepted or details are invalid
 *       404:
 *         description: Project not found
 */
app.patch('/api/projects/:id/contract-details', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });
    if (!project.requestAcceptedAt) {
      return res.status(400).json({ ok: false, message: 'The project request must be accepted before submitting contract details.' });
    }

    const phone = String(req.body?.phone ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const preferredContact = String(req.body?.preferredContact ?? '').trim().toUpperCase();
    const bestTimeToContact = String(req.body?.bestTimeToContact ?? '').trim();
    const message = String(req.body?.message ?? '').trim();
    if (!phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['PHONE', 'EMAIL', 'WHATSAPP'].includes(preferredContact) || !bestTimeToContact) {
      return res.status(400).json({ ok: false, message: 'Valid phone, email, contact preference, and best time are required.' });
    }

    project.clientContactDetails = {
      phone,
      email,
      preferredContact,
      bestTimeToContact,
      ...(message ? { message } : {}),
      submittedAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

app.patch('/api/projects/:id/contract-sign', async (req, res) => {
  try {
    if (!['admin', 'client'].includes(req.auth?.role)) {
      return res.status(403).json({ ok: false, message: 'Only the client and admin may sign this contract.' });
    }
    const signature = String(req.body?.signature ?? '').trim();
    if (signature.length < 2 || signature.length > 100) {
      return res.status(400).json({ ok: false, message: 'Enter a signature name between 2 and 100 characters.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });
    if (project.clientResponse?.type !== 'ACCEPTED' && project.negotiationResponse?.type !== 'ACCEPTED') {
      return res.status(400).json({ ok: false, message: 'Accept the quote or negotiation before signing the contract.' });
    }

    const signedAt = new Date().toISOString();
    project.contract = {
      ...(project.contract || {}),
      ...(req.auth.role === 'admin'
        ? { adminSignature: signature, adminSignedAt: signedAt }
        : { clientSignature: signature, clientSignedAt: signedAt }),
    };
    await project.save();
    return res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/accept-quote:
 *   patch:
 *     summary: Accept a quote
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote accepted
 */
app.patch('/api/projects/:id/accept-quote', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.clientResponse = {
      type: 'ACCEPTED',
      comment: req.body.comment || '',
      respondedAt: new Date().toISOString(),
    };
    project.requestAcceptedAt = new Date();
    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/accept-negotiation:
 *   patch:
 *     summary: Accept a negotiation offer
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negotiation accepted
 */
app.patch('/api/projects/:id/accept-negotiation', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.negotiationResponse = {
      type: 'ACCEPTED',
      comment: req.body.comment || '',
      respondedAt: new Date().toISOString(),
    };
    project.requestAcceptedAt = new Date();
    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/reject-quote:
 *   patch:
 *     summary: Reject a quote
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote rejected
 */
app.patch('/api/projects/:id/reject-quote', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.clientResponse = {
      type: 'REJECTED',
      comment: req.body.comment || '',
      respondedAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/reject-negotiation:
 *   patch:
 *     summary: Reject a negotiation offer
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negotiation rejected
 */
app.patch('/api/projects/:id/reject-negotiation', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.negotiationResponse = {
      type: 'REJECTED',
      comment: req.body.comment || '',
      respondedAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/pay-advance:
 *   patch:
 *     summary: Mark advance payment as paid
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [screenshotDataUrl, screenshotFileName]
 *             properties:
 *               screenshotDataUrl: { type: string, description: Base64 image data URL }
 *               screenshotFileName: { type: string }
 *     responses:
 *       200:
 *         description: Payment proof submitted for admin review
 */
app.patch('/api/projects/:id/pay-advance', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    if (project.clientResponse?.type !== 'ACCEPTED' && project.negotiationResponse?.type !== 'ACCEPTED') {
      return res.status(400).json({ ok: false, message: 'Accept the quote or negotiation before submitting payment proof.' });
    }
    if (!project.contract?.adminSignedAt || !project.contract?.clientSignedAt) {
      return res.status(400).json({ ok: false, message: 'Both the client and admin must sign the contract before payment.' });
    }

    const screenshotDataUrl = String(req.body?.screenshotDataUrl ?? '');
    const screenshotFileName = String(req.body?.screenshotFileName ?? '').trim();
    const imageMatch = screenshotDataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!imageMatch || !screenshotFileName) {
      return res.status(400).json({ ok: false, message: 'Upload a PNG, JPEG, or WebP payment screenshot.' });
    }

    const imageBytes = Buffer.from(imageMatch[2], 'base64');
    if (imageBytes.length === 0 || imageBytes.length > 5 * 1024 * 1024) {
      return res.status(400).json({ ok: false, message: 'Payment screenshot must be smaller than 5 MB.' });
    }

    if (project.payment?.status === 'PAID') {
      return res.status(409).json({ ok: false, message: 'This advance payment has already been verified.' });
    }

    project.payment = {
      ...project.payment,
      advancePercent: project.payment?.advancePercent ?? project.negotiation?.advancePercent ?? project.initialQuote?.advancePercent ?? 30,
      amount: project.payment?.amount ?? 0,
      status: 'PROOF_SUBMITTED',
      screenshotDataUrl,
      screenshotFileName,
      proofSubmittedAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/verify-payment:
 *   patch:
 *     summary: Verify submitted advance payment proof
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advance payment verified
 *       400:
 *         description: Payment proof has not been submitted
 *       404:
 *         description: Project not found
 */
app.patch('/api/projects/:id/verify-payment', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });
    if (project.payment?.status !== 'PROOF_SUBMITTED' || !project.payment?.screenshotDataUrl) {
      return res.status(400).json({ ok: false, message: 'There is no payment proof awaiting verification.' });
    }

    const verifiedAt = new Date().toISOString();
    project.payment = {
      ...project.payment,
      status: 'PAID',
      paidAt: verifiedAt,
      verifiedAt,
    };
    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/team-interest:
 *   post:
 *     summary: Submit team interest for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Team interest created
 */
app.post('/api/projects/:id/team-interest', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    if (req.auth?.role !== 'team') return res.status(403).json({ ok: false, message: 'An approved team account is required.' });
    if (project.payment?.status !== 'PAID' || (project.clientResponse?.type !== 'ACCEPTED' && project.negotiationResponse?.type !== 'ACCEPTED')) {
      return res.status(400).json({ ok: false, message: 'Interest is available only for confirmed events.' });
    }

    const memberEmail = req.auth.sub;
    const memberUser = await User.findOne({ email: memberEmail, role: 'team' }).select('name');
    if (!memberUser) return res.status(403).json({ ok: false, message: 'An approved team account is required.' });

    const conflictingEvent = await Project.exists({
      _id: { $ne: project._id },
      eventDate: project.eventDate,
      $or: [
        { teamInterest: { $elemMatch: { memberEmail, status: { $in: ['PENDING', 'ACCEPTED'] } } } },
        { eventTeam: { $elemMatch: { memberEmail } } },
      ],
    });
    if (conflictingEvent) return res.status(409).json({ ok: false, message: 'You can request or accept only one event on this date.' });

    const existingInterest = (project.teamInterest || []).find((item) => String(item.memberEmail).toLowerCase() === memberEmail);
    if (existingInterest?.status === 'PENDING' || existingInterest?.status === 'ACCEPTED') {
      return res.status(409).json({ ok: false, message: 'You already have an active interest request for this event.' });
    }

    const interest = {
      member: memberUser.name,
      memberEmail,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    project.teamInterest = existingInterest
      ? project.teamInterest.map((item) => String(item.memberEmail).toLowerCase() === memberEmail ? interest : item)
      : [...(project.teamInterest || []), interest];
    await project.save();
    res.status(201).json({ ok: true, project: project.toJSON(), interest });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/team-interest/{email}/approve:
 *   patch:
 *     summary: Approve a team member's interest request
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: email
 *         required: true
 *         schema: { type: string, format: email }
 *     responses:
 *       200: { description: Interest approved }
 *       404: { description: Project or interest not found }
 */
app.patch('/api/projects/:id/team-interest/:email/approve', async (req, res) => {
  return updateTeamInterestStatus(req, res, 'ACCEPTED');
});

/**
 * @openapi
 * /api/projects/{id}/team-interest/{email}/reject:
 *   patch:
 *     summary: Reject a team member's interest request
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: email
 *         required: true
 *         schema: { type: string, format: email }
 *     responses:
 *       200: { description: Interest rejected }
 *       404: { description: Project or interest not found }
 */
app.patch('/api/projects/:id/team-interest/:email/reject', async (req, res) => {
  return updateTeamInterestStatus(req, res, 'REJECTED');
});

async function updateTeamInterestStatus(req, res, status) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ ok: false, message: 'Project not found' });

    const memberEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
    const interest = (project.teamInterest || []).find((item) => String(item.memberEmail).toLowerCase() === memberEmail);
    if (!interest) return res.status(404).json({ ok: false, message: 'Team interest request not found' });
    if (interest.status !== 'PENDING') {
      return res.status(409).json({ ok: false, message: 'This interest request has already been reviewed.' });
    }

    project.teamInterest = project.teamInterest.map((item) => {
      if (String(item.memberEmail).toLowerCase() !== memberEmail) return item;
      const currentInterest = typeof item.toObject === 'function' ? item.toObject() : item;
      return { ...currentInterest, status };
    });
    await project.save();
    res.json({ ok: true, project: project.toJSON() });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
}

/**
 * @openapi
 * /api/projects/{id}/assign-team:
 *   patch:
 *     summary: Assign a team to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team assigned
 */
app.patch('/api/projects/:id/assign-team', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.teamAssignment = {
      ...req.body,
      assignedAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/projects/{id}/assign-editor:
 *   patch:
 *     summary: Assign an editor to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Editor assigned
 */
app.patch('/api/projects/:id/assign-editor', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.editingWorkflow = {
      ...(project.editingWorkflow || {}),
      assignedEditorEmail: req.body.editorEmail,
      milestones: req.body.milestones || [],
      stageProgress: req.body.stageProgress || {},
      adminTimeline: req.body.adminTimeline || '',
      timelineDueDate: req.body.timelineDueDate || '',
      sourceDriveUrl: req.body.sourceDriveUrl || '',
    };

    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [projectCount, pendingApplications, pendingRegistrations] = await Promise.all([
      Project.countDocuments(),
      EditorApplication.countDocuments({ status: 'PENDING' }),
      TeamRegistration.countDocuments({ status: 'PENDING' }),
    ]);

    res.json({
      ok: true,
      stats: {
        totalInquiries: projectCount,
        upcomingEvents: projectCount,
        activeBookings: 0,
        pendingWorkflows: pendingApplications + pendingRegistrations,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * @openapi
 * /api/dev/seed:
 *   post:
 *     summary: Seed demo project data
 *     tags: [Dev]
 *     responses:
 *       200:
 *         description: Seed data created
 */
app.post('/api/dev/seed', async (req, res) => {
  try {
    const sampleProjects = [
      {
        client: { id: 'C-1001', name: 'Aisha & Rahul', email: 'aisha@example.com', phone: '+91 98765 43210' },
        eventType: 'Wedding Photography',
        eventDate: '2026-12-15',
        venue: 'Jaipur Palace',
        requirements: 'Full wedding coverage with candid reels and edited album.',
      },
      {
        client: { id: 'C-1002', name: 'Karan Mehta', email: 'karan@example.com', phone: '+91 98765 11100' },
        eventType: 'Corporate Event',
        eventDate: '2026-11-20',
        venue: 'Bengaluru Convention Center',
        requirements: 'Event coverage and teaser video for CEO launch.',
      },
    ];

    await Project.deleteMany({});
    const created = await Project.insertMany(sampleProjects);

    res.json({ ok: true, message: 'Seed data inserted', projects: created });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

let mongoConnectionPromise;

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI)
      .then(async () => {
        console.log('MongoDB connected');
        await seedDefaultUsers();
        console.log('Seeded default auth users');
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        console.error('MongoDB connection failed:', error.message);
        throw error;
      });
  }

  await mongoConnectionPromise;
};

if (require.main === module) {
  connectMongo();
  app.listen(PORT, () => {
    console.log(`ShootAtSide backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
