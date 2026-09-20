import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db
from app.models import User, Event, EventMember, Photo, Gallery, GalleryPhoto
from app.auth import hash_password, hash_pin, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_lumen.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_lumen.db"):
        try:
            os.remove("./test_lumen.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_user(db_session):
    user = db_session.query(User).filter(User.email == "test_admin@lumen.ch").first()
    if not user:
        user = User(
            id="usr-test-admin",
            email="test_admin@lumen.ch",
            password_hash=hash_password("AdminPass123!"),
            role="admin"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def team_user_a(db_session):
    user = db_session.query(User).filter(User.email == "team_a@lumen.ch").first()
    if not user:
        user = User(
            id="usr-team-a",
            email="team_a@lumen.ch",
            password_hash=hash_password("TeamPass123!"),
            role="team_member"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def team_user_b(db_session):
    user = db_session.query(User).filter(User.email == "team_b@lumen.ch").first()
    if not user:
        user = User(
            id="usr-team-b",
            email="team_b@lumen.ch",
            password_hash=hash_password("TeamPass123!"),
            role="team_member"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token({"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def team_a_headers(team_user_a):
    token = create_access_token({"sub": team_user_a.id, "email": team_user_a.email, "role": team_user_a.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def team_b_headers(team_user_b):
    token = create_access_token({"sub": team_user_b.id, "email": team_user_b.email, "role": team_user_b.role})
    return {"Authorization": f"Bearer {token}"}
