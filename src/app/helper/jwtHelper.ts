/** biome-ignore-all lint/style/useImportType: > */
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken"


export const generateJwtToken = async (jwtPayload:JwtPayload, secret:string, expires:string) =>{
        const token = jwt.sign(jwtPayload, secret, {expiresIn: expires} as SignOptions)
        return token
}

export const verifyJwtToken = async (accessToken:string, secret:string)=>{
     const verifiedToekn = await jwt.verify(accessToken, secret);
     return verifiedToekn
}