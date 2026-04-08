import express from 'express';
import Joi from 'joi';
const authRoute = express.Router();
import User from '../schema/schema.js';
import Tution from '../schema/tution.js';
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import dotenv from 'dotenv';
import upload from '../Multer/upload.js';
import Notification from '../schema/notification.js'
import axios from 'axios';
dotenv.config();

const registerSchema = Joi.object({
    username: Joi.string(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).pattern(new RegExp('^[a-zA-Z0-9]{6,30}$')).required(),
    role: Joi.string().valid('parent', 'admin', 'tutor', 'academy').optional()

}).required()
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).pattern(new RegExp('^[a-zA-Z0-9]{6,30}$')).required()

}).required()

const adminSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).pattern(new RegExp('^[a-zA-Z0-9]{6,30}$')).required(),
    role: Joi.string().valid('admin').required()
}).required()

//unused currently but can be used for admin protected routes
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access No token provided!" });
        }
        let decoded = jwt.verify(token, process.env.secretKey);
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized access Admin only!" });
        }
        let user = await User.findById(decoded?.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized access Admin not found!" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in adminAuth middleware:", error);
        return res.status(500).json({ message: "Internal Server Error from admin Middleware route" });
    }
}
authRoute.post('/register', upload.single("profilePic"), async (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {
        const { username, contact, email, password, role } = req.body;
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.send({
                message: error.details[0].message,
                code: 400
            }
            )
        }
        let findUser = await User.findOne({ email })
        if (findUser) {
            return res.status(409).send({
                message: "user with this email already exists!",
                code: 400
            })
        }
        const saltRounds = process.env.saltRounds
        let hashpassword = await bcrypt.hash(password, parseInt(saltRounds))
        let secretKey = process.env.secretKey
        const userRole = (role && ['parent', 'admin', 'tutor', 'academy'].includes(role)) ? role : 'parent';
        const newUser = new User({
            username,
            contact,
            email,
            password: hashpassword,
            role: userRole,
            profilePic: req.file
                ? {
                    url: req.file.path,       // Cloudinary URL
                    public_id: req.file.filename,
                }
                : undefined,
        });

        await newUser.save()
        let token = jwt.sign({ id: newUser._id, username, contact, email }, secretKey);
        const io = req.app.get('socketio');

        // Send notification to ALL connected clients
        io.emit('notification', {
            title: 'New User Alert!',
            message: `${newUser.username} just joined the portal.`,
            timestamp: new Date()
        });
        res.send({
            message: "Successful",
            user: newUser,
            token: token,
            code: 200
        })
    } catch (error) {
        res.send({
            message: error.message,
            code: 404
        })
    }
})
authRoute.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const { error } = loginSchema.validate(req.body)
        if (error) {
            return res.status(409).send({
                message: error.details[0].message,
                code: 400
            })
        }
        let findUser = await User.findOne({ username })
        if (!findUser) {
            return res.status(409).send({
                message: "username doesn't exists!",
                code: 400
            })
        }
        let checkpassword = await bcrypt.compare(password, findUser.password)
        if (!checkpassword) {
            return res.status(409).send({
                message: "Password is incorrect!",
                code: 400
            })
        }
        let token = jwt.sign({ id: findUser._id, username }, process.env.secretKey);
        res.status(200).send({
            message: "Login successfully!",
            token: token,
            code: 200
        })

    } catch (error) {
        console.error(error.message)
        res.send({
            message: "Failed to login!!!",
            code: 400
        })
    }
})
authRoute.post('/admin', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const { error } = adminSchema.validate(req.body)
        if (error) {
            return res.status(409).send({
                message: error.details[0].message,
                code: 400
            })
        }
        let findAdmin = await User.findOne({ username, role: 'admin' })
        if (!findAdmin) {
            return res.status(409).send({
                message: "Admin credentials are incorrect!",
                code: 400
            })
        }
        let checkPassword = await bcrypt.compare(password, findAdmin.password)
        if (!checkPassword) {
            return res.status(409).send({
                message: "Admin password is incorrect!",
                code: 400
            })
        }
        const token = jwt.sign({ id: findAdmin._id, username, role: 'admin' }, process.env.secretKey, { expiresIn: '1h' });
        res.status(200).send({
            message: "Admin access granted!",
            token: token,
            code: 200
        })
    } catch (error) {
        console.error(error.message)
        res.send({
            message: "Failed to grant admin access!!!",
            code: 400
        })
    }
})
authRoute.get("/user", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            res.send({ message: "Unauthorized access no token provided!", code: 401 })
        }
        const decoded = jwt.verify(token, process.env.secretKey)
        if (!decoded) {
            res.send({ message: "Unauthorized access invalid token!", code: 401 })
        }
        console.log("Decoded Token", decoded)
        const getUser = await User.findById(decoded?.id)
        res.send({
            message: "User fetched successfully!",
            user: getUser,
            code: 200
        })

    } catch (error) {
        res.status(400).send({
            message: "Failed to fetch user!",
            code: 400
        })
    }
})
authRoute.post("/PostTution", async (req, res) => {
    try {
        const body = req.body
        const { title, description, subject, location, salary, contact } = body
        if (!title || !description || !subject || !location || !salary || !contact) {
            return res.status(400).send({
                message: "All fields are required!",
                code: 400
            })
        }
        console.log("Tution Post Body:", body)
        const newTution = new Tution({
            title,
            description,
            subject,
            location,
            salary,
            contact
        })
        await newTution.save()
        // Add this before io.emit(...)
        try {
            const notification = await Notification.create({
                title: 'New Tution Post!',
                message: `${newTution.title} Tution just got posted.`,
                targetRole: ['admin', 'tutor'],
                read: false
            })

            const io = req.app.get('socketio')
            io.emit('notification', {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                targetRole: ['admin', 'tutor'],
                timestamp: notification.createdAt,
                read: false
            })
        } catch (notifErr) {
            console.error("Notification failed:", notifErr.message) // silent fail
        }
        res.send({
            message: "Tution post received successfully!",
            data: body,
            code: 200
        })

        // Notify WhatsApp Bridge
        try {
            await axios.post('http://localhost:3001/send-message', {
                title: newTution.title,
                subject: newTution.subject,
                location: newTution.location,
                salary: newTution.salary,
                contact: newTution.contact,
                description: newTution.description
            });
            console.log("WhatsApp Bridge notified successfully");
        } catch (waErr) {
            console.error("WhatsApp Bridge notification failed:", waErr.message);
        }

    } catch (error) {
        res.status(400).send({
            message: "Failed to post tution!",
            code: 400
        })
    }
})

authRoute.get("/PostTution", async (req, res) => {
    try {
        const tutions = await Tution.find().sort({ createdAt: -1 }); // Get newest first
        res.status(200).json(tutions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
    }
});
authRoute.get("/tutors", async (req, res) => {
    try {
        const tutors = await User.find({ role: 'tutor' }).select("-password");
        res.status(200).json(tutors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tutors" });
    }
});

// Get all notifications (latest first) based on role
authRoute.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    let query = { targetRole: 'all' }; // Default to public notifications

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.secretKey);
        const user = await User.findById(decoded.id);
        if (user) {
          // Find notifications where user role is in the targetRole array OR it's 'all'
          query = { 
            targetRole: { $in: ['all', user.role] }
          };
        }
      } catch (jwtErr) {
        console.error("Invalid token in notification fetch:", jwtErr.message);
      }
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add route for tutor application notification
authRoute.post("/apply", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).send({ message: "Unauthorized", code: 401 });
        }
        const decoded = jwt.verify(token, process.env.secretKey);
        const user = await User.findById(decoded.id);
        
        if (user.role !== 'tutor' && user.role !== 'academy') {
            return res.status(403).send({ message: "Only tutors or academies can apply for tuitions.", code: 403 });
        }

        const { tutorName, tutionTitle } = req.body;
        if (!tutorName || !tutionTitle) {
            return res.status(400).send({ message: "Tutor name and tuition title are required!", code: 400 });
        }

        const notification = await Notification.create({
            title: user.role === 'academy' ? 'Academy Application Alert' : 'Tutor Application Alert',
            message: `${user.role === 'academy' ? 'Academy' : 'Tutor'} ${tutorName} applied for the tuition: ${tutionTitle}`,
            targetRole: ['admin'],
            read: false
        });

        const io = req.app.get('socketio');
        io.emit('notification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            targetRole: ['admin'],
            timestamp: notification.createdAt,
            read: false
        });

        res.send({ message: "Application received and admin notified!", code: 200 });
    } catch (error) {
        console.error("Apply notification error:", error.message);
        res.status(500).send({ message: "Failed to process application notification.", code: 500 });
    }
});

// Add route for parent hire notification
authRoute.post("/hire", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).send({ message: "Unauthorized", code: 401 });
        }
        const decoded = jwt.verify(token, process.env.secretKey);
        const user = await User.findById(decoded.id);
        
        if (user.role !== 'parent' && user.role !== 'academy') {
            return res.status(403).send({ message: "Only parents or academies can hire tutors.", code: 403 });
        }

        const { parentName, tutorName } = req.body;
        if (!parentName || !tutorName) {
            return res.status(400).send({ message: "Parent name and tutor name are required!", code: 400 });
        }

        const notification = await Notification.create({
            title: user.role === 'academy' ? 'Academy Hiring Request' : 'Hiring Request Alert',
            message: `${user.role === 'academy' ? 'Academy' : 'Parent'} ${parentName} wants to hire Tutor: ${tutorName}`,
            targetRole: ['admin'],
            read: false
        });

        const io = req.app.get('socketio');
        io.emit('notification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            targetRole: ['admin'],
            timestamp: notification.createdAt,
            read: false
        });

        res.send({ message: "Hiring request sent to admin!", code: 200 });
    } catch (error) {
        console.error("Hire notification error:", error.message);
        res.status(500).send({ message: "Failed to process hiring notification.", code: 500 });
    }
});

// Mark all as read
authRoute.patch("/mark-read", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default authRoute