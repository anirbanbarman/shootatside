const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('crypto');
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
  apis: ['./src/server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors({ origin: true, credentials: true }));
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
    selfieFileName: String,
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
    requirements: String,
    requestAcceptedAt: Date,
    clientContactDetails: Object,
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
    password: { type: String, required: true },
    phone: String,
    role: {
      type: String,
      enum: ['admin', 'client', 'team', 'editor'],
      default: 'admin',
    },
  },
  { timestamps: true }
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

const seedDefaultUsers = async () => {
  const defaults = [
    { name: 'Admin Team', email: 'admin@ani.photography.com', password: 'admin123', role: 'admin', phone: '+91 90000 00000' },
    { name: 'Client Team', email: 'client@ani.photography.com', password: 'client123', role: 'client', phone: '+91 90000 11111' },
    { name: 'Team Member', email: 'team@ani.photography.com', password: 'team123', role: 'team', phone: '+91 90000 22222' },
    { name: 'Editor Team', email: 'editor@ani.photography.com', password: 'editor123', role: 'editor', phone: '+91 90000 33333' },
  ];

  for (const user of defaults) {
    const email = user.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await User.create({ ...user, email, password: await hashPassword(user.password) });
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
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'ShootAtSide backend is running', timestamp: new Date().toISOString() });
});

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
  return res.json({
    ok: true,
    role,
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
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful client login
 *       401:
 *         description: Invalid client credentials
 */
app.post('/api/auth/client/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ email, role: 'client' });

  if (user && await verifyPassword(password, user.password)) {
    return sendAuthResponse(res, 'client', {
      name: user.name,
      email: user.email,
      role: 'client',
      phone: user.phone,
    });
  }

  return res.status(401).json({ ok: false, message: 'Invalid client credentials' });
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
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ email, role: 'team' });

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
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  const user = await User.findOne({ email, role: 'editor' });

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
    const application = await EditorApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED' },
      { new: true }
    );

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
    const application = await EditorApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true }
    );

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
    const registration = await TeamRegistration.create({
      ...payload,
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
    const registration = await TeamRegistration.findByIdAndUpdate(
      req.params.id,
      { status: 'ACCEPTED' },
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
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
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
    const { client, eventType, eventDate, venue, requirements } = req.body || {};

    if (!client || !eventType) {
      return res.status(400).json({ ok: false, message: 'Client and eventType are required' });
    }

    const project = await Project.create({
      client,
      eventType,
      eventDate,
      venue,
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
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

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

    await project.save();
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
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
 *     responses:
 *       200:
 *         description: Advance payment recorded
 */
app.patch('/api/projects/:id/pay-advance', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ ok: false, message: 'Project not found' });
    }

    project.payment = {
      advancePercent: req.body.advancePercent || 50,
      amount: req.body.amount || 0,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    };
    await project.save();
    res.json({ ok: true, project });
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

    const interest = {
      member: req.body.member,
      memberEmail: req.body.memberEmail,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    project.teamInterest = [...(project.teamInterest || []), interest];
    await project.save();
    res.status(201).json({ ok: true, project, interest });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

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

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    await seedDefaultUsers();
    console.log('Seeded default auth users');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  connectMongo();
  app.listen(PORT, () => {
    console.log(`ShootAtSide backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
