#!/usr/bin/env python3
import json

with open('/home/llw/agentflow/frontend/code-audit-round4.json', 'r') as f:
    r4 = json.loads(f.read())

visual = []

def add(pid, sev, cat, title, desc, fix, src):
    visual.append({
        'id': pid, 'severity': sev, 'category': cat,
        'title': title, 'description': desc,
        'fix_suggestion': fix, 'source': src
    })

# LAYOUT (11)
add('V-001','P1','布局','节点X偏差22px',
   '节点translate X:170.9/189.3/171.9px, 节点2比1/3偏右18px',
   'autolayout统一X坐标','3-node DOM measurement')
add('V-002','P2','布局','Toolbar高度5种不一致',
   '输入框35px AI37px 下拉34px 工具32px 执行35px',
   '统一34px','Blank annotations')
add('V-003','P2','布局','Toolbar Y基线偏移',
   'input@y=9 AI@y=8 dropdown@y=10 mini@y=11',
   'align-items:center','Blank annotations')
add('V-004','P2','布局','Toolbar间距无规范',
   '间距4/8/17px交替无规律',
   '组内8px 组间16px','Blank annotations')
add('V-005','P2','布局','Inspector与模块库宽度不匹配',
   '模块库199px vs Inspector 249px',
   '统一240px','Inspector')
add('V-006','P3','布局','Inspector padding不对称',
   'Label输入框239px 面板约280px padding~20px',
   '统一12px','Inspector')
add('V-007','P1','布局','删除按钮需滚动',
   '按钮y=558 面板底y~580',
   'sticky bottom固定','Inspector')
add('V-008','P2','布局','进化面板未居中',
   'x=837开始 中心约640',
   'transform(-50%,-50%)','Evolution')
add('V-009','P1','布局','进化面板与Inspector重叠',
   '面板837-1263 vs Inspector 1015-1264 重叠248px',
   '独立modal不覆盖','Evolution')
add('V-010','P2','布局','进化面板195px空白',
   '标签y=154到按钮y=349全白',
   '填充历史数据/引导','Evolution')
add('V-011','P3','布局','版权文字与日志间距紧',
   '版权y=589 日志y=602 仅13px',
   '增加padding','Screen')

# COLOR/VISUAL (8)
add('V-012','P2','视觉','节点边框全灰不标色',
   '3节点border全#e8edf5 仅左侧4px色条',
   'border用profile色(透明0.35)','3-node')
add('V-013','P1','视觉','角色按钮选中态不可辨',
   '选中fg/bg亮度均~145 难区分选中/非选中',
   '选中白字#fff+彩色bg','Inspector')
add('V-014','P2','视觉','日志过滤按钮高19px',
   '低于标准触摸44/48px',
   '提升至28-32px','Log panel')
add('V-015','P2','视觉','过滤按钮标签错误',
   '文字"信息4"应为"全部/信息/警告/错误"',
   '修正标签','Prev session')
add('V-016','P3','视觉','日志12小时制',
   '显示1:35:02 AM应为13:35:02',
   '改为24h HH:MM:SS','Prev session')
add('V-017','P3','视觉','emoji渲染不一致',
   'emoji各平台渲染高度不同',
   '换SVG图标','Module library')
add('V-018','P2','视觉','节点无外层阴影',
   '内层card有shadow 外层RF节点无',
   '外层节点加box-shadow','3-node')
add('V-019','P2','视觉','Zoom文字10px',
   '缩放指示仅10px',
   '至少12px','Screen')

# INTERACTION (10)
add('V-020','P1','交互','AI编排按钮始终禁用',
   '3节点已创建仍disabled',
   '节点>=3或字数>=10启用','3-node')
add('V-021','P1','交互','执行按钮始终禁用',
   '3节点就绪仍disabled',
   '节点>0且依赖满足启用','3-node')
add('V-022','P2','交互','撤销空栈可点击',
   '边界条件需验证',
   '确认handleUndo边界','3-node')
add('V-023','P2','交互','自动布局始终禁用',
   '3节点仍disabled',
   '节点>=2启用','3-node')
add('V-024','P1','交互','画布无空状态引导',
   '空白画布无任何文字提示',
   '拖拽模块到画布开始 叠层','Blank')
add('V-025','P2','交互','进化面板内容空洞',
   '内容区仅有执行分析按钮 无数据',
   '添加历史/引导说明','Evolution')
add('V-026','P3','交互','无Ctrl+Enter',
   '无法键盘执行工作流',
   'Ctrl/Cmd+Enter绑定','Interaction')
add('V-027','P2','交互','拖拽位置不可撤销',
   '拖动后Ctrl+Z不恢复',
   'onNodeDragStop pushUndo','Code logic')
add('V-028','P2','交互','Inspector无未保存指示',
   '编辑后无任何视觉反馈',
   '边框变色/已修改标记','Inspector')
add('V-029','P3','交互','无批量操作',
   '不能多选批量删除移动',
   'RF多选+批量操作','Interaction')

# CODE QUALITY (10)
add('V-030','P1','代码质量','模块单点击不工作',
   '只有onDoubleClick触发生成',
   'onClick(onAdd) 已修复','R4-001')
add('V-031','P1','代码质量','撤销读取过期闭包',
   '快速双按撤销丢失层级',
   'functional updater','R4-002/003')
add('V-032','P2','代码质量','debounce提交旧值',
   'onBlur使用闭包旧值',
   'ref跟踪最新值','R4-004')
add('V-033','P2','代码质量','切换节点丢编辑',
   '未触发debounce的编辑被丢弃',
   '切换前commit','R4-005')
add('V-034','P3','代码质量','SSE重连定时器残留',
   'setTimeout在abort时未清理',
   'cleanup clearTimeout','R4-007')
add('V-035','P2','代码质量','删除确认定时器未重置',
   '切换节点定时器持续运行',
   'switch时reset','R4-006')
add('V-036','P2','代码质量','fetch无超时',
   '后端挂起UI死锁',
   'AbortController','R4-010')
add('V-037','P2','代码质量','导入允许null',
   'zod验证不够严格',
   '非空数组校验','R4-011')
add('V-038','P3','代码质量','log在state前发出',
   '显示过时信息',
   '先commit再log','R4-013')
add('V-039','P3','代码质量','双击非幂等',
   '快速双击添加多节点',
   'isAddingRef锁定','Live test')

# ACCESSIBILITY (4)
add('V-040','P2','无障碍','状态仅颜色区分',
   '色盲用户无法区分状态',
   '图标+文字+颜色三重','A11Y')
add('V-041','P3','无障碍','日志aria-live全播报',
   '每次新日志播报全列表',
   'aria-live=off','Code review')
add('V-042','P3','无障碍','输入框无aria-describedby',
   'Label输入框缺无障碍关联',
   '添加aria-describedby','Inspector')
add('V-043','P2','无障碍','Tab到不了画布节点',
   '键盘用户无法编辑',
   'keyboard focus','A11Y')

# PERFORMANCE (4)
add('V-044','P2','性能','Inspector重建对象',
   '每次渲染重建props',
   'useMemo','Code logic')
add('V-045','P2','性能','日志无虚拟化',
   '200+DOM全渲染',
   'react-window','Log panel')
add('V-046','P3','性能','hover触发重排',
   'CSS transition改布局属性',
   'will-change+transform','BlockLibrary')
add('V-047','P2','性能','内联样式vs React冲突',
   'onMouseEnter改el.style',
   'CSS class替换','BlockLibrary')

# RESPONSIVE (2)
add('V-048','P3','响应式','1280px以下不处理',
   '固定总宽480px挤压画布',
   'min-width breakpoint','Layout')
add('V-049','P2','响应式','日志展开canvas缩17%',
   'canvas h=521->433',
   'max-height+滚动','Log panel')

# STABILITY (5)
add('V-050','P1','稳定性','刷新丢失所有状态',
   '仅内存保存 刷新即失',
   'localStorage持久化','Persistence')
add('V-051','P2','稳定性','导出可能未捕获异常',
   'console有exception',
   'try/catch+用户提示','Prev session')
add('V-052','P2','稳定性','evolve静默无操作',
   'runId=null时无反应',
   '早期return+日志','R4-026')
add('V-053','P3','稳定性','空catch吞解析错误',
   'SSE JSON.parse错被吞',
   '记录错误+重试','R4-009')
add('V-054','P3','稳定性','边ID可能冲突',
   '时间戳边ID快速创建碰撞',
   'UUID','R4-022')

# ENHANCEMENT (2)
add('V-055','P3','增强','节点不可左右连接',
   '仅垂直排列无法DAG拓扑',
   '自由拖拽+自动连线','3-node')
add('V-056','P2','增强','示例不自动填充',
   '选示例后需求框仍空',
   '自动填充需求框','Blank')

# Stats
by_sev = {}
by_cat = {}
for v in visual:
    by_sev[v['severity']] = by_sev.get(v['severity'], 0) + 1
    by_cat[v['category']] = by_cat.get(v['category'], 0) + 1

report = {
    "summary": "AgentFlow 视觉+代码综合审计 R4",
    "total_visual": len(visual),
    "total_code": len(r4),
    "grand_total": len(visual) + len(r4),
    "severity_distribution": by_sev,
    "category_distribution": by_cat,
    "visual_findings": visual,
    "code_findings": r4
}

with open('/home/llw/agentflow/frontend/comprehensive-audit-r4.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print(f"=== 综合审计 R4 ===")
print(f"视觉发现: {len(visual)}")
print(f"代码发现: {len(r4)}")
print(f"总计: {report['grand_total']}")
print(f"\n严重度分布:")
for k in ['P0','P1','P2','P3']:
    if k in by_sev:
        print(f"  {k}: {by_sev[k]}")
print(f"\n类别分布:")
for k,v in sorted(by_cat.items()):
    print(f"  {k}: {v}")
print(f"\n=== P0/P1 严重问题 ===")
for v in visual:
    if v['severity'] in ('P0','P1'):
        print(f"  [{v['severity']}] {v['title']}")
