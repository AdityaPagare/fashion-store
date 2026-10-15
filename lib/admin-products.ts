import {categories} from './catalog';
export const SIZES=['XS','S','M','L','XL','XXL'];
export type ProductInput={name:string;price:number;category:string;type:string;color:string;hex:string;description:string;material:string;sizes:string[];stock:number;images:{id:string;w:number;h:number}[];active:boolean};
const str=(v:unknown,min:number,max:number)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max?v.trim():null;
const int=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max?v:null;
/** Validates untrusted product JSON. Returns the cleaned product or an error message. */
export function parseProduct(b:any):{ok:true;value:ProductInput}|{ok:false;error:string}{
 if(!b||typeof b!=='object')return {ok:false,error:'Invalid request.'};
 const name=str(b.name,2,80),price=int(b.price,1,10_000_000),stock=int(b.stock,0,9999),type=str(b.type,2,30),color=str(b.color,2,30),description=str(b.description,0,800)??'',material=str(b.material,0,300)??'';
 if(!name)return {ok:false,error:'Enter a product name (2–80 characters).'};
 if(price===null)return {ok:false,error:'Enter a whole-number price in rupees.'};
 if(!categories.includes(b.category))return {ok:false,error:'Choose a category.'};
 if(!type)return {ok:false,error:'Choose a product type.'};
 if(!color)return {ok:false,error:'Enter a colour name.'};
 if(typeof b.hex!=='string'||!/^#[0-9a-f]{6}$/i.test(b.hex))return {ok:false,error:'Choose a colour swatch.'};
 if(stock===null)return {ok:false,error:'Enter the stock quantity.'};
 if(!Array.isArray(b.sizes)||!b.sizes.length||b.sizes.some((s:unknown)=>typeof s!=='string'||!SIZES.includes(s)))return {ok:false,error:'Select at least one size.'};
 if(!Array.isArray(b.images)||b.images.length<1||b.images.length>8||b.images.some((i:any)=>!i||typeof i.id!=='string'||!/^[a-f0-9-]{36}$/.test(i.id)||!Number.isInteger(i.w)||!Number.isInteger(i.h)||i.w<1||i.h<1||i.w>6000||i.h>6000))return {ok:false,error:'Add 1 to 8 product photos.'};
 return {ok:true,value:{name,price,category:b.category,type,color,hex:b.hex.toLowerCase(),description,material,sizes:SIZES.filter(s=>b.sizes.includes(s)),stock,images:b.images.map((i:any)=>({id:i.id,w:i.w,h:i.h})),active:b.active!==false}};
}
