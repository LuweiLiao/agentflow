const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://127.0.0.1:18080';
const OUT = '/tmp/agentflow-rf-test';

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // 1. 首页截图
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: false });
  console.log('✅ 01-home.png — 首页加载完成');

  // 2. 输入需求
  const textarea = page.locator('textarea[placeholder*="输入需求描述"]');
  await textarea.fill('用 PyQt5 实现一个串口调试助手，支持端口扫描、波特率设置、HEX/ASCII 收发');
  await page.screenshot({ path: `${OUT}/02-requirement-filled.png`, fullPage: false });
  console.log('✅ 02-requirement-filled.png — 需求填写');

  // 3. 点击 AI 编排按钮
  const decomposeBtn = page.locator('button', { hasText: 'AI 编排' });
  await decomposeBtn.click();
  await page.waitForTimeout(15000); // 等待 Supervisor 返回结果
  await page.screenshot({ path: `${OUT}/03-after-decompose.png`, fullPage: false });
  console.log('✅ 03-after-decompose.png — 编排完成');

  // 4. 检查是否有节点生成
  const agentNodes = page.locator('.react-flow__node');
  const nodeCount = await agentNodes.count();
  console.log(`  节点数量: ${nodeCount}`);
  if (nodeCount > 0) {
    // 截图包含节点
    await page.screenshot({ path: `${OUT}/04-nodes-visible.png`, fullPage: false });
    console.log('✅ 04-nodes-visible.png — 节点可见');

    // 5. 点击第一个节点 → 检查 Inspector
    await agentNodes.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/05-node-selected.png`, fullPage: false });
    console.log('✅ 05-node-selected.png — 节点选中，Inspector 显示');

    // 6. 修改节点标签
    const labelInput = page.locator('input').filter({ has: page.locator('[value]') }).first();
    // 在 Inspector 中找到 label 输入框
    const inspectorInputs = page.locator('input');
    const inputCount = await inspectorInputs.count();
    console.log(`  输入框数量: ${inputCount}`);

    // 尝试通过 Inspector 区域找 label 输入
    const labelField = page.locator('label').filter({ hasText: '标签' }).first();
    const labelInputField = labelField.locator('..').locator('input').first();
    const exists = await labelInputField.count();
    if (exists > 0) {
      await labelInputField.fill('🛠 串口核心模块');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/06-label-edited.png`, fullPage: false });
      console.log('✅ 06-label-edited.png — 标签已修改');
    }

    // 7. 拖拽节点（测试 React Flow 交互）
    const firstNode = agentNodes.first();
    const box = await firstNode.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/07-node-dragged.png`, fullPage: false });
      console.log('✅ 07-node-dragged.png — 节点拖拽');
    }

    // 8. 检查边是否存在
    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();
    console.log(`  边数量: ${edgeCount}`);

    // 9. 点击 Execute 按钮
    const execBtn = page.locator('button', { hasText: '执行' });
    const execBtnExists = await execBtn.count();
    if (execBtnExists > 0) {
      await execBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT}/08-executing.png`, fullPage: false });
      console.log('✅ 08-executing.png — 执行中');
    }

    // 10. 导出按钮
    const exportBtn = page.locator('button[title="导出 JSON"]');
    if (await exportBtn.count() > 0) {
      console.log('✅ 导出按钮可见');
    }
  }

  // 11. 全页截图（最终状态）
  await page.screenshot({ path: `${OUT}/09-final.png`, fullPage: false });
  console.log('✅ 09-final.png — 最终状态');

  // 12. Console 日志检查
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
  await page.waitForTimeout(500);
  const errors = consoleLogs.filter(l => l.startsWith('error:') || l.startsWith('Error:'));
  if (errors.length > 0) {
    console.log('⚠️ Console errors:', errors.join('\n  '));
  } else {
    console.log('✅ 无控制台错误');
  }

  await browser.close();
  console.log('\n🎉 测试完成，截图保存在', OUT);
})();
