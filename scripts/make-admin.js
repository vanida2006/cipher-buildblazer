#!/usr/bin/env node
require('dotenv').config();
const bcrypt=require('bcryptjs');
const db=require('../server/db');
const ROLES=['SUPER_ADMIN','EVENT_MANAGER','CONTENT_MANAGER'];

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:'';}

async function hidden(question){
  if(!process.stdin.isTTY){
    const value=process.env.ADMIN_PASSWORD||'';
    if(!value) throw new Error('Non-interactive mode requires ADMIN_PASSWORD.');
    return value;
  }
  process.stdout.write(question);
  return new Promise((resolve,reject)=>{
    const stdin=process.stdin; let value=''; const wasRaw=stdin.isRaw;
    stdin.setRawMode(true); stdin.resume();
    const cleanup=()=>{stdin.setRawMode(wasRaw);stdin.pause();process.stdout.write('\n');stdin.removeListener('data',onData);};
    const onData=(buf)=>{
      const ch=buf.toString();
      if(ch==='\u0003'){cleanup();reject(new Error('Cancelled'));return;}
      if(ch==='\r'||ch==='\n'){cleanup();resolve(value);return;}
      if(ch==='\u007f'){value=value.slice(0,-1);return;}
      value+=ch;
    };
    stdin.on('data',onData);
  });
}
(async()=>{
  const name=arg('--name'), email=(arg('--email')||'').trim().toLowerCase(), role=(arg('--role')||'SUPER_ADMIN').toUpperCase();
  if(!name||!email||!ROLES.includes(role)){console.error('Usage: node scripts/make-admin.js --name "Name" --email admin@example.com --role SUPER_ADMIN');process.exit(1);}
  const password=await hidden('Password (min 12 chars): '), confirm=await hidden('Confirm password: ');
  if(password.length<12) throw new Error('Password must be at least 12 characters.');
  if(password!==confirm) throw new Error('Passwords do not match.');
  const hash=bcrypt.hashSync(password,12);
  const existing=db.prepare('SELECT id FROM admins WHERE email=? COLLATE NOCASE').get(email);
  if(existing){
    db.prepare("UPDATE admins SET name=?,email=?,username=COALESCE(NULLIF(username,''),?),role=?,password_hash=?,status='ACTIVE',session_version=session_version+1,updated_at=datetime('now') WHERE id=?")
      .run(name,email,email,role,hash,existing.id);
    console.log('Admin updated:',email);
  } else {
    db.prepare("INSERT INTO admins(name,email,username,password_hash,role,status) VALUES(?,?,?,?,?,'ACTIVE')")
      .run(name,email,email,hash,role);
    console.log('Admin created:',email);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
