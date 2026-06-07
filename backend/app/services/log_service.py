from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    description: str = None,
    ip_address: str = None,
):
    """Simpan activity log ke database."""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        description=description,
        ip_address=ip_address,
    )
    db.add(log)
    # Tidak di-commit di sini, ikut commit transaksi induk
