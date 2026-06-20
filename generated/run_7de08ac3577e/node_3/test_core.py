#!/usr/bin/env python3
"""
核心逻辑单元测试 —— 不依赖 GUI，不依赖真实串口设备
运行方式: python test_core.py
"""

import os
import sys
import json
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import (
    SerialConfig,
    SerialWorker,
    DataProcessor,
    ReceiveBuffer,
    FileSaver,
    AutoScrollSource,
    ScrollState,
    SerialState,
)


# ==================== SerialConfig 测试 ====================

class TestSerialConfig(unittest.TestCase):

    def test_default_config(self):
        cfg = SerialConfig()
        self.assertEqual(cfg.port, "")
        self.assertEqual(cfg.baudrate, 115200)
        self.assertEqual(cfg.bytesize, 8)
        self.assertEqual(cfg.stopbits, 1.0)
        self.assertEqual(cfg.parity, "N")

    def test_invalid_config_is_not_valid(self):
        cfg = SerialConfig()
        self.assertFalse(cfg.is_valid())

    def test_valid_config(self):
        cfg = SerialConfig(port="COM3", baudrate=9600)
        self.assertTrue(cfg.is_valid())

    def test_to_dict_from_dict(self):
        cfg1 = SerialConfig(
            port="/dev/ttyUSB0",
            baudrate=115200,
            bytesize=8,
            stopbits=1,
            parity="E",
            timeout=0.5,
        )
        d = cfg1.to_dict()
        cfg2 = SerialConfig.from_dict(d)
        self.assertEqual(cfg1.port, cfg2.port)
        self.assertEqual(cfg1.baudrate, cfg2.baudrate)
        self.assertEqual(cfg1.parity, cfg2.parity)
        self.assertEqual(cfg1.timeout, cfg2.timeout)

    def test_invalid_bytesize(self):
        cfg = SerialConfig(port="COM1", bytesize=9)
        self.assertFalse(cfg.is_valid())

    def test_invalid_parity(self):
        cfg = SerialConfig(port="COM1", parity="X")
        self.assertFalse(cfg.is_valid())


# ==================== DataProcessor 测试 ====================

class TestDataProcessor(unittest.TestCase):

    def test_hex_to_bytes_basic(self):
        result = DataProcessor.hex_to_bytes("A1B2C3")
        self.assertEqual(result, b"\xa1\xb2\xc3")

    def test_hex_to_bytes_with_spaces(self):
        result = DataProcessor.hex_to_bytes("A1 B2 C3")
        self.assertEqual(result, b"\xa1\xb2\xc3")

    def test_hex_to_bytes_with_0x(self):
        """0x 前缀应被正确忽略"""
        result = DataProcessor.hex_to_bytes("0xA1 0xB2")
        self.assertEqual(result, b"\xa1\xb2")

    def test_hex_to_bytes_mixed_0x(self):
        """混合 0x 前缀和普通 HEX"""
        result = DataProcessor.hex_to_bytes("0xA1 B2 0xC3")
        self.assertEqual(result, b"\xa1\xb2\xc3")

    def test_hex_to_bytes_odd_length(self):
        """奇数个 nibble 自动在前面补 0"""
        result = DataProcessor.hex_to_bytes("A1B")
        self.assertEqual(result, b"\x0a\x1b")

    def test_hex_to_bytes_invalid(self):
        result = DataProcessor.hex_to_bytes("XYZ")
        self.assertIsNone(result)

    def test_hex_to_bytes_empty(self):
        result = DataProcessor.hex_to_bytes("")
        self.assertEqual(result, b"")

    def test_bytes_to_hex(self):
        result = DataProcessor.bytes_to_hex(b"\xa1\xb2\xc3")
        self.assertEqual(result, "A1 B2 C3")

    def test_bytes_to_hex_lowercase(self):
        result = DataProcessor.bytes_to_hex(b"\xa1\xb2", uppercase=False)
        self.assertEqual(result, "a1 b2")

    def test_bytes_to_hex_no_sep(self):
        result = DataProcessor.bytes_to_hex(b"\x00\xff", sep="")
        self.assertEqual(result, "00FF")

    def test_bytes_to_text_utf8(self):
        result = DataProcessor.bytes_to_text("你好".encode("utf-8"))
        self.assertEqual(result, "你好")

    def test_encode_send_text(self):
        result = DataProcessor.encode_send("hello", hex_mode=False)
        self.assertEqual(result, b"hello")

    def test_encode_send_hex(self):
        result = DataProcessor.encode_send("A1 B2", hex_mode=True)
        self.assertEqual(result, b"\xa1\xb2")

    def test_encode_send_hex_invalid(self):
        result = DataProcessor.encode_send("XYZ", hex_mode=True)
        self.assertIsNone(result)

    def test_decode_receive_text(self):
        result = DataProcessor.decode_receive(b"hello", hex_mode=False)
        self.assertEqual(result, "hello")

    def test_decode_receive_hex(self):
        result = DataProcessor.decode_receive(b"\xa1\xb2", hex_mode=True)
        self.assertEqual(result, "A1 B2")

    def test_is_valid_hex(self):
        self.assertTrue(DataProcessor.is_valid_hex("A1 B2"))
        self.assertFalse(DataProcessor.is_valid_hex("XYZ"))


# ==================== ReceiveBuffer 测试 ====================

class TestReceiveBuffer(unittest.TestCase):

    def test_append_text(self):
        buf = ReceiveBuffer()
        new_lines = buf.append(b"hello\nworld\n")
        self.assertEqual(new_lines, ["hello", "world"])
        self.assertEqual(buf.line_count, 2)

    def test_partial_line(self):
        buf = ReceiveBuffer()
        new_lines = buf.append(b"hel")
        self.assertEqual(new_lines, [])
        new_lines = buf.append(b"lo\n")
        self.assertEqual(new_lines, ["hello"])

    def test_hex_mode_no_newline(self):
        """HEX 模式：换行符 0x0A 被转为 '0A' 文本，不触发分割"""
        buf = ReceiveBuffer()
        # 不含 \n 的字节 → HEX 后没有换行符，所以没有新行（partial）
        new_lines = buf.append(b"\xa1\xb2\xa3", hex_mode=True)
        self.assertEqual(new_lines, [])  # partial line

        # 追加带换行符的 → 在文本模式下才会分割，但 HEX 模式将 0x0A 转为 "0A"
        # 所以如果要触发换行，需要额外加一个真正的 \n 字符
        buf2 = ReceiveBuffer()
        new_lines2 = buf2.append(b"\xa1\xb2\n", hex_mode=True)
        # 0x0A 被转为 "0A"，所以没有真正的换行符，结果为 []
        self.assertEqual(new_lines2, [])
        # 但是 partial 行上有 "A1 B2 0A"
        self.assertGreater(len(buf2._partial_line), 0)

    def test_hex_mode_with_real_newline(self):
        """HEX 模式下，如果在 HEX 字符串后追加一个文本换行，才触发分割"""
        buf = ReceiveBuffer()
        # 先追加 HEX 数据
        buf.append(b"\xa1\xb2", hex_mode=True)
        # 再追加一个文本换行符（模拟 UI 层追加的行为）
        buf.append(b"\n", hex_mode=False)
        # 现在应该有完整行
        self.assertGreater(buf.line_count, 0)
        all_text = buf.get_all_text()
        self.assertIn("A1", all_text)
        self.assertIn("B2", all_text)

    def test_get_all_text(self):
        buf = ReceiveBuffer()
        buf.append(b"line1\nline2\nline3")
        text = buf.get_all_text()
        self.assertIn("line1", text)
        self.assertIn("line2", text)
        self.assertIn("line3", text)

    def test_clear(self):
        buf = ReceiveBuffer()
        buf.append(b"hello\nworld\n")
        self.assertGreater(buf.total_bytes, 0)
        buf.clear()
        self.assertEqual(buf.total_bytes, 0)
        self.assertEqual(buf.line_count, 0)
        self.assertEqual(buf.raw_data, b"")

    def test_max_bytes(self):
        buf = ReceiveBuffer(max_bytes=100)
        data = b"x" * 200
        buf.append(data)
        self.assertLessEqual(len(buf.raw_data), 100)

    def test_on_new_data_callback(self):
        buf = ReceiveBuffer()
        received = []

        def callback(lines):
            received.extend(lines)

        buf.set_on_new_data(callback)
        buf.append(b"hello\nworld\n")
        self.assertEqual(received, ["hello", "world"])


# ==================== FileSaver 测试 ====================

class TestFileSaver(unittest.TestCase):

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_save_text(self):
        saver = FileSaver()
        path = os.path.join(self.tmpdir, "test.txt")
        result = saver.save_text("hello world", path, add_timestamp=False)
        self.assertTrue(os.path.exists(result))
        with open(result, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("hello world", content)

    def test_save_text_with_timestamp(self):
        saver = FileSaver()
        path = os.path.join(self.tmpdir, "ts.txt")
        result = saver.save_text("data", path, add_timestamp=True)
        with open(result, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("[", content)

    def test_save_hex(self):
        saver = FileSaver()
        path = os.path.join(self.tmpdir, "hex.txt")
        result = saver.save_hex(b"\x00\xff\xa1", path, add_timestamp=False)
        self.assertTrue(os.path.exists(result))
        with open(result, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("00", content)
        self.assertIn("FF", content)
        self.assertIn("A1", content)

    def test_save_raw(self):
        saver = FileSaver()
        path = os.path.join(self.tmpdir, "raw.bin")
        result = saver.save_raw(b"\x00\xff\xa1\xb2", path)
        self.assertTrue(os.path.exists(result))
        with open(result, "rb") as f:
            data = f.read()
        self.assertEqual(data, b"\x00\xff\xa1\xb2")

    def test_generate_filename(self):
        name = FileSaver.generate_filename("test", ".txt")
        self.assertTrue(name.startswith("test_"))
        self.assertTrue(name.endswith(".txt"))

    def test_format_hex_dump(self):
        lines = FileSaver._format_hex_dump(b"Hello World!!!", bytes_per_line=8)
        self.assertGreater(len(lines), 0)
        self.assertIn("00000000", lines[0])


# ==================== AutoScrollSource 测试 ====================

class TestAutoScrollSource(unittest.TestCase):

    def test_default_enabled(self):
        source = AutoScrollSource()
        self.assertTrue(source.auto_scroll_enabled)

    def test_toggle(self):
        source = AutoScrollSource()
        source.disable_auto_scroll()
        self.assertFalse(source.auto_scroll_enabled)
        source.enable_auto_scroll()
        self.assertTrue(source.auto_scroll_enabled)
        result = source.toggle_auto_scroll()
        self.assertFalse(result)

    def test_should_auto_scroll_at_bottom(self):
        source = AutoScrollSource()
        source.set_at_bottom(True)
        self.assertTrue(source.should_auto_scroll())

    def test_should_not_auto_scroll_when_not_at_bottom(self):
        source = AutoScrollSource()
        source.set_at_bottom(False)
        self.assertFalse(source.should_auto_scroll())

    def test_should_not_auto_scroll_when_disabled(self):
        source = AutoScrollSource()
        source.disable_auto_scroll()
        source.set_at_bottom(True)
        self.assertFalse(source.should_auto_scroll())

    def test_add_lines(self):
        source = AutoScrollSource()
        source.add_lines(["line1", "line2"])
        self.assertEqual(source.total_lines, 2)
        pending = source.pending_lines
        self.assertEqual(pending, ["line1", "line2"])
        self.assertEqual(source.pending_lines, [])

    def test_on_lines_added_callback(self):
        source = AutoScrollSource()
        received = []

        def cb(lines):
            received.extend(lines)

        source.set_on_lines_added(cb)
        source.add_lines(["a", "b"])
        self.assertEqual(received, ["a", "b"])

    def test_reset(self):
        source = AutoScrollSource()
        source.add_lines(["x", "y"])
        source.set_at_bottom(False)
        source.reset()
        self.assertEqual(source.total_lines, 0)
        self.assertTrue(source._scroll_state.at_bottom)


# ==================== SerialWorker 测试（无硬件依赖） ====================

class TestSerialWorker(unittest.TestCase):

    def test_initial_state(self):
        worker = SerialWorker()
        self.assertEqual(worker.state, SerialState.CLOSED)
        self.assertFalse(worker.is_open)
        self.assertEqual(worker.port, "")

    def test_list_ports_no_error(self):
        ports = SerialWorker.list_ports()
        self.assertIsInstance(ports, list)

    def test_open_with_invalid_config(self):
        worker = SerialWorker()
        cfg = SerialConfig()
        result = worker.open(cfg)
        self.assertFalse(result)
        self.assertEqual(worker.state, SerialState.ERROR)

    def test_send_when_closed(self):
        worker = SerialWorker()
        result = worker.send(b"hello")
        self.assertEqual(result, -1)

    def test_repr(self):
        worker = SerialWorker()
        rep = repr(worker)
        self.assertIn("CLOSED", rep)


# ==================== 综合集成测试 ====================

class TestIntegration(unittest.TestCase):
    """模拟完整的接收-处理-保存-滚动链路"""

    def test_receive_to_save_pipeline(self):
        """模拟：接收数据 → 缓存 → 文本拼接 → 保存到文件"""
        buf = ReceiveBuffer()
        saver = FileSaver()
        source = AutoScrollSource()

        chunks = [b"line1\n", b"line2\n", b"line3\n"]
        all_new_lines = []
        for chunk in chunks:
            new_lines = buf.append(chunk)
            all_new_lines.extend(new_lines)
            source.add_lines(new_lines)

        self.assertEqual(buf.line_count, 3)
        self.assertEqual(source.total_lines, 3)

        all_text = buf.get_all_text()
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            tmp_path = f.name
            f.write(all_text)

        with open(tmp_path, "r", encoding="utf-8") as f:
            saved = f.read()
        self.assertIn("line1", saved)
        self.assertIn("line2", saved)

        os.unlink(tmp_path)

    def test_receive_text_and_save_raw(self):
        """模拟：接收文本数据 → 缓存 → 保存原始字节"""
        buf = ReceiveBuffer()
        saver = FileSaver()

        buf.append(b"hello\nworld\n")
        self.assertEqual(buf.line_count, 2)

        tmp_dir = tempfile.mkdtemp()
        tmp_path = os.path.join(tmp_dir, "raw.bin")
        saver.save_raw(buf.raw_data, tmp_path)
        with open(tmp_path, "rb") as f:
            self.assertEqual(f.read(), b"hello\nworld\n")
        os.unlink(tmp_path)
        os.rmdir(tmp_dir)

    def test_full_pipeline_with_hex_send(self):
        """完整链路：HEX输入 → 编码 → 发送(模拟) → 接收 → 解码 → 缓存 → 滚动"""
        from core import DataProcessor, ReceiveBuffer, AutoScrollSource

        # 1. 用户输入HEX字符串
        user_input = "A1 B2 C3"
        send_data = DataProcessor.encode_send(user_input, hex_mode=True)
        self.assertEqual(send_data, b"\xa1\xb2\xc3")

        # 2. 模拟对方回复
        reply = b"\xd1\xd2\xd3"

        # 3. 接收并解码
        buf = ReceiveBuffer()
        source = AutoScrollSource()

        hex_display = DataProcessor.decode_receive(reply, hex_mode=True)
        self.assertEqual(hex_display, "D1 D2 D3")

        # 4. 模拟收到带换行的数据
        new_lines = buf.append(reply + b"\n", hex_mode=False)
        source.add_lines(new_lines)
        self.assertGreater(len(new_lines), 0)
        self.assertEqual(source.total_lines, len(new_lines))


# ==================== 主入口 ====================

if __name__ == "__main__":
    print("=" * 60)
    print("串口调试助手 — 核心逻辑单元测试")
    print("=" * 60)
    print()

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for test_class in [
        TestSerialConfig,
        TestDataProcessor,
        TestReceiveBuffer,
        TestFileSaver,
        TestAutoScrollSource,
        TestSerialWorker,
        TestIntegration,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(test_class))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 60)
    print(f"测试结果: 运行 {result.testsRun} 个测试, "
          f"成功 {result.testsRun - len(result.failures) - len(result.errors)} 个, "
          f"失败 {len(result.failures)} 个, "
          f"错误 {len(result.errors)} 个")

    if result.wasSuccessful():
        summary = "全部测试通过"
    else:
        summary = f"有 {len(result.failures) + len(result.errors)} 个测试未通过"

    print(json.dumps({
        "summary": summary,
        "tests_run": result.testsRun,
        "failures": len(result.failures),
        "errors": len(result.errors),
    }, ensure_ascii=False, indent=2))
