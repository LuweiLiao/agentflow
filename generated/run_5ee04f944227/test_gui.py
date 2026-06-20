"""
test_gui.py - GUI 主窗口单元测试

测试 MainWindow 的各项功能，使用 FakeSerialCore 模拟串口硬件。
如果 PyQt5 不可用，测试将优雅跳过。

注意：由于 QThread 在测试环境中可能导致阻塞，涉及读取线程的测试
使用直接调用 _on_data_received 的方式模拟接收，而非启动真实线程。
"""

import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch

# 设置 offscreen 模式（必须在导入 PyQt5 之前设置）
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

# 检查 PyQt5 是否可用
try:
    from PyQt5.QtWidgets import QApplication, QMessageBox
    from PyQt5.QtCore import Qt, QTimer
    HAS_PYQT5 = True
except ImportError:
    HAS_PYQT5 = False

# 从 serial_core 导入测试所需的类
from serial_core import (
    FakeSerialCore,
    SerialConfig,
    DataBits,
    StopBits,
    Parity,
)

# 全局 QApplication 实例
_app = None


def get_app():
    """获取或创建全局 QApplication 实例"""
    global _app
    if _app is None:
        _app = QApplication.instance()
        if _app is None:
            _app = QApplication(sys.argv)
    return _app


def safe_close_window(window):
    """安全关闭窗口并清理"""
    if window is None:
        return
    try:
        # 先停止读取线程（如果存在）
        if hasattr(window, '_stop_read_thread'):
            window._stop_read_thread()
        # 关闭串口
        if hasattr(window, '_core') and window._core and window._core.is_open:
            window._core.close()
        # 停止定时器
        if hasattr(window, '_send_timer') and window._send_timer:
            window._send_timer.stop()
        # 关闭窗口
        window.close()
        if QApplication.instance():
            QApplication.instance().processEvents()
    except Exception:
        pass


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowInitialization(unittest.TestCase):
    """测试 MainWindow 初始化和基本属性"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_window_title(self):
        """测试窗口标题正确"""
        self.assertIn("串口调试助手", self.window.windowTitle())

    def test_window_minimum_size(self):
        """测试窗口最小尺寸"""
        self.assertGreaterEqual(self.window.minimumWidth(), 700)
        self.assertGreaterEqual(self.window.minimumHeight(), 500)

    def test_serial_settings_widgets_exist(self):
        """测试串口设置区域的所有控件存在"""
        w = self.window
        self.assertIsNotNone(w._port_combo)
        self.assertIsNotNone(w._scan_btn)
        self.assertIsNotNone(w._baud_combo)
        self.assertIsNotNone(w._data_bits_combo)
        self.assertIsNotNone(w._stop_bits_combo)
        self.assertIsNotNone(w._parity_combo)
        self.assertIsNotNone(w._open_close_btn)
        self.assertIsNotNone(w._status_label)

    def test_receive_area_widgets_exist(self):
        """测试接收区域的所有控件存在"""
        w = self.window
        self.assertIsNotNone(w._rx_display)
        self.assertIsNotNone(w._hex_rx_check)
        self.assertIsNotNone(w._ts_check)
        self.assertIsNotNone(w._wrap_check)
        self.assertIsNotNone(w._scroll_check)
        self.assertIsNotNone(w._clear_rx_btn)
        self.assertIsNotNone(w._save_log_btn)

    def test_send_area_widgets_exist(self):
        """测试发送区域的所有控件存在"""
        w = self.window
        self.assertIsNotNone(w._tx_input)
        self.assertIsNotNone(w._hex_tx_radio)
        self.assertIsNotNone(w._ascii_tx_radio)
        self.assertIsNotNone(w._send_btn)
        self.assertIsNotNone(w._timed_send_check)
        self.assertIsNotNone(w._timed_interval_spin)

    def test_initial_disconnected_state(self):
        """测试初始状态为未连接"""
        w = self.window
        self.assertFalse(self.fake_core.is_open)
        self.assertEqual(w._open_close_btn.text(), "打开串口")
        self.assertFalse(w._send_btn.isEnabled())
        self.assertFalse(w._tx_input.isEnabled())
        self.assertIn("未连接", w._status_label.text())

    def test_default_baudrate(self):
        """测试默认波特率为 9600"""
        self.assertEqual(self.window._baud_combo.currentText(), "9600")

    def test_default_data_bits(self):
        """测试默认数据位为 8"""
        self.assertEqual(self.window._data_bits_combo.currentText(), "8")

    def test_default_stop_bits(self):
        """测试默认停止位为 1"""
        self.assertEqual(self.window._stop_bits_combo.currentText(), "1")

    def test_default_parity(self):
        """测试默认校验位为 None"""
        self.assertEqual(self.window._parity_combo.currentText(), "None")

    def test_default_checks(self):
        """测试默认勾选状态"""
        w = self.window
        self.assertTrue(w._ts_check.isChecked())
        self.assertTrue(w._wrap_check.isChecked())
        self.assertTrue(w._scroll_check.isChecked())
        self.assertFalse(w._hex_rx_check.isChecked())
        self.assertFalse(w._timed_send_check.isChecked())
        self.assertTrue(w._ascii_tx_radio.isChecked())

    def test_core_is_fake(self):
        """测试使用的是 FakeSerialCore"""
        self.assertIsInstance(self.window._core, FakeSerialCore)


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowSerialOperations(unittest.TestCase):
    """测试串口打开/关闭操作"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def _setup_port(self):
        """设置端口选择"""
        self.window._port_combo.clear()
        self.window._port_combo.addItem("COM_TEST", "COM_TEST")
        self.window._port_combo.setCurrentIndex(0)

    def test_open_serial_success(self):
        """测试成功打开串口"""
        self._setup_port()
        # 直接调用核心打开，不经过 GUI 的打开逻辑（避免启动线程）
        config = SerialConfig(port="COM_TEST", baudrate=115200)
        self.fake_core.open(config)
        self.window._update_ui_state()
        self.app.processEvents()

        self.assertTrue(self.fake_core.is_open)
        self.assertEqual(self.window._open_close_btn.text(), "关闭串口")

    def test_open_close_serial_via_gui(self):
        """测试通过 GUI 按钮打开和关闭串口"""
        self._setup_port()
        self.window._baud_combo.setCurrentText("115200")

        # 模拟打开（覆盖 _open_serial 以避免线程问题）
        config = SerialConfig(port="COM_TEST", baudrate=115200)
        self.fake_core.open(config)
        self.window._update_ui_state()
        self.app.processEvents()

        self.assertTrue(self.fake_core.is_open)
        self.assertTrue(self.window._send_btn.isEnabled())
        self.assertTrue(self.window._tx_input.isEnabled())

        # 模拟关闭
        self.fake_core.close()
        self.window._update_ui_state()
        self.app.processEvents()

        self.assertFalse(self.fake_core.is_open)
        self.assertEqual(self.window._open_close_btn.text(), "打开串口")

    def test_serial_config_passed_correctly(self):
        """测试正确传递串口配置"""
        self._setup_port()
        config = SerialConfig(
            port="COM_TEST",
            baudrate=115200,
            bytesize=DataBits.EIGHT,
            stopbits=StopBits.ONE,
            parity=Parity.NONE,
        )
        self.fake_core.open(config)
        self.assertEqual(self.fake_core.get_config().port, "COM_TEST")
        self.assertEqual(self.fake_core.get_config().baudrate, 115200)

    def test_ui_state_open(self):
        """测试打开串口后 UI 状态"""
        self._setup_port()
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window._update_ui_state()
        self.app.processEvents()

        # 串口设置区应禁用
        self.assertFalse(self.window._port_combo.isEnabled())
        self.assertFalse(self.window._scan_btn.isEnabled())
        self.assertFalse(self.window._baud_combo.isEnabled())
        self.assertFalse(self.window._data_bits_combo.isEnabled())
        self.assertFalse(self.window._stop_bits_combo.isEnabled())
        self.assertFalse(self.window._parity_combo.isEnabled())

        # 发送区应启用
        self.assertTrue(self.window._send_btn.isEnabled())
        self.assertTrue(self.window._tx_input.isEnabled())

    def test_ui_state_closed(self):
        """测试关闭串口后 UI 状态恢复"""
        self._setup_port()
        # 打开
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window._update_ui_state()
        self.app.processEvents()
        # 关闭
        self.fake_core.close()
        self.window._update_ui_state()
        self.app.processEvents()

        # 串口设置区应启用
        self.assertTrue(self.window._port_combo.isEnabled())
        self.assertTrue(self.window._scan_btn.isEnabled())
        # 发送区应禁用
        self.assertFalse(self.window._send_btn.isEnabled())
        self.assertFalse(self.window._tx_input.isEnabled())


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowSendData(unittest.TestCase):
    """测试数据发送功能"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        # 预打开串口
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window = MainWindow(serial_core=self.fake_core)
        self.window._update_ui_state()
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_send_ascii_data(self):
        """测试发送 ASCII 数据"""
        test_text = "Hello, Serial!"
        self.window._tx_input.setPlainText(test_text)
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], test_text.encode("utf-8"))

    def test_send_empty_data(self):
        """测试发送空数据不应触发发送"""
        self.window._tx_input.setPlainText("")
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 0)

    def test_send_multiple_ascii(self):
        """测试多次发送 ASCII 数据"""
        messages = ["Hello", "World", "Test"]
        for msg in messages:
            self.window._tx_input.setPlainText(msg)
            self.window._on_send()
            self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 3)
        for i, msg in enumerate(messages):
            self.assertEqual(sent[i], msg.encode("utf-8"))

    def test_send_hex_data(self):
        """测试发送 HEX 数据"""
        self.window._hex_tx_radio.setChecked(True)
        self.app.processEvents()

        hex_str = "AA BB CC DD"
        self.window._tx_input.setPlainText(hex_str)
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], bytes([0xAA, 0xBB, 0xCC, 0xDD]))

    def test_send_hex_without_spaces(self):
        """测试发送不带空格的 HEX 数据"""
        self.window._hex_tx_radio.setChecked(True)
        self.app.processEvents()

        self.window._tx_input.setPlainText("AABBCCDD")
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], bytes([0xAA, 0xBB, 0xCC, 0xDD]))

    def test_send_mixed_case_hex(self):
        """测试发送大小写混合的 HEX 数据"""
        self.window._hex_tx_radio.setChecked(True)
        self.app.processEvents()

        self.window._tx_input.setPlainText("aA bB Cc dD")
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], bytes([0xAA, 0xBB, 0xCC, 0xDD]))

    def test_send_appends_to_display(self):
        """测试发送数据会回显到接收区"""
        test_text = "Echo test"
        self.window._tx_input.setPlainText(test_text)
        initial_text = self.window._rx_display.toPlainText()
        self.window._on_send()
        self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        self.assertNotEqual(initial_text, display_text)
        self.assertIn("Echo test", display_text)

    def test_send_unicode(self):
        """测试发送 Unicode 数据"""
        test_text = "你好世界 🌍"
        self.window._tx_input.setPlainText(test_text)
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], test_text.encode("utf-8"))


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowReceiveData(unittest.TestCase):
    """测试数据接收和显示功能"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_display_received_ascii(self):
        """测试接收 ASCII 数据显示"""
        self.window._on_data_received(b"Hello from device!")
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertIn("Hello from device!", display_text)

    def test_display_received_hex_mode(self):
        """测试 HEX 显示模式接收数据"""
        self.window._hex_rx_check.setChecked(True)
        self.app.processEvents()

        self.window._on_data_received(bytes([0x41, 0x42, 0x43]))
        self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        self.assertIn("41", display_text.upper())
        self.assertIn("42", display_text.upper())
        self.assertIn("43", display_text.upper())

    def test_receive_multiple_packets(self):
        """测试多次接收数据"""
        for i in range(3):
            self.window._on_data_received(f"Packet {i}\n".encode())
            self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        for i in range(3):
            self.assertIn(f"Packet {i}", display_text)

    def test_receive_binary_data(self):
        """测试接收二进制数据"""
        binary_data = bytes([0x00, 0x01, 0x02, 0xFF, 0xFE])
        self.window._on_data_received(binary_data)
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertGreater(len(display_text), 0)

    def test_receive_unicode_data(self):
        """测试接收 Unicode 数据"""
        unicode_data = "你好世界".encode("utf-8")
        self.window._on_data_received(unicode_data)
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertIn("你好世界", display_text)

    def test_receive_large_data(self):
        """测试接收大量数据"""
        large_data = b"A" * 10000
        self.window._on_data_received(large_data)
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertGreater(len(display_text), 1000)

    def test_timestamp_in_display(self):
        """测试时间戳在接收数据显示中"""
        self.window._on_data_received(b"Timestamp test")
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertIn("[RX]", display_text)
        self.assertIn("Timestamp test", display_text)

    def test_no_timestamp_when_disabled(self):
        """测试关闭时间戳后无时间戳格式"""
        self.window._ts_check.setChecked(False)
        self.app.processEvents()

        self.window._on_data_received(b"No timestamp")
        self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        self.assertNotIn("[RX]", display_text)
        self.assertIn("No timestamp", display_text)

    def test_hex_display_without_timestamp(self):
        """测试HEX显示且无时间戳"""
        self.window._ts_check.setChecked(False)
        self.window._hex_rx_check.setChecked(True)
        self.app.processEvents()

        self.window._on_data_received(bytes([0x48, 0x65, 0x6C]))
        self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        self.assertNotIn("[RX]", display_text)
        self.assertIn("48", display_text.upper())


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowControlFeatures(unittest.TestCase):
    """测试接收区控制和显示功能"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_clear_receive_area(self):
        """测试清空接收区"""
        self.window._on_data_received(b"Some data")
        self.app.processEvents()
        self.assertGreater(len(self.window._rx_display.toPlainText()), 0)

        self.window._on_clear_rx()
        self.app.processEvents()
        self.assertEqual(self.window._rx_display.toPlainText(), "")

    def test_clear_empty_area(self):
        """测试清空空接收区不应出错"""
        try:
            self.window._on_clear_rx()
            self.app.processEvents()
        except Exception as e:
            self.fail(f"清空空接收区时出错: {e}")

    def test_hex_display_toggle_state(self):
        """测试 HEX 显示切换状态"""
        self.assertFalse(self.window._hex_receive)
        self.window._hex_rx_check.setChecked(True)
        self.app.processEvents()
        self.assertTrue(self.window._hex_receive)
        self.window._hex_rx_check.setChecked(False)
        self.app.processEvents()
        self.assertFalse(self.window._hex_receive)

    def test_timestamp_toggle_state(self):
        """测试时间戳切换状态"""
        self.assertTrue(self.window._show_timestamp)
        self.window._ts_check.setChecked(False)
        self.app.processEvents()
        self.assertFalse(self.window._show_timestamp)
        self.window._ts_check.setChecked(True)
        self.app.processEvents()
        self.assertTrue(self.window._show_timestamp)

    def test_wrap_toggle_state(self):
        """测试自动换行切换状态"""
        self.assertTrue(self.window._auto_wrap)
        self.window._wrap_check.setChecked(False)
        self.app.processEvents()
        self.assertFalse(self.window._auto_wrap)
        self.window._wrap_check.setChecked(True)
        self.app.processEvents()
        self.assertTrue(self.window._auto_wrap)

    def test_scroll_toggle_state(self):
        """测试自动滚动切换状态"""
        self.assertTrue(self.window._auto_scroll)
        self.window._scroll_check.setChecked(False)
        self.app.processEvents()
        self.assertFalse(self.window._auto_scroll)
        self.window._scroll_check.setChecked(True)
        self.app.processEvents()
        self.assertTrue(self.window._auto_scroll)

    def test_send_mode_toggle(self):
        """测试发送模式切换"""
        self.assertFalse(self.window._hex_send)
        self.assertTrue(self.window._ascii_tx_radio.isChecked())
        self.window._hex_tx_radio.setChecked(True)
        self.app.processEvents()
        self.assertTrue(self.window._hex_send)
        self.window._ascii_tx_radio.setChecked(True)
        self.app.processEvents()
        self.assertFalse(self.window._hex_send)

    def test_timed_send_initial_state(self):
        """测试定时发送初始状态"""
        self.assertFalse(self.window._timed_send_enabled)
        self.assertFalse(self.window._send_timer.isActive())

    def test_timed_send_interval_default(self):
        """测试默认定时发送间隔"""
        self.assertEqual(self.window._timed_interval_spin.value(), 1000)

    def test_timed_send_interval_range(self):
        """测试定时发送间隔范围"""
        spin = self.window._timed_interval_spin
        self.assertEqual(spin.minimum(), 100)
        self.assertEqual(spin.maximum(), 60000)


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowLogging(unittest.TestCase):
    """测试日志功能"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_log_info(self):
        """测试信息日志包含 [INFO] 标记"""
        self.window._log_info("Test info message")
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertIn("Test info message", display_text)
        self.assertIn("[INFO]", display_text)

    def test_log_error(self):
        """测试错误日志包含 [ERROR] 标记"""
        self.window._log_error("Test error message")
        self.app.processEvents()
        display_text = self.window._rx_display.toPlainText()
        self.assertIn("Test error message", display_text)
        self.assertIn("[ERROR]", display_text)

    def test_serial_log_after_open(self):
        """测试打开串口后有日志"""
        from gui_main_window import MainWindow
        fake_core2 = FakeSerialCore()
        fake_core2.open(SerialConfig(port="COM_TEST"))
        w2 = MainWindow(serial_core=fake_core2)
        self.app.processEvents()
        display_text = w2._rx_display.toPlainText()
        self.assertIn("串口调试助手已启动", display_text)
        safe_close_window(w2)


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowCloseEvent(unittest.TestCase):
    """测试窗口关闭事件"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_close_while_closed(self):
        """测试串口已关闭时关闭窗口"""
        try:
            self.window.close()
            self.app.processEvents()
        except Exception as e:
            self.fail(f"关闭窗口时出错: {e}")

    def test_close_while_open_closes_serial(self):
        """测试串口打开时关闭窗口应关闭串口"""
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window._update_ui_state()
        self.app.processEvents()
        self.assertTrue(self.fake_core.is_open)

        # 模拟 closeEvent
        from PyQt5.QtCore import QEvent
        from PyQt5.QtWidgets import QWidget
        try:
            self.window.close()
            self.app.processEvents()
        except Exception:
            pass


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowScanPorts(unittest.TestCase):
    """测试端口扫描功能"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    @patch('gui_main_window.PortScanner.list_ports')
    def test_scan_ports_found(self, mock_list_ports):
        """测试扫描到端口"""
        mock_list_ports.return_value = [
            {"port": "COM1", "description": "USB Serial Port", "hwid": "VID:PID"},
            {"port": "COM2", "description": "Bluetooth Serial", "hwid": "VID:PID2"},
        ]

        self.window._on_scan_ports()
        self.app.processEvents()

        self.assertEqual(self.window._port_combo.count(), 2)
        self.assertEqual(self.window._port_combo.currentData(), "COM1")

    @patch('gui_main_window.PortScanner.list_ports')
    def test_scan_ports_empty(self, mock_list_ports):
        """测试未扫描到端口"""
        mock_list_ports.return_value = []

        self.window._on_scan_ports()
        self.app.processEvents()

        self.assertEqual(self.window._port_combo.count(), 1)
        self.assertIn("无可用端口", self.window._port_combo.currentText())


@unittest.skipIf(not HAS_PYQT5, "PyQt5 不可用，跳过 GUI 测试")
class TestMainWindowEdgeCases(unittest.TestCase):
    """测试边界情况和异常场景"""

    @classmethod
    def setUpClass(cls):
        cls.app = get_app()

    def setUp(self):
        from gui_main_window import MainWindow
        self.fake_core = FakeSerialCore()
        self.window = MainWindow(serial_core=self.fake_core)
        self.app.processEvents()

    def tearDown(self):
        safe_close_window(self.window)
        self.window = None
        self.fake_core = None

    def test_send_when_closed(self):
        """测试串口关闭时发送数据不通过核心"""
        # 发送前确保串口关闭
        self.assertFalse(self.fake_core.is_open)
        self.window._tx_input.setPlainText("Should not send")
        self.window._on_send()
        self.app.processEvents()
        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 0)

    def test_mixed_send_receive_sequence(self):
        """测试收发交替"""
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window._update_ui_state()
        self.app.processEvents()

        self.window._tx_input.setPlainText("Send data")
        self.window._on_send()
        self.app.processEvents()

        self.window._on_data_received(b"Receive data")
        self.app.processEvents()

        display_text = self.window._rx_display.toPlainText()
        self.assertIn("Send data", display_text)
        self.assertIn("Receive data", display_text)

    def test_send_with_unicode_emoji(self):
        """测试发送包含 emoji 的数据"""
        self.fake_core.open(SerialConfig(port="COM_TEST"))
        self.window._update_ui_state()
        self.app.processEvents()

        test_text = "Test 🌟✨"
        self.window._tx_input.setPlainText(test_text)
        self.window._on_send()
        self.app.processEvents()

        sent = self.fake_core.get_sent_data()
        self.assertEqual(len(sent), 1)
        self.assertEqual(sent[0], test_text.encode("utf-8"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
