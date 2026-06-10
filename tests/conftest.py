"""tests/conftest.py — 测试基础设施"""
import os
import sys

# 将项目根目录加入导入路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
