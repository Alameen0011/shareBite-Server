import { AuthRequest } from "../../interfaces/auth"
import { NextFunction, Response } from "express"
import User from "../../models/user.model"

export const getAllUsersForAdmin =  async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const role = req.query.role as string | undefined
        const search = (req.query.search as string) || ''


        const filter: any = {
            ...(role && role !== "all" ? { role } : {}),
            ...(search && {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
              ]
            })
          };

        const skip = (page - 1) * limit
        const totalUsers = await User.countDocuments(filter)
        const totalPages = Math.ceil(totalUsers/ limit)
      






        const Users = await User.find(filter)
                                .sort({ createdAt: -1 })
                                .skip(skip)
                                .limit(limit)
                                .select('-otp,-deliveryOtp')

    

        res.status(200).json({
            success:true,
            Users,
            page,
            totalPages,
            totalUsers,
            message:"users fetched successfully"
        })


        
    } catch (error) {
        console.log("Get Users Error :",error)
        next(error)
    }


} 

export const toggleBlockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;

  
        const user = await User.findById(userId);

        if (!user) {
             res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

   
        user.isBlocked = !user.isBlocked;

   
        await user.save();

       res.status(200).json({
            success: true,
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isBlocked: user.isBlocked,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Toggle Block User Error:", error);
        next(error); 
    }
};
