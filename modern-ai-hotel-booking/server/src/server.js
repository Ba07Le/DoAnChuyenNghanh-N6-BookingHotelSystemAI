import express from "express"; import cors from "cors"; import helmet from "helmet"; import morgan from "morgan"; import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";

import {connectDatabase} from "./config/database.js"; import authRoutes from "./routes/auth.routes.js"; import hotelRoutes from "./routes/hotel.routes.js"; import homepageRoutes from "./routes/homepage.routes.js"; import catalogRoutes from "./routes/catalog.routes.js"; import bookingRoutes from "./routes/booking.routes.js"; import profileRoutes from "./routes/profile.routes.js"; import aiRoutes from "./routes/ai.routes.js";
dotenv.config(); const app=express(); const PORT=process.env.PORT||5000;



app.use(helmet()); app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"}));
app.use(express.json({limit:"2mb"})); app.use(morgan("dev"));
app.get("/",(req,res)=>res.json({message:"Modern AI Hotel Booking API",status:"running"})); 
app.get("/api/health",(req,res)=>res.json({success:true,message:"Server is healthy",timestamp:new Date()}));
app.use("/api/auth",authRoutes); 
app.use("/api/homepage",homepageRoutes); 
app.use("/api/hotels",hotelRoutes); 
app.use("/api",catalogRoutes); 
app.use("/api/bookings",bookingRoutes); 
app.use("/api/profile",profileRoutes); 
app.use("/api/ai",aiRoutes);
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({success:false,message:err.message||"Internal server error"});});

app.use("/api/chat", chatRoutes);

const start=async()=>{await connectDatabase();
    
app.listen(PORT,()=>console.log(`Server running at http://localhost:${PORT}`));}; start();
