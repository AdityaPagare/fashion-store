import {json,sameOrigin} from '@/lib/store-server';
import {db,isAdmin} from '@/lib/admin-server';
import {parseProduct} from '@/lib/admin-products';
type Ctx={params:Promise<{id:string}>};
const guard=async(req:Request)=>!sameOrigin(req)?json({error:'Request not allowed.'},403):!await isAdmin(req)?json({error:'Please sign in.'},401):null;
export async function PUT(req:Request,{params}:Ctx){
 const denied=await guard(req);if(denied)return denied;const {id}=await params;
 let body:unknown;try{body=JSON.parse(await req.text())}catch{return json({error:'Invalid request.'},400)}
 const r=parseProduct(body);if(!r.ok)return json({error:r.error},400);const p=r.value;
 try{const d=await db(),old=await d.prepare('SELECT images FROM products WHERE id = ?').bind(id).first<{images:string}>();if(!old)return json({error:'Product not found.'},404);
  await d.prepare('UPDATE products SET name=?,price=?,category=?,type=?,color=?,hex=?,description=?,material=?,sizes=?,stock=?,images=?,active=? WHERE id=?').bind(p.name,p.price,p.category,p.type,p.color,p.hex,p.description,p.material,JSON.stringify(p.sizes),p.stock,JSON.stringify(p.images),p.active?1:0,id).run();
  const keep=new Set(p.images.map(i=>i.id)),gone=(JSON.parse(old.images) as {id:string}[]).filter(i=>!keep.has(i.id));
  if(gone.length)await d.batch(gone.map(i=>d.prepare('DELETE FROM product_images WHERE id = ?').bind(i.id)));
  return json({ok:true})}catch{return json({error:'Product could not be saved.'},503)}
}
export async function DELETE(req:Request,{params}:Ctx){
 const denied=await guard(req);if(denied)return denied;const {id}=await params;
 try{const d=await db(),old=await d.prepare('SELECT images FROM products WHERE id = ?').bind(id).first<{images:string}>();if(!old)return json({error:'Product not found.'},404);
  await d.batch([d.prepare('DELETE FROM products WHERE id = ?').bind(id),...(JSON.parse(old.images) as {id:string}[]).map(i=>d.prepare('DELETE FROM product_images WHERE id = ?').bind(i.id))]);return json({ok:true})}catch{return json({error:'Product could not be deleted.'},503)}
}
