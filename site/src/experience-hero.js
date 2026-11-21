/**
 * ORIGINAL RAYLS RESEARCH VISUALIZATION — procedural cinematic vault.
 * An illustrative WebGL sculpture only: NOT an actual representation of
 * account key material, a commitment proof or a blockchain transaction.
 * Source-controlled data is presented separately in the evidence section.
 */
export async function createVaultScene({isMotionEnabled=()=>true}={}){
  const canvas=document.getElementById("hero-canvas");
  if(!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches ||
     innerWidth<530 || !("WebGL2RenderingContext" in window))return ()=>{};
  let THREE,renderer;
  try{
    THREE=await import("three");
    renderer=new THREE.WebGLRenderer({
      canvas,alpha:true,antialias:devicePixelRatio<1.8,
      powerPreference:"high-performance",preserveDrawingBuffer:false
    });
  }catch(error){
    console.info("Procedural illustration unavailable; research remains fully accessible",String(error));
    return ()=>{};
  }
  const compact=innerWidth<1000;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact?1.2:1.55));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.27;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);
  camera.position.set(0,0,16.6);

  const root=new THREE.Group();
  const sculpture=new THREE.Group();
  root.add(sculpture);
  scene.add(root);
  const shellMat=new THREE.MeshPhysicalMaterial({
    color:0x8e6dcb,roughness:.23,metalness:.52,transparent:true,opacity:.64,
    clearcoat:1,clearcoatRoughness:.13,side:THREE.DoubleSide,depthWrite:false,
    emissive:0x1e0e47,emissiveIntensity:.38
  });
  const prismMat=new THREE.MeshPhysicalMaterial({
    color:0x7e51d0,metalness:.68,roughness:.18,clearcoat:1,flatShading:true,
    emissive:0x421980,emissiveIntensity:.66
  });
  const lime=new THREE.MeshStandardMaterial({
    color:0xe7fd4c,metalness:.3,roughness:.18,emissive:0x779b06,
    emissiveIntensity:.95
  });
  const lilac=new THREE.MeshStandardMaterial({
    color:0xbba1fa,metalness:.4,roughness:.18,emissive:0x40326d,
    emissiveIntensity:.6
  });
  const dark=new THREE.MeshPhysicalMaterial({
    color:0x291c51,metalness:.75,roughness:.21,
    emissive:0x271550,emissiveIntensity:.5
  });
  const inner=new THREE.Mesh(new THREE.DodecahedronGeometry(1.12,2),prismMat);
  inner.rotation.set(.16,.42,-.21);
  const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.95,3),shellMat);
  const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(2.02,1),
    new THREE.MeshBasicMaterial({color:0xc8aaff,wireframe:true,transparent:true,opacity:.47,depthWrite:false}));
  sculpture.add(inner,shell,wire);
  // Three physically different envelopes: radial tracks carry illustrated
  // "notes"; no assertion that the orbit is a deployed protocol structure.
  const orbital=new THREE.Group();sculpture.add(orbital);
  const rings=[];
  for(let i=0;i<5;i++){
    const mat=new THREE.MeshBasicMaterial({
      color:i===1 || i===4?0xdaf357:0x9f7be2,transparent:true,
      opacity:i===1?.8:.34,side:THREE.DoubleSide,depthWrite:false
    });
    const torus=new THREE.Mesh(new THREE.TorusGeometry(2.7+i*.37,.013+(i%2)*.008,5,220),mat);
    torus.rotation.set((i%2?1.2:.4)+i*.36,i*.32,.1+i*.38);
    torus.userData={baseY:torus.rotation.y,speed:(i%2?1:-1)*(.00038+i*.00007)};
    orbital.add(torus);rings.push(torus);
  }
  // Dotted circuit tracks at distinct depths make scroll rotation legible.
  const points=new THREE.Group();sculpture.add(points);
  const paths=[];
  for(let track=0;track<3;track++){
    const particles=[];
    const radius=2.5+track*.64;
    const count=132;
    const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const theta=2*Math.PI*i/count;
      const x=Math.cos(theta)*radius,z=Math.sin(theta)*radius;
      pos[i*3]=x;pos[i*3+1]=Math.sin(theta*(track+2))*.55;
      pos[i*3+2]=z*.7;
      particles.push([x,pos[i*3+1],z*.7]);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({
      color:track===0?0xe7fd4c:0xd0b8ff,
      size:.025+track*.006,transparent:true,opacity:track===0?.65:.32,
      depthWrite:false,blending:THREE.AdditiveBlending
    }));
    pts.rotation.set(.8+track*.23,track*.32,.55+track*.1);
    points.add(pts);
    paths.push(pts);
  }
  const satellites=new THREE.Group();sculpture.add(satellites);
  const tetra=new THREE.TetrahedronGeometry(.08,0);
  const octa=new THREE.OctahedronGeometry(.095,0);
  const noteMeshes=[];
  for(let i=0;i<28;i++){
    const theta=(2*Math.PI*i/28);
    const radius=3.1+(.65*Math.sin(i*1.15));
    const g=new THREE.Mesh(i%3===0?octa:tetra,i%5===0?lime:i%3===0?lilac:dark);
    g.position.set(radius*Math.cos(theta),.6*Math.sin(theta*2.3),radius*.48*Math.sin(theta));
    g.rotation.set(i*.2,i*.32,i*.4);
    g.scale.setScalar(.7+(i%4)*.22);
    satellites.add(g);
    noteMeshes.push(g);
  }
  // Soft shader-like glow without heavy post-processing or external textures.
  function makeGlow(hex,size,opacity){
    const n=128,cnv=document.createElement("canvas");
    cnv.width=n;cnv.height=n;
    const ctx=cnv.getContext("2d");
    const grad=ctx.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);
    grad.addColorStop(0,hex);
    grad.addColorStop(.16,hex);
    grad.addColorStop(.6,"rgba(159,112,245,.1)");
    grad.addColorStop(1,"rgba(159,112,245,0)");
    ctx.fillStyle=grad;ctx.fillRect(0,0,n,n);
    const tex=new THREE.CanvasTexture(cnv);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,transparent:true,opacity,depthWrite:false,
      blending:THREE.AdditiveBlending
    }));
    sprite.scale.set(size,size,1);
    return sprite;
  }
  const halo=makeGlow("rgba(178,113,255,.8)",9.8,.56);
  halo.position.set(0,0,-1.4);sculpture.add(halo);
  const limeHalo=makeGlow("rgba(231,253,76,.74)",3.7,.37);
  limeHalo.position.set(-1.5,-1.1,.15);sculpture.add(limeHalo);
  // Exposed "seals" and rings for the inner lock.
  const seal=new THREE.Group();sculpture.add(seal);
  for(let i=0;i<6;i++){
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(1.25+i*.105,.009,5,100),
      new THREE.MeshBasicMaterial({color:i%2?0x9a7ccb:0xe7fd4c,transparent:true,opacity:i%2?.13:.26,depthWrite:false}));
    mesh.rotation.set(Math.PI*.5,i*.28,i*.2);seal.add(mesh);
  }
  scene.add(new THREE.AmbientLight(0xc9b4ff,1.9));
  const key=new THREE.PointLight(0xf7efff,35,40);key.position.set(5,6,8);scene.add(key);
  const rim=new THREE.PointLight(0xb79af5,50,40);rim.position.set(-3,-2,4);scene.add(rim);
  const green=new THREE.PointLight(0xe7fd4c,33,30);green.position.set(2,-3,2);scene.add(green);
  // Star layer is independent from the sculpture depth.
  const starsN=compact?80:170;
  const positions=new Float32Array(starsN*3);
  const colors=new Float32Array(starsN*3);
  for(let i=0;i<starsN;i++){
    positions[3*i]=(Math.random()-.5)*27;
    positions[3*i+1]=(Math.random()-.5)*16;
    positions[3*i+2]=-3-Math.random()*7;
    const c=new THREE.Color(i%7===0?0xe7fd4c:0xb49aeb);
    colors[3*i]=c.r;colors[3*i+1]=c.g;colors[3*i+2]=c.b;
  }
  const bg=new THREE.BufferGeometry();
  bg.setAttribute("position",new THREE.BufferAttribute(positions,3));
  bg.setAttribute("color",new THREE.BufferAttribute(colors,3));
  const stars=new THREE.Points(bg,new THREE.PointsMaterial({
    size:.027,transparent:true,opacity:.8,
    vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  scene.add(stars);
  let handle=0,visible=true,disposed=false;
  const mouse={x:0,y:0};const smooth={x:0,y:0};
  let progress=0,last=0;
  const frameInterval=navigator.webdriver?1000/22:compact?1000/35:1000/48;
  const resize=()=>{
    if(disposed)return;
    const width=canvas.clientWidth,height=canvas.clientHeight;
    if(width<1||height<1)return;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    if(width>1150){root.position.x=4.1;root.scale.setScalar(.93)}
    else if(width>800){root.position.x=3.1;root.scale.setScalar(.76)}
    else{root.position.x=1.6;root.scale.setScalar(.68)}
  };
  resize();
  const onMove=e=>{
    mouse.x=(e.clientX/innerWidth-.5)*2;
    mouse.y=(e.clientY/innerHeight-.5)*2;
  };
  const onScroll=()=>{
    progress=Math.min(1,scrollY/Math.max(1,innerHeight*1.4));
  };
  window.addEventListener("pointermove",onMove,{passive:true});
  window.addEventListener("scroll",onScroll,{passive:true});
  const rObserver=new ResizeObserver(resize);
  rObserver.observe(canvas);
  const draw=(now)=>{
    if(disposed)return;
    if(!visible||document.hidden||!isMotionEnabled()){
      handle=0;return;
    }
    handle=requestAnimationFrame(draw);
    if(now-last<frameInterval)return;
    const dt=Math.min(48,now-last||16);last=now;
    const m=dt/16.67;
    smooth.x+=(mouse.x-smooth.x)*.025*m;
    smooth.y+=(mouse.y-smooth.y)*.025*m;
    sculpture.rotation.y+=.00145*m;
    sculpture.rotation.x+=.00048*m;
    root.rotation.y+=((smooth.x*.13+progress*.42)-root.rotation.y)*.022*m;
    root.rotation.x+=((-smooth.y*.095-progress*.3)-root.rotation.x)*.025*m;
    root.position.y+=((-progress*.25)-root.position.y)*.01*m;
    shell.rotation.y-=.00088*m;
    wire.rotation.y+=.001*m;
    inner.rotation.x+=.002*m;
    inner.rotation.y+=.0029*m;
    orbital.rotation.y-=.0007*m;
    satellites.rotation.y+=.00067*m;
    satellites.rotation.z+=.00021*m;
    seal.rotation.z-=.00078*m;
    points.rotation.y-=.00024*m;
    stars.rotation.y+=.000016*m;
    noteMeshes.forEach((mesh,i)=>{
      mesh.rotation.x+=.001*m;
      mesh.rotation.y+=.002*m;
      const k=.85+.15*Math.sin(now*.001+i);
      mesh.scale.setScalar((.7+i%4*.22)*k);
    });
    halo.material.opacity=.46+Math.sin(now*.00055)*.08;
    renderer.render(scene,camera);
  };
  const start=()=>{if(!handle&&!disposed&&visible&&!document.hidden&&isMotionEnabled())handle=requestAnimationFrame(draw)};
  const stop=()=>{if(handle){cancelAnimationFrame(handle);handle=0}};
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??true;
    if(visible)start();else stop();
  },{rootMargin:"60px"});
  observer.observe(canvas);
  const onVisibility=()=>document.hidden?stop():start();
  const onMotion=()=>isMotionEnabled()?start():stop();
  document.addEventListener("visibilitychange",onVisibility);
  window.addEventListener("researchmotion",onMotion);
  start();
  const dispose=()=>{
    disposed=true;stop();observer.disconnect();rObserver.disconnect();
    window.removeEventListener("pointermove",onMove);
    window.removeEventListener("scroll",onScroll);
    window.removeEventListener("researchmotion",onMotion);
    document.removeEventListener("visibilitychange",onVisibility);
    bg.dispose();tetra.dispose();octa.dispose();
    scene.traverse(x=>{
      if(x.isMesh||x.isPoints||x.isSprite){
        x.geometry?.dispose();
        const mats=Array.isArray(x.material)?x.material:[x.material];
        mats.forEach(mat=>{mat?.map?.dispose?.();mat?.dispose?.()});
      }
    });
    renderer.dispose();
  };
  window.addEventListener("pagehide",dispose,{once:true});
  return dispose;
}
