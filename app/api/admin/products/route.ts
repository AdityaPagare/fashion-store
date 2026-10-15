import {json,sameOrigin} from '@/lib/store-server';
import {db,isAdmin,listDbProducts} from '@/lib/admin-server';
import {parseProduct} from '@/lib/admin-products';
export async function GET(req:Request){if(!await isAdmin(req))return json({error:'Please sign in.'},401);try{return json({products:await listDbProducts(true)})}catch{return json({error:'Products could not be loaded.'},503)}}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Request not allowed.'},403);if(!await isAdmin(req))return json({error:'Please sign in.'},401);
 let body:unknown;try{body=JSON.parse(await req.text())}catch{return json({error:'Invalid request.'},400)}
 const r=parseProduct(body);if(!r.ok)return json({error:r.error},400);const p=r.value;
 const id=`${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'piece'}-${crypto.randomUUID().slice(0,6)}`;
 try{await (await db()).prepare('INSERT INTO products (id,name,price,category,type,color,hex,description,material,sizes,stock,images,active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,p.name,p.price,p.category,p.type,p.color,p.hex,p.description,p.material,JSON.stringify(p.sizes),p.stock,JSON.stringify(p.images),p.active?1:0,Date.now()).run();return json({id},201)}catch{return json({error:'Product could not be saved.'},503)}
}
