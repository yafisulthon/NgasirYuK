from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserResponse
from app.dependencies import verify_password, create_access_token, get_current_user
from app.services.log_service import log_activity
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username, User.is_active == True).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Username atau password salah.")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    log_activity(
        db=db,
        user_id=user.id,
        action="login",
        description=f"User {user.username} login ke sistem.",
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
