// ========== 模拟数据库 ==========
const DB = {
    get: (key, def) => JSON.parse(localStorage.getItem(key) || JSON.stringify(def)),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// ========== 示例填充 ==========
function fillExample(btn) {
    const text = document.getElementById('needInput');
    const map = {
        '🎒 轻便优先': '去云南轻旅行5天，预算1200元，需要背包、外套、帽子，要求轻便，运动鞋已有。',
        '☀️ 防晒防雨': '周末户外徒步，预算800元，需要防晒外套、防雨帽、雨衣，要求防晒和防雨。',
        '💰 预算1500': '暑假去川西7天，预算1500元，需要背包、外套、帽子、雨具全套，要求轻便防晒。',
        '📸 上镜好看': '去大理拍照3天，预算1000元，需要背包、外套、帽子，要求上镜好看、轻便。'
    };
    text.value = map[btn.textContent] || '';
    text.focus();
}

// ========== 1. 解析需求 ==========
function parseNeed(text) {
    const sessionId = 'sess_' + Math.random().toString(36).substr(2, 8);
    let budget = 1500, days = 0, destination = '', scene = '日常';
    let categories = [], have = [], hard = [], pref = [];

    const budgetMatch = text.match(/(\d+)\s*元|预算\s*(\d+)/);
    if (budgetMatch) budget = parseInt(budgetMatch[1] || budgetMatch[2]);

    const dayMatch = text.match(/(\d+)\s*天/);
    if (dayMatch) days = parseInt(dayMatch[1]);

    if (text.includes('云南')) destination = '云南';
    else if (text.includes('川西')) destination = '川西';
    else if (text.includes('大理')) destination = '大理';
    else if (text.includes('西藏')) destination = '西藏';

    if (text.includes('轻旅行') || text.includes('旅行') || text.includes('徒步') || text.includes('户外')) scene = '轻旅行';
    else if (text.includes('拍照')) scene = '拍照';

    const catMap = {'背包':'背包','包':'背包','外套':'外套','衣服':'外套','冲锋衣':'外套','防晒衣':'外套','帽子':'帽子','帽':'帽子','雨具':'雨具','雨衣':'雨具','雨伞':'雨具','雨披':'雨具'};
    for (const [k, v] of Object.entries(catMap)) {
        if (text.includes(k) && !categories.includes(v)) categories.push(v);
    }
    if (categories.length === 0) categories = ['背包','外套','帽子','雨具'];

    if (text.includes('运动鞋') || text.includes('鞋子')) have.push('运动鞋');
    if (text.includes('墨镜')) have.push('墨镜');

    if (text.includes('轻便') || text.includes('轻量')) hard.push('轻便');
    if (text.includes('防晒')) hard.push('防晒');
    if (text.includes('防雨') || text.includes('防水')) hard.push('防雨');

    if (text.includes('上镜')) pref.push('上镜');
    if (text.includes('性价比')) pref.push('性价比');

    const need = {session_id: sessionId, destination, scene, days, budget, categories, have_items: have, hard_rules: hard, preferences: pref};
    DB.set('current_need', need);
    logEvent('parse_need', 'AI解析需求完成', need);
    return need;
}

// ========== 2. 生成方案 ==========
function generatePlans() {
    const need = DB.get('current_need', null);
    if (!need) return [];

    function meetsHard(p) {
        if (need.hard_rules.includes('轻便') && !p.tags.includes('轻便')) return false;
        if (need.hard_rules.includes('防晒')) {
            if (!p.tags.includes('防晒') && p.attrs['防晒'] === '否') return false;
        }
        if (need.hard_rules.includes('防雨')) {
            if (!p.tags.includes('防雨') && p.attrs['防雨'] === '否') return false;
        }
        return true;
    }

    const plans = [];
    const types = [
        {type:'A', name:'预算节省型', reason:'同硬条件下优先低价，控总预算'},
        {type:'B', name:'综合平衡型', reason:'同硬条件下取中间价位，兼顾体验与成本'},
        {type:'C', name:'体验优先型', reason:'同硬条件下优先高配/高价，体验更好'}
    ];

    types.forEach(t => {
        let items = [], total = 0;
        need.categories.forEach(cat => {
            const cand = PRODUCTS.filter(p => p.category === cat && meetsHard(p));
            if (cand.length === 0) return;
            let pick;
            if (t.type === 'A') pick = cand.reduce((a,b) => a.price < b.price ? a : b);
            else if (t.type === 'B') pick = cand[Math.floor(cand.length/2)];
            else pick = cand.reduce((a,b) => a.price > b.price ? a : b);
            items.push({id: pick.id, name: pick.name, price: pick.price, category: pick.category, tags: pick.tags});
            total += pick.price;
        });
        plans.push({type: t.type, name: t.name, reason: t.reason, items, total, remaining: need.budget - total, over_budget: total > need.budget});
    });

    DB.set('current_plans', plans);
    logEvent('generate_plans', `生成${plans.length}套方案`, {count: plans.length});
    return plans;
}

// ========== 3. 购物车 ==========
function submitCart() {
    const need = DB.get('current_need', {budget: 1500, hard_rules: []});
    const items = DB.get('cart', []);
    let total = 0, errors = [];
    const valid = items.map(i => {
        const p = PRODUCTS.find(x => x.id === i.id);
        if (!p) { errors.push(`商品${i.id}不存在`); return null; }
        total += p.price;
        return {id: p.id, name: p.name, price: p.price, category: p.category};
    }).filter(Boolean);

    if (errors.length) return {status: 'error', errors};
    const over = total > need.budget;
    logEvent('cart_submit', over ? '提交被拒：超预算' : '模拟提交成功', {total});
    return {status: over ? 'reject' : 'ok', server_total: total, remaining: need.budget - total, over_budget: over, valid_items: valid};
}

// ========== 4. 价格回访 ==========
function createReturnTask(originalId, reason) {
    const original = PRODUCTS.find(p => p.id === originalId);
    if (!original) return null;
    const need = DB.get('current_need', {hard_rules: []});

    const cands = PRODUCTS.filter(p =>
        p.category === original.category &&
        p.id !== original.id &&
        p.price < original.price &&
        (!need.hard_rules.includes('轻便') || p.tags.includes('轻便'))
    );
    const substitute = cands.length > 0 ? cands.reduce((a,b) => a.price < b.price ? a : b) : null;
    if (!substitute) return {error: '无合适替代'};

    const task = {
        id: Date.now(), original, substitute,
        save_amount: original.price - substitute.price,
        reason, status: 'pending', created_at: new Date().toISOString()
    };
    const tasks = DB.get('return_tasks', []);
    tasks.push(task);
    DB.set('return_tasks', tasks);
    logEvent('return_create', '创建价格回访', {task_id: task.id, save: task.save_amount});
    return task;
}

// ========== 5. 事件日志 ==========
function logEvent(type, message, payload = {}) {
    const events = DB.get('events', []);
    events.unshift({type, message, payload, at: new Date().toISOString()});
    if (events.length > 100) events.pop();
    DB.set('events', events);
}

// ========== UI 渲染 ==========
function renderNeedCard(need) {
    document.getElementById('ncDest').textContent = need.destination || '未指定';
    document.getElementById('ncScene').textContent = need.scene + (need.days ? ` · ${need.days}天` : '');
    document.getElementById('ncBudget').textContent = `¥${need.budget}`;
    document.getElementById('ncCats').innerHTML = need.categories.map(c => `<span class="item-tag">${c}</span>`).join('');
    document.getElementById('ncHard').innerHTML = need.hard_rules.length ? need.hard_rules.map(h => `<span class="item-tag" style="background:rgba(245,158,11,.1);color:var(--amber)">${h}</span>`).join('') : '<span class="item-tag">无</span>';
    document.getElementById('ncHave').innerHTML = need.have_items.length ? need.have_items.map(h => `<span class="item-tag" style="background:rgba(34,197,94,.1);color:var(--green)">已有·${h}</span>`).join('') : '<span class="item-tag">无</span>';
    document.getElementById('needContent').textContent = JSON.stringify(need, null, 2);
    document.getElementById('needCard').classList.remove('hidden');
    document.getElementById('needCard').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function renderPlans(plans) {
    const list = document.getElementById('plansList');
    list.innerHTML = '';
    plans.forEach(p => {
        const card = document.createElement('div');
        card.className = `plan-card ${p.over_budget ? 'over-budget' : ''}`;
        card.innerHTML = `
            <div class="plan-header">
                <span class="plan-type-badge badge-${p.type}">方案 ${p.type}</span>
                <span class="plan-name">${p.name}</span>
            </div>
            <p class="plan-reason">${p.reason}</p>
            <div class="plan-total">¥${p.total}</div>
            <div class="plan-remain ${p.over_budget ? 'remain-over' : 'remain-ok'}">
                ${p.over_budget ? '⚠ 超预算 ' : '✓ 剩余 '}¥${Math.abs(p.remaining)}
            </div>
            <div class="plan-items">
                ${p.items.map(i => `
                    <div class="plan-item">
                        <div>
                            <div class="item-name">${i.name}</div>
                            <div class="item-tags">${i.tags.map(t => `<span class="item-tag">${t}</span>`).join('')}</div>
                        </div>
                        <div class="item-price">¥${i.price}</div>
                    </div>
                `).join('')}
            </div>
            <button class="select-plan-btn" onclick="selectPlan('${p.type}')">选择此方案</button>
        `;
        list.appendChild(card);
    });
    document.getElementById('plansSection').classList.remove('hidden');
    document.getElementById('returnsSection').classList.remove('hidden');
    document.getElementById('plansSection').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function selectPlan(type) {
    const plans = DB.get('current_plans', []);
    const p = plans.find(x => x.type === type);
    if (!p) return;
    DB.set('cart', p.items);
    renderCart();
    document.getElementById('cartSection').classList.remove('hidden');
    document.getElementById('cartSection').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function renderCart() {
    const items = DB.get('cart', []);
    const need = DB.get('current_need', {budget: 1500});
    const list = document.getElementById('cartItems');
    list.innerHTML = '';
    let total = 0;
    items.forEach(i => {
        const p = PRODUCTS.find(x => x.id === i.id);
        if (!p) return;
        total += p.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${p.name}</div>
                <div class="cart-item-meta">${p.category} · ${p.tags.map(t => `#${t}`).join(' ')}</div>
            </div>
            <div class="cart-item-price">¥${p.price}</div>
            <div class="cart-item-actions">
                <button class="btn-remove" onclick="removeItem(${p.id})">×</button>
            </div>
        `;
        list.appendChild(div);
    });
    // 摘要
    document.getElementById('summaryCount').textContent = items.length;
    document.getElementById('summaryTotal').textContent = `¥${total}`;
    const remain = need.budget - total;
    document.getElementById('summaryRemain').textContent = `¥${remain}`;
    const pct = Math.min(total / need.budget * 100, 100);
    const fill = document.getElementById('budgetFill');
    fill.style.width = pct + '%';
    fill.classList.toggle('over', total > need.budget);
}

function removeItem(id) {
    const items = DB.get('cart', []).filter(i => i.id !== id);
    DB.set('cart', items);
    renderCart();
    // 创建回访任务
    const task = createReturnTask(id, '用户从购物车删除（价格太高）');
    if (task && !task.error) renderReturns();
}

function renderReturns() {
    const tasks = DB.get('return_tasks', []);
    const tl = document.getElementById('returnTimeline');
    tl.innerHTML = '';
    tasks.slice().reverse().forEach(t => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot ${t.status}"></div>
            <div class="timeline-content">
                <div class="timeline-title">${t.original.name} → ${t.substitute.name}</div>
                <div class="timeline-desc">节省 ¥${t.save_amount} · ${t.reason}</div>
                <span class="timeline-badge badge-${t.status}">${t.status}</span>
            </div>
        `;
        tl.appendChild(item);
    });
}

function renderEvents() {
    const events = DB.get('events', []).slice(0, 30);
    document.getElementById('eventCount').textContent = `${events.length} 条事件`;
    const log = document.getElementById('eventLog');
    log.innerHTML = events.map(e => `
        <div class="event-item">
            <span class="event-time">${e.at.substr(11,8)}</span>
            <span class="event-type type-${e.type}">${e.type}</span>
            <span class="event-msg">${e.message}</span>
        </div>
    `).join('');
}

// ========== 绑定 ==========
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnParse').onclick = () => {
        const text = document.getElementById('needInput').value;
        if (!text) return alert('请输入需求描述');
        document.getElementById('parsingSkeleton').classList.remove('hidden');
        document.getElementById('btnParse').disabled = true;
        setTimeout(() => {
            document.getElementById('parsingSkeleton').classList.add('hidden');
            document.getElementById('btnParse').disabled = false;
            renderNeedCard(parseNeed(text));
        }, 1200);
    };

    document.getElementById('btnConfirm').onclick = () => {
        renderPlans(generatePlans());
    };

    document.getElementById('btnSaveCart').onclick = () => {
        DB.set('cart_draft', DB.get('cart', []));
        logEvent('cart_save', '保存草稿', {n: DB.get('cart', []).length});
        alert('✓ 购物车已保存');
    };

    document.getElementById('btnSubmit').onclick = () => {
        const res = submitCart();
        const result = document.getElementById('submitResult');
        if (res.status === 'ok') {
            result.innerHTML = `<p class="success" style="margin-top:12px">✓ 提交成功！服务端总价 ¥${res.server_total}，剩余 ¥${res.remaining}</p>`;
        } else if (res.status === 'reject') {
            result.innerHTML = `<p class="error" style="margin-top:12px">⚠ 超出预算！总价 ¥${res.server_total}。建议走价格回访。</p>`;
        }
    };

    document.getElementById('btnReturn').onclick = () => {
        const items = DB.get('cart', []);
        if (items.length === 0) return alert('购物车为空');
        const task = createReturnTask(items[0].id, '价格太高');
        if (task && !task.error) {
            renderReturns();
            alert(`✓ 已创建回访任务！替代商品: ${task.substitute.name}，可省 ¥${task.save_amount}`);
        }
    };

    // 自动刷新日志
    setInterval(renderEvents, 2000);
    renderEvents();
});
// 1. 导航栏点击平滑滚动与高亮逻辑
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // 移除所有高亮
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        // 当前项高亮
        e.target.classList.add('active');
        
        const targetId = e.target.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // 平滑滚动到对应模块
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // 如果是购物车、回访、验证台等模块，触发对应的渲染函数
            if (targetId === 'cartSection') renderCart();
            if (targetId === 'returnTimeline') renderReturns();
            if (targetId === 'eventLog') renderEvents();
        }
    });
});

// 2. 监听滚动事件，自动高亮当前所在的导航项
window.addEventListener('scroll', () => {
    const sections = ['need', 'plans', 'cart', 'return', 'verify'];
    const scrollPos = window.scrollY + 100; // 偏移量适配固定导航
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[data-target="${id}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
    });
});
