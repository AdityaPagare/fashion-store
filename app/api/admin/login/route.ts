import {json,sameOrigin} from '@/lib/store-server';
import {adminConfigured,credentialsValid,sessionCookie,clearCookie,isAdmin} from '@/lib/admin-server';
export async function GET(req:Request){return json({configured:adminConfigured(),authenticated:await isAdmin(req)})}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Request not allowed.'},403);
 if(!adminConfigured())return json({error:'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .dev.vars (local) or as Worker secrets.'},503);
 let body:{email?:unknown;password?:unknown};try{body=JSON.parse(await req.text())}catch{return json({error:'Invalid request.'},400)}
 const email=typeof body.email==='string'?body.email:'',password=typeof body.password==='string'?body.password:'';
 if(!await credentialsValid(email.slice(0,200),password.slice(0,200))){await new Promise(r=>setTimeout(r,700));return json({error:'Incorrect email or password.'},401)}
 return json({ok:true},200,{'Set-Cookie':await sessionCookie(req)});
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Request not allowed.'},403);return json({ok:true},200,{'Set-Cookie':clearCookie})}
