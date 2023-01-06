import express from 'express';
import cors from 'cors';
import Mixpanel from 'mixpanel';
import swStats from 'swagger-stats';
import dotenv from 'dotenv';
import config from 'config';
import { fileURLToPath } from 'url';
import path from 'path';
import kamyroll from './kamyroll.js';
import pm2 from 'pm2';
import { createLogger, format, transports } from 'winston';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.static(path.join(__dirname, 'vue', 'dist')));

// swagger-stats middleware
app.use(swStats.getMiddleware({
    name: 'pw.ers.kamyroll',
    version: config.get('app.version'),
    authentication: true,
    onAuthenticate: (req, username, password) => {
        return config.get('auth.username') === username && config.get('auth.password') === password;
    }
}));

// Initialize Mixpanel
let mixpanel = null;
if (config.has('mixpanel.key')) {
    mixpanel = Mixpanel.init(config.get('mixpanel.key'));
}

// Set up logging
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'pw.ers.kamyroll' },
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple()
    }));
}

app.use((req, res, next) => {
    req.logger = logger;
    next();
});

// Define routes
app.get('/manifest.json', function(req, res) {
    res.setHeader('content-type', 'application/json');

    mixpanel && mixpanel.track('install', {
        ip: req.ip,
        distinct_id: req.ip.replace(/\.|:/g, 'Z'),
    });

    res.send({
        id: 'pw.ers.kamyroll',
        logo: 'https://play-lh.googleusercontent.com/CjzbMcLbmTswzCGauGQExkFsSHvwjKEeWLbVVJx0B-J9G6OQ-UCl
