import { useEffect,useRef } from 'react';
export default function ScreenVideo({stream,label}:{stream:MediaStream;label:string}){const ref=useRef<HTMLVideoElement>(null);useEffect(()=>{const video=ref.current;if(!video)return;video.srcObject=stream;void video.play().catch(()=>{});return()=>{video.srcObject=null;};},[stream]);return <video ref={ref} autoPlay playsInline muted aria-label={label}/>;}
