"""pytest 配置"""

import sys
from pathlib import Path

# 確保 apps.worker 可以被導入
sys.path.insert(0, str(Path(__file__).parent.parent.parent))