import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoute from './routes/user.js'
import messageRoute from './routes/messages.js'
import authRoute from './routes/routes.js'
import serverless from "serverless-http";

const app = express()
const port = 3000
dotenv.config()
let dbURI = process.env.url
mongoose.connect(dbURI).then(()=>{
    console.log("MongoDB connected!")
    })
.catch((error)=>{
    console.log(error.message)
})
app.use(cors())
app.use(express.json())

app.use("/user",authRoute)
app.use("/messages",messageRoute)
app.use("/users",userRoute)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

export const handler = serverless(app);
