import pytest
from app.models import Event, EventMember, Photo, Gallery, GalleryPhoto
from app.auth import hash_pin

def test_user_registration_and_login(client, admin_headers, team_a_headers):
    """
    Test 1: Registration & Login (valid and invalid credentials)
    """
    # 1. Valid registration by admin -> 201 Created
    reg_resp = client.post(
        "/api/v1/auth/register",
        headers=admin_headers,
        json={"email": "photographer_new@lumen.ch", "password": "SecurePassword123!", "role": "team_member"}
    )
    assert reg_resp.status_code == 201
    assert reg_resp.json()["email"] == "photographer_new@lumen.ch"

    # 2. Login with valid credentials -> 200 OK + JWT Token
    login_valid = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer_new@lumen.ch", "password": "SecurePassword123!"}
    )
    assert login_valid.status_code == 200
    assert "access_token" in login_valid.json()

    # 3. Login with invalid password -> 401 Unauthorized
    login_invalid_pwd = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer_new@lumen.ch", "password": "WrongPassword99!"}
    )
    assert login_invalid_pwd.status_code == 401
    assert "invalid" in login_invalid_pwd.json()["detail"].lower()

    # 4. Login with non-existent email -> 401 Unauthorized
    login_invalid_email = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@lumen.ch", "password": "SecurePassword123!"}
    )
    assert login_invalid_email.status_code == 401


def test_role_based_authorization(client, admin_headers, team_a_headers):
    """
    Test 2: Role-based authorization.
    A team member gets 403 when calling admin-only endpoints:
    - create event (POST /events)
    - add team member (POST /events/{id}/members)
    - publish gallery (POST /galleries)
    """
    # 1. Team member attempts to create an event -> 403 Forbidden
    create_event_blocked = client.post(
        "/api/v1/events",
        headers=team_a_headers,
        json={"name": "Rogue Event"}
    )
    assert create_event_blocked.status_code == 403

    # Admin creates a legitimate event for testing
    admin_ev_resp = client.post(
        "/api/v1/events",
        headers=admin_headers,
        json={"name": "Admin Exhibition", "custom_id": "admin-exhibition"}
    )
    assert admin_ev_resp.status_code == 201
    ev_id = admin_ev_resp.json()["id"]

    # 2. Team member attempts to add a member to event -> 403 Forbidden
    add_member_blocked = client.post(
        f"/api/v1/events/{ev_id}/members",
        headers=team_a_headers,
        json={"email": "team_b@lumen.ch"}
    )
    assert add_member_blocked.status_code == 403

    # 3. Team member attempts to publish gallery -> 403 Forbidden
    publish_blocked = client.post(
        "/api/v1/galleries",
        headers=team_a_headers,
        json={"event_id": ev_id, "photo_ids": ["dummy-id"]}
    )
    assert publish_blocked.status_code == 403


def test_cross_event_access(client, admin_headers, team_a_headers, team_b_headers):
    """
    Test 3: Cross-event access control.
    A user not assigned to an event gets 403 when trying to access that event's data.
    """
    # Admin creates Event A and Event B
    ev_a = client.post("/api/v1/events", headers=admin_headers, json={"name": "Event A", "custom_id": "event-a"}).json()["id"]
    ev_b = client.post("/api/v1/events", headers=admin_headers, json={"name": "Event B", "custom_id": "event-b"}).json()["id"]

    # Assign Team A to Event A, assign Team B to Event B
    client.post(f"/api/v1/events/{ev_a}/members", headers=admin_headers, json={"email": "team_a@lumen.ch"})
    client.post(f"/api/v1/events/{ev_b}/members", headers=admin_headers, json={"email": "team_b@lumen.ch"})

    # Team A accesses Event A -> 200 OK
    assert client.get(f"/api/v1/events/{ev_a}", headers=team_a_headers).status_code == 200

    # Team A accesses Event B (unassigned) -> 403 Forbidden
    resp_cross_get = client.get(f"/api/v1/events/{ev_b}", headers=team_a_headers)
    assert resp_cross_get.status_code == 403

    # Team A attempts presigning photo for Event B -> 403 Forbidden
    resp_cross_presign = client.post(
        f"/api/v1/events/{ev_b}/photos/presign",
        headers=team_a_headers,
        json={"filename": "unauthorized.jpg", "file_size": 5000}
    )
    assert resp_cross_presign.status_code == 403

    # Team A attempts viewing photos for Event B -> 403 Forbidden
    resp_cross_photos = client.get(f"/api/v1/events/{ev_b}/photos", headers=team_a_headers)
    assert resp_cross_photos.status_code == 403


def test_gallery_publish_workflow_and_pin_verification(client, admin_headers, team_a_headers):
    """
    Test 4 & 5: Gallery publish workflow & PIN verification.
    - Admin can publish gallery, generating working PIN and slug.
    - Correct PIN grants access to published photos.
    - Incorrect PIN is rejected (401).
    - Unpublished gallery returns 404 even with correct PIN.
    """
    # 1. Setup Event and upload photo
    ev_id = client.post("/api/v1/events", headers=admin_headers, json={"name": "Publish Event", "custom_id": "pub-event"}).json()["id"]
    client.post(f"/api/v1/events/{ev_id}/members", headers=admin_headers, json={"email": "team_a@lumen.ch"})

    photo_id = client.post(
        f"/api/v1/events/{ev_id}/photos/confirm",
        headers=team_a_headers,
        json={"filename": "curated_photo.jpg", "storage_key": "events/pub-event/photo.jpg", "file_size": 1048576}
    ).json()["id"]

    # 2. Admin publishes gallery -> 201 Created with 6-digit PIN and share_slug
    pub_resp = client.post(
        "/api/v1/galleries",
        headers=admin_headers,
        json={"event_id": ev_id, "photo_ids": [photo_id], "share_slug": "pub-gallery-slug"}
    )
    assert pub_resp.status_code == 201
    gal_data = pub_resp.json()
    assert gal_data["share_slug"] == "pub-gallery-slug"
    assert gal_data["is_published"] is True
    generated_pin = gal_data["pin"]
    assert len(generated_pin) == 6

    # 3. Correct PIN grants access to published gallery -> 200 OK
    access_correct = client.get("/api/v1/gallery/pub-gallery-slug", headers={"X-Gallery-PIN": generated_pin})
    assert access_correct.status_code == 200
    assert len(access_correct.json()["photos"]) == 1
    assert access_correct.json()["photos"][0]["id"] == photo_id

    # 4. Incorrect PIN is rejected -> 401 Unauthorized
    access_wrong = client.get("/api/v1/gallery/pub-gallery-slug", headers={"X-Gallery-PIN": "000000"})
    assert access_wrong.status_code == 401

    # 5. Non-existent gallery returns 404
    access_404 = client.get("/api/v1/gallery/non-existent-slug", headers={"X-Gallery-PIN": generated_pin})
    assert access_404.status_code == 404
