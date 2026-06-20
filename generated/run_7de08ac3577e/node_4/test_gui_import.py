"""测试 GUI 模块能否正确导入"""
import sys
import os

# 确保当前目录在路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("测试 1: 核心模块导入")
print("=" * 50)
from core import (
    SerialConfig, SerialWorker, DataProcessor,
    ReceiveBuffer, FileSaver, AutoScrollSource, ScrollState,
    BAUD_RATES, DEFAULT_BAUD
)
print("[OK] 核心模块导入成功")

print("\n" + "=" * 50)
print("测试 2: 核心功能验证 (无串口环境)")
print("=" * 50)

# 2.1 SerialConfig
cfg = SerialConfig("COM_test", 9600)
assert cfg.is_valid
assert cfg.baudrate == 9600
assert cfg.to_dict()["port"] == "COM_test"
cfg2 = SerialConfig.from_dict(cfg.to_dict())
assert cfg2.port == "COM_test"
print("[OK] SerialConfig 创建/序列化/反序列化")

# 2.2 DataProcessor
dp = DataProcessor()
assert dp.bytes_to_hex(b"\x01\x02\xFF") == "01 02 FF"
assert dp.hex_to_bytes("01 02 FF") == (b"\x01\x02\xFF", "")
assert dp.hex_to_bytes("0x01 0x02 0xFF")[0] == b"\x01\x02\xFF"
# 空输入
assert dp.hex_to_bytes("")[1] != "" 
# 无效HEX
assert dp.hex_to_bytes("XX YY")[1] != ""
# 连续HEX
assert dp.hex_to_bytes("0102FF")[0] == b"\x01\x02\xFF"
# 奇数长度
assert dp.hex_to_bytes("0102F")[1] != ""
print("[OK] DataProcessor HEX编解码")

# 2.3 格式化接收
text = dp.format_received(b"Hello", hex_mode=False)
assert text == "Hello"
hex_text = dp.format_received(b"\x01\x02", hex_mode=True)
assert hex_text == "01 02"
print("[OK] DataProcessor 接收格式化")

# 2.4 准备发送
data, err = dp.prepare_send("ABC", hex_mode=False)
assert data == b"ABC"
assert err == ""
data2, err2 = dp.prepare_send("41 42 43", hex_mode=True)
assert data2 == b"ABC", f"Got: {data2}"
assert err2 == ""
print("[OK] DataProcessor 发送准备")

# 2.5 ReceiveBuffer
rb = ReceiveBuffer(50)
rb.append(b"Hello")
rb.append(b" World!")
assert rb.get_all() == b"Hello World!"
assert len(rb) == 12
# 环形裁剪
for i in range(100):
    rb.append(b"X")
assert len(rb) <= 50
print("[OK] ReceiveBuffer 环形缓冲区")

# 2.6 FileSaver
fs = FileSaver()
fname, err = fs.save_text("测试数据 content")
assert err == "", f"Err: {err}"
with open(fname, "r", encoding="utf-8") as f:
    assert f.read() == "测试数据 content"
os.remove(fname)
print("[OK] FileSaver 文本保存")

# 2.7 二进制保存
fname2, err2 = fs.save_binary(b"\x00\x01\x02")
assert err2 == ""
os.remove(fname2)
print("[OK] FileSaver 二进制保存")

# 2.8 HEX保存
fname3, err3 = fs.save_hex(b"Hello World")
assert err3 == ""
os.remove(fname3)
print("[OK] FileSaver HEX保存")

# 2.9 AutoScrollSource
ass = AutoScrollSource(ScrollState.ENABLED)
assert ass.enabled
ass.disable()
assert not ass.enabled
ass.enable()
assert ass.enabled
assert ass.toggle() == ScrollState.DISABLED
print("[OK] AutoScrollSource 自动滚动控制")

# 2.10 SerialWorker 列表端口（无pyserial或端口时不应崩溃）
ports = SerialWorker.list_ports()
print(f"[OK] SerialWorker.list_ports() 返回 {len(ports)} 个端口 (实际或空列表)")

print("\n" + "=" * 50)
print("测试 3: GUI 模块导入测试 (无显示器环境)")
print("=" * 50)

# 使用 Agg 后端避免需要显示器
import matplotlib
matplotlib.use('Agg')

try:
    # 测试导入
    from PyQt5.QtWidgets import QApplication
    from PyQt5.QtCore import Qt
    print("[OK] PyQt5 导入成功")
    
    # 测试在没有显示的情况下创建QApplication（需要设置QT_QPA_PLATFORM）
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    print("[OK] QApplication 创建成功 (offscreen模式)")
    
    # 测试导入主窗口模块
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from gui_main_window import SerialDebugWindow
    print("[OK] SerialDebugWindow 导入成功")
    
    # 测试创建窗口
    window = SerialDebugWindow()
    assert window.windowTitle() == "串口调试助手"
    assert window.minimumWidth() == 900
    assert window.minimumHeight() == 650
    print("[OK] SerialDebugWindow 创建成功")
    
    # 测试UI组件存在
    assert hasattr(window, 'port_combo'), "缺少 port_combo"
    assert hasattr(window, 'baud_combo'), "缺少 baud_combo"
    assert hasattr(window, 'open_btn'), "缺少 open_btn"
    assert hasattr(window, 'send_text'), "缺少 send_text"
    assert hasattr(window, 'recv_text'), "缺少 recv_text"
    assert hasattr(window, 'send_btn'), "缺少 send_btn"
    assert hasattr(window, 'hex_send_cb'), "缺少 hex_send_cb"
    assert hasattr(window, 'hex_display_cb'), "缺少 hex_display_cb"
    assert hasattr(window, 'auto_scroll_cb'), "缺少 auto_scroll_cb"
    assert hasattr(window, 'clear_btn'), "缺少 clear_btn"
    assert hasattr(window, 'save_btn'), "缺少 save_btn"
    assert hasattr(window, 'refresh_btn'), "缺少 refresh_btn"
    print("[OK] 所有 UI 组件存在")
    
    # 测试信号/槽 - 切换HEX发送模式
    assert window._hex_send_mode == False
    window.hex_send_cb.setChecked(True)
    assert window._hex_send_mode == True
    window.hex_send_cb.setChecked(False)
    assert window._hex_send_mode == False
    print("[OK] HEX发送模式切换信号/槽")
    
    # 测试自动滚动切换
    window.auto_scroll_cb.setChecked(False)
    assert not window.auto_scroll.enabled
    window.auto_scroll_cb.setChecked(True)
    assert window.auto_scroll.enabled
    print("[OK] 自动滚动切换信号/槽")
    
    print("\n" + "=" * 50)
    print("所有测试通过！")
    print("=" * 50)
    
except Exception as e:
    import traceback
    print(f"[FAIL] 测试失败: {e}")
    traceback.print_exc()
    sys.exit(1)
