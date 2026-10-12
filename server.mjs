import http from 'node:http';
import {readFileSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {Store} from './src/store.mjs';
import {Learning} from './src/learning.mjs';
import {DemoProvider} from './src/provider.mjs';
import {sampleText,cases} from './src/catalog.mjs';
import {pilotPreview,pilotSource,evaluatePilotResponses,compiledPilotRequest} from './src/visual-pilot.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const digest=s=>createHash('sha256').update(String(s)).digest();
const same=(a,b)=>timingSafeEqual(digest(a),digest(b));
export function createApp({dataDir=path.join(root,'data'),provider=new DemoProvider(),jobDelay=200,teacherPin=process.env.TEACHER_PIN||'teacher-demo',studentPin=process.env.STUDENT_PIN||'123456'}={}){
 const store=new Store(dataDir),learning=new Learning(store),auth=new Map();let busy=false;
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 async function body(req){let str='';for await(const c of req){str+=c;if(Buffer.byteLength(str)>6000000)throw new Error('文件过大');}try{return str?JSON.parse(str):{};}catch{throw new Error('请求格式无效');}}
 async function runJob(job){busy=true;job.status='running';store.saveJob(job);
  try{for(const id of job.ids){const q=store.get(id);if(!q)continue;q.status='generating';store.save(q);try{await new Promise(r=>setTimeout(r,jobDelay));store.applyCandidate(id,await provider.generate(q.source));job.completed++;}catch(e){q.status='imported';q.error=e.message;store.save(q);job.errors.push({id,message:e.message});}store.saveJob(job);}job.status=job.errors.length?'partial':'completed';}catch(e){job.status='failed';job.error=e.message;}finally{busy=false;store.saveJob(job);}
 }
 const cookieName=role=>'zhian_'+role;
 const sessions=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));
 const server=http.createServer(async(req,res)=>{
  try{const u=new URL(req.url,'http://localhost'),p=u.pathname;
   if(p.startsWith('/api/')){
    if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host)return json(res,403,{error:'不允许跨站请求'});
    if(!['GET','HEAD'].includes(req.method)&&!String(req.headers['content-type']||'').includes('application/json'))return json(res,415,{error:'仅接受 JSON 请求'});
    const match=p.match(/^\/api\/(teacher|student)(\/.*)$/);if(!match)return json(res,404,{error:'接口不存在'});
    const role=match[1],route=match[2],tokens=sessions(req),token=tokens[cookieName(role)];
    if(route==='/login'&&req.method==='POST'){
     const b=await body(req);const username=role==='teacher'?'teacher':String(b.username||'');
     if((role==='student'&&!/^student0[1-5]$/.test(username))||!same(b.password,role==='teacher'?teacherPin:studentPin))return json(res,401,{error:'账号或密码不正确'});
     if(token)auth.delete(token);const next=randomBytes(32).toString('hex');auth.set(next,{role,username,expires:Date.now()+8*3600000});
     res.setHeader('Set-Cookie',cookieName(role)+'='+next+'; HttpOnly; SameSite=Strict; Path=/api/'+role+'; Max-Age=28800');
     return json(res,200,{role,username});
    }
    const user=auth.get(token);if(!user||user.role!==role||user.expires<Date.now())return json(res,401,{error:'请先登录'});
    if(route==='/logout'&&req.method==='POST'){auth.delete(token);res.setHeader('Set-Cookie',cookieName(role)+'=; HttpOnly; SameSite=Strict; Path=/api/'+role+'; Max-Age=0');return json(res,200,{ok:true});}
    if(route==='/me')return json(res,200,{role,username:user.username});
    if(role==='teacher'){
     if(route==='/visual-pilot'&&req.method==='GET')return json(res,200,pilotPreview());
     if(route==='/visual-pilot/evaluate'&&req.method==='POST')return json(res,200,evaluatePilotResponses(await body(req)));
     const pilotSourceRoute=route.match(/^\/visual-pilot\/([^/]+)\/source$/),pilotPromptRoute=route.match(/^\/visual-pilot\/([^/]+)\/prompt$/);
     if(pilotSourceRoute&&req.method==='GET')return json(res,200,pilotSource(pilotSourceRoute[1]));
     if(pilotPromptRoute&&req.method==='GET')return json(res,200,compiledPilotRequest(pilotPromptRoute[1]));
     if(route==='/state'&&req.method==='GET')return json(res,200,{questions:store.all().filter(q=>q.status!=='archived'),jobs:store.jobs(),stats:store.stats(),settings:learning.settings(),characters:learning.characters(),cases});
     if(route==='/sample'&&req.method==='GET')return json(res,200,{text:sampleText});
     if(route==='/import'&&req.method==='POST'){const b=await body(req);if(Buffer.byteLength(String(b.text||''))>512000)throw new Error('题库超过 500 KB');return json(res,201,store.import(b.text));}
     if(route==='/generate'&&req.method==='POST'){
      if(busy)return json(res,409,{error:'已有生成任务'});
      const b=await body(req);const ids=store.all().filter(q=>['imported','rejected'].includes(q.status)&&(!Array.isArray(b.ids)||b.ids.includes(q.id))).map(q=>q.id);
      if(!ids.length)throw new Error('没有待生成题目');
      const job=store.saveJob({id:randomUUID(),status:'queued',ids,total:ids.length,completed:0,errors:[],createdAt:new Date().toISOString(),provider:'demo-fixture-v2'});void runJob(job);return json(res,202,job);
     }
     const review=route.match(/^\/questions\/([^/]+)\/review$/),withdraw=route.match(/^\/questions\/([^/]+)\/withdraw$/);
     if(review&&req.method==='POST')return json(res,200,store.review(review[1],await body(req)));
     if(withdraw&&req.method==='POST')return json(res,200,store.withdraw(withdraw[1]));
     if(route==='/settings'&&req.method==='POST')return json(res,200,learning.updateSettings(await body(req)));
     if(route==='/characters'&&req.method==='GET')return json(res,200,{characters:learning.characters()});
     if(route==='/characters'&&req.method==='POST'){
      const b=await body(req);if(!String(b.name||'').trim())throw new Error('请填写形象名称');
      const data=String(b.image||'').match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/);if(!data)throw new Error('请上传 PNG 或 JPEG');
      const raw=Buffer.from(data[2],'base64');if(raw.length>4000000)throw new Error('图片超过 4 MB');
      if(data[1]==='png'?!raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):raw[0]!==255||raw[1]!==216)throw new Error('图片格式不正确');
      const id=randomUUID();const name=id+'.'+(data[1]==='png'?'png':'jpg');const dir=path.join(root,'web/assets/uploads');mkdirSync(dir,{recursive:true});writeFileSync(path.join(dir,name),raw);
      return json(res,201,learning.addCharacter({id,name:String(b.name).slice(0,60),reference:'assets/uploads/'+name,version:1,views:[],status:'reference-only'}));
     }
     if(route==='/characters/views'&&req.method==='POST')return json(res,200,await provider.characterViews((await body(req)).characterId));
     if(route==='/characters/replace'&&req.method==='POST')return json(res,200,await provider.replaceActor(await body(req)));
    }else{
     if(route==='/home'&&req.method==='GET')return json(res,200,{available:learning.cards().length,settings:learning.settings(),character:learning.characters().find(c=>c.id===learning.settings().characterId),runs:learning.summary(user.username),username:user.username});
     if(route==='/runs'&&req.method==='POST')return json(res,201,learning.start(user.username,await body(req)));
     const run=route.match(/^\/runs\/([^/]+)$/),selection=route.match(/^\/runs\/([^/]+)\/selection$/),submit=route.match(/^\/runs\/([^/]+)\/submit$/);
     if(run&&req.method==='GET')return json(res,200,learning.view(learning.get(run[1],user.username)));
     if(selection&&req.method==='POST')return json(res,200,learning.select(selection[1],user.username,await body(req)));
     if(submit&&req.method==='POST')return json(res,200,learning.submit(submit[1],user.username));
    }
    return json(res,404,{error:'接口不存在'});
   }
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
   const publicRoot=path.join(root,'web');const resource=['/','/teacher','/student'].includes(p)?'/index.html':decodeURIComponent(p);
   const file=path.resolve(publicRoot,'.'+resource);if(!file.startsWith(publicRoot+path.sep)||!existsSync(file))return json(res,404,{error:'文件不存在'});
   const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)];
   if(!mime)return json(res,404,{error:'文件不可访问'});
   res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
  }catch(e){json(res,400,{error:e.message});}
 });
 return {server,store,learning};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||4185);createApp().server.listen(port,'127.0.0.1',()=>console.log('知安 http://127.0.0.1:'+port));}

