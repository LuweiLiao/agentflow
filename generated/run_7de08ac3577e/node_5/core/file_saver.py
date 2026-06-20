"""
文件保存器 - 保存接收数据到文件
"""
import os
from datetime import datetime
from typing import Optional


class FileSaver:
    """文件保存器，支持文本和HEX格式保存"""

    def __init__(self, directory: Optional[str] = None):
        """
        Args:
            directory: 保存目录，默认当前目录
        """
        self._directory = directory or os.getcwd()
        self._ensure_dir_exists()

    def _ensure_dir_exists(self):
        """确保保存目录存在"""
        os.makedirs(self._directory, exist_ok=True)

    @property
    def directory(self) -> str:
        return self._directory

    @directory.setter
    def directory(self, path: str):
        self._directory = path
        self._ensure_dir_exists()

    def save_as_text(self, data: bytes, filename: Optional[str] = None,
                     encoding: str = "utf-8") -> str:
        """将数据以文本格式保存到文件

        Args:
            data: 要保存的字节数据
            filename: 文件名，默认自动生成
            encoding: 文本编码

        Returns:
            保存的文件路径
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"received_text_{timestamp}.txt"

        filepath = os.path.join(self._directory, filename)

        with open(filepath, "w", encoding=encoding) as f:
            f.write(data.decode(encoding, errors="replace"))

        return filepath

    def save_as_hex(self, data: bytes, filename: Optional[str] = None,
                    encoding: str = "utf-8") -> str:
        """将数据以HEX格式保存到文件

        Args:
            data: 要保存的字节数据
            filename: 文件名，默认自动生成
            encoding: 仅用于文件编码

        Returns:
            保存的文件路径
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"received_hex_{timestamp}.txt"

        filepath = os.path.join(self._directory, filename)

        from .data_processor import DataProcessor
        hex_content = DataProcessor.bytes_to_hex(data, sep=" ", upper=True)

        with open(filepath, "w", encoding=encoding) as f:
            f.write(hex_content)

        return filepath

    def save_as_binary(self, data: bytes, filename: Optional[str] = None) -> str:
        """将数据以二进制格式保存到文件

        Args:
            data: 要保存的字节数据
            filename: 文件名，默认自动生成

        Returns:
            保存的文件路径
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"received_bin_{timestamp}.bin"

        filepath = os.path.join(self._directory, filename)

        with open(filepath, "wb") as f:
            f.write(data)

        return filepath
