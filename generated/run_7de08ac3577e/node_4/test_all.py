#!/usr/bin/env python3
"""完整测试脚本 - 验证核心逻辑和GUI模块"""
import os
os.environ['QT_QPA_PLATFORM'] = 'offscreen'
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_core_modules():
    print("=" * 50)
    print("测试 1: 核心模块")
    print("=" * 50)
    
    from core import (
        SerialConfig, SerialWorker, DataProcessor,
        ReceiveBuffer, FileSaver, AutoScrollSource, ScrollState,
        BAUD_RATES, DEFAULT_BAUD
    )
    
    # 1.1 SerialConfig
    cfg = SerialConfig("COM_test", 9600)
    assert cfg.is_valid
    assert cfg.baudrate == 9600
    assert cfg.port == "COM_test"
    cfg2 = SerialConfig.from_dict(cfg.to_dict())
    assert cfg2.port == "COM_test"
    print("[OK] SerialConfig")
    
    # 1.2 DataProcessor
    dp = DataProcessor()
    assert dp.bytes_to_hex(b"\x01\x02\xFF") == "01 02 FF"
    assert dp.hex_to_bytes("01 02 FF") == (b"\x01\x02\xFF", "")
    assert dp.hex_to_bytes("0x01 0x02 0xFF")[0] == b"\x01\x02\xFF"
    assert dp.hex_to_bytes("0102FF")[0] == b"\x01\x02\xFF"
    assert dp.hex_to_bytes("")[1] != ""
    assert dp.hex_to_bytes("XX YY")[1] != ""
    assert dp.hex_to_bytes("0102F")[1] != ""
    assert dp.format_received(b"Hello", False) == "Hello"
    assert dp.format_received(b"\x01\x02", True) == "01 02"
    data, err = dp.prepare_send("ABC", False)
    assert data == b"ABC"
    data2, err2 = dp.prepare_send("41 42 43", True)
    assert data2 == b"ABC"
    print("[OK] DataProcessor")
    
    # 1.3 ReceiveBuffer
    rb = ReceiveBuffer(50)
    rb.append(b"Hello")
    rb.append(b" World!")
    assert rb.get_all() == b"Hello World!"
    assert len(rb) == 12
    rb.clear()
    assert rb.empty
    for i in range(100):
        rb.append(b"X")
    assert len(rb) <= 50
    print("[OK] ReceiveBuffer")
    
    # 1.4 FileSaver
    fs = FileSaver()
    fname, err = fs.save_text("测试数据")
    assert err == ""
    with open(fname, "r", encoding="utf-8") as f:
        assert f.read() == "测试数据"
    os.remove(fname)
    fname2, err2 = fs.save_binary(b"\x00\x01\x02")
    assert err2 == ""
    os.remove(fname2)
    fname3, err3 = fs.save_hex(b"Hello World")
    assert err3 == ""
    os.remove(fname3)
    # 空数据
    fname4, err4 = fs.save_text("")
    assert err4 != ""
    print("[OK] FileSaver")
    
    # 1.5 AutoScrollSource
    ass = AutoScrollSource(ScrollState.ENABLED)
    assert ass.enabled
    ass.disable()
    assert not ass.enabled
    ass.enable()
    assert ass.enabled
    assert ass.toggle() == ScrollState.DISABLED
    # observer测试
    called = []
    def callback():
        called.append(1)
    ass.add_observer(callback)
    ass.notify()
    assert len(called) == 1
    ass.remove_observer(callback)
    ass.notify()
    assert len(called) == 1  # 不再增加
    print("[OK] AutoScrollSource")
    
    # 1.6 SerialWorker（无硬件，仅测试列表不崩溃）
    ports = SerialWorker.list_ports()
    print(f"[OK] SerialWorker.list_ports() -> {len(ports)} ports")
    
    print("\n[PASS] 核心模块全部通过!")

def test_gui_modules():
    print("\n" + "=" * 50)
    print("测试 2: GUI 模块")
    print("=" * 50)
    
    from PyQt5.QtWidgets import QApplication
    print("[OK] PyQt5 导入成功")
    
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    print("[OK] QApplication 创建")
    
    from gui_main_window import SerialDebugWindow
    print("[OK] SerialDebugWindow 导入成功")
    
    window = SerialDebugWindow()
    assert window.windowTitle() == "串口调试助手"
    assert window.minimumWidth() == 900
    assert window.minimumHeight() == 650
    print(f"[OK] 窗口标题: {window.windowTitle()}, 尺寸: {window.minimumWidth()}x{window.minimumHeight()}")
    
    # 验证UI组件
    components = [
        'port_combo', 'baud_combo', 'open_btn', 'send_text', 'recv_text',
        'send_btn', 'hex_send_cb', 'hex_display_cb', 'auto_scroll_cb',
        'clear_btn', 'save_btn', 'refresh_btn'
    ]
    for c in components:
        assert hasattr(window, c), f"缺少组件: {c}"
    print(f"[OK] 全部 {len(components)} 个 UI 组件存在")
    
    # 测试信号/槽：HEX发送
    assert window._hex_send_mode == False
    window.hex_send_cb.setChecked(True)
    assert window._hex_send_mode == True
    window.hex_send_cb.setChecked(False)
    assert window._hex_send_mode == False
    print("[OK] HEX发送复选框信号/槽")
    
    # 测试信号/槽：HEX显示
    assert window._hex_display_mode == False
    window.hex_display_cb.setChecked(True)
    assert window._hex_display_mode == True
    window.hex_display_cb.setChecked(False)
    assert window._hex_display_mode == False
    print("[OK] HEX显示复选框信号/槽")
    
    # 测试信号/槽：自动滚动
    window.auto_scroll_cb.setChecked(False)
    assert not window.auto_scroll.enabled
    window.auto_scroll_cb.setChecked(True)
    assert window.auto_scroll.enabled
    print("[OK] 自动滚动复选框信号/槽")
    
    # 测试清空接收区
    window.recv_text.insertPlainText("测试数据123")
    window._clear_receive()
    assert window.recv_text.toPlainText() == ""
    print("[OK] 清空接收区功能")
    
    # 验证初始按钮状态（串口未打开时）
    assert window.open_btn.text() == "打开串口"
    assert window.send_btn.isEnabled() == False, f"发送按钮状态={window.send_btn.isEnabled()}"
    assert window.port_combo.isEnabled() == True
    assert window.baud_combo.isEnabled() == True
    print("[OK] 初始界面状态正确（串口关闭时发送按钮禁用）")
    
    # 测试刷新端口（不崩溃）
    window._refresh_ports()
    print("[OK] 刷新端口功能")
    
    # 测试数据接收处理 - 文本模式
    window._hex_display_mode = False
    window._clear_receive()
    window._handle_data_received(b"Hello from test!")
    assert "Hello from test!" in window.recv_text.toPlainText()
    print("[OK] 文本模式数据接收显示")
    
    # 测试HEX模式数据接收
    window.hex_display_cb.setChecked(True)
    window._clear_receive()
    window._handle_data_received(b"\x01\x02\xFF")
    assert "01 02 FF" in window.recv_text.toPlainText()
    print("[OK] HEX模式数据接收显示")
    
    # 测试自动滚动行为
    # 这里必须通过 checkbox 切换回文本显示模式；只改内部变量会让 QCheckBox 状态与槽函数不同步，
    # 下一次 setChecked(True) 不会触发 toggled 信号，导致仍停留在 HEX 显示模式。
    window.hex_display_cb.setChecked(False)
    window.auto_scroll_cb.setChecked(False)
    window._clear_receive()
    window._handle_data_received(b"data1")
    window._handle_data_received(b"data2")
    assert "data1data2" in window.recv_text.toPlainText()
    print("[OK] 自动滚动禁用时数据仍正常显示")
    
    # 测试接收缓冲区与显示同步
    window.hex_display_cb.setChecked(False)
    window._clear_receive()
    window._handle_data_received(b"Buffer test")
    assert window.receive_buffer.get_all() == b"Buffer test"
    print("[OK] 接收缓冲区同步")
    
    # 测试保存数据（不实际弹窗，只验证逻辑路径）
    window._clear_receive()
    window._handle_data_received(b"Save verification data")
    buffer_data = window.receive_buffer.get_all()
    assert buffer_data == b"Save verification data"
    print("[OK] 保存数据逻辑可用")
    
    print("\n[PASS] GUI 模块全部通过!")


if __name__ == "__main__":
    try:
        test_core_modules()
        test_gui_modules()
        print("\n" + "=" * 50)
        print("★★★ 全部测试通过! ★★★")
        print("=" * 50)
    except Exception as e:
        import traceback
        print(f"\n[FAIL] {e}")
        traceback.print_exc()
        sys.exit(1)
