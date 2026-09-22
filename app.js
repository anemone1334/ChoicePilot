/* =========================================================
   ChoicePilot
   AI Shopping Decision Engine
   Complete Frontend Demo
   ========================================================= */


/* =========================
   1. 基础数据
   ========================= */

const catalog = [
  {
    cat: "背包",
    name: "轻量城市徒步双肩包",
    price: 329,
    reason: "轻量、防泼水、适合7天出行"
  },
  {
    cat: "背包",
    name: "云野轻旅防水背包",
    price: 259,
    reason: "轻便、防泼水、容量适中"
  },
  {
    cat: "外套",
    name: "城市轻量防晒外套",
    price: 299,
    reason: "防晒、轻量、易收纳"
  },
  {
    cat: "外套",
    name: "轻户外防晒外套",
    price: 199,
    reason: "防晒、轻量、价格友好"
  },
  {
    cat: "帽子",
    name: "折叠防晒遮阳帽",
    price: 99,
    reason: "可折叠、轻便"
  },
  {
    cat: "帽子",
    name: "云南旅拍防晒帽",
    price: 129,
    reason: "防晒、适合旅拍"
  },
  {
    cat: "雨具",
    name: "便携晴雨两用伞",
    price: 79,
    reason: "轻量、晴雨两用"
  },
  {
    cat: "雨具",
    name: "超轻防风雨披",
    price: 89,
    reason: "防雨、收纳小"
  }
];

const BUDGET = 1500;


/* =========================
   2. 当前状态
   ========================= */

let currentPlan = [];
let currentPlanLabel = "B";

let locked = new Set();

let logs = [];

let returnState = {
  status: "idle",
  deletedProduct: null,
  alternative: null
};


/* =========================
   3. 工具函数
   ========================= */

function total(items) {
  return items.reduce(function(sum, item) {
    return sum + Number(item.price || 0);
  }, 0);
}


function formatMoney(value) {
  return "¥" + Number(value).toLocaleString("zh-CN");
}


function nowTime() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour12: false
  });
}


/* =========================
   4. 日志系统
   ========================= */

function log(message, type = "EVENT") {

  logs.push({
    time: nowTime(),
    type: type,
    message: message
  });

  renderLogs();
}


function renderLogs() {

  const logBox = document.getElementById("log");

  if (!logBox) return;

  if (!logs.length) {
    logBox.innerHTML = `
      <div class="event-line">
        <span class="event-time">--:--:--</span>
        <span class="event-type">SYSTEM</span>
        <span>ChoicePilot Demo initialized.</span>
      </div>
    `;
    return;
  }

  logBox.innerHTML = logs.map(function(item) {

    return `
      <div class="event-line">
        <span class="event-time">${item.time}</span>
        <span class="event-type">${item.type}</span>
        <span>${item.message}</span>
      </div>
    `;

  }).join("");

  const count = document.getElementById("eventCount");

  if (count) {
    count.textContent = logs.length + " EVENTS";
  }
}


/* =========================
   5. 页面导航
   ========================= */

function show(id, btn) {

  const sections = document.querySelectorAll("main > section");

  sections.forEach(function(section) {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link").forEach(function(link) {
    link.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  }

  if (id === "plansSection") {
    renderPlans();
  }

  if (id === "cartSection") {
    renderCart();
  }

  if (id === "returnsSection") {
    renderReturn();
  }

  if (id === "eventsSection") {
    renderLogs();
  }
}


/* =========================
   6. 导航点击
   ========================= */

document.querySelectorAll(".nav-link").forEach(function(link) {

  link.addEventListener("click", function(event) {

    event.preventDefault();

    const targetId = link.getAttribute("href").replace("#", "");

    const target = document.getElementById(targetId);

    if (!target) return;

    document.querySelectorAll("main > section").forEach(function(section) {
      section.classList.add("hidden");
    });

    target.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(function(item) {
      item.classList.remove("active");
    });

    link.classList.add("active");

    if (targetId === "plansSection") {
      renderPlans();
    }

    if (targetId === "cartSection") {
      renderCart();
    }

    if (targetId === "returnsSection") {
      renderReturn();
    }

    if (targetId === "eventsSection") {
      renderLogs();
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  });

});


/* =========================
   7. 快捷需求按钮
   ========================= */

function fillExample(button) {

  const input = document.getElementById("needInput");

  if (!input) return;

  const text = button.textContent;

  if (text.includes("轻便")) {

    input.value =
      "下个月去云南轻旅行7天，预算1500元，需要背包、外套、帽子和便携雨具，要求轻便。";

  } else if (text.includes("防晒")) {

    input.value =
      "下个月去云南旅行7天，预算1500元，需要背包、外套、帽子和便携雨具，重点要求防晒和防雨。";

  } else if (text.includes("1500")) {

    input.value =
      "下个月去云南轻旅行7天，预算1500元，需要背包、外套、帽子和便携雨具。";

  } else if (text.includes("上镜")) {

    input.value =
      "下个月去云南轻旅行7天，预算1500元，需要背包、外套、帽子和便携雨具，希望轻便、防晒防雨，同时拍照好看。";

  }

  input.focus();

  log("用户选择快捷需求：" + text, "INPUT");
}


/* =========================
   8. AI 需求解析
   ========================= */

function parseNeed() {

  const panel = document.getElementById("reqPanel");

  if (panel) {
    panel.classList.remove("hidden");
  }

  const input = document.getElementById("needInput");

  const userText = input && input.value.trim()
    ? input.value.trim()
    : "下个月去云南轻旅行7天，预算1500元，需要背包、外套、帽子和便携雨具，要求轻便、防晒防雨。";

  const needContent = document.getElementById("needContent");

  if (needContent) {

    needContent.textContent = JSON.stringify({
      budget: 1500,
      destination: "云南",
      scene: "轻旅行",
      duration: "7天",
      categories: [
        "背包",
        "外套",
        "防晒帽",
        "便携雨具"
      ],
      hardConstraints: [
        "轻便",
        "防晒",
        "防雨"
      ],
      existingItems: [
        "运动鞋",
        "太阳镜"
      ],
      originalText: userText
    }, null, 2);

  }

  log(
    "AI 已解析需求：预算1500、4个购买品类、轻便/防晒/防雨",
    "AI"
  );

  updateNeedCard();

  return true;
}


/* =========================
   9. 更新需求卡
   ========================= */

function updateNeedCard() {

  const values = {
    ncDest: "云南",
    ncScene: "轻旅行",
    ncBudget: "¥1,500"
  };

  Object.keys(values).forEach(function(id) {

    const el = document.getElementById(id);

    if (el) {
      el.textContent = values[id];
    }

  });

  const cats = document.getElementById("ncCats");

  if (cats) {

    cats.innerHTML = [
      "背包",
      "外套",
      "防晒帽",
      "便携雨具"
    ].map(function(item) {
      return `<span>${item}</span>`;
    }).join("");

  }

  const hard = document.getElementById("ncHard");

  if (hard) {

    hard.innerHTML = [
      "轻便",
      "防晒",
      "防雨"
    ].map(function(item) {
      return `<span class="green-tag">${item}</span>`;
    }).join("");

  }

  const have = document.getElementById("ncHave");

  if (have) {

    have.innerHTML = [
      "运动鞋",
      "太阳镜"
    ].map(function(item) {
      return `<span class="gray-tag">${item}</span>`;
    }).join("");

  }
}


/* =========================
   10. 三套方案
   ========================= */

function makePlan(type) {

  if (type === "A") {

    return [
      catalog[1],
      catalog[3],
      catalog[4],
      catalog[6]
    ];

  }

  if (type === "C") {

    return [
      catalog[0],
      catalog[2],
      catalog[5],
      catalog[7]
    ];

  }

  return [
    catalog[0],
    catalog[2],
    catalog[5],
    catalog[6]
  ];
}


/* =========================
   11. 方案描述
   ========================= */

function getPlanMeta(label) {

  const data = {

    A: {
      title: "预算节省型",
      desc: "优先控制总价，保留核心硬条件。",
      tag: "LOW COST"
    },

    B: {
      title: "综合平衡型",
      desc: "预算、体验与功能之间取得平衡。",
      tag: "RECOMMENDED"
    },

    C: {
      title: "体验优先型",
      desc: "更重视旅拍与体验，仍控制在预算内。",
      tag: "EXPERIENCE"
    }

  };

  return data[label];
}


/* =========================
   12. 方案卡片
   ========================= */

function planCard(label, title, items, desc) {

  const amount = total(items);

  const remain = BUDGET - amount;

  const meta = getPlanMeta(label);

  const isSelected = currentPlanLabel === label;

  return `
    <div
      class="plan ${label === "B" ? "featured" : ""} ${isSelected ? "selected" : ""}"
      data-plan="${label}"
    >

      <div class="plan-top">

        <div>
          <div class="eyebrow small">
            PLAN ${label}
          </div>

          <h3>${title}</h3>

          <div class="muted">
            ${desc}
          </div>
        </div>

        <span class="plan-tag">
          ${meta.tag}
        </span>

      </div>


      <div class="price">
        ${formatMoney(amount)}

        <small>
          剩余 ${formatMoney(remain)}
        </small>
      </div>


      <div class="plan-products">

        ${items.map(function(product, index) {

          const lockedStatus =
            locked.has(index)
              ? `<span class="locked">已锁定</span>`
              : "";

          return `
            <div class="product">

              <div>
                <b>${product.name}</b>
                <br>
                <small>
                  ${product.cat} · ${product.reason}
                </small>
              </div>

              <div>
                ${lockedStatus}
                <br>
                ¥${product.price}
              </div>

            </div>
          `;

        }).join("")}

      </div>


      <div class="actions">

        <button
          class="btn btn-primary"
          onclick="usePlan('${label}')"
        >
          ${isSelected ? "✓ 当前方案" : "采用方案"}
        </button>

      </div>

    </div>
  `;
}


/* =========================
   13. 渲染方案
   ========================= */

function renderPlans() {

  const area = document.getElementById("planArea");

  if (!area) return;

  const A = makePlan("A");
  const B = makePlan("B");
  const C = makePlan("C");

  area.innerHTML =
    planCard(
      "A",
      "预算节省型",
      A,
      "优先控制总价，保留核心硬条件"
    ) +
    planCard(
      "B",
      "综合平衡型",
      B,
      "预算、体验、功能之间取得平衡"
    ) +
    planCard(
      "C",
      "体验优先型",
      C,
      "更重视旅拍与体验，仍不超预算"
    );

  const oldList = document.getElementById("plansList");

  if (oldList) {
    oldList.innerHTML = "";
  }

}


/* =========================
   14. 生成方案
   ========================= */

function generatePlans() {

  parseNeed();

  currentPlanLabel = "B";

  currentPlan = makePlan("B");

  locked = new Set();

  renderPlans();

  const homePlans = document.getElementById("homePlans");

  if (homePlans) {

    homePlans.classList.remove("hidden");

    homePlans.innerHTML = `
      <div class="success">
        ✓ 需求已确认，AI 已生成 A / B / C 三套方案。
      </div>
    `;

  }

  log(
    "用户确认需求；规则引擎生成 A/B/C 三套方案",
    "RULE"
  );

  show("plansSection");

  const plansSection = document.getElementById("plansSection");

  if (plansSection) {

    setTimeout(function() {

      plansSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 50);

  }
}


/* =========================
   15. 方案选择
   ========================= */

document.addEventListener("click", function(event) {

  const plan = event.target.closest(".plan");

  if (!plan) return;

  const label = plan.dataset.plan;

  if (!label) return;

  document.querySelectorAll(".plan").forEach(function(item) {

    item.classList.remove("selected");
    item.classList.remove("featured");

  });

  plan.classList.add("selected");

  currentPlanLabel = label;

  log(
    "用户查看方案 " + label + "：" +
    getPlanMeta(label).title,
    "PLAN"
  );

});


/* =========================
   16. 采用方案
   ========================= */

function usePlan(label) {

  currentPlanLabel = label;

  currentPlan = makePlan(label);

  locked = new Set();

  log(
    "用户采用方案 " +
    label +
    "：" +
    getPlanMeta(label).title,
    "PLAN"
  );

  saveDraft();

  renderCart();

  show("cartSection");

  const cartSection = document.getElementById("cartSection");

  if (cartSection) {

    setTimeout(function() {

      cartSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 50);

  }
}


/* =========================
   17. 渲染购物车
   ========================= */

function renderCart() {

  const container = document.getElementById("cartItems");

  if (!container) return;

  if (!currentPlan.length) {

    currentPlan = makePlan(currentPlanLabel || "B");

  }

  container.innerHTML = currentPlan.map(function(product, index) {

    const isLocked = locked.has(index);

    return `
      <div class="cartrow">

        <div>

          <b>${product.name}</b>

          <br>

          <small>
            ${product.cat} · ${product.reason}
          </small>

        </div>


        <div style="text-align:right">

          <b>
            ¥${product.price}
          </b>

          <br>

          <button
            class="ghost"
            onclick="toggleLock(${index})"
          >
            ${isLocked ? "🔒 已锁定" : "锁定商品"}
          </button>

          <button
            class="ghost ${isLocked ? "hidden" : ""}"
            onclick="replaceItem(${index})"
          >
            替换
          </button>

        </div>

      </div>
    `;

  }).join("");


  updateCartSummary();

}


/* =========================
   18. 购物车摘要
   ========================= */

function updateCartSummary() {

  const amount = total(currentPlan);

  const remain = BUDGET - amount;

  const count = document.getElementById("summaryCount");
  const summaryTotal = document.getElementById("summaryTotal");
  const summaryRemain = document.getElementById("summaryRemain");
  const budgetFill = document.getElementById("budgetFill");

  if (count) {
    count.textContent = currentPlan.length;
  }

  if (summaryTotal) {
    summaryTotal.textContent = formatMoney(amount);
  }

  if (summaryRemain) {

    summaryRemain.textContent =
      formatMoney(Math.max(remain, 0));

    summaryRemain.classList.toggle(
      "green-text",
      remain >= 0
    );

  }

  if (budgetFill) {

    const percentage =
      Math.min(
        Math.max((amount / BUDGET) * 100, 0),
        100
      );

    budgetFill.style.width = percentage + "%";

  }
}


/* =========================
   19. 锁定商品
   ========================= */

function toggleLock(index) {

  if (locked.has(index)) {

    locked.delete(index);

    log(
      "解除锁定：" +
      currentPlan[index].name,
      "CART"
    );

  } else {

    locked.add(index);

    log(
      "锁定商品：" +
      currentPlan[index].name,
      "CART"
    );

  }

  renderCart();

  saveDraft();
}


/* =========================
   20. 替换商品
   ========================= */

function replaceItem(index) {

  if (!currentPlan[index]) return;

  if (locked.has(index)) {

    log(
      "替换失败：商品已锁定",
      "WARN"
    );

    return;
  }

  const current = currentPlan[index];

  const alternatives = catalog.filter(function(item) {

    return (
      item.cat === current.cat &&
      item.name !== current.name
    );

  });

  if (!alternatives.length) {

    log(
      "没有找到可替换商品：" +
      current.cat,
      "WARN"
    );

    return;
  }

  const alternative = alternatives[0];

  currentPlan[index] = alternative;

  log(
    "替换商品：" +
    current.name +
    " → " +
    alternative.name,
    "CART"
  );

  renderCart();

  saveDraft();
}


/* =========================
   21. 模拟提交
   ========================= */

function submitCart() {

  if (!currentPlan.length) {

    currentPlan = makePlan(currentPlanLabel || "B");

  }

  const serverTotal = total(currentPlan);

  const result = document.getElementById("submitResult");

  if (result) {

    result.innerHTML = `
      <div class="success">

        <strong>✓ 模拟提交成功</strong>

        <br><br>

        服务端重新计算总价：
        <b>${formatMoney(serverTotal)}</b>

        <br>

        购物车状态：
        <b>已提交</b>

        <br>

        <span style="opacity:.7">
          当前不代表真实支付、库存、订单或物流。
        </span>

      </div>
    `;

  }

  log(
    "后端校验通过；服务端重算总价 " +
    formatMoney(serverTotal) +
    "；模拟提交成功",
    "SERVER"
  );

  saveDraft();

}


/* =========================
   22. 保存购物车草稿
   ========================= */

function saveDraft() {

  try {

    localStorage.setItem(
      "choicepilot_draft",
      JSON.stringify({
        currentPlan: currentPlan,
        currentPlanLabel: currentPlanLabel,
        locked: Array.from(locked)
      })
    );

  } catch (error) {

    console.warn(
      "localStorage 保存失败",
      error
    );

  }
}


/* =========================
   23. 恢复购物车草稿
   ========================= */

function loadDraft() {

  try {

    const raw =
      localStorage.getItem(
        "choicepilot_draft"
      );

    if (!raw) return;

    const data = JSON.parse(raw);

    if (Array.isArray(data.currentPlan)) {

      currentPlan = data.currentPlan;

    }

    if (data.currentPlanLabel) {

      currentPlanLabel =
        data.currentPlanLabel;

    }

    if (Array.isArray(data.locked)) {

      locked = new Set(data.locked);

    }

  } catch (error) {

    console.warn(
      "localStorage 恢复失败",
      error
    );

  }
}


/* =========================
   24. P0.5 回访
   ========================= */

function renderReturn() {

  const result =
    document.getElementById("returnResult");

  if (!result) return;

  if (returnState.status === "approved") {

    result.innerHTML = `
      <div class="success">

        <strong>
          ✓ 运营审核通过
        </strong>

        <br><br>

        已找到更低价替代商品：

        <br><br>

        <b>
          ${returnState.alternative
            ? returnState.alternative.name
            : "暂无"}
        </b>

        <br>

        ¥${returnState.alternative
          ? returnState.alternative.price
          : "-"}

        <div style="margin-top:12px">

          <button
            class="btn btn-primary"
            onclick="readd()"
          >
            确认重新加购
          </button>

        </div>

      </div>
    `;

    return;
  }

  if (returnState.status === "rejected") {

    result.innerHTML = `
      <div class="danger">
        审核拒绝，当前回访任务终止。
      </div>
    `;

    return;
  }

  result.innerHTML = `
    <div class="panel" style="margin-top:15px">

      <div class="eyebrow small">
        P0.5 SIMULATION
      </div>

      <h3>
        模拟价格回访
      </h3>

      <p style="color:#777;font-size:12px">
        模拟运营审核后触达用户，并允许用户主动确认重新加购。
      </p>

      <div class="actions">

        <button
          class="btn btn-primary"
          onclick="approveReturn()"
        >
          运营审核通过
        </button>

        <button
          class="ghost"
          onclick="rejectReturn()"
        >
          审核拒绝
        </button>

      </div>

    </div>
  `;
}


/* =========================
   25. 发起回访
   ========================= */

function startReturn() {

  if (!currentPlan.length) {

    currentPlan = makePlan(
      currentPlanLabel || "B"
    );

  }

  const targetIndex =
    currentPlan.findIndex(function(item, index) {

      return !locked.has(index);

    });

  if (targetIndex === -1) {

    alert(
      "当前商品全部已锁定，无法发起价格回访。"
    );

    return;
  }

  const deleted =
    currentPlan[targetIndex];

  returnState = {
    status: "review",
    deletedProduct: deleted,
    alternative: null
  };

  currentPlan.splice(targetIndex, 1);

  log(
    "P0.5：用户删除商品并选择「价格太高」：" +
    deleted.name,
    "RETURN"
  );

  const alternatives =
    catalog.filter(function(item) {

      return (
        item.cat === deleted.cat &&
        item.name !== deleted.name &&
        item.price < deleted.price
      );

    });

  if (alternatives.length) {

    returnState.alternative =
      alternatives[0];

    log(
      "P0.5：系统找到同品类低价替代：" +
      alternatives[0].name,
      "RULE"
    );

  } else {

    log(
      "P0.5：没有找到符合条件的低价替代商品",
      "RULE"
    );

  }

  renderReturn();

  show("returnsSection");

  saveDraft();

}


/* =========================
   26. 审核通过
   ========================= */

function approveReturn() {

  if (!returnState.alternative) {

    log(
      "P0.5：没有可用替代商品，无法审核通过",
      "WARN"
    );

    return;
  }

  returnState.status = "approved";

  log(
    "P0.5：运营审核通过，进入模拟触达",
    "OPS"
  );

  log(
    "P0.5：模拟触达完成，等待用户主动确认",
    "MESSAGE"
  );

  renderReturn();
}


/* =========================
   27. 审核拒绝
   ========================= */

function rejectReturn() {

  returnState.status = "rejected";

  log(
    "P0.5：运营审核拒绝，任务终止",
    "OPS"
  );

  renderReturn();
}


/* =========================
   28. 用户重新加购
   ========================= */

function readd() {

  if (!returnState.alternative) {

    return;
  }

  currentPlan.push(
    returnState.alternative
  );

  returnState.status = "readded";

  log(
    "P0.5：用户主动确认重新加购：" +
    returnState.alternative.name,
    "USER"
  );

  const newTotal =
    total(currentPlan);

  log(
    "P0.5：购物车重新校验，总价 " +
    formatMoney(newTotal),
    "SERVER"
  );

  const result =
    document.getElementById("returnResult");

  if (result) {

    result.innerHTML = `
      <div class="success">

        <strong>
          ✓ 用户主动确认重新加购
        </strong>

        <br><br>

        购物车重新校验完成。

        <br>

        当前总价：
        <b>${formatMoney(newTotal)}</b>

        <br><br>

        <span style="opacity:.7">
          模拟流程已完成。
        </span>

      </div>
    `;

  }

  saveDraft();

  renderCart();
}


/* =========================
   29. 价格回访按钮
   ========================= */

const returnButton =
  document.getElementById("btnReturn");

if (returnButton) {

  returnButton.onclick = function() {

    startReturn();

  };

}


/* =========================
   30. 保存草稿按钮
   ========================= */

const saveButton =
  document.getElementById("btnSaveCart");

if (saveButton) {

  saveButton.addEventListener(
    "click",
    function() {

      saveDraft();

      log(
        "购物车草稿已保存到浏览器 localStorage",
        "SYSTEM"
      );

      saveButton.textContent = "✓ 已保存";

      setTimeout(function() {

        saveButton.textContent =
          "保存草稿";

      }, 1600);

    }
  );

}


/* =========================
   31. 页面初始化
   ========================= */

loadDraft();

renderLogs();

updateNeedCard();

renderPlans();

renderCart();

renderReturn();

log(
  "ChoicePilot Demo initialized",
  "SYSTEM"
);
