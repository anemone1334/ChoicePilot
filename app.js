/* =========================================================
   ChoicePilot
   AI Shopping Decision Engine
   Complete Frontend Demo
   ========================================================= */


/* =========================================================
   1. 商品基础数据
   ========================================================= */

const catalog = [
  {
    id: "bag-1",
    cat: "背包",
    name: "轻量城市徒步双肩包",
    price: 329,
    reason: "轻量、防泼水、适合7天出行",
    tags: ["轻便", "防雨"]
  },
  {
    id: "bag-2",
    cat: "背包",
    name: "云野轻旅防水背包",
    price: 259,
    reason: "轻便、防泼水、容量适中",
    tags: ["轻便", "防雨"]
  },

  {
    id: "coat-1",
    cat: "外套",
    name: "城市轻量防晒外套",
    price: 299,
    reason: "防晒、轻量、易收纳",
    tags: ["轻便", "防晒"]
  },
  {
    id: "coat-2",
    cat: "外套",
    name: "轻户外防晒外套",
    price: 199,
    reason: "防晒、轻量、价格友好",
    tags: ["轻便", "防晒"]
  },

  {
    id: "hat-1",
    cat: "帽子",
    name: "折叠防晒遮阳帽",
    price: 99,
    reason: "可折叠、轻便",
    tags: ["轻便", "防晒"]
  },
  {
    id: "hat-2",
    cat: "帽子",
    name: "云南旅拍防晒帽",
    price: 129,
    reason: "防晒、适合旅拍",
    tags: ["轻便", "防晒"]
  },

  {
    id: "rain-1",
    cat: "雨具",
    name: "便携晴雨两用伞",
    price: 79,
    reason: "轻量、晴雨两用",
    tags: ["轻便", "防雨"]
  },
  {
    id: "rain-2",
    cat: "雨具",
    name: "超轻防风雨披",
    price: 89,
    reason: "防雨、收纳小",
    tags: ["轻便", "防雨"]
  }
];


/* =========================================================
   2. 默认需求
   ========================================================= */

const DEFAULT_NEED = {
  budget: 1500,
  destination: "云南",
  duration: "7天",
  scene: "旅行",
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
  originalText: ""
};


/* =========================================================
   3. 当前状态
   ========================================================= */

let userNeed = cloneNeed(DEFAULT_NEED);

let currentPlan = [];

let currentPlanLabel = "B";

let locked = new Set();

let logs = [];

let returnState = {
  status: "idle",
  deletedProduct: null,
  deletedIndex: null,
  alternative: null,
  reason: null
};


/* =========================================================
   4. 工具函数
   ========================================================= */

function cloneNeed(need) {
  return {
    budget: Number(need.budget || 1500),
    destination: need.destination || "",
    duration: need.duration || "",
    scene: need.scene || "",
    categories: Array.isArray(need.categories)
      ? [...need.categories]
      : [],
    hardConstraints: Array.isArray(need.hardConstraints)
      ? [...need.hardConstraints]
      : [],
    existingItems: Array.isArray(need.existingItems)
      ? [...need.existingItems]
      : [],
    originalText: need.originalText || ""
  };
}


function total(items) {
  return items.reduce(function(sum, item) {
    return sum + Number(item.price || 0);
  }, 0);
}


function formatMoney(value) {
  return "¥" + Number(value || 0).toLocaleString("zh-CN");
}


function nowTime() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour12: false
  });
}


function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizeCategory(category) {
  const value = String(category || "").trim();

  if (
    value.includes("帽")
  ) {
    return "帽子";
  }

  if (
    value.includes("雨")
  ) {
    return "雨具";
  }

  if (
    value.includes("背")
  ) {
    return "背包";
  }

  if (
    value.includes("外套") ||
    value.includes("衣")
  ) {
    return "外套";
  }

  return value;
}


function categoryLabel(category) {
  const value = normalizeCategory(category);

  if (value === "帽子") {
    return "防晒帽";
  }

  if (value === "雨具") {
    return "便携雨具";
  }

  return value;
}


/* =========================================================
   5. 日志
   ========================================================= */

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

  logBox.innerHTML = logs
    .slice()
    .reverse()
    .map(function(item) {

      return `
        <div class="event-line">
          <span class="event-time">
            ${escapeHtml(item.time)}
          </span>

          <span class="event-type">
            ${escapeHtml(item.type)}
          </span>

          <span>
            ${escapeHtml(item.message)}
          </span>
        </div>
      `;

    })
    .join("");

  const count = document.getElementById("eventCount");

  if (count) {
    count.textContent = logs.length + " EVENTS";
  }
}


/* =========================================================
   6. 页面导航
   ========================================================= */

function show(id, btn) {

  const sections = document.querySelectorAll(
    "main > section"
  );

  sections.forEach(function(section) {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link")
    .forEach(function(link) {
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


/* =========================================================
   7. 导航点击
   ========================================================= */

document.addEventListener("DOMContentLoaded", function() {

  document.querySelectorAll(".nav-link")
    .forEach(function(link) {

      link.addEventListener("click", function(event) {

        event.preventDefault();

        const targetId =
          link.getAttribute("href").replace("#", "");

        const target =
          document.getElementById(targetId);

        if (!target) return;

        show(targetId, link);

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      });

    });

});


/* =========================================================
   8. 快捷需求
   ========================================================= */

function fillExample(button) {

  const input =
    document.getElementById("needInput");

  if (!input) return;

  const text =
    button.textContent || "";

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

  log(
    "用户选择快捷需求：" + text,
    "INPUT"
  );
}


/* =========================================================
   9. AI 需求解析
   ========================================================= */

function parseNeed() {

  const input =
    document.getElementById("needInput");

  const userText =
    input && input.value.trim()
      ? input.value.trim()
      : "下个月去云南轻旅行7天，预算1500元，需要背包、外套、帽子和便携雨具，要求轻便、防晒防雨。";


  const need = cloneNeed(DEFAULT_NEED);

  need.originalText = userText;


  /* ---------- 预算 ---------- */

  const budgetMatch =
    userText.match(
      /(?:预算|最多|不超过|控制在)\s*(\d+(?:\.\d+)?)\s*(?:元|块|人民币)?/i
    );

  if (budgetMatch) {
    need.budget =
      Number(budgetMatch[1]);
  }


  /* ---------- 天数 ---------- */

  const durationMatch =
    userText.match(
      /(\d+)\s*天/
    );

  if (durationMatch) {
    need.duration =
      durationMatch[1] + "天";
  }


  /* ---------- 目的地 ---------- */

  const destinations = [
    "云南",
    "大理",
    "丽江",
    "昆明",
    "成都",
    "西藏",
    "新疆",
    "海南",
    "三亚",
    "北京",
    "上海",
    "广州",
    "深圳",
    "杭州",
    "重庆",
    "日本",
    "东京",
    "大阪",
    "京都"
  ];

  const foundDestination =
    destinations.find(function(item) {
      return userText.includes(item);
    });

  if (foundDestination) {
    need.destination =
      foundDestination;
  }


  /* ---------- 场景 ---------- */

  if (
    userText.includes("轻旅行") ||
    userText.includes("旅行")
  ) {
    need.scene = "旅行";
  }

  if (
    userText.includes("通勤")
  ) {
    need.scene = "通勤";
  }

  if (
    userText.includes("露营")
  ) {
    need.scene = "露营";
  }

  if (
    userText.includes("登山") ||
    userText.includes("徒步")
  ) {
    need.scene = "户外";
  }


  /* ---------- 购买品类 ---------- */

  const categories = [];

  if (
    userText.includes("背包") ||
    userText.includes("双肩包")
  ) {
    categories.push("背包");
  }

  if (
    userText.includes("外套") ||
    userText.includes("防晒衣")
  ) {
    categories.push("外套");
  }

  if (
    userText.includes("帽子") ||
    userText.includes("防晒帽")
  ) {
    categories.push("防晒帽");
  }

  if (
    userText.includes("雨具") ||
    userText.includes("雨伞") ||
    userText.includes("雨衣") ||
    userText.includes("便携雨具")
  ) {
    categories.push("便携雨具");
  }

  if (categories.length) {
    need.categories = categories;
  }


  /* ---------- 硬条件 ---------- */

  const constraints = [];

  if (
    userText.includes("轻便") ||
    userText.includes("轻量") ||
    userText.includes("轻")
  ) {
    constraints.push("轻便");
  }

  if (
    userText.includes("防晒")
  ) {
    constraints.push("防晒");
  }

  if (
    userText.includes("防雨") ||
    userText.includes("防水")
  ) {
    constraints.push("防雨");
  }


  if (constraints.length) {
    need.hardConstraints =
      [...new Set(constraints)];
  }


  /* ---------- 已有物品 ---------- */

  const existing = [];

  if (
    userText.includes("运动鞋") ||
    userText.includes("鞋我已经有") ||
    userText.includes("鞋子已经有")
  ) {
    existing.push("运动鞋");
  }

  if (
    userText.includes("太阳镜") ||
    userText.includes("墨镜")
  ) {
    existing.push("太阳镜");
  }

  if (existing.length) {
    need.existingItems = existing;
  }


  userNeed = need;

  updateNeedCard();

  log(
    "AI 已解析需求：预算" +
    need.budget +
    "、" +
    need.categories.length +
    "个购买品类、" +
    need.hardConstraints.join(" / "),
    "AI"
  );

  saveDraft();

  return true;
}


/* =========================================================
   10. 需求卡
   ========================================================= */

function updateNeedCard() {

  const panel =
    document.getElementById("reqPanel");

  if (panel) {
    panel.classList.remove("hidden");
  }


  const needCard =
    document.getElementById("needCard");

  if (needCard) {
    needCard.classList.remove("hidden");
  }


  const ncBudget =
    document.getElementById("ncBudget");

  if (ncBudget) {
    ncBudget.textContent =
      formatMoney(userNeed.budget);
  }


  const ncDest =
    document.getElementById("ncDest");

  if (ncDest) {
    ncDest.textContent =
      userNeed.destination || "未指定";
  }


  const ncScene =
    document.getElementById("ncScene");

  if (ncScene) {

    ncScene.textContent =
      userNeed.scene +
      (
        userNeed.duration
          ? " · " + userNeed.duration
          : ""
      );

  }


  renderTagField(
    "ncCats",
    userNeed.categories,
    "categories"
  );


  renderTagField(
    "ncHard",
    userNeed.hardConstraints,
    "hardConstraints"
  );


  renderTagField(
    "ncHave",
    userNeed.existingItems,
    "existingItems"
  );


  const needContent =
    document.getElementById("needContent");

  if (needContent) {

    needContent.textContent =
      JSON.stringify(
        userNeed,
        null,
        2
      );
  }
}


/* =========================================================
   11. 需求卡标签渲染
   ========================================================= */

function renderTagField(
  elementId,
  values,
  field
) {

  const container =
    document.getElementById(elementId);

  if (!container) return;

  const list =
    Array.isArray(values)
      ? values
      : [];


  const html =
    list.map(function(value) {

      return `
        <span
          class="item-tag editable-tag"
        >
          ${escapeHtml(value)}

          <button
            type="button"
            class="tag-remove"
            data-remove-field="${field}"
            data-remove-value="${escapeHtml(value)}"
            aria-label="删除"
          >
            ×
          </button>
        </span>
      `;

    }).join("");


  container.innerHTML =
    html +
    `
      <button
        type="button"
        class="add-tag"
        data-add-field="${field}"
      >
        + 添加
      </button>
    `;
}


/* =========================================================
   12. 编辑需求字段
   ========================================================= */

function editNeedField(field) {

  if (field === "budget") {

    const value =
      prompt(
        "请输入新的预算金额：",
        String(userNeed.budget)
      );

    if (value === null) return;

    const budget =
      Number(value);

    if (
      !Number.isFinite(budget) ||
      budget <= 0
    ) {

      alert("请输入有效的预算金额。");
      return;
    }

    userNeed.budget = budget;
  }


  else if (
    field === "destination"
  ) {

    const value =
      prompt(
        "请输入新的目的地：",
        userNeed.destination
      );

    if (value === null) return;

    if (!value.trim()) {
      alert("目的地不能为空。");
      return;
    }

    userNeed.destination =
      value.trim();
  }


  else if (
    field === "scene"
  ) {

    const value =
      prompt(
        "请输入新的场景：",
        userNeed.scene
      );

    if (value === null) return;

    if (!value.trim()) {
      alert("场景不能为空。");
      return;
    }

    userNeed.scene =
      value.trim();
  }


  updateNeedCard();

  saveDraft();

  log(
    "用户编辑需求字段：" + field,
    "USER"
  );
}


/* =========================================================
   13. 添加 / 删除需求标签
   ========================================================= */

function addNeedTag(field) {

  const placeholder = {
    categories: "例如：背包",
    hardConstraints: "例如：轻便",
    existingItems: "例如：运动鞋"
  };

  const value =
    prompt(
      "请输入要添加的内容：",
      placeholder[field] || ""
    );

  if (value === null) return;

  const text =
    value.trim();

  if (!text) return;


  if (
    !Array.isArray(userNeed[field])
  ) {
    userNeed[field] = [];
  }


  if (
    !userNeed[field].includes(text)
  ) {
    userNeed[field].push(text);
  }


  updateNeedCard();

  saveDraft();

  log(
    "用户新增需求：" + text,
    "USER"
  );
}


function removeNeedTag(
  field,
  value
) {

  if (
    !Array.isArray(userNeed[field])
  ) {
    return;
  }

  userNeed[field] =
    userNeed[field].filter(
      function(item) {
        return item !== value;
      }
    );


  updateNeedCard();

  saveDraft();

  log(
    "用户删除需求：" + value,
    "USER"
  );
}


/* =========================================================
   14. 需求卡编辑按钮事件
   ========================================================= */

document.addEventListener(
  "click",
  function(event) {

    const editButton =
      event.target.closest(
        "[data-edit]"
      );

    if (editButton) {

      const field =
        editButton.getAttribute(
          "data-edit"
        );

      if (
        field === "hardRules"
      ) {
        editNeedField(
          "hardConstraints"
        );
      } else {
        editNeedField(field);
      }

      return;
    }


    const addButton =
      event.target.closest(
        "[data-add-field]"
      );

    if (addButton) {

      addNeedTag(
        addButton.getAttribute(
          "data-add-field"
        )
      );

      return;
    }


    const removeButton =
      event.target.closest(
        "[data-remove-field]"
      );

    if (removeButton) {

      removeNeedTag(
        removeButton.getAttribute(
          "data-remove-field"
        ),
        removeButton.getAttribute(
          "data-remove-value"
        )
      );

      return;
    }
  }
);


/* =========================================================
   15. 硬条件判断
   ========================================================= */

function productMatchesConstraints(
  product,
  constraints
) {

  const rules =
    Array.isArray(constraints)
      ? constraints
      : [];


  return rules.every(
    function(rule) {

      const value =
        String(rule);

      if (
        value.includes("轻")
      ) {
        return product.tags.includes(
          "轻便"
        );
      }

      if (
        value.includes("防晒")
      ) {

        return (
          product.tags.includes("防晒") ||
          product.cat === "背包" ||
          product.cat === "雨具"
        );
      }

      if (
        value.includes("防雨") ||
        value.includes("防水")
      ) {

        return (
          product.tags.includes("防雨")
        );
      }

      return true;
    }
  );
}


/* =========================================================
   16. 获取某品类候选商品
   ========================================================= */

function getCandidatesForCategory(
  category
) {

  const normalized =
    normalizeCategory(category);

  let candidates =
    catalog.filter(
      function(product) {

        return (
          product.cat === normalized
        );
      }
    );


  const strictCandidates =
    candidates.filter(
      function(product) {

        return productMatchesConstraints(
          product,
          userNeed.hardConstraints
        );

      }
    );


  /*
    由于“防晒”并不是背包/雨具必须满足的商品属性，
    所以这里允许使用品类适配规则。
  */

  if (strictCandidates.length) {
    candidates =
      strictCandidates;
  }


  return candidates;
}


/* =========================================================
   17. 生成单套方案
   ========================================================= */

function buildPlanByStrategy(
  strategy
) {

  const result = [];

  const categories =
    Array.isArray(userNeed.categories)
      ? userNeed.categories
      : [];


  categories.forEach(
    function(category) {

      const candidates =
        getCandidatesForCategory(
          category
        );


      if (!candidates.length) {
        return;
      }


      let sorted =
        [...candidates];


      if (strategy === "A") {

        sorted.sort(
          function(a, b) {
            return a.price - b.price;
          }
        );

      }


      else if (strategy === "C") {

        sorted.sort(
          function(a, b) {
            return b.price - a.price;
          }
        );

      }


      else {

        /*
          B：综合平衡
          优先选择中间价格商品
        */

        sorted.sort(
          function(a, b) {

            const avg =
              sorted.reduce(
                function(sum, item) {
                  return sum + item.price;
                },
                0
              ) / sorted.length;

            return (
              Math.abs(a.price - avg) -
              Math.abs(b.price - avg)
            );
          }
        );
      }


      if (sorted[0]) {
        result.push(
          sorted[0]
        );
      }

    }
  );


  return result;
}


/* =========================================================
   18. 三套方案
   ========================================================= */

function makePlan(type) {

  return buildPlanByStrategy(
    type
  );
}


/* =========================================================
   19. 方案描述
   ========================================================= */

function getPlanMeta(label) {

  const data = {

    A: {
      title: "预算节省型",
      desc:
        "优先控制总价，保留核心硬条件。",
      tag: "LOW COST"
    },

    B: {
      title: "综合平衡型",
      desc:
        "预算、体验与功能之间取得平衡。",
      tag: "BALANCED"
    },

    C: {
      title: "体验优先型",
      desc:
        "更重视体验与功能，尽量控制预算。",
      tag: "EXPERIENCE"
    }

  };

  return data[label];
}


/* =========================================================
   20. 方案卡片
   ========================================================= */

function planCard(
  label,
  title,
  items,
  desc
) {

  const amount =
    total(items);

  const remain =
    userNeed.budget - amount;

  const meta =
    getPlanMeta(label);

  const isSelected =
    currentPlanLabel === label;


  return `
    <div
      class="plan
        ${isSelected ? "selected" : ""}
      "
      data-plan="${label}"
    >

      <div class="plan-top">

        <div>

          <div class="eyebrow small">
            PLAN ${label}
          </div>

          <h3>
            ${escapeHtml(title)}
          </h3>

          <div class="muted">
            ${escapeHtml(desc)}
          </div>

        </div>

        <span class="plan-tag">
          ${escapeHtml(meta.tag)}
        </span>

      </div>


      <div class="price">

        ${formatMoney(amount)}

        <small>

          ${
            remain >= 0
              ? "剩余 " + formatMoney(remain)
              : "超预算 " + formatMoney(Math.abs(remain))
          }

        </small>

      </div>


      <div class="plan-products">

        ${
          items.length
            ? items.map(
                function(product) {

                  return `
                    <div class="product">

                      <div>

                        <b>
                          ${escapeHtml(product.name)}
                        </b>

                        <br>

                        <small>

                          ${escapeHtml(product.cat)}
                          ·
                          ${escapeHtml(product.reason)}

                        </small>

                      </div>

                      <div>

                        ¥${product.price}

                      </div>

                    </div>
                  `;

                }
              ).join("")
            : `
              <div class="muted">
                暂无满足当前条件的商品
              </div>
            `
        }

      </div>


      <div class="actions">

        <button
          class="btn btn-primary"
          onclick="usePlan('${label}')"
        >
          ${
            isSelected
              ? "✓ 当前方案"
              : "采用方案"
          }
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   21. 渲染方案
   ========================================================= */

function renderPlans() {

  const area =
    document.getElementById(
      "planArea"
    );

  if (!area) return;


  const A =
    makePlan("A");

  const B =
    makePlan("B");

  const C =
    makePlan("C");


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
      "更重视体验与功能"
    );


  const oldList =
    document.getElementById(
      "plansList"
    );

  if (oldList) {
    oldList.innerHTML = "";
  }
}


/* =========================================================
   22. 生成方案
   ========================================================= */

function generatePlans() {

  /*
    非常重要：
    这里不再调用 parseNeed()。
    
    因为用户已经可以修改需求卡。
    如果这里再次 parseNeed()，
    用户刚刚修改的内容就会被覆盖。
  */


  currentPlanLabel = "B";

  currentPlan =
    makePlan("B");

  locked =
    new Set();


  renderPlans();

  saveDraft();


  const homePlans =
    document.getElementById(
      "homePlans"
    );

  if (homePlans) {

    homePlans.classList.remove(
      "hidden"
    );

    homePlans.innerHTML = `
      <div class="success">

        ✓ 需求已确认，
        AI 已根据当前需求生成
        A / B / C 三套方案。

      </div>
    `;
  }


  log(
    "用户确认需求；规则引擎根据修改后的需求生成 A/B/C 三套方案",
    "RULE"
  );


  show("plansSection");


  const plansSection =
    document.getElementById(
      "plansSection"
    );

  if (plansSection) {

    setTimeout(
      function() {

        plansSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      },
      50
    );

  }
}


/* =========================================================
   23. 方案点击高亮
   ========================================================= */

document.addEventListener(
  "click",
  function(event) {

    const plan =
      event.target.closest(
        ".plan"
      );

    if (!plan) return;


    const label =
      plan.dataset.plan;

    if (!label) return;


    document.querySelectorAll(
      ".plan"
    ).forEach(
      function(item) {

        item.classList.remove(
          "selected"
        );

        item.classList.remove(
          "featured"
        );

      }
    );


    plan.classList.add(
      "selected"
    );


    currentPlanLabel =
      label;


    log(
      "用户查看方案 " +
      label +
      "：" +
      getPlanMeta(label).title,
      "PLAN"
    );

  }
);


/* =========================================================
   24. 采用方案
   ========================================================= */

function usePlan(label) {

  currentPlanLabel =
    label;

  currentPlan =
    makePlan(label);

  locked =
    new Set();


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


  const cartSection =
    document.getElementById(
      "cartSection"
    );

  if (cartSection) {

    setTimeout(
      function() {

        cartSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      },
      50
    );
  }
}


/* =========================================================
   25. 渲染购物车
   ========================================================= */

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!container) return;


  if (!currentPlan.length) {

    currentPlan =
      makePlan(
        currentPlanLabel || "B"
      );
  }


  container.innerHTML =
    currentPlan.map(
      function(product, index) {

        const isLocked =
          locked.has(index);


        return `
          <div class="cartrow">

            <div>

              <b>
                ${escapeHtml(product.name)}
              </b>

              <br>

              <small>
                ${escapeHtml(product.cat)}
                ·
                ${escapeHtml(product.reason)}
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

                ${
                  isLocked
                    ? "🔒 已锁定"
                    : "锁定商品"
                }

              </button>


              <button
                class="ghost
                  ${isLocked ? "hidden" : ""}
                "
                onclick="replaceItem(${index})"
              >
                替换
              </button>

            </div>

          </div>
        `;

      }
    ).join("");


  updateCartSummary();
}


/* =========================================================
   26. 购物车摘要
   ========================================================= */

function updateCartSummary() {

  const amount =
    total(currentPlan);

  const remain =
    userNeed.budget - amount;


  const count =
    document.getElementById(
      "summaryCount"
    );

  const summaryTotal =
    document.getElementById(
      "summaryTotal"
    );

  const summaryRemain =
    document.getElementById(
      "summaryRemain"
    );

  const budgetFill =
    document.getElementById(
      "budgetFill"
    );


  if (count) {
    count.textContent =
      currentPlan.length;
  }


  if (summaryTotal) {
    summaryTotal.textContent =
      formatMoney(amount);
  }


  if (summaryRemain) {

    summaryRemain.textContent =
      formatMoney(
        Math.max(remain, 0)
      );

    summaryRemain.classList.toggle(
      "green-text",
      remain >= 0
    );
  }


  if (budgetFill) {

    const percentage =
      userNeed.budget > 0
        ? Math.min(
            Math.max(
              (
                amount /
                userNeed.budget
              ) * 100,
              0
            ),
            100
          )
        : 100;

    budgetFill.style.width =
      percentage + "%";
  }
}


/* =========================================================
   27. 锁定商品
   ========================================================= */

function toggleLock(index) {

  if (
    locked.has(index)
  ) {

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


/* =========================================================
   28. 替换商品
   ========================================================= */

function replaceItem(index) {

  if (!currentPlan[index]) {
    return;
  }


  if (locked.has(index)) {

    log(
      "替换失败：商品已锁定",
      "WARN"
    );

    return;
  }


  const current =
    currentPlan[index];


  let alternatives =
    catalog.filter(
      function(item) {

        return (
          item.cat === current.cat &&
          item.name !== current.name &&
          productMatchesConstraints(
            item,
            userNeed.hardConstraints
          )
        );

      }
    );


  if (!alternatives.length) {

    alternatives =
      catalog.filter(
        function(item) {

          return (
            item.cat === current.cat &&
            item.name !== current.name
          );

        }
      );
  }


  if (!alternatives.length) {

    log(
      "没有找到可替换商品：" +
      current.cat,
      "WARN"
    );

    return;
  }


  alternatives.sort(
    function(a, b) {
      return a.price - b.price;
    }
  );


  const alternative =
    alternatives[0];


  currentPlan[index] =
    alternative;


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


/* =========================================================
   29. 模拟提交
   ========================================================= */

function submitCart() {

  if (!currentPlan.length) {

    currentPlan =
      makePlan(
        currentPlanLabel || "B"
      );
  }


  const serverTotal =
    total(currentPlan);

  const over =
    serverTotal >
    userNeed.budget;


  const result =
    document.getElementById(
      "submitResult"
    );


  if (result) {

    if (over) {

      result.innerHTML = `
        <div class="danger">

          <strong>
            ⚠ 模拟提交未通过
          </strong>

          <br><br>

          当前总价：
          <b>${formatMoney(serverTotal)}</b>

          <br>

          当前预算：
          <b>${formatMoney(userNeed.budget)}</b>

          <br><br>

          已超过预算，
          可进入价格回访流程。

        </div>
      `;

    } else {

      result.innerHTML = `
        <div class="success">

          <strong>
            ✓ 模拟提交成功
          </strong>

          <br><br>

          服务端重新计算总价：
          <b>${formatMoney(serverTotal)}</b>

          <br>

          剩余预算：
          <b>
            ${formatMoney(
              userNeed.budget -
              serverTotal
            )}
          </b>

          <br><br>

          <span style="opacity:.7">
            当前不代表真实支付、库存、订单或物流。
          </span>

        </div>
      `;
    }
  }


  log(
    over
      ? "后端校验拒绝：购物车超预算"
      : "后端校验通过；模拟提交成功",
    "SERVER"
  );


  saveDraft();


  return {
    status:
      over
        ? "reject"
        : "ok",

    server_total:
      serverTotal,

    remaining:
      userNeed.budget -
      serverTotal,

    over_budget:
      over
  };
}


/* =========================================================
   30. 保存草稿
   ========================================================= */

function saveDraft() {

  try {

    localStorage.setItem(
      "choicepilot_draft",
      JSON.stringify({

        userNeed:
          userNeed,

        currentPlan:
          currentPlan,

        currentPlanLabel:
          currentPlanLabel,

        locked:
          Array.from(locked)

      })
    );

  } catch (error) {

    console.warn(
      "localStorage 保存失败",
      error
    );
  }
}


/* =========================================================
   31. 恢复草稿
   ========================================================= */

function loadDraft() {

  try {

    const raw =
      localStorage.getItem(
        "choicepilot_draft"
      );

    if (!raw) return;


    const data =
      JSON.parse(raw);


    if (data.userNeed) {

      userNeed =
        cloneNeed(
          data.userNeed
        );
    }


    if (
      Array.isArray(
        data.currentPlan
      )
    ) {

      currentPlan =
        data.currentPlan;
    }


    if (data.currentPlanLabel) {

      currentPlanLabel =
        data.currentPlanLabel;
    }


    if (
      Array.isArray(
        data.locked
      )
    ) {

      locked =
        new Set(
          data.locked
        );
    }

  } catch (error) {

    console.warn(
      "localStorage 恢复失败",
      error
    );
  }
}


/* =========================================================
   32. P0.5：渲染价格回访
   ========================================================= */

function renderReturn() {

  const result =
    document.getElementById(
      "returnResult"
    );

  if (!result) return;


  if (
    returnState.status ===
    "approved"
  ) {

    result.innerHTML = `

      <div class="success">

        <strong>
          ✓ 运营审核通过
        </strong>

        <br><br>

        已找到更低价替代商品：

        <br><br>

        <b>
          ${
            returnState.alternative
              ? escapeHtml(
                  returnState.alternative.name
                )
              : "暂无"
          }
        </b>

        <br>

        ${
          returnState.alternative
            ? formatMoney(
                returnState.alternative.price
              )
            : "-"
        }

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


  if (
    returnState.status ===
    "rejected"
  ) {

    result.innerHTML = `
      <div class="danger">

        审核拒绝，
        当前回访任务终止。

      </div>
    `;

    return;
  }


  result.innerHTML = `

    <div
      class="panel"
      style="margin-top:15px"
    >

      <div class="eyebrow small">
        P0.5 SIMULATION
      </div>

      <h3>
        模拟价格回访
      </h3>

      <p style="color:#777;font-size:12px">

        用户明确选择“价格太高”
        后，系统寻找同品类更低价替代，
        再经过运营审核。

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


/* =========================================================
   33. P0.5：发起回访
   ========================================================= */

function startReturn() {

  if (!currentPlan.length) {

    currentPlan =
      makePlan(
        currentPlanLabel || "B"
      );
  }


  /*
    先让用户明确选择原因。
    不再默认认为“删除 = 价格太高”。
  */

  const reason =
    prompt(
      "请选择删除原因：\n\n" +
      "请输入：价格太高\n\n" +
      "如果不是价格原因，请取消。",
      "价格太高"
    );


  if (
    reason === null
  ) {

    log(
      "P0.5：用户取消价格回访",
      "RETURN"
    );

    return;
  }


  if (
    reason.trim() !==
    "价格太高"
  ) {

    alert(
      "当前 P0.5 价格回访仅支持“价格太高”原因。"
    );

    return;
  }


  const targetIndex =
    currentPlan.findIndex(
      function(item, index) {

        return !locked.has(index);

      }
    );


  if (targetIndex === -1) {

    alert(
      "当前商品全部已锁定，无法发起价格回访。"
    );

    return;
  }


  const deleted =
    currentPlan[targetIndex];


  returnState = {

    status:
      "review",

    deletedProduct:
      deleted,

    deletedIndex:
      targetIndex,

    alternative:
      null,

    reason:
      "价格太高"
  };


  /*
    删除当前商品
  */

  currentPlan.splice(
    targetIndex,
    1
  );


  log(
    "P0.5：用户删除商品并明确选择「价格太高」：" +
    deleted.name,
    "RETURN"
  );


  /*
    找同品类更低价商品
  */

  let alternatives =
    catalog.filter(
      function(item) {

        return (

          item.cat ===
          deleted.cat &&

          item.name !==
          deleted.name &&

          item.price <
          deleted.price &&

          productMatchesConstraints(
            item,
            userNeed.hardConstraints
          )

        );

      }
    );


  /*
    如果严格条件下没有，
    再使用同品类低价候选。
  */

  if (!alternatives.length) {

    alternatives =
      catalog.filter(
        function(item) {

          return (

            item.cat ===
            deleted.cat &&

            item.name !==
            deleted.name &&

            item.price <
            deleted.price

          );

        }
      );
  }


  alternatives.sort(
    function(a, b) {
      return a.price - b.price;
    }
  );


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

  renderCart();
}


/* =========================================================
   34. P0.5：审核通过
   ========================================================= */

function approveReturn() {

  if (
    !returnState.alternative
  ) {

    log(
      "P0.5：没有可用替代商品，无法审核通过",
      "WARN"
    );

    return;
  }


  returnState.status =
    "approved";


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


/* =========================================================
   35. P0.5：审核拒绝
   ========================================================= */

function rejectReturn() {

  returnState.status =
    "rejected";


  log(
    "P0.5：运营审核拒绝，任务终止",
    "OPS"
  );


  renderReturn();
}


/* =========================================================
   36. P0.5：重新加购
   ========================================================= */

function readd() {

  if (
    !returnState.alternative
  ) {
    return;
  }


  currentPlan.push(
    returnState.alternative
  );


  returnState.status =
    "readded";


  log(
    "P0.5：用户主动确认重新加购：" +
    returnState.alternative.name,
    "USER"
  );


  const newTotal =
    total(currentPlan);


  const valid =
    newTotal <=
    userNeed.budget;


  log(
    "P0.5：购物车重新校验，总价 " +
    formatMoney(newTotal),
    "SERVER"
  );


  const result =
    document.getElementById(
      "returnResult"
    );


  if (result) {

    result.innerHTML = `

      <div class="${
        valid
          ? "success"
          : "danger"
      }">

        <strong>

          ${
            valid
              ? "✓ 用户主动确认重新加购"
              : "⚠ 重新加购后超出预算"
          }

        </strong>

        <br><br>

        当前总价：
        <b>
          ${formatMoney(newTotal)}
        </b>

        <br>

        当前预算：
        <b>
          ${formatMoney(
            userNeed.budget
          )}
        </b>

        <br><br>

        <span style="opacity:.7">

          已完成重新校验。
          当前仍为模拟流程，
          不代表真实订单。

        </span>

      </div>
    `;
  }


  saveDraft();

  renderCart();
}


/* =========================================================
   37. 页面按钮绑定
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    /*
      最重要的一处：
      开始分析只负责“解析需求”，
      不直接生成方案。
    */

    const parseButton =
      document.getElementById(
        "btnParse"
      );


    if (parseButton) {

      parseButton.onclick =
        function(event) {

          if (event) {
            event.preventDefault();
          }

          parseNeed();

          const needCard =
            document.getElementById(
              "needCard"
            );

          if (needCard) {

            setTimeout(
              function() {

                needCard.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });

              },
              100
            );
          }

        };
    }


    /*
      确认需求
      → 才生成方案
    */

    const confirmButton =
      document.getElementById(
        "btnConfirm"
      );


    if (confirmButton) {

      confirmButton.onclick =
        function(event) {

          if (event) {
            event.preventDefault();
          }

          generatePlans();

        };
    }


    /*
      购物车保存
    */

    const saveButton =
      document.getElementById(
        "btnSaveCart"
      );


    if (saveButton) {

      saveButton.onclick =
        function(event) {

          if (event) {
            event.preventDefault();
          }

          saveDraft();

          log(
            "购物车及当前需求已保存到浏览器 localStorage",
            "SYSTEM"
          );


          const oldText =
            saveButton.textContent;


          saveButton.textContent =
            "✓ 已保存";


          setTimeout(
            function() {

              saveButton.textContent =
                oldText || "保存草稿";

            },
            1600
          );

        };
    }


    /*
      提交按钮
    */

    const submitButton =
      document.getElementById(
        "btnSubmit"
      );


    if (submitButton) {

      submitButton.onclick =
        function(event) {

          if (event) {
            event.preventDefault();
          }

          submitCart();

        };
    }


    /*
      价格回访
    */

    const returnButton =
      document.getElementById(
        "btnReturn"
      );


    if (returnButton) {

      returnButton.onclick =
        function(event) {

          if (event) {
            event.preventDefault();
          }

          startReturn();

        };
    }

  }
);


/* =========================================================
   38. 初始化
   ========================================================= */

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
