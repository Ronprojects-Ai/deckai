// services/pdf.js — EXACT mirror of pptx.js
// Every layout, colour zone, font size, and coordinate maps 1-to-1 with the PPTX.
// Canvas: A4 landscape = 841.89 × 595.28 pt  /  PPTX: 13.33" × 7.50"

const PDFDocument = require("pdfkit");

const THEMES = {
  midnight: { p:[30,39,97],    a:[249,168,37],  d:[10,15,46],   lt:[240,244,255], sf:[232,237,248] },
  coral:    { p:[184,50,50],   a:[245,200,66],  d:[26,8,8],     lt:[255,245,240], sf:[253,234,234] },
  forest:   { p:[26,71,49],    a:[126,217,87],  d:[9,31,18],    lt:[240,250,240], sf:[220,240,220] },
  ocean:    { p:[10,61,107],   a:[0,198,255],   d:[2,13,26],    lt:[232,244,255], sf:[200,232,255] },
  berry:    { p:[92,26,58],    a:[255,107,157], d:[26,0,16],    lt:[255,240,245], sf:[255,214,232] },
};

const LAYOUTS = [
  "cover","story","splitR","cards",
  "story","splitL","vision","cards",
  "splitR","splitL","splitR","cards",
  "splitR","splitL","splitR","cards",
  "vision","splitL","ask","closer"
];

const W=13.33, H=7.50, HDR=0.58, BOT=6.80;
const PW=841.89, PH=595.28;

function generatePDF(deckData, formData, themeName="midnight") {
  return new Promise((resolve, reject) => {
    const th = THEMES[themeName] || THEMES.midnight;
    const doc = new PDFDocument({ size:"A4", layout:"landscape", margin:0,
      info:{ Title:formData.startupName+" Pitch Deck", Author:"DeckAI" } });

    const chunks=[];
    doc.on("data",c=>chunks.push(c));
    doc.on("end",()=>resolve(Buffer.concat(chunks)));
    doc.on("error",reject);

    const ix=x=>x*(PW/W), iy=y=>y*(PH/H), iw=w=>w*(PW/W), ih=h=>h*(PH/H);

    function rect(x,y,w,h,col,op){
      if(op!==undefined){ doc.save(); doc.opacity(op); }
      doc.rect(ix(x),iy(y),iw(w),ih(h)).fill(col);
      if(op!==undefined) doc.restore();
    }
    function oval(x,y,rw,rh,col){
      doc.ellipse(ix(x+rw/2),iy(y+rh/2),iw(rw/2),ih(rh/2)).fill(col);
    }
    function txt(text,x,y,w,h,o={}){
      if(text===null||text===undefined) return;
      doc.save();
      doc.font(o.bold?"Helvetica-Bold":"Helvetica").fontSize(o.fontSize||12)
         .fillColor(o.color||[20,20,20]);
      const lg = o.lineSpacingMultiple ? (o.fontSize||12)*(o.lineSpacingMultiple-1) : 1;
      doc.text(String(text),ix(x),iy(y),{
        width:iw(w), height:ih(h), align:o.align||"left",
        lineBreak:true, lineGap:lg, ellipsis:true
      });
      doc.restore();
    }

    function hdr(s){
      rect(0,0,W,HDR,th.p);
      rect(0,HDR-0.05,W,0.05,th.a);
      if(s.act) txt(s.act.toUpperCase(),0.4,0.10,5,0.35,{fontSize:9,bold:true,color:th.a});
      if(s.slideNumber) doc.save(),doc.font("Helvetica").fontSize(9).fillColor([180,180,180])
        .text(String(s.slideNumber).padStart(2,"0"),PW-70,iy(0.10),{width:60,align:"right"}),doc.restore();
    }
    function ftr(){
      rect(0,BOT+0.08,W,0.04,th.a,0.40);
      txt(formData.startupName+"  ·  Confidential",0.4,BOT+0.16,W-0.8,0.24,{fontSize:8,color:[187,187,187]});
    }

    // ── COVER ─────────────────────────────────────────────────────────────────
    function renderCover(s){
      rect(0,0,W,H,th.d);
      rect(0,0,W*0.52,H,th.p);
      rect(W*0.51,0,0.09,H,th.a);
      rect(0,H-0.08,W,0.08,th.a);
      txt(formData.startupName.toUpperCase(),0.5,0.85,W*0.47,2.1,{fontSize:60,bold:true,color:[255,255,255]});
      txt(s.subtitle||formData.tagline||"",0.5,3.05,W*0.47,0.65,{fontSize:17,color:th.a});
      rect(0.5,3.78,2.8,0.05,[255,255,255]);
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        rect(0.5,4.04+i*0.57,0.06,0.36,th.a);
        txt(b,0.72,4.04+i*0.57,W*0.43,0.47,{fontSize:13,color:[187,187,187]});
      });
      rect(W*0.59,1.35,W*0.38,3.75,[255,255,255],0.95);
      rect(W*0.59,1.35,W*0.38,0.18,th.a);
      txt(s.bigStat||"",W*0.59,1.70,W*0.38,1.95,{fontSize:52,bold:true,color:th.p,align:"center"});
      txt(s.bigStatLabel||"",W*0.59,3.75,W*0.38,0.95,{fontSize:13,color:[102,102,102],align:"center"});
      txt(formData.startupName+"  ·  "+new Date().getFullYear(),0.5,H-0.42,4,0.28,{fontSize:9,color:[85,85,85]});
    }

    // ── STORY ─────────────────────────────────────────────────────────────────
    function renderStory(s){
      rect(0,0,W,H,th.d);
      hdr(s);
      doc.save();
      doc.font("Helvetica-Bold").fontSize(150).fillColor(th.p).opacity(0.22)
         .text("\u201C",ix(0.12),iy(0.38),{width:iw(2.0)});
      doc.restore();
      txt(s.title||"",0.5,0.70,8.1,1.95,{fontSize:31,bold:true,color:[255,255,255],lineSpacingMultiple:1.12});
      txt(s.subtitle||"",0.5,2.72,8.1,0.55,{fontSize:15,color:th.a});
      rect(0.5,3.35,2.2,0.05,th.a);
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        oval(0.50,3.56+i*1.02,0.27,0.27,th.a);
        txt(b,0.92,3.53+i*1.02,7.6,0.78,{fontSize:15,color:[221,221,221]});
      });
      rect(9.0,0.70,4.0,3.3,th.a);
      txt(s.bigStat||"",9.0,0.95,4.0,1.75,{fontSize:46,bold:true,color:th.d,align:"center"});
      txt(s.bigStatLabel||"",9.0,2.78,4.0,1.0,{fontSize:12,bold:true,color:th.d,align:"center",lineSpacingMultiple:1.3});
      if(s.speakerNote){
        rect(0.5,5.18,8.0,1.42,[255,255,255],0.12);
        txt("\u201C"+s.speakerNote+"\u201D",0.65,5.28,7.72,1.22,{fontSize:10,color:[136,136,136]});
      }
      ftr();
    }

    // ── SPLIT-R ───────────────────────────────────────────────────────────────
    function renderSplitR(s){
      rect(0,0,W,H,[255,255,255]);
      hdr(s);
      rect(7.72,HDR,W-7.72,H-HDR,th.p);
      rect(7.68,HDR,0.07,H-HDR,th.a);
      txt(s.title||"",0.40,0.68,7.10,1.35,{fontSize:26,bold:true,color:th.p,lineSpacingMultiple:1.1});
      txt(s.subtitle||"",0.40,2.08,7.10,0.50,{fontSize:13,color:[102,102,102]});
      rect(0.40,2.65,1.8,0.06,th.a);
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        rect(0.40,2.80+i*1.28+0.44,0.26,0.26,th.a);
        txt(b,0.80,2.80+i*1.28,6.75,1.0,{fontSize:14,color:[34,34,34],lineSpacingMultiple:1.25});
      });
      txt(s.bigStat||"",7.80,1.40,5.10,2.0,{fontSize:50,bold:true,color:th.a,align:"center"});
      txt(s.bigStatLabel||"",7.80,3.48,5.10,1.0,{fontSize:13,color:[204,204,204],align:"center",lineSpacingMultiple:1.3});
      if(s.speakerNote){
        rect(7.95,4.60,4.80,1.90,[255,255,255],0.12);
        txt("\u201C"+s.speakerNote+"\u201D",8.00,4.68,4.70,1.78,{fontSize:10,color:[136,136,136]});
      }
      ftr();
    }

    // ── SPLIT-L ───────────────────────────────────────────────────────────────
    function renderSplitL(s){
      rect(0,0,W,H,th.sf);
      hdr(s);
      rect(0,HDR,5.60,H-HDR,th.d);
      rect(5.57,HDR,0.07,H-HDR,th.a);
      txt(s.bigStat||"",0.10,1.50,5.40,1.95,{fontSize:52,bold:true,color:[255,255,255],align:"center"});
      txt(s.bigStatLabel||"",0.10,3.52,5.40,0.90,{fontSize:13,color:th.a,align:"center"});
      if(s.speakerNote){
        rect(0.30,4.60,5.00,1.90,[255,255,255],0.10);
        txt("\u201C"+s.speakerNote+"\u201D",0.35,4.68,4.90,1.78,{fontSize:10,color:[153,153,153]});
      }
      txt(s.title||"",5.80,0.68,7.10,1.35,{fontSize:24,bold:true,color:th.p,lineSpacingMultiple:1.12});
      txt(s.subtitle||"",5.80,2.08,7.10,0.50,{fontSize:13,color:[85,85,85]});
      rect(5.80,2.65,1.9,0.06,th.a);
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        rect(5.80,2.80+i*1.28,0.07,0.75,th.a);
        txt(b,6.05,2.80+i*1.28,6.90,1.0,{fontSize:14,color:[34,34,34],lineSpacingMultiple:1.25});
      });
      ftr();
    }

    // ── CARDS ─────────────────────────────────────────────────────────────────
    function renderCards(s){
      const HDR2=1.55;
      rect(0,0,W,H,th.sf);
      rect(0,0,W,HDR2,th.p);
      rect(0,HDR2-0.04,W,0.04,th.a);
      if(s.act) txt(s.act.toUpperCase(),0.4,0.10,4.5,0.32,{fontSize:9,bold:true,color:th.a});
      if(s.slideNumber) doc.save(),doc.font("Helvetica").fontSize(9).fillColor([180,180,180])
        .text(String(s.slideNumber).padStart(2,"0"),PW-70,iy(0.10),{width:60,align:"right"}),doc.restore();
      txt(s.title||"",0.5,0.30,W-5.2,0.82,{fontSize:24,bold:true,color:[255,255,255],lineSpacingMultiple:1.05});
      txt(s.subtitle||"",0.5,1.14,W-5.2,0.32,{fontSize:11,color:th.a});
      if(s.bigStat){
        rect(W-4.5,0,4.5,HDR2,th.a);
        txt(s.bigStat,W-4.5,0.14,4.5,0.92,{fontSize:36,bold:true,color:th.d,align:"center"});
        txt(s.bigStatLabel||"",W-4.5,1.09,4.5,0.38,{fontSize:10,bold:true,color:th.d,align:"center"});
      }
      const cY=HDR2+0.18, cH=BOT-cY-0.05, cW=(W-1.0)/3-0.18;
      const COLORS=[th.p,th.a,th.d];
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        const cx=0.40+i*(cW+0.18);
        rect(cx,cY,cW,cH,[255,255,255]);
        rect(cx,cY,cW,0.20,COLORS[i]);
        oval(cx+cW/2-0.43,cY+0.30,0.86,0.86,COLORS[i]);
        const nc=i===1?th.d:[255,255,255];
        txt(String(i+1),cx+cW/2-0.43,cY+0.30,0.86,0.86,{fontSize:20,bold:true,color:nc,align:"center"});
        txt(b,cx+0.18,cY+1.34,cW-0.36,cH-1.46,{fontSize:13,color:[34,34,34],lineSpacingMultiple:1.35});
      });
      ftr();
    }

    // ── VISION ────────────────────────────────────────────────────────────────
    function renderVision(s){
      rect(0,0,W,H,th.d);
      hdr(s);
      txt(s.title||"",0.5,0.68,W-1.0,1.80,{fontSize:36,bold:true,color:[255,255,255],align:"center",lineSpacingMultiple:1.12});
      rect(W/2-2.1,2.56,4.2,0.07,th.a);
      txt(s.subtitle||"",0.8,2.70,W-1.6,0.55,{fontSize:16,color:th.a,align:"center"});
      if(s.bigStat){
        txt(s.bigStat,W-4.1,0.68,3.7,1.38,{fontSize:42,bold:true,color:th.a,align:"center"});
        txt(s.bigStatLabel||"",W-4.1,2.10,3.7,0.45,{fontSize:11,color:[170,170,170],align:"center"});
      }
      const cY=3.38,cH=BOT-cY-0.05,cW=(W-1.4)/3-0.20;
      (s.bullets||[]).slice(0,3).forEach((b,i)=>{
        const cx=0.40+i*(cW+0.20);
        rect(cx,cY,cW,cH,[255,255,255],0.90);
        rect(cx,cY,cW,0.18,th.a);
        txt(b,cx+0.16,cY+0.26,cW-0.32,cH-0.36,{fontSize:13,color:[255,255,255],lineSpacingMultiple:1.38});
      });
      ftr();
    }

    // ── ASK ───────────────────────────────────────────────────────────────────
    function renderAsk(s){
      rect(0,0,W,H,th.d);
      hdr(s);
      const CX=0.85,CY=0.65,CW=W-1.70,CH=H-1.28;
      rect(CX,CY,CW,CH,[255,255,255]);
      rect(CX,CY,CW,0.20,th.p);
      txt(s.title||"",CX,CY+0.28,CW,0.80,{fontSize:27,bold:true,color:th.p,align:"center"});
      rect(W/2-1.8,CY+1.15,3.6,0.07,th.a);
      txt(s.bigStat||"",CX,CY+1.32,CW,1.48,{fontSize:60,bold:true,color:th.p,align:"center"});
      txt(s.bigStatLabel||"Seed Round",CX,CY+2.87,CW,0.42,{fontSize:14,color:[119,119,119],align:"center"});
      const buls=(s.bullets||[]).slice(0,3);
      const BW=(CW-0.80)/Math.max(buls.length,1);
      const BCOLS=[th.p,th.a,th.sf];
      const BTCOLS=[[255,255,255],th.d,[51,51,51]];
      buls.forEach((b,i)=>{
        const bx=CX+0.30+i*(BW+0.10),by=CY+3.42;
        rect(bx,by,BW,1.55,BCOLS[i]);
        txt(b,bx+0.10,by+0.12,BW-0.20,1.32,{fontSize:12,color:BTCOLS[i],align:"center",lineSpacingMultiple:1.3});
      });
      txt(formData.startupName+"  ·  Let\u2019s build this together",0,H-0.48,W,0.36,
        {fontSize:11,bold:true,color:th.a,align:"center"});
    }

    // ── CLOSER ────────────────────────────────────────────────────────────────
    function renderCloser(s){
      rect(0,0,W,H,th.p);
      rect(0,0,W,0.10,th.a);
      rect(0,H-0.10,W,0.10,th.a);
      doc.save();
      doc.font("Helvetica-Bold").fontSize(220).fillColor([255,255,255]).opacity(0.10)
         .text("\u201C",ix(0.25),iy(-0.10),{width:iw(3.2)});
      doc.restore();
      txt(s.title||"",0.65,1.05,W-1.30,2.90,{fontSize:36,bold:true,color:[255,255,255],align:"center",lineSpacingMultiple:1.15});
      rect(W/2-2.2,4.08,4.4,0.08,th.a);
      txt(s.subtitle||formData.tagline||"",0.65,4.24,W-1.30,0.60,{fontSize:17,color:th.a,align:"center"});
      txt(formData.startupName+"  ·  "+(s.bigStat||"")+"  ·  Let\u2019s build this together",
        0.65,5.20,W-1.30,0.50,{fontSize:13,color:[204,204,204],align:"center"});
    }

    const RENDERERS={cover:renderCover,story:renderStory,splitR:renderSplitR,splitL:renderSplitL,
      cards:renderCards,vision:renderVision,ask:renderAsk,closer:renderCloser};

    deckData.slides.forEach((s,idx)=>{
      if(idx>0) doc.addPage({size:"A4",layout:"landscape",margin:0});
      const layout=LAYOUTS[idx]||"splitL";
      (RENDERERS[layout]||renderSplitL)(s);
    });

    doc.end();
  });
}

module.exports = { generatePDF };
