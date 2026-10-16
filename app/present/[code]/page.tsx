'use client';
import {useParams} from 'next/navigation';
import {useLive,useResults} from '@/lib/hooks';
import {Slide} from '@/lib/supabase';
import {useEffect,useRef,useState} from 'react';

function FittedTitle({text}:{text:string}){
 const container=useRef<HTMLDivElement>(null);const measure=useRef<HTMLSpanElement>(null);const [size,setSize]=useState(74);
 useEffect(()=>{
  let active=true;
  const fit=()=>{
   if(!container.current||!measure.current||!active)return;
   const width=container.current.clientWidth;
   const natural=measure.current.getBoundingClientRect().width;
   if(width>0&&natural>0)setSize(Math.min(74,Math.max(12,74*width/natural*.985)));
  };
  const observer=new ResizeObserver(fit);if(container.current)observer.observe(container.current);
  fit();document.fonts?.ready.then(fit);
  return()=>{active=false;observer.disconnect()};
 },[text]);
 return <div ref={container} className="fittedQuestion"><span className="fittedMeasure" ref={measure} aria-hidden="true">{text}</span><h1 style={{fontSize:size}}>{text}</h1></div>;
}
function ScaleGauge({answers}:{answers:{value:string}[]}){
 const counts=Array.from({length:5},(_,i)=>answers.filter(a=>a.value===String(i+1)).length);
 const total=counts.reduce((a,b)=>a+b,0);
 const average=total?counts.reduce((sum,n,i)=>sum+n*(i+1),0)/total:null;
 const percent=average===null?0:(average-1)/4*100;
 return <section className="scalePanel" aria-label="척도형 설문 결과">
  <div className="scaleGaugeWrap">
   <svg className="scaleGaugeSvg" viewBox="0 0 360 210" role="img" aria-label={average===null?'응답 대기 중':`평균 ${average.toFixed(1)}점 / 5점`}>
    <defs><linearGradient id="genieScaleGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ab8ef8"/><stop offset="58%" stopColor="#e6b6db"/><stop offset="100%" stopColor="#ffdc82"/></linearGradient></defs>
    <path d="M 40 175 A 140 140 0 0 1 320 175" fill="none" stroke="#ffffff2d" strokeWidth="25" strokeLinecap="round" />
    {average!==null&&<path d="M 40 175 A 140 140 0 0 1 320 175" fill="none" stroke="url(#genieScaleGradient)" strokeWidth="25" strokeLinecap="round" pathLength="100" strokeDasharray={`${percent} 100`} className="scaleGaugeProgress"/>}
    <text x="180" y="132" textAnchor="middle" className="scaleGaugeValue">{average===null?'—':average.toFixed(1)}</text>
    <text x="180" y="165" textAnchor="middle" className="scaleGaugeUnit">평균 점수 / 5.0</text>
    <text x="36" y="203" className="scaleGaugeEdge">1점</text><text x="293" y="203" className="scaleGaugeEdge">5점</text>
   </svg>
   <div className="scaleCount">총 {total}명 참여</div>
  </div>
  <div className="scaleDistribution" aria-label="점수별 응답 분포">
   {counts.map((n,i)=><div key={i} className="scaleColumn"><b>{n}명 <span>{total?Math.round(n/total*100):0}%</span></b><div className="scaleBarBox"><div className="scaleBar" style={{height:`${total?n/total*100:0}%`}}/></div><strong>{i+1}점</strong></div>)}
  </div>
 </section>;
}
function Visual({slide,answers}:{slide:Slide;answers:{value:string}[]}){if(slide.type==='content')return <div className="center"><p style={{fontSize:32,lineHeight:1.7}}>{slide.description}</p></div>;
if(slide.type==='word'){const counts=new Map<string,number>();answers.forEach(a=>{const word=a.value.trim().slice(0,60);counts.set(word,(counts.get(word)||0)+1)});const max=Math.max(...counts.values(),1);return <div className="center" style={{padding:35}}>{[...counts].sort((a,b)=>b[1]-a[1]).map(([word,c],i)=><span key={word} style={{display:'inline-block',fontSize:Math.min(70,20+50*c/max),fontWeight:800,padding:12,color:['#fff','#c8f7ff','#ffde89','#ffe2f1'][i%4]}}>{word}</span>)}</div>}
if(slide.type==='scale')return <ScaleGauge answers={answers}/>;
if(slide.type==='opinion'||slide.type==='qa')return <div className="grid">{answers.slice(-30).reverse().map((a,i)=><div className="card" key={i} style={{fontSize:21,overflowWrap:'anywhere'}}>💬 {a.value}</div>)}</div>;
const opts=slide.type==='scale'?['1점','2점','3점','4점','5점']:slide.options;const counts=opts.map((_o,i)=>answers.filter(a=>a.value===String(slide.type==='scale'?i+1:i)).length);return <div className="stack" style={{maxWidth:1050,margin:'0 auto'}}>{opts.map((label,i)=><div className="card resultCard" key={i} style={{padding:17}}><div className="row between"><div className="row"><span className="choiceNumber">{i+1}</span><b style={{fontSize:20}}>{label}</b></div><b>{counts[i]}표 · {answers.length?Math.round(100*counts[i]/answers.length):0}% {slide.type==='quiz'&&slide.correct_index===i?'✅':''}</b></div><div className="barTrack" style={{marginTop:12}}><div className="barFill" style={{width:(answers.length?100*counts[i]/answers.length:0)+'%'}}/></div></div>)}</div>}
export default function Present(){const code=String(useParams().code||'').toUpperCase();const {session,slides,loading}=useLive(code);const slide=slides.find(s=>s.id===session?.active_slide_id);const {answers,count}=useResults(slide?.id,session?.show_results===true);const [showCode,setShowCode]=useState(true);const [qrLarge,setQrLarge]=useState(false);const joinUrl=typeof window!=='undefined'?`${window.location.origin}/join/${code}`:`https://youth-live.vercel.app/join/${code}`;const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(joinUrl)}`;const slideNumber=slides.findIndex(s=>s.id===slide?.id)+1;return <main className="present presentRevamped"><div className="row between"><div className="logo" style={{color:'white'}}>GENIE<span>:Q</span></div><div className="row"><span className="pill">{session?.title||'활동 연결 중'}</span><button className="btn secondary" onClick={()=>setShowCode(!showCode)}>참여 QR {showCode?'숨기기':'표시'}</button><button className="btn secondary" onClick={()=>document.documentElement.requestFullscreen?.()}>⛶ 전체화면</button></div></div>{loading?<div className="center"><h2>화면 연결 중...</h2></div>:!session?<div className="center"><h2>활동이 없어요.</h2></div>:<>{showCode&&<button className="presentQr" onClick={()=>setQrLarge(true)} title="QR 확대"><img src={qrUrl} alt="참여 QR 코드"/><small>QR 스캔 후 참여</small></button>}{slide?<><div className="center presentQuestion"><span className="questionLabel">✦ QUESTION {String(slideNumber).padStart(2,'0')}</span><FittedTitle text={slide.title}/>{slide.type!=='content'&&slide.description&&<p className="questionDescription">{slide.description}</p>}</div>{session.show_results?<><Visual slide={slide} answers={answers}/><p className="center" style={{fontSize:23}}>참여 응답 {count}개 · 공개 응답 {answers.length}개</p></>:<div className="center" style={{padding:'80px 10px'}}><div className="big">🎉 의견을 모으는 중!</div><h2>여러분의 답변을 기다리고 있어요.</h2><p>진행자가 결과를 공개하면 이곳에 나타나요.</p></div>}</>:<div className="center" style={{padding:'100px 10px'}}><div className="big">🙌 모두 준비됐나요?</div><h2>진행자가 슬라이드를 시작하면 이곳에 표시돼요.</h2></div>}</>}{qrLarge&&<div className="qrBackdrop" onClick={()=>setQrLarge(false)}><div className="qrModal" onClick={e=>e.stopPropagation()}><h2>QR로 바로 참여하기</h2><img src={qrUrl} alt="확대한 QR 코드"/><p>참여 코드 {code}</p><button className="btn" onClick={()=>setQrLarge(false)}>닫기</button></div></div>}</main>}
