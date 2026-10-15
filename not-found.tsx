import Link from "next/link";

export default function NotFound() {
  return <div className="container" style={{minHeight:"60vh",display:"grid",placeItems:"center",textAlign:"center"}}>
    <div><span className="eyebrow">404 · Not found</span><h1 style={{fontSize:"3rem",letterSpacing:"-.06em"}}>This page wandered off.</h1><p style={{color:"#666",lineHeight:1.7}}>The page may have moved, or the post may no longer be published.</p><Link className="button" href="/">Back to home</Link></div>
  </div>;
}
