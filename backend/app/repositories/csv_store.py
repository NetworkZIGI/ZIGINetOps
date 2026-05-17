import csv
import os
from collections.abc import Iterable
from contextlib import contextmanager
from pathlib import Path
from threading import RLock
from typing import Any


class CsvStore:
    def __init__(self, path: Path, fieldnames: list[str]) -> None:
        self.path = path
        self.fieldnames = fieldnames
        self._lock = RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.write_rows([])

    @contextmanager
    def locked(self):
        with self._lock:
            yield

    def read_rows(self) -> list[dict[str, str]]:
        with self.locked():
            if not self.path.exists() or self.path.stat().st_size == 0:
                return []
            with self.path.open("r", encoding="utf-8", newline="") as handle:
                return list(csv.DictReader(handle))

    def write_rows(self, rows: Iterable[dict[str, Any]]) -> None:
        with self.locked():
            tmp_path = self.path.with_suffix(f"{self.path.suffix}.tmp")
            with tmp_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=self.fieldnames)
                writer.writeheader()
                for row in rows:
                    writer.writerow({key: row.get(key, "") for key in self.fieldnames})
            os.replace(tmp_path, self.path)
