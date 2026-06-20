"""
串口调试助手 - 核心逻辑包
"""

from .serial_config import SerialConfig, BaudRate, DataBits, StopBits, Parity
from .serial_worker import SerialWorker, SerialState
from .data_processor import DataProcessor
from .receive_buffer import ReceiveBuffer
from .file_saver import FileSaver
from .auto_scroll_source import AutoScrollSource, ScrollState

__all__ = [
    "SerialConfig", "BaudRate", "DataBits", "StopBits", "Parity",
    "SerialWorker", "SerialState",
    "DataProcessor",
    "ReceiveBuffer",
    "FileSaver",
    "AutoScrollSource", "ScrollState",
]
