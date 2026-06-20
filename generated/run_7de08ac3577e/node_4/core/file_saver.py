"""文件保存模块"""
import os
from datetime import datetime
from typing import Optional, Tuple


class FileSaver:
    """将接收数据保存到文件"""

    DEFAULT_ENCODING = "utf-8"

    def __init__(self, encoding: str = DEFAULT_ENCODING):
        self._encoding = encoding

    @staticmethod
    def generate_filename(prefix: str = "serial_data", ext: str = ".txt") -> str:
        """生成带时间戳的文件名"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}{ext}"

    def save_text(self, data: str, filepath: Optional[str] = None) -> Tuple[str, str]:
        """
        保存文本数据到文件
        :param data: 文本数据
        :param filepath: 文件路径，None则自动生成
        :return: (文件路径, 错误信息)
        """
        if not data:
            return "", "无数据可保存"

        if filepath is None:
            filepath = self.generate_filename()

        try:
            with open(filepath, "w", encoding=self._encoding) as f:
                f.write(data)
            return filepath, ""
        except (OSError, IOError) as e:
            return "", f"保存文件失败: {e}"

    def save_binary(self, data: bytes, filepath: Optional[str] = None) -> Tuple[str, str]:
        """
        保存二进制数据到文件
        :param data: 二进制数据
        :param filepath: 文件路径，None则自动生成
        :return: (文件路径, 错误信息)
        """
        if not data:
            return "", "无数据可保存"

        if filepath is None:
            filepath = self.generate_filename(ext=".bin")

        try:
            with open(filepath, "wb") as f:
                f.write(data)
            return filepath, ""
        except (OSError, IOError) as e:
            return "", f"保存文件失败: {e}"

    def save_hex(self, data: bytes, filepath: Optional[str] = None,
                 sep: str = " ", line_length: int = 16) -> Tuple[str, str]:
        """
        保存HEX格式的数据到文件
        :param data: 二进制数据
        :param filepath: 文件路径
        :param sep: 分隔符
        :param line_length: 每行字节数
        :return: (文件路径, 错误信息)
        """
        if not data:
            return "", "无数据可保存"

        if filepath is None:
            filepath = self.generate_filename(ext=".hex")

        try:
            hex_parts = [f"{b:02X}" for b in data]
            lines = []
            for i in range(0, len(hex_parts), line_length):
                chunk = hex_parts[i:i + line_length]
                # 每行同时显示HEX和ASCII
                hex_str = sep.join(chunk)
                ascii_str = "".join(
                    chr(int(h, 16)) if 0x20 <= int(h, 16) <= 0x7E else "."
                    for h in chunk
                )
                lines.append(f"{i:08X}: {hex_str:<{line_length * 3 - 1}}  {ascii_str}")

            with open(filepath, "w", encoding=self._encoding) as f:
                f.write("\n".join(lines))
            return filepath, ""
        except (OSError, IOError, ValueError) as e:
            return "", f"保存HEX文件失败: {e}"
