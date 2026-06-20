"""
gui_main_window.py - 串口调试助手 GUI 主窗口

使用 PyQt5 实现，通过 SerialCore 抽象接口与串口交互，
不直接操作串口底层，支持 RealSerialCore 和 FakeSerialCore 两种后端。

功能：
1. 端口扫描、打开/关闭串口、波特率/数据位/停止位/校验位设置
2. ASCII/HEX 发送与接收显示、时间戳、自动换行、自动滚动、定时发送
3. 接收区清空、保存日志
"""

import sys
import os
import time
from typing import Optional, List

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QComboBox, QPushButton, QTextEdit, QCheckBox,
    QRadioButton, QButtonGroup, QSpinBox, QGroupBox, QSplitter,
    QFileDialog, QMessageBox, QStatusBar, QGridLayout, QFrame,
    QTabWidget, QLineEdit, QPlainTextEdit,
)
from PyQt5.QtCore import Qt, QTimer, QDateTime, pyqtSignal, QThread, QObject
from PyQt5.QtGui import QFont, QTextCursor, QColor, QTextCharFormat

from serial_core import (
    SerialCore, RealSerialCore, FakeSerialCore, SerialConfig,
    SerialException, PortScanner, LogFormatter, HexCodec,
    DataBits, StopBits, Parity, BAUDRATES, create_serial_core,
)


# ================================================================
# 常量定义
# ================================================================

DATA_BITS_MAP = {
    "5": DataBits.FIVE,
    "6": DataBits.SIX,
    "7": DataBits.SEVEN,
    "8": DataBits.EIGHT,
}

STOP_BITS_MAP = {
    "1": StopBits.ONE,
    "1.5": StopBits.ONE_POINT_FIVE,
    "2": StopBits.TWO,
}

PARITY_MAP = {
    "None": Parity.NONE,
    "Even": Parity.EVEN,
    "Odd": Parity.ODD,
    "Mark": Parity.MARK,
    "Space": Parity.SPACE,
}

PARITY_REVERSE_MAP = {v: k for k, v in PARITY_MAP.items()}

POLL_INTERVAL_MS = 50       # 接收轮询间隔（毫秒）
DEFAULT_TIMED_SEND_MS = 1000  # 默认定时发送间隔


# ================================================================
# 串口读取工作线程
# ================================================================

class SerialReadWorker(QObject):
    """串口读取工作线程，避免阻塞 GUI"""

    data_received = pyqtSignal(bytes)
    error_occurred = pyqtSignal(str)
    finished = pyqtSignal()

    def __init__(self, core: SerialCore):
        super().__init__()
        self._core = core
        self._running = False

    def start(self):
        """启动读取循环"""
        self._running = True
        while self._running:
            if self._core.is_open:
                try:
                    data = self._core.read_all()
                    if data and len(data) > 0:
                        self.data_received.emit(data)
                except SerialException as e:
                    self.error_occurred.emit(str(e))
                except Exception as e:
                    self.error_occurred.emit(f"读取异常: {e}")
            # 短暂休眠避免忙等待
            time.sleep(POLL_INTERVAL_MS / 1000.0)
        self.finished.emit()

    def stop(self):
        """停止读取循环"""
        self._running = False


# ================================================================
# 主窗口
# ================================================================

class MainWindow(QMainWindow):
    """串口调试助手主窗口"""

    def __init__(self, serial_core: Optional[SerialCore] = None, parent=None):
        """
        初始化主窗口

        Args:
            serial_core: 串口核心实例，为 None 时自动创建 RealSerialCore
        """
        super().__init__(parent)
        self.setWindowTitle("串口调试助手 v1.0")
        self.resize(900, 650)
        self.setMinimumSize(700, 500)

        # ---- 串口核心 ----
        self._core = serial_core if serial_core is not None else RealSerialCore()

        # ---- 状态变量 ----
        self._hex_receive = False   # 接收 HEX 显示模式
        self._hex_send = False      # 发送 HEX 模式
        self._show_timestamp = True
        self._auto_scroll = True
        self._auto_wrap = True
        self._timed_send_enabled = False
        self._timed_send_interval = DEFAULT_TIMED_SEND_MS

        # ---- 读取线程 ----
        self._read_thread = None
        self._read_worker = None

        # ---- 定时器 ----
        self._send_timer = QTimer(self)
        self._send_timer.timeout.connect(self._on_timed_send)

        # ---- 构建 UI ----
        self._setup_ui()
        self._setup_signals()
        self._update_ui_state()

        # ---- 如果核心已打开，自动启动读取线程 ----
        if self._core.is_open:
            self._start_read_thread()

        self._log_info("串口调试助手已启动")

    # ================================================================
    # UI 构建
    # ================================================================

    def _setup_ui(self):
        """构建用户界面"""
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setSpacing(4)
        main_layout.setContentsMargins(8, 8, 8, 8)

        # -------- 顶部：串口设置面板 --------
        settings_group = QGroupBox("串口设置")
        settings_layout = QGridLayout(settings_group)
        settings_layout.setSpacing(4)

        # 端口
        settings_layout.addWidget(QLabel("端口:"), 0, 0)
        self._port_combo = QComboBox()
        self._port_combo.setMinimumWidth(120)
        self._port_combo.setToolTip("选择串口号")
        settings_layout.addWidget(self._port_combo, 0, 1)

        self._scan_btn = QPushButton("扫描端口")
        self._scan_btn.setToolTip("扫描可用串口端口")
        settings_layout.addWidget(self._scan_btn, 0, 2)

        # 波特率
        settings_layout.addWidget(QLabel("波特率:"), 0, 3)
        self._baud_combo = QComboBox()
        self._baud_combo.setMinimumWidth(100)
        self._baud_combo.setEditable(True)
        for b in BAUDRATES:
            self._baud_combo.addItem(str(b))
        self._baud_combo.setCurrentText("9600")
        settings_layout.addWidget(self._baud_combo, 0, 4)

        # 打开/关闭按钮
        self._open_close_btn = QPushButton("打开串口")
        self._open_close_btn.setMinimumWidth(90)
        self._open_close_btn.setStyleSheet(
            "QPushButton { font-weight: bold; }"
        )
        settings_layout.addWidget(self._open_close_btn, 0, 5, 1, 2)

        # 第二行：数据位、停止位、校验位
        settings_layout.addWidget(QLabel("数据位:"), 1, 0)
        self._data_bits_combo = QComboBox()
        for k in DATA_BITS_MAP:
            self._data_bits_combo.addItem(k)
        self._data_bits_combo.setCurrentText("8")
        settings_layout.addWidget(self._data_bits_combo, 1, 1)

        settings_layout.addWidget(QLabel("停止位:"), 1, 2)
        self._stop_bits_combo = QComboBox()
        for k in STOP_BITS_MAP:
            self._stop_bits_combo.addItem(k)
        self._stop_bits_combo.setCurrentText("1")
        settings_layout.addWidget(self._stop_bits_combo, 1, 3)

        settings_layout.addWidget(QLabel("校验位:"), 1, 4)
        self._parity_combo = QComboBox()
        for k in PARITY_MAP:
            self._parity_combo.addItem(k)
        self._parity_combo.setCurrentText("None")
        settings_layout.addWidget(self._parity_combo, 1, 5)

        # 状态标签
        self._status_label = QLabel("⚪ 未连接")
        self._status_label.setStyleSheet(
            "QLabel { color: #666; font-weight: bold; padding: 2px 8px; }"
        )
        settings_layout.addWidget(self._status_label, 1, 6)

        main_layout.addWidget(settings_group)

        # -------- 中间：接收区 --------
        rx_group = QGroupBox("接收区")
        rx_layout = QVBoxLayout(rx_group)
        rx_layout.setSpacing(2)

        # 接收显示控件
        self._rx_display = QPlainTextEdit()
        self._rx_display.setReadOnly(True)
        self._rx_display.setFont(QFont("Consolas, Courier New, monospace", 10))
        self._rx_display.setLineWrapMode(QPlainTextEdit.WidgetWidth)
        self._rx_display.setMaximumBlockCount(10000)
        rx_layout.addWidget(self._rx_display, 1)

        # 接收控制栏
        rx_controls = QHBoxLayout()
        rx_controls.setSpacing(6)

        self._hex_rx_check = QCheckBox("HEX 显示")
        rx_controls.addWidget(self._hex_rx_check)

        self._ts_check = QCheckBox("时间戳")
        self._ts_check.setChecked(True)
        rx_controls.addWidget(self._ts_check)

        self._wrap_check = QCheckBox("自动换行")
        self._wrap_check.setChecked(True)
        rx_controls.addWidget(self._wrap_check)

        self._scroll_check = QCheckBox("自动滚动")
        self._scroll_check.setChecked(True)
        rx_controls.addWidget(self._scroll_check)

        rx_controls.addStretch(1)

        self._clear_rx_btn = QPushButton("清空接收")
        rx_controls.addWidget(self._clear_rx_btn)

        self._save_log_btn = QPushButton("保存日志")
        rx_controls.addWidget(self._save_log_btn)

        rx_layout.addLayout(rx_controls)
        main_layout.addWidget(rx_group, 1)

        # -------- 底部：发送区 --------
        tx_group = QGroupBox("发送区")
        tx_layout = QVBoxLayout(tx_group)
        tx_layout.setSpacing(2)

        # 发送输入
        self._tx_input = QPlainTextEdit()
        self._tx_input.setFont(QFont("Consolas, Courier New, monospace", 10))
        self._tx_input.setMaximumHeight(80)
        self._tx_input.setPlaceholderText("输入要发送的数据...")
        tx_layout.addWidget(self._tx_input)

        # 发送控制栏
        tx_controls = QHBoxLayout()
        tx_controls.setSpacing(6)

        self._hex_tx_radio = QRadioButton("HEX 发送")
        self._ascii_tx_radio = QRadioButton("ASCII 发送")
        self._ascii_tx_radio.setChecked(True)
        tx_controls.addWidget(self._ascii_tx_radio)
        tx_controls.addWidget(self._hex_tx_radio)

        # 发送模式按钮组
        self._tx_mode_group = QButtonGroup(self)
        self._tx_mode_group.addButton(self._ascii_tx_radio, 0)
        self._tx_mode_group.addButton(self._hex_tx_radio, 1)

        tx_controls.addStretch(1)

        self._send_btn = QPushButton("发送")
        self._send_btn.setMinimumWidth(80)
        self._send_btn.setStyleSheet(
            "QPushButton { background-color: #4CAF50; color: white; "
            "font-weight: bold; padding: 4px 16px; }"
            "QPushButton:hover { background-color: #45a049; }"
            "QPushButton:disabled { background-color: #ccc; }"
        )
        tx_controls.addWidget(self._send_btn)

        self._timed_send_check = QCheckBox("定时发送")
        tx_controls.addWidget(self._timed_send_check)

        tx_controls.addWidget(QLabel("间隔(ms):"))
        self._timed_interval_spin = QSpinBox()
        self._timed_interval_spin.setRange(100, 60000)
        self._timed_interval_spin.setValue(DEFAULT_TIMED_SEND_MS)
        self._timed_interval_spin.setSuffix(" ms")
        tx_controls.addWidget(self._timed_interval_spin)

        tx_layout.addLayout(tx_controls)
        main_layout.addWidget(tx_group)

        # -------- 状态栏 --------
        self._status_bar = QStatusBar()
        self.setStatusBar(self._status_bar)
        self._status_bar.showMessage("就绪")

    def _setup_signals(self):
        """连接信号与槽"""
        # 端口扫描
        self._scan_btn.clicked.connect(self._on_scan_ports)

        # 打开/关闭串口
        self._open_close_btn.clicked.connect(self._on_open_close)

        # 接收区控制
        self._hex_rx_check.toggled.connect(self._on_hex_rx_toggled)
        self._ts_check.toggled.connect(self._on_ts_toggled)
        self._wrap_check.toggled.connect(self._on_wrap_toggled)
        self._scroll_check.toggled.connect(self._on_scroll_toggled)
        self._clear_rx_btn.clicked.connect(self._on_clear_rx)
        self._save_log_btn.clicked.connect(self._on_save_log)

        # 发送
        self._send_btn.clicked.connect(self._on_send)
        self._tx_input.installEventFilter(self)

        # 发送模式
        self._tx_mode_group.buttonClicked.connect(self._on_tx_mode_changed)

        # 定时发送
        self._timed_send_check.toggled.connect(self._on_timed_send_toggled)
        self._timed_interval_spin.valueChanged.connect(self._on_timed_interval_changed)

    # ================================================================
    # 串口操作
    # ================================================================

    def _on_scan_ports(self):
        """扫描可用串口端口"""
        self._port_combo.clear()
        ports = PortScanner.list_ports()
        if ports:
            for p in ports:
                label = p["port"]
                if p["description"]:
                    label += f" - {p['description']}"
                self._port_combo.addItem(label, p["port"])
            self._log_info(f"扫描到 {len(ports)} 个串口端口")
        else:
            self._port_combo.addItem("(无可用端口)", "")
            self._log_info("未扫描到串口端口（可使用 --fake 模式模拟）")

    def _on_open_close(self):
        """打开或关闭串口"""
        if self._core.is_open:
            self._close_serial()
        else:
            self._open_serial()

    def _open_serial(self):
        """打开串口"""
        port_data = self._port_combo.currentData()
        if not port_data:
            port_text = self._port_combo.currentText()
            if port_text and not port_text.startswith("(无"):
                port_data = port_text.split(" - ")[0]
            else:
                QMessageBox.warning(self, "提示", "请先选择串口端口")
                return

        try:
            baudrate = int(self._baud_combo.currentText())
        except ValueError:
            QMessageBox.warning(self, "提示", "波特率格式错误")
            return

        bytesize = DATA_BITS_MAP.get(self._data_bits_combo.currentText(), DataBits.EIGHT)
        stopbits = STOP_BITS_MAP.get(self._stop_bits_combo.currentText(), StopBits.ONE)
        parity = PARITY_MAP.get(self._parity_combo.currentText(), Parity.NONE)

        config = SerialConfig(
            port=port_data,
            baudrate=baudrate,
            bytesize=bytesize,
            stopbits=stopbits,
            parity=parity,
            timeout=0.1,
            write_timeout=1.0,
        )

        try:
            success = self._core.open(config)
            if success:
                self._start_read_thread()
                self._log_info(
                    f"串口已打开: {port_data} @ {baudrate} "
                    f"{self._data_bits_combo.currentText()}"
                    f"{self._stop_bits_combo.currentText()}"
                    f"{self._parity_combo.currentText()}"
                )
                self._update_ui_state()
            else:
                QMessageBox.critical(self, "错误", f"打开串口 {port_data} 失败")
        except SerialException as e:
            QMessageBox.critical(self, "串口错误", str(e))
        except Exception as e:
            QMessageBox.critical(self, "未知错误", f"打开串口时发生错误: {e}")

    def _close_serial(self):
        """关闭串口"""
        try:
            self._stop_read_thread()
            self._core.close()
            self._log_info("串口已关闭")
        except Exception as e:
            self._log_error(f"关闭串口时出错: {e}")
        self._update_ui_state()

    # ================================================================
    # 读取线程管理
    # ================================================================

    def _start_read_thread(self):
        """启动后台读取线程"""
        self._stop_read_thread()

        self._read_worker = SerialReadWorker(self._core)
        self._read_worker.data_received.connect(self._on_data_received)
        self._read_worker.error_occurred.connect(self._on_read_error)

        self._read_thread = QThread()
        self._read_worker.moveToThread(self._read_thread)
        self._read_thread.started.connect(self._read_worker.start)
        self._read_worker.finished.connect(self._read_thread.quit)
        self._read_worker.finished.connect(self._read_worker.deleteLater)
        self._read_thread.finished.connect(self._read_thread.deleteLater)

        self._read_thread.start()

    def _stop_read_thread(self):
        """停止后台读取线程"""
        if self._read_worker is not None:
            self._read_worker.stop()
            self._read_worker = None
        if self._read_thread is not None and self._read_thread.isRunning():
            self._read_thread.quit()
            self._read_thread.wait(1000)
            self._read_thread = None

    def _on_data_received(self, data: bytes):
        """处理接收到的数据"""
        if self._show_timestamp:
            log = LogFormatter.format_received(data, hex_mode=self._hex_receive)
        else:
            if self._hex_receive:
                data_str = HexCodec.encode(data)
            else:
                try:
                    data_str = data.decode("utf-8", errors="replace")
                except Exception:
                    data_str = HexCodec.encode(data)
            log = data_str

        self._append_to_rx(log)

    def _on_read_error(self, error_msg: str):
        """读取错误处理"""
        self._log_error(f"读取错误: {error_msg}")
        if not self._core.is_open:
            self._stop_read_thread()
            self._update_ui_state()
            self._log_info("串口连接已断开")

    # ================================================================
    # 发送操作
    # ================================================================

    def _on_send(self):
        """发送数据"""
        if not self._core.is_open:
            QMessageBox.warning(self, "提示", "串口未打开，无法发送")
            return

        text = self._tx_input.toPlainText()
        if not text:
            return

        try:
            if self._hex_send:
                if not HexCodec.is_valid_hex(text):
                    QMessageBox.warning(self, "提示", "HEX 格式错误，请检查输入（如: AA BB CC）")
                    return
                data = HexCodec.decode(text)
            else:
                data = text.encode("utf-8")

            written = self._core.send(data)
            if self._show_timestamp:
                log = LogFormatter.format_sent(data, hex_mode=self._hex_send)
            else:
                if self._hex_send:
                    data_str = HexCodec.encode(data)
                else:
                    data_str = text
                log = f"[TX] {data_str}"

            self._append_to_rx(log)
            self._status_bar.showMessage(
                f"已发送 {written} 字节", 3000
            )
        except SerialException as e:
            QMessageBox.critical(self, "发送错误", str(e))
        except Exception as e:
            QMessageBox.critical(self, "发送错误", f"发送失败: {e}")

    def _on_timed_send(self):
        """定时发送回调"""
        self._on_send()

    def _on_timed_send_toggled(self, checked: bool):
        """定时发送开关"""
        self._timed_send_enabled = checked
        if checked and self._core.is_open:
            self._send_timer.start(self._timed_send_interval)
            self._log_info(f"定时发送已启动，间隔 {self._timed_send_interval} ms")
        else:
            self._send_timer.stop()
            if checked:
                self._log_info("串口未打开，无法启动定时发送")
                self._timed_send_check.setChecked(False)

    def _on_timed_interval_changed(self, value: int):
        """定时发送间隔变更"""
        self._timed_send_interval = value
        if self._send_timer.isActive():
            self._send_timer.setInterval(value)

    def _on_tx_mode_changed(self, btn):
        """发送模式切换"""
        self._hex_send = (btn == self._hex_tx_radio)

    # ================================================================
    # 接收区控制
    # ================================================================

    def _on_hex_rx_toggled(self, checked: bool):
        """HEX 接收显示切换"""
        self._hex_receive = checked

    def _on_ts_toggled(self, checked: bool):
        """时间戳显示切换"""
        self._show_timestamp = checked

    def _on_wrap_toggled(self, checked: bool):
        """自动换行切换"""
        self._auto_wrap = checked
        if checked:
            self._rx_display.setLineWrapMode(QPlainTextEdit.WidgetWidth)
        else:
            self._rx_display.setLineWrapMode(QPlainTextEdit.NoWrap)

    def _on_scroll_toggled(self, checked: bool):
        """自动滚动切换"""
        self._auto_scroll = checked

    def _on_clear_rx(self):
        """清空接收区"""
        self._rx_display.clear()
        self._status_bar.showMessage("接收区已清空", 3000)

    def _on_save_log(self):
        """保存接收区日志到文件"""
        filepath, _ = QFileDialog.getSaveFileName(
            self, "保存日志", "serial_log.txt",
            "文本文件 (*.txt);;所有文件 (*)"
        )
        if filepath:
            try:
                content = self._rx_display.toPlainText()
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                self._log_info(f"日志已保存到: {filepath}")
            except Exception as e:
                QMessageBox.critical(self, "保存失败", f"保存日志时出错: {e}")

    # ================================================================
    # 辅助方法
    # ================================================================

    def _append_to_rx(self, text: str):
        """向接收区追加文本"""
        self._rx_display.appendPlainText(text)
        if self._auto_scroll:
            cursor = self._rx_display.textCursor()
            cursor.movePosition(QTextCursor.End)
            self._rx_display.setTextCursor(cursor)

    def _log_info(self, message: str):
        """记录信息日志到接收区"""
        log = LogFormatter.format_info(message)
        self._append_to_rx(log)

    def _log_error(self, message: str):
        """记录错误日志到接收区"""
        log = LogFormatter.format_error(message)
        self._append_to_rx(log)

    def _update_ui_state(self):
        """更新 UI 控件状态"""
        is_open = self._core.is_open

        # 串口设置区
        self._port_combo.setEnabled(not is_open)
        self._scan_btn.setEnabled(not is_open)
        self._baud_combo.setEnabled(not is_open)
        self._data_bits_combo.setEnabled(not is_open)
        self._stop_bits_combo.setEnabled(not is_open)
        self._parity_combo.setEnabled(not is_open)

        # 打开/关闭按钮
        if is_open:
            self._open_close_btn.setText("关闭串口")
            self._open_close_btn.setStyleSheet(
                "QPushButton { background-color: #f44336; color: white; "
                "font-weight: bold; }"
                "QPushButton:hover { background-color: #da190b; }"
            )
            self._status_label.setText("🟢 已连接")
            self._status_label.setStyleSheet(
                "QLabel { color: #4CAF50; font-weight: bold; padding: 2px 8px; }"
            )
        else:
            self._open_close_btn.setText("打开串口")
            self._open_close_btn.setStyleSheet(
                "QPushButton { font-weight: bold; }"
            )
            self._status_label.setText("⚪ 未连接")
            self._status_label.setStyleSheet(
                "QLabel { color: #666; font-weight: bold; padding: 2px 8px; }"
            )
            # 关闭定时发送
            if self._timed_send_enabled:
                self._send_timer.stop()
                self._timed_send_check.setChecked(False)

        # 发送区
        self._send_btn.setEnabled(is_open)
        self._tx_input.setEnabled(is_open)

    def closeEvent(self, event):
        """窗口关闭事件"""
        self._stop_read_thread()
        try:
            if self._core.is_open:
                self._core.close()
        except Exception:
            pass
        self._send_timer.stop()
        event.accept()

    def keyPressEvent(self, event):
        """键盘事件 - Ctrl+Enter 发送"""
        if event.key() == Qt.Key_Return and event.modifiers() == Qt.ControlModifier:
            self._on_send()
        else:
            super().keyPressEvent(event)


# ================================================================
# 快速启动入口（独立运行时）
# ================================================================

def run_app(serial_core: Optional[SerialCore] = None):
    """
    启动串口调试助手 GUI

    Args:
        serial_core: 可选的串口核心实例，用于注入 FakeSerialCore 进行测试
    """
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    app.setStyle("Fusion")

    window = MainWindow(serial_core=serial_core)
    window.show()

    # 启动时自动扫描端口
    window._on_scan_ports()

    return app.exec_()


if __name__ == "__main__":
    sys.exit(run_app())
