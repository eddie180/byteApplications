// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch').default;
const session = require('express-session');
const mongoose = require('mongoose'); // Import Mongoose

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Discord OAuth2 configuration
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/auth/discord/callback`;

const DISCORD_ACCEPTED_WEBHOOK_URL = process.env.DISCORD_ACCEPTED_WEBHOOK_URL;
const DISCORD_DENIED_WEBHOOK_URL = process.env.DISCORD_DENIED_WEBHOOK_URL;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in .env file. Please provide your MongoDB connection string.');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });



if (typeof fetch !== 'function') {
    console.error('ERROR: node-fetch did not provide a function for `fetch`. Please ensure `node-fetch` is installed correctly by running: npm install node-fetch');
    process.exit(1);
} else {
    console.log('node-fetch (fetch function) loaded successfully.');
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, 
        secure: false, 
        sameSite: 'lax' 
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));



const applicationSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String },
    applicationType: { type: String, required: true },
    answers: { type: Map, of: String, required: true }, 
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    timestamp: { type: Date, default: Date.now },
    reviewedByDiscordId: { type: String },
    reviewedByUsername: { type: String },
    reviewTimestamp: { type: Date },
    reviewReason: { type: String } 
});
const Application = mongoose.model('Application', applicationSchema);

const adminSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    addedByDiscordId: { type: String }, 
    addedByUsername: { type: String },
    timestamp: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', adminSchema);

const blacklistedUserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    reason: { type: String }, 
    blacklistedByDiscordId: { type: String }, 
    blacklistedByUsername: { type: String },
    timestamp: { type: Date, default: Date.now }
});
const BlacklistedUser = mongoose.model('BlacklistedUser', blacklistedUserSchema);



const applicationTypes = {
    'general': {
        name: 'General Application',
        questions: [
            { id: 'experience', type: 'textarea', label: 'Describe your relevant experience:' },
            { id: 'why_us', type: 'textarea', label: 'Why do you want to join us?' }
        ]
    },
    
};


app.get('/auth/discord', (req, res) => {
    const scopes = 'identify';
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes}`);
});

app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        console.error('No code provided in Discord callback.');
        return res.status(400).send('Discord authentication failed: No code provided.');
    }

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code',
                code: code, redirect_uri: REDIRECT_URI, scope: 'identify',
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Failed to exchange code for token:', errorText);
            return res.status(500).send('Failed to authenticate with Discord.');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('Failed to fetch user info:', errorText);
            return res.status(500).send('Failed to retrieve user information from Discord.');
        }

        const userData = await userResponse.json();
        const discordId = userData.id;
        const username = userData.username;
        const avatar = userData.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${userData.avatar}.png` : null;

        req.session.userId = discordId;
        req.session.username = username;
        req.session.avatar = avatar;

        const adminUser = await Admin.findOne({ discordId: discordId });
        req.session.isAdmin = !!adminUser; 

        console.log(`User ${username} (${discordId}) logged in. Admin: ${req.session.isAdmin}`);
        console.log('Session after login:', req.session);

        res.redirect(`/apply.html`);

    } catch (error) {
        console.error('Error during Discord OAuth callback:', error);
        res.status(500).send('An internal server error occurred during Discord authentication.');
    }
});

app.get('/auth/logout', (req, res) => {
    console.log('Attempting to log out user:', req.session.username || req.session.userId);
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

function isAuthenticated(req, res, next) {
    console.log('isAuthenticated middleware - Session:', req.session);
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized: Please log in.' });
    }
}

async function isAdmin(req, res, next) {
    console.log('isAdmin middleware - Session:', req.session);
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Please log in.' });
    }
    try {
        const adminUser = await Admin.findOne({ discordId: req.session.userId });
        if (adminUser) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ success: false, message: 'Server error during admin check.' });
    }
}

app.get('/api/session', isAuthenticated, (req, res) => {
    console.log('GET /api/session - Session:', req.session);
    res.json({
        success: true,
        user: {
            id: req.session.userId,
            username: req.session.username,
            avatar: req.session.avatar,
            isAdmin: req.session.isAdmin
        }
    });
});

app.get('/api/application-types', (req, res) => {
    res.json(applicationTypes);
});

app.post('/api/apply', isAuthenticated, async (req, res) => {
    const { applicationType, answers } = req.body;
    const userId = req.session.userId;
    const username = req.session.username;
    const avatar = req.session.avatar;

    if (!applicationType || !answers) {
        return res.status(400).json({ success: false, message: 'Missing application type or answers.' });
    }

    if (!applicationTypes[applicationType]) {
        return res.status(400).json({ success: false, message: 'Invalid application type.' });
    }

    try {
        const blacklistedUser = await BlacklistedUser.findOne({ discordId: userId });
        if (blacklistedUser) {
            console.log(`User ${userId} (${username}) is blacklisted and attempted to submit an application.`);
            return res.status(403).json({
                success: false,
                message: `You are currently blacklisted from submitting applications. Reason: ${blacklistedUser.reason || 'No reason provided.'}`
            });
        }

        const existingPendingApplication = await Application.findOne({
            discordId: userId,
            status: 'pending'
        });

        if (existingPendingApplication) {
            console.log(`User ${userId} attempted to submit a new application but already has a pending one.`);
            return res.status(409).json({
                success: false,
                message: 'You already have a pending application. Please wait for it to be reviewed before submitting another.'
            });
        }

        const newApplication = new Application({
            discordId: userId,
            username: username,
            avatar: avatar,
            applicationType: applicationType,
            answers: answers,
            status: 'pending',
            timestamp: new Date()
        });

        await newApplication.save(); 

        console.log('New application received and saved:', newApplication);
        res.json({ success: true, message: 'Application submitted successfully!', application: newApplication });
    } catch (error) {
        console.error('Error saving application to DB:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application due to a database error.' });
    }
});

app.get('/api/my-applications', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    try {
        const myApplications = await Application.find({ discordId: userId }).sort({ timestamp: -1 }); 
        res.json({ success: true, applications: myApplications });
    } catch (error) {
        console.error(`Error fetching applications for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve your applications due to a database error.' });
    }
});


app.get('/api/applications', isAdmin, async (req, res) => {
    // console.log('GET /api/applications - Session:', req.session);
    try {
        const allApplications = await Application.find({ status: 'pending' });
        res.json({ success: true, applications: allApplications });
    } catch (error) {
        console.error('Error fetching applications from DB:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve applications due to a database error.' });
    }
});

app.get('/api/applications/:id', isAdmin, async (req, res) => {
    const applicationId = req.params.id;
    console.log(`Server received request to fetch application with ID: ${applicationId}`);
    try {
        const application = await Application.findById(applicationId); 
        console.log(`Result of findById(${applicationId}):`, application);

        if (!application) {
            console.log(`Application ${applicationId} not found in DB.`);
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }
        res.json({ success: true, application: application });
    } catch (error) {
        console.error(`Error fetching application ${applicationId} from DB:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
        }
        res.status(500).json({ success: false, message: 'Failed to retrieve application due to a database error.' });
    }
});


app.post('/api/applications/:id/status', isAdmin, async (req, res) => {
    const applicationId = req.params.id;
    const { status, reviewReason } = req.body; 
    const reviewedByDiscordId = req.session.userId;
    const reviewedByUsername = req.session.username;

    console.log(`Server received request to update application ${applicationId} status to: ${status} by ${reviewedByUsername} (${reviewedByDiscordId}) with reason: ${reviewReason}`);

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided. Must be "accepted" or "rejected".' });
    }

    try {
        const updatedApplication = await Application.findByIdAndUpdate(
            applicationId,
            {
                status: status,
                reviewedByDiscordId: reviewedByDiscordId,
                reviewedByUsername: reviewedByUsername,
                reviewTimestamp: new Date(),
                reviewReason: reviewReason || null 
            },
            { new: true }
        );

        console.log(`Result of findByIdAndUpdate(${applicationId}, {status: ${status}}):`, updatedApplication);

        if (!updatedApplication) {
            console.log(`Application ${applicationId} not found for status update.`);
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        console.log(`Application ${applicationId} status updated to: ${status}`);

        let webhookUrl;
        let webhookUsername;
        let webhookAvatarUrl;
        let webhookColor;

        if (status === 'accepted') {
            webhookUrl = DISCORD_ACCEPTED_WEBHOOK_URL;
            webhookUsername = 'Accepted';
            webhookAvatarUrl = 'https://cdn.discordapp.com/attachments/1390753676603429014/1395581431903817890/byte2.png?ex=687af7fe&is=6879a67e&hm=3f8cbbd52774a0236ed914bb8e66ed18885978dd9831be26d4fef45a1b4004a6&';
            webhookColor = 0x10B981;
        } else {
            webhookUrl = DISCORD_DENIED_WEBHOOK_URL;
            webhookUsername = 'Denied';
            webhookAvatarUrl = 'https://cdn.discordapp.com/attachments/1390753676603429014/1395581431903817890/byte2.png?ex=687af7fe&is=6879a67e&hm=3f8cbbd52774a0236ed914bb8e66ed18885978dd9831be26d4fef45a1b4004a6&';
            webhookColor = 0xEF4444;
        }

        const webhookMessage = {
            username: webhookUsername,
            avatar_url: webhookAvatarUrl,
            embeds: [{
                title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}!`,
                description: `**Applicant:** ${updatedApplication.username}\n**Application Type:** ${updatedApplication.applicationType.charAt(0).toUpperCase() + updatedApplication.applicationType.slice(1)}\n**Status:** ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                color: webhookColor,
                fields: [
                    { name: 'Discord ID', value: updatedApplication.discordId, inline: true },
                    { name: 'Application ID', value: updatedApplication._id.toString(), inline: true },
                    { name: 'Reviewed By', value: `${updatedApplication.reviewedByUsername} (${updatedApplication.reviewedByDiscordId})`, inline: true },
                    { name: 'Review Date', value: updatedApplication.reviewTimestamp ? new Date(updatedApplication.reviewTimestamp).toLocaleString() : 'N/A', inline: true }
                ]
            }]
        };

        if (updatedApplication.reviewReason) {
            webhookMessage.embeds[0].fields.push({ name: 'Reason', value: updatedApplication.reviewReason, inline: false });
        }

        if (webhookUrl) {
            try {
                const webhookResponse = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookMessage)
                });

                if (!webhookResponse.ok) {
                    const webhookErrorText = await webhookResponse.text();
                    console.error(`Failed to send ${status} webhook:`, webhookErrorText);
                } else {
                    console.log(`Successfully sent ${status} webhook for application ${applicationId}.`);
                }
            } catch (webhookError) {
                console.error(`Error sending ${status} webhook:`, webhookError);
            }
        }

        res.json({ success: true, message: `Application status updated to ${status}.`, application: updatedApplication });
    } catch (error) {
        console.error('Error updating application status in DB:', error);
        res.status(500).json({ success: false, message: 'Failed to update application status due to a database error.' });
    }
});

app.delete('/api/applications/:id', isAdmin, async (req, res) => {
    const applicationId = req.params.id;
    console.log(`Server received request to delete application with ID: ${applicationId}`);

    try {
        const deletedApplication = await Application.findByIdAndDelete(applicationId);
        console.log(`Result of findByIdAndDelete(${applicationId}):`, deletedApplication);

        if (!deletedApplication) {
            console.warn(`Attempted to delete application ${applicationId}, but it was not found.`);
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        console.log(`Application ${applicationId} deleted.`);
        res.json({ success: true, message: 'Application deleted successfully.' });
    } catch (error) {
        console.error('Error deleting application from DB:', error);
        res.status(500).json({ success: false, message: 'Failed to delete application due to a database error.' });
    }
});

app.get('/api/admins', isAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({});
        res.json({ success: true, admins: admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve admins.' });
    }
});

app.post('/api/admins', isAdmin, async (req, res) => {
    const { discordId, username } = req.body;
    if (!discordId || !username) {
        return res.status(400).json({ success: false, message: 'Discord ID and username are required.' });
    }
    try {
        const existingAdmin = await Admin.findOne({ discordId: discordId });
        if (existingAdmin) {
            return res.status(409).json({ success: false, message: 'User is already an admin.' });
        }
        const newAdmin = new Admin({
            discordId: discordId,
            username: username,
            addedByDiscordId: req.session.userId,
            addedByUsername: req.session.username
        });
        await newAdmin.save();
        res.json({ success: true, message: 'Admin added successfully!', admin: newAdmin });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ success: false, message: 'Failed to add admin.' });
    }
});

app.delete('/api/admins/:discordId', isAdmin, async (req, res) => {
    const discordIdToDelete = req.params.discordId;
    if (req.session.userId === discordIdToDelete) {
        return res.status(403).json({ success: false, message: 'You cannot remove yourself as an admin.' });
    }
    try {
        const deletedAdmin = await Admin.findOneAndDelete({ discordId: discordIdToDelete });
        if (!deletedAdmin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
        res.json({ success: true, message: 'Admin removed successfully!' });
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({ success: false, message: 'Failed to remove admin.' });
    }
});

app.get('/api/blacklist', isAdmin, async (req, res) => {
    try {
        const blacklistedUsers = await BlacklistedUser.find({});
        res.json({ success: true, blacklistedUsers: blacklistedUsers });
    } catch (error) {
        console.error('Error fetching blacklisted users:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve blacklisted users.' });
    }
});

app.post('/api/blacklist', isAdmin, async (req, res) => {
    const { discordId, username, reason } = req.body;
    if (!discordId || !username) {
        return res.status(400).json({ success: false, message: 'Discord ID and username are required.' });
    }
    try {
        const existingBlacklistedUser = await BlacklistedUser.findOne({ discordId: discordId });
        if (existingBlacklistedUser) {
            return res.status(409).json({ success: false, message: 'User is already blacklisted.' });
        }
        const newBlacklistedUser = new BlacklistedUser({
            discordId: discordId,
            username: username,
            reason: reason || null,
            blacklistedByDiscordId: req.session.userId,
            blacklistedByUsername: req.session.username
        });
        await newBlacklistedUser.save();
        res.json({ success: true, message: 'User blacklisted successfully!', blacklistedUser: newBlacklistedUser });
    } catch (error) {
        console.error('Error blacklisting user:', error);
        res.status(500).json({ success: false, message: 'Failed to blacklist user.' });
    }
});

app.delete('/api/blacklist/:discordId', isAdmin, async (req, res) => {
    const discordIdToDelete = req.params.discordId;
    try {
        const deletedBlacklistedUser = await BlacklistedUser.findOneAndDelete({ discordId: discordIdToDelete });
        if (!deletedBlacklistedUser) {
            return res.status(404).json({ success: false, message: 'Blacklisted user not found.' });
        }
        res.json({ success: true, message: 'User removed from blacklist successfully!' });
    } catch (error) {
        console.error('Error removing blacklisted user:', error);
        res.status(500).json({ success: false, message: 'Failed to remove blacklisted user.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Discord OAuth Redirect URI: ${REDIRECT_URI}`);
    console.log('Make sure your .env file is configured with DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SESSION_SECRET, ADMIN_DISCORD_ID, MONGODB_URI, DISCORD_ACCEPTED_WEBHOOK_URL, and DISCORD_DENIED_WEBHOOK_URL.');
});
