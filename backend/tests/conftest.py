import os

import pytest
from fastapi.testclient import TestClient

from app.main import app, get_flags


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def flags():
    """Подменяет флаги из базы: тест задаёт их сам."""
    values: dict[str, bool] = {}
    app.dependency_overrides[get_flags] = lambda: values
    return values


# Тесты с настоящими PostgreSQL и Redis — в CI (там подняты сервисы) или
# локально с SUNSCRYPT_TEST_LIVE=1.
live = pytest.mark.skipif(
    os.environ.get("SUNSCRYPT_TEST_LIVE") != "1", reason="нужны PostgreSQL и Redis"
)
