import {env} from 'cloudflare:workers';
import {Product,Crop,registerProducts} from './catalog';
const cfg=env as unknown as {DB:D1Database;ADMIN_EMAIL?:string;ADMIN_PASSWORD?:string;ADMIN_SESSION_SECRET?:string};
export const COOKIE='1111_admin',MAX_AGE=60*60*8;
export type ImageRef={id:string;w:number;h:number};
type Row={id:string;name:string;price:number;category:string;type:string;color:string;hex:string;description:string;material:string;sizes:string;stock:number;images:string;active:number;created_at:number};
let ready=false;
export async function db(){const d=cfg.DB;if(!d)throw Error('Database unavailable');if(!ready){await d.batch([d.prepare('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, category TEXT NOT NULL, type TEXT NOT NULL, color TEXT NOT NULL, hex TEXT NOT NULL, description TEXT NOT NULL, material TEXT NOT NULL, sizes TEXT NOT NULL, stock INTEGER NOT NULL, images TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL)'),d.prepare('CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY NOT NULL, mime TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL)')]);ready=true}return d}
export const adminConfigured=()=>!!cfg.ADMIN_EMAIL&&!!cfg.ADMIN_PASSWORD;
const enc=new TextEncoder(),hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function digest(v:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v)))}
/** Constant-time comparison of two strings via their SHA-256 digests. */
async function same(a:string,b:string){const x=await digest(a),y=await digest(b);let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0}
export async function credentialsValid(email:string,password:string){if(!adminConfigured())return false;const a=await same(email.trim().toLowerCase(),cfg.ADMIN_EMAIL!.trim().toLowerCase()),b=await same(password,cfg.ADMIN_PASSWORD!);return a&&b}
async function sign(payload:string){const secret=cfg.ADMIN_SESSION_SECRET||`${cfg.ADMIN_EMAIL}:${cfg.ADMIN_PASSWORD}`;const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode(payload)))}
export async function sessionCookie(req:Request){const exp=Date.now()+MAX_AGE*1000,token=`${exp}.${await sign(String(exp))}`;return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${new URL(req.url).protocol==='https:'?'; Secure':''}`}
export const clearCookie=`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
export async function isAdmin(req:Request){if(!adminConfigured())return false;const m=req.headers.get('cookie')?.match(new RegExp(String.raw`(?:^|;\s*)${COOKIE}=(\d+)\.([a-f0-9]{64})(?:;|$)`));if(!m||Number(m[1])<Date.now())return false;return same(m[2],await sign(m[1]))}
const crop=(i:ImageRef):Crop=>({src:`/api/media/${i.id}`,w:i.w,h:i.h,x:0,y:0,cw:i.w,ch:i.h});
export function toProduct(r:Row):Product&{active:boolean;imageRefs:ImageRef[]}{const refs=JSON.parse(r.images) as ImageRef[],crops=refs.map(crop);return {id:r.id,name:r.name,price:r.price,category:r.category,type:r.type,color:r.color,hex:r.hex,description:r.description,material:r.material,sizes:JSON.parse(r.sizes),stock:r.stock,image:crops[0],...(crops.length>1?{gallery:crops}:{}),dynamic:true,active:!!r.active,imageRefs:refs}}
export async function listDbProducts(includeInactive=false){const d=await db();const {results}=await d.prepare(`SELECT * FROM products ${includeInactive?'':'WHERE active = 1'} ORDER BY created_at DESC`).all<Row>();return results.map(toProduct)}
/** Loads storefront products created in the admin panel into the shared catalog. Never throws. */
export async function syncProducts(){try{registerProducts(await listDbProducts())}catch{}}
