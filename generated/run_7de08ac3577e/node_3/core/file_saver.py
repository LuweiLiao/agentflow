"""文件保存功能：将接收数据保存到文件，支持文本/HEX 两种格式"""

import os
from datetime import datetime
from typing import Optional, Union, List


class FileSaver:
    """将接收数据保存到文件

    特性：
    - 支持纯文本和 HEX 两种保存格式
    - 自动生成带时间戳的文件名
    - 追加或覆盖模式
    - 编码可选
    """

    def __init__(self, encoding: str = "utf-8"):
        self.encoding = encoding

    # ---------- 保存接口 ----------

    def save_text(
        self,
        content: str,
        filepath: str,
        mode: str = "w",
        add_timestamp: bool = True,
    ) -> str:
        """将文本内容保存到文件

        Args:
            content: 文本内容
            filepath: 文件路径
            mode: 'w' 覆盖 / 'a' 追加
            add_timestamp: 是否在文件开头添加时间戳标记

        Returns:
            实际写入的文件路径
        """
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)

        # 处理文件名后缀
        if not filepath.endswith(".txt"):
            filepath = filepath + ".txt"

        with open(filepath, mode, encoding=self.encoding) as f:
            if add_timestamp and mode == "a":
                # 追加模式下先换行分隔
                f.write("\n")
            if add_timestamp:
                ts = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
                f.write(f"{ts}\n")
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")

        return filepath

    def save_hex(
        self,
        raw_data: bytes,
        filepath: str,
        mode: str = "w",
        add_timestamp: bool = True,
        bytes_per_line: int = 16,
    ) -> str:
        """将原始字节以 HEX 格式保存到文件

        Args:
            raw_data: 原始字节数据
            filepath: 文件路径
            mode: 'w' 覆盖 / 'a' 追加
            add_timestamp: 是否添加时间戳
            bytes_per_line: 每行显示的字节数

        Returns:
            实际写入的文件路径
        """
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)

        if not filepath.endswith(".txt"):
            filepath = filepath + ".txt"

        hex_lines = self._format_hex_dump(raw_data, bytes_per_line)

        with open(filepath, mode, encoding=self.encoding) as f:
            if add_timestamp and mode == "a":
                f.write("\n")
            if add_timestamp:
                ts = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
                f.write(f"{ts}\n")
            for line in hex_lines:
                f.write(line + "\n")

        return filepath

    def save_raw(
        self,
        raw_data: bytes,
        filepath: str,
        mode: str = "wb",
    ) -> str:
        """将原始字节直接保存为二进制文件

        Args:
            raw_data: 原始字节数据
            filepath: 文件路径
            mode: 'wb' 覆盖 / 'ab' 追加

        Returns:
            实际写入的文件路径
        """
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)

        with open(filepath, mode) as f:
            f.write(raw_data)

        return filepath

    # ---------- 工具方法 ----------

    @staticmethod
    def _format_hex_dump(data: bytes, bytes_per_line: int = 16) -> List[str]:
        """将字节格式化为 HEX 转储文本行

        格式：每行显示偏移量 + HEX + ASCII
        """
        lines = []
        for i in range(0, len(data), bytes_per_line):
            chunk = data[i:i+bytes_per_line]

            # 偏移量
            offset = f"{i:08X}"

            # HEX 部分
            hex_part = " ".join(f"{b:02X}" for b in chunk)
            # 对齐
            hex_str = f"{hex_part:<{bytes_per_line * 3 - 1}}"

            # ASCII 部分
            ascii_part = "".join(
                chr(b) if 0x20 <= b <= 0x7E else "."
                for b in chunk
            )

            lines.append(f"{offset}  {hex_str}  |{ascii_part}|")

        return lines

    @staticmethod
    def generate_filename(prefix: str = "serial_log", suffix: str = "") -> str:
        """生成带时间戳的文件名"""
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        if suffix and not suffix.startswith("."):
            suffix = "." + suffix
        return f"{prefix}_{ts}{suffix}"
