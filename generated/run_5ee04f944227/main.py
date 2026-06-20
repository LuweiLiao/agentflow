"""
main.py - 串口调试助手入口文件

提供两种运行模式：
1. 正常模式（默认）：使用 RealSerialCore 连接真实串口
2. 测试/演示模式：使用 --fake 参数，用 FakeSerialCore 模拟串口通信

用法：
    python main.py              # 正常模式
    python main.py --fake       # 使用 FakeSerialCore 演示模式
    python main.py --fake --fail  # 模拟串口打开失败场景
"""

import sys
import argparse


def main():
    """主入口函数"""
    parser = argparse.ArgumentParser(
        description="串口调试助手 - Serial Debug Assistant"
    )
    parser.add_argument(
        "--fake",
        action="store_true",
        help="使用 FakeSerialCore 模拟串口（用于无硬件环境测试）",
    )
    parser.add_argument(
        "--fail",
        action="store_true",
        help="模拟串口打开失败（仅与 --fake 配合使用）",
    )
    parser.add_argument(
        "--no-scan",
        action="store_true",
        help="启动时不自动扫描端口",
    )

    args = parser.parse_args()

    # 导入核心模块
    from serial_core import create_serial_core
    from gui_main_window import MainWindow, run_app
    from PyQt5.QtWidgets import QApplication

    # 创建串口核心实例
    if args.fake:
        serial_core = create_serial_core(
            fake=True,
            fail_on_open=args.fail,
        )
        mode = "FakeSerialCore（模拟模式）"
        if args.fail:
            mode += " - 模拟打开失败"
        print(f"[main] 启动模式: {mode}")
    else:
        serial_core = create_serial_core(fake=False)
        print("[main] 启动模式: RealSerialCore（真实串口模式）")

    # 启动 GUI
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    app.setStyle("Fusion")

    window = MainWindow(serial_core=serial_core)
    window.show()

    if not args.no_scan:
        window._on_scan_ports()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
