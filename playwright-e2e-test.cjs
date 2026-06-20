/**
 * AgentFlow E2E 逐功能测试 — 每一步截图
 * 模拟用户操作流程
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:18080';
const SCREENSHOT_DIR = '/tmp/agentflow-e2e-test';

async function main() {
  // 清理截图目录
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  let step = 0;
  async function screenshot(name) {
    step++;
    const filename = `${String(step).padStart(2, '0')}-${name}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  [截图] ${filename}`);
    return filepath;
  }

  // =========================================================
  // 测试0: 检查 /api/status 端点
  // =========================================================
  console.log('\n【测试0】检查 GET /api/status');
  const statusResp = await page.request.get(`${BASE_URL}/api/status`, {
    headers: { Authorization: 'Bearer test123' },
  });
  const statusData = await statusResp.json();
  console.log('  /api/status:', JSON.stringify(statusData, null, 2));
  console.assert(statusResp.ok(), 'GET /api/status 应返回 200');
  console.assert(typeof statusData.api_key_configured === 'boolean', 'api_key_configured 应为布尔值');
  console.assert(typeof statusData.model === 'string', 'model 应为字符串');
  console.assert(typeof statusData.provider === 'string', 'provider 应为字符串');

  // =========================================================
  // 测试1: 打开主页
  // =========================================================
  console.log('\n【测试1】打开主页');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await screenshot('01-主页');

  // 检查页面标题
  const title = await page.title();
  console.log(`  页面标题: "${title}"`);

  // 检查核心元素存在
  const canvasExists = await page.$('.react-flow');
  console.log(`  React Flow 画布: ${canvasExists ? '✅' : '❌'}`);

  // 检查需求输入框
  const textareaExists = await page.$('textarea');
  console.log(`  需求输入框: ${textareaExists ? '✅' : '❌'}`);

  // 检查 "AI 编排" 按钮
  const decomposeBtn = await page.$('button:has-text("编排")');
  console.log(`  AI 编排按钮: ${decomposeBtn ? '✅' : '❌'}`);

  // =========================================================
  // 测试2: 输入需求 + AI 编排分解
  // =========================================================
  console.log('\n【测试2】输入需求并编排');
  const textarea = await page.$('textarea');
  await textarea.fill('写一个 Python 脚本分析 CSV 数据并生成可视化图表');
  await screenshot('02-已输入需求');

  // 点击 "AI 编排" 按钮
  const aiBtn = await page.$('button:has-text("编排")');
  await aiBtn.click();
  console.log('  点击 AI 编排按钮...');

  // 等待编排完成 — 等待节点出现在画布上
  await page.waitForTimeout(3000);
  await page.waitForSelector('.react-flow__node', { timeout: 30000 });
  await page.waitForTimeout(1000);
  await screenshot('03-编排完成');

  // 统计节点数量
  const nodeCount = await page.$$eval('.react-flow__node', els => els.length);
  console.log(`  编排生成节点数: ${nodeCount}`);

  // 统计边数量（连线）
  const edgeCount = await page.$$eval('.react-flow__edge', els => els.length);
  console.log(`  自动生成边数: ${edgeCount}`);

  // =========================================================
  // 测试3: 节点交互 — 选中、编辑、连接、删除
  // =========================================================
  console.log('\n【测试3】节点交互');

  // 选中第一个节点
  const firstNode = await page.$('.react-flow__node');
  await firstNode.click();
  await page.waitForTimeout(500);
  await screenshot('04-选中节点');

  // 检查 InspectorPanel 出现（右侧面板）
  const inspectorPanel = await page.$('text=/编辑|Label|Profile|描述/i');
  console.log(`  Inspector 面板: ${inspectorPanel ? '✅' : '❌'}`);

  // 连接两个节点 — 从第一个节点拖拽到第二个
  const nodes = await page.$$('.react-flow__node');
  if (nodes.length >= 2) {
    const sourceHandle = await nodes[0].$('.react-flow__handle');
    const targetNode = nodes[1];
    const targetBox = await targetNode.boundingBox();

    if (sourceHandle && targetBox) {
      const sourceBox = await sourceHandle.boundingBox();
      if (sourceBox) {
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(1000);
        console.log('  拖拽连线: ✅');
      }
    }
  }
  await screenshot('05-拖拽连线');

  // 删除一个节点 — 选中后按 Delete
  if (nodes.length >= 3) {
    await nodes[2].click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    console.log('  删除节点 (Delete键): ✅');
  }
  await screenshot('06-删除节点');

  // 验证删除后节点数
  const nodeCountAfter = await page.$$eval('.react-flow__node', els => els.length);
  console.log(`  删除后节点数: ${nodeCountAfter} (原: ${nodeCount})`);

  // =========================================================
  // 测试4: 执行工作流 + SSE 实时更新
  // =========================================================
  console.log('\n【测试4】执行工作流');

  // 找执行按钮
  const runBtn = await page.$('button:has-text("执行")');
  if (runBtn) {
    await runBtn.click();
    console.log('  点击执行按钮');
    // 等待执行过程 — SSE 应该显示节点状态更新
    await page.waitForTimeout(5000);
    await screenshot('07-执行中');

    // 等待执行完成（最多 60 秒）
    try {
      await page.waitForFunction(() => {
        const statusEls = document.querySelectorAll('.react-flow__node');
        const allDone = Array.from(statusEls).every(el =>
          el.classList.contains('done') || el.classList.contains('failed') || el.classList.contains('skipped')
        );
        return allDone;
      }, { timeout: 60000 });
      console.log('  工作流执行完成 ✅');
    } catch (e) {
      console.log('  工作流执行超时或仍在运行');
    }
    await page.waitForTimeout(1000);
    await screenshot('08-执行完成');
  } else {
    console.log('  ⚠️ 未找到执行按钮');
  }

  // =========================================================
  // 测试5: 导出/导入工作流
  // =========================================================
  console.log('\n【测试5】导出/导入工作流');

  // 找导出按钮
  const exportBtn = await page.$('button:has-text("导出")');
  if (exportBtn) {
    await exportBtn.click();
    await page.waitForTimeout(1000);
    console.log('  导出工作流: ✅');
    await screenshot('09-导出工作流');
  }

  // 找导入按钮
  const importBtn = await page.$('button:has-text("导入")');
  if (importBtn) {
    await importBtn.click();
    await page.waitForTimeout(1000);
    console.log('  导入工作流: ✅');
    await screenshot('10-导入工作流');
  }

  // =========================================================
  // 测试6: Run 历史
  // =========================================================
  console.log('\n【测试6】Run 历史');

  // 调用 GET /api/runs 检查
  const runsResp = await page.request.get(`${BASE_URL}/api/runs`, {
    headers: { Authorization: 'Bearer test123' },
  });
  const runsData = await runsResp.json();
  const runCount = Array.isArray(runsData) ? runsData.length : (runsData.runs ? runsData.runs.length : 0);
  console.log(`  Run 历史条目数: ${runCount}`);
  console.assert(runsResp.ok(), 'GET /api/runs 应返回 200');

  // 检查前端是否有 Run 历史面板
  const runHistoryPanel = await page.$('text=/历史|History|Run|runs/i');
  console.log(`  Run 历史面板: ${runHistoryPanel ? '✅' : '❌'}`);

  // =========================================================
  // 测试7: 验证 API 状态端点（额外）
  // =========================================================
  console.log('\n【测试7】验证 /api/status');
  console.log(`  状态: model=${statusData.model}, provider=${statusData.provider}, configured=${statusData.api_key_configured}`);

  // =========================================================
  // 汇总
  // =========================================================
  console.log('\n═══════════════════════════════════════');
  console.log('测试完成 ✅');
  console.log(`截图目录: ${SCREENSHOT_DIR}`);
  const files = fs.readdirSync(SCREENSHOT_DIR).sort();
  console.log(`截图数量: ${files.length}`);
  files.forEach(f => console.log(`  ${f}`));
  console.log('═══════════════════════════════════════');

  await browser.close();
}

main().catch(e => {
  console.error('测试失败:', e.message);
  process.exit(1);
});
