import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import userRoute from './routes/user.js'
import messageRoute from './routes/messages.js'
import authRoute from './routes/routes.js'

const app = express()
const port = 3000
const httpServer = createServer(app)
dotenv.config()
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
})
let dbURI = process.env.url
mongoose.connect(dbURI).then(()=>{
    console.log("MongoDB connected!")
    })
.catch((error)=>{
    console.log(error.message)
})
app.use(cors())
app.use(express.json())
app.set('socketio', io)
app.use("/user",authRoute)
app.use("/messages",messageRoute)
app.use("/users",userRoute)
app.use("/notifications",authRoute)

app.get('/', (req, res) => {
  res.send('Hello World!')
})
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)
})
httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
