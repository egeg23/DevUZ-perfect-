"""Сквозной цикл этапа 2 на настоящих PostgreSQL и Redis: регистрация →
письмо → подтверждение → вход → включение 2FA → выход → вход с 2FA →
сброс пароля. Плюс отказы: чужой источник, неверный пароль, лимиты."""

import os
import re
import time
import uuid

import pyotp
import pytest
from sqlalchemy import create_engine, text

from tests.conftest import live

pytestmark = live

PASSWORD = "correct horse battery"


@pytest.fixture(scope="module")
def db():
    url = os.environ.get(
        "DATABASE_URL", "postgresql+psycopg://sunscrypt:sunscrypt@localhost:5432/sunscrypt"
    )
    eng = create_engine(url)
    yield eng
    eng.dispose()


def last_link(db, email: str, kind: str) -> str:
    with db.connect() as c:
        body = c.execute(
            text('SELECT body FROM outbox_emails WHERE "to" = :e ORDER BY id DESC LIMIT 1'),
            {"e": email},
        ).scalar_one()
    m = re.search(rf"https://sunscrypt\.test/{kind}\?token=(\S+)", body)
    assert m, body
    return m.group(1)


def fresh_email() -> str:
    return f"user-{uuid.uuid4().hex[:10]}@example.com"


def registered(client, db) -> str:
    email = fresh_email()
    assert (
        client.post("/api/auth/register", json={"email": email, "password": PASSWORD}).status_code
        == 201
    )
    token = last_link(db, email, "verify")
    assert client.post("/api/auth/verify", json={"token": token}).json() == {"ok": True}
    return email


def next_code(secret: str) -> str:
    """Код следующего 30-секундного шага: текущий может быть уже израсходован."""
    return pyotp.TOTP(secret).at(time.time() + 30)


def test_full_cycle(client, db):
    email = fresh_email()

    # Регистрация; до подтверждения почты войти нельзя.
    r = client.post("/api/auth/register", json={"email": email.upper(), "password": PASSWORD})
    assert r.status_code == 201
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 403

    # Подтверждение; ссылка одноразовая.
    token = last_link(db, email, "verify")
    assert client.post("/api/auth/verify", json={"token": token}).status_code == 200
    assert client.post("/api/auth/verify", json={"token": token}).status_code == 400

    # Вход: cookie httpOnly, Secure, SameSite=Lax.
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 200 and r.json()["mfa_required"] is False
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    me = client.get("/api/auth/me").json()
    assert me["email"] == email and me["totp_enabled"] is False

    # Включение 2FA; секрет в базе только шифрованный.
    setup = client.post("/api/auth/2fa/setup").json()
    secret = setup["secret"]
    assert setup["otpauth_uri"].startswith("otpauth://totp/SUNSCRYPT")
    with db.connect() as c:
        enc = c.execute(
            text("SELECT totp_secret_enc FROM users WHERE email = :e"), {"e": email}
        ).scalar_one()
    assert secret.encode() not in bytes(enc)
    assert client.post("/api/auth/2fa/enable", json={"code": "000000"}).status_code == 400
    code = pyotp.TOTP(secret).now()
    assert client.post("/api/auth/2fa/enable", json={"code": code}).status_code == 200
    assert client.get("/api/auth/me").json()["totp_enabled"] is True

    # Выход → вход требует код; без кода закрытое недоступно.
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert r.json()["mfa_required"] is True
    assert client.get("/api/auth/logins").status_code == 401
    # Тот же код повторно не принимается.
    assert client.post("/api/auth/2fa/verify", json={"code": code}).status_code == 401
    assert client.post("/api/auth/2fa/verify", json={"code": next_code(secret)}).status_code == 200
    assert client.get("/api/auth/me").json()["mfa_passed"] is True

    # Журнал входов: есть и неудачные попытки.
    events = client.get("/api/auth/logins").json()
    kinds = {(e["event"], e["success"]) for e in events}
    assert ("login", True) in kinds and ("login", False) in kinds and ("2fa", False) in kinds

    # Сброс пароля: старые сессии закрываются, старый пароль не подходит.
    assert client.post("/api/auth/password/forgot", json={"email": email}).status_code == 200
    reset = last_link(db, email, "reset")
    new_password = "another long password"
    r = client.post("/api/auth/password/reset", json={"token": reset, "password": new_password})
    assert r.status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 401
    r = client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert r.status_code == 200 and r.json()["mfa_required"] is True


def test_register_does_not_reveal_existing_email(client, db):
    email = registered(client, db)
    r = client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    assert r.status_code == 201
    r = client.post("/api/auth/password/forgot", json={"email": fresh_email()})
    assert r.status_code == 200


def test_short_password_rejected(client):
    r = client.post("/api/auth/register", json={"email": fresh_email(), "password": "short"})
    assert r.status_code == 422


def test_foreign_origin_rejected(client, db):
    email = registered(client, db)
    r = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers={"origin": "https://evil.example"},
    )
    assert r.status_code == 403


def test_login_rate_limited(client, db):
    email = registered(client, db)
    codes = [
        client.post(
            "/api/auth/login", json={"email": email, "password": "wrong-password"}
        ).status_code
        for _ in range(9)
    ]
    assert codes[:8] == [401] * 8 and codes[8] == 429


def test_require_2fa_dependency(client, db):
    """Опасные действия — только с включённой 2FA (используется на этапе 3)."""
    import asyncio

    from fastapi import HTTPException

    from app.auth import require_2fa

    class U:
        totp_enabled_at = None

    class C:
        user = U()

    with pytest.raises(HTTPException) as e:
        asyncio.run(require_2fa(C()))  # type: ignore[arg-type]
    assert e.value.status_code == 403
