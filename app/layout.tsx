import type {Metadata} from 'next';
import './globals.css';
import {StoreProvider} from '@/components/store/provider';
import {listDbProducts} from '@/lib/admin-server';
import type {Product} from '@/lib/catalog';
export const metadata:Metadata={title:{default:'11:11 — Independent expression',template:'%s | 11:11'},description:'Modern essentials. Independent expression. Explore the 11:11 collection, studio and new-season stories.',icons:{icon:'/favicon.svg'},robots:{index:false,follow:false}};
export default async function RootLayout({children}:{children:React.ReactNode}){let extra:Product[]=[];try{extra=(await listDbProducts()).map(({active,imageRefs,...p})=>p)}catch{}return <html lang="en"><body id="top"><noscript><style>{`.brand-opening{display:none!important}.hero,.hero *{animation:none!important}.header{opacity:1!important}`}</style></noscript><StoreProvider extra={extra}>{children}</StoreProvider></body></html>}
