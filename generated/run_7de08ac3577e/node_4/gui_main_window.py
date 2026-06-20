"""串口调试助手 - PyQt5 主窗口"""
import sys
import os
from typing import Optional

from PyQt5.QtCore import (
    Qt, QTimer, pyqtSignal, QObject, QThread
)
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QComboBox, QPushButton, QTextEdit, QCheckBox,
    QGroupBox, QGridLayout, QSpinBox, QFileDialog, QMessageBox,
    QSplitter, QPlainTextEdit, QStatusBar
)
from PyQt5.QtGui import QFont, QTextCursor

from core import (
    SerialConfig, SerialWorker, DataProcessor,
    ReceiveBuffer, FileSaver, AutoScrollSource, ScrollState,
    BAUD_RATES, DEFAULT_BAUD
)


class SerialWorkerSignals(QObject):
    """串口工作者信号桥接（跨线程安全）"""
    data_received = pyqtSignal(bytes)
    error_occurred = pyqtSignal(str)
    connection_changed = pyqtSignal(bool)


class SerialDebugWindow(QMainWindow):
    """串口调试助手主窗口"""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("串口调试助手")
        self.setMinimumSize(900, 650)

        # ---- 核心逻辑对象 ----
        self.serial_worker = SerialWorker()
        self.data_processor = DataProcessor()
        self.receive_buffer = ReceiveBuffer()
        self.file_saver = FileSaver()
        self.auto_scroll = AutoScrollSource(ScrollState.ENABLED)

        # 信号桥接
        self._signals = SerialWorkerSignals()
        self._setup_signal_connections()

        # 定时刷新串口列表
        self._port_refresh_timer = QTimer(self)
        self._port_refresh_timer.setInterval(3000)  # 每3秒刷新
        self._port_refresh_timer.timeout.connect(self._refresh_ports)
        self._port_refresh_timer.start()

        # 构建 UI
        self._init_ui()

        # 状态
        self._hex_send_mode = False
        self._hex_display_mode = False

        # 应用样式
        self._apply_style()

        # 设置初始 UI 状态（串口未打开）
        self._update_ui_state(False)

    def _setup_signal_connections(self):
        """连接串口工作者的信号"""
        # 将工作者的回调桥接到信号
        self.serial_worker.on_data_received = self._on_data_received
        self.serial_worker.on_error = self._on_error
        self.serial_worker.on_connection_changed = self._on_connection_changed

        # 信号连接
        self._signals.data_received.connect(self._handle_data_received)
        self._signals.error_occurred.connect(self._handle_error)
        self._signals.connection_changed.connect(self._handle_connection_changed)

    # ---------- 回调（在工作者线程中调用） ----------

    def _on_data_received(self, data: bytes):
        """工作者线程 - 数据接收回调"""
        self._signals.data_received.emit(data)

    def _on_error(self, msg: str):
        """工作者线程 - 错误回调"""
        self._signals.error_occurred.emit(msg)

    def _on_connection_changed(self, opened: bool):
        """工作者线程 - 连接状态变化回调"""
        self._signals.connection_changed.emit(opened)

    # ---------- 信号处理（在主线程中执行） ----------

    def _handle_data_received(self, data: bytes):
        """主线程 - 处理接收到的数据"""
        # 存入缓冲区
        self.receive_buffer.append(data)

        # 格式化显示
        text = self.data_processor.format_received(data, self._hex_display_mode)
        if self._hex_display_mode:
            text += " "

        # 追加到接收区
        self._append_receive_text(text)

    def _handle_error(self, msg: str):
        """主线程 - 处理错误"""
        self.statusBar().showMessage(f"错误: {msg}", 5000)

    def _handle_connection_changed(self, opened: bool):
        """主线程 - 更新连接状态 UI"""
        self._update_ui_state(opened)

    # ---------- UI 构建 ----------

    def _init_ui(self):
        """初始化用户界面"""
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setSpacing(8)

        # === 顶部：串口配置 ===
        top_widget = self._create_top_bar()
        main_layout.addWidget(top_widget)

        # === 中间：发送区和接收区（水平分割）===
        splitter = QSplitter(Qt.Horizontal)

        # 左侧：发送区
        send_widget = self._create_send_panel()
        splitter.addWidget(send_widget)

        # 右侧：接收区
        recv_widget = self._create_receive_panel()
        splitter.addWidget(recv_widget)

        splitter.setSizes([350, 550])
        main_layout.addWidget(splitter, 1)

        # === 底部：状态栏 ===
        self.statusBar().showMessage("就绪")

    def _create_top_bar(self) -> QWidget:
        """创建顶部配置栏"""
        widget = QWidget()
        layout = QHBoxLayout(widget)
        layout.setContentsMargins(0, 0, 0, 0)

        # 串口选择
        layout.addWidget(QLabel("串口:"))
        self.port_combo = QComboBox()
        self.port_combo.setMinimumWidth(120)
        self.port_combo.setToolTip("选择串口")
        layout.addWidget(self.port_combo)

        # 刷新按钮
        self.refresh_btn = QPushButton("刷新")
        self.refresh_btn.setToolTip("刷新串口列表")
        self.refresh_btn.clicked.connect(self._refresh_ports)
        layout.addWidget(self.refresh_btn)

        # 波特率
        layout.addWidget(QLabel("波特率:"))
        self.baud_combo = QComboBox()
        self.baud_combo.setEditable(True)
        self.baud_combo.setMinimumWidth(100)
        for b in BAUD_RATES:
            self.baud_combo.addItem(str(b))
        # 设置默认波特率
        idx = self.baud_combo.findText(str(DEFAULT_BAUD))
        if idx >= 0:
            self.baud_combo.setCurrentIndex(idx)
        self.baud_combo.setToolTip("选择或输入波特率")
        layout.addWidget(self.baud_combo)

        # 打开/关闭按钮
        self.open_btn = QPushButton("打开串口")
        self.open_btn.setMinimumWidth(90)
        self.open_btn.setToolTip("打开/关闭串口连接")
        self.open_btn.clicked.connect(self._toggle_serial)
        layout.addWidget(self.open_btn)

        layout.addStretch()
        return widget

    def _create_send_panel(self) -> QWidget:
        """创建发送区域"""
        group = QGroupBox("发送区")
        layout = QVBoxLayout(group)

        # 发送文本框
        self.send_text = QPlainTextEdit()
        self.send_text.setPlaceholderText("在此输入要发送的数据...")
        self.send_text.setMaximumHeight(200)
        font = QFont("Consolas, Courier New, monospace", 10)
        self.send_text.setFont(font)
        layout.addWidget(self.send_text, 1)

        # 发送控制行
        ctrl_layout = QHBoxLayout()

        # HEX发送复选框
        self.hex_send_cb = QCheckBox("HEX发送")
        self.hex_send_cb.setToolTip("以十六进制格式发送数据")
        self.hex_send_cb.toggled.connect(self._on_hex_send_toggled)
        ctrl_layout.addWidget(self.hex_send_cb)

        ctrl_layout.addStretch()

        # 发送按钮
        self.send_btn = QPushButton("发送")
        self.send_btn.setMinimumWidth(80)
        self.send_btn.setToolTip("发送数据 (Ctrl+Enter)")
        self.send_btn.clicked.connect(self._send_data)
        # 快捷键 Ctrl+Enter
        self.send_btn.setShortcut("Ctrl+Return")
        ctrl_layout.addWidget(self.send_btn)

        layout.addLayout(ctrl_layout)
        return group

    def _create_receive_panel(self) -> QWidget:
        """创建接收区域"""
        group = QGroupBox("接收区")
        layout = QVBoxLayout(group)

        # 接收文本框
        self.recv_text = QPlainTextEdit()
        self.recv_text.setReadOnly(True)
        self.recv_text.setPlaceholderText("接收到的数据将显示在这里...")
        font = QFont("Consolas, Courier New, monospace", 10)
        self.recv_text.setFont(font)
        layout.addWidget(self.recv_text, 1)

        # 接收控制行
        ctrl_layout = QHBoxLayout()

        # HEX显示复选框
        self.hex_display_cb = QCheckBox("HEX显示")
        self.hex_display_cb.setToolTip("以十六进制格式显示接收数据")
        self.hex_display_cb.toggled.connect(self._on_hex_display_toggled)
        ctrl_layout.addWidget(self.hex_display_cb)

        # 自动滚动复选框
        self.auto_scroll_cb = QCheckBox("自动滚动")
        self.auto_scroll_cb.setChecked(True)
        self.auto_scroll_cb.setToolTip("自动滚动到最新数据")
        self.auto_scroll_cb.toggled.connect(self._on_auto_scroll_toggled)
        ctrl_layout.addWidget(self.auto_scroll_cb)

        ctrl_layout.addStretch()

        # 清空按钮
        self.clear_btn = QPushButton("清空接收")
        self.clear_btn.setToolTip("清空接收缓冲区")
        self.clear_btn.clicked.connect(self._clear_receive)
        ctrl_layout.addWidget(self.clear_btn)

        # 保存按钮
        self.save_btn = QPushButton("保存数据")
        self.save_btn.setToolTip("保存接收数据到文件")
        self.save_btn.clicked.connect(self._save_receive_data)
        ctrl_layout.addWidget(self.save_btn)

        layout.addLayout(ctrl_layout)
        return group

    def _apply_style(self):
        """应用样式美化"""
        self.setStyleSheet("""
            QGroupBox {
                font-weight: bold;
                border: 1px solid #cccccc;
                border-radius: 5px;
                margin-top: 8px;
                padding-top: 16px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QPushButton {
                padding: 5px 12px;
                border: 1px solid #aaa;
                border-radius: 3px;
                background: #f0f0f0;
            }
            QPushButton:hover {
                background: #e0e0e0;
            }
            QPushButton:pressed {
                background: #d0d0d0;
            }
            QComboBox {
                padding: 3px 8px;
                border: 1px solid #aaa;
                border-radius: 3px;
            }
            QPlainTextEdit {
                border: 1px solid #bbb;
                border-radius: 3px;
                background: #fafafa;
            }
        """)

    # ---------- 事件处理 ----------

    def _refresh_ports(self):
        """刷新串口列表"""
        current = self.port_combo.currentText()
        self.port_combo.blockSignals(True)
        self.port_combo.clear()
        ports = self.serial_worker.list_ports()
        if ports:
            self.port_combo.addItems(ports)
            # 恢复之前选中的串口
            idx = self.port_combo.findText(current)
            if idx >= 0:
                self.port_combo.setCurrentIndex(idx)
        else:
            self.port_combo.addItem("(无可用串口)")
        self.port_combo.blockSignals(False)

    def _toggle_serial(self):
        """打开/关闭串口"""
        if self.serial_worker.is_open:
            self._close_serial()
        else:
            self._open_serial()

    def _open_serial(self):
        """打开串口"""
        port = self.port_combo.currentText()
        if not port or port.startswith("("):
            QMessageBox.warning(self, "警告", "请先选择有效的串口")
            return

        try:
            baud = int(self.baud_combo.currentText())
        except ValueError:
            QMessageBox.warning(self, "警告", "无效的波特率")
            return

        config = SerialConfig(port=port, baudrate=baud)
        err = self.serial_worker.open(config)
        if err:
            QMessageBox.critical(self, "错误", f"打开串口失败:\n{err}")
        else:
            self.statusBar().showMessage(f"串口 {port} 已打开 (波特率: {baud})")

    def _close_serial(self):
        """关闭串口"""
        port = self.serial_worker.config.port if self.serial_worker.config else ""
        err = self.serial_worker.close()
        if err:
            self.statusBar().showMessage(f"关闭串口出错: {err}", 3000)
        else:
            self.statusBar().showMessage(f"串口 {port} 已关闭")

    def _update_ui_state(self, opened: bool):
        """根据串口连接状态更新UI"""
        if opened:
            self.open_btn.setText("关闭串口")
            self.open_btn.setStyleSheet(
                "background-color: #f44336; color: white; border-color: #D32F2F;"
            )
            self.port_combo.setEnabled(False)
            self.baud_combo.setEnabled(False)
            self.refresh_btn.setEnabled(False)
            self.send_btn.setEnabled(True)
        else:
            self.open_btn.setText("打开串口")
            self.open_btn.setStyleSheet("")
            self.port_combo.setEnabled(True)
            self.baud_combo.setEnabled(True)
            self.refresh_btn.setEnabled(True)
            self.send_btn.setEnabled(False)

    def _send_data(self):
        """发送数据"""
        text = self.send_text.toPlainText()
        if not text.strip():
            self.statusBar().showMessage("发送区无数据", 2000)
            return

        data, err = self.data_processor.prepare_send(text, self._hex_send_mode)
        if err:
            QMessageBox.warning(self, "发送错误", err)
            return

        if not data:
            self.statusBar().showMessage("无数据可发送", 2000)
            return

        err = self.serial_worker.send(data)
        if err:
            QMessageBox.critical(self, "发送失败", err)
        else:
            show = self.data_processor.bytes_to_hex(data) if self._hex_send_mode else data.decode("utf-8", errors="replace")
            self.statusBar().showMessage(f"已发送: {show[:60]}...", 3000)

    def _append_receive_text(self, text: str):
        """向接收区追加文本"""
        self.recv_text.moveCursor(QTextCursor.End)
        self.recv_text.insertPlainText(text)
        if self.auto_scroll.enabled:
            self.recv_text.moveCursor(QTextCursor.End)
            self.recv_text.ensureCursorVisible()

    def _clear_receive(self):
        """清空接收区"""
        self.recv_text.clear()
        self.receive_buffer.clear()
        self.statusBar().showMessage("接收区已清空", 2000)

    def _save_receive_data(self):
        """保存接收数据到文件"""
        # 获取所有数据
        data = self.receive_buffer.get_all()
        if not data and self.recv_text.toPlainText().strip():
            # 如果缓冲区为空但显示区有文本，使用显示区文本
            text = self.recv_text.toPlainText()
            fpath, err = self.file_saver.save_text(text)
            if err:
                QMessageBox.critical(self, "保存失败", err)
            else:
                QMessageBox.information(self, "保存成功",
                                        f"数据已保存到:\n{fpath}")
            return
        elif not data:
            QMessageBox.information(self, "提示", "没有接收数据可保存")
            return

        # 选择保存方式
        if self._hex_display_mode:
            fpath, err = self.file_saver.save_hex(data)
        else:
            fpath, err = self.file_saver.save_text(
                self.recv_text.toPlainText()
            )

        if err:
            QMessageBox.critical(self, "保存失败", err)
        else:
            QMessageBox.information(self, "保存成功",
                                    f"数据已保存到:\n{fpath}")

    def _on_hex_send_toggled(self, checked: bool):
        """HEX发送模式切换"""
        self._hex_send_mode = checked

    def _on_hex_display_toggled(self, checked: bool):
        """HEX显示模式切换"""
        self._hex_display_mode = checked
        # 如果切换显示模式，重新显示缓冲区内容
        if self.receive_buffer.size > 0:
            self.recv_text.clear()
            data = self.receive_buffer.get_all()
            text = self.data_processor.format_received(data, checked)
            if checked:
                text += " "
            self.recv_text.insertPlainText(text)
            if self.auto_scroll.enabled:
                self.recv_text.moveCursor(QTextCursor.End)

    def _on_auto_scroll_toggled(self, checked: bool):
        """自动滚动切换"""
        if checked:
            self.auto_scroll.enable()
        else:
            self.auto_scroll.disable()

    # ---------- 窗口事件 ----------

    def closeEvent(self, event):
        """窗口关闭事件"""
        if self.serial_worker.is_open:
            self.serial_worker.close()
        self._port_refresh_timer.stop()
        event.accept()


def main():
    """启动应用程序"""
    app = QApplication(sys.argv)
    app.setApplicationName("串口调试助手")
    window = SerialDebugWindow()
    window.show()
    # 首次刷新串口列表
    window._refresh_ports()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
