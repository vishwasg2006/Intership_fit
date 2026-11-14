import { Routes, Route, Navigate, NavLink, Link, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, Check, ChevronRight, GraduationCap, LogOut, Menu, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import { getToken, getUser, clearSession } from "./api";
const Login = lazy(() => import("./pages/auth/Login"));
const Profile = lazy(() => import("./pages/auth/Profile"));
const Home = lazy(() => import("./pages/student/Home"));
const Results = lazy(() => import("./pages/student/Results"));
const Gaps = lazy(() => import("./pages/student/Gaps"));
const Matches = lazy(() => import("./pages/student/Matches"));
const Assessment = lazy(() => import("./pages/assessment/Assessment"));
const Coding = lazy(() => import("./pages/assessment/Coding"));
const Dashboard = lazy(() => import("./pages/placement/Dashboard"));
const Sessions = lazy(() => import("./pages/placement/Sessions"));
const CodingAssessments = lazy(() => import("./pages/placement/CodingAssessments"));
const Drives = lazy(() => import("./pages/placement/Drives"));

function Protected({ children, role }) {
  const user = getUser();
  if (!getToken()) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === "placement" ? "/dashboard" : "/home"} replace />;
  return children;
}

function Landing() {
  if (getToken()) return <Navigate to={getUser()?.role === "placement" ? "/dashboard" : "/home"} replace />;
  return <main className="landing">
    <nav className="landing-nav"><Link to="/" className="brand"><span className="brand-mark"><Target size={19}/></span>InternshipFit</Link><div><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary" to="/login?tab=signup">Get started <ArrowRight size={16}/></Link></div></nav>
    <section className="hero-wrap"><div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> A clearer path to your first opportunity</span><h1>Know your fit.<br/><span>Fix your gaps.</span><br/>Get matched.</h1><p className="hero-lede">Build confidence with skill-based assessments, free learning resources, and internship recommendations that explain every step.</p><div className="hero-actions"><Link className="button button-primary" to="/login?tab=signup">Get started <ArrowRight size={17}/></Link><Link className="button button-soft" to="/login">Log in</Link></div><div className="hero-note"><span className="avatar-stack"><i>A</i><i>R</i><i>M</i></span><span>Built to make opportunity easier to reach</span></div></div>
      <div className="hero-art" aria-label="Internship readiness overview"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="floating-label float-top"><span className="mini-icon mint"><ShieldCheck size={16}/></span><span><b>Clear, trusted scores</b><small>Verified when supervised</small></span></div><article className="preview-card"><div className="preview-head"><div><small>YOUR READINESS</small><h3>Good momentum</h3></div><span className="preview-dot"><Check size={17}/></span></div><div className="readiness-meter"><div style={{width:"72%"}}/></div><div className="meter-legend"><span>Current skills</span><b>72%</b></div><div className="preview-divider"/><div className="preview-match"><div className="company-icon">✳</div><div><b>Internship match</b><small>Why it fits · what to build next</small></div><ChevronRight size={17}/></div></article><div className="floating-label float-bottom"><span className="mini-icon lilac"><BookOpen size={16}/></span><span><b>Next step</b><small>Free resources picked for you</small></span></div><span className="sparkle s-one">✦</span><span className="sparkle s-two">✳</span></div></section>
    <section className="how-section"><div className="section-heading"><span className="eyebrow">A simple way forward</span><h2>Small steps. Real progress.</h2><p>Know where you stand, then focus on what moves you forward.</p></div><div className="steps-grid"><Step n="01" icon={<Target/>} title="Take one assessment" body="See your strengths across aptitude, programming, web, and DBMS."/><Step n="02" icon={<BookOpen/>} title="See your next steps" body="Get a clear skill-gap report, free resources, and a focused roadmap."/><Step n="03" icon={<BriefcaseBusiness/>} title="Find your fit" body="Explore internships with transparent match scores and eligibility."/></div></section>
    <section className="audience-grid"><article className="audience-card students"><div className="aud-icon"><GraduationCap size={20}/></div><h3>For students</h3><p>Turn your skills into a plan. Build at your own pace and see how each step changes your opportunities.</p><Link to="/login?tab=signup">Start your profile <ArrowRight size={15}/></Link></article><article className="audience-card placement"><div className="aud-icon"><BriefcaseBusiness size={20}/></div><h3>For placement cells</h3><p>See cohort strengths, support students who need a review, and coordinate supervised sessions.</p><Link to="/login?tab=signup">Explore placement tools <ArrowRight size={15}/></Link></article></section>
    <section className="trust-strip"><div><ShieldCheck/><span><b>Explainable scoring</b><small>No black box recommendations</small></span></div><div><Check/><span><b>Verified assessments</b><small>Supervised scores are clearly marked</small></span></div><div><Target/><span><b>Eligibility checked separately</b><small>Fit and eligibility stay transparent</small></span></div></section>
    <footer className="landing-footer"><Link to="/" className="brand"><span className="brand-mark"><Target size={17}/></span>InternshipFit</Link><span>Every recommendation explains why it fits, what is missing, and what to do next.</span><small>© 2026 InternshipFit · Built for students, together with placement teams</small></footer>
  </main>;
}
function LoginRoute() { return getToken() ? <Navigate to={getUser()?.role === "placement" ? "/dashboard" : "/home"} replace /> : <Login />; }
function Step({n,icon,title,body}) { return <article className="step-card"><span className="step-icon">{icon}</span><span className="step-number">{n}</span><h3>{title}</h3><p>{body}</p></article> }

function Nav() {
  const nav = useNavigate(); const user = getUser(); const [open,setOpen]=useState(false);
  if (!user || !getToken()) return null;
  const links = user.role === "student" ? [["/home","Home"],["/assessment","Assessment"],["/coding","Coding"],["/results","Results"],["/gaps","Gap report"],["/matches","Matches"]] : [["/dashboard","Dashboard"],["/sessions","Test sessions"],["/coding-assessments","Coding tests"],["/drives","Campus drives"]];
  const cls=({isActive})=>`app-nav-link ${isActive?"active":""}`;
  return <header className="app-header"><Link to={user.role==="placement"?"/dashboard":"/home"} className="brand"><span className="brand-mark"><Target size={18}/></span>InternshipFit</Link><button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label={open?"Close menu":"Open menu"}>{open?<X/>:<Menu/>}</button><nav className={open?"app-nav open":"app-nav"}>{links.map(([to,label])=><NavLink onClick={()=>setOpen(false)} key={to} to={to} className={cls}>{label}</NavLink>)}</nav><div className="user-area"><span className="user-avatar">{user.name?.[0]||"I"}</span><span className="user-name">{user.name}</span><button aria-label="Log out" className="logout-button" onClick={()=>{clearSession();nav("/");}}><LogOut size={16}/></button></div></header>;
}
export default function App(){return <><Nav/><Suspense fallback={<main className="mx-auto max-w-5xl px-6 py-12 text-center text-muted" role="status">Loading your workspace…</main>}><Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<LoginRoute/>}/><Route path="/profile" element={<Protected role="student"><Profile/></Protected>}/><Route path="/home" element={<Protected role="student"><Home/></Protected>}/><Route path="/assessment" element={<Protected role="student"><Assessment/></Protected>}/><Route path="/coding" element={<Protected role="student"><Coding/></Protected>}/><Route path="/results" element={<Protected role="student"><Results/></Protected>}/><Route path="/gaps" element={<Protected role="student"><Gaps/></Protected>}/><Route path="/matches" element={<Protected role="student"><Matches/></Protected>}/><Route path="/dashboard" element={<Protected role="placement"><Dashboard/></Protected>}/><Route path="/sessions" element={<Protected role="placement"><Sessions/></Protected>}/><Route path="/coding-assessments" element={<Protected role="placement"><CodingAssessments/></Protected>}/><Route path="/drives" element={<Protected role="placement"><Drives/></Protected>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense></>}
