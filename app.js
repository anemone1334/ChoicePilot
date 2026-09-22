const catalog=[
  {cat:'背包',name:'轻量城市徒步双肩包',price:329,reason:'轻量、防泼水、适合7天出行'},
  {cat:'背包',name:'云野轻旅防水背包',price:259,reason:'轻便、防泼水、容量适中'},
  {cat:'外套',name:'城市轻量防晒外套',price:299,reason:'防晒、轻量、易收纳'},
  {cat:'外套',name:'轻户外防晒外套',price:199,reason:'防晒、轻量、价格友好'},
  {cat:'帽子',name:'折叠防晒遮阳帽',price:99,reason:'可折叠、轻便'},
  {cat:'帽子',name:'云南旅拍防晒帽',price:129,reason:'防晒、适合旅拍'},
  {cat:'雨具',name:'便携晴雨两用伞',price:79,reason:'轻量、晴雨两用'},
  {cat:'雨具',name:'超轻防风雨披',price:89,reason:'防雨、收纳小'}
];

let currentPlan=[];
let currentPlanLabel='B';
let locked=new Set();
let logs=[];

function log(x){
  logs.push(x);
  document.getElementById('log').innerHTML=
    logs.map(v=>'['+new Date().toLocaleTimeString()+'] '+v).join('<br>');
}

function show(id,btn){
  document.querySelectorAll('main>section').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  if(btn){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }

  if(id==='plans') renderPlans();
  if(id==='cart') renderCart();
}

function parseNeed(){
  document.getElementById('reqPanel').classList.remove('hidden');
  log('AI 已解析需求：预算1500、4个购买品类、轻便/防晒防雨');
}

function makePlan(type){
  let arr= type==='A'
    ? [catalog[1],catalog[3],catalog[4],catalog[6]]
    : type==='B'
    ? [catalog[0],catalog[2],catalog[5],catalog[6]]
    : [catalog[0],catalog[2],catalog[5],catalog[7]];

  return arr;
}

function total(a){
  return a.reduce((s,x)=>s+x.price,0);
}

function planCard(label,title,arr,desc){
  return `
    <div class="plan ${currentPlanLabel===label?'featured':''}"
         onclick="selectPlan('${label}')">
      
      <h3>方案 ${label} · ${title}</h3>

      <div class="muted">${desc}</div>

      <div class="price">
        ¥${total(arr)}
        <small style="font-size:12px;color:#7a8497">
          剩余 ¥${1500-total(arr)}
        </small>
      </div>

      ${arr.map((p,i)=>`
        <div class="product">
          <div>
            <b>${p.name}</b><br>
            <small>${p.cat} · ${p.reason}</small>
          </div>

          <div>
            ${locked.has(i)?'<span class="locked">已锁定</span>':''}
            <br>¥${p.price}
          </div>
        </div>
      `).join('')}

      <div class="actions">
        <button class="primary"
          onclick="event.stopPropagation();usePlan('${label}')">
          采用方案
        </button>
      </div>
    </div>
  `;
}

/* 点击方案卡片后切换绿色选中轮廓 */
function selectPlan(label){
  currentPlanLabel=label;
  renderPlans();
  log('用户选择方案 '+label);
}

function renderPlans(){
  let A=makePlan('A');
  let B=makePlan('B');
  let C=makePlan('C');

  document.getElementById('planArea').innerHTML=`
    <div class="panel">
      <h2>三套可解释方案</h2>

      <div class="plans">
        ${planCard(
          'A',
          '预算节省型',
          A,
          '优先控制总价，保留核心硬条件'
        )}

        ${planCard(
          'B',
          '综合平衡型',
          B,
          '预算、体验、功能之间取得平衡'
        )}

        ${planCard(
          'C',
          '体验优先型',
          C,
          '更重视旅拍与体验，仍不超预算'
        )}
      </div>
    </div>
  `;
}

function generatePlans(){
  currentPlanLabel='B';
  currentPlan=makePlan('B');

  document.getElementById('homePlans').classList.remove('hidden');

  document.getElementById('homePlans').innerHTML=`
    <div class="panel">
      <h2>③ 已生成三套方案</h2>

      <div class="success">
        需求已确认。点击左侧“方案中心”进行比较、锁定和替换。
      </div>
    </div>
  `;

  log('用户确认需求；规则引擎生成 A/B/C 三套方案');
  show('plans');
}

function usePlan(label){
  currentPlanLabel=label;
  currentPlan=makePlan(label);
  locked=new Set();

  log('用户采用方案 '+label+'；已保存为购物车草稿');

  show('cart');
}

function renderCart(){
  if(!currentPlan.length){
    currentPlanLabel='B';
    currentPlan=makePlan('B');
  }

  document.getElementById('cartItems').innerHTML=
    currentPlan.map((p,i)=>`
      <div class="cartrow">
        <div>
          <b>${p.name}</b><br>
          <small>${p.cat} · ${p.reason}</small>
        </div>

        <div>
          <b>¥${p.price}</b><br>

          <button class="ghost" onclick="toggleLock(${i})">
            ${locked.has(i)?'🔒 已锁定':'锁定商品'}
          </button>

          <button
            class="ghost ${locked.has(i)?'hidden':''}"
            onclick="replaceItem(${i})">
            替换
          </button>
        </div>
      </div>
    `).join('')+

    `
      <div style="text-align:right;padding-top:15px">
        <b>前端显示总价：¥${total(currentPlan)}</b><br>
        <span class="muted">
          提交时服务端重新计算，不接受前端直接传入总价
        </span>
      </div>
    `;
}

function toggleLock(i){
  if(locked.has(i)){
    locked.delete(i);
  }else{
    locked.add(i);
  }

  log(
    (locked.has(i)?'锁定':'解除锁定')+
    '：'+currentPlan[i].name
  );

  renderCart();
}

function replaceItem(i){
  let p=currentPlan[i];

  let alts=catalog.filter(
    x=>x.cat===p.cat&&x.name!==p.name
  );

  if(!alts.length)return;

  currentPlan[i]=alts[0];

  log(
    '替换品类：'+
    p.cat+
    ' → '+
    alts[0].name
  );

  renderCart();
}

function submitCart(){
  let serverTotal=total(currentPlan);

  document.getElementById('submitResult').innerHTML=`
    <div class="panel">
      <div class="success">✓ 模拟提交成功</div>

      <p>
        服务端重算总价：
        <b>¥${serverTotal}</b>
      </p>

      <p class="muted">
        购物车状态：已提交；当前不代表真实支付、库存、订单或物流。
      </p>
    </div>
  `;

  log(
    '后端校验通过；服务端重算总价 ¥'+
    serverTotal+
    '；模拟提交成功'
  );
}

function approveReturn(){
  document.getElementById('returnResult').innerHTML=`
    <div class="panel">
      <div class="success">
        ✓ 审核通过 → 模拟已触达 → 用户模拟返回
      </div>

      <div class="actions">
        <button class="primary green" onclick="readd()">
          确认重新加购
        </button>
      </div>
    </div>
  `;

  log('P0.5：运营审核通过，进入模拟触达');
}

function rejectReturn(){
  document.getElementById('returnResult').innerHTML=`
    <div class="panel">
      <div class="danger">
        审核拒绝，任务终止
      </div>
    </div>
  `;

  log('P0.5：运营审核拒绝');
}

function readd(){
  document.getElementById('returnResult').innerHTML=`
    <div class="panel">
      <div class="success">
        ✓ 用户主动确认重新加购 → 购物车重新校验 → 模拟提交成功
      </div>
    </div>
  `;

  log(
    'P0.5：用户主动确认重新加购，重新校验并提交成功'
  );
}

parseNeed();
