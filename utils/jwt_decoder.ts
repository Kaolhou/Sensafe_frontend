import { Buffer } from 'buffer';

global.Buffer = Buffer;


export default function jwt_decode<T = any>(token:string):T{
    const parts = token.split('.').map(part => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return JSON.parse(parts[1]);

}