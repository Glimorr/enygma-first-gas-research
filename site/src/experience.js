/**
 * ORIGINAL RESEARCH EXPERIENCE — art-directed, source-data-driven motion.
 * Every graphical movement is illustrative; numbers and links come from the
 * authenticated source-driven evidence JSON, never generated fake receipts.
 */
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {createVaultScene} from "./experience-hero.js";
gsap.registerPlugin(ScrollTrigger);
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const allowHover=matchMedia("(hover:hover) and (pointer:fine)").matches;
const noMotion=matchMedia("(prefers-reduced-motion:reduce)").matches;
const limit=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const scrollToId=id=>document.getElementById(id)?.scrollIntoView({
  behavior:noMotion||document.documentElement.classList.contains("motion-paused")?"auto":"smooth",
  block:"start"
});

export function initResearchExperience({evidence,isMotionEnabled=()=>true}={}){
  if(!evidence?.secondCohort?.privateSendTx)return;
  const shouldMove=()=>!noMotion&&isMotionEnabled();
  let raf=0,alive=true,oldSection="",lastProgress=-1;
  // A small, safe verification gate: do not animate stale/mismatched case data.
  if(evidence.chainId!==7295799||evidence.secondCohort.recipientShieldedBalanceAfterRls!=="6")
    throw Error("Research scene requires the verified 2-cohort dataset");

  function setupGuide(){
    const widget=$("#research-guide"),panel=$("#guide-panel"),toggle=$("#guide-toggle"),
      close=$("#guide-close"),note=$("#guide-message"),chapter=$("#guide-chapter");
    if(!widget||!panel||!toggle)return;
    const setOpen=open=>{
      widget.dataset.open=String(open);
      panel.hidden=!open;
      toggle.setAttribute("aria-expanded",String(open));
      toggle.setAttribute("aria-label",open?"Hide research navigation guide":"Open research navigation guide");
      if(open)close?.focus();
      else toggle.focus();
    };
    toggle.addEventListener("click",()=>setOpen(panel.hidden));
    close?.addEventListener("click",()=>setOpen(false));
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!panel.hidden)setOpen(false);
    });
    $$(".guide-actions button").forEach(btn=>btn.addEventListener("click",()=>{
      scrollToId(btn.dataset.guideTarget);
      setOpen(false);
    }));
    const tips={
      hero:["THE FIRST QUESTION","Start with two fresh accounts. Follow their different funding footprints before inspecting the private payments."],
      journey:["THE PATHS SPLIT","One user received a privately funded invitation. The other had a transparent public-faucet funding trail."],
      experiment:["THE CONTROL DESIGN","The routes are actual completed tests. Select any route to open its authenticated receipt."],
      proof:["THE RECEIPT MICROSCOPE","Use the tabs to compare public transfers, encrypted note events and wallet-only observations. Each tab links to a real public transaction."],
      comparison:["THE INDEPENDENT WITNESS","Both private sends reached @rq3dev26. Its owner-wallet display increased from 3 to 6 shielded RLS."],
      fees:["WHAT THE FEE TRAIL TELLS US","Public payouts correlate with four selected private operations. Matching timing does not decrypt the hidden payment principal."],
      boundaries:["WHAT WE DIDN'T PROVE","We did not run a live privileged auditor decryption or a direct shielded-faucet deposit during the cooldown."],
      reproduce:["CHECK IT YOURSELF","The published, checksum-verified archive contains raw evidence, executable receipt checks and deliberate mutation controls."]
    };
    function updateTip(id){
      if(!tips[id]||oldSection===id)return;
      oldSection=id;
      const [name,message]=tips[id];
      chapter.textContent="NOW VIEWING · "+name;
      if(shouldMove()&&!panel.hidden){
        gsap.to(note,{autoAlpha:0,y:6,duration:.15,onComplete:()=>{
          note.textContent=message;
          gsap.fromTo(note,{autoAlpha:0,y:8},{autoAlpha:1,y:0,duration:.33,ease:"power3.out"});
        }});
      }else note.textContent=message;
    }
    const ids=Object.keys(tips);
    const watched=ids.map(id=>document.getElementById(id)).filter(Boolean);
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(visible.length)updateTip(visible[0].target.id);
    },{rootMargin:"-15% 0px -54% 0px",threshold:[0,.1,.3,.6]});
    watched.forEach(section=>observer.observe(section));
    window.addEventListener("pagehide",()=>observer.disconnect(),{once:true});
  }

  function setupLens(){
    const range=$("#lens-range"),windowEl=$(".lens-window");
    if(!range||!windowEl)return;
    const help=document.createElement("p");
    help.className="lens-focus-caption";help.setAttribute("aria-live","polite");
    help.textContent="Move the lens to compare what public RPC proves and what only the wallet owner sees.";
    $("#visibility-lens").append(help);
    const update=()=>{
      const value=Number(range.value),percentage=(value-16)/68*100;
      windowEl.style.setProperty("--lens",value+"%");
      range.style.setProperty("--slider-fill",percentage+"%");
      windowEl.classList.toggle("focus-public",value<=38);
      windowEl.classList.toggle("focus-wallet",value>=62);
      range.setAttribute("aria-valuetext",
        value<=38?"Focus on public blockchain records":value>=62?"Focus on private wallet observations":"Compare both evidence sources");
      help.textContent=value<=38
        ?"PUBLIC RPC: funding and the 20 RLS deposit are exposed, but private send amounts and recipients are not plaintext in the vault logs."
        :value>=62
          ?"OWNER-WALLET OBSERVATIONS: two 3 RLS sends to the same receiver; its shielded balance increased 3 → 6 RLS."
          :"THE TWO EVIDENCE CLASSES MUST BE KEPT SEPARATE: public encrypted-note receipts versus private owner-wallet observations.";
    };
    range.addEventListener("input",update);
    update();
  }

  function setupFeeLab(){
    const e=evidence.secondCohort;
    if(!e || !$("#fee-laboratory"))return;
    const source={
      shield:{
        tx:e.publicShieldTx,
        gross:e.publicShieldFeeRls,
        base:"3.06591360",
        share:"0.45988704",
        method:"PUBLIC SHIELD · RLS ERC-20 TRANSFERS ARE VISIBLE"
      },
      private:{
        tx:e.privateSendTx,
        gross:e.privateSendFeeGrossRls,
        base:"3.84000000",
        share:"0.57600000",
        method:"PRIVATE SEND · RELAYER PAYOUT CORRELATION, NOT DECRYPTION"
      }
    };
    // Source consistency: the decimal strings are audited values, not UI quotes.
    if(String(source.shield.gross)!=="3.52580064"||String(source.private.gross)!=="4.416"||
       String(e.privateSendFeeTreasuryRls)!=="0.576")throw Error("Fee visualization source values mismatch published audit");
    const gross=$("#lab-gross"),base=$("#lab-base"),share=$("#lab-foundation"),
      method=$("#lab-method"),link=$("#fee-case-link");
    let current="shield";
    function select(next){
      if(!source[next])return;
      const item=source[next],changed=next!==current;
      current=next;
      $$(".fee-switch button").forEach(b=>{
        const active=b.dataset.feeCase===next;
        b.classList.toggle("active",active);
        b.setAttribute("aria-pressed",String(active));
      });
      const display=next==="shield"?"3.52580064":"4.41600000";
      const set=()=>{
        gross.textContent=display;
        base.textContent=item.base+" RLS";
        share.textContent=item.share+" RLS";
        method.textContent=item.method;
      };
      if(changed&&shouldMove()){
        gsap.to([gross,base,share,method],{autoAlpha:0,y:-12,duration:.19,ease:"power2.in",
          onComplete:()=>{
            set();
            gsap.fromTo([gross,base,share,method],{autoAlpha:0,y:12},
              {autoAlpha:1,y:0,duration:.42,stagger:.065,ease:"power3.out"});
          }});
        gsap.fromTo(".fee-orb",{rotation:-9,scale:.96},
          {rotation:0,scale:1,duration:.75,ease:"elastic.out(1,.6)"});
      }else set();
      link.href="https://testnet-explorer.rayls.com/tx/"+item.tx;
    }
    $$(".fee-switch button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.feeCase)));
    select("shield");
  }

  function setupGuideNav(){
    const progress=$("#reading-progress-fill"),nav=$(".nav-wrap"),links=$$(".chapter-dots a");
    const topLinks=$$(".nav-center a");
    let active="";
    const chapters=["hero","journey","experiment","proof","comparison","fees","boundaries","reproduce"];
    const sectionMap=new Map(chapters.map(id=>[id,document.getElementById(id)]).filter(v=>v[1]));
    const onScroll=()=>{
      raf=0;
      const doc=document.documentElement;
      const max=Math.max(1,doc.scrollHeight-innerHeight);
      const value=limit(scrollY/max);
      if(progress)progress.style.width=(100*value).toFixed(2)+"%";
      if(nav)nav.classList.toggle("scrolled",scrollY>80);
      let chosen="hero";
      for(const [id,section] of sectionMap){
        const bounds=section.getBoundingClientRect();
        if(bounds.top<=innerHeight*.4)chosen=id;
      }
      if(active!==chosen){
        active=chosen;
        links.forEach(a=>{
          const on=a.dataset.chapter===chosen;
          a.classList.toggle("active",on);
          if(on)a.setAttribute("aria-current","location");
          else a.removeAttribute("aria-current");
        });
        topLinks.forEach(a=>a.classList.toggle("active",a.hash==="#"+chosen));
      }
    };
    const scrollListener=()=>{if(!raf)raf=requestAnimationFrame(onScroll)};
    window.addEventListener("scroll",scrollListener,{passive:true});
    window.addEventListener("resize",scrollListener,{passive:true});
    onScroll();
    window.addEventListener("pagehide",()=>window.removeEventListener("scroll",scrollListener),{once:true});
  }

  function setupCursorAndTilt(){
    if(!allowHover||noMotion)return;
    const aura=$("#cursor-aura");
    if(aura){
      let pending=0,x=0,y=0;
      const move=ev=>{
        x=ev.clientX;y=ev.clientY;
        if(pending)return;
        pending=requestAnimationFrame(()=>{
          aura.style.left=x+"px";aura.style.top=y+"px";pending=0;
        });
      };
      window.addEventListener("pointermove",move,{passive:true});
      aura.style.opacity=".85";
      window.addEventListener("pagehide",()=>window.removeEventListener("pointermove",move),{once:true});
    }
    const cards=$$(".route-card,.cohort-card");
    cards.forEach(el=>{
      const move=ev=>{
        if(!shouldMove())return;
        const bounds=el.getBoundingClientRect();
        const xx=(ev.clientX-bounds.left)/bounds.width;
        const yy=(ev.clientY-bounds.top)/bounds.height;
        el.style.setProperty("--card-x",(xx*100).toFixed(2)+"%");
        el.style.setProperty("--card-y",(yy*100).toFixed(2)+"%");
        gsap.to(el,{rotationY:(xx-.5)*7,rotationX:(.5-yy)*6,
          duration:.68,ease:"power3.out",overwrite:"auto"});
      };
      const leave=()=>gsap.to(el,{rotationX:0,rotationY:0,duration:.8,ease:"elastic.out(1,.65)"});
      el.addEventListener("pointermove",move,{passive:true});
      el.addEventListener("pointerleave",leave);
      el.addEventListener("blur",leave);
    });
    $$(".magnet").forEach(el=>{
      el.addEventListener("pointermove",ev=>{
        if(!shouldMove())return;
        const r=el.getBoundingClientRect();
        const x=(ev.clientX-(r.left+r.width/2))*.13;
        const y=(ev.clientY-(r.top+r.height/2))*.13;
        gsap.to(el,{x,y,duration:.38,ease:"power3.out",overwrite:"auto"});
      },{passive:true});
      el.addEventListener("pointerleave",()=>gsap.to(el,{x:0,y:0,duration:.5,ease:"elastic.out(1,.55)"}));
    });
  }

  function setupJourney(){
    const journey=$("#journey"),scenes=$$(".journey-scene");
    if(!journey||scenes.length!==4)return;
    const percent=$("#journey-pct"),index=$("#journey-index"),
      fill=$("#journey-rail-fill");
    const paths=[$("#path-invite"),$("#path-faucet")];
    const particles=[$("#route-particle-a"),$("#route-particle-b")];
    const routeInfo=paths.map(p=>{
      if(!p)return null;
      const length=p.getTotalLength();
      return {path:p,length};
    });
    const fixed=new Map();
    let last=-1;
    function setProgress(raw,force=false){
      const value=limit(raw),step=Math.min(3,Math.floor(value*4));
      if(percent)percent.textContent=String(Math.round(value*100)).padStart(2,"0");
      if(fill)fill.style.width=(value*100)+"%";
      if(index)index.textContent=String(step+1).padStart(2,"0");
      $$(".journey-stops button").forEach((b,i)=>b.classList.toggle("active",i===step));
      if(last!==step || force){
        last=step;
        scenes.forEach((scene,i)=>{
          const active=step===i;
          scene.classList.toggle("active",active);
          if(!shouldMove()){
            gsap.set(scene,{autoAlpha:active?1:0,y:0});
          }else{
            gsap.to(scene,{autoAlpha:active?1:0,y:active?0:i<step?-20:22,
              duration:.48,ease:"power3.out",overwrite:true});
          }
        });
        const urls=[
          "#experiment",
          "https://testnet-explorer.rayls.com/tx/"+evidence.secondCohort.registrationTx,
          "https://testnet-explorer.rayls.com/tx/"+evidence.secondCohort.privateSendTx,
          "#proof"
        ];
        const btn=$("#journey-link");
        if(btn){
          const href=urls[step];btn.href=href;
          btn.textContent=["Compare the three routes ↗","See public registration receipt ↗",
             "Inspect the second private send ↗","Inspect every receipt ↗"][step];
          if(href.startsWith("https")){btn.target="_blank";btn.rel="noopener noreferrer"}
          else{btn.removeAttribute("target");btn.removeAttribute("rel")}
        }
      }
      // The illustrated moving packets are not minted onchain transactions.
      const travel=limit(value*1.14);
      routeInfo.forEach((v,i)=>{
        if(!v)return;
        const pos=v.path.getPointAtLength(v.length*travel);
        particles[i]?.setAttribute("cx",String(pos.x));
        particles[i]?.setAttribute("cy",String(pos.y));
        v.path.style.strokeDasharray=String(v.length);
        v.path.style.strokeDashoffset=String(v.length*(1-travel));
      });
    }
    function isDesktopJourney(){return innerWidth>950&&shouldMove()}
    let trigger=null;
    function createTrigger(){
      trigger?.kill();
      trigger=null;
      if(!isDesktopJourney()){
        // In mobile and reduced-motion mode, all four complete text acts are
        // displayed in normal document flow. No scroll trapping.
        scenes.forEach(s=>{
          s.classList.add("active");
          gsap.set(s,{clearProps:"all"});
        });
        routeInfo.forEach((v,i)=>{
          if(!v)return;
          v.path.style.strokeDasharray="";
          v.path.style.strokeDashoffset="";
          const pos=v.path.getPointAtLength(v.length);
          particles[i]?.setAttribute("cx",String(pos.x));
          particles[i]?.setAttribute("cy",String(pos.y));
        });
        return;
      }
      last=-1;
      setProgress(0,true);
      trigger=ScrollTrigger.create({
        trigger:journey,start:"top top",end:"bottom bottom",
        invalidateOnRefresh:true,onUpdate:self=>setProgress(self.progress)
      });
      setProgress(trigger.progress,true);
    }
    createTrigger();
    let resizeId=0;
    window.addEventListener("resize",()=>{
      clearTimeout(resizeId);
      resizeId=setTimeout(createTrigger,180);
    },{passive:true});
    $$(".journey-stops button").forEach((button,i)=>{
      button.addEventListener("click",()=>{
        if(!isDesktopJourney()){
          scenes[i].scrollIntoView({behavior:shouldMove()?"smooth":"auto",block:"center"});
          return;
        }
        const length=journey.offsetHeight-innerHeight;
        window.scrollTo({top:journey.offsetTop+length*(i+.45)/4,
          behavior:shouldMove()?"smooth":"auto"});
      });
    });
    if(allowHover&&!noMotion){
      const diagram=$(".journey-diagram");
      diagram?.addEventListener("pointermove",ev=>{
        if(!shouldMove())return;
        const rect=diagram.getBoundingClientRect();
        const x=(ev.clientX-(rect.left+rect.width/2))/rect.width;
        const y=(ev.clientY-(rect.top+rect.height/2))/rect.height;
        gsap.to(diagram,{rotationY:x*6,rotationX:-y*6,duration:.8,ease:"power3.out"});
      },{passive:true});
      diagram?.addEventListener("pointerleave",()=>gsap.to(diagram,{rotationX:0,rotationY:0,duration:.8,ease:"power3.out"}));
    }
  }

  function setupProofAndBars(){
    const onChange=()=>{
      if(!shouldMove())return;
      const rows=$$("#proof-readout .readout-item");
      gsap.fromTo(rows,{opacity:0,y:17},{opacity:1,y:0,stagger:.036,duration:.4,ease:"power3.out"});
      gsap.fromTo($$("#proof-meta .meta-card"),{opacity:.5,scale:.92},
        {opacity:1,scale:1,stagger:.045,duration:.4,ease:"back.out(1.5)"});
      gsap.fromTo($$("#proof-graphic .diagram-node"),{scale:.85,opacity:.5},
        {scale:1,opacity:1,stagger:.1,duration:.65,ease:"elastic.out(1,.6)"});
    };
    document.addEventListener("proofchange",onChange);
    const proofGraphic=$("#proof-graphic");
    if(proofGraphic){
      const status=document.createElement("div");
      status.className="proof-source-caption";
      status.innerHTML='<i></i> ARCHIVED PUBLIC RECEIPT · ILLUSTRATIVE TOPOLOGY';
      proofGraphic.append(status);
    }
  }

  function setupScrollChoreography(){
    if(!shouldMove())return;
    const t={ease:"power3.out"};
    const heroLines=$$(".hero-head .char-mask");
    gsap.fromTo(heroLines,{yPercent:125,opacity:0,rotation:4},
      {yPercent:0,opacity:1,rotation:0,duration:1.22,stagger:.12,ease:"expo.out",delay:.2});
    gsap.fromTo($$(".hero-head .period"),{scale:0,rotation:-70,opacity:0},
      {scale:1,rotation:0,opacity:1,duration:1,ease:"elastic.out(1,.5)",delay:.98});
    gsap.fromTo($$(".hero .eyebrow,.hero-summary,.hero-ctas,.hero-metrics>div"),
      {opacity:0,y:28},{opacity:1,y:0,duration:1.1,stagger:.085,delay:.25,ease:"power3.out"});
    gsap.to(".hero-head",{y:-55,scale:.965,transformOrigin:"left center",
      ease:"none",scrollTrigger:{trigger:"#hero",start:"top top",end:"bottom top",scrub:1}});
    gsap.to(".hero-orbit-hud",{y:-145,rotation:12,ease:"none",
      scrollTrigger:{trigger:"#hero",start:"top top",end:"bottom top",scrub:1}});
    gsap.to(".hero-aurora",{y:-120,scale:1.1,ease:"none",
      scrollTrigger:{trigger:"#hero",start:"top top",end:"bottom top",scrub:1}});
    const revealTargets=$$(".chapter .section-head h2,.chapter .section-head p,.section-label,.route-detail,.cohort-foot,.private-metadata,.fee-laboratory,.visibility-lens,.repro-terminal,.repro-side");
    revealTargets.forEach(el=>{
      gsap.fromTo(el,{opacity:0,y:el.matches("h2")?55:25,rotateX:el.matches("h2")?4:0},
        {opacity:1,y:0,rotateX:0,duration:1.05,ease:"power3.out",scrollTrigger:{
          trigger:el,start:"top 92%",once:true
        }});
    });
    const cardGroups=[".route-card",".cohort-card",".proof-tabs",".proof-sidebar",
      ".fee-primary",".fee-chart-panel","#boundary-list article"];
    cardGroups.forEach(sel=>{
      ScrollTrigger.batch(sel,{start:"top 94%",once:true,
        onEnter:els=>gsap.fromTo(els,{autoAlpha:0,y:58,rotateX:3},
          {autoAlpha:1,y:0,rotateX:0,duration:.9,stagger:.095,ease:"power3.out"})});
    });
    gsap.to(".statement-top p",{xPercent:-9,scale:1.06,transformOrigin:"left center",
      ease:"none",scrollTrigger:{trigger:".statement",start:"top 95%",end:"bottom 20%",scrub:1}});
    gsap.to(".statement .asterisk",{rotation:180,y:90,
      ease:"none",scrollTrigger:{trigger:".statement",start:"top bottom",end:"bottom top",scrub:1}});
    gsap.fromTo(".kinetic-row:first-child",{xPercent:-14},{xPercent:10,ease:"none",
      scrollTrigger:{trigger:".kinetic-break",start:"top bottom",end:"bottom top",scrub:1}});
    gsap.fromTo(".kinetic-row:nth-child(2)",{xPercent:16},{xPercent:-12,ease:"none",
      scrollTrigger:{trigger:".kinetic-break",start:"top bottom",end:"bottom top",scrub:1}});
    gsap.fromTo($$("#payout-chart .bar-column"),{scaleY:.03,transformOrigin:"bottom center"},
      {scaleY:1,duration:1.45,stagger:.065,ease:"elastic.out(1,.6)",
        scrollTrigger:{trigger:"#payout-chart",start:"top 89%",once:true}});
    gsap.fromTo(".fee-orb",{rotate:-55,scale:.82,opacity:.1},
      {rotate:0,scale:1,opacity:1,duration:1.5,ease:"power3.out",
        scrollTrigger:{trigger:"#fee-laboratory",start:"top 87%",once:true}});
    gsap.to(".closing-orbit",{rotation:270,ease:"none",
      scrollTrigger:{trigger:".closing",start:"top bottom",end:"bottom bottom",scrub:1}});
    gsap.fromTo(".closing h2",{opacity:0,y:90,letterSpacing:"-.12em"},
      {opacity:1,y:0,letterSpacing:"-.07em",duration:1.2,ease:"power3.out",
        scrollTrigger:{trigger:".closing",start:"top 83%",once:true}});
    ScrollTrigger.refresh();
  }
  setupGuide();
  setupLens();
  setupFeeLab();
  setupGuideNav();
  setupCursorAndTilt();
  setupJourney();
  setupProofAndBars();
  setupScrollChoreography();
  if(shouldMove())createVaultScene({isMotionEnabled:shouldMove}).catch(err=>console.info("Decorative WebGL unavailable",err));
  const onMotion=()=>{
    document.documentElement.classList.toggle("motion-paused",!shouldMove());
    gsap.globalTimeline.paused(!shouldMove());
    ScrollTrigger.getAll().forEach(t=>shouldMove()?t.enable():t.disable(false));
    if(shouldMove())ScrollTrigger.refresh();
  };
  window.addEventListener("researchmotion",onMotion);
  if(noMotion)document.documentElement.classList.add("motion-paused");
  window.addEventListener("pagehide",()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener("researchmotion",onMotion)},{once:true});
}
