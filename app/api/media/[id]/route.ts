import {db} from '@/lib/admin-server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 try{const row=await (await db()).prepare('SELECT mime,data FROM product_images WHERE id = ?').bind(id).first<{mime:string;data:string}>();if(!row)return new Response('Not found',{status:404});
  const bin=atob(row.data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new Response(bytes,{headers:{'Content-Type':row.mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Unavailable',{status:503})}
}
