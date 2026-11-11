import type {Metadata} from 'next';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
export const metadata:Metadata={title:'GRID / ALIVE — Britain, electrified',description:'A cinematic, top-down view of Great Britain’s electricity system. Explore generation, carbon intensity and international connections.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
