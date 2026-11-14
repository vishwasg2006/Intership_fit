import fs from "node:fs/promises";
import { randomInt } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../src/db.js";
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "../.env") });
const root = path.resolve(here, "../..");
const csv = async (name) => parse(await fs.readFile(path.join(root, "data", name), "utf8"), { columns: true, skip_empty_lines: true, bom: true });
const migration = await fs.readFile(path.join(here, "../migrations/001_initial.sql"), "utf8");
const q = (s) => s.replaceAll("'", "''");
if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) { console.error("Refusing to wipe the database in production. Pass --force to override."); process.exit(1); }
try {
  await pool.query("DROP TABLE IF EXISTS coding_assessments, email_verifications, password_resets, drive_responses, shortlists, drives, attempts, sessions, resources, questions, internship_skills, internships, student_profiles, users CASCADE;");
  await pool.query(migration);
  const [internships, skills, questions, resources] = await Promise.all([csv("internships_collected.csv"), csv("internship_skills_collected.csv"), csv("question_bank.csv"), csv("resources.csv")]);
  for (const i of internships) await pool.query(`INSERT INTO internships (internship_id,title,company,company_type,location,mode,stipend_inr_month,duration_months,deadline,allowed_branches,allowed_years,min_cgpa,apply_url,source,data_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [i.internship_id,i.title,i.company,i.company_type||null,i.location,i.mode,i.stipend_inr_month===""?null:Number(i.stipend_inr_month),i.duration_months===""?null:Number(i.duration_months),i.deadline||null,i.allowed_branches?i.allowed_branches.split("|"):[],i.allowed_years?i.allowed_years.split("|").map(Number):[],i.min_cgpa===""?null:Number(i.min_cgpa),i.apply_url,i.source,i.data_status]);
  for (const s of skills) await pool.query("INSERT INTO internship_skills (internship_id,skill,min_score,weight) VALUES ($1,$2,$3,$4)",[s.internship_id,s.skill,Number(s.min_score),Number(s.weight)]);
  for (const item of questions) await pool.query("INSERT INTO questions (question_id,skill,difficulty,weight,question,options,correct_option,explanation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",[item.question_id,item.skill,item.difficulty,Number(item.weight),item.question,JSON.stringify({A:item.option_a,B:item.option_b,C:item.option_c,D:item.option_d}),item.correct_option,item.explanation]);
  for (const item of resources) await pool.query("INSERT INTO resources (skill,title,url) VALUES ($1,$2,$3)",[item.skill,item.title,item.url]);
  const passwordHash = await bcrypt.hash("Demo@123", 10);
  const addUser = async (name,email,role,profile=null) => {
    const u=(await pool.query("INSERT INTO users(name,email,password_hash,role,email_verified) VALUES($1,$2,$3,$4,true) RETURNING id",[name,email,passwordHash,role])).rows[0];
    if(profile) await pool.query("INSERT INTO student_profiles(user_id,college,branch,year,cgpa,consent_share) VALUES($1,$2,$3,$4,$5,$6)",[u.id,profile.college,profile.branch,profile.year,profile.cgpa,profile.consent]);
    return u.id;
  };
  const studentDefs=[
    ["Aarav Nair","strong@demo.test","CSE",4,8.4,[90,90,90,90],"supervised","completed","ok",[]],
    ["Meera Das","medium@demo.test","ECE",3,7.2,[54,10,100,100],"practice","completed","ok",[]],
    ["Rohan Patil","weak@demo.test","Diploma-CS",2,6.2,[10,10,10,10],"practice","terminated","review",["TERMINATED_3_VIOLATIONS"]]
  ];
  const demoIds=[];
  for(const [name,email,branch,year,cgpa,scoreValues,mode,status,integrity,reasons] of studentDefs){
    const id=await addUser(name,email,"student",{college:"Demo Institute of Technology",branch,year,cgpa,consent:true}); demoIds.push(id);
    const skillScores=["aptitude","programming","web","dbms"].map((skill,index)=>({skill,score:scoreValues[index]}));
    const overall=Math.round(skillScores.reduce((sum,item)=>sum+item.score,0)/skillScores.length);
    await pool.query("INSERT INTO attempts(id,user_id,mode,status,question_map,answers,started_at,time_limit_seconds,violations_used,overall,skill_scores,taken_at,integrity_status,integrity_reasons) VALUES(gen_random_uuid(),$1,$2,$3,'[]','[]',now()-interval '1 day',2400,$4,$5,$6::jsonb,now()-interval '1 day',$7,$8)",[id,mode,status,status==="terminated"?3:0,overall,JSON.stringify(skillScores),integrity,reasons]);
  }
  const placementId=await addUser("Placement Officer","placement@demo.test","placement");
  const branches=["CSE","ISE","ECE","EEE","Mech","Diploma-CS","ITI-COPA"];
  for(let n=1;n<=28;n++){
    const branch=branches[(n-1)%branches.length], year=2+(n%3), overall=39+((n*17)%58), name=`Student ${String(n).padStart(2,"0")}`;
    const id=await addUser(name,`student${n}@cohort.demo.test`,"student",{college:`${branch} Institute`,branch,year,cgpa:Number((5.5+((n*13)%35)/10).toFixed(1)),consent:n%9!==0});
    const ss=["aptitude","programming","web","dbms"].map((skill,j)=>({skill,score:Math.max(0,Math.min(100,overall+(((n+j*7)%21)-10)))}));
    await pool.query("INSERT INTO attempts(id,user_id,mode,status,question_map,answers,started_at,time_limit_seconds,violations_used,overall,skill_scores,taken_at,integrity_status,integrity_reasons) VALUES(gen_random_uuid(),$1,$2,'completed','[]','[]',now()-interval '2 days',2400,$3,$4,$5::jsonb,now()-interval '2 days',$6,$7)",[id,n%4===0?"supervised":"practice",n%9===0?2:0,overall,JSON.stringify(ss),n%9===0?"review":"ok",n%9===0?["MULTIPLE_VIOLATIONS"]:[]]);
  }
  for(let n=1;n<=3;n++) await pool.query("INSERT INTO drives(company,role,date,deadline,min_cgpa,min_score,branches) VALUES($1,$2,current_date+$3::int,current_date+$4::int,$5,$6,$7)",[["Northstar Labs","BrightPath Digital","Greenfield Systems"][n-1],["Software intern","Web development intern","Data operations intern"][n-1],n*7,n*7+3,6.5+n*.2,55+n*5,branches.slice(0,3+n)]);
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join("");
  await pool.query("INSERT INTO sessions(code,title,per_skill,time_limit_minutes,status,created_by) VALUES($1,'Campus practice lab',5,40,'active',$2)",[code,placementId]);
  console.log(`Seeded ${internships.length} internships, ${questions.length} questions, ${resources.length} learning resources.`);
  console.log(`Demo logins use password Demo@123. Active supervised session code: ${code}`);
} catch (err) { console.error(err); process.exitCode=1; } finally { await pool.end(); }
