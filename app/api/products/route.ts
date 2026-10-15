import {json} from '@/lib/store-server';
import {listDbProducts} from '@/lib/admin-server';
export async function GET(){try{return json({products:await listDbProducts()})}catch{return json({products:[]})}}
