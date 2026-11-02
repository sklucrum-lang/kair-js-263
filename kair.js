(function(){try{var P=HTMLCanvasElement.prototype,g=P.getContext;if(g.__kair)return;var f=function(t,o){if(t==='webgl'||t==='webgl2'||t==='experimental-webgl'){o=Object.assign({},o||{},{preserveDrawingBuffer:true})}return g.call(this,t,o)};f.__kair=1;P.getContext=f}catch(_){}})();
// KAIR core: порт Book.kt (K. A. I. R. calc) 1:1 + математика Фибо из kair_draw_mobile v4. Без сети.
var KairCore=(function(){
 function pad(n){return (n<10?'0':'')+n}
 function today(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
 function floorStake(x){return !(x>0&&isFinite(x))?0:Math.max(1,Math.floor(x))}
 function rint(x){var f=Math.floor(x),r=x-f;if(r>0.5)return f+1;if(r<0.5)return f;return (f%2===0)?f:f+1}
 function round2(x){return rint(x*100)/100}
 function g(x){if(x===Math.floor(x)&&Math.abs(x)<1e15)return String(x);return String(parseFloat(x.toPrecision(6)))}
 function newLadder(){return {level:1,winsAtLevel:0,day:today(),dayProfit:0}}
 function Book(st){st=st||{};this.goal=Object.assign({deposit:0,profit:0,trades:0,payout:92},st.goal||{});
  this.ladder=Object.assign(newLadder(),st.ladder||{});this.trades=st.trades||[];this.statsFrom=st.stats_from||0;this.rollDay()}
 var B=Book.prototype;
 B.json=function(){return {goal:this.goal,ladder:this.ladder,trades:this.trades.slice(-5000),stats_from:this.statsFrom}};
 B.rollDay=function(){if(this.ladder.day!==today())this.ladder=newLadder()};
 B.base=function(){var p=this.goal.profit,n=this.goal.trades,r=this.goal.payout/100;if(p<=0||n<=0||r<=0)return 0;return floorStake(p/(n*r))};
 B.stake=function(){var b=this.base();return b?b*(1<<(this.ladder.level-1)):0};
 B.pay=function(live){return ((live||0)||(this.goal.payout||0)||92)/100};
 B.ifWin=function(live){return this.stake()*this.pay(live)};
 B.ifLoss=function(){return -this.stake()};
 B.record=function(outcome,live,sig,now){this.rollDay();now=now||new Date();
  var st=this.stake(),pay=(live||0)||this.goal.payout;
  var pr=outcome==='win'?st*pay/100:outcome==='loss'?-st:0;var L=this.ladder;
  if(outcome==='win'){L.winsAtLevel++;if(L.winsAtLevel>=2){L.level++;L.winsAtLevel=0}}else if(outcome==='loss'){L.level=1;L.winsAtLevel=0}
  L.dayProfit=round2(L.dayProfit+pr);
  var rec={ts:now.getTime(),date:today(now),time:pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds()),kind:'manual',outcome:outcome,stake:st,payout:pay,profit:round2(pr)};
  if(sig)rec.signal=sig;this.trades.push(rec);return rec};
 B.stats=function(){var f=this.statsFrom,m=this.trades.filter(function(t){return t.kind==='manual'&&t.ts>=f});
  var w=m.filter(function(t){return t.outcome==='win'}).length,l=m.filter(function(t){return t.outcome==='loss'}).length;
  return {N:m.length,W:w,L:l,WR:w+l>0?rint(100*w/(w+l)):0,PNL:round2(m.reduce(function(s,t){return s+t.profit},0))}};
 B.clearStats=function(now){this.statsFrom=(now||Date.now())+1;this.ladder=newLadder()};
 B.goalText=function(){function m(x){return (x<0?'-':'')+'$'+g(Math.abs(x))}return m(round2(this.ladder.dayProfit))+' / '+m(this.goal.profit)};
 B.goalFrac=function(){var gp=this.goal.profit;return gp<=0?0:Math.max(0,Math.min(1,this.ladder.dayProfit/gp))};
 B.daily=function(){var d={};this.trades.forEach(function(t){if(t.kind!=='manual')return;var x=d[t.date]||(d[t.date]={date:t.date,N:0,W:0,L:0,PNL:0});
  x.N++;if(t.outcome==='win')x.W++;if(t.outcome==='loss')x.L++;x.PNL=round2(x.PNL+t.profit)});return Object.keys(d).sort().reverse().map(function(k){return d[k]})};
 B.exportText=function(from,to){var sel=this.trades.filter(function(t){return from<=t.date&&t.date<=to}),man=sel.filter(function(t){return t.kind==='manual'});
  var w=man.filter(function(t){return t.outcome==='win'}).length,l=man.filter(function(t){return t.outcome==='loss'}).length;
  return JSON.stringify({from:from,to:to,summary:{N:man.length,W:w,L:l,WR:w+l>0?rint(100*w/(w+l)):0,PNL:round2(man.reduce(function(s,t){return s+t.profit},0)),signals:sel.length-man.length},goal:this.goal,trades:sel},null,2)};
 // Фибо (как kair_draw_mobile v4): fibo2: y=B-k*(B-A) => 1 в A, 0 в B; fibo3 (расширение): y=C+k*(B-A)
 // уровни: 0.62 и 0.79 убраны по просьбе; 1.886 и 2.236 возвращены (исходный набор Сергея: kair_draw_mobile до v4, rpc/Risovanie.cs, fibo/KAIR_Fibo.cs, kair239 Fibo.kt)
 var K=[0,0.5,0.705,0.79,1,1.382,1.618,1.886,2.236];
 function fibo2(a,b){return K.map(function(k){return b-k*(b-a)})}
 function fibo3(a,b,c){return K.map(function(k){return c+k*(b-a)})}
 var LINES=[0,0.5,1],BANDS=[[0.705,0.79],[1.382,1.618],[1.886,2.236]];
 return {LINES:LINES,BANDS:BANDS,Book:Book,today:today,floorStake:floorStake,round2:round2,rint:rint,g:g,K:K,fibo2:fibo2,fibo3:fibo3};
})();
if(typeof module!=='undefined')module.exports=KairCore;
var KAIR_STRATEGY="СТРАТЕГИЯ 2.62-SM (ИТОГОВАЯ, проверена)\nПример: бычья P0 = 1.1000, P1 = 1.1100 (импульс 0.0100); медвежья P0 = 1.1100, P1 = 1.1000.\n\n1. БАЗА\n1.1. ТФ M1, M3, M5 независимо. Только закрытые свечи.\n1.2. Фрактал периода 5: High (Low) строго выше (ниже) 5 свечей слева и 5 справа. Подтверждение после закрытия 5-й свечи справа: M1 5 мин, M3 15, M5 25. Точки - концы теней, без привязки.\n1.3. Одна формула: L(k) = P0 + k*(P1 - P0) (для медвежьей P1 - P0 < 0). Подпись: k <= 1 -> 1 - k; k > 1 -> k.\nБычья: k0 (подп.1) 1.10000 = P0 | k0.21 (подп.0.79) 1.10210 | k0.295 (подп.0.705) 1.10295 | k0.5 1.10500 | k1 (подп.0) 1.11000 = P1 | 1.272 1.11272 | 1.382 1.11382 | 1.618 1.11618\nМедвежья: 0.79 1.10790 | 0.705 1.10705 | 0.5 1.10500 | 1.272 1.09728 | 1.382 1.09618 | 1.618 1.09382\n1.4. Одна активная сетка на инструмент и ТФ.\n1.5. Экспирация 3 свечи (M1 3 мин, M3 9, M5 15). CALL выигрывает, если цена на экспирации выше входа, PUT - ниже.\n1.6. payout_min = 90% (85-92). Безубыточность 1/(1+выплата): 90% -> 52,6%, 85% -> 54,1%.\n\n2. СОЗДАНИЕ СЕТКИ (все условия обязательны)\n2.1. Бычья: подтверждённый Low (P0), затем первый подтверждённый High (P1 > P0). Медвежья зеркально.\n2.2. |P1 - P0| >= 1.5 x ATR(14) (Уайлдер, текущий ТФ, на свече подтверждения P1). ATR 0.0040 -> нужно >= 0.0060 - проходит; ATR 0.0070 -> нужно >= 0.0105 - сетки нет.\n2.3. Фильтр 50%: закрытие свечи подтверждения P1 не дальше L(0.5). Бычья >= 1.10500 (1.10480 - сетки нет), медвежья <= 1.10500.\n2.4. OB/FVG в сигнале не участвуют, в журнал флаг zone_overlap.\n2.5. Сетка существует с закрытия свечи подтверждения P1. Сигнальной может быть только первая закрытая свеча после неё и позже.\n\n3. CORRECTION\n3.1. Зона 0.705-0.79 (k 0.21-0.295): бычья 1.10210-1.10295, медвежья 1.10705-1.10790.\n3.2. В зоне должна быть цена, кратная шагу (0.0005, параметр), иначе сигнала нет. Цену входа не задаёт. Есть 1.10250 - можно. P1 = 1.1015: зона 1.10032-1.10044 - кратной нет - сигнала нет.\n3.3. Свеча 1 закрылась внутри зоны (пример 1.10260).\n3.4. Свеча 2 не закрылась за дальней границей: бычья >= 1.10210 (1.10200 - сигнал отменён, сетка жива), медвежья <= 1.10790.\n3.5. Вход по рынку на открытии свечи 3: бычья CALL, медвежья PUT. M3: свеча 1 - 10:00, свеча 2 - 10:03, вход 10:03, экспирация 10:12.\n3.6. Один вход CORRECTION на сетку. Если подтверждение не прошло и сетка жива (P0 не пробит закрытием), новая сигнальная свеча обязана снова закрыться ВНУТРИ зоны. Свечи, закрывшиеся за зоной, сигналом не являются.\n3.7. BOS только в журнал (флаг bos).\n\n4. EXPANSION\n4.1. Триггер: закрытие за L(1.272): бычья > 1.11272, медвежья < 1.09728. Неиспользованный вход CORRECTION снимается.\n4.2. Входы на 1.382 и 1.618, по одному, максимум 2 на сетку. Свеча закрылась за уровнем по направлению -> вход на открытии следующей. Бычья > 1.11382 / > 1.11618 - CALL; медвежья < 1.09618 / < 1.09382 - PUT.\nСвеча-триггер (4.1) тоже может быть сигнальной, если закрылась за 1.382.\nЕсли одна свеча закрылась сразу за 1.382 и 1.618 - один сигнал по 1.618, уровень 1.382 считается использованным.\n4.3. Фильтр структуры (оба условия):\nа) после триггера нет закрытия обратно за P1 (бычья: нет закрытия < 1.11000);\nб) противоположный фрактал после P1 не за P1 (бычья: Low >= 1.11000; 1.11050 - да, 1.10950 - нет).\n4.4. Выход в WAITING: закрытие за P1, валидная противоположная сетка или 30 свечей от триггера. Новая сетка того же направления EXPANSION не сбрасывает.\n4.5. Статистика EXPANSION отдельно от CORRECTION.\n\n5. СБРОС И ОТМЕНА (по закрытию свечи)\n5.1. Закрытие за P0 (бычья < 1.10000, медвежья > 1.11000) - сетка уничтожена, WAITING.\n5.2. 30 свечей от подтверждения P1 (в EXPANSION от триггера): M1 30 мин, M3 90, M5 150. Сигнальная свеча должна быть не позже 30-й. Если лимит истёк на свече подтверждения - сигнал доживает до входа, затем сброс.\n5.3. Выплата < payout_min: новых сигналов нет, ждущий (свечи 1-2) снимается, сетка жива, открытая сделка до экспирации. 92% -> 87% = \"ОТМЕНА: выплата\".\n5.4. Противоположная сетка, прошедшая 2.2 и 2.3, заменяет текущую. ATR 0.0030 (нужно >= 0.0045): Low 1.1050 (импульс 0.0050), закрытие <= 1.1075 -> медвежья 1.1100->1.1050. Low 1.1080 (0.0020) - коррекция, сетка остаётся.\n5.5. Новая сетка того же направления в CORRECTION (прошла 2.2 и 2.3, P1 дальше) заменяет старую: 1.1060->1.1150 вместо 1.1000->1.1100.\n5.6. Скачок: |Open - Close пред.| / Close пред. > 1%. 1.1000 -> 1.1115 (+1,05%) - полный сброс, ATR и история с нуля, 40 свечей разогрева.\n5.7. После сброса ждём новую валидную пару фракталов; P0 из фрактала до сброса можно, кроме скачка.\n5.8. Табличка \"ОТМЕНА\" + причина + цена, стоп-звук, держится 2 свечи.\n\n6. ЖУРНАЛ (строка на сигнал)\nДата/время, пара, ТФ, период фрактала, режим (CORR/EXP), CALL/PUT, P0, P1, ATR, импульс в ATR, k и подпись, цена входа, цена на экспирации, итог, выплата %, флаги bos, zone_overlap, \"противоположный сигнал на другом ТФ\", разогрев, причина отмены.\n\n7. ПРОВЕРКА\nМинимум 100 сделок на режим и ТФ, M1 отдельно. Режим рабочий, если выигрышей > 52,6% при выплате 90% на обеих половинах выборки. До конца выборки правила не менять.\n";
// KAIR 2.62-SM (итоговая): чистая логика, без сети. Заменяет логику 2.40 (фрактал 10).
var KairSM=(function(){
 var FR=5,ATRP=14,MIN_IMP_ATR=1.5,EXP_CANDLES=3,LIFE=30,STEP=0.0005,MIN_PAYOUT=90,JUMP=0.01,WARM=40,HIST=400,CANCEL_HOLD=2;
 var ZK=[0.21,0.295],EXT=[1.272,1.382,1.618];
 function L(g,k){return g.p0+k*(g.p1-g.p0)}
 function label(k){var x=k<=1?1-k:k;return String(+x.toFixed(4))}
 function slotMs(tf){return tf==='M1'?60000:tf==='M3'?180000:tf==='M5'?300000:null}
 function expMin(tf){return Math.round((slotMs(tf)||60000)*EXP_CANDLES/60000)}
 function fm(x,d){return x==null||!isFinite(x)?'':x.toFixed(d)}
 function roundIn(lo,hi,step){step=step||STEP;var a=Math.ceil(lo/step-1e-6),b=Math.floor(hi/step+1e-6),r=[];for(var x=a;x<=b;x++)r.push(Math.round(x*step*1e7)/1e7);return r}
 function atrWilder(c,p){var out=new Array(c.length).fill(null),tr=[],i,s=0;
  for(i=0;i<c.length;i++){tr.push(i?Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c)):c[i].h-c[i].l)}
  if(c.length<p)return out;for(i=0;i<p;i++)s+=tr[i];var a=s/p;out[p-1]=a;for(i=p;i<c.length;i++){a=(a*(p-1)+tr[i])/p;out[i]=a}return out}
 // 1.2: строго выше/ниже 5 слева и 5 справа; подтверждается на закрытии 5-й свечи справа
 function fractalAt(c,i){if(i<FR||i+FR>=c.length)return null;var hi=true,lo=true;
  for(var k=1;k<=FR;k++){if(!(c[i].h>c[i-k].h&&c[i].h>c[i+k].h))hi=false;if(!(c[i].l<c[i-k].l&&c[i].l<c[i+k].l))lo=false}
  var r=[];if(hi)r.push({i:i,hi:true,p:c[i].h,conf:i+FR});if(lo)r.push({i:i,hi:false,p:c[i].l,conf:i+FR});return r}
 function zone(g){var a=L(g,ZK[0]),b=L(g,ZK[1]);return [Math.min(a,b),Math.max(a,b)]}
 function beyond(g,x,k){return g.up?x>L(g,k):x<L(g,k)} // закрытие «за» уровнем по направлению сетки
 function behind(g,x,k){return g.up?x<L(g,k):x>L(g,k)} // закрытие «за» уровнем против направления
 // 2.4: OB/FVG импульса пересекает зону OTE — только флаг в журнал
 function zoneOverlap(c,g){var z=zone(g),ok=false;for(var i=g.i0;i<=g.i1&&!ok;i++){var x=c[i];
   if(g.up?x.c<x.o:x.c>x.o){if(x.l<=z[1]&&x.h>=z[0])ok=true}
   if(i>=g.i0+2){var f=g.up?(c[i-2].h<x.l?[c[i-2].h,x.l]:null):(c[i-2].l>x.h?[x.h,c[i-2].l]:null);if(f&&f[0]<=z[1]&&f[1]>=z[0])ok=true}}return ok}
 function Eng(log){this.log=log||function(){};this.journal=[];this.reset()}
 var E=Eng.prototype;
 E.reset=function(){this.tf={};this.sig={k:'none'};this.verdict='—';this.lastPay=null};
 E.st=function(tf){return this.tf[tf]||(this.tf[tf]={c:[],fr:[],g:null,lastT:null,warm:0,lastP0:null})};
 E.hardReset=function(s){s.c=[];s.fr=[];s.g=null;s.warm=0;s.lastP0=null;s.pendEntry=null;s.trades=[]};
 E.cancel=function(tf,why,price,dec){this.sig={k:'cancel',why:why,price:fm(price,dec),until:null,tf:tf};this.log(tf+' ОТМЕНА: '+why+' '+fm(price,dec))};
 E.row=function(s,tf,g,mode,k,ci,extra){var c=s.c[ci],r={time:extra.time||'',pair:extra.pair||'',tf:tf,fractal:FR,mode:mode,dir:g.up?'CALL':'PUT',
   P0:g.p0,P1:g.p1,ATR:+g.atr.toFixed(7),imp_atr:+(Math.abs(g.p1-g.p0)/g.atr).toFixed(2),k:k,label:mode==='CORR'?'0.705-0.79':label(k),
   entry:'',expiry_price:'',result:'',payout:extra.pay==null?'':extra.pay,bos:g.bos?1:0,zone_overlap:g.zov?1:0,opp_other_tf:extra.opp?1:0,warmup:s.warm<WARM?1:0,cancel:''};
  this.journal.push(r);if(this.journal.length>3000)this.journal.shift();return r};
 // один закрытый бар: c={t,o,h,l,c}; ctx={pay,dec,pair,time,opp}
 E.bar=function(tf,b,ctx){var s=this.st(tf),dec=ctx.dec||5,self=this,pay=ctx.pay,payOk=pay!=null&&pay>=MIN_PAYOUT,out=[];
  var prev=s.c[s.c.length-1];
  if(prev&&Math.abs(b.o-prev.c)/prev.c>JUMP){this.hardReset(s);this.cancel(tf,'скачок цены >1%, полный сброс',b.o,dec);out.push('JUMP')}
  s.c.push(b);s.warm++;if(!s.trades)s.trades=[];
  if(s.c.length>HIST){var d=s.c.length-HIST;s.c.splice(0,d);s.fr=s.fr.map(function(f){return Object.assign({},f,{i:f.i-d,conf:f.conf-d})}).filter(function(f){return f.i>=0});
   if(s.g){['i0','i1','conf','trig','pend'].forEach(function(k){if(s.g[k]!=null)s.g[k]-=d})}if(s.pendEntry)s.pendEntry.ci-=d;s.trades.forEach(function(t){t.ci-=d})}
  var c=s.c,j=c.length-1,atr=atrWilder(c,ATRP);
  // открытые сделки: вход на открытии свечи 3, экспирация через 3 свечи
  if(s.pendEntry&&j===s.pendEntry.ci+1){var pe=s.pendEntry;s.pendEntry=null;pe.row.entry=b.o;pe.row.entry_time=ctx.time||'';s.trades.push({row:pe.row,ci:j,up:pe.up})}
  s.trades=s.trades.filter(function(t){if(j<t.ci+EXP_CANDLES-1)return true;var ex=b.c;t.row.expiry_price=ex;t.row.result=ex===t.row.entry?'D':((t.up?ex>t.row.entry:ex<t.row.entry)?'W':'L');self.log(tf+' итог '+t.row.dir+' '+fm(t.row.entry,dec)+' -> '+fm(ex,dec)+' '+t.row.result);return false});
  // фракталы, подтверждённые на этой свече
  var nf=fractalAt(c,j-FR)||[];nf.forEach(function(f){s.fr.push(f)});
  var g=s.g;
  // 5.1 закрытие за P0
  if(g&&behind(g,b.c,0)){this.endGrid(s,tf,'закрытие за P0 '+fm(g.p0,dec)+', сетка уничтожена',b.c,dec);g=null}
  // 5.3 выплата
  if(!payOk&&g&&g.pend!=null){var pr=g.pendRow;g.pend=null;pr.cancel='выплата';this.cancel(tf,'выплата',b.c,dec)}
  else if(!payOk&&this.lastPay!=null&&this.lastPay>=MIN_PAYOUT&&g)this.cancel(tf,'выплата',b.c,dec);
  this.lastPay=pay;
  // новые сетки из новых фракталов (2.1-2.3), замена 5.4/5.5, 4.4
  nf.forEach(function(f){var p0=null;for(var q=s.fr.length-1;q>=0;q--){var x=s.fr[q];if(x.i>=f.i)continue;if(x.hi===f.hi)break;p0=x;break}
   if(!p0)return;var up=f.hi,cand={up:up,p0:p0.p,p1:f.p,i0:p0.i,i1:f.i,conf:j,atr:atr[j]};
   if(atr[j]==null)return;if(up?!(cand.p1>cand.p0):!(cand.p1<cand.p0))return;
   if(Math.abs(cand.p1-cand.p0)<MIN_IMP_ATR*atr[j]){self.log(tf+' пара '+fm(cand.p0,dec)+'->'+fm(cand.p1,dec)+': импульс < 1.5 ATR, сетки нет');return}
   if(up?b.c<L(cand,0.5):b.c>L(cand,0.5)){self.log(tf+' пара '+fm(cand.p0,dec)+'->'+fm(cand.p1,dec)+': закрытие за 0.5, сетки нет');return}
   var g0=s.g;
   if(g0&&g0.up===up){if(g0.mode==='EXP')return; if(!(up?cand.p1>g0.p1:cand.p1<g0.p1))return}
   if(g0){if(g0.pend!=null){g0.pendRow.cancel='новая сетка';self.cancel(tf,'новая сетка',b.c,dec)}self.log(tf+' сетка заменена: '+(g0.up===up?'5.5 та же сторона':'противоположная'))}
   cand.mode='CORR';cand.corrUsed=false;cand.pend=null;cand.expUsed={};cand.expN=0;cand.bos=false;cand.zov=zoneOverlap(c,cand);
   var z=zone(cand);cand.round=roundIn(z[0],z[1]).length>0;s.g=cand;
   self.log(tf+' СЕТКА '+(up?'бычья':'медвежья')+' P0 '+fm(cand.p0,dec)+' P1 '+fm(cand.p1,dec)+' ATR '+fm(atr[j],dec+1)+' зона '+fm(z[0],dec)+'-'+fm(z[1],dec)+(cand.round?'':' (кратной цены нет — сигнала CORRECTION не будет)'))});
  g=s.g;if(!g||g.conf===j){this.verdictSet(tf,s);return out}
  var age=j-g.conf,sig=null;
  if(g.mode==='CORR'){
   if(beyond(g,b.c,1))g.bos=true;
   if(beyond(g,b.c,1.272)){g.mode='EXP';g.trig=j;if(g.pend!=null){g.pendRow.cancel='EXPANSION';g.pend=null}g.corrUsed=true;this.log(tf+' EXPANSION: закрытие '+fm(b.c,dec)+' за 1.272')}
   else if(g.pend!=null){
    if(!behind(g,b.c,ZK[0])){sig={mode:'CORR',k:ZK[0],row:g.pendRow};g.corrUsed=true;g.pend=null}
    else{g.pendRow.cancel='свеча 2 закрылась за дальней границей';g.pend=null;this.cancel(tf,'свеча 2 за 0.79',b.c,dec)}}
   else if(!g.corrUsed&&g.round&&age<=LIFE&&payOk){var z2=zone(g);if(b.c>=z2[0]&&b.c<=z2[1]){g.pend=j;g.pendRow=this.row(s,tf,g,'CORR',ZK[0],j,ctx);this.log(tf+' свеча 1 в зоне '+fm(b.c,dec)+', ждём свечу 2')}}
   if(!sig&&g.mode==='CORR'&&g.pend==null&&age>=LIFE){this.endGrid(s,tf,'30 свечей истекли',b.c,dec);this.verdictSet(tf,s);return out}
  }
  if(g.mode==='EXP'&&s.g===g){var ta=j-g.trig;
   if(j>g.trig&&behind(g,b.c,1)){this.endGrid(s,tf,'EXPANSION: закрытие за P1',b.c,dec);this.verdictSet(tf,s);return out}
   var opp=s.fr.some(function(f){return f.i>g.i1&&f.hi===!g.up&&f.conf<=j&&behind(g,f.p,1)});
   if(!opp&&payOk&&ta<=LIFE&&g.expN<2){var lv=null;
    if(!g.expUsed[1.618]&&beyond(g,b.c,1.618)){lv=1.618;g.expUsed[1.618]=1;g.expUsed[1.382]=1}
    else if(!g.expUsed[1.382]&&beyond(g,b.c,1.382)){lv=1.382;g.expUsed[1.382]=1}
    if(lv){g.expN++;sig={mode:'EXP',k:lv,row:this.row(s,tf,g,'EXP',lv,j,ctx)}}}
   if(!sig&&ta>=LIFE){this.endGrid(s,tf,'EXPANSION: 30 свечей',b.c,dec);this.verdictSet(tf,s);return out}
  }
  if(sig){s.pendEntry={ci:j,up:g.up,row:sig.row};this.sig={k:'order',call:g.up,price:fm(b.c,dec),exp:expMin(tf)+' мин',mode:sig.mode,warm:s.warm<WARM,tf:tf,slot:b.t};
   this.log(tf+' СИГНАЛ '+(g.up?'CALL':'PUT')+' '+sig.mode+' '+label(sig.k)+' вход на открытии следующей свечи, эксп '+expMin(tf)+' мин'+(s.warm<WARM?' (разогрев)':''));out.push('SIG');
   if(g.mode==='CORR'&&age>=LIFE)s.g=null;if(g.mode==='EXP'&&j-g.trig>=LIFE)s.g=null}
  this.verdictSet(tf,s);return out};
 E.endGrid=function(s,tf,why,price,dec){var g=s.g;s.g=null;if(g&&g.pend!=null){g.pendRow.cancel=why}this.cancel(tf,why,price,dec)};
 E.verdictSet=function(tf,s){var g=s.g;this.verdict='Стратегия 2.62-SM '+tf+': '+(g?(g.up?'бычья':'медвежья')+' сетка, '+g.mode+(g.pend!=null?', свеча 1 в зоне':''):'WAITING')+(s.warm<WARM?' (разогрев '+s.warm+'/'+WARM+')':'')};
 // совместимо с UI: closed [{o,h,l,c}] без живой, at = Date.now()
 E.step=function(closed,px,dec,at,tf,pay,pair){var sm=slotMs(tf);if(!sm){this.verdict='Стратегия 2.62-SM: нужен график M1, M3 или M5';return this.sig}
  var pSlot=Math.floor(at/sm),n=closed.length,s=this.st(tf),self=this,others=[];
  for(var t in this.tf)if(t!==tf&&this.tf[t].g)others.push(this.tf[t].g.up);
  closed.forEach(function(k,i){var t=pSlot-(n-i);if(s.lastT!=null&&t<=s.lastT)return;s.lastT=t;var d=new Date(t*sm);
   var tm=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
   var live=i===n-1;var g=s.g,opp=g?others.some(function(x){return x!==g.up}):false;
   if(!live){var keep=self.sig;self.bar(tf,{t:t,o:k.o,h:k.h,l:k.l,c:k.c},{pay:pay,dec:dec,pair:pair,time:tm,opp:opp});self.sig=keep}
   else self.bar(tf,{t:t,o:k.o,h:k.h,l:k.l,c:k.c},{pay:pay,dec:dec,pair:pair,time:tm,opp:opp})});
  if(this.sig.k==='cancel'){if(this.sig.until==null)this.sig.until=pSlot+CANCEL_HOLD-1;if(pSlot>this.sig.until)this.sig={k:'none'}}
  else if(this.sig.k==='order'&&this.sig.slot!=null&&pSlot>this.sig.slot+1)this.sig={k:'none'};
  return this.sig};
 E.csv=function(){var h=['time','pair','tf','fractal','mode','dir','P0','P1','ATR','imp_atr','k','label','entry','expiry_price','result','payout','bos','zone_overlap','opp_other_tf','warmup','cancel'];
  var q=function(x){x=String(x==null?'':x);return /[,"\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};
  return h.join(',')+'\n'+this.journal.map(function(r){return h.map(function(k){return q(r[k])}).join(',')}).join('\n')};
 E.summary=function(){var o={};this.journal.forEach(function(r){if(r.cancel||!r.result||r.warmup)return;var k=r.mode+' '+r.tf,x=o[k]||(o[k]={N:0,W:0,L:0,D:0});x.N++;x[r.result]++});
  Object.keys(o).forEach(function(k){var x=o[k];x.WR=x.N?Math.round(x.W/x.N*1000)/10:0});return o};
 return {FR:FR,L:L,label:label,zone:zone,roundIn:roundIn,atrWilder:atrWilder,fractalAt:fractalAt,slotMs:slotMs,expMin:expMin,Engine:Eng,
  MIN_PAYOUT:MIN_PAYOUT,breakeven:function(p){return 1/(1+p/100)},jump:function(prevC,o){return Math.abs(o-prevC)/prevC>JUMP},WARM:WARM,LIFE:LIFE};
})();
if(typeof module!=='undefined')module.exports=KairSM;
// Порт 1:1 Strategy39.kt (телефон KAIR 2.40, /workspace/v51) и Engine.kt (ПК KAIR 2.41, /workspace/kp). Чистая логика, без сети.
// v3.28: свечные паттерны на СИГНАЛЬНОЙ свече (только подсветка, на сигналы не влияют).
// Обозначения: R=h-l (диапазон), B=|c-o| (тело), U=h-max(o,c) (верхняя тень), L=min(o,c)-l (нижняя тень).
// Марубозу: B>=0.9R (тени суммарно <=10% диапазона).
// Молот / Повешенный: L>=2B, U<=0.1R, B>=0.05R (тело в верхней части свечи);
//   Молот — после снижения (close сигнальной < среднего close 5 предыдущих), Повешенный — после роста (>).
// Пин-бар: одна тень >=2/3 R и B<=0.25R (бычий — длинная нижняя тень, медвежий — длинная верхняя).
// Порядок проверки: Марубозу, Молот/Повешенный (нужно >=5 предыдущих свечей), Пин-бар.
var KairPat=(function(){
 function detect(c,prev){if(!c)return null;var R=c.h-c.l;if(!(R>0))return null;var B=Math.abs(c.c-c.o),U=c.h-Math.max(c.o,c.c),L=Math.min(c.o,c.c)-c.l;
  if(B>=0.9*R)return c.c>c.o?'Марубозу (бычий)':'Марубозу (медвежий)';
  if(L>=2*B&&U<=0.1*R&&B>=0.05*R&&prev&&prev.length>=5){var p=prev.slice(-5),a=0;for(var i=0;i<5;i++)a+=p[i].c;a/=5;if(c.c<a)return 'Молот';if(c.c>a)return 'Повешенный'}
  if(B<=0.25*R){if(L>=2/3*R)return 'Пин-бар (бычий)';if(U>=2/3*R)return 'Пин-бар (медвежий)'}
  return null}
 return {detect:detect}})();
if(typeof module!=='undefined')module.exports=KairPat;
// 2.63-CP этап 1: журнал закрытых свечей. Сигналов и ордеров нет. Движок 2.62-SM не меняется.
var KairCP=(function(){
 var EPS=1e-8;
 function gte(a,b){return a>=b-EPS}
 function lte(a,b){return a<=b+EPS}
 function ok(c){return !!c&&isFinite(c.o)&&isFinite(c.h)&&isFinite(c.l)&&isFinite(c.c)&&c.h>=c.l&&c.h>=c.o&&c.h>=c.c&&c.l<=c.o&&c.l<=c.c}
 function body(c){return Math.abs(c.c-c.o)}
 function up(c){return c.h-Math.max(c.o,c.c)}
 function dn(c){return Math.min(c.o,c.c)-c.l}
 function bull(c){return c.c>c.o}
 function bear(c){return c.c<c.o}
 function at(c,i){return i>=0&&i<c.length&&ok(c[i])?c[i]:null}
 function hammer(c){var b=body(c);return b>0&&gte(dn(c),1.5*b)&&lte(up(c),0.5*b)&&gte(Math.min(c.o,c.c),(c.h+c.l)/2)}
 function star(c){var b=body(c);return b>0&&gte(up(c),1.5*b)&&lte(dn(c),0.5*b)&&lte(Math.max(c.o,c.c),(c.h+c.l)/2)}
 function mid(c){return c.o+0.5*(c.c-c.o)}
 function detectLast(c){var i=c.length-1,cur=at(c,i),prev=at(c,i-1),out=[];if(!cur)return out;
  if(prev&&bear(prev)&&bull(cur)&&lte(cur.o,prev.c)&&gte(cur.c,prev.o))out.push({name:'Bullish Engulfing',dir:'CALL',weak:0});
  if(prev&&bull(prev)&&bear(cur)&&gte(cur.o,prev.c)&&lte(cur.c,prev.o))out.push({name:'Bearish Engulfing',dir:'PUT',weak:0});
  if(prev&&bear(prev)&&hammer(cur))out.push({name:'Hammer',dir:'CALL',weak:0});
  if(prev&&bull(prev)&&star(cur))out.push({name:'Shooting Star',dir:'PUT',weak:0});
  if(hammer(cur)&&i>=3){var n=0,k;for(k=1;k<=3;k++){var x=at(c,i-k);if(x&&bull(x))n++}if(n>=2)out.push({name:'Hanging Man',dir:'PUT',weak:0})}
  if(prev&&bear(prev)&&bull(cur)&&gte(cur.c,mid(prev)))out.push({name:'Piercing Line',dir:'CALL',weak:1});
  if(prev&&bull(prev)&&bear(cur)&&lte(cur.c,mid(prev)))out.push({name:'Dark Cloud Cover',dir:'PUT',weak:1});
  return out}
 function csv(rows){var q=function(x){x=String(x==null?'':x);return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};
  var cols=['n','time','pair','tf','name','dir','close','weakened','body','lower','upper','lower_body','upper_body','px1','res1','px2','res2','px3','res3'];
  return cols.join(',')+'\n'+(rows||[]).map(function(r){return [r.n,r.time,r.pair,r.tf,r.name,r.dir,r.close,r.weak?'ослабленный':'',r.body,r.lower,r.upper,r.lowerBody,r.upperBody,r.px1,r.res1,r.px2,r.res2,r.px3,r.res3].map(q).join(',')}).join('\n')}
 function shape(c,dec){var b=body(c),d=dn(c),u=up(c),p=Math.max(dec||2,5);function f(x){return isFinite(x)?x.toFixed(p):''}
  return {body:f(b),lower:f(d),upper:f(u),lowerBody:b>0?(d/b).toFixed(2):'',upperBody:b>0?(u/b).toFixed(2):''}}
 function verdict(dir,entry,fut){var a=+entry,b=+fut;if(!isFinite(a)||!isFinite(b))return '';if(b===a)return 'D';if(dir==='CALL')return b>a?'W':'L';return b<a?'W':'L'}
 return {detectLast:detectLast,csv:csv,shape:shape,verdict:verdict};
})();
var KAIR_CP_STRATEGY="СТРАТЕГИЯ 2.63-CP (этап 1, тест)\nТолько журнал. Сигналов нет. Ордеров нет. 2.62-SM заглушена и этой кнопкой больше не показывается.\nCALL/PUT — направление паттерна, не сделка.\n\n1. Bullish Engulfing → CALL. Первая медвежья, вторая бычья, тело второй > 0. Open2 ≤ Close1 и Close2 ≥ Open1.\n2. Bearish Engulfing → PUT. Зеркально.\n3. Hammer → CALL. Тело > 0. Нижняя тень ≥ 1.5× тела, верхняя ≤ 0.5× тела, тело в верхней половине диапазона. Предыдущая свеча медвежья.\n4. Shooting Star → PUT. Тело > 0. Верхняя тень ≥ 1.5× тела, нижняя ≤ 0.5× тела, тело в нижней половине. Предыдущая бычья.\n5. Hanging Man → PUT. Тело > 0. Тени и тело как у Hammer. Из трёх свечей непосредственно перед паттерновой минимум две бычьи.\n6. Piercing Line → CALL, флаг ослабленный. Первая медвежья, вторая бычья. Close2 не ниже середины тела первой. Open2 < Low1 не проверяется.\n7. Dark Cloud Cover → PUT, флаг ослабленный. Зеркально Piercing Line.\n\nНесколько паттернов на одной свече пишутся все. Engulfing одновременно даёт Piercing или Dark Cloud.\nСтрока: номер, время свечи, пара, ТФ кнопки KAIR, название, CALL/PUT, цена закрытия, флаг ослабленный, тело, нижняя тень, верхняя тень, низ/тело, верх/тело.\nЧерез 1, 2 и 3 закрытые свечи после паттерновой пишутся цена и W/L. CALL — W, если цена выше закрытия паттерна. PUT — W, если ниже. Равная цена — D. Это не сигнал и не ордер.\nТФ берётся с кнопки панели, а не с графика Pocket Option, если они разные.\n";
var KAIR_STRAT_MUTE=true; // v3.42: стратегия 2.62-SM заглушена (сигналы не генерируются); журнал, CSV, Exp., ТЕСТ, СИГ работают
var KairS39=(function(){
 var FR=5,KairFR=FR,LEVELS=[0.0,0.5,0.62,0.705,0.79,0.886,1.0,1.382,1.618],EXP_CANDLES=3,GRID='фрактал',STEP_DEFAULT=0.0005,LIFE=30,DEEP=0.886,MIN_PAYOUT=90;
 var S={FR:FR,LEVELS:LEVELS,GRID:GRID,STEP_DEFAULT:STEP_DEFAULT,STEP:STEP_DEFAULT,LIFE:LIFE,DEEP:DEEP};
 S.slotMs=function(tf){var T={S5:5000,S10:10000,S15:15000,S30:30000,M1:60000,M2:120000,M3:180000,M5:300000};return T[tf]||null}; // v3.42: S5–M5
 S.expMin=function(tf){return Math.trunc((S.slotMs(tf)||60000)*EXP_CANDLES/60000)};
 S.fm=function(x,d){ // как String.format("%.df") в Java: HALF_UP по кратчайшему десятичному виду
  if(!isFinite(x))return String(x);var neg=x<0||Object.is(x,-0);var s=Math.abs(x).toPrecision(17);s=String(Math.abs(x));
  if(/e/i.test(s)){s=Math.abs(x).toFixed(Math.min(100,d+20))}
  var p=s.split('.'),ip=p[0],fp=(p[1]||'');if(fp.length<=d){fp=fp+'0'.repeat(d-fp.length)}
  else{var up=fp.charCodeAt(d)>=53;fp=fp.slice(0,d);if(up){var digs=(ip+fp).split('').map(Number),i=digs.length-1;while(i>=0){if(digs[i]===9){digs[i]=0;i--}else{digs[i]++;break}}if(i<0)digs.unshift(1);
   var all=digs.join('');ip=all.slice(0,all.length-d)||'0';fp=all.slice(all.length-d)}}
  var r=d>0?ip+'.'+fp:ip;if(neg&&/[1-9]/.test(r))r='-'+r;return r};
 S.kstr=function(k){return Number.isInteger(k)?k.toFixed(1):String(k)}; // как Double.toString в Kotlin
 S.kt=function(k){return k===0.5?'0.5(граница)':S.kstr(k)};
 S.Mem=function(){this.reset()};
 S.Mem.prototype.reset=function(){this.active=null;this.issued=[];this.lastSwingsKey='';this.lastGridKey='';this.lastFollow='';this.trend=null};
 S.fractals=function(c){var raw=[],i,k,ok,FR=S.frTest||KairFR; // S.frTest задаёт только тест-режим (3.9); 2.62-SM = 5
  for(i=FR;i<c.length-FR;i++){
   ok=true;for(k=1;k<=FR;k++)if(!(c[i].h>c[i-k].h&&c[i].h>=c[i+k].h)){ok=false;break} if(ok)raw.push({i:i,t:c[i].t,hi:true,p:c[i].h});
   ok=true;for(k=1;k<=FR;k++)if(!(c[i].l<c[i-k].l&&c[i].l<=c[i+k].l)){ok=false;break} if(ok)raw.push({i:i,t:c[i].t,hi:false,p:c[i].l})}
  var out=[];raw.forEach(function(s){var last=out[out.length-1];
   if(last&&last.hi===s.hi){if((s.hi&&s.p>last.p)||(!s.hi&&s.p<last.p))out[out.length-1]=s;return}out.push(s)});return out};
 S.retr=function(m,k){return m.end-k*(m.end-m.start)};
 S.ext=function(m,k){return m.start+k*(m.end-m.start)};
 S.roundIn=function(lo,hi,step){step=step||S.STEP;var a=Math.ceil(lo/step-1e-6),b=Math.floor(hi/step+1e-6),r=[];for(var x=a;x<=b;x++)r.push(Math.round(x*step*1e7)/1e7);return r};
 S.obs=function(c,m){var r=[];for(var i=m.iStart;i<=m.iEnd;i++)if(m.up?c[i].c<c[i].o:c[i].c>c[i].o)r.push(i);return r.slice(-3).map(function(i){return [c[i].l,c[i].h]})};
 S.fvgs=function(c,m){var r=[];for(var i=Math.max(m.iStart+2,2);i<=m.iEnd;i++){
  if(m.up&&c[i-2].h<c[i].l)r.push([c[i-2].h,c[i].l]);else if(!m.up&&c[i-2].l>c[i].h)r.push([c[i].h,c[i-2].l])}return r};
 S.inter=function(a,b){var lo=Math.max(a[0],b[0]),hi=Math.min(a[1],b[1]);return lo<=hi?[lo,hi]:null};
 // v3.26: логика 2.40 (pickOrder/onClosed, фрактал 10) удалена, сигнал считает KairSM (2.62-SM)
 // ---- Payout / SlotTiming (как в KAIR) ----
 var Payout={MIN_PAYOUT:MIN_PAYOUT,ok:function(p){return p!=null&&p>=MIN_PAYOUT},plateText:function(p){return p!=null?'ВЫПЛАТА '+p+'% < '+MIN_PAYOUT+'%':'Выплата не прочитана'}};
 var SlotTiming={guardMs:function(s){return s<=15000?1000:3000},inGuard:function(now,s){return s>0&&now%s<SlotTiming.guardMs(s)}};
 var Engine=KairSM.Engine; // v3.26: движок 2.62-SM
 // ---- Свечи из тиков (вместо распознавания скриншота) ----
 function Candles(){this.reset()}
 Candles.prototype.reset=function(){this.sym=null;this.bars={};this.dec=0;this.lastTs=0};
 Candles.prototype.tick=function(sym,ts,price,slotMs){if(!(price>0)||!isFinite(price))return;
  if(this.sym!==sym){this.reset();this.sym=sym}
  var s=String(price),d=s.indexOf('.')<0?0:s.length-s.indexOf('.')-1;if(d>this.dec)this.dec=Math.min(d,6);
  var slot=Math.floor(ts/slotMs),b=this.bars[slot];if(!b)this.bars[slot]=b={o:price,h:price,l:price,c:price};else{b.h=Math.max(b.h,price);b.l=Math.min(b.l,price);b.c=price}
  this.lastTs=ts;this.lastPrice=price};
 // закрытые свечи до слота nowSlot (без живой), не больше max, пропуски заполняются плоской свечой (по закрытию предыдущей)
 Candles.prototype.closed=function(nowSlot,max){var ks=Object.keys(this.bars).map(Number).filter(function(k){return k<nowSlot}).sort(function(a,b){return a-b});
  if(!ks.length)return [];var out=[],prev=null,from=Math.max(ks[0],nowSlot-max);
  for(var s=ks[0];s<nowSlot;s++){var b=this.bars[s];if(!b&&prev)b={o:prev.c,h:prev.c,l:prev.c,c:prev.c};if(b&&s>=from)out.push(b);if(b)prev=b}
  for(var k in this.bars)if(+k<nowSlot-max-5)delete this.bars[k];return out};
 return {S:S,Payout:Payout,SlotTiming:SlotTiming,Engine:Engine,Candles:Candles};
})();
if(typeof module!=='undefined')module.exports=KairS39;
// v3.5 ТЕСТ-РЕЖИМ: имитация сделок по вариантам C1, C2, E1(TODO), E2 и журнал EXT. Логику 2.40 (KairS39) не меняет.
var KairTest=(function(){
 var S=KairS39.S,TFR=5,FR=TFR,EXP=3,LSK='kair_test_trades',DSK='kair_test_done',EXTK=[1.382,1.618,1.886,2.236],BOUNCE_X=0.1,PATH_MAX=30,
  ITEMS=[['0',0,0],['0.5',0.5,0.5],['0.705–0.79',0.705,0.79],['1',1,1],['1.382–1.618',1.382,1.618],['1.886–2.236',1.886,2.236]];
 // v3.6 путь цены по уровням пользователя в k-пространстве сетки: kOf(price) даёт k (0 = старт сетки, 1 = A для коррекции / C+(B−A) для расширения)
 // касание = тень вошла в уровень/зону (после свечи без касания); пробой = закрытие по другую сторону от той, где цена была до этого;
 // отскок = разворот (в статистике — не больше одного отскока на одно касание уровня)
 // отскок = разворот не меньше BOUNCE_X·AB от экстремума; «к уровню» = ближайший к концу отката уровень, пройденный откатом
 function path(c,j0,jEnd,kOf){var ev=[],st={},side={},was={},bn={},dir=1,ext=0,piv=null;ITEMS.forEach(function(it){st[it[0]]=[0,0,0];side[it[0]]=0>it[2]?1:(0<it[1]?-1:0);was[it[0]]=false});
  function near(k){var b=null,bd=0.05;ITEMS.forEach(function(it){var d=k<it[1]?it[1]-k:(k>it[2]?k-it[2]:0);if(d<=bd){bd=d;b=it[0]}});return b}
  function closeLeg(){if(!piv)return;var lo=Math.min(piv.k,ext),hi=Math.max(piv.k,ext),to=null,td=1e9;ITEMS.forEach(function(it){if(it[2]>=lo-1e-9&&it[1]<=hi+1e-9&&it[0]!==piv.from){var d=Math.min(Math.abs(it[1]-ext),Math.abs(it[2]-ext));if(d<td){td=d;to=it[0]}}});
   piv.e.txt='bounce'+(piv.from?' from '+piv.from:'')+' to '+(to||('k '+ext.toFixed(3)))+' ('+Math.abs(piv.k-ext).toFixed(2)+' AB)';piv=null}
  for(var j=j0;j<=jEnd&&j<c.length;j++){var x=c[j],a=kOf(x.h),b=kOf(x.l),kh=Math.max(a,b),kl=Math.min(a,b),kc=kOf(x.c);
   ITEMS.forEach(function(it){var t=kh>=it[1]&&kl<=it[2];if(t&&!was[it[0]]){st[it[0]][0]++;bn[it[0]]=false;ev.push({txt:it[0]+' touch'})}was[it[0]]=t;
    var sd=kc<it[1]?-1:(kc>it[2]?1:0);if(sd!==0){if(side[it[0]]!==0&&sd!==side[it[0]]){st[it[0]][2]++;ev.push({txt:'break '+it[0]})}side[it[0]]=sd}});
   if(dir>0){var nh=kh>ext,rv=nh?(ext=kh,kc<=ext-BOUNCE_X):kl<=ext-BOUNCE_X;if(rv){closeLeg();var f=near(ext);if(f&&st[f][0]&&!bn[f]){st[f][1]++;bn[f]=true}var e={txt:''};ev.push(e);piv={k:ext,from:f,e:e};dir=-1;ext=nh?kc:kl}}
   else{var nl=kl<ext,rv2=nl?(ext=kl,kc>=ext+BOUNCE_X):kh>=ext+BOUNCE_X;if(rv2){closeLeg();var f2=near(ext);if(f2&&st[f2][0]&&!bn[f2]){st[f2][1]++;bn[f2]=true}var e2={txt:''};ev.push(e2);piv={k:ext,from:f2,e:e2};dir=1;ext=nl?kc:kh}}}
  closeLeg();return {txt:ev.map(function(e){return e.txt}).join(' → ')||'—',st:st}}

 var pickC1=function(c,m,tf,key,log){var ob=S.obs(c,m),fv=S.fvgs(c,m);
  function band(k1,k2){var a=S.retr(m,k1),b=S.retr(m,k2);return [Math.min(a,b),Math.max(a,b)]}
  var zones=[['OTE 0.705-0.79',band(0.705,0.79)]]; // C1: только 0.705-0.79, без 0.62 и 0.886
  for(var zi=0;zi<zones.length;zi++){var name=zones[zi][0],z=zones[zi][1],liq=[];
   ob.forEach(function(o){var oz=S.inter(o,z);if(oz){var f=null;for(var j=0;j<fv.length&&!f;j++)f=S.inter(fv[j],oz);
     if(f)liq.push([f,true,'OB+FVG']);else liq.push([oz,false,'OB'])}});
   fv.forEach(function(f){var x=S.inter(f,z);if(x)liq.push([x,false,'FVG'])});
   liq=liq.map(function(l,i){return [l,i]}).sort(function(a,b){return (b[0][1]?1:0)-(a[0][1]?1:0)||a[1]-b[1]}).map(function(x){return x[0]});
   var pick=null;for(var li=0;li<liq.length&&!pick;li++){var l=liq[li],r=S.roundIn(l[0][0],l[0][1]);if(r.length){var mid=(l[0][0]+l[0][1])/2,best=r[0];
     r.forEach(function(x){if(Math.abs(x-mid)<Math.abs(best-mid))best=x});pick=[l,best]}}
   if(!pick){var rz=S.roundIn(z[0],z[1]);
    var lq=liq.length===0?'OB/FVG в зоне нет':'OB/FVG в зоне: '+liq.map(function(l){return l[2]+' '+S.fm(l[0][0],5)+'-'+S.fm(l[0][1],5)}).join(', ');
    var why=rz.length===0?'нет круглой цены (шаг '+S.fm(S.STEP,4)+') в зоне; '+lq:'круглая цена '+rz.map(function(x){return S.fm(x,5)}).join(', ')+' в зоне, но OB/FVG на ней нет; '+lq;
    log(tf+' зона '+name+' ['+S.fm(z[0],6)+'-'+S.fm(z[1],6)+']: '+why);continue}
   var beyond=false;for(var i=m.iEnd+1;i<c.length;i++)if(m.up?c[i].c<z[0]:c[i].c>z[1]){beyond=true;break}
   if(beyond){log(tf+' зона '+name+': цена уже закрылась за зоной — нет ордера');return null}
   return {up:m.up,price:pick[1],lo:z[0],hi:z[1],strong:pick[0][1],zone:name,key:key,src:pick[0][2],grid:'фрактал',anchor:m.start}}
  return null};

 // 3.10: несколько вкладок. Каждая вкладка (загрузка страницы) пишет строки только в свой ключ LSK|<tab>, чужие не перезаписывает.
 // Ключи «уже записано» (DSK) общие: при сохранении читаем свежие из storage и сливаем, чтобы одна свеча не попала в журнал дважды.
 // CSV и сводка — по всем вкладкам; старый ключ LSK (до 3.10) читается как вкладка 'old'.
 var WARM=40;
 function newTab(){return Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,5)}
 function rd(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}}
 function Sim(tab){this.mem={C1:new S.Mem(),C2:new S.Mem()};this.pend=[];this.open=[];this.ctx='';
  this.tab=tab||newTab();this.key=LSK+'|'+this.tab;this.rows=rd(this.key,[]);this.done=rd(DSK,{});this.nd={};
  this.warm={};this.pair=null;this.starts=rd(this.key+'|starts',[]);this._all=null}
 Sim.prototype.save=function(){if(this.rows.length>5000)this.rows=this.rows.slice(-5000);
  var d=rd(DSK,{});for(var k in this.nd)d[k]=1;this.nd={};var ks=Object.keys(d);if(ks.length>6000)ks.slice(0,ks.length-6000).forEach(function(k){delete d[k]});
  for(k in d)this.done[k]=1;
  try{localStorage.setItem(this.key,JSON.stringify(this.rows));localStorage.setItem(this.key+'|starts',JSON.stringify(this.starts));localStorage.setItem(DSK,JSON.stringify(d));this.full=false}catch(e){this.full=true}this._all=null};
 // все строки всех вкладок (кэш 5 с)
 Sim.prototype.all=function(){var now=Date.now();if(this._all&&now-this._allT<5000)return this._all;var out=[],self=this;
  rd(LSK,[]).forEach(function(r){r.tab=r.tab||'old';out.push(r)});
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(LSK+'|')===0&&k!==this.key&&!/\|starts$/.test(k))rd(k,[]).forEach(function(r){out.push(r)})}
  this.rows.forEach(function(r){out.push(r)});this._all=out;this._allT=now;return out};
 Sim.prototype.allStarts=function(){var out=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(LSK+'|')===0&&/\|starts$/.test(k)&&k!==this.key+'|starts')out=out.concat(rd(k,[]))}return out.concat(this.starts)};
 function hm(t,sm){var d=new Date(t*sm);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}
 function res(call,en,ex){return ex===en?'D':((call?ex>en:ex<en)?'W':'L')}
 Sim.prototype.add=function(key,r,t){if(this.done[key])return;this.done[key]=1;this.nd[key]=1;r.period=TFR;r.tab=this.tab;
  var w=this.warm[r.pair+'|'+r.tf];r.warmup=(w!=null&&t!=null&&t<w+WARM)?1:0;if(r.pay==null)r.pay=this.pay==null?'':this.pay;this.rows.push(r);this._all=null};
 // c: закрытые свечи {t(номер слота),o,h,l,c} от старой к новой; вызывать один раз на новый закрытый слот
 // 3.9: на время шага теста период фрактала = TFR (5); после шага возвращается 10 для 2.40
 Sim.prototype.step=function(c,tf,pair,pay,dec){var keep=S.frTest;S.frTest=TFR;try{return this._step(c,tf,pair,pay,dec)}finally{S.frTest=keep}};
 Sim.prototype._step=function(c,tf,pair,pay,dec){var self=this,sm=S.slotMs(tf),ctx=pair+'|'+tf+'|p'+TFR;if(!c.length)return;this.pay=pay;
  // 3.10 прогрев: после загрузки страницы или смены пары первые WARM свечей каждого ТФ помечаются warmup=1
  if(pair!==this.pair){this.pair=pair;this.warm={}}var wk=pair+'|'+tf;if(this.warm[wk]==null){this.warm[wk]=c[c.length-1].t;
   this.starts.push({tab:this.tab,pair:pair,tf:tf,start:hm(c[c.length-1].t,sm),warm_until:hm(c[c.length-1].t+WARM,sm),at:new Date().toISOString()})}
  if(ctx!==this.ctx){this.ctx=ctx;this.mem.C1.reset();this.mem.C2.reset();this.pend=[];this.open=[]}
  var k=c[c.length-1],byT={};c.forEach(function(x){byT[x.t]=x});var nolog=function(){};
  // --- C1 / C2: ордера 2.40 (C2 без изменений; C1 = pickOrder только 0.705-0.79) ---
  ['C1','C2'].forEach(function(v){var mem=self.mem[v],evs,keep=S.pickOrder;
   try{if(v==='C1')S.pickOrder=pickC1;evs=S.onClosed(mem,c,tf,dec,[],nolog)}catch(e){evs=[]}finally{S.pickOrder=keep}
   evs.forEach(function(e){if(e.kind==='CANCEL'){var o=e.order;self.add(ctx+'|'+v+'|'+o.key+'|X',{time:hm(k.t,sm),pair:pair,tf:tf,v:v,dir:o.up?'CALL':'PUT',entry:S.fm(o.price,dec),close:'',res:'CANCEL',deep:'',cancel:e.why||'',zone:o.src||'',k:o.zone||'',A:S.fm(o.anchor,dec),B:'',C:''},k.t);
     self.pend=self.pend.filter(function(p){return !(p.v===v&&p.key===o.key)})}
    else if(e.kind==='NEW'){var o=e.order,ma=mem.active;self.pend.push({v:v,key:o.key,up:o.up,price:o.price,t0:k.t,start:ma.anchor,end:null,src:o.src,zone:o.zone})}})});
  this.pend=this.pend.filter(function(p){if(p.end===null){var fr=S.fractals(c);p.end=fr.length?fr[fr.length-1].p:p.price}
   if(k.t<=p.t0)return true;if(p.up?k.l<=p.price:k.h>=p.price){self.open.push({v:p.v,key:p.key,up:p.up,price:p.price,tOpen:k.t,start:p.start,end:p.end,t0:p.t0,src:p.src,zone:p.zone});return false}return true});
  this.open=this.open.filter(function(o){var ex=byT[o.tOpen+EXP];if(!ex)return k.t<o.tOpen+EXP+5;var ext=null;
   for(var t=o.t0+1;t<=o.tOpen+EXP;t++){var x=byT[t];if(!x)continue;var v=o.up?x.l:x.h;if(ext===null||(o.up?v<ext:v>ext))ext=v}
   var deep=o.end!==o.start?(o.end-ext)/(o.end-o.start):0;
   self.add(ctx+'|'+o.v+'|'+o.key,{time:hm(o.tOpen,sm),pair:pair,tf:tf,v:o.v,dir:o.up?'CALL':'PUT',entry:S.fm(o.price,dec),close:S.fm(ex.c,dec),res:res(o.up,o.price,ex.c),deep:deep.toFixed(3),zone:o.src||'',k:o.zone||'',A:S.fm(o.start,dec),B:S.fm(o.end,dec),C:''},o.tOpen);return false});
  // --- E: тройки подтверждённых фракталов A,B,C (расширение = C + k·(B−A)) ---
  var fr=S.fractals(c);
  for(var i=0;i+2<fr.length;i++){var A=fr[i],B=fr[i+1],C=fr[i+2];if(A.hi===B.hi||A.i<2*FR)continue;var AB=B.p-A.p,up=AB>0,gk=ctx+'|'+B.t+':'+C.t,N=fr[i+3];
   var L=function(q){return C.p+q*AB},endI=Math.min(N?N.i:c.length-1,C.i+30),fin=!!N||c.length-1>=C.i+30;
   // журнал EXT: самый глубокий уровень расширения, достигнутый после C
   if(fin&&!this.done[gk+'|EXT']){var best=null,bp=null;for(var j=C.i+1;j<=endI;j++){var hp=up?c[j].h:c[j].l;EXTK.forEach(function(q){if(up?hp>=L(q):hp<=L(q)){if(best===null||q>best){best=q;bp=L(q)}}})}
    this.add(gk+'|EXT',{time:hm(C.t,sm),pair:pair,tf:tf,v:'EXT',dir:'',entry:'',close:bp===null?'':S.fm(bp,dec),res:best===null?'<1.382':String(best),deep:((up?(B.p-C.p):(C.p-B.p))/Math.abs(AB)).toFixed(3),A:S.fm(A.p,dec),B:S.fm(B.p,dec),C:S.fm(C.p,dec)},C.t)}
   // E1 (пользователь) — не вход, а журнал пути цены по его уровням расширения: C + k·(B−A)
   if(fin&&!this.done[gk+'|E1P']){var pe=path(c,C.i+1,endI,function(pr){return (pr-C.p)/AB});this.add(gk+'|E1P',{time:hm(C.t,sm),pair:pair,tf:tf,v:'E1-path',dir:up?'вверх':'вниз',entry:'',close:'',res:'',deep:'',path:pe.txt,st:pe.st,A:S.fm(A.p,dec),B:S.fm(B.p,dec),C:S.fm(C.p,dec)},C.t)}
   // E2 (стратег): откат C в 0.382-0.886 AB; зона 1.272-1.618; вход на отбое, против продолжения; эксп 3 свечи
   if(!this.done[gk+'|E2'])this.e2(c,A,B,C,fr[i+3],gk,ctx,tf,pair,pay,dec,sm)}
  // C1-path (пользователь): путь цены по его уровням коррекции, сетка A→B (1 в A, 0 в B): k=(B−цена)/(B−A)
  for(var q=0;q+1<fr.length;q++){var PA=fr[q],PB=fr[q+1],PN=fr[q+2];if(PA.hi===PB.hi||PA.i<2*FR)continue;var ck=ctx+'|'+PA.t+':'+PB.t+'|C1P';if(this.done[ck])continue;
   var cEnd=Math.min(PN?PN.i:c.length-1,PB.i+PATH_MAX);if(!(PN||c.length-1>=PB.i+PATH_MAX))continue;
   var pc=path(c,PB.i+1,cEnd,function(pr){return (PB.p-pr)/(PB.p-PA.p)});this.add(ck,{time:hm(PB.t,sm),pair:pair,tf:tf,v:'C1-path',dir:PB.p>PA.p?'вверх':'вниз',entry:'',close:'',res:'',deep:'',path:pc.txt,st:pc.st,A:S.fm(PA.p,dec),B:S.fm(PB.p,dec),C:''},PB.t)}
  this.save()};
 Sim.prototype.e2=function(c,A,B,C,N,gk,ctx,tf,pair,pay,dec,sm){var AB=B.p-A.p,up=AB>0,r=(B.p-C.p)/AB,self=this;
  var fin=function(){self.done[gk+'|E2']=1;self.nd[gk+'|E2']=1};
  if(!(r>=0.382&&r<=0.886)){fin();return}
  var L=function(q){return C.p+q*AB},z1=L(1.272),z2=L(1.618),deepK=0;
  for(var j=C.i+1;j<c.length;j++){var x=c[j],hp=up?x.h:x.l,kk=(hp-C.p)/AB;if(kk>deepK)deepK=kk;
   var touch=up?x.h>=z1:x.l<=z1;
   if(!touch&&j-C.i>=30){fin();return}                         // 30 свечей от C без касания зоны
   if(!touch&&N&&N.i<=j){fin();return}                          // новый фрактал до касания зоны
   if(up?x.c>z2:x.c<z2){fin();return}                           // закрытие за 1.618
   if(j<C.i+FR)continue;                                        // C ещё не подтверждён
   var rej=touch&&(up?(x.c<=z2&&x.c<x.o):(x.c>=z2&&x.c>x.o));   // отбой: тень в зоне, закрытие обратно к C
   if(!rej)continue;
   if(pay!=null&&pay<90){fin();return}                          // выплата ниже 90%
   var en=c[j+1],ex=c[j+3];if(!en||!ex)return;                  // ждём свечу входа и экспирацию
   var call=!up;this.add(gk+'|E2',{time:hm(en.t,sm),pair:pair,tf:tf,v:'E2',dir:call?'CALL':'PUT',entry:S.fm(en.o,dec),close:S.fm(ex.c,dec),res:res(call,en.o,ex.c),deep:deepK.toFixed(3),k:((en.o-C.p)/AB).toFixed(3),A:S.fm(A.p,dec),B:S.fm(B.p,dec),C:S.fm(C.p,dec)},en.t);return}};
 function per(r){return r.period||10}
 function cnt(r){return per(r)===TFR&&!r.warmup}
 Sim.prototype.levels=function(p){p=p||TFR;var o={};this.all().forEach(function(r){if(!r.st||per(r)!==p||r.warmup)return;var m=o[r.v]||(o[r.v]={});for(var k in r.st){var a=m[k]||(m[k]=[0,0,0]);a[0]+=r.st[k][0];a[1]+=r.st[k][1];a[2]+=r.st[k][2]}});
  var out=[];['C1-path','E1-path'].forEach(function(v){ITEMS.forEach(function(it){var a=(o[v]||{})[it[0]]||[0,0,0];out.push({period:p,v:v,lvl:it[0],touch:a[0],bounce:a[1],brk:a[2],rate:a[0]?Math.round(a[1]/a[0]*1000)/10:0})})});return out};
 Sim.prototype.summary=function(pay){var o={};['C1','C2','E1','E2'].forEach(function(v){o[v]={N:0,W:0,L:0,D:0}});var ext={};
  this.all().forEach(function(r){if(!cnt(r)||r.st||r.res==='CANCEL')return;if(r.v==='EXT'){ext[r.res]=(ext[r.res]||0)+1;return}var s=o[r.v];if(!s)return;s.N++;s[r.res]++});
  for(var v in o){var s=o[v];s.WR=s.W+s.L?Math.round(s.W/(s.W+s.L)*1000)/10:0;s.net=Math.round((s.W*(pay||0)/100-s.L)*100)/100}return {v:o,ext:ext}};
 Sim.prototype.csv=function(){var q=function(x){x=String(x==null?'':x);return /[,"\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};var h='time,pair,tf,tab,period,warmup,payout_pct,variant,direction,entry,expiry_close,result,cancel_reason,zone_type,k_level,A,B,C,deep_fibo,path',self=this,ps={},rows=this.all();rows.forEach(function(r){ps[per(r)]=1});return h+'\n'+rows.map(function(r){var u=function(x){return x==null?'':x};return [r.time,r.pair,r.tf,r.tab||'old',per(r),r.warmup?1:0,u(r.pay),r.v,r.dir,r.entry,r.close,r.res,u(r.cancel),u(r.zone),u(r.k),u(r.A),u(r.B),u(r.C),r.deep,r.path||''].map(function(x){x=String(x==null?'':x);return /[,"]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(',')}).join('\n')+'\n\nperiod,variant,level,touches,bounces,breaks,bounce_rate_pct\n'+Object.keys(ps).map(Number).sort().reduce(function(a,p){return a.concat(self.levels(p))},[]).map(function(l){return [l.period,l.v,l.lvl,l.touch,l.bounce,l.brk,l.rate].map(q).join(',')}).join('\n')+'\n\ntab,pair,tf,start,warmup_until,started_at_utc\n'+this.allStarts().map(function(z){return [z.tab,z.pair,z.tf,z.start,z.warm_until,z.at].map(q).join(',')}).join('\n')};
 Sim.prototype.count=function(p){return this.all().filter(function(r){return per(r)===p}).length};
 return {Sim:Sim,pickC1:pickC1,path:path,BOUNCE_X:BOUNCE_X,TFR:TFR,WARM:WARM};
})();
if(typeof module!=='undefined')module.exports=KairTest;
// Источник данных сигнала — только ЧТЕНИЕ. Котировки: подсматриваем входящие сообщения WebSocket страницы
// (геттер MessageEvent.data; ничего не отправляем, данные страницы не меняем). Выплата — из текста страницы.
// Пока СИГ выключен — сообщения не разбираются вообще.
var KairFeed=(function(){
 var F={on:false,onTick:null,stat:{msgs:0,ticks:0,lastTickAt:0,syms:{}}};
 var dec=typeof TextDecoder!=='undefined'?new TextDecoder():null;
 function walk(v,depth,out){if(depth>6||out.length>200)return;if(Array.isArray(v)){
   if(v.length>=3&&typeof v[0]==='string'&&typeof v[1]==='number'&&typeof v[2]==='number'&&v[1]>1e9&&v[2]>0&&v[0].length<40){out.push(v);return}
   for(var i=0;i<v.length&&i<500;i++)walk(v[i],depth+1,out)}else if(v&&typeof v==='object'){for(var k in v)walk(v[k],depth+1,out)}}
 function parseText(s){if(!F.on||!s||s.length>2e6)return;var i=s.search(/[\[{]/);if(i<0)return;var j;try{j=JSON.parse(s.slice(i))}catch(e){return}
  try{hist(j,0)}catch(e){}
  var out=[];walk(j,0,out);var now=Date.now();out.forEach(function(t){F.stat.ticks++;F.stat.lastTickAt=now;F.stat.syms[t[0]]=now;if(F.onTick)F.onTick(t[0],now,t[2])})}
 // v3.35: история свечей PO (updateHistoryNewFast/loadHistoryPeriod): {asset, period, history:[[t,price]], candles:[[t,o,c,h,l]]} или data:[{time,open,close,high,low}]
 function hist(j,dp){if(!j||typeof j!=='object'||dp>3||!F.onHist)return;if(Array.isArray(j)){for(var i=0;i<j.length&&i<4;i++)hist(j[i],dp+1);return}
  var sym=j.asset||j.symbol||j.symbol_id;if(typeof sym==='string'){var pts=[],per=+j.period||0,ms=function(t){return t<1e11?t*1000:t};
   if(Array.isArray(j.candles))j.candles.forEach(function(c){if(Array.isArray(c)&&c.length>=5&&c[0]>1e9)pts.push([ms(c[0]),c[1]],[ms(c[0]),c[3]],[ms(c[0]),c[4]],[ms(c[0]),c[2]])});
   if(Array.isArray(j.data))j.data.forEach(function(c){if(c&&c.time>1e9&&c.open>0)pts.push([ms(c.time),c.open],[ms(c.time),c.high],[ms(c.time),c.low],[ms(c.time),c.close])});
   if(!pts.length&&Array.isArray(j.history))j.history.forEach(function(h){if(Array.isArray(h)&&h[0]>1e9&&h[1]>0)pts.push([ms(h[0]),h[1]])});
   if(pts.length){var ct=[];(Array.isArray(j.candles)?j.candles.map(function(c){return Array.isArray(c)?ms(c[0]):0}):[]).concat(Array.isArray(j.data)?j.data.map(function(c){return c?ms(c.time):0}):[]).forEach(function(t){if(t>0)ct.push(t)});ct.sort(function(a,b){return a-b});var dt=0;for(var q=1;q<ct.length;q++){var e=ct[q]-ct[q-1];if(e>0&&(!dt||e<dt))dt=e}if(dt)per=Math.max(per,Math.round(dt/1000)); // v3.38: период свечей истории по их времени (если PO прислал крупные свечи без period)
    F.onHist(sym,pts,per);return}}
  for(var k in j)if(j[k]&&typeof j[k]==='object')hist(j[k],dp+1)}
 F.handle=function(d){F.stat.msgs++;try{if(typeof d==='string')parseText(d);else if(d instanceof ArrayBuffer){if(dec)parseText(dec.decode(d))}
  else if(typeof Blob!=='undefined'&&d instanceof Blob&&d.size<2e6){d.text().then(parseText,function(){})}}catch(e){}};
 F.install=function(){if(window.__kairWsHook)return;window.__kairWsHook=true;
  var desc=Object.getOwnPropertyDescriptor(MessageEvent.prototype,'data');if(!desc||!desc.get)return;var get=desc.get,seen=new WeakSet();
  Object.defineProperty(MessageEvent.prototype,'data',{configurable:true,enumerable:desc.enumerable,get:function(){var v=get.call(this);
   try{if(F.on&&typeof WebSocket!=='undefined'&&this.target instanceof WebSocket&&!seen.has(this)){seen.add(this);F.handle(v)}}catch(e){}return v}})};
 // выплата (только чтение текста страницы): 1) элемент, найденный в прошлый раз; 2) число «+72%» рядом с подписью «Выплата»/«Payout»
 // (подпись и число в одном блоке, до 4 уровней вверх); 3) запасной путь — блоки с payout/profit/percent/income в классе.
 var PCT=/^\+?\s*(\d{1,3})(?:[.,]\d+)?\s*%$/, LBL=/^(выплата|payout|доходность|прибыль|profit)\b/i;
 function pct(e){if(!e||(e.closest&&e.closest('#kair-root,#kair-dov')))return null;var t=(e.textContent||'').replace(/\s+/g,' ').trim();if(t.length>10)return null;var m=t.match(PCT);if(!m)return null;var n=+m[1];return n>=1&&n<=100?n:null}
 // все «самые глубокие» элементы с процентом внутри блока; если их больше одного — блок неоднозначный (например, список активов с колонкой «Выплата»)
 function hits(box,skip){var es=box.querySelectorAll('*'),out=[];for(var i=0;i<es.length&&i<600;i++){var e=es[i];if(skip&&skip.contains(e))continue;if(pct(e)!=null){out=out.filter(function(x){return !x.contains(e)});out.push(e)}}
  if(!out.length&&pct(box)!=null)out.push(box);return out}
 function vis(e){return !!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}
 F.readPayout=function(){var v;
  if(F._pe&&F._pe.isConnected&&(v=pct(F._pe))!=null)return v;F._pe=null;
  var body=document.body;if(!body)return null;
  var w=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,null),n,k=0;
  while((n=w.nextNode())&&k<20000){k++;var t=n.nodeValue;if(!t||t.length>40)continue;t=t.trim();if(!LBL.test(t)||t.length>25)continue;
   var lab=n.parentElement;if(!lab||lab.closest('#kair-root,#kair-dov'))continue;var up=lab;
   if(!vis(lab))continue;
   for(var d=0;d<4;d++){up=up.parentElement;if(!up||up===body)break;var hs=hits(up,lab);if(hs.length>1)break;if(hs.length===1&&vis(hs[0])){F._pe=hs[0];return pct(hs[0])}}}
  var els=document.querySelectorAll('[class*="payout"],[class*="profit"],[class*="percent"],[class*="income"]');
  for(var i=0;i<els.length&&i<300;i++){if(els[i].closest('#kair-root,#kair-dov'))continue;var h2=hits(els[i]);if(h2.length===1&&vis(h2[0])){F._pe=h2[0];return pct(h2[0])}}
  return null};
 return F})();
// v3.39: фоновые движки M1/M3/M5 — ТОЛЬКО журнал. Отдельные экземпляры KairSM.Engine, с движком сигнала не связаны, сигналы/окно не трогают.
var KairBG=(function(){
 var TFS=['M5','M3','M1'],SM={M1:60000,M3:180000,M5:300000},GAP=10000,TICK_KEEP=26*3600000,MAXROWS=5000,FR=5;
 function now(){return Date.now()}
 function B(onLog){this.onLog=onLog||function(){};this.reset(null)}
 var P=B.prototype;
 P.reset=function(sym){this.sym=sym;this.tf={};var self=this;TFS.forEach(function(tf){self.tf[tf]={tf:tf,tick:{},hist:{},fed:null,log:[],eng:null,gid:0,cur:null,snap:null,fr:[]};self.mkEng(tf)});this.lastTs=0;this.pay=null};
 P.mkEng=function(tf){var t=this.tf[tf];t.eng=new KairSM.Engine(function(x){t.log.push(x)});t.fed=null;t.cur=null;t.snap=null};
 // общие журналы (не сбрасываются при смене пары)
 P.J=null;function J(self){return self.J||(self.J={gaps:[],grids:[],near:[],signals:[],fractals:[],mism:[],ticks:[]})}
 function cap(a){if(a.length>MAXROWS)a.splice(0,a.length-MAXROWS)}
 P.tick=function(sym,ts,price,pay){if(!(price>0))return;var j=J(this);if(pay!=null)this.pay=pay;
  if(sym!==this.sym)this.reset(sym);
  if(this.lastTs&&ts-this.lastTs>GAP){j.gaps.push({sym:sym,from:this.lastTs,to:ts,sec:Math.round((ts-this.lastTs)/1000)});cap(j.gaps)}
  if(ts>=this.lastTs)this.lastTs=ts;
  j.ticks.push([ts,sym,price]);if(j.ticks.length>200000)j.ticks.splice(0,j.ticks.length-200000);
  var self=this;TFS.forEach(function(tf){var t=self.tf[tf],sm=SM[tf],sl=Math.floor(ts/sm),b=t.tick[sl];
   if(!b){t.tick[sl]={o:price,h:price,l:price,c:price,first:ts};self.closeUpTo(tf,sl)}else{b.h=Math.max(b.h,price);b.l=Math.min(b.l,price);b.c=price}})};
 // закрыть все слоты < sl (порядок вызова M5,M3,M1 — состояние старшего ТФ обновляется раньше M1 на том же тике)
 P.closeUpTo=function(tf,sl){var t=this.tf[tf],ks=Object.keys(t.tick).map(Number).filter(function(k){return k<sl}).sort(function(a,b){return a-b});if(!ks.length)return;
  var s=t.fed==null?ks[0]:t.fed+1,prev=null;for(;s<sl;s++){var b=t.tick[s]||t.hist[s];if(!b){var lc=this.lastClose(tf);if(lc==null)continue;b={o:lc,h:lc,l:lc,c:lc,flat:1}}this.feed(tf,s,b)}
  for(var k in t.tick)if(+k<sl-700)delete t.tick[k];for(var k2 in t.hist)if(+k2<sl-700)delete t.hist[k2]};
 P.lastClose=function(tf){var c=this.tf[tf].eng.st(tf).c;return c.length?c[c.length-1].c:null};
 function dec(p){var s=String(p),i=s.indexOf('.');return i<0?0:Math.min(6,s.length-i-1)}
 // история PO периода per (сек): прогрев и сверка с тиковыми свечами
 P.hist=function(sym,pts,per,force){var tf=per===60?'M1':per===180?'M3':per===300?'M5':null;if(!tf||!pts||!pts.length)return;if(sym!==this.sym){if(this.sym&&!force&&now()-this.lastTs<5000)return;this.reset(sym)}
  var t=this.tf[tf],sm=SM[tf],H={},j=J(this),nsl=Math.floor(now()/sm);pts.slice().sort(function(a,b){return a[0]-b[0]}).forEach(function(p){var sl=Math.floor(p[0]/sm),b=H[sl];if(!b)H[sl]={o:p[1],h:p[1],l:p[1],c:p[1]};else{b.h=Math.max(b.h,p[1]);b.l=Math.min(b.l,p[1]);b.c=p[1]}});
  Object.keys(H).forEach(function(k){var hb=H[k],tb=t.tick[k];t.hist[k]=hb;
   if(tb&&+k<nsl&&tb.first-k*sm<=2000){var d=Math.pow(10,-Math.max(dec(hb.c),dec(tb.c),1))/2,bad=['o','h','l','c'].filter(function(q){return Math.abs(hb[q]-tb[q])>d});
    if(bad.length){j.mism.push({sym:sym,tf:tf,t:+k*sm,fields:bad.join('|'),hist:[hb.o,hb.h,hb.l,hb.c],tick:[tb.o,tb.h,tb.l,tb.c]});cap(j.mism)}}});
  var e=t.eng.st(tf);if(e.c.length<30){var ks=Object.keys(H).map(Number).filter(function(k){return k<nsl}).sort(function(a,b){return a-b});if(ks.length>=e.c.length+5){this.mkEng(tf);t.warmHist=ks.length;
   var fed=null;for(var q=0;q<ks.length;q++){var b2=t.tick[ks[q]]||H[ks[q]];this.feed(tf,ks[q],b2,true)}}}};
 function zone(g){return KairSM.zone(g)}
 function inGap(self,a,b){var gs=J(self).gaps;for(var i=gs.length-1;i>=0;i--){var g=gs[i];if(g.sym===self.sym&&g.to>a&&g.from<b)return true}return false}
 // одна закрытая свеча в фоновый движок + разбор журнала
 P.feed=function(tf,sl,b,warm){var t=this.tf[tf],e=t.eng,s=e.st(tf),sm=SM[tf],j=J(this),self=this,pay=this.pay;t.fed=sl;t.log.length=0;
  var oldG=s.g,nJ=e.journal.length,closeT=(sl+1)*sm,d=new Date(sl*sm),tm=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  var pendRows=s.trades?s.trades.length:0,pe=s.pendEntry;
  e.bar(tf,{t:sl,o:b.o,h:b.h,l:b.l,c:b.c},{pay:warm?92:pay,dec:5,pair:this.sym,time:tm,opp:false});e.sig={k:'none'};
  var c=s.c,jj=c.length-1,logs=t.log.join(' | ');
  for(var qi=Math.max(0,j.signals.length-20);qi<j.signals.length;qi++){var sr=j.signals[qi].row;if(sr.tf===tf&&sr.entry!==''&&sr.pay_entry==null){sr.pay_entry=warm?'':(pay==null?'':pay);sr.entry_ts=sl*sm}}
  // фракталы
  var atr=KairSM.atrWilder(c,14),nf=s.fr.filter(function(f){return f.conf===jj});
  nf.forEach(function(f){j.fractals.push({sym:self.sym,tf:tf,t:c[f.i].t*sm,hi:f.hi,p:f.p,conf_t:closeT,warm:warm?1:0});cap(j.fractals);
   var g=s.g;if(g&&g.conf===jj&&g.p1===f.p&&g.up===f.hi)return; // стала сеткой
   var p0=null;for(var q=s.fr.length-1;q>=0;q--){var x=s.fr[q];if(x.i>=f.i)continue;if(x.hi===f.hi)break;p0=x;break}
   var row={sym:self.sym,tf:tf,grid_id:'',t_p1:c[f.i].t*sm,dir:f.hi?'bull':'bear',P0:p0?p0.p:'',P1:f.p,ATR:atr[jj]==null?'':+atr[jj].toFixed(7),step:'',shortfall_atr:'',end_t:closeT,invalid_gap:0,warm:warm?1:0,signals:0};
   if(!p0||atr[jj]==null||(f.hi?!(f.p>p0.p):!(f.p<p0.p))){row.step='fractal'}
   else{var imp=Math.abs(f.p-p0.p)/atr[jj],L5=p0.p+0.5*(f.p-p0.p);
    if(imp<1.5){row.step='swing<1.5ATR';row.shortfall_atr=+(1.5-imp).toFixed(3)}
    else if(f.hi?b.c<L5:b.c>L5){row.step='close>0.5';row.shortfall_atr=+(Math.abs(b.c-L5)/atr[jj]).toFixed(3)}
    else row.step='kept_existing_grid'}
   row.invalid_gap=inGap(self,p0?c[p0.i].t*sm:c[f.i].t*sm,closeT)?1:0;j.near.push(row);cap(j.near)});
  // жизнь сетки
  var cur=t.cur;
  if(cur&&cur.g===oldG){var g0=cur.g,z=zone(g0);if(cur.g.mode==='CORR'){var dz=b.c<z[0]?z[0]-b.c:b.c>z[1]?b.c-z[1]:0;cur.minDz=Math.min(cur.minDz,dz/g0.atr);if(dz===0){cur.inZone=1;if(!(pay!=null&&pay>=90)&&!warm)cur.payBlock=1}}
   if(/свеча 2 за 0.79/.test(logs))cur.c2fail=1;if(/EXPANSION: закрытие/.test(logs))cur.exp=1}
  e.journal.slice(nJ).forEach(function(r){if(!cur)return;cur.sig++;r.grid_id=cur.id;r.bg=1;r.warm=warm?1:0;var row={sym:self.sym,tf:tf,grid_id:cur.id,signal_t:closeT,mode:r.mode,dir:r.dir,k:r.k,price:b.c,payout_signal:r.payout,row:r,warm:warm?1:0,invalid_gap:0};
   if(tf==='M1')self.htf(row,closeT,b.c);j.signals.push(row);cap(j.signals)});
  if(cur&&s.g!==cur.g){this.endGrid(tf,cur,closeT,logs);t.cur=null}
  if(s.g&&(!t.cur||t.cur.g!==s.g)){t.gid++;var g=s.g;t.cur={g:g,id:this.sym+'|'+tf+'|'+(sl*sm)+'|'+t.gid,t_p0:c[g.i0].t*sm,t_p1:c[g.i1].t*sm,live_from:closeT,minDz:1e9,inZone:0,payBlock:0,c2fail:0,exp:0,sig:0,warm:warm?1:0};
   // если сигнал выдан на свече создания — не бывает (conf===j), безопасно
  }
  // снимок состояния ТФ на закрытии свечи (для фильтра старших ТФ)
  var cg=t.cur&&s.g===t.cur.g?t.cur:null;t.snap={T:closeT,id:cg?cg.id:'',up:cg?cg.g.up:null,zone:cg?zone(cg.g):null,live_from:cg?cg.live_from:null};
 };
 P.endGrid=function(tf,cur,T,logs){var j=J(this),g=cur.g,st;
  var why=/закрытие за P0/.test(logs)?'P0_break':/30 свечей истекли/.test(logs)?'30_candles_expired':/EXPANSION: 30/.test(logs)?'expansion_30_candles':/EXPANSION: закрытие за P1/.test(logs)?'expansion_P1_break':/скачок/.test(logs)?'jump_reset':/сетка заменена/.test(logs)?'replaced':'ended';
  if(cur.sig)st='signal';else if(why==='P0_break')st='P0_break';else if(!g.round)st='no_round_price_in_zone';else if(cur.payBlock)st='payout<90';else if(cur.c2fail)st='candle2_beyond_0.79';else if(!cur.inZone&&!cur.exp)st='candle1_not_in_zone';else if(why==='30_candles_expired')st='30_candles_expired';else st=why;
  var r={sym:this.sym,tf:tf,grid_id:cur.id,t_p1:cur.t_p1,dir:g.up?'bull':'bear',P0:g.p0,P1:g.p1,ATR:+g.atr.toFixed(7),step:st,shortfall_atr:cur.minDz<1e9?+cur.minDz.toFixed(3):'',end_t:T,end_reason:why,invalid_gap:inGap(this,cur.t_p0,T)?1:0,warm:cur.warm,signals:cur.sig};
  j.near.push(r);cap(j.near);var z=zone(g);j.grids.push({sym:this.sym,tf:tf,grid_id:cur.id,dir:r.dir,t_p0:cur.t_p0,t_p1:cur.t_p1,live_from:cur.live_from,end_t:T,P0:g.p0,P1:g.p1,ATR:r.ATR,zone_lo:z[0],zone_hi:z[1],round:g.round?1:0,mode_end:g.mode,step:st,invalid_gap:r.invalid_gap,warm:cur.warm});cap(j.grids)};
 // состояние M5/M3 на закрытии свечи сигнала M1: только закрытые свечи старшего ТФ, сетка — с момента подтверждения фрактала
 P.htf=function(row,T,price){var self=this,h={};['M5','M3'].forEach(function(tf){var sn=self.tf[tf].snap;h[tf]=(sn&&sn.T<=T&&sn.id&&sn.live_from<=T)?sn:null});
  row.M5_grid_id=h.M5?h.M5.id:'';row.M3_grid_id=h.M3?h.M3.id:'';
  var d5=h.M5?(h.M5.up?'bull':'bear'):null,d3=h.M3?(h.M3.up?'bull':'bear'):null;
  row.HTF_src=d5&&d3&&d5!==d3?'conflict':d5?'M5':d3?'M3':'none';row.HTF_dir=d5||d3||'';var zz=(h.M5||h.M3);row.in_HTF_zone=zz?(price>=zz.zone[0]&&price<=zz.zone[1]?1:0):'';
  row.M1_dir=row.dir==='CALL'?'bull':'bear';row.M5_dir=d5||'';row.M3_dir=d3||'';
  row.invalid_gap=inGap(this,T-60000*4,T)?1:0};
 // журналы для выгрузки
 P.candles=function(tf){var t=this.tf[tf],sm=SM[tf];return t.eng.st(tf).c.map(function(b){return {t:b.t*sm,o:b.o,h:b.h,l:b.l,c:b.c}})};
 function csv(rows,cols){var q=function(x){x=String(x==null?'':x);return /[,"\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};return cols.join(',')+'\n'+rows.map(function(r){return cols.map(function(k){return q(r[k])}).join(',')}).join('\n')}
 var SIGC=['sym','tf','grid_id','signal_t','mode','dir','k','price','payout_signal','pay_entry','entry','result','M5_grid_id','M3_grid_id','HTF_dir','HTF_src','in_HTF_zone','M5_dir','M3_dir','invalid_gap','warm'];
 var NEARC=['sym','tf','grid_id','t_p1','dir','P0','P1','ATR','step','shortfall_atr','end_t','end_reason','invalid_gap','warm','signals'];
 P.exportObj=function(ticks){var j=J(this),self=this,c={};TFS.forEach(function(tf){c[tf]=self.candles(tf)});
  var sig=j.signals.map(function(r){var o={};for(var k in r)if(k!=='row')o[k]=r[k];o.pay_entry=r.row.pay_entry==null?'':r.row.pay_entry;o.entry=r.row.entry;o.result=r.row.result;return o});
  return {kair:'3.39',made:new Date().toISOString(),sym:this.sym,ticks:ticks||j.ticks,candles:c,fractals:j.fractals,grids:j.grids,near_entry:j.near,signals:sig,gaps:j.gaps,hist_mismatch:j.mism,
   csv:{near_entry:csv(j.near,NEARC),signals:csv(sig,SIGC)}}};
 // ---- сырые тики в IndexedDB (кольцо ~26 ч) ----
 var IDB={db:null,q:[],open:function(){if(IDB.db||typeof indexedDB==='undefined')return;try{var r=indexedDB.open('kair_ticks',1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('t')){var s=d.createObjectStore('t',{autoIncrement:true});s.createIndex('ts','ts')}};r.onsuccess=function(){IDB.db=r.result}}catch(e){}},
  push:function(ts,sym,p){IDB.q.push({ts:ts,sym:sym,p:p})},
  flush:function(){if(!IDB.db||!IDB.q.length)return;var a=IDB.q;IDB.q=[];try{var tx=IDB.db.transaction('t','readwrite'),s=tx.objectStore('t');a.forEach(function(x){s.add(x)})}catch(e){}},
  trim:function(){if(!IDB.db)return;try{var tx=IDB.db.transaction('t','readwrite'),ix=tx.objectStore('t').index('ts'),r=ix.openCursor(IDBKeyRange.upperBound(now()-TICK_KEEP));r.onsuccess=function(){var c=r.result;if(c){c.delete();c.continue()}}}catch(e){}},
  all:function(cb){if(!IDB.db){cb(null);return}IDB.flush();try{var out=[],r=IDB.db.transaction('t','readonly').objectStore('t').openCursor();r.onsuccess=function(){var c=r.result;if(c){var v=c.value;out.push([v.ts,v.sym,v.p]);c.continue()}else cb(out)};r.onerror=function(){cb(null)}}catch(e){cb(null)}}};
 return {BG:B,TFS:TFS,IDB:IDB,csv:csv,GAP:GAP};
})();
if(typeof module!=='undefined')module.exports=KairBG;
(function(){ if(window.__kairApp)return; window.__kairApp=true;
var KEY='kair_pocket_v2', S={};
try{S=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){S={}}
var book=new KairCore.Book(S.book);
function save(){S.book=book.json();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function el(tag,attrs,html){var e=document.createElement(tag);for(var k in attrs||{})e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e}
function btn(txt,fn,title){var b=el('div',{'class':'kq-b',title:title||''},txt);b.addEventListener('click',function(ev){ev.stopPropagation();fn(b)});return b}
function money(x){return (x>0?'+':x<0?'−':'')+'$'+Math.abs(x).toFixed(2)}
function drag(win,handle,key,th){var sx,sy,ox,oy,on=false;th=th||0;
 handle.addEventListener('pointerdown',function(e){on=true;handle.__moved=false;sx=e.clientX;sy=e.clientY;var r=win.getBoundingClientRect();ox=r.left;oy=r.top;try{handle.setPointerCapture(e.pointerId)}catch(_){};e.preventDefault()});
 handle.addEventListener('pointermove',function(e){if(!on)return;if(!handle.__moved){if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)<=th)return;handle.__moved=true}var x=Math.max(0,Math.min(innerWidth-win.offsetWidth,ox+e.clientX-sx)),y=Math.max(0,Math.min(innerHeight-win.offsetHeight,oy+e.clientY-sy));
  win.style.transform='none';win.style.left=x+'px';win.style.top=y+'px';win.style.right='auto';win.style.bottom='auto';S[key]={x:x,y:y}});
 handle.addEventListener('pointerup',function(){if(on){on=false;if(handle.__moved)save()}});
 if(S[key]){win.style.transform='none';win.style.left=Math.min(S[key].x,innerWidth-60)+'px';win.style.top=Math.min(S[key].y,innerHeight-60)+'px';win.style.right='auto';win.style.bottom='auto'}}
 // ---------- Рисование v3.31: порт 1:1 блока рисования Draw Overlay (режим overlay) ----------
 // Отличие от Draw Overlay: сетки Фибоначчи (fib2, fib3, fibr) вынесены и в первый ряд. Магнит (snapPt) — только линия тренда и луч.
var DOV=(function(){
  var FIB_LEVELS=[0,.5,.705,.79,1,1.382,1.618,1.886,2.236],FIB_ZONES=[[.705,.79],[1.382,1.618],[1.886,2.236]];
  var PALETTE=['#FFFFF0','#FEFDF9','#D5C3A5','#FB3A3B','#2FC45C','#4394EF','#FDD209','#F68D0D','#CD58FF','#141213'],FIB_COLOR=PALETTE[1],IVORY=PALETTE[0];
  function pointsNeeded(t){if(t==='hline'||t==='vline')return 1;if(t==='fib3')return 3;return 2}
  function colorFor(t,i,tc){if(tc)return PALETTE[i]||IVORY;if(t==='fib2'||t==='fib3')return FIB_COLOR;return IVORY}
  function colorIndexFor(t,i,tc){if(tc)return i;if(t==='fib2'||t==='fib3')return 1;return 0}
  function nextRand(seed){var a=seed+1831565813;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return {seed:a,value:((t^t>>>14)>>>0)/4294967296}}
  function nextCandle(f){var r1=nextRand(f.seed),r2=nextRand(r1.seed),r3=nextRand(r2.seed),o=f.price,c=Math.max(.2,o+(r1.value-.48)*.00115),h=Math.max(o,c)+r2.value*75e-5,l=Math.min(o,c)-r3.value*75e-5;
   return {feed:{seed:r3.seed,price:c,nextT:f.nextT+1},candle:{t:f.nextT,o:o,h:h,l:l,c:c}}}
  function buildMarket(){var feed={seed:20261026,price:1.0842,nextT:0},candles=[];for(var i=0;i<180;i++){var s=nextCandle(feed);feed=s.feed;candles.push(s.candle)}return {feed:feed,candles:candles}}
  function priceDigits(p){var a=Math.abs(p);if(a>=100)return 3;if(a>=10)return 4;return 5}
  function formatPrice(p){return p.toFixed(priceDigits(p))}
  function fib2Price(a,b,l){return b.price+l*(a.price-b.price)}
  function fib3Price(a,b,c,l){return c.price+l*(b.price-a.price)}
  function makeView(candles,width,height){var last=candles[candles.length-1],left=6,top=8,right=Math.max(46,width-168),bottom=height-8,pps=9,tRight=(last?last.t:0)+8,tLeft=tRight-(right-left)/pps,lo=Infinity,hi=-Infinity;
   candles.forEach(function(c){if(c.t<tLeft-1||c.t>tRight+1)return;if(c.l<lo)lo=c.l;if(c.h>hi)hi=c.h});if(!isFinite(lo)||hi<=lo){lo=1;hi=1.1}var pad=(hi-lo)*.42;
   return {tRight:tRight,pps:pps,priceTop:hi+pad,priceBot:lo-pad,left:left,top:top,right:right,bottom:bottom}}
  function xOf(v,t){return v.right-(v.tRight-t)*v.pps}
  function yOf(v,p){var s=v.priceTop-v.priceBot;return v.top+(v.priceTop-p)/s*(v.bottom-v.top)}
  function tOf(v,x){return v.tRight-(v.right-x)/v.pps}
  function priceOf(v,y){var s=v.priceTop-v.priceBot;return v.priceTop-(y-v.top)/(v.bottom-v.top)*s}
  function rayEnd(x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);if(len<.001)return {x:x2,y:y2};return {x:x1+dx/len*2e4,y:y1+dy/len*2e4}}
  function distToSeg(px,py,x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;if(l2===0)return Math.hypot(px-x1,py-y1);var t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));return Math.hypot(px-(x1+t*dx),py-(y1+t*dy))}
  var FIBR_LEVELS=[0,.236,.382,.5,.618,.786,1];function fibrPrice(pts,l){return pts[1].price+(pts[0].price-pts[1].price)*l}
  function hitObject(v,o,x,y){var reach=8+o.width,pts=o.points.map(function(p){return {x:xOf(v,p.t),y:yOf(v,p.price)}});
   if(o.tool==='hline'){var py=yOf(v,o.points[0].price);return Math.abs(y-py)<=reach&&x>=v.left&&x<=v.right}
   if(o.tool==='vline'){var px=xOf(v,o.points[0].t);return Math.abs(x-px)<=reach&&y>=v.top&&y<=v.bottom}
   if(o.tool==='trend'&&pts.length>=2)return distToSeg(x,y,pts[0].x,pts[0].y,pts[1].x,pts[1].y)<=reach;
   if(o.tool==='ray'&&pts.length>=2){var e=rayEnd(pts[0].x,pts[0].y,pts[1].x,pts[1].y);return distToSeg(x,y,pts[0].x,pts[0].y,e.x,e.y)<=reach}
   if(o.tool==='rect'&&pts.length>=2){var x1=Math.min(pts[0].x,pts[1].x),x2=Math.max(pts[0].x,pts[1].x),y1=Math.min(pts[0].y,pts[1].y),y2=Math.max(pts[0].y,pts[1].y);
    return [[x1,y1,x2,y1],[x2,y1,x2,y2],[x2,y2,x1,y2],[x1,y2,x1,y1]].some(function(s){return distToSeg(x,y,s[0],s[1],s[2],s[3])<=reach})}
   if(o.tool==='fibr'&&pts.length>=2&&FIBR_LEVELS.some(function(l){return Math.abs(y-yOf(v,fibrPrice(o.points,l)))<=reach&&x>=Math.min(pts[0].x,pts[1].x)-reach&&x<=Math.max(pts[0].x,pts[1].x)+reach}))return true;
   if((o.tool==='fib2'||o.tool==='fib3')&&o.points.length>=(o.tool==='fib2'?2:3)){if(FIB_LEVELS.map(function(l){return o.tool==='fib2'?fib2Price(o.points[0],o.points[1],l):fib3Price(o.points[0],o.points[1],o.points[2],l)}).some(function(p){return Math.abs(y-yOf(v,p))<=reach&&x>=v.left&&x<=v.right+16}))return true}
   return pts.some(function(p){return Math.hypot(p.x-x,p.y-y)<=reach+6})}
  var LETTERS=['A','B','C'],FF='ui-sans-serif, system-ui, sans-serif';
  function E(tag,a,inner){var s='<'+tag;for(var k in a)if(a[k]!=null)s+=' '+k+'="'+String(a[k]).replace(/"/g,'&quot;')+'"';return s+(inner!=null?'>'+inner+'</'+tag+'>':'/>')}
  function T(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function haze(hex){var n=hex.replace('#','');return 'rgba('+parseInt(n.slice(0,2),16)+', '+parseInt(n.slice(2,4),16)+', '+parseInt(n.slice(4,6),16)+', 0.07)'}
  function ObjectShape(v,o){if(!o.points.length)return '';var st=o.color,sw=o.width,cm={stroke:st,'stroke-width':sw,fill:'none','stroke-linecap':'round'},ext=function(a){var r={};for(var k in a)r[k]=a[k];for(var k2 in cm)r[k2]=cm[k2];return r};
   if(o.tool==='hline'&&o.points[0]){var y=yOf(v,o.points[0].price);return E('line',ext({x1:v.left,x2:v.right,y1:y,y2:y}))+E('circle',{cx:(v.left+v.right)/2,cy:y,r:'4.5',fill:st,stroke:'#07090d','stroke-width':'1'})}
   if(o.tool==='vline'&&o.points[0]){var x=xOf(v,o.points[0].t);return E('line',ext({x1:x,x2:x,y1:v.top,y2:v.bottom}))}
   if((o.tool==='trend'||o.tool==='ray'||o.tool==='rect')&&o.points.length>=1){if(o.points.length<2){return Dots(v,o.points,st)}
    var a=o.points[0],b=o.points[1],x1=xOf(v,a.t),y1=yOf(v,a.price),x2=xOf(v,b.t),y2=yOf(v,b.price);
    if(o.tool==='rect')return E('polygon',{points:x1+','+y1+' '+x2+','+y1+' '+x2+','+y2+' '+x1+','+y2,stroke:st,'stroke-width':sw,fill:haze(st)});
    if(o.tool==='ray'){var e=rayEnd(x1,y1,x2,y2);return E('line',ext({x1:x1,y1:y1,x2:e.x,y2:e.y}))+Dots(v,[a,b],st)}
    return E('line',ext({x1:x1,y1:y1,x2:x2,y2:y2}))+Dots(v,[a,b],st)}
   if(o.tool==='fibr')return FibRetrace(v,o);
   if(o.tool==='fib2'||o.tool==='fib3')return FibShape(v,o);return ''}
  function Dots(v,pts,color){return pts.map(function(p){return E('circle',{cx:xOf(v,p.t),cy:yOf(v,p.price),r:'4.5',fill:color,stroke:'#07090d','stroke-width':'1'})}).join('')} // v3.42: точки как у Фибо, без букв
  function Points(v,pts,color){return E('g',{},pts.map(function(p,i){return E('g',{},E('circle',{cx:xOf(v,p.t),cy:yOf(v,p.price),r:'4.5',fill:color,stroke:'#07090d','stroke-width':'1'})+E('text',{x:xOf(v,p.t)+8,y:yOf(v,p.price)-6,fill:color,'font-size':'13','font-family':FF,'font-weight':'600'},T(LETTERS[i]||'')))}).join(''))}
  function FibShape(v,o){var ready=o.tool==='fib2'?o.points.length>=2:o.points.length>=3,letters=Points(v,o.points,o.color);if(!ready)return letters;
   var ratio=function(l){return o.tool==='fib2'?fib2Price(o.points[0],o.points[1],l):fib3Price(o.points[0],o.points[1],o.points[2],l)},xs=o.points.map(function(p){return xOf(v,p.t)}),x1=v.left,x2=Math.max.apply(null,xs)+FIB_EXT; // v3.39: уровни от левого края графика
   // v3.39: линии только 0/0.5/1, остальное — серые полосы
   var rows=FIB_LEVELS.map(function(l){var y=yOf(v,ratio(l));return {level:l,y:y,price:priceOf(v,y)}});
   return E('g',{},FIB_ZONES.map(function(z){var yA=yOf(v,ratio(z[0])),yB=yOf(v,ratio(z[1]));return E('rect',{x:x1,y:Math.min(yA,yB),width:x2-x1,height:Math.abs(yB-yA),fill:'rgba(176,184,196,0.18)'})}).join('')+
    rows.filter(function(r){return r.level===0||r.level===.5||r.level===1}).map(function(r){return E('line',{x1:x1,x2:x2,y1:r.y,y2:r.y,stroke:o.color,'stroke-width':Math.max(1,o.width),'stroke-linecap':'round','stroke-dasharray':'0 4'})}).join('')+
    rows.map(function(r){return E('text',{x:Math.min(x2+6,v.right-44),y:r.y+4,fill:o.color,stroke:'#07090d','stroke-width':'3','paint-order':'stroke','font-size':'12','font-weight':'600','font-family':FF},T(String(r.level)))}).join('')+letters)}
  function FibRetrace(v,o){if(o.points.length<2){var p=o.points[0];return E('circle',{cx:xOf(v,p.t),cy:yOf(v,p.price),r:'4',fill:o.color})}
   var xa=xOf(v,o.points[0].t),xb=xOf(v,o.points[1].t),x1=v.left,x2=Math.max(xa,xb)+FIB_EXT;
   return E('g',{},E('line',{x1:xa,y1:yOf(v,o.points[0].price),x2:xb,y2:yOf(v,o.points[1].price),stroke:o.color,'stroke-width':1,'stroke-dasharray':'4 4',opacity:.6})+FIBR_LEVELS.map(function(l){var pr=fibrPrice(o.points,l),y=yOf(v,pr);
    return E('g',{},E('line',{x1:x1,x2:x2,y1:y,y2:y,stroke:o.color,'stroke-width':o.width,'stroke-linecap':'round'})+E('text',{x:x2+6,y:y+4,fill:o.color,'font-size':'11','font-family':FF},T(String(l))))}).join(''))}
  // иконки (как в Draw Overlay)
  var SVO='<svg viewBox="0 0 24 24" aria-hidden="true">',C='currentColor';
  function DotsIcon(){return SVO+E('circle',{cx:'12',cy:'6',r:'1.7',fill:C})+E('circle',{cx:'12',cy:'12',r:'1.7',fill:C})+E('circle',{cx:'12',cy:'18',r:'1.7',fill:C})+'</svg>'}
  function HLineIcon(){return SVO+E('line',{x1:'5',y1:'12',x2:'19',y2:'12',stroke:C,'stroke-width':'1.7'})+E('circle',{cx:'5',cy:'12',r:'1.7',fill:C})+E('circle',{cx:'19',cy:'12',r:'1.7',fill:C})+'</svg>'}
  function VLineIcon(){return SVO+E('line',{x1:'12',y1:'5',x2:'12',y2:'19',stroke:C,'stroke-width':'1.7'})+E('circle',{cx:'12',cy:'5',r:'1.7',fill:C})+E('circle',{cx:'12',cy:'19',r:'1.7',fill:C})+'</svg>'}
  function RayIcon(){return SVO+E('line',{x1:'6',y1:'18',x2:'18',y2:'6',stroke:C,'stroke-width':'1.7','stroke-linecap':'round'})+E('circle',{cx:'6.2',cy:'17.8',r:'1.7',fill:C})+'</svg>'}
  function TrendIcon(){return SVO+E('line',{x1:'6',y1:'18',x2:'18',y2:'6',stroke:C,'stroke-width':'1.7','stroke-linecap':'round'})+E('circle',{cx:'6',cy:'18',r:'1.7',fill:C})+E('circle',{cx:'18',cy:'6',r:'1.7',fill:C})+'</svg>'}
  function RectIcon(){return SVO+E('rect',{x:'5',y:'7',width:'14',height:'10',rx:'1.5',fill:'none',stroke:C,'stroke-width':'1.7'})+'</svg>'}
  function FibMarks(d){var L=function(a,b,c,e){return E('line',{x1:a,y1:b,x2:c,y2:e,stroke:C,'stroke-width':'1.4','stroke-dasharray':'1.3 1.15'})};
   return SVO+L('4','6','15','8.2')+L('4','9.2','16.5','11.6')+L('4','12.4','17.5','15')+L('4','15.4','14','17.4')+E('circle',{cx:'16.2',cy:'18.6',r:'1.05',fill:C})+E('circle',{cx:'18.6',cy:'20.2',r:'1.05',fill:C})+(d===3?E('circle',{cx:'20.6',cy:'18.2',r:'1.05',fill:C}):'')+'</svg>'}
  function EraserIcon(){return SVO+E('rect',{x:'5.2',y:'8.4',width:'13.6',height:'8.2',rx:'2',transform:'rotate(-36 12 12.5)',fill:'#ee7b96',stroke:'rgba(255,255,255,0.72)','stroke-width':'1'})+'</svg>'}
  function TrashIcon(){return SVO+E('path',{d:'M8 8.5h8',stroke:C,'stroke-width':'1.7','stroke-linecap':'round'})+E('path',{d:'M9.2 8.4V7.2h5.6v1.2',stroke:C,'stroke-width':'1.7','stroke-linejoin':'round'})+E('path',{d:'M8.6 9.2h6.8l-.55 9.2H9.15L8.6 9.2z',fill:'none',stroke:C,'stroke-width':'1.7','stroke-linejoin':'round'})+E('path',{d:'M12 11.2v5.2',stroke:C,'stroke-width':'1.5','stroke-linecap':'round'})+'</svg>'}
  function PowerIcon(){return SVO+E('path',{d:'M8.2 7.2a6.2 6.2 0 1 0 7.6 0',fill:'none',stroke:'#ff5c5c','stroke-width':'2','stroke-linecap':'round'})+E('path',{d:'M12 4.2v6.4',stroke:'#ff5c5c','stroke-width':'2','stroke-linecap':'round'})+'</svg>'}
  function FibRetraceIcon(){return SVO+[5,9,13,17].map(function(y){return E('line',{x1:'4',y1:y,x2:'20',y2:y,stroke:C,'stroke-width':'1.4'})}).join('')+E('text',{x:'12',y:'23.5','text-anchor':'middle',fill:C,'font-size':'7','font-weight':'700','font-family':FF},'FIB')+'</svg>'}
  var TOOLS=[{id:'hline',draw:HLineIcon},{id:'vline',draw:VLineIcon},{id:'ray',draw:RayIcon},{id:'fib2',draw:function(){return FibMarks(2)}},{id:'fib3',draw:function(){return FibMarks(3)}},{id:'fibr',draw:FibRetraceIcon},{id:'trend',draw:TrendIcon},{id:'rect',draw:RectIcon}];
  var SNAP_R=6,FIB_EXT=128,MAIN_FIBS=['fib2','fib3','fibr'],FIB_LABEL={fib2:'Фибо 2 точки',fib3:'Фибо 3 точки',fibr:'Фибоначчи'};
  function dpaint(color,w,h,shape){var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+(shape==='disc'?'<circle cx="'+w/2+'" cy="'+h/2+'" r="'+(Math.min(w,h)/2-1)+'" fill="'+color+'"/>':'<rect width="'+w+'" height="'+h+'" rx="3" fill="'+color+'"/>')+'</svg>';return 'data:image/svg+xml,'+encodeURIComponent(svg)}
  var CSS='#kair-dov,#kair-dov *{box-sizing:border-box;margin:0;letter-spacing:normal;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5}'+
   '#kair-dov .plot{position:fixed;inset:0;z-index:2147483500;pointer-events:none;touch-action:none}#kair-dov .plot.armed{pointer-events:auto}#kair-dov .plot svg{display:block}'+
   '#kair-dov .widget{z-index:2147483640;touch-action:none;position:fixed;-webkit-user-select:none;user-select:none}'+
   '#kair-dov .bar{background:#2a2c31;border-radius:0;align-items:center;gap:3px;padding:3px;display:flex;box-shadow:0 8px 24px #00000073}'+
   '#kair-dov .tile{color:#f4f4f5;background:#32343b;border:0;border-radius:0;flex:none;place-items:center;width:36px;height:36px;padding:0;display:grid;cursor:pointer;font:inherit}'+
   '#kair-dov .tile.active,#kair-dov .tile:active{color:#fff;background:#2a6fe6}#kair-dov .tile:focus{outline:none}'+
   '#kair-dov .tile svg{width:22px;height:22px;display:block;overflow:visible}#kair-dov .tile img.mark{width:17px;height:17px;display:block}#kair-dov .tile img.dot-mark{width:9px;height:9px;display:block}'+
   '#kair-dov .colors{box-sizing:border-box;gap:2px;width:100%;padding:2px;display:flex}'+
   '#kair-dov .swatch{appearance:none;background:0 0;border:0;border-radius:0;flex:1 1 0;width:auto;min-width:0;height:28px;padding:0;overflow:hidden;cursor:pointer}#kair-dov .swatch img{object-fit:fill;width:100%;height:28px;display:block}#kair-dov .swatch.on{outline-offset:1px;outline:2px solid #2a6fe6}'+
   '#kair-dov .collapsed{color:#fff;background:#2a2c31;border:0;border-radius:0;place-items:center;width:40px;height:40px;padding:0;display:grid;box-shadow:0 8px 24px #00000073;cursor:pointer}#kair-dov .collapsed svg{width:18px;height:18px;display:block}'+
   '#kair-dov .pop{background:#2a2c31;border-radius:0;padding:4px;position:absolute;top:calc(100% + 8px);left:0;box-shadow:0 8px 24px #00000073}#kair-dov .tools{gap:4px;display:flex}'+
   '#kair-dov .slider-pop{width:232px;padding:14px 16px}#kair-dov .slider-pop input[type=range]{appearance:none;-webkit-appearance:none;background:0 0;width:100%;height:22px;margin:0}'+
   '#kair-dov .slider-pop input[type=range]::-webkit-slider-runnable-track{background:#8b9098;border-radius:2px;height:2px}#kair-dov .slider-pop input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;background:#2a6fe6;border:0;border-radius:50%;width:10px;height:10px;margin-top:-4px}';
  function create(host,snap,store){
   if(window.__kairDovApi&&window.__kairDovApi.el.isConnected)return window.__kairDovApi;document.querySelectorAll('#kair-dov').forEach(function(x){x.remove()});
   var old=document.getElementById('kair-dov');if(old)old.remove();
   var wrap=document.createElement('div');wrap.id='kair-dov';wrap.style.display='none';var st=document.createElement('style');st.textContent=CSS;wrap.appendChild(st);
   var plot=document.createElement('div');plot.className='plot';wrap.appendChild(plot);var wg=document.createElement('div');wg.className='widget';wg.setAttribute('data-widget','true');wrap.appendChild(wg);host.appendChild(wrap);
   var market=buildMarket(),S2={tool:null,eraser:false,width:1,colorIndex:0,colorTouched:false,objects:(store&&store.load())||[],draft:[],hover:null,pull:null,open:true,pop:null,face:null,pos:{x:16,y:96}},idN=1,drag=null,view=null;
   S2.objects.forEach(function(o){if(o.id>=idN)idN=o.id+1});
   function persist(){if(store)store.save(S2.objects)}
   function calcView(){var w=innerWidth,h=innerHeight,n=makeView(market.candles,w,h);n.left=0;n.top=0;n.right=w;n.bottom=h;view=n}
   function curTool(){return S2.eraser?null:S2.tool}
   function color(){return colorFor(curTool(),S2.colorIndex,S2.colorTouched)}
   function previewAnchors(tool,draft,hover,pull){if(!tool)return null;if(tool==='hline'||tool==='vline')return hover?[hover]:null;if(draft.length===0&&pull&&hover&&(tool==='ray'||tool==='rect'||tool==='trend'))return [pull,hover];if(draft.length===0)return null;if(hover&&draft.length<pointsNeeded(tool))return draft.concat([hover]);return draft}
   function renderPlot(){calcView();var w=innerWidth,h=innerHeight,tool=curTool(),pp=previewAnchors(tool,S2.draft,S2.hover,S2.pull);
    plot.classList.toggle('armed',!!(S2.tool||S2.eraser));
    plot.innerHTML='<svg width="'+w+'" height="'+h+'" style="overflow:hidden;touch-action:none">'+S2.objects.map(function(o){return ObjectShape(view,o)}).join('')+(pp?ObjectShape(view,{id:-1,tool:tool,points:pp,color:color(),width:S2.width}):'')+'</svg>'}
   function pointAt(x,y,alt){if(!view)return {t:0,price:0};var tool=curTool();if(snap&&(tool==='trend'||tool==='ray')){var q=snap({x:x,y:y},alt);if(q&&Math.hypot(q.x-x,q.y-y)<=SNAP_R){x=q.x;y=q.y}}return {t:tOf(view,x),price:priceOf(view,y)}}
   function onPlaced(){S2.tool=null;S2.draft=[];renderAll()}
   function place(a){var tool=curTool();if(!tool)return;var next=S2.draft.concat([a]);if(next.length<pointsNeeded(tool)){S2.draft=next;renderPlot();return}
    S2.objects=S2.objects.concat([{id:idN++,tool:tool,points:next,color:color(),width:S2.width}]);persist();S2.draft=[];S2.hover=null;onPlaced()}
   plot.addEventListener('pointerdown',function(e){if(!view)return;var x=e.clientX,y=e.clientY;if(x>view.right+24)return;drag={x:x,y:y,moved:false,ax:x,ay:y,alt:e.altKey};try{plot.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();e.stopPropagation()});
   plot.addEventListener('pointermove',function(e){if(!view)return;var x=e.clientX,y=e.clientY,a=drag,tool=curTool();if(a){if(Math.hypot(x-a.x,y-a.y)>6)a.moved=true}
    if(S2.eraser||!tool)return;if((tool==='ray'||tool==='rect'||tool==='trend')&&S2.draft.length===0&&a&&a.moved)S2.pull=pointAt(a.ax,a.ay,a.alt);S2.hover=pointAt(x,y,e.altKey);renderPlot()});
   plot.addEventListener('pointerup',function(e){var a=drag;drag=null;if(!view||!a)return;var x=e.clientX,y=e.clientY;if(x>view.right+24)return;var tool=curTool(),anchor=pointAt(x,y,e.altKey);
    if(S2.eraser){if(a.moved)return;var hit=S2.objects.slice().reverse().find(function(o){return hitObject(view,o,x,y)});if(hit){S2.objects=S2.objects.filter(function(o){return o.id!==hit.id});persist();renderPlot()}return}
    if(!tool)return;
    if((tool==='ray'||tool==='rect'||tool==='trend')&&S2.draft.length===0&&a.moved){var start=pointAt(a.ax,a.ay,a.alt);S2.objects=S2.objects.concat([{id:idN++,tool:tool,points:[start,anchor],color:color(),width:S2.width}]);persist();S2.draft=[];S2.hover=null;S2.pull=null;onPlaced();return}
    S2.pull=null;place(anchor)});
   plot.addEventListener('pointerleave',function(){S2.hover=null;S2.pull=null;renderPlot()});
   // ---- виджет ----
   function onTool(n){S2.eraser=false;S2.tool=n;S2.draft=[];if(n&&MAIN_FIBS.indexOf(n)<0)S2.face=n;renderAll()}
   function onEraser(on){S2.eraser=on;S2.draft=[];renderAll()}
   function togglePop(n){S2.pop=S2.pop===n?null:n;if(S2.eraser){S2.eraser=false;S2.draft=[]}renderAll()}
   function wdrag(e,after){e.preventDefault();e.stopPropagation();var sx=e.clientX,sy=e.clientY,o=S2.pos,moved=false;
    function mv(ev){var dx=ev.clientX-sx,dy=ev.clientY-sy;if(Math.hypot(dx,dy)>5)moved=true;var r=wg.getBoundingClientRect(),mx=innerWidth-(r.width||48),my=innerHeight-(r.height||48);S2.pos={x:Math.min(Math.max(0,o.x+dx),Math.max(0,mx)),y:Math.min(Math.max(0,o.y+dy),Math.max(0,my))};wg.style.left=S2.pos.x+'px';wg.style.top=S2.pos.y+'px'}
    function up(){removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(!moved)after()}
    addEventListener('pointermove',mv);addEventListener('pointerup',up)}
   function B(cls,label,html,extra){return '<button class="'+cls+'" aria-label="'+label+'" title="'+label+'"'+(extra||'')+'>'+html+'</button>'}
   function renderWidget(){var tool=S2.tool,er=S2.eraser,shown=colorIndexFor(tool,S2.colorIndex,S2.colorTouched),face=(TOOLS.find(function(t){return t.id===(tool&&MAIN_FIBS.indexOf(tool)<0?tool:S2.face)})||TOOLS[0]),h='';
    if(S2.open){h+='<div class="bar">'+B('tile','Свернуть',DotsIcon(),' data-a="min"')+B(S2.pop==='tools'||(!er&&tool&&MAIN_FIBS.indexOf(tool)<0)?'tile active':'tile','Инструменты',face.draw(),' data-a="tools"');
     MAIN_FIBS.forEach(function(id){var t=TOOLS.find(function(q){return q.id===id});h+=B(!er&&tool===id?'tile active':'tile',FIB_LABEL[id],t.draw(),' data-a="fib" data-id="'+id+'"')});
     h+=B('tile','Толщина','<img class="dot-mark" alt="" width="9" height="9" src="'+dpaint('#FFF6E4',18,18,'disc')+'">',' data-a="width"')+
      B('tile','Цвет','<img class="mark" alt="" width="16" height="16" src="'+dpaint(PALETTE[shown]||'#FFF6E4',16,16,'rect')+'">',' data-a="color"')+
      B(er?'tile active':'tile','Ластик',EraserIcon(),' data-a="eraser" aria-pressed="'+er+'"')+B('tile','Корзина',TrashIcon(),' data-a="trash"')+'</div>';
     if(S2.pop==='tools')h+='<div class="pop tools">'+TOOLS.filter(function(t){return MAIN_FIBS.indexOf(t.id)<0}).map(function(t){return B(!er&&tool===t.id?'tile active':'tile',t.id,t.draw(),' data-a="pick" data-id="'+t.id+'"')}).join('')+'</div>';
     if(S2.pop==='width')h+='<div class="pop slider-pop"><input type="range" min="1" max="5" step="1" value="'+S2.width+'" aria-label="Толщина линии"></div>';
     if(S2.pop==='color')h+='<div class="pop colors">'+PALETTE.map(function(c,i){return '<button class="'+(shown===i?'swatch on':'swatch')+'" aria-label="'+(i===0?'Ivory':'Цвет '+(i+1))+'" data-a="col" data-i="'+i+'"><img alt="" width="24" height="28" src="'+dpaint(c,24,28,'rect')+'"></button>'}).join('')+'</div>'}
    else h+=B('collapsed','Развернуть',DotsIcon(),' data-a="max"');
    wg.innerHTML=h;wg.style.left=S2.pos.x+'px';wg.style.top=S2.pos.y+'px';
    var pe=wg.querySelector('.pop');if(pe){pe.style.marginLeft='0px';var r0=pe.getBoundingClientRect();if(r0.bottom>innerHeight-4){pe.style.top='auto';pe.style.bottom='calc(100% + 8px)'}var r=pe.getBoundingClientRect(),sh=0;if(r.right>innerWidth-8)sh-=r.right-(innerWidth-8);if(r.left+sh<8)sh+=8-(r.left+sh);pe.style.marginLeft=sh+'px'}
    var rg=wg.querySelector('input[type=range]');if(rg){rg.addEventListener('input',function(){S2.width=Number(rg.value);renderPlot()});rg.addEventListener('change',function(){S2.pop=null;renderAll()});rg.addEventListener('pointerup',function(){S2.pop=null;renderAll()})}}
   wg.addEventListener('pointerdown',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.getAttribute('data-a');
    if(a==='min')wdrag(e,function(){S2.open=false;S2.pop=null;renderAll()});else if(a==='max')wdrag(e,function(){S2.open=true;renderAll()})});
   wg.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.getAttribute('data-a'),id=b.getAttribute('data-id');
    if(a==='tools')togglePop('tools');
    else if(a==='fib'){onTool(!S2.eraser&&S2.tool===id?null:id);S2.pop=null;renderAll()}
    else if(a==='pick'){onTool(id);S2.pop=null;renderAll()}
    else if(a==='width')togglePop('width');else if(a==='color')togglePop('color');
    else if(a==='col'){S2.colorTouched=true;S2.colorIndex=+b.getAttribute('data-i');S2.pop=null;renderAll()}
    else if(a==='eraser'){var was=S2.eraser;onEraser(!was);if(!was){S2.pop=null;renderAll()}}
    else if(a==='trash'){S2.objects=[];S2.draft=[];persist();S2.pop=null;if(S2.eraser)S2.eraser=false;renderAll()}
    else if(a==='close')api.close()});
   addEventListener('pointerdown',function(e){if(wrap.style.display==='none'||wg.contains(e.target))return;if(S2.pop){S2.pop=null;renderWidget()}},true);
   addEventListener('resize',function(){var w=wg.offsetWidth||48,h=wg.offsetHeight||48;S2.pos={x:Math.min(Math.max(0,S2.pos.x),Math.max(0,innerWidth-w)),y:Math.min(Math.max(0,S2.pos.y),Math.max(0,innerHeight-h))};if(wrap.style.display!=='none')renderAll()});
   function renderAll(){renderWidget();renderPlot()}
   var placed=false,api={el:wrap,widget:wg,plot:plot,state:S2,
    open:function(p){wrap.style.display='';if(p)S2.pos=p;else if(!placed)S2.pos={x:Math.max(8,(innerWidth-330)/2),y:108};placed=true;renderAll();if(p){var hh=wg.offsetHeight||40;S2.pos={x:p.x,y:Math.max(4,Math.min(innerHeight-hh-4,p.y-hh/2))};renderAll()}},
    close:function(){S2.tool=null;S2.eraser=false;S2.draft=[];S2.pop=null;wrap.style.display='none';renderPlot()},
    isOpen:function(){return wrap.style.display!=='none'}};
   renderPlot();wrap.style.display='';plot.style.display='';wg.style.display='none';
   // рисунки видны всегда; панель — по кнопке «Рис.»
   api.open=(function(o){return function(p){wg.style.display='';o(p)}})(api.open);
   api.close=(function(c){return function(){c();wrap.style.display='';wg.style.display='none'}})(api.close);
   api.isOpen=function(){return wg.style.display!=='none'};
   window.__kairDovApi=api;return api}
  return {create:create,_t:{pointsNeeded:pointsNeeded,fib2Price:fib2Price,fib3Price:fib3Price,fibrPrice:fibrPrice,makeView:makeView,buildMarket:buildMarket,hitObject:hitObject,tOf:tOf,priceOf:priceOf,xOf:xOf,yOf:yOf,TOOLS:TOOLS}}})();
var MOB=!!window.__KAIR_MOBILE;
function mount(){
 if(document.getElementById('kair-root'))return;
 var host=document.body||document.documentElement; if(!host)return;
 var root=el('div',{id:'kair-root'}); host.appendChild(root);
 // ---------- Рисование: v3.31 — блок Draw Overlay (DOV), старый блок «Рис.» удалён ----------
 // v3.16 магнит (порт Snap.java): окно ±12×±20 px вокруг курсора на canvas графика PO, ищем столбик свечи по яркости, липнем к верху/низу ближайшего. Alt — без магнита. Если canvas не читается — магнит молча выключается.
 var SNAP_OFF=false;
 function poCanvases(pt){var all=[];document.querySelectorAll('canvas').forEach(function(c){if(c.id==='kair-draw'||c.closest('#kair-root,#kair-dov'))return;var r=c.getBoundingClientRect();if(r.width>40&&r.height>40&&pt.x>=r.left&&pt.x<=r.right&&pt.y>=r.top&&pt.y<=r.bottom)all.push([c,r])});return all}
 var SNAP_TMP=null,SNAP_CX=null;function canvasPix(c,x0,y0,w,h){if(!SNAP_TMP){SNAP_TMP=document.createElement('canvas');SNAP_CX=SNAP_TMP.getContext('2d',{willReadFrequently:true})}
  if(SNAP_TMP.width!==w||SNAP_TMP.height!==h){SNAP_TMP.width=w;SNAP_TMP.height=h}SNAP_CX.clearRect(0,0,w,h);SNAP_CX.drawImage(c,x0,y0,w,h,0,0,w,h);return SNAP_CX.getImageData(0,0,w,h).data}
 function snapPt(pt,alt){if(alt||SNAP_OFF)return pt;var cs=poCanvases(pt);if(!cs.length)return pt;var HX=12,HY=20,W2=2*HX+1,H2=2*HY+1,lum=null;
  try{cs.forEach(function(q){var c=q[0],r=q[1],sx=c.width/r.width,sy=c.height/r.height,x0=Math.round((pt.x-HX-r.left)*sx),y0=Math.round((pt.y-HY-r.top)*sy),w=Math.max(1,Math.round(W2*sx)),h=Math.max(1,Math.round(H2*sy));
    var d;try{d=canvasPix(c,x0,y0,w,h)}catch(_){return}if(!lum){lum=new Float32Array(W2*H2);lum.fill(-1)}
    for(var j=0;j<H2;j++)for(var i=0;i<W2;i++){var px=Math.min(w-1,Math.floor(i*sx)),py=Math.min(h-1,Math.floor(j*sy)),o=(py*w+px)*4;if(d[o+3]<40)continue;var L=0.299*d[o]+0.587*d[o+1]+0.114*d[o+2],k=j*W2+i;lum[k]=Math.max(lum[k],L)}})}catch(err){return pt}
  if(!lum)return pt;var vals=[];for(var k=0;k<lum.length;k++)vals.push(lum[k]<0?0:lum[k]);var sorted=vals.slice().sort(function(a,b){return a-b}),bg=sorted[Math.floor(sorted.length*0.5)];
  var bx=-1,T=[],B=[],OK=[];for(var i=0;i<W2;i++){var t=-1,b=-1,run=0,ok=false;for(var j=0;j<H2;j++){var v=vals[j*W2+i];if(Math.abs(v-bg)>45){if(t<0)t=j;b=j;run++;if(run>=3)ok=true}else run=0}
   T[i]=t;B[i]=b;OK[i]=ok;if(ok&&(bx<0||Math.abs(i-HX)<Math.abs(bx-HX)))bx=i}
  if(bx<0)return pt;var bt=T[bx],bb=B[bx],ci=bx;for(var m=bx-1;m>=0&&T[m]>=0;m--){if(T[m]<bt){bt=T[m];ci=m}if(B[m]>bb)bb=B[m]}for(var m=bx+1;m<W2&&T[m]>=0;m++){if(T[m]<bt){bt=T[m];ci=m}if(B[m]>bb)bb=B[m]}
  var up=(HY-bt<=bb-HY),tx=bx;for(var m=0;m<W2;m++)if(T[m]>=0&&Math.abs(m-bx)<=8&&(up?T[m]===bt:B[m]===bb)){tx=m;break}bx=tx;return {x:pt.x-HX+bx,y:pt.y-HY+(up?bt:bb)}}
 var dov=DOV.create(host,function(p,alt){return snapPt(p,alt)},{load:function(){return S.dov||[]},save:function(o){S.dov=o;save()}});
 var dt={style:{display:'none'}};function placeDt(){}function closeDt(){dov.close()}function toggleDov(){if(dov.isOpen()){dov.close();return}var br=bar.getBoundingClientRect(),rr=(MOB?h:rb).getBoundingClientRect();dov.open({x:br.right+6,y:rr.top+rr.height/2});/* v3.40: окно Фигуры/KAIR при рисовании скрыто — панель рисования стоит у кнопки «Рис.» */}
 // ---------- Плашка сигнала ----------
 // v3.28: одно окно — сверху «Фигуры M3», снизу сигнал 2.62-SM (отдельной плашки вверху больше нет)
 var figWin=el('div',{id:'kair-figwin','class':'kq-w',title:'Сигнал 2.62-SM'});figWin.style.cssText='position:fixed;left:8px;top:96px;width:auto;padding:4px 0 5px 0;display:none;z-index:2147483000;cursor:move;touch-action:none;overflow:hidden';/* v3.41: окна M3 нет — только маленькая плашка времени и входа */root.appendChild(figWin);
 var plate=el('div',{id:'kair-sigsec'});plate.style.display='none';figWin.appendChild(plate);
 plate.innerHTML='<canvas data-s="strip" width="288" height="56" style="display:none;width:288px;height:56px;margin:0 6px 3px;cursor:default;border-radius:6px;background:linear-gradient(180deg,rgba(40,42,48,0.55),rgba(14,15,18,0.75));box-shadow:inset 0 0 0 1px rgba(255,255,255,0.07)"></canvas><div data-s="cap" style="font-size:10px;color:#a8a8b4;padding:0 6px 2px;white-space:nowrap">Сигнал 2.62-SM</div><div data-s="box" style="margin:0 6px;border-radius:6px;padding:5px 6px;text-align:center;font-weight:700;line-height:1.2"><div data-s="l1" style="font-size:14px"></div><div data-s="l2" style="font-size:11px"></div></div>';
 var sCap=plate.querySelector('[data-s="cap"]'),sBox=plate.querySelector('[data-s="box"]'),sL1=plate.querySelector('[data-s="l1"]'),sL2=plate.querySelector('[data-s="l2"]'),sStrip=plate.querySelector('[data-s="strip"]');
 // полоса последних 20 закрытых свечей текущего ТФ; паттерн подсвечивается только на свече сигнала входа 2.62-SM
 var payPrev=null,patKey='',patT0=0,patAnim=0,patInfo=null;
 function stripPaint(){var cx=sStrip.getContext('2d'),W=sStrip.width,H=sStrip.height;cx.clearRect(0,0,W,H);
  var tf=S.tf||'M1',sm=K39.S.slotMs(tf),ns=Math.floor(Date.now()/sm),cl=(function(){var a=bars.closed(ns,25),src=bars;if(a.length<5&&hb.tf===sm){var b2=hb.c.closed(ns,25);if(b2.length>a.length){a=b2;src=hb.c}}var lv=src.bars[ns];if(lv&&a.length)a=a.concat([lv]);return a})(),hasLv=!!(cl.length&&(bars.bars[ns]||hb.c.bars[ns])),n=Math.min(20,cl.length),c=cl.slice(-n),s=eng.sig;patInfo=null;
  if(!n){sStrip.title='Свечи '+tf+': нет данных';return}
  var lo=Infinity,hi=-Infinity;c.forEach(function(b){lo=Math.min(lo,b.l);hi=Math.max(hi,b.h)});var r=hi-lo||1,y=function(v){return 11+(hi-v)/r*(H-22)},w=W/Math.max(n,10),x0=W-n*w;
  var hl=-1,pn=null,sgc=-1;if(s&&s.k==='order'&&s.slot!=null){hl=s.slot-(ns+(hasLv?1:0)-cl.length);var ci=hl-(cl.length-n);if(hl>=0&&hl<cl.length){pn=KairPat.detect(cl[hl],cl.slice(0,hl))}sgc=(hl>=0&&hl<cl.length)?ci:-1;hl=pn?ci:-1}
  var key=pn?s.slot+'|'+pn:'';if(key!==patKey){patKey=key;patT0=key?Date.now():0}
  c.forEach(function(b,i){var xm=Math.round(x0+i*w+w/2)+0.5,up=b.c>=b.o,sg=i===sgc&&sgc>=0,cc=sg?(s.call?'#3cf07e':'#ff3b2e'):(up?'#f2f2f2':'#0b0b0b'),ln=sg?cc:'#f2f2f2';cx.save();cx.shadowColor=sg?(s.call?'rgba(60,240,126,0.9)':'rgba(255,59,46,0.9)'):'rgba(255,255,255,0.45)';cx.shadowBlur=sg?10:5;cx.strokeStyle=ln;cx.lineWidth=0.8;cx.beginPath();cx.moveTo(xm,y(b.h));cx.lineTo(xm,y(b.l));cx.stroke();var t=y(Math.max(b.o,b.c)),bt=y(Math.min(b.o,b.c)),bw=w*0.56,bh=Math.max(1,bt-t);
   cx.fillStyle=cc;cx.fillRect(xm-bw/2,t,bw,bh);if(!up&&!sg){cx.shadowBlur=0;cx.lineWidth=0.8;cx.strokeRect(xm-bw/2+0.4,t+0.4,Math.max(0.2,bw-0.8),Math.max(0.2,bh-0.8))}cx.restore()}); // v3.38: свечи ч/б со свечением; свеча сигнала — зелёная (CALL) / красная (PUT)
  if(hl>=0&&hl<n){var b=c[hl],xa=x0+hl*w+1,yt=y(b.h)-2,yb=y(b.l)+2,el2=Date.now()-patT0;cx.save();cx.font='9px sans-serif';cx.fillStyle='rgba(170,172,180,0.95)';var lb=pn.replace(/ \(.*\)/,''),lw=cx.measureText(lb).width,lx=Math.max(1,Math.min(W-lw-1,xa+(w-2)/2-lw/2)),below=/медвеж|Повешен/.test(pn);cx.fillText(lb,lx,below?Math.min(H-1,yb+9):Math.max(8,yt-2));cx.restore();
   var d=new Date(s.slot*sm),z=function(q){return ('0'+q).slice(-2)};patInfo={name:pn,x:xa,w:w,txt:pn+' · '+z(d.getDate())+'.'+z(d.getMonth()+1)+'.'+d.getFullYear()+' '+z(d.getHours())+':'+z(d.getMinutes())+' · '+tf};
   }
  sStrip.title=patInfo?patInfo.txt:'Последние '+n+' закрытых свечей '+tf}
 sStrip.addEventListener('mousemove',function(e){if(!patInfo)return;var r=sStrip.getBoundingClientRect(),x=e.clientX-r.left;sStrip.title=(x>=patInfo.x-2&&x<=patInfo.x+patInfo.w+2)?patInfo.txt:'Паттерн на свече сигнала: '+patInfo.txt});
 drag(figWin,figWin,'platePos');
 // v3.39: позиция окна по умолчанию — правее панели и строки рисования (не перекрывает кнопки ни при какой высоте экрана)
 function figPlace(){if(MOB||figWin.style.display==='none'||S.platePos)return;var best=null,ba=0;document.querySelectorAll('canvas').forEach(function(c){if(c.closest('#kair-root,#kair-dov'))return;var r=c.getBoundingClientRect(),ar=r.width*r.height;if(r.width>200&&r.height>150&&ar>ba){ba=ar;best=r}});var x=best?best.left+8:8,y=best?best.top+90:96;if(typeof bar!=='undefined'&&bar){var br=bar.getBoundingClientRect();if(x<br.right+6&&x+figWin.offsetWidth>br.left&&y<br.bottom&&y+figWin.offsetHeight>br.top)x=br.right+8}x=Math.max(0,Math.min(innerWidth-figWin.offsetWidth-4,x));y=Math.max(0,Math.min(innerHeight-figWin.offsetHeight-4,y));figWin.style.left=Math.round(x)+'px';figWin.style.top=Math.round(y)+'px';figWin.style.bottom='auto';figWin.style.right='auto'} // v3.41: плашка слева вверху графика, под названием пары
 setInterval(function(){try{figPlace()}catch(e){}},2000);
 addEventListener('resize',figPlace);
 // ---------- Сигнал KAIR 2.62-SM (KairSM) ----------
 var AC=null;function tones(fs,o2){o2=o2||{};var gp=o2.gap||0.16,dr=o2.dur||0.38,vl=o2.vol||0.16;try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();var t=AC.currentTime+0.02;
   fs.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(AC.destination);var s=t+i*gp;
    g.gain.setValueAtTime(0.0001,s);g.gain.linearRampToValueAtTime(vl,s+0.02);g.gain.exponentialRampToValueAtTime(0.0005,s+dr);o.start(s);o.stop(s+dr+0.02)})}catch(e){}}
 // состояние сигнала живёт вне mount(): если страница перерисует DOM и панель смонтируется заново, свечи и движок не сбрасываются
 var SG=window.__kairSigState;if(!SG){SG=window.__kairSigState={log:[],timer:null};try{SG.log=JSON.parse(localStorage.getItem('kair_sig_log')||'[]')||[]}catch(e){}}
 var sigLog=SG.log;
 function slog(x){var d=new Date();sigLog.push(('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)+' '+x);if(sigLog.length>300)sigLog.shift();
  try{localStorage.setItem('kair_sig_log',JSON.stringify(sigLog))}catch(e){}}
 var K39=KairS39;SG.slog=slog;if(!SG.eng||!SG.eng.journal){SG.eng=new K39.Engine(function(x){SG.slog(x)});SG.bars=new K39.Candles()}try{SG.eng.journal=SG.eng.journal.length?SG.eng.journal:(JSON.parse(localStorage.getItem('kair_sm_journal')||'[]')||[])}catch(e){}
 if(S.test==null)S.test=false; // v3.27: тест-режим по умолчанию выключен (кнопка ТЕСТ)
 if(!SG.tst)SG.tst=new KairTest.Sim();var tst=SG.tst,tstSlot=null;
 if(!SG.figBars){SG.figBars=new K39.Candles();SG.figSlot=null;SG.figs=[];try{SG.figJ=JSON.parse(localStorage.getItem('kair_fig_journal')||'[]')||[]}catch(e){SG.figJ=[]}}var figBars=SG.figBars;
 if(!SG.cpJ){try{SG.cpJ=JSON.parse(localStorage.getItem('kair_cp_journal')||'[]')||[]}catch(e){SG.cpJ=[]}SG.cpSeen={};SG.cpJ.forEach(function(r){SG.cpSeen[r.pair+'|'+r.tf+'|'+r.t+'|'+r.name]=1})}
 if(SG.cpN==null){var seq=0,dirty=0;try{seq=+localStorage.getItem('kair_cp_seq')||0}catch(e){}SG.cpJ.forEach(function(r){if(!r.n){seq++;r.n=seq;dirty=1}else if(r.n>seq)seq=r.n});SG.cpN=seq;if(dirty){try{localStorage.setItem('kair_cp_journal',JSON.stringify(SG.cpJ));localStorage.setItem('kair_cp_seq',String(seq))}catch(e){}}}
 if(!SG.bg){SG.bg=new KairBG.BG();KairBG.IDB.open();setInterval(function(){KairBG.IDB.flush()},5000);setInterval(function(){KairBG.IDB.trim()},600000)}
var eng=SG.eng,bars=SG.bars,pay=null,payAt=0,shownKey=null,lastSk='';if(SG.timer){clearInterval(SG.timer);SG.timer=null}
 KairFeed.install();
 KairFeed.onTick=function(sym,ts,price){var now=Date.now(),syms=KairFeed.stat.syms,cnt=0,cur=bars.sym;for(var k in syms)if(now-syms[k]<20000)cnt++;
  if(SG.want&&sym!==SG.want&&now-(syms[SG.want]||0)<20000)return; // v3.36: после смены пары (история PO) — только новый актив
  if(!SG.want&&cur&&sym!==cur&&cnt>1&&now-(syms[cur]||0)<5000)return; // несколько потоков: держим текущий актив, пока по нему идут котировки
  if(cur&&sym!==cur)engReset(sym,0);
  try{SG.bg.tick(sym,ts,price,pay);KairBG.IDB.push(ts,sym,price)}catch(e){} // v3.39: фоновые M1/M3/M5 и сырые тики — только журнал
  bars.tick(sym,ts,price,K39.S.slotMs(S.tf||'M1'));figBars.tick(sym,ts,price,180000);histTick(sym,[[ts,price]]);w3.tick(sym,ts,price);}; // v3.38: окно обновляется на каждом тике (не реже 0,4 с), с живой свечой
// v3.36: часы PO читаются и из составного элемента (текст разбит на дочерние узлы)
 // v3.35: свечи для полосы и пустой области фигур — сразу из истории PO (только отображение; движок и фигуры не трогаем)
 if(!SG.hb)SG.hb={tf:null,c:new K39.Candles(),m3:new K39.Candles()};var hb=SG.hb;
 // v3.40: свечи M3 окна — по времени точек (open = самая ранняя, close = самая поздняя), из истории PO любого ТФ ≤ M3 и живых тиков; только отображение
 if(!SG.w3){SG.w3=new K39.Candles();SG.w3.tick=function(sym,ts,price){if(!(price>0)||!isFinite(price)||!(ts>0))return;if(this.sym!==sym){this.reset();this.sym=sym}var k=Math.floor(ts/180000),b=this.bars[k];if(!b){this.bars[k]={o:price,h:price,l:price,c:price,t0:ts,t1:ts};return}if(price>b.h)b.h=price;if(price<b.l)b.l=price;if(ts<b.t0){b.t0=ts;b.o=price}if(ts>=b.t1){b.t1=ts;b.c=price}}}var w3=SG.w3;
 function w3Hist(sym,pts,per){if(per&&(per>180||180%per))return;if(!(sym===bars.sym||SG.want===sym||!bars.sym))return;pts.forEach(function(p){w3.tick(sym,p[0],p[1])})}
 function histTick(sym,pts){var cur=bars.sym||sym;if(sym!==cur)return;var sm=K39.S.slotMs(S.tf||'M1');if(hb.tf!==sm){hb.tf=sm;hb.c.reset()}pts.sort(function(a,b){return a[0]-b[0]});pts.forEach(function(p){hb.c.tick(sym,p[0],p[1],sm);hb.m3.tick(sym,p[0],p[1],180000)})}
 function engReset(sym,n){for(var t in eng.tf){eng.hardReset(eng.tf[t]);eng.tf[t].lastT=null}eng.sig={k:'none'};lastSk='';try{SG.figs=[];SG.figSlot=null}catch(e){}slog('пара → '+sym+(n?', прогрев из истории PO: '+n+' свечей':''))}
 // v3.36: смена пары — PO присылает историю нового актива: сразу переключаем движок/фигуры/окно и прогреваем их по этой истории
 function histSeed(sym,pts,per){var sm=K39.S.slotMs(S.tf||'M1'),now=Date.now();pts=pts.filter(function(p){return p[0]<=now}).sort(function(a,b){return a[0]-b[0]});if(!pts.length)return;
  SG.want=sym;KairFeed.stat.syms[sym]=now;bars.reset();pts.forEach(function(p){bars.tick(sym,p[0],p[1],sm)});if(!per||per<=180){figBars.reset();pts.forEach(function(p){figBars.tick(sym,p[0],p[1],180000)})}
  var cl=bars.closed(Math.floor(now/sm),200);engReset(sym,cl.length);if(S.sig&&cl.length&&!KAIR_STRAT_MUTE)try{eng.step(cl,bars.lastPrice,Math.max(bars.dec,1),now,S.tf||'M1',pay,sym);render()}catch(e){}try{cpScan()}catch(e){}}
 KairFeed.onHist=function(sym,pts,per){try{w3Hist(sym,pts,per)}catch(e){}try{SG.bg.hist(sym,pts,per,SG.want===sym||!bars.sym||sym===bars.sym||!per||per*1000<=K39.S.slotMs(S.tf||'M1'))}catch(e){}if(per&&per*1000>K39.S.slotMs(S.tf||'M1'))return;if(sym!==bars.sym||bars.closed(Math.floor(Date.now()/K39.S.slotMs(S.tf||'M1')),200).length<30)histSeed(sym,pts,per);histTick(sym,pts);try{stripPaint();if(!SG.figs.length)figPaint(null)}catch(e){}};
 function render(){var tsTxt='';if(S.test){var st0='ТЕСТ 3.5 параллельно '+(S.tf||'M1')+' · сделок '+tst.all().filter(function(r){return r.v!=='EXT'&&r.res!=='CANCEL'}).length+' · свечей '+bars.closed(Math.floor(Date.now()/K39.S.slotMs(S.tf||'M1')),200).length+' · выплата '+(pay!=null?pay+'%':'не прочитана')+' · котировок '+KairFeed.stat.ticks+(bars.sym?' ('+bars.sym+')':'');tsTxt=' · '+st0}
  var s=eng.sig,pp=K39.Payout.ok(pay)?null:K39.Payout.plateText(pay),txt,cl='kq-w',tf0=S.tf||'M1',hm0=function(ms){var d=new Date(ms);var z=function(x){return ('0'+x).slice(-2)};return z(d.getDate())+'.'+z(d.getMonth()+1)+'.'+d.getFullYear()+' '+z(d.getHours())+':'+z(d.getMinutes())},sT=Date.now(),l1,l2='',bg='rgba(72,72,84,0.45)';
  if(pp){txt=pp;l1=esc(pp)}else if(s.k==='order'){txt=(s.call?'CALL':'PUT')+' · '+s.exp+'<br>'+s.price;l1=(s.call?'CALL':'PUT')+' · '+esc(s.exp);l2='вход по рынку · '+esc(s.price);if(s.slot!=null)sT=(s.slot+1)*K39.S.slotMs(tf0);bg=s.call?'rgba(30,150,70,0.45)':'rgba(200,50,50,0.45)'}
  else if(s.k==='cancel'){txt='ОТМЕНА'+(s.why?': '+esc(s.why):'')+'<br>'+s.price;cl='kq-w cancel';l1=txt.split('<br>')[0];l2=esc(s.price)}else{txt='No Trade';l1='No Trade'}
  var pst=pay==null?null:(K39.Payout.ok(pay)?'ok':'low');if(pst&&payPrev&&pst!==payPrev){if(pst==='low')tones([660,660],{gap:0.22,dur:0.14,vol:0.2});else tones([523,659],{gap:0.12,dur:0.3,vol:0.1})}if(pst)payPrev=pst;
  stripPaint();capSig=s.k==='order'&&!pp;capTf=tf0;if(txt!==shownKey){shownKey=txt;sCap.textContent=(capSig?poHM(sT):poHM(poNow()))+' · '+tf0;sL1.innerHTML=l1;sL2.innerHTML=l2;sL2.style.display=l2?'':'none';sBox.style.background=bg;sBox.className=cl.replace('kq-w','').trim();var sk=s.k+'|'+(s.k==='order'?(s.call?'c':'p')+'|'+s.slot+'|':'')+(s.price||'');
   if(sk!==lastSk&&!pp){if(s.k==='order')tones(s.call?[880,1109,1319]:[1319,1109,880]);else if(s.k==='cancel')tones([330,262])}if(!pp)lastSk=sk}
  var st=eng.verdict+' · свечей '+bars.closed(Math.floor(Date.now()/K39.S.slotMs(S.tf||'M1')),60).length+' · выплата '+(pay!=null?pay+'%':'не прочитана')+' · котировок '+KairFeed.stat.ticks+(bars.sym?' ('+bars.sym+')':'');
  st+=tsTxt;plate.title=st;sb.title='Сигнал KAIR 2.62-SM, '+(S.tf||'M1')+'. '+st;window.__kairStatus=st}
 // ---------- KAIR Figures v1.4 этап 1: M3, только отрисовка и журнал, сигналов нет, на 2.62-SM не влияет ----------
 function figTime(t){var d=new Date(t*180000);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}
 // v3.38: нижней полосы нет — свечи ТФ сигнала (те же, что у движка, с живой свечой) рисуются здесь; ч/б со свечением, свеча входа — зелёная CALL / красная PUT
 function figTick(now){if(!window.KairFigures||MOB)return;var ps=Math.floor(now/180000);figWin.style.display=S.sig?'':'none';if(SG.figSlot===ps||K39.SlotTiming.inGuard(now,180000))return;SG.figSlot=ps;
  var raw=figBars.closed(ps,200),n=raw.length,c3=raw.map(function(k,i){return {t:figTime(ps-(n-i)),o:k.o,h:k.h,l:k.l,c:k.c}});
  try{SG.figs=window.KairFigures.detect(c3);window.__kairFigCalls=(window.__kairFigCalls||0)+1;
   var idx={};SG.figJ.forEach(function(r,i){idx[r.pair+'|'+r.type+'|'+r.tStart]=i});
   SG.figs.forEach(function(f){var r=window.KairFigures.toRecord(f,c3);r.pair=figBars.sym||'?';var key=r.pair+'|'+r.type+'|'+r.tStart;if(idx[key]!=null)SG.figJ[idx[key]]=r;else{SG.figJ.push(r);slog('M3 фигура '+r.type+' '+r.tStart+' (без сигнала)')}});
   if(SG.figJ.length>2000)SG.figJ.splice(0,SG.figJ.length-2000);try{localStorage.setItem('kair_fig_journal',JSON.stringify(SG.figJ))}catch(e){}}catch(e){slog('фигуры: ошибка '+e.message)}
  }
 function figCSV(){var F=window.KairFigures,lines=F.toCSV(SG.figJ).split('\n');var q=function(x){x=String(x==null?'':x);return /[",\n;]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};return lines.map(function(l,i){return (i?q(SG.figJ[i-1].pair):'pair')+','+l}).join('\n')}
 // v3.33: живые часы в заголовке по времени PO (UTC+2), синхронизация с часами на странице PO
 var capSig=false,capTf='',poOff=0,poTz=2,poSyncAt=0;
 function poSync(){var RE=/(\d{1,2}):(\d{2}):(\d{2})\s*UTC\s*([+\-−])\s*(\d{1,2})/,els=document.querySelectorAll('body *');for(var i=0;i<els.length;i++){var e=els[i];var tx=e.textContent||'';if(tx.length>40||e.children.length>4||e.closest('#kair-root,#kair-dov'))continue;var m=RE.exec(tx);if(!m)continue;var tz=(m[4]==='+'?1:-1)*(+m[5]),now=Date.now(),day=86400000,po=((+m[1])*3600+(+m[2])*60+(+m[3]))*1000,loc=(now+tz*3600000)%day,d=po-loc;if(d>day/2)d-=day;if(d<-day/2)d+=day;poTz=tz;poOff=Math.abs(d)<600000?d:0;window.__kairPoOff=poOff;return}}
 function poNow(){return Date.now()+poOff}
 function poHM(ms){var d=new Date(ms+poTz*3600000),z=function(x){return ('0'+x).slice(-2)};return z(d.getUTCDate())+'.'+z(d.getUTCMonth()+1)+'.'+d.getUTCFullYear()+' '+z(d.getUTCHours())+':'+z(d.getUTCMinutes())}
 setInterval(function(){try{var n=Date.now();if(n-poSyncAt>10000){poSyncAt=n;poSync()}if(!capSig&&capTf&&typeof sCap!=='undefined'){var t=poHM(poNow())+' · '+(S.tf||capTf);if(sCap.textContent!==t)sCap.textContent=t}}catch(e){}},1000);
 function cpStamp(ms){var d=new Date(ms),z=function(n){return ('0'+n).slice(-2)};return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+' '+z(d.getHours())+':'+z(d.getMinutes())}
 function cpScan(){var tf=S.tf||'M1',sm=K39.S.slotMs(tf);if(!sm||!bars.sym||!SG.cpJ)return;var slot=Math.floor(Date.now()/sm),cl=bars.closed(slot,80);if(!cl.length)return;var base=slot-cl.length,pair=bars.sym,dec=Math.max(bars.dec||2,2),changed=0,i,h,hits,key,pow=Math.pow(10,dec);
  if(cl.length>=2)for(i=1;i<cl.length;i++){hits=KairCP.detectLast(cl.slice(0,i+1));for(h=0;h<hits.length;h++){key=pair+'|'+tf+'|'+((base+i)*sm)+'|'+hits[h].name;if(SG.cpSeen[key])continue;SG.cpSeen[key]=1;SG.cpN=(SG.cpN||0)+1;var sh=KairCP.shape(cl[i],dec);
   SG.cpJ.push({n:SG.cpN,t:(base+i)*sm,time:cpStamp((base+i)*sm),pair:pair,tf:tf,name:hits[h].name,dir:hits[h].dir,close:(Math.round(cl[i].c*pow)/pow).toFixed(dec),weak:hits[h].weak,body:sh.body,lower:sh.lower,upper:sh.upper,lowerBody:sh.lowerBody,upperBody:sh.upperBody,px1:'',res1:'',px2:'',res2:'',px3:'',res3:''});changed=1}}
  var bySlot={};for(i=0;i<cl.length;i++)bySlot[base+i]=cl[i];
  for(i=0;i<SG.cpJ.length;i++){var r=SG.cpJ[i];if(r.pair!==pair||r.tf!==tf)continue;var ps=Math.round(r.t/sm);
   if(!r.body){var pc=bySlot[ps];if(pc){var sh2=KairCP.shape(pc,dec);r.body=sh2.body;r.lower=sh2.lower;r.upper=sh2.upper;r.lowerBody=sh2.lowerBody;r.upperBody=sh2.upperBody;changed=1}}
   for(var k=1;k<=3;k++){if(r['res'+k])continue;var b=bySlot[ps+k];if(!b)continue;r['px'+k]=(Math.round(b.c*pow)/pow).toFixed(dec);r['res'+k]=KairCP.verdict(r.dir,r.close,r['px'+k]);changed=1}}
  if(SG.cpJ.length>2000){SG.cpJ.splice(0,SG.cpJ.length-2000);SG.cpSeen={};SG.cpJ.forEach(function(r){SG.cpSeen[r.pair+'|'+r.tf+'|'+r.t+'|'+r.name]=1});changed=1}
  if(changed){try{localStorage.setItem('kair_cp_journal',JSON.stringify(SG.cpJ));localStorage.setItem('kair_cp_seq',String(SG.cpN||0))}catch(e){}if(sheetMode==='j')showJournal()}}
 function cpHtml(){function z(x){return x==null||x===''?'—':esc(x)}var rows=(SG.cpJ||[]).slice(-15).reverse().map(function(r){return '<tr><td>'+z(r.n)+'</td><td>'+esc(r.time)+'</td><td>'+esc(r.pair)+'</td><td>'+r.tf+'</td><td>'+esc(r.name)+(r.weak?' ослабленный':'')+'</td><td>'+r.dir+'</td><td>'+esc(r.close)+'</td><td>'+z(r.body)+'</td><td>'+z(r.lower)+'</td><td>'+z(r.upper)+'</td><td>'+z(r.lowerBody)+'</td><td>'+z(r.upperBody)+'</td><td>'+z(r.px1)+'</td><td>'+z(r.res1)+'</td><td>'+z(r.px2)+'</td><td>'+z(r.res2)+'</td><td>'+z(r.px3)+'</td><td>'+z(r.res3)+'</td></tr>'}).join('');
  return '<b>2.63-CP (этап 1, без сигналов)</b> <button class="kq-b" data-csv="cp">CSV</button>\n<div style="overflow:auto;max-width:92vw"><table><tr><td class="kq-m">№</td><td class="kq-m">время</td><td class="kq-m">пара</td><td class="kq-m">ТФ</td><td class="kq-m">паттерн</td><td class="kq-m">напр.</td><td class="kq-m">закр</td><td class="kq-m">тело</td><td class="kq-m">низ</td><td class="kq-m">верх</td><td class="kq-m">низ/тело</td><td class="kq-m">верх/тело</td><td class="kq-m">+1</td><td class="kq-m">1</td><td class="kq-m">+2</td><td class="kq-m">2</td><td class="kq-m">+3</td><td class="kq-m">3</td></tr>'+rows+'</table></div>\n'}
 function sigTick(){if(!S.sig)return;var now=Date.now();try{figTick(now)}catch(e){}try{cpScan()}catch(e){slog('2.63-CP: '+e.message)}
  if(now-payAt>=3000){payAt=now;pay=KairFeed.readPayout()}
  var tf=S.tf||'M1',sm=K39.S.slotMs(tf);
  if(S.test){var ps=Math.floor(now/sm);if(bars.lastPrice!=null&&now-bars.lastTs<30000&&!K39.SlotTiming.inGuard(now,sm)&&tstSlot!==ps){tstSlot=ps;var cl2=bars.closed(ps,200),n2=cl2.length;
   try{tst.step(cl2.map(function(k,i){return {t:ps-(n2-i),o:k.o,h:k.h,l:k.l,c:k.c}}),tf,bars.sym||'?',pay,Math.max(bars.dec,1))}catch(e){slog('тест: ошибка '+e.message)}if(sheetMode==='j')showJournal()}}
  if(KAIR_STRAT_MUTE)eng.verdict='Стратегия заглушена';else if(bars.lastPrice!=null&&now-bars.lastTs<30000){var cl=bars.closed(Math.floor(now/sm),200);if(cl.length)eng.step(cl,bars.lastPrice,Math.max(bars.dec,1),now,tf,pay,bars.sym||'?');else eng.verdict='Стратегия 2.62-SM '+tf+': 0 свечей'}
  else eng.verdict='Стратегия 2.62-SM '+tf+': нет котировок';
  try{localStorage.setItem('kair_sm_journal',JSON.stringify(eng.journal.slice(-1500)))}catch(e){}
  render()}
 window.KAIR={bars:function(){return bars.closed(Math.floor(Date.now()/K39.S.slotMs(S.tf||'M1')),200)},status:function(){return window.__kairStatus},figures:function(){return SG.figs},log:function(){return sigLog.slice(-50)}};
 function sigUi(){sb.className='kq-b'+(S.sig?' on':'');sb.innerHTML=S.sig?'СИГ<br>ВКЛ':'СИГ<br>ВЫКЛ';tfb.innerHTML=S.tf||'M1';KairFeed.on=!!S.sig;figWin.style.display=S.sig&&!MOB?'':'none';figPlace();if(MOB){KairFeed.on=false;plate.style.display='none';return}
  if(!S.sig){plate.style.display='none';clearInterval(SG.timer);SG.timer=null;eng.reset();bars.reset();bars.lastPrice=null;shownKey=null;lastSk=''}
  else{plate.style.display='';if(!SG.timer){SG.timer=setInterval(sigTick,5000);setTimeout(sigTick,300)}}}
 // ---------- Калькулятор (K. A. I. R. calc) ----------
 var calc=el('div',{id:'kair-calc','class':'kq-w'});calc.addEventListener('focusin',function(){var r=calc.getBoundingClientRect();if(r.bottom>innerHeight){calc.style.top=Math.max(0,innerHeight-calc.offsetHeight-8)+'px'}});calc.style.display=S.calcOpen?'':'none';root.appendChild(calc);
 calc.innerHTML='<div class="kq-t">Ставка</div><div class="kq-box"><div class="kq-r"><span class="kq-m">Уровень</span><b data-k="lv"></b></div><div class="kq-r"><span class="kq-m">Текущая ставка</span><b data-k="st"></b></div><div class="kq-r"><span class="kq-m">Если выиграю</span><b data-k="iw"></b></div><div class="kq-r"><span class="kq-m">Если проиграю</span><b data-k="il"></b></div></div><div class="kq-keys"></div><div class="kq-r" style="margin-top:6px;cursor:pointer" data-k="goal"><b>Цель</b><span class="kq-m" data-k="gt"></span></div><div class="kq-bar"><i data-k="gb"></i></div><div class="kq-t" style="margin-top:8px">Статистика</div><div class="kq-g"><div><span class="kq-m">N</span><b data-k="N"></b></div><div><span class="kq-m">W</span><b data-k="W"></b></div><div><span class="kq-m">L</span><b data-k="L"></b></div><div><span class="kq-m">W/R</span><b data-k="WR"></b></div><div style="grid-column:span 2"><span class="kq-m">$</span><b data-k="PNL"></b></div></div><div data-k="dlg"></div>';
 function q(k){return calc.querySelector('[data-k="'+k+'"]')}
 drag(calc,calc.querySelector('.kq-t'),'calcPos');
 // v3.4: иконка калькулятора в правой колонке иконок PO; свёрнут по умолчанию
 S.calcOpen=false;calc.style.display='none';
 var cIco=el('div',{id:'kair-calc-ico',title:'K. A. I. R. calc'});cIco.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h1M12 11h0M15 11h1M8 14.5h1M12 14.5h0M15 14.5h1M8 18h1M12 18h0M15 18h1"/></svg>';
 var poC=null;
 function findCol(){if(poC&&poC.isConnected){var r0=poC.getBoundingClientRect();if(r0.width>0&&r0.right>=innerWidth-3)return poC}poC=null;var W=innerWidth,H=innerHeight,cnt=new Map(),pts=[0.3,0.45,0.6],x=W-20;
  pts.forEach(function(f){var seen=new Set();document.elementsFromPoint(x,H*f).forEach(function(e){for(var n=e;n&&n!==document.body;n=n.parentElement){if(seen.has(n)||root.contains(n)||n===cIco)continue;seen.add(n);cnt.set(n,(cnt.get(n)||0)+1)}})});
  var best=null,bw=1e9;cnt.forEach(function(c,n){if(c<pts.length)return;var r=n.getBoundingClientRect();if(r.right<W-3||r.width<32||r.width>90||r.height<H*0.4)return;var ic=0;for(var i=0;i<n.querySelectorAll('svg,img,i,a,button').length&&ic<4;i++){var q=n.querySelectorAll('svg,img,i,a,button')[i].getBoundingClientRect();if(q.width>=12&&q.width<=60&&q.height>=12&&q.height<=60)ic++}if(ic>=4&&r.width<bw){bw=r.width;best=n}});
  poC=best;return best}
 function placeIco(){var c=findCol();if(c){if(cIco.parentElement!==c){cIco.className='kq-in';c.appendChild(cIco)}}else if(cIco.parentElement!==root){cIco.className='kq-fix';root.appendChild(cIco)}}
 function calcToggle(open){S.calcOpen=open==null?calc.style.display==='none':open;cIco.classList.toggle('on',S.calcOpen);clearTimeout(calc.__t);
  if(S.calcOpen){var c=findCol(),r=c?c.getBoundingClientRect():{left:innerWidth-56,top:60},L=r.left;document.querySelectorAll('[class*="btn-call"],[class*="btn-put"],[class*="call-btn"],[class*="put-btn"]').forEach(function(b){if(root.contains(b))return;var q=b.getBoundingClientRect();if(q.width>30&&q.height>15&&q.left>innerWidth*0.5&&q.left-8<L)L=q.left-8});calc.style.display='';calc.style.right='auto';calc.style.top=Math.max(4,r.top)+'px';calc.style.left=Math.max(0,L-calc.offsetWidth-4)+'px';calc.style.transition='none';calc.style.transform='translateX(24px)';calc.style.opacity='0';calc.offsetWidth;calc.style.transition='transform .18s ease,opacity .18s ease';calc.style.transform='translateX(0)';calc.style.opacity='1'}
  else{calc.style.transition='transform .18s ease,opacity .18s ease';calc.style.transform='translateX(24px)';calc.style.opacity='0';calc.__t=setTimeout(function(){calc.style.display='none'},190)}save()}
 cIco.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();calcToggle()});
 /* v3.24: иконка калькулятора в колонку PO не вставляется; открытие — кнопка Calc на левой панели */addEventListener('resize',function(){poC=null});
 function refresh(){book.rollDay();q('lv').textContent=book.ladder.level;q('st').textContent='$'+book.stake().toFixed(2);q('iw').textContent=money(book.ifWin());q('il').textContent=money(book.ifLoss());
  var s=book.stats();q('N').textContent=s.N;q('W').textContent=s.W;q('L').textContent=s.L;q('WR').textContent=s.WR+'%';q('PNL').textContent=(s.PNL>=0?'+':'−')+Math.abs(s.PNL).toFixed(2);
  q('gt').textContent=book.goalText();q('gb').style.width=(book.goalFrac()*100)+'%';if(sheetMode==='j')showJournal()}
 function rec(o){if(book.base()===0){goalDlg('Сначала задайте цель: Депо, Профит, Сделок, Выплата %.');return}book.record(o);save();refresh()}
 function goalDlg(msg){var d=q('dlg');if(d.innerHTML){d.innerHTML='';return}var f=[['deposit','Депо'],['profit','Профит'],['trades','Сделок'],['payout','Выплата %']];
  d.innerHTML='<div class="kq-box" style="margin-top:6px">'+(msg?'<div class="kq-m">'+msg+'</div>':'')+f.map(function(x){return '<div class="kq-m">'+x[1]+'</div><input data-f="'+x[0]+'" inputmode="decimal" value="'+KairCore.g(+book.goal[x[0]])+'">'}).join('')+'</div>';
  var ok=btn('OK',function(){d.querySelectorAll('input').forEach(function(i){var v=parseFloat(String(i.value).replace(',','.'));if(isFinite(v)&&v>=0)book.goal[i.getAttribute('data-f')]=i.getAttribute('data-f')==='trades'?Math.floor(v):v});d.innerHTML='';save();refresh()});d.firstChild.appendChild(ok)}
 var keys=calc.querySelector('.kq-keys');
 [['W',function(){rec('win')},'Выигрыш'],['L',function(){rec('loss')},'Проигрыш'],['N',function(){rec('refund')},'Возврат'],['D',function(){if(confirm('Очистить статистику (N, W, L, W/R, $) и уровень ставки?\nЖурнал сделок сохраняется.')){book.clearStats();save();refresh()}},'Очистить'],['J',function(){openSheet('j')},'Журнал']].forEach(function(x){keys.appendChild(btn(x[0],x[1],x[2]))});
 q('goal').addEventListener('click',function(){goalDlg()});
 // ---------- Шторка: Стратегия / Журнал ----------
 var sheet=el('div',{id:'kair-sheet','class':'kq-w'});sheet.style.display='none';root.appendChild(sheet);var sheetMode=null,sheetView='cp';try{var sv0=localStorage.getItem('kair_sheet_view');if(sv0==='sm'||sv0==='cp')sheetView=sv0}catch(e){}
 function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
 function stratBtns(){function b(id,label){var on=sheetView===id;var bg=on?'#2a6fe6':'#2a2c31';var bd=on?'#8eb6ff':'#555';var fg=on?'#fff':'#8d8d8d';return '<button type="button" data-strat="'+id+'" style="display:inline-block!important;margin:0 8px 4px 0!important;padding:8px 16px!important;cursor:pointer!important;border:2px solid '+bd+'!important;background:'+bg+'!important;color:'+fg+'!important;font-weight:'+(on?'700':'400')+'!important;box-shadow:'+(on?'0 0 0 2px #2a6fe6':'none')+'!important">'+label+'</button>'};var note=sheetView==='sm'?'На экране 2.62-SM. Сигналы заглушены. Кнопка их не включает.':'На экране 2.63-CP. Журнал паттернов. Сигналов и ордеров нет.';return b('sm','2.62')+b('cp','2.63')+'<button type="button" class="kq-b" data-exp="1" style="display:inline-block;margin:0 0 4px 6px;padding:6px 12px;cursor:pointer">Exp.</button>\n<span class="kq-m">'+note+'</span>\n'}
 function showJournal(){var d=book.daily(),last=book.trades.filter(function(t){return t.kind==='manual'}).slice(-30).reverse();
  sheet.innerHTML='<b>Журнал</b>  <span class="kq-m">(нажмите сюда, чтобы закрыть)</span>\n<table><tr><td class="kq-m">День</td><td class="kq-m">N</td><td class="kq-m">W</td><td class="kq-m">L</td><td class="kq-m">$</td></tr>'+d.map(function(x){return '<tr><td>'+x.date+'</td><td>'+x.N+'</td><td>'+x.W+'</td><td>'+x.L+'</td><td>'+money(x.PNL)+'</td></tr>'}).join('')+'</table>\n<b>Последние сделки</b>\n<table>'+last.map(function(t){return '<tr><td>'+t.date+' '+t.time+'</td><td>'+({win:'W',loss:'L',refund:'N'}[t.outcome])+'</td><td>$'+t.stake+'</td><td>'+money(t.profit)+'</td></tr>'}).join('')+'</table>\n'+obsLine()+stratBtns()+(sheetView==='sm'?smHtml():cpHtml())+figHtml()+testHtml()+'<b>Сигнал KAIR</b> <span class="kq-m">'+esc(window.__kairStatus||'выключен')+'</span>\n<span class="kq-m">'+esc(sigLog.slice(-25).reverse().join('\n'))+'</span>'}
 function obsLine(){if(!S.sig)return '<span class="kq-m">наблюдение: выключено (СИГ ВЫКЛ)</span>\n';var sm=K39.S.slotMs(S.tf||'M1'),n=bars.closed(Math.floor(Date.now()/sm),200).length,lt=bars.lastTs?new Date(bars.lastTs):null;
  return '<span class="kq-m">наблюдение: '+n+' свечей '+(S.tf||'M1')+', последняя котировка '+(lt?('0'+lt.getHours()).slice(-2)+':'+('0'+lt.getMinutes()).slice(-2)+':'+('0'+lt.getSeconds()).slice(-2):'—')+', котировок '+KairFeed.stat.ticks+(bars.sym?' ('+esc(bars.sym)+')':'')+'</span>\n'}
 function smHtml(){var sm=eng.summary(),ks=Object.keys(sm);return '<b>Сигналы 2.62-SM (фрактал 5, эксп. 3 свечи)</b> <button class="kq-b" data-csv="sm">CSV</button> <button class="kq-b" data-exp="1" title="Выгрузка: тики, свечи M1/M3/M5, фракталы, сетки, почти-входы, сигналы (JSON)">Exp.</button>\n<span class="kq-m">'+(ks.map(function(k){var x=sm[k];return k+': N '+x.N+', W '+x.W+', L '+x.L+', WR '+x.WR+'%'}).join('; ')||'сделок пока нет')+'</span>\n<table>'+eng.journal.slice(-15).reverse().map(function(r){return '<tr><td>'+esc(r.time.slice(5))+'</td><td>'+esc(r.pair)+'</td><td>'+r.tf+'</td><td>'+r.mode+'</td><td>'+r.dir+'</td><td>'+r.label+'</td><td>'+r.entry+'</td><td>'+r.expiry_price+'</td><td>'+(r.result||'')+(r.warmup?' (разогрев)':'')+'</td><td>'+esc(r.cancel)+'</td></tr>'}).join('')+'</table>\n'}
 function figHtml(){return '<b>Фигуры M3 (v1.4 этап 1, без сигналов)</b> <button class="kq-b" data-csv="fig">CSV</button>\n<table>'+SG.figJ.slice(-10).reverse().map(function(r){return '<tr><td>'+esc(r.pair)+'</td><td>'+r.type+'</td><td>'+esc(r.tStart)+'</td><td>'+esc(r.tEnd)+'</td><td>'+r.outcome+'</td></tr>'}).join('')+'</table>\n'}
 function testHtml(){if(!S.test)return '';var sm=tst.summary(pay),v=sm.v;
  return '<b>Тест (фрактал '+KairTest.TFR+', эксп. 3 свечи, нетто при выплате '+(pay!=null?pay+'%':'—')+', в ставках)</b> <button class="kq-b" data-csv="1">CSV</button>\n<table><tr><td class="kq-m">Вар.</td><td class="kq-m">N</td><td class="kq-m">W</td><td class="kq-m">L</td><td class="kq-m">D</td><td class="kq-m">WR%</td><td class="kq-m">Нетто</td></tr>'+
   ['C1','C2','E2'].map(function(k){var x=v[k];return '<tr><td>'+k+'</td><td>'+x.N+'</td><td>'+x.W+'</td><td>'+x.L+'</td><td>'+x.D+'</td><td>'+x.WR+'</td><td>'+(x.net>=0?'+':'')+x.net+'</td></tr>'}).join('')+'</table>\n'+
   '<b>Уровни пользователя (касания / отскоки ≥'+KairTest.BOUNCE_X+' AB / пробои / % отскоков)</b>\n<table>'+tst.levels().map(function(l){return '<tr><td>'+l.v+'</td><td>'+l.lvl+'</td><td>'+l.touch+'</td><td>'+l.bounce+'</td><td>'+l.brk+'</td><td>'+l.rate+'%</td></tr>'}).join('')+'</table>\n'+
   '<span class="kq-m">вкладка '+tst.tab+'; старт: '+(tst.starts.map(function(z){return esc(z.pair)+' '+z.tf+' с '+z.start.slice(11)+' (прогрев '+KairTest.WARM+' свечей до '+z.warm_until.slice(11)+')'}).join('; ')||'—')+(tst.full?'. <b>ХРАНИЛИЩЕ ПЕРЕПОЛНЕНО — новые строки не сохраняются, выгрузите CSV</b>':'')+'. Сводка и уровни — все вкладки, без прогрева; CSV — все строки всех вкладок</span>\n'+
   (tst.count(10)?'<span class="kq-m">старые строки с фракталом 10: '+tst.count(10)+' (отдельно, только в CSV, period=10)</span>\n':'')+
   '<span class="kq-m">EXT (глубже всего достигнуто): '+(Object.keys(sm.ext).map(function(k){return k+' — '+sm.ext[k]}).join(', ')||'—')+'</span>\n<table>'+
   tst.all().slice(-30).reverse().map(function(r){return '<tr><td>'+r.time.slice(5)+'</td><td>'+esc(r.pair)+'</td><td>'+r.tf+'</td><td>'+r.v+'</td><td>'+r.dir+'</td><td>'+r.entry+'</td><td>'+r.close+'</td><td>'+r.res+(r.warmup?' (прогрев)':'')+'</td><td>'+r.deep+'</td></tr>'+(r.path?'<tr><td colspan="9" class="kq-m">'+r.tf+' '+esc(r.pair)+' '+r.v+': '+esc(r.path)+'</td></tr>':'')}).join('')+'</table>\n'}
 sheet.addEventListener('click',function(e){var st=e.target.closest&&e.target.closest('[data-strat]');if(st){e.stopPropagation();var id=st.getAttribute('data-strat');if(id==='sm'||id==='cp'){sheetView=id;try{localStorage.setItem('kair_sheet_view',id)}catch(e2){}}paintSheet();return}if(e.target.closest&&e.target.closest('[data-exp]')){e.stopPropagation();kairExport();return}if(!e.target.closest||!e.target.closest('[data-csv]'))return;e.stopPropagation();var cv0=e.target.closest('[data-csv]').getAttribute('data-csv'),body=cv0==='sm'?eng.csv():cv0==='fig'?figCSV():cv0==='cp'?KairCP.csv(SG.cpJ||[]):tst.csv(),pre=cv0==='sm'?'kair_262sm_':cv0==='fig'?'kair_figures_':cv0==='cp'?'kair_263cp_':'kair_test_';var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/csv'}));a.download=pre+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.csv';a.rel='noopener';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},4000)},true);
 // v3.8: прозрачный фон у родного блока PO слева вверху (время «UTC», ⚡, ◄, список индикаторов, «A»). Ничего не скрываем, меняем только background.
 function clearPoBg(){var W=Math.min(420,innerWidth*0.45),RE=/\d{1,2}:\d{2}(:\d{2})?\s*UTC\s*[+\-−]?\s*\d/;
  document.querySelectorAll('div,span').forEach(function(e){if(e.children.length>2||root.contains(e))return;var t=e.textContent||'';if(t.length>30||!RE.test(t))return;
   for(var n=e.parentElement,d=0;n&&n!==document.body&&d<6;n=n.parentElement,d++){var r=n.getBoundingClientRect();if(r.width>W||r.height>320||r.left>320||r.top>innerHeight*0.5||n.querySelector('canvas'))break;
    var cs=getComputedStyle(n);if(cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent'||cs.backgroundImage!=='none'){n.style.setProperty('background-color','transparent','important');n.style.setProperty('background-image','none','important');n.setAttribute('data-kair-bg','1')}}})}
 /* v3.23: ПК — фон PO не трогаем */
 function paintSheet(){if(sheetMode==='s')sheet.innerHTML='<span class="kq-m">(нажмите сюда, чтобы закрыть)</span>\n'+stratBtns()+esc(sheetView==='sm'?KAIR_STRATEGY:KAIR_CP_STRATEGY);else if(sheetMode==='j')showJournal()}
 function openSheet(m){if(sheetMode===m){sheet.style.display='none';sheetMode=null;return}sheetMode=m;sheet.style.display='';sheet.className='kq-w'+(m==='j'?' j':'');paintSheet()}
 sheet.addEventListener('click',function(){sheet.style.display='none';sheetMode=null});
 // v3.39: выгрузка журналов фоновых движков (сырые тики — из IndexedDB, если доступна)
function kairExport(){KairBG.IDB.all(function(tk){var o=SG.bg.exportObj(tk||null);o.patterns_263cp=SG.cpJ||[];if(!o.csv)o.csv={};o.csv.patterns_263cp=KairCP.csv(o.patterns_263cp);var st=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
 function dl(body,name,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:type}));a.download=name;a.rel='noopener';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},4000)}
 dl(JSON.stringify(o),'kair_export_'+st+'.json','application/json');slog('выгрузка: тиков '+o.ticks.length+', сеток '+o.grids.length+', почти-входов '+o.near_entry.length+', сигналов '+o.signals.length+', паттернов 2.63-CP '+o.patterns_263cp.length)})}
// ---------- Панель ----------
 var bar=el('div',{id:'kair-bar','class':'kq-w'+(S.barCol?' col':'')});root.appendChild(bar);setTimeout(figPlace,0);
 var h=el('div',{'class':'kq-h',title:'Нажатие — открыть/свернуть. Перетащить — передвинуть'},'K');bar.appendChild(h);drag(bar,h,'barPos',MOB?10:5);
 h.addEventListener('pointerup',function(){if(h.__moved){placeDt();try{figPlace()}catch(e){}return}if(MOB){toggleDov();return}S.barCol=!S.barCol;bar.className='kq-w'+(S.barCol?' col':'');save();if(S.barCol)closeDt()});
 var box=el('div',{'class':'kq-x'});bar.appendChild(box);
 var sb=btn('',function(){S.sig=!S.sig;save();if(S.sig)tones([]);sigUi()},'Сигнал KAIR');box.appendChild(sb);
 var tfb=btn('M1',function(){var a=['S5','S10','S15','S30','M1','M2','M3','M5'];S.tf=a[(a.indexOf(S.tf||'M1')+1)%a.length];save();eng.reset();bars.reset();bars.lastPrice=null;shownKey=null;sigUi()},'Таймфрейм графика для сигнала');box.appendChild(tfb);
 box.appendChild(btn('Calc',function(){calcToggle()},'K. A. I. R. calc'));
 var rb=btn('Рис.',function(){toggleDov()},'Рисование');box.appendChild(rb);
 box.appendChild(btn('Стр.',function(){openSheet('s')},'Показ правил 2.62 или 2.63'));
 box.appendChild(btn('Жур.',function(){openSheet('j')},'Журнал'));

 var tsb=btn('',function(){S.test=!S.test;save();tsUi();shownKey=null;sigUi();if(S.sig)render()},'Тест-режим 3.5 (параллельно с сигналами 2.62-SM)');box.appendChild(tsb);
 function tsUi(){tsb.className='kq-b'+(S.test?' on':'');tsb.innerHTML=S.test?'ТЕСТ<br>ВКЛ':'ТЕСТ<br>ВЫКЛ'}tsUi();
 if(MOB){box.style.display='none';S.barCol=false;bar.className='kq-w';h.textContent='⋮';h.title='Перетащить панель рисования';
  h.addEventListener('pointermove',function(){if(!h.__moved||dt.style.display==='none')return;var br=bar.getBoundingClientRect(),rr=h.getBoundingClientRect();dt.style.left=(br.right+6)+'px';dt.style.top=Math.max(4,Math.min(innerHeight-dt.offsetHeight-4,rr.top+rr.height/2-dt.offsetHeight/2))+'px'})}
 sigUi();refresh();
}
// ---------- Скрытие лишнего (осторожно) ----------
var HIDE=/(promo|banner|bonus|tournament|achievement|social|support-chat|chat-widget|livechat|jivo|intercom|gift|cashback|advert|\bads?\b)/i;
var KEEP=/(deal|trade|trading|asset|amount|expir|balance|chart|timeframe|call|put|buy|sell|order|position|kair)/i;
function cls(e){return (typeof e.className==='string'?e.className:(e.getAttribute&&e.getAttribute('class'))||'')+' '+(e.id||'')}
function declutter(){var n=0;document.querySelectorAll('[class],[id]').forEach(function(e){if(e.__kh||e.closest('#kair-root,#kair-dov'))return;var c=cls(e);
  if(!HIDE.test(c)||KEEP.test(c))return; if(e.querySelector('canvas,input,select')) return;
  var inner=Array.prototype.some.call(e.querySelectorAll('[class]'),function(x){return KEEP.test(cls(x))}); if(inner)return;
  e.__kh=1;e.style.setProperty('display','none','important');n++});return n}
window.__kairDeclutter=declutter;
// ---------- Защита от двойного нажатия Buy/Sell (только блокирует второй клик) ----------
var TRADE=/(\bcall\b|\bput\b|\bbuy\b|\bsell\b|higher|lower|btn-call|btn-put|вверх|вниз|выше|ниже|купить|продать)/i, lastT=0;
window.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('button,a,[class*="btn"],[role="button"]'):null;
 if(!t||t.closest('#kair-root,#kair-dov'))return;var s=cls(t)+' '+(t.textContent||'').slice(0,40);if(!TRADE.test(s))return;
 var n=Date.now();if(n-lastT<1500){e.preventDefault();e.stopImmediatePropagation();return}lastT=n},true);
// ---------- Окна выбора пары и т.п.: тема не должна заливать весь экран сплошным фоном ----------
var MOD=/(drop|modal|popup|overlay|backdrop)/i;
function unfill(){document.querySelectorAll('[class*="drop"],[class*="modal"],[class*="popup"],[class*="overlay"],[class*="backdrop"],[role="dialog"]').forEach(function(e){if(e.closest('#kair-root,#kair-dov'))return;
  var r=e.getBoundingClientRect();var big=r.width>=innerWidth*0.85&&r.height>=innerHeight*0.85;
  if(big&&!e.__ku){e.__ku=1;e.style.setProperty('background-color','transparent','important');e.style.setProperty('background-image','none','important')}
  else if(!big&&e.__ku){e.__ku=0;e.style.removeProperty('background-color');e.style.removeProperty('background-image')}})}
window.__kairUnfill=unfill;
// v3.20: выпадающие окна PO (активы, индикаторы, инструменты и т.п.) — сплошная заливка вместо полупрозрачной. Только фон.
var POPSEL='[class*="drop"],[class*="modal"],[class*="popup"],[class*="menu"],[class*="tooltip"],[role="dialog"],[role="menu"],[role="listbox"]';
function rgba(s){var m=/rgba?\(([^)]+)\)/.exec(s||'');if(!m)return null;var p=m[1].split(',').map(parseFloat);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function opaque(){var W=innerWidth,H=innerHeight;document.querySelectorAll(POPSEL).forEach(function(e){if(e.closest('#kair-root,#kair-dov')||e.closest('canvas'))return;
  var r=e.getBoundingClientRect();if(r.width<120||r.height<60||(r.width>=W*0.85&&r.height>=H*0.85))return;
  var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return;var c=rgba(cs.backgroundColor);if(!c)return;
  if(c.a>0&&c.a<1){var B={r:26,g:26,b:36};e.style.setProperty('background-color','rgb('+Math.round(c.a*c.r+(1-c.a)*B.r)+','+Math.round(c.a*c.g+(1-c.a)*B.g)+','+Math.round(c.a*c.b+(1-c.a)*B.b)+')','important');e.__ko=1}
  else if(c.a===0&&!e.__ko){for(var n=e.parentElement;n&&n!==document.body;n=n.parentElement){var pc=rgba(getComputedStyle(n).backgroundColor),pr=n.getBoundingClientRect();if(pc&&pc.a>=1&&!(pr.width>=W*0.85&&pr.height>=H*0.85))return}
   e.style.setProperty('background-color','#252638','important');e.__ko=1}
  if(+cs.opacity<1&&+cs.opacity>0.5)e.style.setProperty('opacity','1','important')})}
window.__kairOpaque=opaque;
var tmr=null;function tick(){mount();if(MOB){declutter();unfill();try{opaque()}catch(_){}}} /* v3.23: на ПК PO не перекрашиваем и не скрываем */
if(MOB)addEventListener('click',function(){setTimeout(function(){try{opaque()}catch(_){}},250);setTimeout(function(){try{opaque()}catch(_){}},800)},true);
function start(){tick();if(MOB){setInterval(tick,3000);return}new MutationObserver(function(){if(tmr)return;tmr=setTimeout(function(){tmr=null;tick()},500)}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
