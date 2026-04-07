// /* eslint-disable @typescript-eslint/no-explicit-any */

// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { envVars } from "../../config/env";
// import { prisma } from "../../lib/prisma";


// const register = async (payload: any) => {
//     const hashedPassword = await bcrypt.hash(payload.password, 12);

//     return await prisma.$transaction(async (tx) => {
//         const user = await tx.user.create({
//             data: {
//                 ...payload,
//                 password: hashedPassword,
//             },
//         });

//         // ইউজারের জন্য প্রোফাইল তৈরি
//         await tx.profile.create({
//             data: { userId: user.id, bio: "Hello, I am a new user!" }
//         });

//         return user;
//     });
// };

// const login = async (payload: any) => {
//     const user = await prisma.user.findUniqueOrThrow({
//         where: { email: payload.email }
//     });

//     const isPasswordMatch = await bcrypt.compare(payload.password, user.password);
//     if (!isPasswordMatch) throw new Error("Password mismatch!");

//     const accessToken = jwt.sign(
//         { userId: user.id, role: user.role },
//         envVars.ACCESS_TOKEN_SECRET,
//         { expiresIn: '1d' }
//     );

//     return { accessToken, user };
// };

// export const AuthService = { register, login };