"""接收环形缓冲区，支持按行分割、按大小截断，可作为自动滚动的数据源"""

from typing import Optional, List
from collections import deque
import time


class ReceiveBuffer:
    """线程安全的接收数据环形缓冲区

    特性：
    - 容量上限（按字节数），超限自动丢弃旧数据
    - 每次追加返回新增的可显示行列表（用于增量刷新）
    - 支持清空
    - 不依赖 GUI 线程
    """

    def __init__(self, max_bytes: int = 10 * 1024 * 1024, max_line_length: int = 4096):
        """
        Args:
            max_bytes: 缓冲区字节容量上限（默认 10MB）
            max_line_length: 单行最大字符数（超长截断，防止界面卡顿）
        """
        self._max_bytes = max_bytes
        self._max_line_length = max_line_length

        # 原始字节缓冲区（实际存储全部字节，用于文件保存）
        self._raw_data = bytearray()

        # 行缓存：存储已按换行符分割的字符串行（用于增量显示）
        self._lines: deque = deque()
        self._partial_line = ""          # 未完成的行

        # 统计
        self._total_bytes = 0
        self._line_count = 0

        # 回调通知（可选，用于非阻塞通知 UI 刷新）
        self._on_new_data = None  # Callable[[List[str]], None]

    # ---------- 属性 ----------

    @property
    def total_bytes(self) -> int:
        return self._total_bytes

    @property
    def line_count(self) -> int:
        return self._line_count

    @property
    def raw_data(self) -> bytes:
        """获取原始字节数据的副本"""
        return bytes(self._raw_data)

    @property
    def lines(self) -> List[str]:
        """获取当前所有行的副本"""
        return list(self._lines)

    # ---------- 核心操作 ----------

    def append(self, data: bytes, hex_mode: bool = False) -> List[str]:
        """追加接收到的字节数据

        在内部完成：
        1. 原始字节追加到 _raw_data
        2. 如果超出容量，丢弃最旧的字节
        3. 将字节解码为文本，按换行符分割
        4. 返回新增的完整行列表（用于 UI 增量刷新）

        Args:
            data: 接收到的字节
            hex_mode: 是否以 HEX 模式解码（若 True，则每字节转为 HEX 字符串）

        Returns:
            新增的可显示行列表（不含未完成的 partial 行）
        """
        if not data:
            return []

        # 1) 追加原始字节
        self._raw_data.extend(data)
        self._total_bytes += len(data)

        # 容量管理：如果超出 max_bytes，从头部丢弃
        if len(self._raw_data) > self._max_bytes:
            excess = len(self._raw_data) - self._max_bytes
            self._raw_data = self._raw_data[excess:]

        # 2) 解码为文本
        if hex_mode:
            # HEX 模式：将每个字节转为两位 HEX，空格分隔
            text_piece = " ".join(f"{b:02X}" for b in data)
        else:
            text_piece = data.decode("utf-8", errors="replace")

        # 3) 按换行符分割
        new_lines = self._split_lines(text_piece)

        # 4) 通知回调
        if self._on_new_data and new_lines:
            self._on_new_data(new_lines)

        return new_lines

    def _split_lines(self, text: str) -> List[str]:
        """将文本按换行符分割，处理 partial 行

        Returns:
            本次产生的完整行列表
        """
        if not text:
            return []

        merged = self._partial_line + text
        parts = merged.split("\n")

        if merged.endswith("\n"):
            # 最后一个是空字符串，全部行都完整
            self._partial_line = ""
            complete_lines = parts[:-1]  # 去掉最后的空串
        else:
            # 最后一段是不完整的行
            self._partial_line = parts[-1]
            complete_lines = parts[:-1]

        # 截断超长行
        result = []
        for line in complete_lines:
            if len(line) > self._max_line_length:
                line = line[:self._max_line_length] + "... [truncated]"
            self._lines.append(line)
            self._line_count += 1
            result.append(line)

        return result

    def get_all_text(self, separator: str = "\n") -> str:
        """获取缓冲区内所有文本（用于文件保存或全选复制）"""
        lines = list(self._lines)
        if self._partial_line:
            lines.append(self._partial_line)
        return separator.join(lines)

    def clear(self) -> None:
        """清空缓冲区"""
        self._raw_data.clear()
        self._lines.clear()
        self._partial_line = ""
        self._total_bytes = 0
        self._line_count = 0

    def set_on_new_data(self, callback) -> None:
        """设置新数据回调，callback(new_lines: List[str])"""
        self._on_new_data = callback

    def __len__(self) -> int:
        return len(self._raw_data)

    def __repr__(self) -> str:
        return (f"ReceiveBuffer(raw_bytes={len(self._raw_data)}, "
                f"lines={self._line_count}, "
                f"partial={len(self._partial_line)} chars)")
