import {json,sameOrigin} from '@/lib/store-server';
import {db,isAdmin} from '@/lib/admin-server';
const MIME=['image/webp','image/jpeg','image/png'];
/** Accepts one image as raw bytes (the browser already resized it) and stores it in the database. */
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Request not allowed.'},403);
 if(!await isAdmin(req))return json({error:'Please sign in.'},401);
 const mime=(req.headers.get('content-type')||'').split(';')[0];if(!MIME.includes(mime))return json({error:'Use a WebP, JPEG or PNG image.'},400);
 const bytes=new Uint8Array(await req.arrayBuffer());if(!bytes.length||bytes.length>1_100_000)return json({error:'Image is too large. Choose a smaller photo.'},413);
 let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 const id=crypto.randomUUID();
 try{await (await db()).prepare('INSERT INTO product_images (id,mime,data,created_at) VALUES (?,?,?,?)').bind(id,mime,btoa(bin),Date.now()).run();return json({id})}catch{return json({error:'Image could not be saved.'},503)}
}
