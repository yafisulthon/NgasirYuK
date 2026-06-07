from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.dependencies import get_current_user, owner_only
from app.dependencies import get_password_hash
from app.services.log_service import log_activity

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only),
):
    query = db.query(User)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%") | User.username.ilike(f"%{search}%"))
    return query.order_by(User.created_at.desc()).all()


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only),
):
    # Cek username unik
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan.")

    # Validasi role
    if body.role not in ("owner", "admin", "kasir"):
        raise HTTPException(status_code=400, detail="Role tidak valid. Pilih: owner, admin, kasir.")

    user = User(
        name=body.name,
        username=body.username,
        password=get_password_hash(body.password),
        role=body.role,
    )
    db.add(user)
    log_activity(db, current_user.id, "tambah_user", f"Tambah user: {body.username} ({body.role})")
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if body.name is not None:
        user.name = body.name
    if body.password is not None:
        user.password = get_password_hash(body.password)
    if body.role is not None:
        if body.role not in ("owner", "admin", "kasir"):
            raise HTTPException(status_code=400, detail="Role tidak valid.")
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    log_activity(db, current_user.id, "edit_user", f"Edit user ID: {user_id}")
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/toggle", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    if user.role == "owner":
        raise HTTPException(status_code=400, detail="Akun Owner tidak dapat dinonaktifkan.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menonaktifkan akun sendiri.")

    user.is_active = not user.is_active
    action = "aktifkan_user" if user.is_active else "nonaktifkan_user"
    log_activity(db, current_user.id, action, f"User {user.username} -> {'aktif' if user.is_active else 'nonaktif'}")
    db.commit()
    db.refresh(user)
    return user
