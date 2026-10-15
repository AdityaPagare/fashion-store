'use client';
import {useCallback,useEffect,useState} from 'react';
import {categories,money} from '@/lib/catalog';
import {SIZES} from '@/lib/admin-products';
type Img={id:string;w:number;h:number};
type Item={id:string;name:string;price:number;category:string;type:string;color:string;hex:string;description:string;material:string;sizes:string[];stock:number;active:boolean;imageRefs:Img[]};
const TYPES=['Jacket','Bomber','Hoodie','Knitwear','Tops','Trousers','Accessories'];
const blank={name:'',price:'',category:categories[0],type:TYPES[0],color:'',hex:'#111111',description:'',material:'',sizes:['S','M','L','XL'],stock:'10',active:true};
type Form=typeof blank;
const api=async(url:string,init?:RequestInit):Promise<any>=>{const r=await fetch(url,init);const d:any=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(d.error||'Something went wrong.'),{status:r.status});return d};
/** Resizes in the browser so photos stay small enough to store (max 1400px, WebP). */
async function shrink(file:File):Promise<{blob:Blob;w:number;h:number}>{
 const bmp=await createImageBitmap(file);const scale=Math.min(1,1400/Math.max(bmp.width,bmp.height)),w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d')!.drawImage(bmp,0,0,w,h);
 for(const q of [.86,.74,.62,.5]){const blob=await new Promise<Blob|null>(r=>c.toBlob(r,'image/webp',q));if(blob&&blob.size<=1_000_000)return {blob,w,h}}
 throw Error('That photo is too large even after resizing. Try a smaller one.');
}
export default function Admin(){
 const [state,setState]=useState<'loading'|'login'|'ready'>('loading'),[configured,setConfigured]=useState(true),[items,setItems]=useState<Item[]>([]),[filter,setFilter]=useState('All');
 const [form,setForm]=useState<Form>(blank),[images,setImages]=useState<Img[]>([]),[editing,setEditing]=useState<string|null>(null),[msg,setMsg]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const d=await api('/api/admin/products');setItems(d.products);setState('ready')}catch(e:any){if(e.status===401){const s=await api('/api/admin/login').catch(()=>({configured:true}));setConfigured(s.configured!==false);setState('login')}else{setErr(e.message);setState('ready')}}},[]);
 useEffect(()=>{load()},[load]);
 const login=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setErr('');const f=new FormData(e.currentTarget);setBusy(true);try{await api('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});await load()}catch(e:any){setErr(e.message)}setBusy(false)};
 const logout=async()=>{await api('/api/admin/login',{method:'DELETE'}).catch(()=>{});setItems([]);setState('login')};
 const set=<K extends keyof Form>(k:K,v:Form[K])=>setForm(f=>({...f,[k]:v}));
 const reset=()=>{setForm(blank);setImages([]);setEditing(null);setErr('')};
 const upload=async(files:FileList|null)=>{if(!files?.length)return;setErr('');setBusy(true);try{const added:Img[]=[];for(const file of Array.from(files).slice(0,8-images.length)){if(!file.type.startsWith('image/'))throw Error('Choose image files only.');const {blob,w,h}=await shrink(file);const d=await api('/api/admin/upload',{method:'POST',headers:{'Content-Type':blob.type},body:blob});added.push({id:d.id,w,h})}setImages(i=>[...i,...added].slice(0,8))}catch(e:any){setErr(e.message)}setBusy(false)};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setErr('');setMsg('');setBusy(true);try{const body=JSON.stringify({...form,price:Number(form.price),stock:Number(form.stock),images});await api(editing?`/api/admin/products/${editing}`:'/api/admin/products',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body});setMsg(editing?'Product updated.':'Product added to the shop.');reset();await load()}catch(e:any){setErr(e.message)}setBusy(false)};
 const edit=(p:Item)=>{setEditing(p.id);setImages(p.imageRefs);setForm({name:p.name,price:String(p.price),category:p.category,type:p.type,color:p.color,hex:p.hex,description:p.description,material:p.material,sizes:p.sizes,stock:String(p.stock),active:p.active});setMsg('');setErr('');window.scrollTo({top:0,behavior:'smooth'})};
 const toggle=async(p:Item)=>{try{await api(`/api/admin/products/${p.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,images:p.imageRefs,active:!p.active})});await load()}catch(e:any){setErr(e.message)}};
 const remove=async(p:Item)=>{if(!confirm(`Delete “${p.name}”? This cannot be undone.`))return;try{await api(`/api/admin/products/${p.id}`,{method:'DELETE'});if(editing===p.id)reset();await load()}catch(e:any){setErr(e.message)}};
 if(state==='loading')return <main className="admin"><p className="mono">LOADING…</p></main>;
 if(state==='login')return <main className="admin admin-login"><form onSubmit={login}><h1>11:11<sup>®</sup></h1><p className="mono">ADMIN</p>{!configured&&<p className="admin-error">Admin login is not configured yet. Add ADMIN_EMAIL and ADMIN_PASSWORD to a .dev.vars file in the project root and restart the server.</p>}<label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label>{err&&<p className="admin-error" role="alert">{err}</p>}<button className="admin-btn" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form></main>;
 const shown=filter==='All'?items:items.filter(p=>p.category===filter);
 return <main className="admin">
  <header className="admin-top"><div><h1>11:11<sup>®</sup> <span>Admin</span></h1><p className="mono">{items.length} PRODUCT{items.length===1?'':'S'} ADDED HERE · <a href="/" target="_blank">VIEW SHOP</a></p></div><button className="admin-btn ghost" onClick={logout}>Sign out</button></header>
  <div className="admin-grid">
   <form className="admin-form" onSubmit={save}>
    <h2>{editing?'Edit product':'Add product'}</h2>
    <label>Name<input value={form.name} onChange={e=>set('name',e.target.value)} maxLength={80} required/></label>
    <div className="row"><label>Price (₹)<input type="number" min={1} step={1} value={form.price} onChange={e=>set('price',e.target.value)} required/></label><label>Stock<input type="number" min={0} step={1} value={form.stock} onChange={e=>set('stock',e.target.value)} required/></label></div>
    <div className="row"><label>Category / section<select value={form.category} onChange={e=>set('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Type<select value={form.type} onChange={e=>set('type',e.target.value)}>{TYPES.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <div className="row"><label>Colour name<input value={form.color} onChange={e=>set('color',e.target.value)} maxLength={30} required/></label><label>Swatch<input type="color" value={form.hex} onChange={e=>set('hex',e.target.value)}/></label></div>
    <fieldset><legend>Sizes</legend><div className="sizes">{SIZES.map(s=><label key={s} className={form.sizes.includes(s)?'on':''}><input type="checkbox" checked={form.sizes.includes(s)} onChange={e=>set('sizes',e.target.checked?[...form.sizes,s]:form.sizes.filter(x=>x!==s))}/>{s}</label>)}</div></fieldset>
    <label>Description<textarea rows={3} value={form.description} onChange={e=>set('description',e.target.value)} maxLength={800}/></label>
    <label>Material &amp; care<textarea rows={2} value={form.material} onChange={e=>set('material',e.target.value)} maxLength={300}/></label>
    <fieldset><legend>Photos <small>(first photo is the cover · up to 8)</small></legend>
     <div className="thumbs">{images.map((im,i)=><div key={im.id} className="thumb"><img src={`/api/media/${im.id}`} alt=""/>{i===0&&<b>COVER</b>}<button type="button" aria-label="Remove photo" onClick={()=>setImages(images.filter(x=>x.id!==im.id))}>×</button>{i>0&&<button type="button" className="mk" onClick={()=>setImages([im,...images.filter(x=>x.id!==im.id)])}>Cover</button>}</div>)}
     {images.length<8&&<label className="drop">+ Add photos<input type="file" accept="image/*" multiple onChange={e=>{upload(e.target.files);e.target.value=''}} hidden/></label>}</div></fieldset>
    <label className="check"><input type="checkbox" checked={form.active} onChange={e=>set('active',e.target.checked)}/> Visible in the shop</label>
    {err&&<p className="admin-error" role="alert">{err}</p>}{msg&&<p className="admin-ok" role="status">{msg}</p>}
    <div className="row"><button className="admin-btn" disabled={busy||!images.length}>{busy?'Working…':editing?'Save changes':'Add product'}</button>{editing&&<button type="button" className="admin-btn ghost" onClick={reset}>Cancel</button>}</div>
   </form>
   <section className="admin-list">
    <div className="admin-tabs">{['All',...categories].map(c=><button key={c} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{c}</button>)}</div>
    {!shown.length&&<p className="admin-empty">No products here yet. Add your first one with the form.</p>}
    <ul>{shown.map(p=><li key={p.id} className={p.active?'':'off'}><img src={`/api/media/${p.imageRefs[0].id}`} alt=""/><div><strong>{p.name}</strong><span className="mono">{p.category.toUpperCase()} · {p.type.toUpperCase()}</span><span>{money(p.price)} · {p.stock} in stock · <i style={{background:p.hex}}/>{p.color}</span></div><div className="acts"><button onClick={()=>edit(p)}>Edit</button><button onClick={()=>toggle(p)}>{p.active?'Hide':'Show'}</button><button className="danger" onClick={()=>remove(p)}>Delete</button></div></li>)}</ul>
   </section>
  </div>
 </main>
}
