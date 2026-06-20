# PyQt5 串口调试助手（AgentFlow 编排产物）

本目录是从 AgentFlow run `run_7de08ac3577e` 的节点写文件事件中重建出的可运行应用产物。

## 功能
- 串口选择、刷新、波特率配置
- 打开/关闭串口
- 文本/HEX 发送
- 文本/HEX 接收显示
- 自动滚动开关
- 清空接收区
- 接收数据保存
- 核心逻辑与 GUI 解耦，可在无真实串口环境下测试

## 运行

```bash
pip install PyQt5 pyserial
python3 gui_main_window.py
```

## 测试

```bash
QT_QPA_PLATFORM=offscreen python3 test_all.py
```

已在当前机器验证通过。

## 关键文件
- `gui_main_window.py`：PyQt5 主窗口
- `core/serial_config.py`：串口配置数据结构
- `core/serial_worker.py`：串口状态机与收发线程
- `core/data_processor.py`：文本/HEX 编解码
- `core/receive_buffer.py`：接收缓冲
- `core/file_saver.py`：保存接收数据
- `core/auto_scroll_source.py`：自动滚动状态源
- `test_all.py`：核心+GUI 集成验证脚本
