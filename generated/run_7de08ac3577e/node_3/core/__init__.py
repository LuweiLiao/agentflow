# core - 串口调试助手核心逻辑层
# 不含任何 GUI 依赖，可在无界面环境下单测

from .serial_config import SerialConfig
from .serial_worker import SerialWorker, SerialState
from .data_processor import DataProcessor
from .receive_buffer import ReceiveBuffer
from .file_saver import FileSaver
from .auto_scroll_source import AutoScrollSource, ScrollState

__all__ = [
    "SerialConfig",
    "SerialWorker",
    "SerialState",
    "DataProcessor",
    "ReceiveBuffer",
    "FileSaver",
    "AutoScrollSource",
    "ScrollState",
]
