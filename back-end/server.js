import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import bookRouter from './routes/bookRoute.js'
import issueRoute from './routes/issueRoute.js'
import authRouter from './routes/authRoute.js'
import bookRequestRouter from './routes/bookRequestRoute.js'
import feedbackRouter from './routes/feedbackRoute.js'

// App config 
const app = express()
const port = process.env.PORT || 4550
connectDB()
connectCloudinary()

// Middleware 
app.use(express.json())
app.use(cors())
app.use('/api/user',userRouter)
app.use('/api/books',bookRouter)
app.use('/api/admin',issueRoute)
app.use('/api/auth',authRouter)
app.use('/api/book-requests', bookRequestRouter)
app.use('/api/feedback', feedbackRouter)

// API endpoints
app.get('/',(req,res)=> {
    res.send("API Working")
})

app.listen(port, ()=> console.log('Server started on port: '+port))